import { useState, useEffect, useRef } from "react";

const SECTIONS = ["home", "projects", "experience", "contact"];

const PROJECTS = [
  {
    id: "chatbot-rag",
    title: "Personal Assistant (Aura)",
    desc: "AI assistant with Graph RAG-based long-term memory, multi-platform MCP integrations, and voice + text agents for productivity and knowledge management.",
    tags: ["Graph RAG", "LangChain", "MCPs", "Python"],
    icon: "💬",
    status: "live",
    action: "Try it",
  },
  {
    id: "voicebot-aura",
    title: "Voice AI Agent",
    desc: "Production voicebot on Gemini Live that reduced help desk call duration from 15 min to 2–3 min and cost per call from $1.00 to $0.07 via context window optimization and Graph RAG.",
    tags: ["Gemini Live", "WebRTC", "Azure", "WebSockets"],
    icon: "🎙️",
    status: "live",
    action: "Call Aura",
  },
  {
    id: "aura-mobile",
    title: "Aura Mobile Agent",
    desc: "Autonomous mobile agent capable of direct screen interaction and automated task execution through custom MCPs — no human intervention required.",
    tags: ["MCPs", "Gemini", "Python", "Automation"],
    icon: "📱",
    status: "live",
    action: "View",
  },
  {
    id: "health-multimodal",
    title: "Multimodal Health AI",
    desc: "Multimodal AI pipeline to extract occupational health records from Excel files, PDFs, and scanned images into PostgreSQL with real-time validation and duplicate checks.",
    tags: ["LangGraph", "LangChain", "PostgreSQL", "Azure"],
    icon: "🏥",
    status: "live",
    action: "View",
  },
  {
    id: "biodiversity-vision",
    title: "Biodiversity Vision",
    desc: "Spatio-temporal models predicting species distribution and ecological risk events, combining Computer Vision with camera trap detection for 20+ species with minimal manual annotation.",
    tags: ["PyTorch", "Deep Learning", "PySpark", "Airflow"],
    icon: "🌿",
    status: "demo",
    action: "View Demo",
  },
  {
    id: "vuen-ai",
    title: "Vuen-AI",
    desc: "Conversational AI solution to optimize the shopping experience on e-commerce platforms through natural language interaction and personalized recommendations.",
    tags: ["LangChain", "Python", "NLP", "FastAPI"],
    icon: "🛒",
    status: "live",
    action: "View",
  },
];

const EXPERIENCE = [
  {
    role: "Senior AI Engineer & Data Scientist",
    company: "Indra Group",
    period: "Dec 2025 – Present",
    highlight: true,
    desc: "Built voice + text AI agents for help desk automation. Reduced call duration from 15 min to 2–3 min and cost per call from $1.00 to $0.07 via context window optimization and Graph RAG.",
    tags: ["Gemini Live", "WebRTC", "Graph RAG", "Azure"],
  },
  {
    role: "Data Scientist",
    company: "Empathy Salud Corporativa",
    period: "May – Oct 2025",
    highlight: false,
    desc: "Multimodal AI pipeline extracting occupational health records from Excel, PDFs and scanned images into PostgreSQL with real-time validation and population-level behavioral analysis.",
    tags: ["LangGraph", "PostgreSQL", "Azure", "Docker"],
  },
  {
    role: "Data Scientist",
    company: "Cerrejón Colombia",
    period: "Nov 2024 – May 2025",
    highlight: false,
    desc: "Spatio-temporal models for species distribution and ecological risk. Computer Vision pipeline for wildlife detection across 20+ species with camera traps, fully automated with Airflow.",
    tags: ["PyTorch", "PySpark", "Airflow", "Computer Vision"],
  },
  {
    role: "IEEE CIS President",
    company: "Universidad del Norte",
    period: "2024 – 2025",
    highlight: false,
    desc: "Led the IEEE Computational Intelligence Society chapter, organizing technical events and competitions at national level.",
    tags: ["Leadership"],
  },
  {
    role: "1st Place · ICT Huawei Colombia",
    company: "Virtual assistant for visually impaired",
    period: "2025",
    highlight: false,
    desc: null,
    tags: [],
  },
  {
    role: "Winner · Hackathon BarranquiIA",
    company: "Chatbot for children with autism",
    period: "2024",
    highlight: false,
    desc: null,
    tags: [],
  },
];

const HIGHLIGHTS = [
  "Reduced help desk call duration from 15 min → 2–3 min and cost from $1.00 → $0.07 per call with voice AI on Gemini Live.",
  "Built autonomous AI agents with custom MCPs for direct screen interaction and automated task execution.",
  "Developed Graph RAG-based personal assistant with long-term memory and multi-platform integrations.",
  "Automated wildlife detection for 20+ species using Computer Vision and camera traps with zero human annotation.",
  "Multimodal pipeline extracting health records from Excel, PDFs and scanned images with real-time validation.",
  "1st Place ICT Huawei Colombia 2025 · Winner Hackathon BarranquiIA 2024 · 1st Place Data Challenge Pro 2023.",
];

const TOOLS = [
  "Python", "PyTorch", "Gemini Live", "LangChain", "LangGraph", "Graph RAG",
  "Azure", "GCP", "Vertex AI", "Docker", "Kubernetes", "WebRTC",
  "PostgreSQL", "PySpark", "Airflow", "FastAPI", "WebSockets", "MCPs",
];

