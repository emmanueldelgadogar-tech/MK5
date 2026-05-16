import { useState, useEffect, useCallback } from "react";
import { API_BASE } from "../config";
import "../styles/admin.css";

function authHeaders() {
  try {
    const u = JSON.parse(localStorage.getItem("mk5_user") || "{}");
    if (u?.session_token) return { "Authorization": `Bearer ${u.session_token}` };
  } catch { /* ignore */ }
  return {};
}

const TABS = [
  { id: "dashboard", label: "Dashboard", icon: "📊" },
  { id: "pedidos",   label: "Pedidos",   icon: "📦" },
  { id: "clientes",  label: "Clientes",  icon: "👥" },
  { id: "newsletter",label: "Newsletter",icon: "📧" },
];

function money(n) {
  return Number(n || 0).toLocaleString("es-MX", { style: "currency", currency: "MXN", maximumFractionDigits: 0 });
}

function fmtDate(s) {
  if (!s) return "—";
  return new Date(s).toLocaleDateString("es-MX", { day: "2-digit", month: "short", year: "numeric" });
}

function BarChart({ data, labelKey, valueKey, color = "#e85c00" }) {
  if (!data?.length) return <p className="adm-empty">Sin datos aún.</p>;
  const max = Math.max(...data.map(d => Number(d[valueKey]) || 0), 1);
  const W = 500, H = 150, PAD_B = 24, PAD_T = 18;
  const barW = Math.max(8, Math.min(36, (W / data.length) - 6));

  return (
    <svg viewBox={`0 0 ${W} ${H}`} className="adm-chart">
      {data.map((d, i) => {
        const val = Number(d[valueKey]) || 0;
        const h = ((val / max) * (H - PAD_B - PAD_T));
        const x = (W / data.length) * i + (W / data.length - barW) / 2;
        const y = H - PAD_B - h;
        return (
          <g key={i}>
            <rect x={x} y={y} width={barW} height={Math.max(h, 1)} fill={color} rx="3" opacity="0.85" />
            <text x={x + barW / 2} y={H - 6} textAnchor="middle" fontSize="8.5" fill="#aaa">
              {String(d[labelKey]).slice(5)}
            </text>
            {h > 14 && (
              <text x={x + barW / 2} y={y - 4} textAnchor="middle" fontSize="9" fill="#555" fontWeight="700">
                {val}
              </text>
            )}
          </g>
        );
      })}
    </svg>
  );
}

