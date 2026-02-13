import "../styles/ia.css";
import { useEffect, useRef, useState } from "react";
import { useSearchParams, useNavigate } from "react-router-dom";
import { API_BASE } from "../config";
import AsistenteMK5 from "../components/AsistenteMK5";

export default function IA() {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const initialQuery = searchParams.get("q") || "";

  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [started, setStarted] = useState(false);

  const chatEndRef = useRef(null);
  const inputRef = useRef(null);

  // Auto-scroll al fondo cuando hay nuevos mensajes
  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, loading]);

  // Si llega con ?q=..., enviar automáticamente
  useEffect(() => {
    if (initialQuery && !started) {
      setStarted(true);
      sendMessage(initialQuery);
    }
  }, [initialQuery]);

  async function sendMessage(text) {
    const msg = (text || "").trim();
    if (!msg || loading) return;

    const userMsg = { role: "user", content: msg };
    const updated = [...messages, userMsg];
    setMessages(updated);
    setInput("");
    setLoading(true);

    try {
      const r = await fetch(`${API_BASE}/api/assistant`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ messages: updated }),
      });

      const data = await r.json();

      if (data?.ok && data.reply) {
        setMessages((prev) => [...prev, { role: "assistant", content: data.reply }]);
      } else {
        setMessages((prev) => [
          ...prev,
          { role: "assistant", content: "Ups, hubo un problema. Intenta de nuevo." },
        ]);
      }
    } catch {
      setMessages((prev) => [
        ...prev,
        { role: "assistant", content: "No pude conectar con el servidor. Intenta de nuevo." },
      ]);
    } finally {
      setLoading(false);
      inputRef.current?.focus();
    }
  }

  const handleSubmit = (e) => {
    e.preventDefault();
    sendMessage(input);
  };

  return (
    <main className="ia-page">
      <div className="ia-container">
        {/* Header */}
        <div className="ia-header">
          <div className="ia-header__robot">
            <AsistenteMK5 />
          </div>
          <div className="ia-header__info">
            <h1 className="ia-header__title">Asistente MK5</h1>
            <p className="ia-header__sub">
              Inteligencia artificial para encontrar tu llanta ideal
            </p>
          </div>
        </div>

        {/* Chat area */}
        <div className="ia-chat">
          {messages.length === 0 && !loading ? (
            <div className="ia-empty">
              <div className="ia-empty__icon">🛞</div>
              <h2>Pregunta lo que necesites</h2>
              <p>
                Puedo recomendarte llantas por medida, auto, presupuesto o marca. Dime, ¿en
                qué te ayudo?
              </p>
              <div className="ia-suggestions">
                {[
                  "Llantas para Nissan March 2018",
                  "Busco llanta 205/55/16 económica",
                  "¿Qué marcas premium manejan?",
                  "Llantas para Honda Civic 2020",
                ].map((s) => (
                  <button
                    key={s}
                    type="button"
                    className="ia-suggestion"
                    onClick={() => sendMessage(s)}
                  >
                    {s}
                  </button>
                ))}
              </div>
            </div>
          ) : (
            <div className="ia-messages">
              {messages.map((m, i) => (
                <div key={i} className={`ia-msg ia-msg--${m.role}`}>
                  {m.role === "assistant" && (
                    <div className="ia-msg__avatar">
                      <AsistenteMK5 />
                    </div>
                  )}
                  <div className="ia-msg__bubble">
                    <div className="ia-msg__text">{m.content}</div>
                  </div>
                </div>
              ))}

              {loading && (
                <div className="ia-msg ia-msg--assistant">
                  <div className="ia-msg__avatar">
                    <AsistenteMK5 />
                  </div>
                  <div className="ia-msg__bubble">
                    <div className="ia-typing">
                      <span></span>
                      <span></span>
                      <span></span>
                    </div>
                  </div>
                </div>
              )}

              <div ref={chatEndRef} />
            </div>
          )}
        </div>

        {/* Input */}
        <form className="ia-input-bar" onSubmit={handleSubmit}>
          <input
            ref={inputRef}
            className="ia-input"
            type="text"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder="Escribe tu pregunta..."
            disabled={loading}
            autoFocus
          />
          <button className="ia-send" type="submit" disabled={!input.trim() || loading}>
            {loading ? (
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <circle cx="12" cy="12" r="10" strokeDasharray="32" strokeDashoffset="32">
                  <animate attributeName="stroke-dashoffset" values="32;0" dur="1s" repeatCount="indefinite" />
                </circle>
              </svg>
            ) : (
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <line x1="22" y1="2" x2="11" y2="13" />
                <polygon points="22 2 15 22 11 13 2 9 22 2" />
              </svg>
            )}
          </button>
        </form>

        {/* Actions */}
        <div className="ia-actions">
          <button type="button" className="ia-action-btn" onClick={() => navigate("/catalogo")}>
            Ver catálogo completo
          </button>
          <button type="button" className="ia-action-btn ia-action-btn--secondary" onClick={() => navigate("/")}>
            Volver al inicio
          </button>
        </div>
      </div>
    </main>
  );
}
