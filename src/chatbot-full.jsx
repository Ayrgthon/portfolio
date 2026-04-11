import { useState, useRef, useEffect } from "react";

const AURA_BASE_URL = import.meta.env.VITE_AURA_BASE_URL ?? "http://localhost:8000";

function authHeaders(token) {
  return { "Content-Type": "application/json", Authorization: `Bearer ${token}` };
}

/* ── message bubble ── */
function Bubble({ msg, isStreaming }) {
  const isUser = msg.from === "user";
  const calls = msg.mcpCalls ?? [];

  return (
    <div style={{ display: "flex", justifyContent: isUser ? "flex-end" : "flex-start", marginBottom: 12, animation: "cfadeIn 0.2s ease" }}>
      {!isUser && (
        <div style={{ width: 30, height: 30, borderRadius: 9, background: "linear-gradient(135deg, rgba(90,200,250,0.18), rgba(168,85,247,0.18))", border: "1px solid rgba(90,200,250,0.14)", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 14, marginRight: 10, marginTop: 2, flexShrink: 0 }}>
          ✦
        </div>
      )}
      <div style={{ maxWidth: "72%", padding: "10px 14px", borderRadius: isUser ? "14px 14px 4px 14px" : "14px 14px 14px 4px", background: isUser ? "rgba(90,200,250,0.1)" : "rgba(255,255,255,0.05)", border: `1px solid ${isUser ? "rgba(90,200,250,0.16)" : "rgba(255,255,255,0.07)"}`, fontSize: 13.5, lineHeight: 1.65, color: isUser ? "#b8e4f8" : "rgba(255,255,255,0.75)" }}>
        {calls.length > 0 && (
          <div style={{ marginBottom: 8, paddingBottom: 7, borderBottom: "1px solid rgba(255,255,255,0.06)", display: "flex", flexWrap: "wrap", gap: 6 }}>
            {calls.map((c) => (
              <span key={c.id} style={{ display: "inline-flex", alignItems: "center", gap: 4, fontSize: 11, fontFamily: "'JetBrains Mono', monospace", color: c.done ? "rgba(90,200,250,0.5)" : "rgba(255,255,255,0.25)" }}>
                <span style={{ fontSize: 10 }}>{c.done ? "✓" : "⟳"}</span>
                {c.tool}
              </span>
            ))}
          </div>
        )}
        {msg.text}
        {!isUser && isStreaming && (
          <span style={{ display: "inline-block", width: 7, height: 14, marginLeft: 3, background: "#5ac8fa", borderRadius: 1, verticalAlign: "text-bottom", animation: "cblink 0.8s step-end infinite" }} />
        )}
      </div>
    </div>
  );
}

