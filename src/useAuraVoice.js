import { useRef, useState, useCallback, useEffect } from "react";

const BACKEND_URL = (
  import.meta.env.VITE_AURA_VOICE_URL ?? "http://localhost:8080"
).replace(/\/$/, "");

/**
 * Hook that manages a pure WebRTC voice session with the backend.
 *
 * - Mic input goes via WebRTC audio track (browser's native AEC applies).
 * - Server's audio output arrives via WebRTC audio track (Opus encoded).
 *
 * Returns:
 *   status      — "idle" | "connecting" | "connected" | "error" | "busy"
 *   isMuted     — mic is disabled
 *   isSpeaking  — server is currently outputting audio
 *   connect()   — start a session
 *   disconnect()— tear everything down
 *   toggleMute()— flip mic on/off
 */
export function useAuraVoice() {
  const [status, setStatus] = useState("idle");
  const [isMuted, setIsMuted] = useState(false);
  const [isSpeaking, setIsSpeaking] = useState(false);

  const pcRef = useRef(null);
  const streamRef = useRef(null);
  const audioRef = useRef(null);
  const analyserRef = useRef(null);
  const speakingCheckRef = useRef(null);
  const connectingRef = useRef(false);

  const cleanup = useCallback(() => {
    if (speakingCheckRef.current) {
      cancelAnimationFrame(speakingCheckRef.current);
      speakingCheckRef.current = null;
    }

    if (audioRef.current) {
      audioRef.current.srcObject = null;
      audioRef.current = null;
    }

    if (analyserRef.current) {
      analyserRef.current = null;
    }

    if (pcRef.current) {
      pcRef.current.close();
      pcRef.current = null;
    }

    if (streamRef.current) {
      streamRef.current.getTracks().forEach((t) => t.stop());
      streamRef.current = null;
    }

    setIsSpeaking(false);
  }, []);

  const connect = useCallback(async () => {
    if (connectingRef.current || status === "connecting" || status === "connected") return;
    connectingRef.current = true;
    setStatus("connecting");

    try {
      // Get mic stream with AEC
      const stream = await navigator.mediaDevices.getUserMedia({
        audio: {
          echoCancellation: true,
          noiseSuppression: true,
          autoGainControl: true,
        },
      });
      streamRef.current = stream;

      // Fetch ICE config from backend
      let iceServers = [{ urls: "stun:stun.l.google.com:19302" }];
      try {
        const iceResp = await fetch(`${BACKEND_URL}/ice-config`);
        if (iceResp.ok) {
          const iceData = await iceResp.json();
          iceServers = iceData.iceServers;
        }
      } catch {
        // fallback to default STUN
      }

      const pc = new RTCPeerConnection({ iceServers });
      pcRef.current = pc;

      // Add mic track
      stream.getTracks().forEach((t) => pc.addTrack(t, stream));

      // Handle incoming audio track from server
      pc.ontrack = (event) => {
        console.log("Received track:", event.track.kind);
        if (event.track.kind === "audio") {
          // Create audio element to play the track
          const audio = new Audio();
          audio.srcObject = event.streams[0];
          audio.autoplay = true;
          audioRef.current = audio;

          // Set up analyser to detect when server is speaking
          try {
            const audioCtx = new AudioContext();
            const source = audioCtx.createMediaStreamSource(event.streams[0]);
            const analyser = audioCtx.createAnalyser();
            analyser.fftSize = 256;
            source.connect(analyser);
            analyserRef.current = analyser;

            // Check audio levels periodically
            const dataArray = new Uint8Array(analyser.frequencyBinCount);
            const checkSpeaking = () => {
              if (!analyserRef.current) return;
              analyser.getByteFrequencyData(dataArray);
              const avg = dataArray.reduce((a, b) => a + b, 0) / dataArray.length;
              setIsSpeaking(avg > 10);
              speakingCheckRef.current = requestAnimationFrame(checkSpeaking);
            };
            checkSpeaking();
          } catch {
            // Analyser setup failed, speaking detection won't work
          }
        }
      };

      // Connection state changes
      pc.onconnectionstatechange = () => {
        const state = pc.connectionState;
        console.log("Connection state:", state);
        if (state === "failed" || state === "closed") {
          cleanup();
          setStatus("idle");
        }
      };

      // Create offer and wait for ICE gathering
      const offer = await pc.createOffer();
      await pc.setLocalDescription(offer);

      if (pc.iceGatheringState !== "complete") {
        await new Promise((resolve) => {
          const timeout = setTimeout(resolve, 3000);
          const check = () => {
            if (pc.iceGatheringState === "complete") {
              clearTimeout(timeout);
              pc.removeEventListener("icegatheringstatechange", check);
              resolve();
            }
          };
          pc.addEventListener("icegatheringstatechange", check);
        });
      }

      // SDP exchange with backend
      const resp = await fetch(`${BACKEND_URL}/offer`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          sdp: pc.localDescription.sdp,
          type: pc.localDescription.type,
        }),
      });

      if (!resp.ok) {
        const err = await resp.json().catch(() => ({}));
        if (resp.status === 503) {
          throw new Error("max_sessions");
        }
        throw new Error("offer_failed");
      }

      const answer = await resp.json();
      await pc.setRemoteDescription(new RTCSessionDescription(answer));

      setStatus("connected");
    } catch (e) {
      console.error("Voice connect error:", e);
      const msg = String(e?.message || "");
      if (msg === "max_sessions") {
        setStatus("busy");
      } else {
        setStatus("error");
      }
      cleanup();
    } finally {
      connectingRef.current = false;
    }
  }, [status, cleanup]);

  const disconnect = useCallback(() => {
    cleanup();
    setStatus("idle");
    setIsMuted(false);
  }, [cleanup]);

  const toggleMute = useCallback(() => {
    if (!streamRef.current) return;
    const next = !isMuted;
    streamRef.current.getAudioTracks().forEach((t) => {
      t.enabled = !next;
    });
    setIsMuted(next);
  }, [isMuted]);

  // Cleanup on unmount
  useEffect(() => () => cleanup(), [cleanup]);

  return { status, isMuted, isSpeaking, connect, disconnect, toggleMute };
}
