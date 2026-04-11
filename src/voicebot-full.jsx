import { useRef, useEffect, useState } from "react";

function Waveform({ active }) {
  const canvasRef = useRef(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    const dpr = window.devicePixelRatio || 1;
    const W = 600, H = 120;
    canvas.width = W * dpr;
    canvas.height = H * dpr;
    canvas.style.width = "100%";
    canvas.style.height = H + "px";
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);

    let frame = 0, rafId;
    const draw = () => {
      ctx.clearRect(0, 0, W, H);
      const bars = 56, gap = W / bars;
      for (let i = 0; i < bars; i++) {
        const t = frame * 0.035 + i * 0.26;
        const dist = Math.abs(i - bars / 2) / (bars / 2);
        const env = 1 - Math.pow(dist, 1.2) * 0.62;
        const amp = active ? 1 : 0.12;
        const h = ((Math.sin(t) * 0.5 + 0.5) * 70 + 10) * env * amp;
        const alpha = active ? (0.28 + (Math.sin(t) * 0.5 + 0.5) * 0.58) : 0.1;
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

const MOCK_TRANSCRIPT = [
  { role: "user", text: "Cuéntame sobre la experiencia de Ayrgthon." },
  { role: "bot",  text: "Ayrgthon es Senior AI Engineer y Data Scientist en Indra Group. Construyó agentes de voz y texto para automatización de help desk, reduciendo costos por llamada de $1.00 a $0.07 con Graph RAG y Gemini Live." },
  { role: "user", text: "¿Qué proyectos destacan?" },
  { role: "bot",  text: "Destacan: un agente móvil autónomo con MCPs, pipelines multimodales de salud en Azure, modelos de visión por computador para detección de fauna en Cerrejón, y Aura — asistente personal con memoria a largo plazo basada en Graph RAG." },
  { role: "user", text: "¿Qué estudió?" },
  { role: "bot",  text: "Doble titulación en Matemáticas y Ciencia de Datos en Universidad del Norte, Barranquilla. Fue presidente del IEEE CIS y ganó competencias como Huawei ICT Colombia 2025 y Hackathon BarranquiIA 2024." },
  { role: "user", text: "¿Cómo puedo contactarlo?" },
  { role: "bot",  text: "Por email en ayrgthons@gmail.com, LinkedIn o GitHub. Está abierto a oportunidades en AI Engineering, voice agents y sistemas RAG en producción." },
];

export default function VoicebotFull({ onBack, onMinimize }) {
  const [active, setActive] = useState(true);
  const [muted, setMuted] = useState(false);
  const [speaking, setSpeaking] = useState(false);
  const transcriptRef = useRef(null);

  useEffect(() => {
    if (transcriptRef.current) {
      transcriptRef.current.scrollTop = transcriptRef.current.scrollHeight;
    }
  }, []);

  // simulate aura speaking state alternating
  useEffect(() => {
    if (!active) return;
    const id = setInterval(() => setSpeaking(s => !s), 3200);
    return () => clearInterval(id);
  }, [active]);

  const statusText = !active
    ? "Sesión pausada"
    : muted
    ? "Micrófono silenciado"
    : speaking
    ? "Aura está hablando..."
    : "Aura está escuchando...";

  return (
    <div style={{ height: "100vh", width: "100vw", background: "linear-gradient(160deg, #080810 0%, #0d1117 50%, #080c10 100%)", display: "flex", flexDirection: "column", fontFamily: "'SF Pro Display', -apple-system, sans-serif", overflow: "hidden" }}>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=JetBrains+Mono:wght@400;500&family=Sora:wght@300;400;500;600&display=swap');
        * { margin: 0; padding: 0; box-sizing: border-box; }
        @keyframes vfpulse  { 0%,100% { opacity: 0.5; transform: scale(1);    } 50% { opacity: 1;   transform: scale(1.05); } }
        @keyframes vfglow   { 0%,100% { box-shadow: 0 0 30px rgba(90,200,250,0.12); } 50% { box-shadow: 0 0 60px rgba(90,200,250,0.28); } }
        @keyframes vffadeIn { from { opacity: 0; transform: translateY(6px); } to { opacity: 1; transform: translateY(0); } }
        ::-webkit-scrollbar { width: 4px; }
        ::-webkit-scrollbar-thumb { background: rgba(255,255,255,0.07); border-radius: 2px; }
      `}</style>

      {/* title bar */}
      <div style={{ display: "flex", alignItems: "center", padding: "13px 20px", borderBottom: "1px solid rgba(255,255,255,0.05)", background: "rgba(6,6,10,0.7)", backdropFilter: "blur(20px)", flexShrink: 0 }}>
        <div style={{ display: "flex", gap: 7 }}>
          <span onClick={onBack}     style={{ width: 12, height: 12, borderRadius: "50%", background: "#ff5f57", cursor: "pointer" }} title="Cerrar" />
          <span onClick={onMinimize} style={{ width: 12, height: 12, borderRadius: "50%", background: "#febc2e", cursor: "pointer" }} title="Ventana" />
          <span onClick={onMinimize} style={{ width: 12, height: 12, borderRadius: "50%", background: "#28c840", cursor: "pointer" }} title="Ventana" />
        </div>
        <div style={{ flex: 1, textAlign: "center" }}>
          <span style={{ fontSize: 12, color: "rgba(255,255,255,0.28)", fontFamily: "'JetBrains Mono', monospace", letterSpacing: 0.5 }}>
            aura-assistant — voice-bot
          </span>
        </div>
        <div style={{ display: "flex", alignItems: "center", gap: 6, width: 80, justifyContent: "flex-end" }}>
          <span style={{ width: 6, height: 6, borderRadius: "50%", background: active ? "#28c840" : "#febc2e", animation: active ? "vfpulse 2s infinite" : "none" }} />
          <span style={{ fontSize: 10, color: "rgba(255,255,255,0.22)", fontFamily: "'JetBrains Mono', monospace" }}>
            {active ? "live" : "idle"}
          </span>
        </div>
      </div>

      {/* call area */}
      <div style={{ flex: "0 0 auto", display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", padding: "48px 40px 36px", gap: 32, borderBottom: "1px solid rgba(255,255,255,0.04)", background: "radial-gradient(ellipse at 50% 0%, rgba(90,200,250,0.04) 0%, transparent 65%)" }}>

        {/* avatar */}
        <div style={{ position: "relative" }}>
          <div style={{ width: 96, height: 96, borderRadius: "50%", background: "linear-gradient(135deg, rgba(90,200,250,0.15), rgba(168,85,247,0.1))", border: "1.5px solid rgba(90,200,250,0.3)", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 40, animation: active && !muted ? "vfglow 2.4s ease infinite" : "none" }}>
            🎙️
          </div>
          {active && !muted && (
            <div style={{ position: "absolute", inset: -8, borderRadius: "50%", border: "1px solid rgba(90,200,250,0.12)", animation: "vfpulse 2s ease infinite" }} />
          )}
        </div>

        {/* status */}
        <div style={{ textAlign: "center" }}>
          <div style={{ fontSize: 18, fontWeight: 500, color: "rgba(255,255,255,0.82)", marginBottom: 6 }}>
            {statusText}
          </div>
          <div style={{ fontSize: 11, color: "rgba(255,255,255,0.28)", fontFamily: "'JetBrains Mono', monospace" }}>
            gemini-2.5-flash · ~230ms latency
          </div>
        </div>

        {/* waveform */}
        <div style={{ width: "100%", maxWidth: 560 }}>
          <Waveform active={active && !muted} />
        </div>

        {/* controls */}
        <div style={{ display: "flex", alignItems: "center", gap: 16 }}>
          <button
            onClick={() => setMuted(m => !m)}
            style={{ width: 52, height: 52, borderRadius: "50%", border: `1px solid ${muted ? "rgba(255,95,87,0.4)" : "rgba(255,255,255,0.12)"}`, background: muted ? "rgba(255,95,87,0.14)" : "rgba(255,255,255,0.05)", color: muted ? "#ff5f57" : "rgba(255,255,255,0.55)", fontSize: 18, cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center", transition: "all 0.2s" }}
            title={muted ? "Activar micrófono" : "Silenciar"}
          >
            {muted ? "🔇" : "🎤"}
          </button>

          <button
            onClick={() => setActive(a => !a)}
            style={{ width: 52, height: 52, borderRadius: "50%", border: "1px solid rgba(255,255,255,0.12)", background: "rgba(255,255,255,0.05)", color: "rgba(255,255,255,0.55)", fontSize: 18, cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center", transition: "all 0.2s" }}
            title={active ? "Pausar" : "Reanudar"}
          >
            {active ? "⏸" : "▶️"}
          </button>

          <button
            onClick={onBack}
            style={{ width: 64, height: 64, borderRadius: "50%", border: "1px solid rgba(255,95,87,0.35)", background: "rgba(255,95,87,0.14)", color: "#ff5f57", fontSize: 22, cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center", transition: "all 0.2s", boxShadow: "0 0 24px rgba(255,95,87,0.1)" }}
            title="Colgar"
          >
            📵
          </button>
        </div>
      </div>

      {/* transcript */}
      <div ref={transcriptRef} style={{ flex: 1, overflowY: "auto", padding: "20px 40px 24px", display: "flex", flexDirection: "column", gap: 12 }}>
        <div style={{ fontSize: 10, color: "rgba(255,255,255,0.18)", fontFamily: "'JetBrains Mono', monospace", marginBottom: 4, letterSpacing: 0.5 }}>
          transcripción · mock demo
        </div>
        {MOCK_TRANSCRIPT.map((line, i) => (
          <div
            key={i}
            style={{ alignSelf: line.role === "user" ? "flex-end" : "flex-start", maxWidth: "68%", padding: "10px 14px", borderRadius: line.role === "user" ? "14px 14px 4px 14px" : "14px 14px 14px 4px", background: line.role === "user" ? "rgba(90,200,250,0.09)" : "rgba(255,255,255,0.04)", border: `1px solid ${line.role === "user" ? "rgba(90,200,250,0.14)" : "rgba(255,255,255,0.06)"}`, fontSize: 13, lineHeight: 1.6, color: line.role === "user" ? "#a9ddf5" : "rgba(255,255,255,0.65)", animation: `vffadeIn 0.3s ease ${i * 0.05}s both` }}
          >
            {line.text}
          </div>
        ))}
      </div>
    </div>
  );
}
