import "../styles/checkout.css";
import "../styles/cuenta.css";
import { useEffect, useMemo, useState } from "react";
import { Link, useLocation } from "react-router-dom";
import { API_BASE } from "../config";
import { readCart, writeCart } from "../utils/catalogoHelpers";
import { trackEvent } from "../utils/metrics";

// Imágenes de marcas para el banner del carrito
import bannerBridgestone from "../assets/logos/bridgestone.png";
import bannerMichelin    from "../assets/logos/michelin.png";
import bannerPirelli     from "../assets/logos/pirelli.png";
import bannerGoodyear    from "../assets/logos/goodyear.png";
import bannerHankook     from "../assets/logos/hankook.png";
import bannerContinental from "../assets/logos/continental.png";

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

const CART_BRANDS = [
  bannerBridgestone, bannerMichelin, bannerPirelli,
  bannerGoodyear, bannerHankook, bannerContinental,
];

const ESTADOS_MX = [
  "Aguascalientes","Baja California","Baja California Sur","Campeche",
  "Chiapas","Chihuahua","Ciudad de México","Coahuila","Colima",
  "Durango","Estado de México","Guanajuato","Guerrero","Hidalgo",
  "Jalisco","Michoacán","Morelos","Nayarit","Nuevo León","Oaxaca",
  "Puebla","Querétaro","Quintana Roo","San Luis Potosí","Sinaloa",
  "Sonora","Tabasco","Tamaulipas","Tlaxcala","Veracruz","Yucatán","Zacatecas",
];

const ESTADOS_ENVIO_GRATIS = new Set([
  "San Luis Potosí","Nuevo León","Nayarit","Durango","Colima",
  "Tlaxcala","Zacatecas","Puebla","Aguascalientes","Guanajuato",
  "Morelos","Querétaro","Hidalgo","Ciudad de México","Estado de México",
]);

const ORDER_STEPS = [
  { key: "received",    label: "Pedido recibido",  icon: "📋" },
  { key: "processing",  label: "En preparación",   icon: "⚙️" },
  { key: "shipped",     label: "En camino",         icon: "🚚" },
  { key: "delivered",   label: "Entregado",         icon: "✅" },
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

function safeQty(v) {
  return Math.max(parseInt(v, 10) || 1, 1);
}

function isValidEmail(email) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim());
}

function isValidPhone(phone) {
  return /^\d{10}$/.test(phone.replace(/[\s\-().+]/g, ""));
}

