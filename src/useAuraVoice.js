import { useRef, useState, useCallback, useEffect } from "react";

const BACKEND_URL = (
  import.meta.env.VITE_AURA_VOICE_URL ?? "http://localhost:8001"
).replace(/\/$/, "");

const OUTPUT_SAMPLE_RATE = 24000;
const CLEAR_SIGNAL = "__CLEAR__";

function pcm16ToFloat32(bytes) {
  const int16 = new Int16Array(bytes);
  const out = new Float32Array(int16.length);
  for (let i = 0; i < int16.length; i += 1) {
    out[i] = int16[i] / 0x8000;
  }
  return out;
}

/**
 * Hook that manages a hybrid WebRTC voice session with the Aura backend.
 *
 * - Mic input goes via WebRTC audio track (browser's native AEC applies).
 * - Aura's audio output arrives via DataChannel as raw PCM and is played
 *   through AudioContext for smooth, jitter-free scheduling.
 *
 * Returns:
 *   status      — "idle" | "connecting" | "connected" | "error" | "busy"
 *   isMuted     — mic is disabled
 *   isSpeaking  — Aura is currently outputting audio
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
  const playbackCtxRef = useRef(null);
  const activeSourcesRef = useRef(new Set());
  const nextPlaybackTimeRef = useRef(0);
  const speakingTimeoutRef = useRef(null);
  const connectingRef = useRef(false);

  const clearPlayback = useCallback(() => {
    if (speakingTimeoutRef.current) {
      clearTimeout(speakingTimeoutRef.current);
      speakingTimeoutRef.current = null;
    }

    for (const src of activeSourcesRef.current) {
      try {
        src.stop(0);
      } catch {
        // ignore
      }
    }
    activeSourcesRef.current.clear();

    if (playbackCtxRef.current) {
      nextPlaybackTimeRef.current = playbackCtxRef.current.currentTime + 0.01;
    } else {
      nextPlaybackTimeRef.current = 0;
    }
    setIsSpeaking(false);
  }, []);

  const schedulePlayback = useCallback((pcmChunk) => {
    if (!(pcmChunk instanceof ArrayBuffer) || pcmChunk.byteLength < 2) return;

    if (!playbackCtxRef.current) {
      playbackCtxRef.current = new AudioContext();
    }

    const ctx = playbackCtxRef.current;
    if (ctx.state === "suspended") {
      ctx.resume().catch(() => {});
    }

    const samples = pcm16ToFloat32(pcmChunk);
    if (!samples.length) return;

    const buffer = ctx.createBuffer(1, samples.length, OUTPUT_SAMPLE_RATE);
    buffer.copyToChannel(samples, 0);

    const src = ctx.createBufferSource();
    src.buffer = buffer;
    src.connect(ctx.destination);
    activeSourcesRef.current.add(src);
    src.onended = () => {
      activeSourcesRef.current.delete(src);
    };

    const now = ctx.currentTime;
    const startAt = Math.max(now + 0.02, nextPlaybackTimeRef.current || 0);
    src.start(startAt);
    nextPlaybackTimeRef.current = startAt + buffer.duration;

    setIsSpeaking(true);
    if (speakingTimeoutRef.current) {
      clearTimeout(speakingTimeoutRef.current);
    }
    speakingTimeoutRef.current = setTimeout(() => {
      setIsSpeaking(false);
      speakingTimeoutRef.current = null;
    }, 260);
  }, []);

  const cleanup = useCallback(() => {
    clearPlayback();

    if (playbackCtxRef.current) {
      playbackCtxRef.current.close().catch(() => {});
      playbackCtxRef.current = null;
    }

    if (pcRef.current) {
      pcRef.current.close();
      pcRef.current = null;
    }

    if (streamRef.current) {
      streamRef.current.getTracks().forEach((t) => t.stop());
      streamRef.current = null;
    }

    nextPlaybackTimeRef.current = 0;
    setIsSpeaking(false);
  }, [clearPlayback]);

  const connect = useCallback(async () => {
    if (connectingRef.current || status === "connecting" || status === "connected") return;
    connectingRef.current = true;
    setStatus("connecting");

    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        audio: {
          echoCancellation: true,
          noiseSuppression: true,
          autoGainControl: true,
        },
      });
      streamRef.current = stream;

      // Fetch ICE config (STUN + TURN) from backend
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

      // Add mic track — browser AEC applies automatically
      stream.getTracks().forEach((t) => pc.addTrack(t, stream));

      // Create DataChannel for receiving Aura's audio output.
      // Must be created by the offerer (client) so SCTP is negotiated in the SDP.
      const dc = pc.createDataChannel("audio", { ordered: true });
      dc.binaryType = "arraybuffer";
      dc.onmessage = (msg) => {
        if (msg.data instanceof ArrayBuffer) {
          if (msg.data.byteLength === CLEAR_SIGNAL.length) {
            const text = new TextDecoder().decode(msg.data);
            if (text === CLEAR_SIGNAL) {
              clearPlayback();
              return;
            }
          }
          schedulePlayback(msg.data);
        }
      };

      // Connection state changes
      pc.onconnectionstatechange = () => {
        const state = pc.connectionState;
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
        if (resp.status === 503 || err.error === "max_sessions_reached") {
          throw new Error("max_sessions");
        }
        throw new Error("offer_failed");
      }

      const answer = await resp.json();
      await pc.setRemoteDescription(new RTCSessionDescription(answer));

      setStatus("connected");
    } catch (e) {
      console.error("Aura voice connect error:", e);
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
  }, [status, cleanup, schedulePlayback, clearPlayback]);

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
