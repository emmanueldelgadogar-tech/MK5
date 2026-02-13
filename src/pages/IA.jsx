import "../styles/ia.css";
import { useEffect, useRef, useState, useCallback } from "react";
import { useSearchParams, useNavigate, Link } from "react-router-dom";
import { API_BASE } from "../config";
import AsistenteMK5 from "../components/AsistenteMK5";

export default function IA() {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const initialQuery = searchParams.get("q") || "";

  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const hasSentInitial = useRef(false);

  const chatEndRef = useRef(null);
  const inputRef = useRef(null);

  // Auto-scroll al fondo cuando hay nuevos mensajes
  useEffect(() => {
    if (chatEndRef.current) {
      chatEndRef.current.scrollIntoView({ behavior: "smooth" });
    }
  }, [messages, loading]);

  const sendMessage = useCallback(async (text, prevMessages) => {
    const msg = (text || "").trim();
    if (!msg) return;

    const userMsg = { role: "user", content: msg };
    const updated = [...(prevMessages || []), userMsg];
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

      if (data && data.ok && data.reply) {
        setMessages((prev) => [...prev, { role: "assistant", content: data.reply }]);
      } else {
        setMessages((prev) => [
          ...prev,
          { role: "assistant", content: "Ups, hubo un problema. Intenta de nuevo." },
        ]);
      }
    } catch (err) {
      console.error("Error en assistant:", err);
      setMessages((prev) => [
        ...prev,
        { role: "assistant", content: "No pude conectar con el servidor. Intenta de nuevo." },
      ]);
    } finally {
      setLoading(false);
      if (inputRef.current) {
        inputRef.current.focus();
      }
    }
  }, []);

  // Si llega con ?q=..., enviar automáticamente (solo una vez)
  useEffect(() => {
    if (initialQuery && !hasSentInitial.current) {
      hasSentInitial.current = true;
      sendMessage(initialQuery, []);
    }
  }, [initialQuery, sendMessage]);

  const handleSubmit = (e) => {
    e.preventDefault();
    const msg = (input || "").trim();
    if (!msg || loading) return;
    sendMessage(msg, messages);
  };

  const handleSuggestion = (text) => {
    if (loading) return;
    sendMessage(text, messages);
  };

  // Regex para detectar medidas de llantas
  const MEDIDA_RE = /(\d{3}\/\d{2}(?:R|\/)\d{2})/gi;
  const MEDIDA_EXACT = /^\d{3}\/\d{2}(?:R|\/)\d{2}$/i;

  // Convierte medidas inline en links
  function renderMessageContent(text) {
    const parts = text.split(MEDIDA_RE);
    if (parts.length === 1) return text;

    return parts.map((part, idx) => {
      if (MEDIDA_EXACT.test(part)) {
        const medida = part.replace(/R/gi, "/");
        return (
          <Link key={idx} to={"/catalogo?medida=" + encodeURIComponent(medida)} className="ia-medida-link">
            {part}
          </Link>
        );
      }
      return part;
    });
  }

  // Extrae medidas únicas de un texto para los botones "Ver llantas"
  function getUniqueMedidas(text) {
    const matches = text.match(MEDIDA_RE);
    if (!matches) return [];
    const seen = new Set();
    return matches.filter((m) => {
      const norm = m.replace(/R/gi, "/");
      if (seen.has(norm)) return false;
      seen.add(norm);
      return true;
    });
  }

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
                Puedo recomendarte llantas por medida, auto, presupuesto o marca.
              </p>
              <div className="ia-suggestions">
                <button type="button" className="ia-suggestion" onClick={() => handleSuggestion("Llantas para Nissan March 2018")}>
                  Llantas para Nissan March 2018
                </button>
                <button type="button" className="ia-suggestion" onClick={() => handleSuggestion("Busco llanta 205/55/16 económica")}>
                  Busco llanta 205/55/16 económica
                </button>
                <button type="button" className="ia-suggestion" onClick={() => handleSuggestion("¿Qué marcas premium manejan?")}>
                  ¿Qué marcas premium manejan?
                </button>
                <button type="button" className="ia-suggestion" onClick={() => handleSuggestion("Llantas para Honda Civic 2020")}>
                  Llantas para Honda Civic 2020
                </button>
              </div>
            </div>
          ) : (
            <div className="ia-messages">
              {messages.map((m, i) => {
                const isAssistant = m.role === "assistant";
                const medidas = isAssistant ? getUniqueMedidas(m.content) : [];
                return (
                  <div key={i} className={"ia-msg ia-msg--" + m.role}>
                    {isAssistant && (
                      <div className="ia-msg__avatar">
                        <svg viewBox="0 0 36 36" fill="none" xmlns="http://www.w3.org/2000/svg">
                          <circle cx="18" cy="18" r="18" fill="#1a1a1a"/>
                          <circle cx="18" cy="18" r="11" stroke="#ff5202" strokeWidth="2.5" fill="none"/>
                          <circle cx="18" cy="18" r="4" fill="#ff5202"/>
                          <line x1="18" y1="7" x2="18" y2="11" stroke="#ff5202" strokeWidth="1.5" strokeLinecap="round"/>
                          <line x1="18" y1="25" x2="18" y2="29" stroke="#ff5202" strokeWidth="1.5" strokeLinecap="round"/>
                          <line x1="7" y1="18" x2="11" y2="18" stroke="#ff5202" strokeWidth="1.5" strokeLinecap="round"/>
                          <line x1="25" y1="18" x2="29" y2="18" stroke="#ff5202" strokeWidth="1.5" strokeLinecap="round"/>
                        </svg>
                      </div>
                    )}
                    <div className="ia-msg__bubble">
                      <div className="ia-msg__text">
                        {isAssistant ? renderMessageContent(m.content) : m.content}
                      </div>
                      {medidas.length > 0 && (
                        <div className="ia-ver-llantas">
                          {medidas.map((med) => {
                            const norm = med.replace(/R/gi, "/");
                            return (
                              <Link key={norm} to={"/catalogo?medida=" + encodeURIComponent(norm)} className="ia-ver-llantas__btn">
                                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                                  <circle cx="12" cy="12" r="10"/>
                                  <circle cx="12" cy="12" r="3"/>
                                </svg>
                                Ver llantas {med}
                              </Link>
                            );
                          })}
                        </div>
                      )}
                    </div>
                  </div>
                );
              })}

              {loading && (
                <div className="ia-msg ia-msg--assistant">
                  <div className="ia-msg__avatar">
                    <svg viewBox="0 0 36 36" fill="none" xmlns="http://www.w3.org/2000/svg">
                      <circle cx="18" cy="18" r="18" fill="#1a1a1a"/>
                      <circle cx="18" cy="18" r="11" stroke="#ff5202" strokeWidth="2.5" fill="none" strokeDasharray="4 3"/>
                      <circle cx="18" cy="18" r="4" fill="#ff5202">
                        <animate attributeName="opacity" values="1;.4;1" dur="1.5s" repeatCount="indefinite"/>
                      </circle>
                    </svg>
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
          />
          <button className="ia-send" type="submit" disabled={!input.trim() || loading}>
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <line x1="22" y1="2" x2="11" y2="13" />
              <polygon points="22 2 15 22 11 13 2 9 22 2" />
            </svg>
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
