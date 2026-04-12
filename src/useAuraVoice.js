import { useRef, useState, useCallback, useEffect } from "react";

const BACKEND_URL =
  import.meta.env.VITE_AURA_VOICE_URL ?? "http://localhost:8001";

/**
 * Hook that manages a WebRTC voice session with the Aura backend.
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
  const audioRef = useRef(null);
  const audioCtxRef = useRef(null);
  const rafRef = useRef(null);

  // Persistent <audio> element that lives outside the React tree so playback
  // survives view transitions (voice-window ↔ voice-full).
  useEffect(() => {
    const el = document.createElement("audio");
    el.autoplay = true;
    audioRef.current = el;
    return () => {
      el.pause();
      el.srcObject = null;
    };
  }, []);

  const _cleanup = useCallback(() => {
    if (rafRef.current) {
      cancelAnimationFrame(rafRef.current);
      rafRef.current = null;
    }
    if (audioCtxRef.current) {
      audioCtxRef.current.close().catch(() => {});
      audioCtxRef.current = null;
    }
    if (streamRef.current) {
      streamRef.current.getTracks().forEach((t) => t.stop());
      streamRef.current = null;
    }
    if (pcRef.current) {
      pcRef.current.close();
      pcRef.current = null;
    }
    if (audioRef.current) {
      audioRef.current.pause();
      audioRef.current.srcObject = null;
    }
  }, []);

  const connectingRef = useRef(false);

  const connect = useCallback(async () => {
    if (connectingRef.current || status === "connecting" || status === "connected") return;
    connectingRef.current = true;
    setStatus("connecting");

    try {
      // 1 — mic
      const stream = await navigator.mediaDevices.getUserMedia({
        audio: {
          echoCancellation: true,
          noiseSuppression: true,
          autoGainControl: true,
          channelCount: 1,
        },
      });
      streamRef.current = stream;

      // 2 — peer connection
      const pc = new RTCPeerConnection({
        iceServers: [{ urls: "stun:stun.l.google.com:19302" }],
      });
      pcRef.current = pc;

      stream.getAudioTracks().forEach((t) => pc.addTrack(t, stream));

      // 3 — incoming audio from Aura
      pc.ontrack = (e) => {
        const remoteStream = e.streams[0];
        if (!remoteStream) return;

        if (audioRef.current) {
          audioRef.current.srcObject = remoteStream;
          audioRef.current.play().catch(() => {});
        }

        // speaking detection via AnalyserNode
        const ctx = new AudioContext();
        audioCtxRef.current = ctx;
        const source = ctx.createMediaStreamSource(remoteStream);
        const analyser = ctx.createAnalyser();
        analyser.fftSize = 512;
        source.connect(analyser);
        const bins = new Uint8Array(analyser.frequencyBinCount);

        const poll = () => {
          analyser.getByteFrequencyData(bins);
          const avg = bins.reduce((s, v) => s + v, 0) / bins.length;
          setIsSpeaking(avg > 5);
          rafRef.current = requestAnimationFrame(poll);
        };
        rafRef.current = requestAnimationFrame(poll);
      };

      // 4 — ICE / connection state
      pc.oniceconnectionstatechange = () => {
        const s = pc.iceConnectionState;
        if (s === "failed" || s === "disconnected") setStatus("error");
        if (s === "closed") setStatus("idle");
      };

      // 5 — create & send offer
      const offer = await pc.createOffer();
      await pc.setLocalDescription(offer);

      // wait for ICE gathering (max 3 s)
      await new Promise((resolve) => {
        if (pc.iceGatheringState === "complete") return resolve();
        pc.onicegatheringstatechange = () => {
          if (pc.iceGatheringState === "complete") resolve();
        };
        setTimeout(resolve, 3000);
      });

      const res = await fetch(`${BACKEND_URL}/offer`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          sdp: pc.localDescription.sdp,
          type: pc.localDescription.type,
        }),
      });

      if (!res.ok) {
        throw new Error(res.status === 503 ? "max_sessions" : "offer_rejected");
      }

      const answer = await res.json();
      await pc.setRemoteDescription(answer);

      setStatus("connected");
    } catch (e) {
      console.error("Aura voice connect error:", e);
      setStatus(e.message === "max_sessions" ? "busy" : "error");
      _cleanup();
    } finally {
      connectingRef.current = false;
    }
  }, [status, _cleanup]);

  const disconnect = useCallback(() => {
    _cleanup();
    setStatus("idle");
    setIsSpeaking(false);
    setIsMuted(false);
  }, [_cleanup]);

  const toggleMute = useCallback(() => {
    if (!streamRef.current) return;
    const next = !isMuted;
    streamRef.current.getAudioTracks().forEach((t) => {
      t.enabled = !next;
    });
    setIsMuted(next);
  }, [isMuted]);

  // cleanup on unmount
  useEffect(() => _cleanup, [_cleanup]);

  return { status, isMuted, isSpeaking, connect, disconnect, toggleMute };
}