export default function Checkout() {
  const location = useLocation();
  const [step, setStep] = useState("carrito");
  const [cart, setCart] = useState([]);
  const [cartHydrated, setCartHydrated] = useState(false);
  const [detailsBySku, setDetailsBySku] = useState({});
  const [bannerIdx, setBannerIdx] = useState(0);

  const [skuInput, setSkuInput] = useState("");
  const [qtyInput, setQtyInput] = useState(1);
  const [adding, setAdding] = useState(false);

  const [loadingDetails, setLoadingDetails] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");
  const [fieldErrors, setFieldErrors] = useState({});

  const [paymentMethods, setPaymentMethods] = useState([
    { id: "mercado_pago", label: "Mercado Pago",  description: "Tarjeta, meses sin intereses, wallet" },
    { id: "paypal",       label: "PayPal",         description: "Pago seguro con cuenta PayPal" },
    { id: "oxxo_pay",    label: "OXXO Pay",        description: "Paga en tienda con referencia" },
    { id: "transferencia",label: "Transferencia",  description: "SPEI / transferencia bancaria" },
  ]);
  const [paymentMethod, setPaymentMethod] = useState("mercado_pago");

  const [customer, setCustomer] = useState({ name: "", phone: "", email: "" });
  const [shipping, setShipping] = useState({ address: "", city: "", state: "", zip: "" });
  const [acceptTerms, setAcceptTerms] = useState(true);
  const [createAccount, setCreateAccount] = useState(false);
  const [accountPassword, setAccountPassword] = useState("");

  const [order, setOrder] = useState(null);
  const [checkoutTracked, setCheckoutTracked] = useState(false);
  const [paymentResult, setPaymentResult] = useState(null);

  // Banner rotativo en el carrito
  useEffect(() => {
    const t = setInterval(() => {
      setBannerIdx((prev) => (prev + 1) % CART_BRANDS.length);
    }, 2000);
    return () => clearInterval(t);
  }, []);

  useEffect(() => {
    setCart(readCart());
    setCartHydrated(true);
  }, []);

  useEffect(() => {
    if (!cartHydrated) return;
    writeCart(cart);
  }, [cart, cartHydrated]);

  useEffect(() => {
    if (!cartHydrated || checkoutTracked || !cart.length) return;
    const qty = cart.reduce((acc, row) => acc + (parseInt(row?.qty, 10) || 0), 0);
    trackEvent("checkout_view", { qty, source: "checkout" });
    setCheckoutTracked(true);
  }, [cart, cartHydrated, checkoutTracked]);

  useEffect(() => {
    if (step !== "datos") return;
    trackEvent("payment_method_selected", { method: paymentMethod, source: "checkout" });
  }, [paymentMethod, step]);

  useEffect(() => {
    async function fetchMissing() {
      const missing = cart.filter((x) => !(x.sku in detailsBySku)).map((x) => x.sku);
      if (!missing.length) return;
      setLoadingDetails(true);
      try {
        const results = await Promise.all(
          missing.map(async (sku) => {
            const res = await fetch(`${API_BASE}/api/catalogo/item?sku=${encodeURIComponent(sku)}`);
            const data = await res.json();
            return { sku, detail: data?.item || null };
          })
        );
        const patch = {};
        for (const r of results) patch[r.sku] = r.detail;
        setDetailsBySku((prev) => ({ ...prev, ...patch }));
      } catch {
        setError("No pude cargar algunos productos del carrito. Reintenta.");
      } finally {
        setLoadingDetails(false);
      }
    }
    fetchMissing();
  }, [cart, detailsBySku]);

  const lines = useMemo(() => {
    return cart.map((row) => {
      const d   = detailsBySku[row.sku] || null;
      const snap = row?.snapshot || null;
      const unit = Number(d?.precio || snap?.precio || 0);
      return { ...row, detail: d, snapshot: snap, unit, line: unit * row.qty };
    });
  }, [cart, detailsBySku]);

  useEffect(() => {
    const params     = new URLSearchParams(location.search);
    const payment    = String(params.get("payment") || "").trim().toLowerCase();
    const orderParam = String(params.get("order") || "").trim();
    if (!payment || !orderParam) return;

    async function loadPaymentStatus() {
      try {
        // Recuperar email guardado al completar el checkout (mismo dispositivo)
        const savedEmail = localStorage.getItem(`mk5_order_${orderParam}_email`) || "";
        if (!savedEmail) return;
        const url = `${API_BASE}/api/checkout/order/${encodeURIComponent(orderParam)}/payment?email=${encodeURIComponent(savedEmail)}`;
        const res  = await fetch(url, { credentials: "include" });
        const data = await res.json();
        if (!res.ok || !data?.ok) return;
        const row = data.order;
        setOrder({
          id: row.id,
          status: row.order_status || row.payment_status || "pending",
          total: Number(row.total || 0),
          payment: {
            method: row.method, status: row.payment_status,
            reference: row.reference, provider_url: row.provider_url,
          },
        });
        setStep("confirmado");
        setPaymentResult(payment);
      } catch { /* ignore */ }
    }
    loadPaymentStatus();
  }, [location.search]);

  useEffect(() => {
    async function loadPaymentMethods() {
      try {
        const res  = await fetch(`${API_BASE}/api/checkout/payment-methods`);
        const data = await res.json();
        if (!res.ok || !data?.ok || !Array.isArray(data?.methods)) return;
        setPaymentMethods(data.methods);
      } catch { /* keep local fallback */ }
    }
    loadPaymentMethods();
  }, []);

  const subtotal         = useMemo(() => lines.reduce((s, l) => s + l.line, 0), [lines]);
  const estimatedDiscount = subtotal * 0.1;
  const estimatedTotal   = subtotal - estimatedDiscount;
  const envioGratis      = ESTADOS_ENVIO_GRATIS.has(shipping.state);

  function updateQty(sku, qty) {
    setCart((prev) => prev.map((x) => (x.sku === sku ? { ...x, qty: safeQty(qty) } : x)));
  }
  function removeSku(sku) {
    setCart((prev) => prev.filter((x) => x.sku !== sku));
  }

  async function addBySku(e) {
    e.preventDefault();
    const sku = skuInput.trim();
    const qty = safeQty(qtyInput);
    if (!sku) return;
    setAdding(true);
    setError("");
    try {
      const res  = await fetch(`${API_BASE}/api/catalogo/item?sku=${encodeURIComponent(sku)}`);
      const data = await res.json();
      const exact = data?.item || null;
      if (!exact) {
        setError(`No encontré el SKU ${sku}. Verifica e intenta de nuevo.`);
        return;
      }
      setDetailsBySku((prev) => ({ ...prev, [sku]: exact }));
      setCart((prev) => {
        const i = prev.findIndex((x) => x.sku === sku);
        if (i === -1) return [...prev, { sku, qty }];
        const next = [...prev];
        next[i] = { ...next[i], qty: next[i].qty + qty };
        return next;
      });
      setSkuInput("");
      setQtyInput(1);
    } catch {
      setError("No pude agregar el SKU en este momento.");
    } finally {
      setAdding(false);
    }
  }

  function validateForm() {
    const errs = {};
    if (!customer.name.trim()) errs.name = "El nombre es obligatorio.";
    if (!customer.phone.trim()) {
      errs.phone = "El teléfono es obligatorio.";
    } else if (!isValidPhone(customer.phone)) {
      errs.phone = "El teléfono debe tener exactamente 10 dígitos.";
    }
    if (!customer.email.trim()) {
      errs.email = "El correo es obligatorio.";
    } else if (!isValidEmail(customer.email)) {
      errs.email = "Ingresa un correo electrónico válido.";
    }
    if (!shipping.address.trim()) errs.address = "La dirección es obligatoria.";
    if (!shipping.city.trim())    errs.city    = "La ciudad es obligatoria.";
    if (!shipping.state)          errs.state   = "Selecciona tu estado.";
    if (!shipping.zip.trim()) {
      errs.zip = "El código postal es obligatorio.";
    } else if (!/^\d{5}$/.test(shipping.zip.trim())) {
      errs.zip = "El código postal debe tener 5 dígitos.";
    }
    if (!acceptTerms) errs.terms = "Debes aceptar los términos y condiciones.";
    if (createAccount && accountPassword.length < 8)
      errs.password = "La contraseña debe tener al menos 8 caracteres.";
    return errs;
  }

  async function confirmOrder(e) {
    e.preventDefault();
    if (!cart.length) { setError("Tu carrito está vacío."); setStep("carrito"); return; }

    const errs = validateForm();
    if (Object.keys(errs).length) {
      setFieldErrors(errs);
      setError("Por favor corrige los errores antes de continuar.");
      return;
    }
    setFieldErrors({});
    setSubmitting(true);
    setError("");

    try {
      const res = await fetch(`${API_BASE}/api/checkout/create`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          items: cart.map((x) => ({ sku: x.sku, qty: x.qty })),
          customer: {
            ...customer,
            create_account: createAccount,
            password: createAccount ? accountPassword : undefined,
          },
          shipping,
          payment: { method: paymentMethod },
        }),
      });
      const data = await res.json();
      if (!res.ok || !data?.ok || !data?.order) {
        setError(data?.error || "No fue posible crear tu orden.");
        return;
      }
      setOrder(data.order);
      // Guardar email en localStorage para poder rastrear la orden en este dispositivo
      const orderId = data.order?.id;
      if (orderId && customer.email) {
        localStorage.setItem(`mk5_order_${orderId}_email`, customer.email.trim().toLowerCase());
      }
      trackEvent("purchase", {
        amount: Number(data.order?.total || 0),
        qty: cart.reduce((acc, row) => acc + (parseInt(row?.qty, 10) || 0), 0),
        source: "checkout",
      });
      setCart([]);
      setDetailsBySku({});
      writeCart([]);
      setStep("confirmado");
    } catch {
      setError("Tuvimos un problema de conexión. Intenta de nuevo.");
    } finally {
      setSubmitting(false);
    }
  }

  const activeStep = order ? getActiveStep(order.status) : 0;

  return (
    <main className="checkout-page">
      <section className="checkout-wrap">
        <header className="checkout-head">
          <h1>Carrito y Checkout MK5</h1>
          <p>Compra segura 🔒 · Envío en 24–48 h · Garantía defecto de fábrica</p>
        </header>

        {/* Steps */}
        <nav className="checkout-steps" aria-label="Pasos de checkout">
          <button type="button" className={`checkout-step ${step === "carrito" ? "is-active" : ""}`} onClick={() => setStep("carrito")}>
            1. Carrito
          </button>
          <button type="button" className={`checkout-step ${step === "datos" ? "is-active" : ""}`}
            onClick={() => setStep("datos")} disabled={!cart.length}>
            2. Datos y pago
          </button>
          <button type="button" className={`checkout-step ${step === "confirmado" ? "is-active" : ""}`} disabled>
            3. Confirmación
          </button>
        </nav>

        {error && <div className="checkout-alert">{error}</div>}

        {/* ── PASO 1: CARRITO ── */}
        {step === "carrito" && (
          <div className="checkout-grid">
            <section className="checkout-card">
              <h2>Tu carrito</h2>

              {/* Banner de marcas rotativo */}
              <div className="cart-brand-banner">
                <div className="cart-brand-banner__scroll">
                  {CART_BRANDS.map((src, i) => (
                    <img key={i} src={src} alt="Marca de llanta" className={`cart-brand-logo ${i === bannerIdx ? "is-active" : ""}`} />
                  ))}
                </div>
                <div className="cart-banner-info">
                  <span>🔒 Compra 100% segura</span>
                  <span>🚚 Envío en 24–48 h</span>
                  <span>🛡️ Garantía defecto fábrica</span>
                </div>
              </div>

              <form className="checkout-add" onSubmit={addBySku}>
                <input type="text" placeholder="SKU del producto"
                  value={skuInput} onChange={(e) => setSkuInput(e.target.value)} required />
                <input type="number" min="1" value={qtyInput}
                  onChange={(e) => setQtyInput(e.target.value)} required />
                <button type="submit" disabled={adding}>{adding ? "Agregando..." : "Agregar"}</button>
              </form>

              {!cart.length ? (
                <div className="checkout-empty">
                  <p>Tu carrito está vacío.</p>
                  <Link to="/catalogo">Ir al catálogo</Link>
                </div>
              ) : (
                <ul className="checkout-list">
                  {lines.map((line) => (
                    <li key={line.sku} className="checkout-item">
                      <div className="checkout-item__img">
                        <div className="checkout-item__img-placeholder">🛞</div>
                      </div>
                      <div style={{ flex: 1 }}>
                        <strong>{line.detail ? `${line.detail.marca} ${line.detail.modelo}` : line.sku}</strong>
                        <p>SKU: {line.sku}</p>
                        <p>Medida: {line.detail?.medida || line.snapshot?.medida || "—"}</p>
                      </div>
                      <div className="checkout-item__actions">
                        <input type="number" min="1" value={line.qty}
                          onChange={(e) => updateQty(line.sku, e.target.value)} />
                        <span>{money(line.line)}</span>
                        <button type="button" onClick={() => removeSku(line.sku)}>Quitar</button>
                      </div>
                    </li>
                  ))}
                </ul>
              )}
            </section>

            <aside className="checkout-card checkout-summary">
              <h2>Resumen</h2>
              <div className="checkout-summary__row"><span>Subtotal</span><b>{money(subtotal)}</b></div>
              <div className="checkout-summary__row"><span>Descuento estimado (10%)</span><b>-{money(estimatedDiscount)}</b></div>
              <div className="checkout-summary__row is-total"><span>Total estimado</span><b>{money(estimatedTotal)}</b></div>
              <small>El total final se recalcula al confirmar, incluyendo promociones activas por marca (ej. 4x3).</small>

              <div className="cart-trust-badges">
                <div className="cart-trust-badge">🔒 SSL Seguro</div>
                <div className="cart-trust-badge">🛡️ Compra protegida</div>
                <div className="cart-trust-badge">🚚 Envío rápido</div>
              </div>

              <button type="button" className="checkout-next"
                onClick={() => setStep("datos")} disabled={!cart.length || loadingDetails}>
                Continuar al checkout →
              </button>
            </aside>
          </div>
        )}

        {/* ── PASO 2: DATOS Y PAGO ── */}
        {step === "datos" && (
          <div className="checkout-grid">
            <form className="checkout-card" onSubmit={confirmOrder}>
              <h2>1. Datos de contacto</h2>

              <div className="checkout-form-grid">
                <label className={fieldErrors.name ? "has-error" : ""}>
                  Nombre completo *
                  <input type="text" value={customer.name} autoComplete="name"
                    onChange={(e) => setCustomer((p) => ({ ...p, name: e.target.value }))} required />
                  {fieldErrors.name && <span className="field-error">{fieldErrors.name}</span>}
                </label>

                <label className={fieldErrors.phone ? "has-error" : ""}>
                  Teléfono (10 dígitos) *
                  <input type="tel" value={customer.phone} autoComplete="tel"
                    maxLength={10} placeholder="5512345678"
                    onChange={(e) => setCustomer((p) => ({ ...p, phone: e.target.value.replace(/\D/g,"") }))}
                    required />
                  {fieldErrors.phone && <span className="field-error">{fieldErrors.phone}</span>}
                </label>
              </div>

              <label className={fieldErrors.email ? "has-error" : ""}>
                Correo electrónico *
                <input type="email" value={customer.email} autoComplete="email"
                  placeholder="correo@ejemplo.com"
                  onChange={(e) => setCustomer((p) => ({ ...p, email: e.target.value }))} required />
                {fieldErrors.email && <span className="field-error">{fieldErrors.email}</span>}
              </label>

              <h2 style={{ marginTop: 16 }}>2. Dirección de envío</h2>

              <label className={fieldErrors.address ? "has-error" : ""}>
                Calle y número *
                <input type="text" value={shipping.address} autoComplete="street-address"
                  placeholder="Calle Benito Juárez #123"
                  onChange={(e) => setShipping((p) => ({ ...p, address: e.target.value }))} required />
                {fieldErrors.address && <span className="field-error">{fieldErrors.address}</span>}
              </label>

              <div className="checkout-form-grid">
                <label className={fieldErrors.city ? "has-error" : ""}>
                  Municipio / Ciudad *
                  <input type="text" value={shipping.city} autoComplete="address-level2"
                    onChange={(e) => setShipping((p) => ({ ...p, city: e.target.value }))} required />
                  {fieldErrors.city && <span className="field-error">{fieldErrors.city}</span>}
                </label>

                <label className={fieldErrors.zip ? "has-error" : ""}>
                  Código postal *
                  <input type="text" value={shipping.zip} autoComplete="postal-code"
                    maxLength={5} placeholder="50000"
                    onChange={(e) => setShipping((p) => ({ ...p, zip: e.target.value.replace(/\D/g,"") }))}
                    required />
                  {fieldErrors.zip && <span className="field-error">{fieldErrors.zip}</span>}
                </label>
              </div>

              {/* Dropdown de estado tipo Shopify */}
              <label className={fieldErrors.state ? "has-error" : ""}>
                Estado *
                <select value={shipping.state} autoComplete="address-level1"
                  onChange={(e) => setShipping((p) => ({ ...p, state: e.target.value }))}
                  className="checkout-select" required>
                  <option value="">— Selecciona tu estado —</option>
                  {ESTADOS_MX.map((est) => (
                    <option key={est} value={est}>{est}</option>
                  ))}
                </select>
                {fieldErrors.state && <span className="field-error">{fieldErrors.state}</span>}
              </label>

              {/* Indicador de envío gratis */}
              {shipping.state && (
                <div className={`envio-indicator ${envioGratis ? "envio-indicator--free" : "envio-indicator--paid"}`}>
                  {envioGratis
                    ? "✅ ¡Envío GRATIS a tu estado!"
                    : "ℹ️ Envío con costo adicional — consulta el total al confirmar."}
                </div>
              )}

              <h2 style={{ marginTop: 16 }}>3. Método de pago</h2>
              <div className="checkout-pay-grid">
                {paymentMethods.map((m) => (
                  <label key={m.id} className={`checkout-pay-option ${paymentMethod === m.id ? "is-selected" : ""}`}>
                    <input type="radio" name="payment_method" value={m.id}
                      checked={paymentMethod === m.id} onChange={() => setPaymentMethod(m.id)} />
                    <div>
                      <b>{m.label}</b>
                      <small>{m.description}</small>
                    </div>
                  </label>
                ))}
              </div>
              {paymentMethod === "mercado_pago" && (
                <div className="msi-info">
                  💳 Meses sin intereses disponibles según tu banco y las promociones vigentes de Mercado Pago.
                </div>
              )}

              <label className="checkout-check">
                <input type="checkbox" checked={acceptTerms}
                  onChange={(e) => setAcceptTerms(e.target.checked)} />
                <span>Acepto <Link to="/terminos" target="_blank" style={{ color: "#ff7a44" }}>términos y condiciones</Link></span>
              </label>
              {fieldErrors.terms && <span className="field-error">{fieldErrors.terms}</span>}

              <label className="checkout-check">
                <input type="checkbox" checked={createAccount}
                  onChange={(e) => setCreateAccount(e.target.checked)} />
                <span>Crear cuenta para rastrear mis pedidos</span>
              </label>

              {createAccount && (
                <label className={fieldErrors.password ? "has-error" : ""}>
                  Contraseña de cuenta *
                  <input
                    type="password"
                    value={accountPassword}
                    autoComplete="new-password"
                    onChange={(e) => setAccountPassword(e.target.value)}
                    minLength={8}
                    required
                  />
                  {fieldErrors.password && <span className="field-error">{fieldErrors.password}</span>}
                  <small style={{ color: "rgba(255,255,255,.5)", fontSize: 12 }}>
                    Mínimo 8 caracteres
                  </small>
                </label>
              )}

              <div className="checkout-actions">
                <button type="button" className="ghost" onClick={() => setStep("carrito")}>
                  ← Volver al carrito
                </button>
                <button type="submit" disabled={submitting}>
                  {submitting ? "Procesando..." : "Confirmar pedido →"}
                </button>
              </div>
            </form>

            <aside className="checkout-card checkout-summary">
              <h2>Resumen de la compra</h2>
              <ul className="checkout-mini-list">
                {lines.map((line) => (
                  <li key={line.sku}>
                    <span>
                      {line.qty}x{" "}
                      {line.detail
                        ? `${line.detail.marca} ${line.detail.modelo}`
                        : line.snapshot
                          ? `${line.snapshot.marca} ${line.snapshot.modelo}`.trim() || line.sku
                          : line.sku}
                    </span>
                    <b>{money(line.line)}</b>
                  </li>
                ))}
              </ul>
              <div className="checkout-summary__row">
                <span>Método</span>
                <b>{paymentMethods.find((x) => x.id === paymentMethod)?.label || paymentMethod}</b>
              </div>
              {shipping.state && (
                <div className="checkout-summary__row">
                  <span>Envío</span>
                  <b style={{ color: envioGratis ? "#4ade80" : "inherit" }}>
                    {envioGratis ? "¡GRATIS!" : "Con costo"}
                  </b>
                </div>
              )}
              <div className="checkout-summary__row is-total">
                <span>Total estimado</span>
                <b>{money(estimatedTotal)}</b>
              </div>
              <div className="cart-trust-badges">
                <div className="cart-trust-badge">🔒 Pago 100% seguro</div>
                <div className="cart-trust-badge">🛡️ Garantía defecto fábrica</div>
              </div>
            </aside>
          </div>
        )}

        {/* ── PASO 3: CONFIRMACIÓN ── */}
        {step === "confirmado" && order && (
          <section className="checkout-card checkout-success">
            <h2>
              {paymentResult === "success" || order?.payment?.status === "paid"
                ? "Pago confirmado ✅"
                : paymentResult === "failure" || order?.payment?.status === "failed"
                  ? "Pago rechazado ⚠️"
                  : "Pedido confirmado ⏳"}
            </h2>
            <p>
              Tu folio es <b>#{order.id}</b>. En breve te contactamos para validar entrega y pago.
            </p>

            {/* Timeline tipo Shopify */}
            <div className="order-timeline">
              {ORDER_STEPS.map((s, i) => (
                <div key={s.key} className={`order-timeline__step ${i <= activeStep ? "is-done" : ""} ${i === activeStep ? "is-current" : ""}`}>
                  <div className="order-timeline__icon">{s.icon}</div>
                  <div className="order-timeline__label">{s.label}</div>
                  {i < ORDER_STEPS.length - 1 && (
                    <div className={`order-timeline__line ${i < activeStep ? "is-done" : ""}`} />
                  )}
                </div>
              ))}
            </div>

            <div className="checkout-success__meta">
              <span>Estatus: <b>{order.status}</b></span>
              <span>Total: <b>{money(order.total)}</b></span>
              <span>Método: <b>{order?.payment?.method || "transferencia"}</b></span>
            </div>

            {order?.payment?.instructions && (
              <p className="checkout-payment-help">{order.payment.instructions}</p>
            )}
            {order?.payment?.error && (
              <p className="checkout-payment-ref">Error de pago: <b>{order.payment.error}</b></p>
            )}
            {order?.payment?.reference && (
              <p className="checkout-payment-ref">Referencia: <b>{order.payment.reference}</b></p>
            )}
            {isSafePaymentUrl(order?.payment?.provider_url) && (
              <a className="checkout-pay-link" href={order.payment.provider_url} target="_blank" rel="noreferrer">
                Ir a pagar ahora
              </a>
            )}

            <div className="checkout-actions" style={{ justifyContent: "center", marginTop: 20 }}>
              <Link to="/rastrear-pedido" className="ghost">Rastrear mi pedido</Link>
              <Link to="/catalogo">Seguir comprando</Link>
            </div>
          </section>
        )}
      </section>
    </main>
  );
}