export default function AdminPanel() {
  const [tab, setTab] = useState("dashboard");

  // ── Dashboard ──────────────────────────────────────────
  const [metrics, setMetrics]       = useState(null);
  const [metLoading, setMetLoading] = useState(false);
  const [metDays, setMetDays]       = useState(7);

  useEffect(() => {
    if (tab !== "dashboard") return;

    function loadMetrics() {
      setMetLoading(true);
      Promise.all([
        fetch(`${API_BASE}/api/admin/metrics`,                   { headers: authHeaders() }).then(r => r.json()),
        fetch(`${API_BASE}/api/metrics/overview?days=${metDays}`, { headers: authHeaders() }).then(r => r.json()),
      ])
        .then(([adm, ana]) => setMetrics({ adm, ana }))
        .catch(() => {})
        .finally(() => setMetLoading(false));
    }

    loadMetrics();
    const interval = setInterval(loadMetrics, 10 * 60 * 1000); // cada 10 min
    return () => clearInterval(interval);
  }, [tab, metDays]);

  // ── Pedidos ────────────────────────────────────────────
  const [orders, setOrders]           = useState([]);
  const [ordLoading, setOrdLoading]   = useState(false);
  const [ordStatus, setOrdStatus]     = useState("all");
  const [ordSearch, setOrdSearch]     = useState("");
  const [cancelling, setCancelling]   = useState(null);
  const [editOrder, setEditOrder]     = useState(null); // { id, code, email, name, status }
  const [editStatus, setEditStatus]   = useState("");
  const [editTracking, setEditTracking] = useState("");
  const [saving, setSaving]           = useState(false);
  const [saveMsg, setSaveMsg]         = useState("");
  const [orderDetail, setOrderDetail] = useState(null); // { order, items }
  const [detailLoading, setDetailLoading] = useState(false);

  const loadOrders = useCallback(() => {
    setOrdLoading(true);
    const p = new URLSearchParams({ status: ordStatus });
    if (ordSearch.trim()) p.set("search", ordSearch.trim());
    fetch(`${API_BASE}/api/admin/orders?${p}`, { headers: authHeaders() })
      .then(r => r.json())
      .then(d => d.ok && setOrders(d.orders || []))
      .catch(() => {})
      .finally(() => setOrdLoading(false));
  }, [ordStatus, ordSearch]);

  useEffect(() => { if (tab === "pedidos") loadOrders(); }, [tab, loadOrders]);

  async function cancelOrder(id, code) {
    if (!confirm(`¿Cancelar el pedido ${code}?`)) return;
    setCancelling(id);
    try {
      const r = await fetch(`${API_BASE}/api/admin/orders/${id}/cancel`, {
        method: "PATCH", headers: authHeaders(),
      });
      if ((await r.json()).ok) loadOrders();
    } finally {
      setCancelling(null);
    }
  }

  function openEdit(o) {
    setEditOrder(o);
    setEditStatus(o.status || "");
    setEditTracking(o.tracking_number || "");
    setSaveMsg("");
    setOrderDetail(null);
    setDetailLoading(true);
    fetch(`${API_BASE}/api/admin/orders/${o.id}`, { headers: authHeaders() })
      .then(r => r.json())
      .then(d => { if (d.ok) setOrderDetail({ order: d.order, items: d.items || [] }); })
      .catch(() => {})
      .finally(() => setDetailLoading(false));
  }

  function closeEdit() {
    setEditOrder(null);
    setOrderDetail(null);
    setSaveMsg("");
  }

  async function saveOrderStatus() {
    if (!editOrder) return;
    setSaving(true);
    setSaveMsg("");
    try {
      const r = await fetch(`${API_BASE}/api/admin/orders/${editOrder.id}/status`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json", ...authHeaders() },
        body: JSON.stringify({ status: editStatus, tracking_number: editTracking }),
      });
      const d = await r.json();
      if (d.ok) {
        setSaveMsg("✓ Guardado" + (d.email_sent ? " · Email enviado al cliente" : ""));
        loadOrders();
        setTimeout(() => { setEditOrder(null); setSaveMsg(""); }, 1800);
      } else {
        setSaveMsg("Error al guardar.");
      }
    } catch {
      setSaveMsg("Error de conexión.");
    } finally {
      setSaving(false);
    }
  }

  // ── Clientes ───────────────────────────────────────────
  const [customers, setCustomers]     = useState([]);
  const [cusLoading, setCusLoading]   = useState(false);

  useEffect(() => {
    if (tab !== "clientes") return;
    setCusLoading(true);
    fetch(`${API_BASE}/api/admin/customers`, { headers: authHeaders() })
      .then(r => r.json())
      .then(d => d.ok && setCustomers(d.customers || []))
      .catch(() => {})
      .finally(() => setCusLoading(false));
  }, [tab]);

  // ── Newsletter ─────────────────────────────────────────
  const [subs, setSubs]               = useState([]);
  const [subLoading, setSubLoading]   = useState(false);

  useEffect(() => {
    if (tab !== "newsletter") return;
    setSubLoading(true);
    fetch(`${API_BASE}/api/admin/newsletter`, { headers: authHeaders() })
      .then(r => r.json())
      .then(d => d.ok && setSubs(d.subscribers || []))
      .catch(() => {})
      .finally(() => setSubLoading(false));
  }, [tab]);

  // ── Shortcuts ──────────────────────────────────────────
  // /api/admin/metrics devuelve { ok, metrics: { ... } }
  const adm = metrics?.adm?.metrics ?? null;
  const ana = metrics?.ana;

  // ── Modal cambiar estado ────────────────────────────────
  const detailMeta = orderDetail?.order?.payment_meta || {};
  const OrderModal = editOrder ? (
    <div className="adm-modal-backdrop" onClick={closeEdit}>
      <div className="adm-modal" onClick={e => e.stopPropagation()}>
        <div className="adm-modal__head">
          <b>Gestionar pedido</b>
          <code className="adm-code">{editOrder.order_code || `#${editOrder.id}`}</code>
          <button className="adm-modal__close" onClick={closeEdit}>✕</button>
        </div>
        <p className="adm-muted" style={{ marginBottom: 14 }}>
          Cliente: <b>{editOrder.customer_name}</b> · {editOrder.customer_email}
          {editOrder.customer_phone ? <> · {editOrder.customer_phone}</> : null}
        </p>

        {/* Productos del pedido */}
        <div style={{ marginBottom: 14, border: "1px solid #e5e7eb", borderRadius: 8, padding: 12, background: "#fafafa" }}>
          <div style={{ fontSize: 12, fontWeight: 700, color: "#555", marginBottom: 8 }}>
            🛒 Productos del pedido
          </div>
          {detailLoading ? (
            <p className="adm-muted" style={{ fontSize: 13, margin: 0 }}>Cargando detalle…</p>
          ) : !orderDetail ? (
            <p className="adm-muted" style={{ fontSize: 13, margin: 0 }}>No se pudo cargar el detalle.</p>
          ) : orderDetail.items.length === 0 ? (
            <p className="adm-muted" style={{ fontSize: 13, margin: 0 }}>Este pedido no tiene productos registrados.</p>
          ) : (
            <table className="adm-table" style={{ fontSize: 12 }}>
              <thead>
                <tr>
                  <th>SKU</th>
                  <th>Producto</th>
                  <th style={{ textAlign: "center" }}>Cant.</th>
                  <th style={{ textAlign: "right" }}>P. unit.</th>
                  <th style={{ textAlign: "right" }}>Total</th>
                </tr>
              </thead>
              <tbody>
                {orderDetail.items.map(it => (
                  <tr key={it.id}>
                    <td><code style={{ fontSize: 11 }}>{it.sku}</code></td>
                    <td>
                      <div><b>{it.marca} {it.modelo}</b></div>
                      {it.medida && <div className="adm-muted" style={{ fontSize: 11 }}>{it.medida}</div>}
                    </td>
                    <td style={{ textAlign: "center" }}>
                      {it.charged_qty && it.charged_qty !== it.qty
                        ? <>{it.qty} <span className="adm-muted">({it.charged_qty} cobr.)</span></>
                        : it.qty}
                    </td>
                    <td style={{ textAlign: "right" }}>{money(it.unit_price)}</td>
                    <td style={{ textAlign: "right" }}><b>{money(it.line_total)}</b></td>
                  </tr>
                ))}
              </tbody>
              <tfoot>
                {orderDetail.order?.subtotal != null && (
                  <tr>
                    <td colSpan={4} style={{ textAlign: "right" }} className="adm-muted">Subtotal</td>
                    <td style={{ textAlign: "right" }}>{money(orderDetail.order.subtotal)}</td>
                  </tr>
                )}
                {Number(orderDetail.order?.discount) > 0 && (
                  <tr>
                    <td colSpan={4} style={{ textAlign: "right" }} className="adm-muted">Descuento</td>
                    <td style={{ textAlign: "right" }}>-{money(orderDetail.order.discount)}</td>
                  </tr>
                )}
                <tr>
                  <td colSpan={4} style={{ textAlign: "right", fontWeight: 700 }}>Total</td>
                  <td style={{ textAlign: "right", fontWeight: 700 }}>{money(orderDetail.order?.total ?? editOrder.total)}</td>
                </tr>
              </tfoot>
            </table>
          )}

          {/* Dirección de envío */}
          {orderDetail && (detailMeta.address || detailMeta.city || detailMeta.state || detailMeta.zip) && (
            <div style={{ marginTop: 10, paddingTop: 10, borderTop: "1px dashed #e5e7eb", fontSize: 12 }}>
              <b>📍 Envío:</b>{" "}
              {[detailMeta.address, detailMeta.city, detailMeta.state, detailMeta.zip].filter(Boolean).join(", ")}
            </div>
          )}
          {orderDetail?.order?.payment_reference && (
            <div style={{ marginTop: 6, fontSize: 12 }}>
              <b>Ref. pago:</b> <code>{orderDetail.order.payment_reference}</code>
            </div>
          )}
        </div>

        <label style={{ display: "block", marginBottom: 10 }}>
          <span style={{ fontSize: 12, fontWeight: 700, color: "#555", display: "block", marginBottom: 4 }}>
            Estado del pedido
          </span>
          <select value={editStatus} onChange={e => setEditStatus(e.target.value)} className="adm-select" style={{ width: "100%" }}>
            <option value="pending_payment">Pendiente de pago</option>
            <option value="paid">Pagado</option>
            <option value="processing">En preparación</option>
            <option value="shipped">Enviado</option>
            <option value="delivered">Entregado</option>
            <option value="cancelled">Cancelado</option>
          </select>
        </label>
        {(editStatus === "shipped" || editStatus === "delivered") && (
          <label style={{ display: "block", marginBottom: 10 }}>
            <span style={{ fontSize: 12, fontWeight: 700, color: "#555", display: "block", marginBottom: 4 }}>
              Número de guía (opcional)
            </span>
            <input
              type="text"
              className="adm-input"
              style={{ width: "100%" }}
              value={editTracking}
              onChange={e => setEditTracking(e.target.value)}
              placeholder="Ej. 1Z999AA10123456784"
            />
          </label>
        )}
        {editStatus === "shipped" && (
          <p style={{ fontSize: 12, color: "#059669", marginBottom: 10 }}>
            📧 Se enviará un correo al cliente con la información de envío.
          </p>
        )}
        {saveMsg && (
          <p style={{ fontSize: 13, color: saveMsg.startsWith("✓") ? "#059669" : "#dc2626", marginBottom: 8 }}>
            {saveMsg}
          </p>
        )}
        <div style={{ display: "flex", gap: 8, justifyContent: "flex-end" }}>
          <button className="adm-btn" style={{ background: "#e5e7eb", color: "#333" }} onClick={closeEdit}>
            Cancelar
          </button>
          <button className="adm-btn" onClick={saveOrderStatus} disabled={saving}>
            {saving ? "Guardando…" : "Guardar cambios"}
          </button>
        </div>
      </div>
    </div>
  ) : null;

  return (
    <div className="adm-panel">
      {OrderModal}
      {/* ── Sidebar ── */}
      <nav className="adm-nav">
        <div className="adm-nav__brand">⚙️ Admin MK5</div>
        {TABS.map(t => (
          <button
            key={t.id}
            className={`adm-nav__item ${tab === t.id ? "is-active" : ""}`}
            onClick={() => setTab(t.id)}
          >
            <span>{t.icon}</span> {t.label}
          </button>
        ))}
      </nav>

      {/* ── Content ── */}
      <div className="adm-content">

        {/* ── DASHBOARD ── */}
        {tab === "dashboard" && (
          <div>
            <div className="adm-topbar">
              <h2 className="adm-title">Dashboard</h2>
              <select value={metDays} onChange={e => setMetDays(Number(e.target.value))} className="adm-select">
                <option value={7}>7 días</option>
                <option value={14}>14 días</option>
                <option value={30}>30 días</option>
              </select>
            </div>

            {metLoading ? <p className="adm-loading">Cargando métricas…</p> : (
              <>
                {/* Alertas */}
                {adm?.pendingOrders > 0 && (
                  <div className="adm-alert">
                    ⚠️ <b>{adm.pendingOrders}</b> pedido{adm.pendingOrders !== 1 ? "s" : ""} pendiente{adm.pendingOrders !== 1 ? "s" : ""} de pago
                    <button className="adm-btn" style={{ marginLeft: 12, padding: "4px 12px", fontSize: 12 }}
                      onClick={() => { setTab("pedidos"); setOrdStatus("pending_payment"); }}>
                      Ver pedidos
                    </button>
                  </div>
                )}
                {adm?.processingOrders > 0 && (
                  <div className="adm-alert adm-alert--info">
                    📦 <b>{adm.processingOrders}</b> pedido{adm.processingOrders !== 1 ? "s" : ""} en preparación
                  </div>
                )}

                {/* KPIs */}
                <div className="adm-kpis">
                  <div className="adm-kpi adm-kpi--accent">
                    <span>Ingresos totales</span>
                    <b>{adm?.totalRevenue != null ? money(adm.totalRevenue) : "—"}</b>
                  </div>
                  <div className="adm-kpi">
                    <span>Pedidos pagados</span>
                    <b>{adm?.totalOrders ?? "—"}</b>
                  </div>
                  <div className="adm-kpi">
                    <span>Clientes registrados</span>
                    <b>{adm?.totalClients ?? "—"}</b>
                  </div>
                  <div className="adm-kpi">
                    <span>Ingresos {metDays}d</span>
                    <b>{ana?.totals ? money(ana.totals.revenue) : "—"}</b>
                  </div>
                  <div className="adm-kpi">
                    <span>Vistas producto</span>
                    <b>{ana?.totals?.product_views ?? "—"}</b>
                  </div>
                  <div className="adm-kpi">
                    <span>Conversión</span>
                    <b>
                      {ana?.totals
                        ? `${((ana.totals.purchases / Math.max(ana.totals.product_views, 1)) * 100).toFixed(1)}%`
                        : "—"}
                    </b>
                  </div>
                </div>

                {/* Pedidos por estado */}
                {adm?.byStatus && Object.keys(adm.byStatus).length > 0 && (
                  <div className="adm-card" style={{ marginBottom: 14 }}>
                    <h3>Pedidos por estado</h3>
                    <div style={{ display: "flex", flexWrap: "wrap", gap: 10 }}>
                      {Object.entries(adm.byStatus).map(([status, count]) => (
                        <div key={status} className="adm-kpi" style={{ flex: "1 1 120px", minWidth: 100 }}>
                          <span className={`adm-status adm-status--${status}`} style={{ fontSize: 11 }}>{status}</span>
                          <b style={{ fontSize: 22 }}>{count}</b>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Ingresos por método de pago */}
                {adm?.revenueByMethod?.length > 0 && (
                  <div className="adm-card" style={{ marginBottom: 14 }}>
                    <h3>Ingresos por método de pago</h3>
                    <table className="adm-table">
                      <thead><tr><th>Método</th><th>Pedidos</th><th>Total</th></tr></thead>
                      <tbody>
                        {adm.revenueByMethod.map(r => (
                          <tr key={r.method}>
                            <td><span className="adm-badge">{r.method}</span></td>
                            <td>{r.count}</td>
                            <td><b>{money(r.revenue)}</b></td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}

                {/* Charts row */}
                <div className="adm-charts">
                  <div className="adm-card">
                    <h3>Compras por día</h3>
                    <BarChart data={ana?.series} labelKey="day" valueKey="purchases" color="#e85c00" />
                  </div>
                  <div className="adm-card">
                    <h3>Embudo de conversión</h3>
                    {ana?.totals ? (
                      <div className="adm-funnel">
                        {[
                          { label: "Vistas",   val: ana.totals.product_views,  color: "#3b82f6" },
                          { label: "Carrito",  val: ana.totals.add_to_cart,    color: "#f59e0b" },
                          { label: "Checkout", val: ana.totals.checkout_views, color: "#8b5cf6" },
                          { label: "Compra",   val: ana.totals.purchases,      color: "#10b981" },
                        ].map((item, i) => {
                          const pct = Math.round((item.val / Math.max(ana.totals.product_views, 1)) * 100);
                          return (
                            <div key={i} className="adm-funnel__row">
                              <span className="adm-funnel__lbl">{item.label}</span>
                              <div className="adm-funnel__bar">
                                <div style={{ width: `${pct}%`, background: item.color }} />
                              </div>
                              <span className="adm-funnel__val">{item.val}</span>
                            </div>
                          );
                        })}
                      </div>
                    ) : <p className="adm-empty">Sin datos.</p>}
                  </div>
                </div>

                {/* Vistas diarias */}
                {ana?.series?.length > 0 && (
                  <div className="adm-card" style={{ marginTop: 14 }}>
                    <h3>Vistas de producto por día</h3>
                    <BarChart data={ana.series} labelKey="day" valueKey="product_views" color="#3b82f6" />
                  </div>
                )}

                {/* Top productos */}
                {ana?.top_products?.length > 0 && (
                  <div className="adm-card" style={{ marginTop: 14 }}>
                    <h3>Top productos</h3>
                    <table className="adm-table">
                      <thead><tr><th>SKU</th><th>Vistas</th><th>Carrito</th><th>Compras</th></tr></thead>
                      <tbody>
                        {ana.top_products.slice(0, 10).map(p => (
                          <tr key={p.sku}>
                            <td><code>{p.sku}</code></td>
                            <td>{p.views}</td>
                            <td>{p.adds}</td>
                            <td><b>{p.purchases}</b></td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}
              </>
            )}
          </div>
        )}

        {/* ── PEDIDOS ── */}
        {tab === "pedidos" && (
          <div>
            <h2 className="adm-title">Pedidos</h2>
            <div className="adm-filters">
              <select value={ordStatus} onChange={e => setOrdStatus(e.target.value)} className="adm-select">
                <option value="all">Todos los estados</option>
                <option value="pending_payment">Pendiente de pago</option>
                <option value="paid">Pagado</option>
                <option value="shipped">Enviado</option>
                <option value="cancelled">Cancelado</option>
              </select>
              <input
                className="adm-input"
                placeholder="Buscar por folio o cliente…"
                value={ordSearch}
                onChange={e => setOrdSearch(e.target.value)}
                onKeyDown={e => e.key === "Enter" && loadOrders()}
              />
              <button className="adm-btn" onClick={loadOrders}>Buscar</button>
            </div>

            {ordLoading ? <p className="adm-loading">Cargando pedidos…</p> : (
              <div className="adm-card adm-card--table">
                <div className="adm-table-wrap">
                  <table className="adm-table">
                    <thead>
                      <tr>
                        <th>Folio</th>
                        <th>Cliente</th>
                        <th className="adm-hide-sm">Correo</th>
                        <th>Total</th>
                        <th className="adm-hide-sm">Método</th>
                        <th>Estado</th>
                        <th className="adm-hide-sm">Fecha</th>
                        <th></th>
                      </tr>
                    </thead>
                    <tbody>
                      {orders.length === 0 && (
                        <tr><td colSpan={8} className="adm-empty">Sin pedidos con ese filtro.</td></tr>
                      )}
                      {orders.map(o => (
                        <tr key={o.id}>
                          <td><code className="adm-code">{o.order_code || `#${o.id}`}</code></td>
                          <td>{o.customer_name}</td>
                          <td className="adm-hide-sm adm-muted">{o.customer_email}</td>
                          <td><b>{money(o.total)}</b></td>
                          <td className="adm-hide-sm">
                            <span className="adm-badge">{o.payment_method || "—"}</span>
                          </td>
                          <td>
                            <span className={`adm-status adm-status--${o.status}`}>{o.status}</span>
                          </td>
                          <td className="adm-hide-sm adm-muted">{fmtDate(o.created_at)}</td>
                          <td style={{ display: "flex", gap: 4, flexWrap: "wrap" }}>
                            <button
                              className="adm-btn"
                              style={{ padding: "6px 10px", fontSize: 11 }}
                              onClick={() => openEdit(o)}
                            >
                              Gestionar
                            </button>
                            {o.status !== "cancelled" && (
                              <button
                                className="adm-btn adm-btn--danger"
                                onClick={() => cancelOrder(o.id, o.order_code || `#${o.id}`)}
                                disabled={cancelling === o.id}
                              >
                                {cancelling === o.id ? "…" : "✕"}
                              </button>
                            )}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
                <p className="adm-count-footer">{orders.length} resultado(s)</p>
              </div>
            )}
          </div>
        )}

        {/* ── CLIENTES ── */}
        {tab === "clientes" && (
          <div>
            <h2 className="adm-title">
              Clientes <span className="adm-pill">{customers.length}</span>
            </h2>
            {cusLoading ? <p className="adm-loading">Cargando clientes…</p> : (
              <div className="adm-card adm-card--table">
                <div className="adm-table-wrap">
                  <table className="adm-table">
                    <thead>
                      <tr>
                        <th>Nombre</th>
                        <th>Correo</th>
                        <th className="adm-hide-sm">Teléfono</th>
                        <th>Pedidos</th>
                        <th className="adm-hide-sm">Registro</th>
                      </tr>
                    </thead>
                    <tbody>
                      {customers.length === 0 && (
                        <tr><td colSpan={5} className="adm-empty">Sin clientes registrados.</td></tr>
                      )}
                      {customers.map(c => (
                        <tr key={c.id}>
                          <td>{c.name || "—"}</td>
                          <td>{c.email}</td>
                          <td className="adm-hide-sm adm-muted">{c.phone || "—"}</td>
                          <td style={{ textAlign: "center" }}>
                            <span className="adm-pill">{c.orders_count || 0}</span>
                          </td>
                          <td className="adm-hide-sm adm-muted">{fmtDate(c.created_at)}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            )}
          </div>
        )}

        {/* ── NEWSLETTER ── */}
        {tab === "newsletter" && (
          <div>
            <h2 className="adm-title">
              Newsletter <span className="adm-pill">{subs.length} suscriptores</span>
            </h2>
            {subLoading ? <p className="adm-loading">Cargando…</p> : (
              <div className="adm-card adm-card--table">
                <div className="adm-table-wrap">
                  <table className="adm-table">
                    <thead>
                      <tr><th>#</th><th>Correo</th><th>Fecha suscripción</th></tr>
                    </thead>
                    <tbody>
                      {subs.length === 0 && (
                        <tr><td colSpan={3} className="adm-empty">Sin suscriptores aún.</td></tr>
                      )}
                      {subs.map((s, i) => (
                        <tr key={s.email}>
                          <td className="adm-muted">{i + 1}</td>
                          <td>{s.email}</td>
                          <td className="adm-muted">{fmtDate(s.created_at)}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            )}
          </div>
        )}

      </div>
    </div>
  );
}
