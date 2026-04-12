import { useRef, useState, useCallback, useEffect } from "react";

const BACKEND_HTTP_URL =
  import.meta.env.VITE_AURA_VOICE_URL ?? "http://localhost:8001";
const BACKEND_WS_URL =
  import.meta.env.VITE_AURA_VOICE_WS_URL ??
  buildWebSocketUrl(
    BACKEND_HTTP_URL,
    import.meta.env.VITE_AURA_VOICE_WS_PATH ?? "/ws/audio"
  );

const INPUT_SAMPLE_RATE = 16000;
const OUTPUT_SAMPLE_RATE = 24000;
const SCRIPT_PROCESSOR_BUFFER_SIZE = (() => {
  const raw = Number(import.meta.env.VITE_AURA_CAPTURE_BUFFER_SIZE ?? 256);
  const allowed = new Set([256, 512, 1024, 2048, 4096]);
  if (!Number.isFinite(raw)) return 256;
  return allowed.has(raw) ? raw : 256;
})();

const INPUT_CHUNK_MS = (() => {
  const raw = Number(import.meta.env.VITE_AURA_INPUT_CHUNK_MS ?? 20);
  if (!Number.isFinite(raw)) return 20;
  return Math.min(40, Math.max(20, raw));
})();

const CLEAR_GRACE_MS = (() => {
  const raw = Number(import.meta.env.VITE_AURA_CLEAR_GRACE_MS ?? 120);
  if (!Number.isFinite(raw)) return 120;
  return Math.max(0, raw);
})();

const LOCAL_BARGE_IN_RMS_THRESHOLD = (() => {
  const raw = Number(import.meta.env.VITE_AURA_LOCAL_BARGE_RMS ?? 0.016);
  if (!Number.isFinite(raw)) return 0.016;
  return Math.max(0, raw);
})();

const LOCAL_BARGE_IN_COOLDOWN_MS = (() => {
  const raw = Number(import.meta.env.VITE_AURA_LOCAL_BARGE_COOLDOWN_MS ?? 180);
  if (!Number.isFinite(raw)) return 180;
  return Math.max(0, raw);
})();

const SEND_CHUNK_SAMPLES = Math.max(
  1,
  Math.round((INPUT_SAMPLE_RATE * INPUT_CHUNK_MS) / 1000)
);

function normalizePath(path) {
  if (!path) return "/ws/audio";
  return path.startsWith("/") ? path : `/${path}`;
}

function buildWebSocketUrl(baseUrl, path) {
  const normalizedPath = normalizePath(path);
  if (baseUrl.startsWith("ws://") || baseUrl.startsWith("wss://")) {
    return `${baseUrl.replace(/\/$/, "")}${normalizedPath}`;
  }
  if (baseUrl.startsWith("http://") || baseUrl.startsWith("https://")) {
    return `${baseUrl.replace(/^http/, "ws").replace(/\/$/, "")}${normalizedPath}`;
  }
  return `ws://${baseUrl.replace(/\/$/, "")}${normalizedPath}`;
}

function downsampleToRate(input, inputRate, outputRate) {
  if (outputRate >= inputRate) return input;
  const ratio = inputRate / outputRate;
  const outputLength = Math.round(input.length / ratio);
  const output = new Float32Array(outputLength);
  let offsetResult = 0;
  let offsetBuffer = 0;

  while (offsetResult < outputLength) {
    const nextOffsetBuffer = Math.round((offsetResult + 1) * ratio);
    let accum = 0;
    let count = 0;
    for (let i = offsetBuffer; i < nextOffsetBuffer && i < input.length; i += 1) {
      accum += input[i];
      count += 1;
    }
    output[offsetResult] = count > 0 ? accum / count : 0;
    offsetResult += 1;
    offsetBuffer = nextOffsetBuffer;
  }

  return output;
}

function floatTo16BitPCM(floatBuffer) {
  const buffer = new ArrayBuffer(floatBuffer.length * 2);
  const view = new DataView(buffer);
  for (let i = 0; i < floatBuffer.length; i += 1) {
    const sample = Math.max(-1, Math.min(1, floatBuffer[i]));
    view.setInt16(i * 2, sample < 0 ? sample * 0x8000 : sample * 0x7fff, true);
  }
  return buffer;
}

function pcm16ToFloat32(bytes) {
  const int16 = new Int16Array(bytes);
  const out = new Float32Array(int16.length);
  for (let i = 0; i < int16.length; i += 1) {
    out[i] = int16[i] / 0x8000;
  }
  return out;
}

function computeRms(samples) {
  if (!samples.length) return 0;
  let sumSq = 0;
  for (let i = 0; i < samples.length; i += 1) {
    const v = samples[i];
    sumSq += v * v;
  }
  return Math.sqrt(sumSq / samples.length);
}

