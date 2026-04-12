import { useRef, useEffect } from "react";

function Waveform({ active }) {
  const canvasRef = useRef(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    const dpr = window.devicePixelRatio || 1;
    const W = 480, H = 90;
    canvas.width = W * dpr;
    canvas.height = H * dpr;
    canvas.style.width = "100%";
    canvas.style.height = H + "px";
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);

    let frame = 0, rafId;
    const draw = () => {
      ctx.clearRect(0, 0, W, H);
      const bars = 48, gap = W / bars;
      for (let i = 0; i < bars; i++) {
        const t = frame * 0.04 + i * 0.28;
        const dist = Math.abs(i - bars / 2) / (bars / 2);
        const env = 1 - Math.pow(dist, 1.3) * 0.65;
        const amp = active ? 1 : 0.18;
        const h = ((Math.sin(t) * 0.5 + 0.5) * 52 + 8) * env * amp;
        const alpha = active ? (0.3 + (Math.sin(t) * 0.5 + 0.5) * 0.55) : 0.15;
        ctx.fillStyle = `rgba(90,200,250,${alpha})`;
        ctx.beginPath();
        ctx.roundRect(i * gap + 2, H / 2 - h / 2, Math.max(gap - 4, 2), h, 2);
        ctx.fill();
      }
      frame++;
      rafId = requestAnimationFrame(draw);
    };
    rafId = requestAnimationFrame(draw);
    return () => cancelAnimationFrame(rafId);
  }, [active]);

  return <canvas ref={canvasRef} />;
}