/* ── tiny window chrome ── */
function MacWindow({ title, children, className = "", style = {}, variant = "default", onMaximize, onOpenFull, onReset }) {
  const bg = variant === "dark"
    ? "rgba(30,30,32,0.92)"
    : variant === "glass"
    ? "rgba(255,255,255,0.06)"
    : "rgba(255,255,255,0.07)";

  return (
    <div
      className={className}
      style={{
        background: bg,
        borderRadius: 12,
        border: "1px solid rgba(255,255,255,0.08)",
        overflow: "hidden",
        backdropFilter: "blur(40px)",
        boxShadow: "0 8px 32px rgba(0,0,0,0.35), inset 0 1px 0 rgba(255,255,255,0.06)",
        ...style,
      }}
    >
      <div
        style={{
          display: "flex",
          alignItems: "center",
          gap: 6,
          padding: "10px 14px",
          borderBottom: "1px solid rgba(255,255,255,0.06)",
          background: "rgba(255,255,255,0.02)",
        }}
      >
        <span onClick={onReset} style={{ width: 12, height: 12, borderRadius: "50%", background: "#ff5f57", cursor: onReset ? "pointer" : "default" }} />
        <span onClick={onMaximize} style={{ width: 12, height: 12, borderRadius: "50%", background: "#febc2e", cursor: onMaximize ? "pointer" : "default" }} />
        <span
          onClick={onOpenFull ?? onMaximize}
          style={{ width: 12, height: 12, borderRadius: "50%", background: "#28c840", cursor: (onOpenFull ?? onMaximize) ? "pointer" : "default" }}
        />
        <span
          className="pf-window-title"
          style={{
            marginLeft: 8,
            fontSize: 12,
            color: "rgba(255,255,255,0.35)",
            fontFamily: "'SF Mono', 'Fira Code', monospace",
            letterSpacing: 0.5,
          }}
        >
          {title}
        </span>
      </div>
      <div style={{ padding: 0 }}>{children}</div>
    </div>
  );
}

/* ── project card ── */
function ProjectCard({ project, index, onClick }) {
  const [hovered, setHovered] = useState(false);
  const statusColors = { live: "#28c840", demo: "#febc2e", paper: "#5ac8fa" };

  return (
    <div
      onClick={onClick}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      style={{
        background: hovered ? "rgba(255,255,255,0.08)" : "rgba(255,255,255,0.03)",
        borderRadius: 10,
        border: `1px solid ${hovered ? "rgba(255,255,255,0.15)" : "rgba(255,255,255,0.06)"}`,
        padding: 20,
        cursor: "pointer",
        transition: "all 0.3s cubic-bezier(0.4,0,0.2,1)",
        transform: hovered ? "translateY(-2px)" : "translateY(0)",
        boxShadow: hovered ? "0 12px 40px rgba(0,0,0,0.3)" : "none",
        animation: `fadeSlideUp 0.5s ease ${index * 0.08}s both`,
      }}
    >
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 12 }}>
        <span style={{ fontSize: 28 }}>{project.icon}</span>
        <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
          <span
            style={{
              width: 6,
              height: 6,
              borderRadius: "50%",
              background: statusColors[project.status],
              boxShadow: `0 0 8px ${statusColors[project.status]}60`,
            }}
          />
          <span style={{ fontSize: 11, color: "rgba(255,255,255,0.4)", textTransform: "uppercase", letterSpacing: 1 }}>
            {project.status}
          </span>
        </div>
      </div>
      <h3
        style={{
          margin: "0 0 6px",
          fontSize: 16,
          fontWeight: 600,
          color: "#f0f0f0",
          fontFamily: "'SF Pro Display', 'Helvetica Neue', sans-serif",
        }}
      >
        {project.title}
      </h3>
      <p style={{ margin: "0 0 14px", fontSize: 13, lineHeight: 1.5, color: "rgba(255,255,255,0.5)" }}>
        {project.desc}
      </p>
      <div style={{ display: "flex", flexWrap: "wrap", gap: 4, marginBottom: 14 }}>
        {project.tags.map((t) => (
          <span
            key={t}
            style={{
              fontSize: 10,
              padding: "3px 8px",
              borderRadius: 4,
              background: "rgba(255,255,255,0.06)",
              color: "rgba(255,255,255,0.45)",
              letterSpacing: 0.3,
            }}
          >
            {t}
          </span>
        ))}
      </div>
      <div
        style={{
          fontSize: 12,
          fontWeight: 500,
          color: "#5ac8fa",
          display: "flex",
          alignItems: "center",
          gap: 4,
          opacity: hovered ? 1 : 0.7,
          transition: "opacity 0.2s",
        }}
      >
        {project.action} <span style={{ transition: "transform 0.2s", transform: hovered ? "translateX(3px)" : "none", display: "inline-block" }}>→</span>
      </div>
    </div>
  );
}

/* ── chatbot preview ── */
const AURA_SUGGESTIONS = ["Experiencia", "Proyectos", "Stack", "Contacto"];

const AURA_BASE_URL = import.meta.env.VITE_AURA_BASE_URL ?? "http://localhost:8000";


function StreamingCursor() {
  return (
    <span
      style={{
        display: "inline-block",
        width: 6,
        height: 14,
        marginLeft: 3,
        background: "#5ac8fa",
        borderRadius: 1,
        verticalAlign: "text-bottom",
        animation: "blink 0.8s step-end infinite",
      }}
    />
  );
}

