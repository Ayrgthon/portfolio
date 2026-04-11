import { useState, useRef, useEffect, useCallback } from "react";

const BOT_RESPONSES = {
  hola: "¡Hola! 👋 Soy el asistente virtual de Ary. Puedo contarte sobre su experiencia como AI Engineer, sus proyectos con voicebots y RAG systems, o su stack tecnológico. ¿Qué te gustaría saber?",
  hello: "Hey there! 👋 I'm Ary's AI assistant. I can tell you about his experience building production voicebots, RAG systems, and real-time AI experiences. What would you like to know?",
  experiencia: "Ary es Data Scientist & AI Engineer en Indra Group, donde ha construido voicebots de producción con Gemini Live API, sistemas RAG empresariales, y soluciones de Computer Vision. También fue presidente de IEEE CIS en Uninorte y ganador nacional en Huawei ICT Innovation e ISCAS IEEE.",
  proyectos: "Ary tiene varios proyectos destacados:\n\n• **Aura** — Voicebot en tiempo real con Gemini 2.5 Flash, Twilio y Azure, con latencia sub-segundo.\n• **RAG Chatbot** — Sistema conversacional con retrieval-augmented generation sobre su perfil profesional.\n• **BEV 3D Vision** — Pipeline de Computer Vision combinando SegFormer y estimación de profundidad monocular.\n• **Realtime Playground** — Experiencia web interactiva con AI en tiempo real.",
  stack: "El stack principal de Ary incluye:\n\n**Languages:** Python, TypeScript\n**AI/ML:** PyTorch, LangChain, Gemini API, OpenAI\n**Cloud:** Azure (Functions, Consumption Plan), GCP (Vertex AI)\n**Infra:** Docker, FastAPI, WebSockets, Twilio\n**Data:** BigQuery, Neo4j, Vector DBs\n**Frontend:** React, Next.js",
  contacto: "Puedes contactar a Ary a través de:\n\n📧 Email — ary@ejemplo.com\n💼 LinkedIn — linkedin.com/in/ary\n🐙 GitHub — github.com/ary\n\n¡Está abierto a oportunidades y colaboraciones!",
};

function getResponse(input) {
  const lower = input.toLowerCase().trim();
  for (const [key, val] of Object.entries(BOT_RESPONSES)) {
    if (lower.includes(key)) return val;
  }
  return "Interesante pregunta. Ary tiene experiencia en AI Engineering, voicebots con Gemini Live, sistemas RAG, y Computer Vision. Puedes preguntarme sobre su **experiencia**, **proyectos**, **stack** tecnológico, o **contacto**. 🚀";
}

function MarkdownLite({ text }) {
  const parts = text.split(/(\*\*.*?\*\*|\n|• )/g);
  return (
    <span>
      {parts.map((p, i) => {
        if (p === "\n") return <br key={i} />;
        if (p === "• ") return <span key={i} style={{ color: "#5ac8fa" }}>• </span>;
        if (p.startsWith("**") && p.endsWith("**"))
          return <strong key={i} style={{ color: "rgba(255,255,255,0.9)", fontWeight: 600 }}>{p.slice(2, -2)}</strong>;
        return <span key={i}>{p}</span>;
      })}
    </span>
  );
}

function StreamingText({ text, onDone }) {
  const [displayed, setDisplayed] = useState("");
  const idx = useRef(0);

  useEffect(() => {
    idx.current = 0;
    setDisplayed("");
    const id = setInterval(() => {
      idx.current++;
      if (idx.current >= text.length) {
        setDisplayed(text);
        clearInterval(id);
        onDone?.();
      } else {
        setDisplayed(text.slice(0, idx.current));
      }
    }, 18);
    return () => clearInterval(id);
  }, [text]);

  return (
    <>
      <MarkdownLite text={displayed} />
      {displayed.length < text.length && (
        <span
          style={{
            display: "inline-block",
            width: 7,
            height: 16,
            background: "#5ac8fa",
            marginLeft: 2,
            verticalAlign: "text-bottom",
            borderRadius: 1,
            animation: "blink 0.8s step-end infinite",
          }}
        />
      )}
    </>
  );
}

