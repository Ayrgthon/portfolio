import { useRef, useEffect } from "react";
import ReactMarkdown from "react-markdown";

function StreamingCursor() {
  return (
    <span style={{ display: "inline-block", width: 7, height: 16, background: "#5ac8fa", marginLeft: 2, verticalAlign: "text-bottom", borderRadius: 1, animation: "blink 0.8s step-end infinite" }} />
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
        {(msg.mcpCalls ?? []).length > 0 && (
          <div style={{ marginBottom: 8, paddingBottom: 7, borderBottom: "1px solid rgba(255,255,255,0.06)", display: "flex", flexWrap: "wrap", gap: 6 }}>
            {msg.mcpCalls.map((c) => (
              <span key={c.id} style={{ display: "inline-flex", alignItems: "center", gap: 4, fontSize: 11, fontFamily: "'JetBrains Mono', monospace", color: c.done ? "rgba(90,200,250,0.5)" : "rgba(255,255,255,0.25)" }}>
                <span style={{ fontSize: 10 }}>{c.done ? "✓" : "⟳"}</span>
                {c.tool}
              </span>
            ))}
          </div>
        )}
        <ReactMarkdown
          components={{
            p: ({ children }) => <p style={{ margin: "0 0 8px 0" }}>{children}</p>,
            ul: ({ children }) => <ul style={{ margin: "8px 0", paddingLeft: 20 }}>{children}</ul>,
            ol: ({ children }) => <ol style={{ margin: "8px 0", paddingLeft: 20 }}>{children}</ol>,
            li: ({ children }) => <li style={{ marginBottom: 4 }}>{children}</li>,
            strong: ({ children }) => <strong style={{ fontWeight: 600, color: "rgba(255,255,255,0.9)" }}>{children}</strong>,
          }}
        >
          {msg.text}
        </ReactMarkdown>
        {!isUser && isLast && msg.text === "" ? null : (!isUser && isLast ? <StreamingCursor /> : null)}
      </div>
    </div>
  );
}

const SUGGESTIONS = ["Experiencia", "Proyectos", "Stack", "Contacto"];