/* ── sidebar conversation item ── */
function ConvItem({ conv, active, onClick }) {
  return (
    <div
      onClick={onClick}
      style={{
        padding: "9px 14px",
        borderRadius: 8,
        cursor: "pointer",
        background: active ? "rgba(90,200,250,0.1)" : "transparent",
        border: `1px solid ${active ? "rgba(90,200,250,0.18)" : "transparent"}`,
        transition: "all 0.15s",
        marginBottom: 2,
      }}
      onMouseEnter={(e) => { if (!active) e.currentTarget.style.background = "rgba(255,255,255,0.04)"; }}
      onMouseLeave={(e) => { if (!active) e.currentTarget.style.background = "transparent"; }}
    >
      <div style={{ fontSize: 12.5, color: active ? "#a9ddf5" : "rgba(255,255,255,0.6)", whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis", fontWeight: active ? 500 : 400 }}>
        {conv.title || "Conversación"}
      </div>
      <div style={{ fontSize: 10, color: "rgba(255,255,255,0.25)", marginTop: 2, fontFamily: "'JetBrains Mono', monospace" }}>
        {new Date(conv.updated_at).toLocaleDateString("es", { day: "numeric", month: "short" })}
      </div>
    </div>
  );
}

export default function ChatbotFull({ token, onBack, onMinimize }) {
  const [conversations, setConversations] = useState([]);
  const [activeConvId, setActiveConvId] = useState(null);
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState("");
  const [isThinking, setIsThinking] = useState(false);
  const [isStreaming, setIsStreaming] = useState(false);
  const scrollRef = useRef(null);
  const abortRef = useRef(null);
  const inputRef = useRef(null);

  /* auto-scroll */
  useEffect(() => {
    const el = scrollRef.current;
    if (!el) return;
    if (el.scrollHeight - el.scrollTop - el.clientHeight < 100) el.scrollTop = el.scrollHeight;
  }, [messages, isThinking]);

  useEffect(() => () => abortRef.current?.abort(), []);

  /* load conversations on mount */
  useEffect(() => {
    if (!token) return;
    (async () => {
      try {
        const res = await fetch(`${AURA_BASE_URL}/conversations`, { headers: authHeaders(token) });
        const data = await res.json();
        setConversations(data);
        if (data.length > 0) loadConversation(data[0].id, token);
        else createConversation(token);
      } catch {}
    })();
  }, [token]);

  const loadConversation = async (convId, tkn = token) => {
    setActiveConvId(convId);
    setMessages([]);
    try {
      const res = await fetch(`${AURA_BASE_URL}/conversations/${convId}/messages`, { headers: authHeaders(tkn) });
      const data = await res.json();
      setMessages(data.map((m) => ({ from: m.role === "user" ? "user" : "bot", text: m.content, mcpCalls: m.mcp_calls })));
    } catch {}
  };

  const createConversation = async (tkn = token) => {
    try {
      const res = await fetch(`${AURA_BASE_URL}/conversations`, {
        method: "POST",
        headers: authHeaders(tkn),
        body: JSON.stringify({ title: "Nueva conversación" }),
      });
      const conv = await res.json();
      setConversations((prev) => [conv, ...prev]);
      setActiveConvId(conv.id);
      setMessages([]);
      return conv.id;
    } catch {}
  };

  const updateConvTitle = (convId, title) => {
    setConversations((prev) => prev.map((c) => c.id === convId ? { ...c, title } : c));
  };

  const resetConv = async () => {
    abortRef.current?.abort();
    setMessages([]);
    setInput("");
    setIsThinking(false);
    setIsStreaming(false);
    await createConversation();
  };

  const sendMessage = async (rawText) => {
    const text = rawText.trim();
    if (!text || isThinking || isStreaming) return;

    let convId = activeConvId;
    if (!convId) convId = await createConversation();
    if (!convId) return;

    setMessages((prev) => [...prev, { from: "user", text }]);
    setInput("");
    setIsThinking(true);

    // Auto-title on first user message
    const isFirst = messages.length === 0;
    if (isFirst) updateConvTitle(convId, text.slice(0, 45) + (text.length > 45 ? "…" : ""));

    abortRef.current = new AbortController();

    try {
      const res = await fetch(`${AURA_BASE_URL}/conversations/${convId}/messages`, {
        method: "POST",
        headers: authHeaders(token),
        body: JSON.stringify({ content: text }),
        signal: abortRef.current.signal,
      });

      setIsThinking(false);
      setIsStreaming(true);
      setMessages((prev) => [...prev, { from: "bot", text: "" }]);

      const reader = res.body.getReader();
      const decoder = new TextDecoder();
      let buffer = "";
      let eventType = "";

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;
        buffer += decoder.decode(value, { stream: true });
        const lines = buffer.split("\n");
        buffer = lines.pop();

        for (const line of lines) {
          if (line.startsWith("event:")) {
            eventType = line.slice(6).trim();
          } else if (line.startsWith("data:")) {
            const data = JSON.parse(line.slice(5).trim());
            if (eventType === "text_delta") {
              setMessages((prev) => {
                const next = [...prev];
                next[next.length - 1] = { ...next[next.length - 1], text: next[next.length - 1].text + data.content };
                return next;
              });
            } else if (eventType === "mcp_start") {
              setMessages((prev) => {
                const next = [...prev];
                const last = next[next.length - 1];
                next[next.length - 1] = { ...last, mcpCalls: [...(last.mcpCalls ?? []), { id: data.id, tool: data.tool, done: false }] };
                return next;
              });
            } else if (eventType === "mcp_result") {
              setMessages((prev) => {
                const next = [...prev];
                const last = next[next.length - 1];
                next[next.length - 1] = { ...last, mcpCalls: (last.mcpCalls ?? []).map((c) => c.id === data.id ? { ...c, done: true } : c) };
                return next;
              });
            }
          }
        }
      }
    } catch (e) {
      if (e.name !== "AbortError") {
        setIsThinking(false);
        setMessages((prev) => [...prev, { from: "bot", text: "No pude conectarme con Aura en este momento." }]);
      }
    } finally {
      setIsStreaming(false);
    }
  };

  return (
    <div style={{ height: "100vh", width: "100vw", background: "linear-gradient(145deg, #0a0a0c 0%, #111114 40%, #0d1117 100%)", display: "flex", flexDirection: "column", fontFamily: "'SF Pro Display', -apple-system, sans-serif" }}>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=JetBrains+Mono:wght@400;500&family=Sora:wght@300;400;500;600&display=swap');
        * { margin: 0; padding: 0; box-sizing: border-box; }
        @keyframes cfadeIn { from { opacity: 0; transform: translateY(5px); } to { opacity: 1; transform: translateY(0); } }
        @keyframes cblink { 50% { opacity: 0; } }
        @keyframes cpulse { 0%,100% { opacity: 0.4; } 50% { opacity: 1; } }
        ::-webkit-scrollbar { width: 4px; }
        ::-webkit-scrollbar-track { background: transparent; }
        ::-webkit-scrollbar-thumb { background: rgba(255,255,255,0.07); border-radius: 2px; }
      `}</style>

      {/* title bar */}
      <div style={{ display: "flex", alignItems: "center", padding: "12px 18px", borderBottom: "1px solid rgba(255,255,255,0.06)", background: "rgba(10,10,12,0.8)", backdropFilter: "blur(20px)", flexShrink: 0, WebkitAppRegion: "drag" }}>
        <div style={{ display: "flex", gap: 7, WebkitAppRegion: "no-drag" }}>
          <span onClick={onBack} style={{ width: 12, height: 12, borderRadius: "50%", background: "#ff5f57", cursor: "pointer" }} title="Cerrar" />
          <span onClick={onMinimize} style={{ width: 12, height: 12, borderRadius: "50%", background: "#febc2e", cursor: "pointer" }} title="Minimizar" />
          <span onClick={onMinimize} style={{ width: 12, height: 12, borderRadius: "50%", background: "#28c840", cursor: "pointer" }} title="Ventana" />
        </div>
        <div style={{ flex: 1, textAlign: "center" }}>
          <span style={{ fontSize: 12, color: "rgba(255,255,255,0.3)", fontFamily: "'JetBrains Mono', monospace", letterSpacing: 0.5 }}>
            aura-assistant — RAG chatbot
          </span>
        </div>
        <div style={{ display: "flex", alignItems: "center", gap: 5, width: 70, justifyContent: "flex-end" }}>
          <span style={{ width: 6, height: 6, borderRadius: "50%", background: "#28c840", animation: "cpulse 2s infinite" }} />
          <span style={{ fontSize: 10, color: "rgba(255,255,255,0.22)", fontFamily: "'JetBrains Mono', monospace" }}>online</span>
        </div>
      </div>

      {/* body */}
      <div style={{ flex: 1, display: "flex", overflow: "hidden" }}>

        {/* sidebar */}
        <div style={{ width: 220, borderRight: "1px solid rgba(255,255,255,0.05)", display: "flex", flexDirection: "column", background: "rgba(8,8,10,0.6)", flexShrink: 0 }}>
          <div style={{ padding: "14px 12px 10px" }}>
            <button
              onClick={() => createConversation()}
              style={{ width: "100%", padding: "8px 12px", borderRadius: 8, border: "1px solid rgba(255,255,255,0.1)", background: "rgba(255,255,255,0.04)", color: "rgba(255,255,255,0.6)", fontSize: 12, cursor: "pointer", display: "flex", alignItems: "center", gap: 7, fontFamily: "'Sora', sans-serif", transition: "all 0.15s" }}
              onMouseEnter={(e) => { e.currentTarget.style.background = "rgba(90,200,250,0.08)"; e.currentTarget.style.borderColor = "rgba(90,200,250,0.2)"; e.currentTarget.style.color = "#5ac8fa"; }}
              onMouseLeave={(e) => { e.currentTarget.style.background = "rgba(255,255,255,0.04)"; e.currentTarget.style.borderColor = "rgba(255,255,255,0.1)"; e.currentTarget.style.color = "rgba(255,255,255,0.6)"; }}
            >
              <span style={{ fontSize: 15, lineHeight: 1 }}>+</span> Nueva conversación
            </button>
          </div>

          <div style={{ flex: 1, overflowY: "auto", padding: "0 8px 12px" }}>
            {conversations.length === 0 && (
              <div style={{ padding: "20px 8px", fontSize: 11, color: "rgba(255,255,255,0.2)", textAlign: "center", fontFamily: "'JetBrains Mono', monospace" }}>
                sin conversaciones
              </div>
            )}
            {conversations.map((conv) => (
              <ConvItem key={conv.id} conv={conv} active={conv.id === activeConvId} onClick={() => loadConversation(conv.id)} />
            ))}
          </div>

          <div style={{ padding: "10px 14px 14px", borderTop: "1px solid rgba(255,255,255,0.05)" }}>
            <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
              <span style={{ fontSize: 10, padding: "2px 7px", borderRadius: 4, background: "rgba(90,200,250,0.08)", border: "1px solid rgba(90,200,250,0.12)", color: "rgba(90,200,250,0.55)", fontFamily: "'JetBrains Mono', monospace" }}>gemma4:31b</span>
              <span style={{ fontSize: 10, color: "rgba(255,255,255,0.18)", fontFamily: "'JetBrains Mono', monospace" }}>· RAG</span>
            </div>
          </div>
        </div>

        {/* chat area */}
        <div style={{ flex: 1, display: "flex", flexDirection: "column", overflow: "hidden" }}>
          {/* messages */}
          <div ref={scrollRef} style={{ flex: 1, overflowY: "auto", padding: "24px 28px 12px" }}>
            {messages.length === 0 && !isThinking && (
              <div style={{ display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", height: "100%", gap: 16, opacity: 0.4 }}>
                <div style={{ fontSize: 36 }}>✦</div>
                <div style={{ fontSize: 13, color: "rgba(255,255,255,0.5)", fontFamily: "'Sora', sans-serif" }}>Empieza una conversación</div>
              </div>
            )}

            {messages.map((msg, i) => (
              <Bubble key={i} msg={msg} isStreaming={isStreaming && i === messages.length - 1} />
            ))}

            {isThinking && (
              <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 12, animation: "cfadeIn 0.2s ease" }}>
                <div style={{ width: 30, height: 30, borderRadius: 9, background: "linear-gradient(135deg, rgba(90,200,250,0.18), rgba(168,85,247,0.18))", border: "1px solid rgba(90,200,250,0.14)", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 14, flexShrink: 0 }}>✦</div>
                <div style={{ padding: "10px 16px", borderRadius: "14px 14px 14px 4px", background: "rgba(255,255,255,0.05)", border: "1px solid rgba(255,255,255,0.07)", display: "flex", gap: 5 }}>
                  {[0, 1, 2].map((i) => <span key={i} style={{ width: 5, height: 5, borderRadius: "50%", background: "rgba(255,255,255,0.3)", animation: `cpulse 1s ease ${i * 0.18}s infinite` }} />)}
                </div>
              </div>
            )}
          </div>

          {/* input */}
          <div style={{ padding: "14px 28px 20px", borderTop: "1px solid rgba(255,255,255,0.05)", background: "rgba(8,8,10,0.4)", flexShrink: 0 }}>
            <div style={{ display: "flex", alignItems: "center", gap: 10, background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.09)", borderRadius: 12, padding: "6px 8px 6px 16px" }}>
              <input
                ref={inputRef}
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && !e.shiftKey && sendMessage(input)}
                placeholder="Escribe un mensaje..."
                disabled={isThinking || isStreaming}
                style={{ flex: 1, background: "transparent", border: "none", outline: "none", color: "rgba(255,255,255,0.85)", fontSize: 13.5, fontFamily: "'Sora', sans-serif" }}
              />
              <button
                onClick={() => sendMessage(input)}
                disabled={!input.trim() || isThinking || isStreaming}
                style={{ width: 34, height: 34, borderRadius: 9, border: "none", background: input.trim() && !isThinking && !isStreaming ? "rgba(90,200,250,0.2)" : "rgba(255,255,255,0.04)", color: input.trim() && !isThinking && !isStreaming ? "#5ac8fa" : "rgba(255,255,255,0.15)", cursor: input.trim() && !isThinking && !isStreaming ? "pointer" : "default", fontSize: 16, display: "flex", alignItems: "center", justifyContent: "center", transition: "all 0.2s", flexShrink: 0 }}
              >↑</button>
            </div>
            <div style={{ marginTop: 8, fontSize: 10, color: "rgba(255,255,255,0.14)", textAlign: "center", fontFamily: "'JetBrains Mono', monospace" }}>
              powered by aura · RAG sobre perfil profesional
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
