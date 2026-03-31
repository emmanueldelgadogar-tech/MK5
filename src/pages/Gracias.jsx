import { useEffect, useState } from "react";
import { useSearchParams, Link } from "react-router-dom";
import { API_BASE } from "../config";
import "../styles/gracias.css";

const ORDER_STEPS = [
  { key: "received",   label: "Pedido recibido" },
  { key: "processing", label: "En preparación" },
  { key: "shipped",    label: "En camino" },
  { key: "delivered",  label: "Entregado" },
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

const SAFE_HOSTS = new Set([
  "www.mercadopago.com.mx", "www.mercadopago.com", "mercadopago.com",
  "www.paypal.com", "sandbox.paypal.com", "www.sandbox.paypal.com",
]);

function isSafeUrl(url) {
  if (!url) return false;
  try {
    const { protocol, hostname } = new URL(url);
    return (protocol === "https:" || protocol === "http:") && SAFE_HOSTS.has(hostname);
  } catch { return false; }
}

export default function Gracias() {
  const [searchParams] = useSearchParams();
  const payment = (searchParams.get("payment") || "").toLowerCase();
  const orderId = searchParams.get("order") || "";
  const method  = (searchParams.get("method") || "").toLowerCase();

  const [order, setOrder] = useState(null);
  const [loading, setLoading] = useState(!!orderId);

  useEffect(() => {
    if (!orderId) { setLoading(false); return; }
    const email = localStorage.getItem(`mk5_order_${orderId}_email`) || "";
    if (!email) { setLoading(false); return; }

    fetch(`${API_BASE}/api/checkout/order/${encodeURIComponent(orderId)}/payment?email=${encodeURIComponent(email)}`)
      .then((r) => r.json())
      .then((data) => { if (data?.ok && data?.order) setOrder(data.order); })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, [orderId]);

  const payStatus   = (order?.payment_status || order?.order_status || "").toLowerCase();
  const orderMethod = (order?.method || order?.payment?.method || method || "").toLowerCase();

  const isSuccess = payment === "success" || payStatus === "paid";
  const isFailure = payment === "failure" || payStatus === "failed";
  const isOxxo    = orderMethod === "oxxo_pay" || orderMethod === "oxxo";
  const isTransf  = orderMethod === "transferencia";

  const activeStep = getActiveStep(order?.order_status || order?.status);
  const providerUrl = order?.provider_url || order?.payment?.provider_url;

  return (
    <main className="gracias-page">
      <div className="gracias-container">
        {loading ? (
          <div className="gracias-loading">Cargando tu pedido…</div>
        ) : (
          <>
            {/* Hero */}
            <div className={`gracias-hero ${isSuccess ? "gracias-hero--success" : isFailure ? "gracias-hero--failure" : "gracias-hero--pending"}`}>
              <div className="gracias-hero__icon">
                {isSuccess ? "✓" : isFailure ? "✗" : "✓"}
              </div>
              <h1 className="gracias-hero__title">
                {isSuccess
                  ? "¡Pago confirmado!"
                  : isFailure
                    ? "Pago no completado"
                    : "¡Pedido recibido!"}
              </h1>
              <p className="gracias-hero__sub">
                {isSuccess
                  ? "Tu pago fue procesado exitosamente. Prepararemos tu pedido a la brevedad."
                  : isFailure
                    ? "El pago no se completó. Tu pedido sigue guardado, puedes reintentar."
                    : isOxxo
                      ? "Completa tu pago en cualquier tienda OXXO con el voucher."
                      : isTransf
                        ? "Realiza tu transferencia bancaria para confirmar el pedido."
                        : "Recibimos tu pedido. En breve te contactamos para confirmar entrega."}
              </p>
              {orderId && (
                <p className="gracias-hero__folio">Folio <b>#{orderId}</b></p>
              )}
            </div>

            {/* Timeline */}
            <div className="gracias-timeline">
              {ORDER_STEPS.map((s, i) => (
                <div
                  key={s.key}
                  className={`gracias-timeline__step${i <= activeStep ? " is-done" : ""}${i === activeStep ? " is-current" : ""}`}
                >
                  <div className="gracias-timeline__dot" />
                  <div className="gracias-timeline__label">{s.label}</div>
                  {i < ORDER_STEPS.length - 1 && (
                    <div className={`gracias-timeline__line${i < activeStep ? " is-done" : ""}`} />
                  )}
                </div>
              ))}
            </div>

            {/* Order meta */}
            {order && (
              <div className="gracias-meta">
                {order.total   && <span>Total: <b>{money(order.total)}</b></span>}
                {orderMethod   && <span>Método: <b>{orderMethod}</b></span>}
              </div>
            )}

            {/* OXXO voucher */}
            {isOxxo && isSafeUrl(providerUrl) && (
              <div className="gracias-action-block">
                <p>Muestra tu voucher en caja en cualquier tienda OXXO:</p>
                <a className="gracias-btn gracias-btn--primary" href={providerUrl} target="_blank" rel="noreferrer">
                  Ver voucher OXXO
                </a>
              </div>
            )}

            {/* Transferencia */}
            {isTransf && (
              <div className="gracias-action-block">
                <p>Realiza tu transferencia y envíanos el comprobante por WhatsApp para confirmar tu pedido.</p>
                <a className="gracias-btn gracias-btn--primary" href="https://wa.me/5218112671054" target="_blank" rel="noreferrer">
                  Enviar comprobante por WhatsApp
                </a>
              </div>
            )}

            {/* Reintentar pago */}
            {isFailure && isSafeUrl(providerUrl) && (
              <div className="gracias-action-block">
                <p>Tu pedido sigue guardado. Puedes reintentar el pago cuando quieras.</p>
                <a className="gracias-btn gracias-btn--primary" href={providerUrl}>
                  Reintentar pago
                </a>
              </div>
            )}

            {/* Actions */}
            <div className="gracias-actions">
              <Link to="/rastrear-pedido" className="gracias-btn gracias-btn--ghost">
                Rastrear mi pedido
              </Link>
              <Link to="/catalogo" className="gracias-btn gracias-btn--secondary">
                Seguir comprando
              </Link>
            </div>
          </>
        )}
      </div>
    </main>
  );
}