export default function VoicebotWindow({ voiceApi, onBack, onOpenFull }) {
  const { status, isMuted, isSpeaking, connect, disconnect, toggleMute } = voiceApi;
  const active = status === "connected";
  const connecting = status === "connecting";

  // auto-connect on mount
  useEffect(() => {
    if (status === "idle") connect();
  }, []);

  const handleHangup = () => {
    disconnect();
    onBack();
  };

  const statusLabel = connecting
    ? "Conectando..."
    : status === "error"
    ? "Error de conexión"
    : status === "busy"
    ? "Servidor ocupado"
    : !active
    ? "Desconectado"
    : isMuted
    ? "Micrófono silenciado"
    : isSpeaking
    ? "Aura está hablando..."
    : "Aura está escuchando...";

  return (
    <div style={{ height: "100vh", width: "100vw", background: "linear-gradient(145deg, #0a0a0c 0%, #0d1117 60%, #0a0c10 100%)", display: "flex", alignItems: "center", justifyContent: "center", fontFamily: "'SF Pro Display', -apple-system, sans-serif" }}>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=JetBrains+Mono:wght@400;500&family=Sora:wght@300;400;500;600&display=swap');
        * { margin: 0; padding: 0; box-sizing: border-box; }
        @keyframes vpulse { 0%,100% { opacity: 0.45; transform: scale(1); } 50% { opacity: 1; transform: scale(1.06); } }
        ::-webkit-scrollbar { width: 4px; }
        ::-webkit-scrollbar-thumb { background: rgba(255,255,255,0.07); border-radius: 2px; }
      `}</style>

      <div style={{ width: "100%", maxWidth: 520, height: "82vh", maxHeight: 660, background: "rgba(14,14,18,0.94)", borderRadius: 14, border: "1px solid rgba(255,255,255,0.07)", backdropFilter: "blur(40px)", boxShadow: "0 24px 80px rgba(0,0,0,0.65), inset 0 1px 0 rgba(255,255,255,0.05)", display: "flex", flexDirection: "column", overflow: "hidden" }}>

        {/* title bar */}
        <div style={{ display: "flex", alignItems: "center", padding: "12px 16px", borderBottom: "1px solid rgba(255,255,255,0.06)", background: "rgba(255,255,255,0.02)", flexShrink: 0 }}>
          <div style={{ display: "flex", gap: 6 }}>
            <span onClick={handleHangup} style={{ width: 12, height: 12, borderRadius: "50%", background: "#ff5f57", cursor: "pointer" }} title="Cerrar" />
            <span onClick={onBack}       style={{ width: 12, height: 12, borderRadius: "50%", background: "#febc2e", cursor: "pointer" }} title="Minimizar" />
            <span onClick={onOpenFull}   style={{ width: 12, height: 12, borderRadius: "50%", background: "#28c840", cursor: "pointer" }} title="Fullscreen" />
          </div>
          <div style={{ flex: 1, textAlign: "center" }}>
            <span style={{ fontSize: 12, color: "rgba(255,255,255,0.3)", fontFamily: "'JetBrains Mono', monospace", letterSpacing: 0.5 }}>
              aura-assistant — voice-bot
            </span>
          </div>
          <div style={{ display: "flex", alignItems: "center", gap: 5, width: 60, justifyContent: "flex-end" }}>
            <span style={{ width: 6, height: 6, borderRadius: "50%", background: active ? "#28c840" : connecting ? "#febc2e" : "#ff5f57", animation: active ? "vpulse 2s infinite" : "none" }} />
            <span style={{ fontSize: 10, color: "rgba(255,255,255,0.25)", fontFamily: "'JetBrains Mono', monospace" }}>{active ? "live" : connecting ? "init" : "off"}</span>
          </div>
        </div>

        {/* waveform + status */}
        <div style={{ flex: 1, padding: "28px 24px 20px", display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", gap: 20, background: "rgba(0,0,0,0.2)" }}>
          <Waveform active={active && (isSpeaking || !isMuted)} />

          {/* avatar + status */}
          <div style={{ display: "flex", alignItems: "center", gap: 14 }}>
            <div style={{ width: 52, height: 52, borderRadius: "50%", background: "rgba(90,200,250,0.1)", border: `1.5px solid ${active ? "rgba(90,200,250,0.4)" : "rgba(255,255,255,0.1)"}`, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 22, boxShadow: active ? "0 0 28px rgba(90,200,250,0.15)" : "none", animation: active ? "vpulse 2.4s ease infinite" : "none" }}>
              🎙️
            </div>
            <div>
              <div style={{ fontSize: 14, fontWeight: 500, color: "rgba(255,255,255,0.75)" }}>
                {statusLabel}
              </div>
              <div style={{ fontSize: 11, color: "rgba(255,255,255,0.28)", marginTop: 2, fontFamily: "'JetBrains Mono', monospace" }}>
                gemini-2.5-flash · WebSocket
              </div>
            </div>
          </div>

          {/* controls */}
          <div style={{ display: "flex", gap: 12 }}>
            <button
              onClick={toggleMute}
              disabled={!active}
              style={{ width: 42, height: 42, borderRadius: "50%", border: `1px solid ${isMuted ? "rgba(255,95,87,0.4)" : "rgba(255,255,255,0.1)"}`, background: isMuted ? "rgba(255,95,87,0.12)" : "rgba(255,255,255,0.05)", color: isMuted ? "#ff5f57" : "rgba(255,255,255,0.5)", fontSize: 16, cursor: active ? "pointer" : "default", opacity: active ? 1 : 0.4, display: "flex", alignItems: "center", justifyContent: "center" }}
              title={isMuted ? "Activar mic" : "Silenciar"}
            >
              {isMuted ? "🔇" : "🎤"}
            </button>

            {!active && status !== "connecting" ? (
              <button
                onClick={connect}
                style={{ width: 42, height: 42, borderRadius: "50%", border: "1px solid rgba(40,200,64,0.3)", background: "rgba(40,200,64,0.1)", color: "#28c840", fontSize: 16, cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center" }}
                title="Conectar"
              >
                📞
              </button>
            ) : (
              <button
                onClick={handleHangup}
                style={{ width: 42, height: 42, borderRadius: "50%", border: "1px solid rgba(255,95,87,0.25)", background: "rgba(255,95,87,0.1)", color: "#ff5f57", fontSize: 16, cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center" }}
                title="Colgar"
              >
                📵
              </button>
            )}
          </div>
        </div>

        <div style={{ padding: "8px 18px 12px", borderTop: "1px solid rgba(255,255,255,0.04)", textAlign: "center" }}>
          <span style={{ fontSize: 10, color: "rgba(255,255,255,0.15)", fontFamily: "'JetBrains Mono', monospace" }}>
            aura voice · real-time AI assistant
          </span>
        </div>
      </div>
    </div>
  );
}