/**
 * Hook that manages a WebSocket voice session with the Aura backend.
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

  const wsRef = useRef(null);
  const streamRef = useRef(null);
  const captureCtxRef = useRef(null);
  const playbackCtxRef = useRef(null);
  const playbackDestRef = useRef(null);
  const micSourceRef = useRef(null);
  const processorRef = useRef(null);
  const processorSinkRef = useRef(null);
  const activeSourcesRef = useRef(new Set());
  const statusRef = useRef("idle");
  const isMutedRef = useRef(false);
  const isSpeakingRef = useRef(false);
  const isDisconnectingRef = useRef(false);
  const nextPlaybackTimeRef = useRef(0);
  const pingRef = useRef(null);
  const speakingTimeoutRef = useRef(null);
  const pendingMicSamplesRef = useRef(new Float32Array(0));
  const dropIncomingAudioUntilRef = useRef(0);
  const lastLocalBargeInAtRef = useRef(0);

  useEffect(() => {
    statusRef.current = status;
  }, [status]);

  useEffect(() => {
    isMutedRef.current = isMuted;
  }, [isMuted]);

  useEffect(() => {
    isSpeakingRef.current = isSpeaking;
  }, [isSpeaking]);

  const clearPlayback = useCallback(() => {
    if (speakingTimeoutRef.current) {
      clearTimeout(speakingTimeoutRef.current);
      speakingTimeoutRef.current = null;
    }

    for (const src of activeSourcesRef.current) {
      try {
        src.stop(0);
      } catch {
        // ignore stop errors
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

  const _cleanup = useCallback((closeSocket = true) => {
    clearPlayback();

    if (pingRef.current) {
      clearInterval(pingRef.current);
      pingRef.current = null;
    }

    if (processorRef.current) {
      processorRef.current.onaudioprocess = null;
      processorRef.current.disconnect();
      processorRef.current = null;
    }

    if (processorSinkRef.current) {
      processorSinkRef.current.disconnect();
      processorSinkRef.current = null;
    }

    if (micSourceRef.current) {
      micSourceRef.current.disconnect();
      micSourceRef.current = null;
    }

    if (playbackDestRef.current) {
      playbackDestRef.current.disconnect();
      playbackDestRef.current = null;
    }

    // playbackCtxRef now shares the same context as captureCtxRef,
    // so close once and null both.
    const ctxToClose = captureCtxRef.current || playbackCtxRef.current;
    if (ctxToClose) {
      ctxToClose.close().catch(() => {});
    }
    captureCtxRef.current = null;
    playbackCtxRef.current = null;

    if (closeSocket && wsRef.current) {
      const ws = wsRef.current;
      wsRef.current = null;
      try {
        if (ws.readyState === WebSocket.OPEN || ws.readyState === WebSocket.CONNECTING) {
          ws.close(1000, "client_disconnect");
        }
      } catch {
        // noop
      }
    } else if (!closeSocket) {
      wsRef.current = null;
    }

    if (streamRef.current) {
      streamRef.current.getTracks().forEach((t) => t.stop());
      streamRef.current = null;
    }

    pendingMicSamplesRef.current = new Float32Array(0);
    dropIncomingAudioUntilRef.current = 0;
    lastLocalBargeInAtRef.current = 0;
    nextPlaybackTimeRef.current = 0;
  }, [clearPlayback]);

  const schedulePlayback = useCallback((pcmChunk) => {
    if (!(pcmChunk instanceof ArrayBuffer) || pcmChunk.byteLength < 2) return;

    if (performance.now() < dropIncomingAudioUntilRef.current) {
      return;
    }

    const ctx = playbackCtxRef.current || captureCtxRef.current;
    if (!ctx) return;
    if (ctx.state === "suspended") {
      ctx.resume().catch(() => {});
    }

    const dest = playbackDestRef.current || ctx.destination;

    const samples = pcm16ToFloat32(pcmChunk);
    if (!samples.length) return;

    const buffer = ctx.createBuffer(1, samples.length, OUTPUT_SAMPLE_RATE);
    buffer.copyToChannel(samples, 0);

    const src = ctx.createBufferSource();
    src.buffer = buffer;
    src.connect(dest);
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

  const connectingRef = useRef(false);

  const connect = useCallback(async () => {
    if (connectingRef.current || status === "connecting" || status === "connected") return;
    connectingRef.current = true;
    isDisconnectingRef.current = false;
    setStatus("connecting");

    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        audio: {
          echoCancellation: true,
          noiseSuppression: true,
          autoGainControl: true,
          channelCount: 1,
        },
      });
      streamRef.current = stream;

      // Use a single AudioContext at the device's native sample rate so the
      // browser AEC can correlate playback with mic input.  Mic audio is
      // downsampled in software before sending to the backend.
      const captureCtx = new AudioContext();
      captureCtxRef.current = captureCtx;
      playbackCtxRef.current = captureCtx;
      if (captureCtx.state === "suspended") {
        await captureCtx.resume();
      }

      // Route playback through a GainNode so the browser's AEC sees it as
      // the reference signal on the same context as the mic.
      const playbackDest = captureCtx.createGain();
      playbackDest.gain.value = 1;
      playbackDest.connect(captureCtx.destination);
      playbackDestRef.current = playbackDest;

      const micSource = captureCtx.createMediaStreamSource(stream);
      micSourceRef.current = micSource;

      const processor = captureCtx.createScriptProcessor(SCRIPT_PROCESSOR_BUFFER_SIZE, 1, 1);
      processorRef.current = processor;
      const processorSink = captureCtx.createGain();
      processorSink.gain.value = 0;
      processorSinkRef.current = processorSink;

      const ws = new WebSocket(BACKEND_WS_URL);
      ws.binaryType = "arraybuffer";
      wsRef.current = ws;

      ws.onmessage = async (event) => {
        if (typeof event.data === "string") {
          const command = event.data.trim().toLowerCase();
          if (command === "__clear__") {
            dropIncomingAudioUntilRef.current = performance.now() + CLEAR_GRACE_MS;
            clearPlayback();
          }
          return;
        }

        if (event.data instanceof ArrayBuffer) {
          schedulePlayback(event.data);
          return;
        }

        if (event.data && typeof event.data.arrayBuffer === "function") {
          try {
            const arr = await event.data.arrayBuffer();
            schedulePlayback(arr);
          } catch {
            // ignore blob decode failures
          }
        }
      };

      ws.onclose = (event) => {
        const closedByClient = isDisconnectingRef.current;
        _cleanup(false);

        if (closedByClient) {
          setStatus("idle");
          return;
        }

        if (event.code === 4403) {
          setStatus("busy");
        } else if (statusRef.current === "connecting") {
          setStatus("error");
        } else {
          setStatus("idle");
        }
      };

      ws.onerror = () => {
        if (statusRef.current === "connecting") {
          setStatus("error");
        }
      };

      await new Promise((resolve, reject) => {
        const timeout = setTimeout(() => reject(new Error("ws_connect_timeout")), 7000);

        const onOpen = () => {
          clearTimeout(timeout);
          resolve();
        };

        const onError = () => {
          clearTimeout(timeout);
          reject(new Error("ws_connect_failed"));
        };

        const onClose = (event) => {
          clearTimeout(timeout);
          if (event.code === 4403) {
            reject(new Error("max_sessions"));
          } else {
            reject(new Error("ws_closed_during_connect"));
          }
        };

        ws.addEventListener("open", onOpen, { once: true });
        ws.addEventListener("error", onError, { once: true });
        ws.addEventListener("close", onClose, { once: true });
      });

      if (ws.readyState !== WebSocket.OPEN) {
        throw new Error("ws_connect_failed");
      }

      processor.onaudioprocess = (event) => {
        const currentWs = wsRef.current;
        if (!currentWs || currentWs.readyState !== WebSocket.OPEN) {
          pendingMicSamplesRef.current = new Float32Array(0);
          return;
        }
        if (isMutedRef.current) {
          pendingMicSamplesRef.current = new Float32Array(0);
          return;
        }

        const input = event.inputBuffer.getChannelData(0);
        const downsampled = downsampleToRate(
          input,
          captureCtx.sampleRate,
          INPUT_SAMPLE_RATE
        );
        if (!downsampled.length) return;

        if (isSpeakingRef.current) {
          const nowMs = performance.now();
          if (nowMs - lastLocalBargeInAtRef.current >= LOCAL_BARGE_IN_COOLDOWN_MS) {
            const rms = computeRms(downsampled);
            if (rms >= LOCAL_BARGE_IN_RMS_THRESHOLD) {
              lastLocalBargeInAtRef.current = nowMs;
              dropIncomingAudioUntilRef.current = nowMs + CLEAR_GRACE_MS;
              clearPlayback();
              try {
                currentWs.send("__barge_in__");
              } catch {
                // ignore control-send errors
              }
            }
          }
        }

        const pending = pendingMicSamplesRef.current;
        const merged = new Float32Array(pending.length + downsampled.length);
        merged.set(pending, 0);
        merged.set(downsampled, pending.length);

        let offset = 0;
        while (offset + SEND_CHUNK_SAMPLES <= merged.length) {
          if (currentWs.readyState !== WebSocket.OPEN) break;
          const chunk = merged.subarray(offset, offset + SEND_CHUNK_SAMPLES);
          currentWs.send(floatTo16BitPCM(chunk));
          offset += SEND_CHUNK_SAMPLES;
        }

        pendingMicSamplesRef.current = merged.slice(offset);
      };

      micSource.connect(processor);
      processor.connect(processorSink);
      processorSink.connect(captureCtx.destination);

      pingRef.current = setInterval(() => {
        const currentWs = wsRef.current;
        if (!currentWs || currentWs.readyState !== WebSocket.OPEN) return;
        try {
          currentWs.send("ping");
        } catch {
          // ignore heartbeat errors
        }
      }, 15000);

      setStatus("connected");
    } catch (e) {
      console.error("Aura voice connect error:", e);
      const msg = String(e?.message || "");
      if (msg === "max_sessions") {
        setStatus("busy");
      } else {
        setStatus("error");
      }
      _cleanup(true);
    } finally {
      connectingRef.current = false;
    }
  }, [status, _cleanup, schedulePlayback, clearPlayback]);

  const disconnect = useCallback(() => {
    isDisconnectingRef.current = true;
    _cleanup(true);
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
  useEffect(() => () => _cleanup(true), [_cleanup]);

  return { status, isMuted, isSpeaking, connect, disconnect, toggleMute };
}