function ChatPreviewBubble({ message, index, streaming }) {
  const isUser = message.from === "user";
  const calls = message.mcpCalls ?? [];

  return (
    <div
      style={{
        alignSelf: isUser ? "flex-end" : "flex-start",
        maxWidth: "88%",
        padding: "10px 12px",
        borderRadius: isUser ? "12px 12px 4px 12px" : "12px 12px 12px 4px",
        background: isUser ? "rgba(90,200,250,0.16)" : "rgba(255,255,255,0.06)",
        border: `1px solid ${isUser ? "rgba(90,200,250,0.22)" : "rgba(255,255,255,0.07)"}`,
        fontSize: 12,
        lineHeight: 1.55,
        color: isUser ? "#a9ddf5" : "rgba(255,255,255,0.72)",
        animation: `fadeSlideUp 0.3s ease ${Math.min(index * 0.06, 0.2)}s both`,
      }}
    >
      {calls.length > 0 && (
        <div style={{
          marginBottom: 8,
          paddingBottom: 7,
          borderBottom: "1px solid rgba(255,255,255,0.06)",
          display: "flex",
          flexWrap: "wrap",
          gap: 5,
        }}>
          {calls.map((c) => (
            <span key={c.id} style={{
              display: "inline-flex",
              alignItems: "center",
              gap: 4,
              fontSize: 10,
              fontFamily: "'JetBrains Mono', monospace",
              color: c.done ? "rgba(90,200,250,0.5)" : "rgba(255,255,255,0.25)",
              letterSpacing: "0.01em",
            }}>
              <span style={{ fontSize: 9 }}>{c.done ? "✓" : "⟳"}</span>
              {c.tool}
            </span>
          ))}
        </div>
      )}
      {message.text}
      {message.from === "bot" && streaming && <StreamingCursor />}
    </div>
  );
}

function ChatPreview({ chatApi }) {
  const { messages, input, setInput, isThinking, isStreaming, sendMessage } = chatApi;
  const scrollRef = useRef(null);

  useEffect(() => {
    const el = scrollRef.current;
    if (!el) return;
    const distanceFromBottom = el.scrollHeight - el.scrollTop - el.clientHeight;
    if (distanceFromBottom < 80) el.scrollTop = el.scrollHeight;
  }, [messages, isThinking]);

  return (
    <div className="pf-chat-preview" style={{ display: "flex", flexDirection: "column", minHeight: 420, height: "min(500px, 58vh)" }}>
      <div
        style={{
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          padding: "10px 14px",
          borderBottom: "1px solid rgba(255,255,255,0.05)",
          background: "rgba(255,255,255,0.02)",
        }}
      >
        <span style={{ fontSize: 10, color: "rgba(255,255,255,0.3)", fontFamily: "'JetBrains Mono', monospace" }}>
          aura-assistant
        </span>
        <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
          <span style={{ width: 6, height: 6, borderRadius: "50%", background: "#28c840", animation: "pulse 2s infinite" }} />
          <span style={{ fontSize: 10, color: "rgba(255,255,255,0.32)" }}>online</span>
        </div>
      </div>

      <div ref={scrollRef} style={{ flex: 1, overflowY: "auto", padding: "12px", display: "flex", flexDirection: "column", gap: 8 }}>
        {messages.map((message, index) => (
          <ChatPreviewBubble
            key={`${message.from}-${index}`}
            message={message}
            index={index}
            streaming={isStreaming && index === messages.length - 1}
          />
        ))}

        {isThinking && (
          <div style={{ alignSelf: "flex-start", padding: "10px 14px", borderRadius: "12px 12px 12px 4px", background: "rgba(255,255,255,0.05)", border: "1px solid rgba(255,255,255,0.07)", display: "flex", gap: 4 }}>
            {[0, 1, 2].map((dot) => (
              <span key={dot} style={{ width: 5, height: 5, borderRadius: "50%", background: "rgba(255,255,255,0.33)", animation: `typingDot 1.1s ease ${dot * 0.14}s infinite` }} />
            ))}
          </div>
        )}
      </div>

      {messages.length <= 2 && !isThinking && !isStreaming && (
        <div style={{ padding: "0 12px 10px", display: "flex", gap: 6, flexWrap: "wrap" }}>
          {AURA_SUGGESTIONS.map((suggestion) => (
            <button key={suggestion} onClick={() => sendMessage(suggestion)}
              style={{ padding: "5px 10px", borderRadius: 999, border: "1px solid rgba(255,255,255,0.09)", background: "rgba(255,255,255,0.04)", color: "rgba(255,255,255,0.55)", fontSize: 11, cursor: "pointer" }}
            >
              {suggestion}
            </button>
          ))}
        </div>
      )}

      <div style={{ padding: "10px 12px 12px", borderTop: "1px solid rgba(255,255,255,0.06)", background: "rgba(255,255,255,0.02)" }}>
        <div style={{ display: "flex", alignItems: "center", gap: 8, background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.08)", borderRadius: 10, padding: "4px 6px 4px 10px" }}>
          <input
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && sendMessage(input)}
            placeholder="Escribe cualquier cosa..."
            disabled={isThinking || isStreaming}
            style={{ flex: 1, background: "transparent", border: "none", outline: "none", color: "rgba(255,255,255,0.85)", fontSize: 12, fontFamily: "'Sora', sans-serif" }}
          />
          <button onClick={() => sendMessage(input)} disabled={!input.trim() || isThinking || isStreaming}
            style={{ width: 30, height: 30, borderRadius: 8, border: "none", background: input.trim() && !isThinking && !isStreaming ? "rgba(90,200,250,0.2)" : "rgba(255,255,255,0.04)", color: input.trim() && !isThinking && !isStreaming ? "#5ac8fa" : "rgba(255,255,255,0.2)", cursor: input.trim() && !isThinking && !isStreaming ? "pointer" : "default", fontSize: 15, flexShrink: 0 }}
          >↑</button>
        </div>
        <div style={{ marginTop: 6, fontSize: 10, color: "rgba(255,255,255,0.22)", textAlign: "center", fontFamily: "'JetBrains Mono', monospace" }}>
          powered by aura · RAG sobre perfil profesional
        </div>
      </div>
    </div>
  );
}