function Bubble({ msg, isLast }) {
  const isUser = msg.role === "user";
  return (
    <div
      style={{
        display: "flex",
        justifyContent: isUser ? "flex-end" : "flex-start",
        animation: "fadeIn 0.25s ease",
        marginBottom: 8,
      }}
    >
      {!isUser && (
        <div
          style={{
            width: 28,
            height: 28,
            borderRadius: 8,
            background: "linear-gradient(135deg, rgba(90,200,250,0.2), rgba(168,85,247,0.2))",
            border: "1px solid rgba(90,200,250,0.15)",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            fontSize: 13,
            marginRight: 8,
            marginTop: 2,
            flexShrink: 0,
          }}
        >
          ✦
        </div>
      )}
      <div
        style={{
          maxWidth: "78%",
          padding: "10px 14px",
          borderRadius: isUser ? "14px 14px 4px 14px" : "14px 14px 14px 4px",
          background: isUser ? "rgba(90,200,250,0.12)" : "rgba(255,255,255,0.05)",
          border: `1px solid ${isUser ? "rgba(90,200,250,0.18)" : "rgba(255,255,255,0.06)"}`,
          fontSize: 13.5,
          lineHeight: 1.6,
          color: isUser ? "#b8e4f8" : "rgba(255,255,255,0.7)",
        }}
      >
        {msg.role === "bot" && msg.streaming ? (
          <StreamingText text={msg.text} onDone={msg.onDone} />
        ) : (
          <MarkdownLite text={msg.text} />
        )}
      </div>
    </div>
  );
}

const SUGGESTIONS = ["Experiencia", "Proyectos", "Stack", "Contacto"];

