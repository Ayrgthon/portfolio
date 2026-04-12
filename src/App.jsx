import { useState, useRef, useEffect, useCallback } from "react";
import Portfolio from "./portfolio-mockup";
import Chatbot from "./chatbot-mockup";
import ChatbotFull from "./chatbot-full";
import VoicebotWindow from "./voicebot-window";
import VoicebotFull from "./voicebot-full";
import { useAuraVoice } from "./useAuraVoice";

const AURA_BASE_URL = import.meta.env.VITE_AURA_BASE_URL ?? "http://localhost:8001";

const INITIAL_MESSAGES = [
  {
    from: "bot",
    text: "Soy Aura, asistente personal de Ayrgthon. Puedo contarte sobre su experiencia, proyectos y stack de AI. Escribe cualquier mensaje y te respondo.",
  },
];

function useChatApi() {
  const [messages, setMessages] = useState(INITIAL_MESSAGES);
  const [input, setInput] = useState("");
  const [isThinking, setIsThinking] = useState(false);
  const [isStreaming, setIsStreaming] = useState(false);
  const [conversationId, setConversationId] = useState(null);
  const [token, setToken] = useState(null);
  const tokenRef = useRef(null);
  const abortRef = useRef(null);

  useEffect(() => {
    (async () => {
      try {
        const loginRes = await fetch(`${AURA_BASE_URL}/auth/login`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ username: "portfolio", password: "portfolio-guest" }),
        });
        const { token: t } = await loginRes.json();
        tokenRef.current = t;
        setToken(t);

        // conversación se crea lazy en el primer mensaje
      } catch {}
    })();

    return () => abortRef.current?.abort();
  }, []);

  const getOrCreateConversation = async () => {
    if (conversationId) return conversationId;
    const convRes = await fetch(`${AURA_BASE_URL}/conversations`, {
      method: "POST",
      headers: { "Content-Type": "application/json", Authorization: `Bearer ${tokenRef.current}` },
      body: JSON.stringify({ title: "Portfolio visit" }),
    });
    const conv = await convRes.json();
    setConversationId(conv.id);
    return conv.id;
  };

  const sendMessage = async (rawText) => {
    const text = rawText.trim();
    if (!text || isThinking || isStreaming) return;

    setMessages((prev) => [...prev, { from: "user", text }]);
    setInput("");
    setIsThinking(true);

    abortRef.current = new AbortController();

    try {
      const convId = await getOrCreateConversation();
      const res = await fetch(`${AURA_BASE_URL}/conversations/${convId}/messages`, {
        method: "POST",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${tokenRef.current}` },
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
                next[next.length - 1] = {
                  ...next[next.length - 1],
                  text: next[next.length - 1].text + data.content,
                };
                return next;
              });
            } else if (eventType === "mcp_start") {
              setMessages((prev) => {
                const next = [...prev];
                const last = next[next.length - 1];
                next[next.length - 1] = {
                  ...last,
                  mcpCalls: [...(last.mcpCalls ?? []), { id: data.id, tool: data.tool, done: false }],
                };
                return next;
              });
            } else if (eventType === "mcp_result") {
              setMessages((prev) => {
                const next = [...prev];
                const last = next[next.length - 1];
                next[next.length - 1] = {
                  ...last,
                  mcpCalls: (last.mcpCalls ?? []).map((c) =>
                    c.id === data.id ? { ...c, done: true } : c
                  ),
                };
                return next;
              });
            }
          }
        }
      }
    } catch (e) {
      if (e.name !== "AbortError") {
        setIsThinking(false);
        setMessages((prev) => [
          ...prev,
          { from: "bot", text: "No pude conectarme con Aura en este momento." },
        ]);
      }
    } finally {
      setIsStreaming(false);
    }
  };

  const resetChat = () => {
    setMessages(INITIAL_MESSAGES);
    setInput("");
    setIsThinking(false);
    setIsStreaming(false);
    setConversationId(null);
  };

  return { messages, input, setInput, isThinking, isStreaming, sendMessage, resetChat, token };
}

function App() {
  const [view, setView] = useState("portfolio");
  const [exiting, setExiting] = useState(false);
  const chatApi = useChatApi();
  const voiceApi = useAuraVoice();

  const goTo = (target) => {
    if (view === "portfolio") {
      setView(target);
    } else {
      setExiting(true);
      // handled in handleExitEnd
      pendingView.current = target;
    }
  };
  const pendingView = useRef(null);

  const maximize = () => setView("chatbot");
  const goFull = () => setView("full");

  const minimize = () => {
    pendingView.current = "portfolio";
    setExiting(true);
  };

  const handleExitEnd = () => {
    if (exiting) {
      setExiting(false);
      setView(pendingView.current ?? "portfolio");
      pendingView.current = null;
    }
  };

  const overlay = view !== "portfolio";

  useEffect(() => {
    const handler = (e) => { if (e.key === "Escape" && overlay) minimize(); };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, [overlay]);

  const goVoiceWindow = () => { pendingView.current = "voice-window"; setExiting(true); };
  const goVoiceFull   = () => { pendingView.current = "voice-full";   setExiting(true); };

  return (
    <>
      <Portfolio
        chatApi={chatApi}
        voiceApi={voiceApi}
        onMaximize={maximize}
        onOpenFull={goFull}
        onVoiceMaximize={() => setView("voice-window")}
        onVoiceOpenFull={() => setView("voice-full")}
      />

      {overlay && (
        <div
          onAnimationEnd={handleExitEnd}
          style={{ position: "fixed", inset: 0, zIndex: 999, animation: exiting ? "macWindowClose 0.22s cubic-bezier(0.4, 0, 1, 1) forwards" : "macWindowOpen 0.25s cubic-bezier(0, 0, 0.2, 1) forwards" }}
        >
          {view === "chatbot" && (
            <Chatbot chatApi={chatApi} onBack={minimize} onReset={chatApi.resetChat} onOpenFull={() => { pendingView.current = "full"; setExiting(true); }} />
          )}
          {view === "full" && (
            <ChatbotFull token={chatApi.token} onBack={minimize} onMinimize={() => { pendingView.current = "chatbot"; setExiting(true); }} />
          )}
          {view === "voice-window" && (
            <VoicebotWindow voiceApi={voiceApi} onBack={minimize} onOpenFull={() => { pendingView.current = "voice-full"; setExiting(true); }} />
          )}
          {view === "voice-full" && (
            <VoicebotFull voiceApi={voiceApi} onBack={minimize} onMinimize={() => { pendingView.current = "voice-window"; setExiting(true); }} />
          )}
        </div>
      )}

      <style>{`
        @keyframes macWindowOpen {
          from { opacity: 0; transform: scale(0.88); }
          to   { opacity: 1; transform: scale(1); }
        }
        @keyframes macWindowClose {
          from { opacity: 1; transform: scale(1); }
          to   { opacity: 0; transform: scale(0.88); }
        }
      `}</style>
    </>
  );
}

export default App;