/* ── voice visualizer ── */
function VoiceVisualizer() {
  const canvasRef = useRef(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    const dpr = window.devicePixelRatio || 1;
    const W = 360;
    const H = 110;
    canvas.width = W * dpr;
    canvas.height = H * dpr;
    canvas.style.width = "min(100%, 360px)";
    canvas.style.height = H + "px";
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);

    let frame = 0;
    let rafId = 0;

    function draw() {
      ctx.clearRect(0, 0, W, H);
      const bars = 40;
      const gap = W / bars;

      for (let i = 0; i < bars; i++) {
        const t = frame * 0.04 + i * 0.3;
        const centerDistance = Math.abs(i - bars / 2) / (bars / 2);
        const envelope = 1 - Math.pow(centerDistance, 1.4) * 0.68;
        const h = ((Math.sin(t) * 0.5 + 0.5) * 46 + 10) * envelope;
        const alpha = 0.25 + (Math.sin(t) * 0.5 + 0.5) * 0.5;
        ctx.fillStyle = `rgba(90,200,250,${alpha})`;
        ctx.fillRect(i * gap + 2, H / 2 - h / 2, Math.max(gap - 4, 2), h);
      }

      frame++;
      rafId = requestAnimationFrame(draw);
    }

    rafId = requestAnimationFrame(draw);
    return () => cancelAnimationFrame(rafId);
  }, []);

  return (
    <div className="pf-voice-panel" style={{ padding: "22px 18px", minHeight: 420, display: "flex", flexDirection: "column", justifyContent: "space-between", gap: 20 }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
        <span style={{ fontSize: 10, color: "rgba(255,255,255,0.3)", fontFamily: "'JetBrains Mono', monospace" }}>
          live-voice-session
        </span>
        <span style={{ fontSize: 10, color: "rgba(90,200,250,0.55)", fontFamily: "'JetBrains Mono', monospace" }}>
          ~230ms latency
        </span>
      </div>

      <div style={{ display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", gap: 22, flex: 1 }}>
        <canvas className="pf-voice-canvas" ref={canvasRef} />

        <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
          <div
            style={{
              width: 56,
              height: 56,
              borderRadius: "50%",
              background: "rgba(90,200,250,0.14)",
              border: "1px solid rgba(90,200,250,0.35)",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              cursor: "pointer",
              boxShadow: "0 0 24px rgba(90,200,250,0.14)",
            }}
          >
            <span style={{ fontSize: 20 }}>🎤</span>
          </div>

          <div>
            <div style={{ fontSize: 13, color: "rgba(255,255,255,0.62)", fontWeight: 500 }}>Aura is listening...</div>
            <div style={{ fontSize: 11, color: "rgba(255,255,255,0.3)" }}>Powered by Gemini Live</div>
          </div>
        </div>
      </div>

      <div
        style={{
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          borderTop: "1px solid rgba(255,255,255,0.05)",
          paddingTop: 10,
        }}
      >
        <span style={{ fontSize: 10, color: "rgba(255,255,255,0.25)", fontFamily: "'JetBrains Mono', monospace" }}>
          realtime voice pipeline
        </span>
        <span style={{ fontSize: 10, color: "rgba(255,255,255,0.35)", fontFamily: "'JetBrains Mono', monospace" }}>
          gemini-2.5-flash
        </span>
      </div>
    </div>
  );
}

/* ── dock ── */
function Dock({ active, onNav }) {
  const items = [
    { id: "home", icon: "🏠", label: "Home" },
    { id: "projects", icon: "📂", label: "Projects" },
    { id: "experience", icon: "💼", label: "Experience" },
    { id: "contact", icon: "✉️", label: "Contact" },
  ];

  return (
    <div
      className="pf-dock"
      style={{
        position: "fixed",
        bottom: 16,
        left: "50%",
        transform: "translateX(-50%)",
        display: "flex",
        gap: 4,
        padding: "8px 12px",
        background: "rgba(30,30,32,0.85)",
        backdropFilter: "blur(30px)",
        borderRadius: 18,
        border: "1px solid rgba(255,255,255,0.1)",
        boxShadow: "0 8px 32px rgba(0,0,0,0.5)",
        zIndex: 100,
      }}
    >
      {items.map((item) => (
        <button
          className="pf-dock-button"
          key={item.id}
          onClick={() => onNav(item.id)}
          style={{
            background: active === item.id ? "rgba(255,255,255,0.1)" : "transparent",
            border: "none",
            borderRadius: 12,
            padding: "8px 16px",
            cursor: "pointer",
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            gap: 2,
            transition: "all 0.2s",
          }}
          title={item.label}
        >
          <span style={{ fontSize: 20 }}>{item.icon}</span>
          <span className="pf-dock-label" style={{ fontSize: 9, color: active === item.id ? "rgba(255,255,255,0.7)" : "rgba(255,255,255,0.3)", letterSpacing: 0.5 }}>
            {item.label}
          </span>
        </button>
      ))}
    </div>
  );
}

/* ── contact form ── */
function ContactForm() {
  const [from, setFrom] = useState("");
  const [subject, setSubject] = useState("");
  const [message, setMessage] = useState("");
  const [client, setClient] = useState("gmail");

  const EMAIL_CLIENTS = [
    { id: "gmail",   label: "Gmail" },
    { id: "outlook", label: "Outlook" },
    { id: "yahoo",   label: "Yahoo" },
    { id: "system",  label: "Email" },
  ];

  const inputStyle = {
    width: "100%", padding: "8px 12px", borderRadius: 6,
    background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.08)",
    fontSize: 13, color: "rgba(255,255,255,0.75)", outline: "none",
    fontFamily: "'Sora', sans-serif",
  };
  const labelStyle = {
    fontSize: 11, color: "rgba(255,255,255,0.3)",
    display: "block", marginBottom: 4,
    fontFamily: "'JetBrains Mono', monospace",
  };

  const send = () => {
    const to  = "ayrgthons@gmail.com";
    const sub = encodeURIComponent(subject || "(sin asunto)");
    const bod = encodeURIComponent(`From: ${from}\n\n${message}`);
    const urls = {
      gmail:   `https://mail.google.com/mail/?view=cm&to=${to}&su=${sub}&body=${bod}`,
      outlook: `https://outlook.live.com/mail/0/deeplink/compose?to=${to}&subject=${sub}&body=${bod}`,
      yahoo:   `https://compose.mail.yahoo.com/?to=${to}&subject=${sub}&body=${bod}`,
      system:  `mailto:${to}?subject=${sub}&body=${bod}`,
    };
    window.open(urls[client], "_blank");
  };

  return (
    <MacWindow title="new message" className="pf-contact-window" style={{ maxWidth: 520 }}>
      <div style={{ padding: 24 }}>
        <div style={{ marginBottom: 20 }}>
          <span style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: 11, color: "#5ac8fa", letterSpacing: 2, textTransform: "uppercase" }}>
            ping
          </span>
          <h2 style={{ fontFamily: "'Sora', sans-serif", fontSize: 24, fontWeight: 600, marginTop: 6, color: "rgba(255,255,255,0.9)" }}>
            Let's talk
          </h2>
        </div>

        <div style={{ marginBottom: 12 }}>
          <label style={labelStyle}>From</label>
          <input value={from} onChange={e => setFrom(e.target.value)} placeholder="your@email.com" style={inputStyle} />
        </div>

        <div style={{ marginBottom: 12 }}>
          <label style={labelStyle}>Subject</label>
          <input value={subject} onChange={e => setSubject(e.target.value)} placeholder="Let's build something" style={inputStyle} />
        </div>

        <div style={{ marginBottom: 16 }}>
          <label style={labelStyle}>Message</label>
          <textarea
            value={message}
            onChange={e => setMessage(e.target.value)}
            placeholder="Your message..."
            rows={4}
            style={{ ...inputStyle, resize: "vertical", minHeight: 90 }}
          />
        </div>

        <div style={{ marginBottom: 12 }}>
          <label style={labelStyle}>Open with</label>
          <div style={{ display: "flex", gap: 6 }}>
            {EMAIL_CLIENTS.map(c => (
              <button
                key={c.id}
                onClick={() => setClient(c.id)}
                style={{
                  flex: 1, padding: "6px 0", borderRadius: 6, border: `1px solid ${client === c.id ? "rgba(90,200,250,0.35)" : "rgba(255,255,255,0.07)"}`,
                  background: client === c.id ? "rgba(90,200,250,0.1)" : "rgba(255,255,255,0.03)",
                  color: client === c.id ? "#5ac8fa" : "rgba(255,255,255,0.35)",
                  fontSize: 11, cursor: "pointer", fontFamily: "'JetBrains Mono', monospace",
                  transition: "all 0.15s",
                }}
              >
                {c.label}
              </button>
            ))}
          </div>
        </div>

        <button
          onClick={send}
          disabled={!message.trim()}
          style={{
            width: "100%", padding: "10px", borderRadius: 8, border: "none",
            background: message.trim() ? "rgba(90,200,250,0.14)" : "rgba(255,255,255,0.04)",
            color: message.trim() ? "#5ac8fa" : "rgba(255,255,255,0.2)",
            fontSize: 13, fontWeight: 500,
            cursor: message.trim() ? "pointer" : "default",
            fontFamily: "'Sora', sans-serif", transition: "all 0.2s",
          }}
        >
          Send →
        </button>

        <div className="pf-contact-links" style={{ display: "flex", justifyContent: "center", gap: 24, marginTop: 20, paddingTop: 16, borderTop: "1px solid rgba(255,255,255,0.04)" }}>
          {[
            { label: "GitHub",   href: "https://github.com/Ayrgthon" },
            { label: "LinkedIn", href: "https://www.linkedin.com/in/ayrgthon-soraca/" },
            { label: "Kaggle",   href: "https://www.kaggle.com/ayrgthonsoraca" },
            { label: "Email",    href: "https://mail.google.com/mail/?view=cm&to=ayrgthons@gmail.com" },
          ].map(({ label, href }) => (
            <a key={label} href={href} target="_blank" rel="noopener noreferrer"
              style={{ fontSize: 12, color: "rgba(255,255,255,0.3)", cursor: "pointer", textDecoration: "none", transition: "color 0.2s" }}
              onMouseEnter={e => e.target.style.color = "#5ac8fa"}
              onMouseLeave={e => e.target.style.color = "rgba(255,255,255,0.3)"}
            >
              {label}
            </a>
          ))}
        </div>
      </div>
    </MacWindow>
  );
}