export default function Chatbot() {
  const [messages, setMessages] = useState([
    { role: "bot", text: "¡Hola! Soy el asistente de Ary. Pregúntame lo que quieras sobre su perfil como AI Engineer. 🤖", streaming: false },
  ]);
  const [input, setInput] = useState("");
  const [isStreaming, setIsStreaming] = useState(false);
  const bottomRef = useRef(null);
  const inputRef = useRef(null);

  const scrollBottom = useCallback(() => {
    setTimeout(() => bottomRef.current?.scrollIntoView({ behavior: "smooth" }), 30);
  }, []);

  useEffect(scrollBottom, [messages]);

  const send = useCallback(
    (text) => {
      if (!text.trim() || isStreaming) return;
      const userMsg = { role: "user", text: text.trim(), streaming: false };
      const response = getResponse(text);

      setMessages((prev) => [...prev, userMsg]);
      setInput("");
      setIsStreaming(true);

      setTimeout(() => {
        setMessages((prev) => [
          ...prev,
          {
            role: "bot",
            text: response,
            streaming: true,
            onDone: () => setIsStreaming(false),
          },
        ]);
      }, 600);
    },
    [isStreaming]
  );

  return (
    <div
      style={{
        height: "100vh",
        width: "100vw",
        background: "linear-gradient(145deg, #0a0a0c 0%, #111114 40%, #0d1117 100%)",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        fontFamily: "'SF Pro Display', -apple-system, sans-serif",
      }}
    >
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=JetBrains+Mono:wght@400;500&family=Sora:wght@300;400;500;600&display=swap');
        * { margin: 0; padding: 0; box-sizing: border-box; }
        body { background: #0a0a0c; }
        @keyframes fadeIn { from { opacity: 0; transform: translateY(6px); } to { opacity: 1; transform: translateY(0); } }
        @keyframes blink { 50% { opacity: 0; } }
        @keyframes pulse { 0%,100% { opacity: 0.4; } 50% { opacity: 1; } }
        ::-webkit-scrollbar { width: 5px; }
        ::-webkit-scrollbar-track { background: transparent; }
        ::-webkit-scrollbar-thumb { background: rgba(255,255,255,0.08); border-radius: 3px; }
      `}</style>

      {/* ambient */}
      <div style={{ position: "fixed", inset: 0, pointerEvents: "none", zIndex: 0, overflow: "hidden" }}>
        <div style={{
          position: "absolute", width: 400, height: 400, borderRadius: "50%",
          background: "radial-gradient(circle, rgba(90,200,250,0.05) 0%, transparent 70%)",
          top: -50, right: -50,
        }} />
        <div style={{
          position: "absolute", width: 300, height: 300, borderRadius: "50%",
          background: "radial-gradient(circle, rgba(168,85,247,0.04) 0%, transparent 70%)",
          bottom: 50, left: -50,
        }} />
      </div>

      {/* window */}
      <div
        style={{
          position: "relative",
          zIndex: 1,
          width: "100%",
          maxWidth: 560,
          height: "85vh",
          maxHeight: 700,
          background: "rgba(22,22,26,0.92)",
          borderRadius: 14,
          border: "1px solid rgba(255,255,255,0.08)",
          backdropFilter: "blur(40px)",
          boxShadow: "0 24px 80px rgba(0,0,0,0.6), inset 0 1px 0 rgba(255,255,255,0.05)",
          display: "flex",
          flexDirection: "column",
          overflow: "hidden",
        }}
      >
        {/* title bar */}
        <div
          style={{
            display: "flex",
            alignItems: "center",
            padding: "12px 16px",
            borderBottom: "1px solid rgba(255,255,255,0.06)",
            background: "rgba(255,255,255,0.02)",
            flexShrink: 0,
          }}
        >
          <div style={{ display: "flex", gap: 6 }}>
            <span style={{ width: 12, height: 12, borderRadius: "50%", background: "#ff5f57" }} />
            <span style={{ width: 12, height: 12, borderRadius: "50%", background: "#febc2e" }} />
            <span style={{ width: 12, height: 12, borderRadius: "50%", background: "#28c840" }} />
          </div>
          <div style={{ flex: 1, textAlign: "center" }}>
            <span
              style={{
                fontSize: 12,
                color: "rgba(255,255,255,0.35)",
                fontFamily: "'JetBrains Mono', monospace",
                letterSpacing: 0.5,
              }}
            >
              ary-assistant — RAG chatbot
            </span>
          </div>
          <div style={{ display: "flex", alignItems: "center", gap: 5 }}>
            <span
              style={{
                width: 6,
                height: 6,
                borderRadius: "50%",
                background: "#28c840",
                animation: "pulse 2s infinite",
              }}
            />
            <span style={{ fontSize: 10, color: "rgba(255,255,255,0.25)" }}>online</span>
          </div>
        </div>

        {/* model badge */}
        <div
          style={{
            padding: "8px 16px",
            borderBottom: "1px solid rgba(255,255,255,0.04)",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            gap: 8,
            flexShrink: 0,
          }}
        >
          <span
            style={{
              fontSize: 10,
              padding: "3px 8px",
              borderRadius: 4,
              background: "rgba(90,200,250,0.08)",
              border: "1px solid rgba(90,200,250,0.12)",
              color: "rgba(90,200,250,0.6)",
              fontFamily: "'JetBrains Mono', monospace",
              letterSpacing: 0.5,
            }}
          >
            gemini-2.5-flash
          </span>
          <span style={{ fontSize: 10, color: "rgba(255,255,255,0.2)" }}>·</span>
          <span style={{ fontSize: 10, color: "rgba(255,255,255,0.2)", fontFamily: "'JetBrains Mono', monospace" }}>
            RAG context: 12.4k tokens
          </span>
        </div>

        {/* messages */}
        <div
          style={{
            flex: 1,
            overflowY: "auto",
            padding: "16px 16px 8px",
          }}
        >
          {messages.map((m, i) => (
            <Bubble key={i} msg={m} isLast={i === messages.length - 1} />
          ))}

          {/* typing indicator */}
          {isStreaming && messages[messages.length - 1]?.role === "user" && (
            <div style={{ display: "flex", alignItems: "center", gap: 8, animation: "fadeIn 0.2s ease", marginBottom: 8 }}>
              <div
                style={{
                  width: 28, height: 28, borderRadius: 8,
                  background: "linear-gradient(135deg, rgba(90,200,250,0.2), rgba(168,85,247,0.2))",
                  border: "1px solid rgba(90,200,250,0.15)",
                  display: "flex", alignItems: "center", justifyContent: "center", fontSize: 13, flexShrink: 0,
                }}
              >
                ✦
              </div>
              <div
                style={{
                  padding: "10px 16px",
                  borderRadius: "14px 14px 14px 4px",
                  background: "rgba(255,255,255,0.05)",
                  border: "1px solid rgba(255,255,255,0.06)",
                  display: "flex",
                  gap: 5,
                }}
              >
                {[0, 1, 2].map((i) => (
                  <span
                    key={i}
                    style={{
                      width: 5, height: 5, borderRadius: "50%",
                      background: "rgba(255,255,255,0.3)",
                      animation: `pulse 1s ease ${i * 0.2}s infinite`,
                    }}
                  />
                ))}
              </div>
            </div>
          )}

          <div ref={bottomRef} />
        </div>

        {/* suggestions */}
        {messages.length <= 2 && !isStreaming && (
          <div
            style={{
              padding: "0 16px 8px",
              display: "flex",
              gap: 6,
              flexWrap: "wrap",
              flexShrink: 0,
            }}
          >
            {SUGGESTIONS.map((s) => (
              <button
                key={s}
                onClick={() => send(s)}
                style={{
                  padding: "6px 14px",
                  borderRadius: 20,
                  border: "1px solid rgba(255,255,255,0.08)",
                  background: "rgba(255,255,255,0.03)",
                  color: "rgba(255,255,255,0.45)",
                  fontSize: 12,
                  cursor: "pointer",
                  fontFamily: "'Sora', sans-serif",
                  transition: "all 0.2s",
                }}
                onMouseEnter={(e) => {
                  e.target.style.background = "rgba(90,200,250,0.08)";
                  e.target.style.borderColor = "rgba(90,200,250,0.2)";
                  e.target.style.color = "#5ac8fa";
                }}
                onMouseLeave={(e) => {
                  e.target.style.background = "rgba(255,255,255,0.03)";
                  e.target.style.borderColor = "rgba(255,255,255,0.08)";
                  e.target.style.color = "rgba(255,255,255,0.45)";
                }}
              >
                {s}
              </button>
            ))}
          </div>
        )}

        {/* input */}
        <div
          style={{
            padding: "12px 16px",
            borderTop: "1px solid rgba(255,255,255,0.06)",
            background: "rgba(255,255,255,0.02)",
            flexShrink: 0,
          }}
        >
          <div
            style={{
              display: "flex",
              alignItems: "center",
              gap: 8,
              background: "rgba(255,255,255,0.04)",
              border: "1px solid rgba(255,255,255,0.08)",
              borderRadius: 10,
              padding: "4px 6px 4px 14px",
            }}
          >
            <input
              ref={inputRef}
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && send(input)}
              placeholder="Escribe un mensaje..."
              disabled={isStreaming}
              style={{
                flex: 1,
                background: "transparent",
                border: "none",
                outline: "none",
                color: "rgba(255,255,255,0.8)",
                fontSize: 13,
                fontFamily: "'Sora', sans-serif",
              }}
            />
            <button
              onClick={() => send(input)}
              disabled={!input.trim() || isStreaming}
              style={{
                width: 32,
                height: 32,
                borderRadius: 8,
                border: "none",
                background: input.trim() && !isStreaming ? "rgba(90,200,250,0.2)" : "rgba(255,255,255,0.04)",
                color: input.trim() && !isStreaming ? "#5ac8fa" : "rgba(255,255,255,0.15)",
                cursor: input.trim() && !isStreaming ? "pointer" : "default",
                fontSize: 16,
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                transition: "all 0.2s",
                flexShrink: 0,
              }}
            >
              ↑
            </button>
          </div>
          <div
            style={{
              textAlign: "center",
              marginTop: 8,
              fontSize: 10,
              color: "rgba(255,255,255,0.15)",
              fontFamily: "'JetBrains Mono', monospace",
            }}
          >
            mock demo · responses are pre-generated
          </div>
        </div>
      </div>
    </div>
  );
}
