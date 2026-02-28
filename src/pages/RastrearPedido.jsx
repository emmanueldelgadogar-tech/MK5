import { useState } from "react";
import { Link } from "react-router-dom";
import "../styles/pages.css";
import "../styles/cuenta.css";
import { API_BASE } from "../config";

// Solo permitir URLs de proveedores de pago conocidos
const SAFE_PAYMENT_HOSTS = new Set([
  "www.mercadopago.com.mx", "www.mercadopago.com", "mercadopago.com",
  "www.paypal.com", "sandbox.paypal.com", "www.sandbox.paypal.com",
]);

function isSafePaymentUrl(url) {
  if (!url) return false;
  try {
    const { protocol, hostname } = new URL(url);
    return (protocol === "https:" || protocol === "http:") && SAFE_PAYMENT_HOSTS.has(hostname);
  } catch { return false; }
}

const ORDER_STEPS = [
  { key: "received",   label: "Pedido recibido",  icon: "📋", desc: "Tu orden fue recibida correctamente." },
  { key: "processing", label: "En preparación",   icon: "⚙️", desc: "Estamos preparando tus llantas." },
  { key: "shipped",    label: "En camino",         icon: "🚚", desc: "Tu paquete está en camino." },
  { key: "delivered",  label: "Entregado",         icon: "✅", desc: "¡Tu pedido fue entregado con éxito!" },
];

function getActiveStep(status) {
  if (!status) return 0;
  const s = String(status).toLowerCase();
  if (s === "delivered") return 3;
  if (s === "shipped")   return 2;
  if (s === "paid" || s === "processing") return 1;
  return 0;
}

function money(n) {
  return Number(n || 0).toLocaleString("es-MX", {
    style: "currency", currency: "MXN", maximumFractionDigits: 2,
  });
}

export default function RastrearPedido() {
  const [orderId, setOrderId] = useState("");
  const [email, setEmail]     = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError]     = useState("");
  const [orderData, setOrderData] = useState(null);

  async function handleSearch(e) {
    e.preventDefault();
    const id  = orderId.trim();
    const em  = email.trim().toLowerCase();
    if (!id || !em) return;

    setLoading(true);
    setError("");
    setOrderData(null);

    try {
      const url = `${API_BASE}/api/checkout/order/${encodeURIComponent(id)}/payment?email=${encodeURIComponent(em)}`;
      const res  = await fetch(url, { credentials: "include" });
      const data = await res.json();

      if (!res.ok || !data?.ok) {
        setError("No encontramos un pedido con ese folio y correo. Verifica los datos e intenta de nuevo.");
        return;
      }

      setOrderData(data.order);
    } catch {
      setError("Error de conexión. Intenta de nuevo.");
    } finally {
      setLoading(false);
    }
  }

  const activeStep = orderData ? getActiveStep(orderData.order_status || orderData.payment_status) : 0;

  return (
    <main className="static-page">
      <div className="static-hero">
        <div className="static-hero__badge">📦 Rastrear pedido</div>
        <h1>Rastrea tu pedido</h1>
        <p>Ingresa tu número de folio y el correo con que compraste.</p>
      </div>

      {/* Buscador */}
      <div className="static-section">
        <h2>Ingresa tus datos</h2>
        <form className="rastrear-form" onSubmit={handleSearch} style={{ flexDirection: "column", gap: 12 }}>
          <input
            type="text"
            className="rastrear-input"
            value={orderId}
            onChange={(e) => setOrderId(e.target.value)}
            placeholder="Número de folio (ej. 12345)"
            required
          />
          <input
            type="email"
            className="rastrear-input"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="Correo con que compraste"
            required
            autoComplete="email"
          />
          <button type="submit" className="rastrear-btn" disabled={loading}>
            {loading ? "Buscando..." : "🔍 Rastrear"}
          </button>
        </form>
        <p style={{ fontSize: 12, color: "#999", marginTop: 8 }}>
          El folio te fue enviado por correo al confirmar tu compra.
        </p>
      </div>

      {error && (
        <div className="static-section" style={{ background: "#fff5f5", border: "1px solid #fecaca" }}>
          <p style={{ color: "#dc2626", fontWeight: 700, margin: 0 }}>⚠️ {error}</p>
        </div>
      )}

      {orderData && (
        <>
          {/* Resumen del pedido */}
          <div className="static-section rastrear-result">
            <h2>Pedido #{orderData.id}</h2>

            {/* Timeline */}
            <div className="order-timeline-v">
              {ORDER_STEPS.map((s, i) => {
                const done    = i <= activeStep;
                const current = i === activeStep;
                return (
                  <div key={s.key} className={`otv-step ${done ? "is-done" : ""} ${current ? "is-current" : ""}`}>
                    <div className="otv-left">
                      <div className="otv-icon">{s.icon}</div>
                      {i < ORDER_STEPS.length - 1 && <div className={`otv-line ${i < activeStep ? "is-done" : ""}`} />}
                    </div>
                    <div className="otv-content">
                      <div className="otv-label">{s.label}</div>
                      {done && <div className="otv-desc">{s.desc}</div>}
                    </div>
                    {current && <div className="otv-badge">Actual</div>}
                  </div>
                );
              })}
            </div>

            {/* Datos del pedido */}
            <div className="rastrear-meta">
              <div className="rastrear-meta__item">
                <span className="rastrear-meta__label">Estado</span>
                <span className="rastrear-meta__val">{orderData.order_status || orderData.payment_status || "—"}</span>
              </div>
              <div className="rastrear-meta__item">
                <span className="rastrear-meta__label">Total</span>
                <span className="rastrear-meta__val">{money(orderData.total)}</span>
              </div>
              <div className="rastrear-meta__item">
                <span className="rastrear-meta__label">Método de pago</span>
                <span className="rastrear-meta__val">{orderData.method || "—"}</span>
              </div>
              {orderData.reference && (
                <div className="rastrear-meta__item">
                  <span className="rastrear-meta__label">Referencia</span>
                  <span className="rastrear-meta__val">{orderData.reference}</span>
                </div>
              )}
              {isSafePaymentUrl(orderData.provider_url) && (
                <div className="rastrear-meta__item">
                  <a href={orderData.provider_url} target="_blank" rel="noreferrer"
                    className="rastrear-pay-link">
                    💳 Ir a pagar
                  </a>
                </div>
              )}
            </div>
          </div>

          <div className="cta-band">
            <div>
              <h3>¿Necesitas ayuda con tu pedido?</h3>
              <p>Contáctanos por WhatsApp y te ayudamos al momento.</p>
            </div>
            <a
              href="https://wa.me/527291136254?text=Hola%2C%20necesito%20ayuda%20con%20mi%20pedido"
              target="_blank"
              rel="noreferrer"
              className="cta-band__btn"
            >
              💬 Contactar por WhatsApp
            </a>
          </div>
        </>
      )}

      {!orderData && !error && (
        <div className="static-section" style={{ textAlign: "center", color: "#666" }}>
          <p style={{ fontSize: 40, marginBottom: 12 }}>📦</p>
          <p>Ingresa tu folio y correo para ver el estado de tu envío.</p>
          <p style={{ fontSize: 13, marginTop: 8 }}>
            ¿Compraste recientemente?{" "}
            <Link to="/catalogo" style={{ color: "#ff5b00", fontWeight: 700 }}>
              Ver catálogo
            </Link>
          </p>
        </div>
      )}
    </main>
  );
}