/* ── main ── */
export default function Portfolio({ chatApi, onMaximize, onOpenFull, onVoiceMaximize, onVoiceOpenFull }) {
  const [section, setSection] = useState("home");
  const sectionRefs = useRef({});

  const scrollTo = (id) => {
    setSection(id);
    sectionRefs.current[id]?.scrollIntoView({ behavior: "smooth", block: "start" });
  };

  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((e) => {
          if (e.isIntersecting) setSection(e.target.dataset.section);
        });
      },
      { threshold: 0.4 }
    );
    Object.values(sectionRefs.current).forEach((el) => el && observer.observe(el));
    return () => observer.disconnect();
  }, []);

  const ref = (id) => (el) => { sectionRefs.current[id] = el; };

  return (
    <div
      style={{
        minHeight: "100vh",
        background: "linear-gradient(145deg, #0a0a0c 0%, #111114 40%, #0d1117 100%)",
        color: "#f0f0f0",
        fontFamily: "'SF Pro Display', 'Helvetica Neue', -apple-system, sans-serif",
        overflowX: "hidden",
      }}
    >
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=JetBrains+Mono:wght@400;500&family=Sora:wght@300;400;500;600;700&display=swap');

        * { margin: 0; padding: 0; box-sizing: border-box; }
        html { scroll-behavior: smooth; }
        body { background: #0a0a0c; }

        @keyframes fadeSlideUp {
          from { opacity: 0; transform: translateY(16px); }
          to { opacity: 1; transform: translateY(0); }
        }
        @keyframes typingDot {
          0%, 60%, 100% { opacity: 0.3; transform: translateY(0); }
          30% { opacity: 1; transform: translateY(-3px); }
        }
        @keyframes blink {
          0%, 49% { opacity: 1; }
          50%, 100% { opacity: 0; }
        }
        @keyframes spin {
          from { transform: rotate(0deg); }
          to { transform: rotate(360deg); }
        }
        @keyframes gradientShift {
          0% { background-position: 0% 50%; }
          50% { background-position: 100% 50%; }
          100% { background-position: 0% 50%; }
        }
        @keyframes pulse {
          0%, 100% { opacity: 0.4; }
          50% { opacity: 0.8; }
        }
        @keyframes float {
          0%, 100% { transform: translateY(0px); }
          50% { transform: translateY(-8px); }
        }

        ::-webkit-scrollbar { width: 6px; }
        ::-webkit-scrollbar-track { background: transparent; }
        ::-webkit-scrollbar-thumb { background: rgba(255,255,255,0.1); border-radius: 3px; }

        @media (max-width: 980px) {
          .pf-preview-grid,
          .pf-experience-grid {
            grid-template-columns: 1fr !important;
          }

          .pf-contact-window {
            max-width: 100% !important;
          }
        }

        @media (max-width: 760px) {
          .pf-shell {
            padding: 0 14px !important;
          }

          .pf-topbar {
            padding: 10px 14px !important;
          }

          .pf-hero-section {
            min-height: auto !important;
            padding-top: 96px;
            padding-bottom: 88px !important;
          }

          .pf-hero-content p {
            max-width: 100% !important;
            font-size: 15px !important;
            line-height: 1.6 !important;
          }

          .pf-cta-row {
            flex-direction: column;
            align-items: stretch;
          }

          .pf-cta-row button {
            width: 100%;
          }

          .pf-preview-grid {
            margin-top: 34px !important;
          }

          .pf-chat-preview {
            min-height: 340px !important;
            height: auto !important;
          }

          .pf-voice-panel {
            min-height: 280px !important;
          }

          .pf-voice-canvas {
            height: 88px !important;
          }

          .pf-dock {
            width: calc(100% - 20px);
            justify-content: space-between;
            bottom: 10px;
            padding: 8px;
            border-radius: 14px;
          }

          .pf-dock-button {
            flex: 1;
            padding: 8px 4px !important;
          }

          .pf-dock-label {
            font-size: 8px !important;
          }

          .pf-contact-links {
            flex-wrap: wrap;
            gap: 12px !important;
          }
        }

        @media (max-width: 480px) {
          .pf-window-title,
          .pf-topbar-status {
            display: none;
          }

          .pf-project-grid {
            grid-template-columns: 1fr !important;
          }
        }
      `}</style>

      {/* ambient blobs */}
      <div style={{ position: "fixed", inset: 0, pointerEvents: "none", zIndex: 0, overflow: "hidden" }}>
        <div style={{
          position: "absolute", width: 500, height: 500, borderRadius: "50%",
          background: "radial-gradient(circle, rgba(90,200,250,0.06) 0%, transparent 70%)",
          top: -100, right: -100, animation: "float 8s ease infinite",
        }} />
        <div style={{
          position: "absolute", width: 400, height: 400, borderRadius: "50%",
          background: "radial-gradient(circle, rgba(168,85,247,0.05) 0%, transparent 70%)",
          bottom: 100, left: -100, animation: "float 10s ease 2s infinite",
        }} />
      </div>

      <div className="pf-shell" style={{ position: "relative", zIndex: 1, width: "min(1280px, 100%)", margin: "0 auto", padding: "0 clamp(16px, 3vw, 40px)" }}>

        {/* ═══ HERO ═══ */}
        <section
          className="pf-hero-section"
          ref={ref("home")}
          data-section="home"
          style={{ minHeight: "100vh", display: "flex", flexDirection: "column", justifyContent: "center", paddingBottom: 80 }}
        >
          {/* top bar */}
          <div style={{
            position: "fixed", top: 0, left: 0, right: 0, zIndex: 50,
            padding: "12px 24px",
            background: "rgba(10,10,12,0.7)",
            backdropFilter: "blur(20px)",
            borderBottom: "1px solid rgba(255,255,255,0.04)",
            display: "flex", justifyContent: "space-between", alignItems: "center",
          }} className="pf-topbar">
            <span style={{
              fontFamily: "'JetBrains Mono', monospace", fontSize: 13, fontWeight: 500,
              color: "rgba(255,255,255,0.6)", letterSpacing: 1,
            }}>
              ayrgthon<span style={{ color: "#5ac8fa" }}>.dev</span>
            </span>
            <div style={{ display: "flex", gap: 4, alignItems: "center" }}>
              <span style={{ width: 6, height: 6, borderRadius: "50%", background: "#28c840", animation: "pulse 2s infinite" }} />
              <span className="pf-topbar-status" style={{ fontSize: 11, color: "rgba(255,255,255,0.35)" }}>Available</span>
            </div>
          </div>

          <div className="pf-hero-content" style={{ animation: "fadeSlideUp 0.6s ease both" }}>
            <div style={{
              fontSize: 12, fontFamily: "'JetBrains Mono', monospace",
              color: "rgba(255,255,255,0.3)", marginBottom: 16, letterSpacing: 2,
            }}>
              ~/portfolio
            </div>
            <h1 style={{
              fontFamily: "'Sora', sans-serif", fontSize: "clamp(40px, 6vw, 64px)",
              fontWeight: 700, lineHeight: 1.1, marginBottom: 20, letterSpacing: -1,
            }}>
              <span style={{ color: "rgba(255,255,255,0.9)" }}>I build AI</span>
              <br />
              <span style={{
                background: "linear-gradient(135deg, #5ac8fa, #a855f7, #5ac8fa)",
                backgroundSize: "200% 200%",
                animation: "gradientShift 4s ease infinite",
                WebkitBackgroundClip: "text",
                WebkitTextFillColor: "transparent",
              }}>
                that talks back.
              </span>
            </h1>
            <p style={{
              fontSize: 17, lineHeight: 1.7, color: "rgba(255,255,255,0.45)",
              maxWidth: 500, fontFamily: "'Sora', sans-serif", fontWeight: 300,
            }}>
              AI Engineer specializing in real-time voice & text agents, MLOps pipelines, and Graph RAG systems — transforming complex data into production-grade AI at scale.
            </p>

            <div className="pf-cta-row" style={{ display: "flex", gap: 12, marginTop: 32 }}>
              <button
                onClick={() => scrollTo("projects")}
                style={{
                  padding: "10px 24px", borderRadius: 8, border: "none",
                  background: "rgba(90,200,250,0.12)", color: "#5ac8fa",
                  fontSize: 13, fontWeight: 500, cursor: "pointer",
                  fontFamily: "'Sora', sans-serif",
                  transition: "all 0.2s",
                }}
              >
                View Projects →
              </button>
              <button
                onClick={() => scrollTo("contact")}
                style={{
                  padding: "10px 24px", borderRadius: 8,
                  border: "1px solid rgba(255,255,255,0.1)",
                  background: "transparent", color: "rgba(255,255,255,0.5)",
                  fontSize: 13, fontWeight: 500, cursor: "pointer",
                  fontFamily: "'Sora', sans-serif",
                  transition: "all 0.2s",
                }}
              >
                Contact
              </button>
            </div>
          </div>

          {/* floating chat + voice preview */}
          <div className="pf-preview-grid" style={{
            display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16,
            marginTop: 56, animation: "fadeSlideUp 0.6s ease 0.3s both",
          }}>
            <MacWindow title="aura-assistant — chatbot" onMaximize={onMaximize} onOpenFull={onOpenFull} onReset={chatApi.resetChat}>
              <ChatPreview chatApi={chatApi} />
            </MacWindow>
            <MacWindow title="aura-assistant — voice-bot" onMaximize={onVoiceMaximize} onOpenFull={onVoiceOpenFull}>
              <VoiceVisualizer />
            </MacWindow>
          </div>
        </section>

        {/* ═══ PROJECTS ═══ */}
        <section
          ref={ref("projects")}
          data-section="projects"
          style={{ paddingTop: 80, paddingBottom: 80 }}
        >
          <div style={{ marginBottom: 40 }}>
            <span style={{
              fontFamily: "'JetBrains Mono', monospace", fontSize: 11,
              color: "#5ac8fa", letterSpacing: 2, textTransform: "uppercase",
            }}>
              ls ~/projects
            </span>
            <h2 style={{
              fontFamily: "'Sora', sans-serif", fontSize: 32, fontWeight: 600,
              marginTop: 8, color: "rgba(255,255,255,0.9)",
            }}>
              Things I've built
            </h2>
          </div>

          <div className="pf-project-grid" style={{
            display: "grid",
            gridTemplateColumns: "repeat(3, 1fr)",
            gap: 12,
          }}>
            {PROJECTS.map((p, i) => (
              <ProjectCard
                key={p.id} project={p} index={i}
                onClick={p.id === "chatbot-rag" ? onOpenFull : p.id === "voicebot-aura" ? onVoiceOpenFull : undefined}
              />
            ))}
          </div>
        </section>

        {/* ═══ EXPERIENCE ═══ */}
        <section
          ref={ref("experience")}
          data-section="experience"
          style={{ paddingTop: 80, paddingBottom: 80 }}
        >
          <div style={{ marginBottom: 40 }}>
            <span style={{
              fontFamily: "'JetBrains Mono', monospace", fontSize: 11,
              color: "#5ac8fa", letterSpacing: 2, textTransform: "uppercase",
            }}>
              cat ~/experience.yml
            </span>
            <h2 style={{
              fontFamily: "'Sora', sans-serif", fontSize: 32, fontWeight: 600,
              marginTop: 8, color: "rgba(255,255,255,0.9)",
            }}>
              Background
            </h2>
          </div>

          <div className="pf-experience-grid" style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 24, alignItems: "stretch" }}>
            {/* timeline */}
            <MacWindow title="career.log">
              <div style={{ padding: "16px 20px" }}>
                {EXPERIENCE.map((exp, i) => (
                  <div
                    key={i}
                    style={{
                      display: "flex", gap: 14, padding: "14px 0",
                      borderBottom: i < EXPERIENCE.length - 1 ? "1px solid rgba(255,255,255,0.04)" : "none",
                      animation: `fadeSlideUp 0.4s ease ${i * 0.08}s both`,
                    }}
                  >
                    <div style={{ display: "flex", flexDirection: "column", alignItems: "center", paddingTop: 5, flexShrink: 0 }}>
                      <div style={{
                        width: 8, height: 8, borderRadius: "50%",
                        background: exp.highlight ? "#5ac8fa" : "rgba(255,255,255,0.18)",
                        boxShadow: exp.highlight ? "0 0 10px rgba(90,200,250,0.45)" : "none",
                      }} />
                      {i < EXPERIENCE.length - 1 && exp.desc && (
                        <div style={{ width: 1, flex: 1, minHeight: 20, marginTop: 5, background: "rgba(255,255,255,0.05)" }} />
                      )}
                    </div>
                    <div style={{ flex: 1, paddingBottom: 4 }}>
                      <div style={{ fontSize: 13.5, fontWeight: 600, color: exp.highlight ? "rgba(255,255,255,0.92)" : "rgba(255,255,255,0.78)" }}>
                        {exp.role}
                      </div>
                      <div style={{ fontSize: 11.5, color: "rgba(255,255,255,0.38)", marginTop: 2, fontFamily: "'JetBrains Mono', monospace" }}>
                        {exp.company} · {exp.period}
                      </div>
                      {exp.desc && (
                        <div style={{ fontSize: 12, color: "rgba(255,255,255,0.48)", marginTop: 7, lineHeight: 1.6 }}>
                          {exp.desc}
                        </div>
                      )}
                      {exp.tags?.length > 0 && (
                        <div style={{ display: "flex", flexWrap: "wrap", gap: 4, marginTop: 8 }}>
                          {exp.tags.map(t => (
                            <span key={t} style={{ fontSize: 10, padding: "2px 7px", borderRadius: 4, background: "rgba(90,200,250,0.07)", border: "1px solid rgba(90,200,250,0.12)", color: "rgba(90,200,250,0.55)", fontFamily: "'JetBrains Mono', monospace" }}>
                              {t}
                            </span>
                          ))}
                        </div>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </MacWindow>

            {/* right column */}
            <div style={{ display: "flex", flexDirection: "column", gap: 16, height: "100%" }}>
              <MacWindow title="highlights.md" style={{ flex: 1 }}>
                <div style={{ padding: "16px 20px", display: "flex", flexDirection: "column", gap: 12 }}>
                  {HIGHLIGHTS.map((h, i) => (
                    <div key={i} style={{ display: "flex", gap: 10, animation: `fadeSlideUp 0.4s ease ${i * 0.07}s both` }}>
                      <span style={{ color: "#5ac8fa", fontSize: 14, flexShrink: 0, marginTop: 1 }}>▸</span>
                      <span style={{ fontSize: 12.5, color: "rgba(255,255,255,0.58)", lineHeight: 1.6 }}>{h}</span>
                    </div>
                  ))}
                </div>
              </MacWindow>

              <MacWindow title="tools.json">
                <div style={{ padding: "14px 18px", display: "flex", flexDirection: "column", gap: 14 }}>
                  <div style={{ display: "flex", flexWrap: "wrap", gap: 6 }}>
                    {TOOLS.map((tool, i) => (
                      <span
                        key={tool}
                        style={{
                          fontSize: 11.5, padding: "5px 10px", borderRadius: 6,
                          background: "rgba(255,255,255,0.05)",
                          border: "1px solid rgba(255,255,255,0.06)",
                          color: "rgba(255,255,255,0.52)",
                          fontFamily: "'JetBrains Mono', monospace",
                          animation: `fadeSlideUp 0.3s ease ${i * 0.03}s both`,
                        }}
                      >
                        {tool}
                      </span>
                    ))}
                  </div>

                </div>
              </MacWindow>

              <MacWindow title="metrics.json">
                <div style={{ padding: "14px 18px", display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
                  {[
                    { value: "15→2 min", label: "call duration" },
                    { value: "$1→$0.07", label: "cost per call" },
                    { value: "20+", label: "species detected" },
                    { value: "3", label: "industries" },
                  ].map((m, i) => (
                    <div key={i} style={{ animation: `fadeSlideUp 0.4s ease ${i * 0.06}s both` }}>
                      <div style={{ fontSize: 15, fontWeight: 600, color: "#5ac8fa", fontFamily: "'JetBrains Mono', monospace" }}>{m.value}</div>
                      <div style={{ fontSize: 10, color: "rgba(255,255,255,0.3)", marginTop: 2 }}>{m.label}</div>
                    </div>
                  ))}
                </div>
              </MacWindow>
            </div>
          </div>

          {/* education */}
          <div style={{ marginTop: 24 }}>
            <MacWindow title="education">
              <div style={{ padding: 20, display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                <div>
                  <div style={{ fontSize: 14, fontWeight: 500, color: "rgba(255,255,255,0.85)" }}>
                    Double Major · Mathematics & Data Science
                  </div>
                  <div style={{ fontSize: 12, color: "rgba(255,255,255,0.4)", marginTop: 2 }}>
                    Universidad del Norte — Barranquilla, Colombia · 2022 – Dec 2025
                  </div>
                </div>
                <span style={{
                  fontSize: 11, padding: "4px 10px", borderRadius: 4,
                  background: "rgba(254,188,46,0.1)", color: "#febc2e",
                  border: "1px solid rgba(254,188,46,0.15)",
                }}>
                  Dec 2025
                </span>
              </div>
            </MacWindow>
          </div>
        </section>

        {/* ═══ CONTACT ═══ */}
        <section
          ref={ref("contact")}
          data-section="contact"
          style={{ paddingTop: 80, paddingBottom: 120 }}
        >
          <div className="pf-contact-grid" style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 24, alignItems: "start" }}>
            <ContactForm />

            {/* closing card */}
            <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
              <MacWindow title="about.jpg" variant="dark">
                <div style={{ overflow: "hidden", maxHeight: 280 }}>
                  <img
                    src="/ayrgthon.jpg"
                    alt="Ayrgthon Soraca — Huawei ICT Innovation 1st Place"
                    style={{ width: "100%", display: "block", objectFit: "cover", objectPosition: "center top" }}
                  />
                </div>
              </MacWindow>

              <MacWindow title="readme.md" variant="dark">
                <div style={{ padding: "20px 22px" }}>
                  <p style={{ fontSize: 14, lineHeight: 1.75, color: "rgba(255,255,255,0.6)", margin: 0 }}>
                    I build AI systems that actually ship — voice agents, RAG pipelines, and autonomous tools that make a measurable difference. If you have a hard problem at the intersection of data, language, and real-time systems, let's talk.
                  </p>
                  <p style={{ fontSize: 12, color: "rgba(255,255,255,0.28)", marginTop: 14, fontFamily: "'JetBrains Mono', monospace" }}>
                    — Ayrgthon Soraca · Barranquilla, Colombia
                  </p>
                </div>
              </MacWindow>
            </div>
          </div>
        </section>
      </div>

      <Dock active={section} onNav={scrollTo} />
    </div>
  );
}
