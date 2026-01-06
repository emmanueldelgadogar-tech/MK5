import { useEffect, useState } from "react";

export default function Catalogo() {
  const [marcas, setMarcas] = useState([]);
  const [medidas, setMedidas] = useState([]);

  const [marcaSel, setMarcaSel] = useState("");
  const [medidaSel, setMedidaSel] = useState("");

  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  // 1) Cargar filtros
  useEffect(() => {
    fetch("/api/catalogo/filtros")
      .then((res) => res.json())
      .then((data) => {
        setMarcas(data.marcas || []);
        setMedidas(data.medidas || []);
      })
      .catch((err) => {
        console.error("Error fetching filters:", err);
        setMarcas([]);
        setMedidas([]);
      });
  }, []);

  // 2) Traer catálogo según filtros
  const aplicarFiltros = async () => {
    console.log("aplicarFiltros()", { marcaSel, medidaSel });

    try {
      setLoading(true);
      setError("");

      const params = new URLSearchParams();
      if (marcaSel) params.set("marca", marcaSel);
      if (medidaSel) params.set("medida", medidaSel);

      const res = await fetch(`/api/catalogo?${params.toString()}`);
      if (!res.ok) throw new Error(`HTTP ${res.status}`);

      const data = await res.json();
      const list = Array.isArray(data) ? data : data.items || data.rows || [];

      setItems(list);
    } catch (e) {
      console.error("Error fetching catalog:", e);
      setError("No se pudo cargar el catálogo. Reintenta.");
      setItems([]);
    } finally {
      setLoading(false);
    }
  };

  // 3) OPCIONAL PRO: cargar al entrar (quita esto si NO quieres)
  useEffect(() => {
    aplicarFiltros();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <main className="container main catalogo">
      <aside className="filters">
        <h2>Filtros</h2>
        <small>
          marcas: {marcas.length} | medidas: {medidas.length}
        </small>
        <br />
        <small>
          selección: {marcaSel || "—"} | {medidaSel || "—"}
        </small>

        <form
          onSubmit={(e) => {
            e.preventDefault();
            aplicarFiltros();
          }}
        >
          <label htmlFor="marca">Marca:</label>
          <select
            id="marca"
            value={marcaSel}
            onChange={(e) => setMarcaSel(e.target.value)}
          >
            <option value="">Todas</option>
            {marcas.map((m) => (
              <option key={m} value={m}>
                {m}
              </option>
            ))}
          </select>

          <label htmlFor="medida">Medida:</label>
          <select
            id="medida"
            value={medidaSel}
            onChange={(e) => setMedidaSel(e.target.value)}
          >
            <option value="">Todas</option>
            {medidas.map((d) => (
              <option key={d} value={d}>
                {d}
              </option>
            ))}
          </select>

          <button type="submit" disabled={loading}>
            {loading ? "Cargando..." : "Aplicar Filtros"}
          </button>
        </form>
      </aside>

      <section className="results">
        <div
          style={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "baseline",
          }}
        >
          <h2>Resultados</h2>
          <small>{items.length} encontrados</small>
        </div>

        {error && <p style={{ color: "crimson" }}>{error}</p>}

        {!error && items.length === 0 && !loading && (
          <p>Selecciona filtros y presiona “Aplicar Filtros”.</p>
        )}

        <div className="grid catalog-grid">
          {items.map((it, idx) => (
            <article className="catalog-card" key={it.sku || idx}>
              <div className="card-image">
                <img
                  src="/llanta.png"
                  alt={`${it.marca || ""} ${it.modelo || ""}`.trim()}
                />
              </div>

              <div className="card-body">
                <span className="brand">{it.marca || "Marca"}</span>

                <h3 className="model">{it.modelo || "Modelo"}</h3>

                <p className="measure">{it.medida || ""}</p>

                <div className="price">
                  {it.precio
                    ? `$${Number(it.precio).toLocaleString("es-MX")}`
                    : ""}
                </div>

                <button
                  className="btn-primary"
                  type="button"
                  onClick={() => {
                    const msg = encodeURIComponent(
                      `Hola, quiero cotizar ${it.marca || ""} ${it.modelo || ""} ${
                        it.medida || ""
                      }`.trim()
                    );
                    window.open(
                      `https://wa.me/521XXXXXXXXXX?text=${msg}`,
                      "_blank"
                    );
                  }}
                >
                  COTIZAR
                </button>
              </div>
            </article>
          ))}
        </div>
      </section>
    </main>
  );
}
