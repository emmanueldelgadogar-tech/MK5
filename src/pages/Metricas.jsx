import { useEffect, useMemo, useState } from "react";
import { API_BASE } from "../config";
import "../styles/metricas.css";

function money(n) {
  return Number(n || 0).toLocaleString("es-MX", {
    style: "currency",
    currency: "MXN",
    maximumFractionDigits: 2,
  });
}

export default function Metricas() {
  const [days, setDays] = useState(7);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [data, setData] = useState({
    totals: { product_views: 0, add_to_cart: 0, checkout_views: 0, purchases: 0, revenue: 0 },
    series: [],
    top_products: [],
  });

  useEffect(() => {
    async function load() {
      try {
        setLoading(true);
        setError("");
        const res = await fetch(`${API_BASE}/api/metrics/overview?days=${days}`);
        if (!res.ok) throw new Error(`HTTP ${res.status}`);
        const json = await res.json();
        if (!json?.ok) throw new Error("metrics_error");
        setData({
          totals: json.totals || data.totals,
          series: Array.isArray(json.series) ? json.series : [],
          top_products: Array.isArray(json.top_products) ? json.top_products : [],
        });
      } catch {
        setError("No pude cargar métricas.");
      } finally {
        setLoading(false);
      }
    }
    load();
  }, [days]);

  const convRate = useMemo(() => {
    const views = Number(data.totals.product_views || 0);
    const purchases = Number(data.totals.purchases || 0);
    if (!views) return "0%";
    return `${((purchases / views) * 100).toFixed(2)}%`;
  }, [data.totals]);

  return (
    <main className="container main metricas-page">
      <div className="metricas-head">
        <h1>Metricas MK5</h1>
        <select value={days} onChange={(e) => setDays(Number(e.target.value))}>
          <option value={7}>Ultimos 7 dias</option>
          <option value={14}>Ultimos 14 dias</option>
          <option value={30}>Ultimos 30 dias</option>
        </select>
      </div>

      {error && <p className="metricas-error">{error}</p>}
      {loading && <p>Cargando metricas...</p>}

      {!loading && (
        <>
          <section className="metricas-kpis">
            <article><span>Vistas producto</span><b>{data.totals.product_views}</b></article>
            <article><span>Agregados carrito</span><b>{data.totals.add_to_cart}</b></article>
            <article><span>Checkout</span><b>{data.totals.checkout_views}</b></article>
            <article><span>Compras</span><b>{data.totals.purchases}</b></article>
            <article><span>Conversion</span><b>{convRate}</b></article>
            <article><span>Ingresos</span><b>{money(data.totals.revenue)}</b></article>
          </section>

          <section className="metricas-grid">
            <article className="metric-card">
              <h2>Embudo</h2>
              <div className="funnel">
                <div><span>1. Vistas</span><b>{data.totals.product_views}</b></div>
                <div><span>2. Carrito</span><b>{data.totals.add_to_cart}</b></div>
                <div><span>3. Checkout</span><b>{data.totals.checkout_views}</b></div>
                <div><span>4. Compra</span><b>{data.totals.purchases}</b></div>
              </div>
            </article>

            <article className="metric-card">
              <h2>Tendencia diaria</h2>
              <div className="series-list">
                {data.series.map((row) => (
                  <div key={row.day} className="series-row">
                    <span>{row.day}</span>
                    <em>V: {row.product_views}</em>
                    <em>C: {row.add_to_cart}</em>
                    <em>P: {row.purchases}</em>
                  </div>
                ))}
              </div>
            </article>
          </section>

          <section className="metric-card">
            <h2>Top productos (SKU)</h2>
            <div className="top-table">
              {data.top_products.length === 0 && <p>Sin datos aún.</p>}
              {data.top_products.map((row) => (
                <div className="top-row" key={row.sku}>
                  <span>{row.sku}</span>
                  <em>Vistas: {row.views}</em>
                  <em>Carrito: {row.adds}</em>
                  <em>Compras: {row.purchases}</em>
                </div>
              ))}
            </div>
          </section>
        </>
      )}
    </main>
  );
}