export default function Chatbot({ chatApi, onBack, onReset, onOpenFull }) {
  const { messages, input, setInput, isThinking, isStreaming, sendMessage } = chatApi;
  const scrollRef = useRef(null);

  useEffect(() => {
    const el = scrollRef.current;
    if (!el) return;
    const distanceFromBottom = el.scrollHeight - el.scrollTop - el.clientHeight;
    if (distanceFromBottom < 100) el.scrollTop = el.scrollHeight;
  }, [messages, isThinking]);

  return (
    <div style={{ height: "100vh", width: "100vw", background: "linear-gradient(145deg, #0a0a0c 0%, #111114 40%, #0d1117 100%)", display: "flex", alignItems: "center", justifyContent: "center", fontFamily: "'SF Pro Display', -apple-system, sans-serif" }}>
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

      <div style={{ position: "fixed", inset: 0, pointerEvents: "none", zIndex: 0, overflow: "hidden" }}>
        <div style={{ position: "absolute", width: 400, height: 400, borderRadius: "50%", background: "radial-gradient(circle, rgba(90,200,250,0.05) 0%, transparent 70%)", top: -50, right: -50 }} />
        <div style={{ position: "absolute", width: 300, height: 300, borderRadius: "50%", background: "radial-gradient(circle, rgba(168,85,247,0.04) 0%, transparent 70%)", bottom: 50, left: -50 }} />
      </div>

      <div style={{ position: "relative", zIndex: 1, width: "100%", maxWidth: 560, height: "85vh", maxHeight: 700, background: "rgba(22,22,26,0.92)", borderRadius: 14, border: "1px solid rgba(255,255,255,0.08)", backdropFilter: "blur(40px)", boxShadow: "0 24px 80px rgba(0,0,0,0.6), inset 0 1px 0 rgba(255,255,255,0.05)", display: "flex", flexDirection: "column", overflow: "hidden" }}>
        {/* title bar */}
        <div style={{ display: "flex", alignItems: "center", padding: "12px 16px", borderBottom: "1px solid rgba(255,255,255,0.06)", background: "rgba(255,255,255,0.02)", flexShrink: 0 }}>
          <div style={{ display: "flex", gap: 6 }}>
            <span onClick={onBack} style={{ width: 12, height: 12, borderRadius: "50%", background: "#ff5f57", cursor: "pointer" }} title="Cerrar" />
            <span onClick={onBack} style={{ width: 12, height: 12, borderRadius: "50%", background: "#febc2e", cursor: "pointer" }} title="Minimizar" />
            <span onClick={onOpenFull} style={{ width: 12, height: 12, borderRadius: "50%", background: "#28c840", cursor: "pointer" }} title="Fullscreen" />
          </div>
          <div style={{ flex: 1, textAlign: "center" }}>
            <span style={{ fontSize: 12, color: "rgba(255,255,255,0.35)", fontFamily: "'JetBrains Mono', monospace", letterSpacing: 0.5 }}>
              aura-assistant — RAG chatbot
            </span>
          </div>
          <div style={{ display: "flex", alignItems: "center", gap: 5 }}>
            <span style={{ width: 6, height: 6, borderRadius: "50%", background: "#28c840", animation: "pulse 2s infinite" }} />
            <span style={{ fontSize: 10, color: "rgba(255,255,255,0.25)" }}>online</span>
          </div>
        </div>

        {/* model badge */}
        <div style={{ padding: "8px 16px", borderBottom: "1px solid rgba(255,255,255,0.04)", display: "flex", alignItems: "center", justifyContent: "center", gap: 8, flexShrink: 0 }}>
          <span style={{ fontSize: 10, padding: "3px 8px", borderRadius: 4, background: "rgba(90,200,250,0.08)", border: "1px solid rgba(90,200,250,0.12)", color: "rgba(90,200,250,0.6)", fontFamily: "'JetBrains Mono', monospace", letterSpacing: 0.5 }}>
            gemma4:31b
          </span>
          <span style={{ fontSize: 10, color: "rgba(255,255,255,0.2)" }}>·</span>
          <span style={{ fontSize: 10, color: "rgba(255,255,255,0.2)", fontFamily: "'JetBrains Mono', monospace" }}>RAG · perfil profesional</span>
        </div>

        {/* messages */}
        <div ref={scrollRef} style={{ flex: 1, overflowY: "auto", padding: "16px 16px 8px" }}>
          {messages.map((m, i) => (
            <Bubble key={i} msg={{ ...m, role: m.from === "user" ? "user" : "bot" }} isLast={i === messages.length - 1 && isStreaming} />
          ))}

          {isThinking && (
            <div style={{ display: "flex", alignItems: "center", gap: 8, animation: "fadeIn 0.2s ease", marginBottom: 8 }}>
              <div style={{ width: 28, height: 28, borderRadius: 8, background: "linear-gradient(135deg, rgba(90,200,250,0.2), rgba(168,85,247,0.2))", border: "1px solid rgba(90,200,250,0.15)", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 13, flexShrink: 0 }}>✦</div>
              <div style={{ padding: "10px 16px", borderRadius: "14px 14px 14px 4px", background: "rgba(255,255,255,0.05)", border: "1px solid rgba(255,255,255,0.06)", display: "flex", gap: 5 }}>
                {[0, 1, 2].map((i) => <span key={i} style={{ width: 5, height: 5, borderRadius: "50%", background: "rgba(255,255,255,0.3)", animation: `pulse 1s ease ${i * 0.2}s infinite` }} />)}
              </div>
            </div>
          )}
        </div>

        {/* suggestions */}
        {messages.length <= 2 && !isThinking && !isStreaming && (
          <div style={{ padding: "0 16px 8px", display: "flex", gap: 6, flexWrap: "wrap", flexShrink: 0 }}>
            {SUGGESTIONS.map((s) => (
              <button key={s} onClick={() => sendMessage(s)}
                style={{ padding: "6px 14px", borderRadius: 20, border: "1px solid rgba(255,255,255,0.08)", background: "rgba(255,255,255,0.03)", color: "rgba(255,255,255,0.45)", fontSize: 12, cursor: "pointer", fontFamily: "'Sora', sans-serif", transition: "all 0.2s" }}
                onMouseEnter={(e) => { e.target.style.background = "rgba(90,200,250,0.08)"; e.target.style.borderColor = "rgba(90,200,250,0.2)"; e.target.style.color = "#5ac8fa"; }}
                onMouseLeave={(e) => { e.target.style.background = "rgba(255,255,255,0.03)"; e.target.style.borderColor = "rgba(255,255,255,0.08)"; e.target.style.color = "rgba(255,255,255,0.45)"; }}
              >{s}</button>
            ))}
          </div>
        )}

        {/* input */}
        <div style={{ padding: "12px 16px", borderTop: "1px solid rgba(255,255,255,0.06)", background: "rgba(255,255,255,0.02)", flexShrink: 0 }}>
          <div style={{ display: "flex", alignItems: "center", gap: 8, background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.08)", borderRadius: 10, padding: "4px 6px 4px 14px" }}>
            <input
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && sendMessage(input)}
              placeholder="Escribe un mensaje..."
              disabled={isThinking || isStreaming}
              style={{ flex: 1, background: "transparent", border: "none", outline: "none", color: "rgba(255,255,255,0.8)", fontSize: 13, fontFamily: "'Sora', sans-serif" }}
            />
            <button onClick={() => sendMessage(input)} disabled={!input.trim() || isThinking || isStreaming}
              style={{ width: 32, height: 32, borderRadius: 8, border: "none", background: input.trim() && !isThinking && !isStreaming ? "rgba(90,200,250,0.2)" : "rgba(255,255,255,0.04)", color: input.trim() && !isThinking && !isStreaming ? "#5ac8fa" : "rgba(255,255,255,0.15)", cursor: input.trim() && !isThinking && !isStreaming ? "pointer" : "default", fontSize: 16, display: "flex", alignItems: "center", justifyContent: "center", transition: "all 0.2s", flexShrink: 0 }}
            >↑</button>
          </div>
          <div style={{ textAlign: "center", marginTop: 8, fontSize: 10, color: "rgba(255,255,255,0.15)", fontFamily: "'JetBrains Mono', monospace" }}>
            powered by aura · RAG sobre perfil profesional
          </div>
        </div>
      </div>
    </div>
  );
}
