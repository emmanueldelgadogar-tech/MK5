import { useEffect, useMemo, useState } from "react";

function parseMedidaParts(medida) {
  // soporta: 205/55/16, 205/55R16, 205-55-16, "205 55 16"
  if (!medida) return null;
  const s = String(medida).toUpperCase().trim();

  // normaliza separadores a "/"
  const norm = s
    .replace(/\s+/g, "/")
    .replace(/-/g, "/")
    .replace(/R/g, "/"); // 205/55R16 -> 205/55/16

  const parts = norm.split("/").filter(Boolean);
  if (parts.length < 3) return null;

  const ancho = parseInt(parts[0], 10);
  const alto = parseInt(parts[1], 10);
  const rin = parseInt(parts[2], 10);

  if (!Number.isFinite(ancho) || !Number.isFinite(alto) || !Number.isFinite(rin)) return null;
  return { ancho, alto, rin };
}

function toggleSetValue(setter, value) {
  setter((prev) => {
    const n = new Set(prev);
    if (n.has(value)) n.delete(value);
    else n.add(value);
    return n;
  });
}

function Accordion({ title, children, defaultOpen = true }) {
  const [open, setOpen] = useState(defaultOpen);
  return (
    <div className="facc">
      <button
        type="button"
        className="facc__head"
        onClick={() => setOpen((v) => !v)}
        aria-expanded={open}
      >
        <span className="facc__title">{title}</span>
        <span className={`facc__chev ${open ? "is-open" : ""}`}>▾</span>
      </button>
      {open && <div className="facc__body">{children}</div>}
    </div>
  );
}

export default function Catalogo() {
  const [marcas, setMarcas] = useState([]);
  const [medidas, setMedidas] = useState([]);

  // ✅ multi-select
  const [marcasSel, setMarcasSel] = useState(new Set());
  const [anchosSel, setAnchosSel] = useState(new Set());
  const [altosSel, setAltosSel] = useState(new Set());
  const [rinesSel, setRinesSel] = useState(new Set());

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
      .catch(() => {
        setMarcas([]);
        setMedidas([]);
      });
  }, []);

  // 2) Derivar opciones (ancho/alto/rin) desde medidas
  const { anchos, altos, rines } = useMemo(() => {
    const A = new Set();
    const H = new Set();
    const R = new Set();
    for (const m of medidas || []) {
      const p = parseMedidaParts(m);
      if (!p) continue;
      A.add(p.ancho);
      H.add(p.alto);
      R.add(p.rin);
    }
    const sortNum = (x, y) => x - y;
    return {
      anchos: Array.from(A).sort(sortNum),
      altos: Array.from(H).sort(sortNum),
      rines: Array.from(R).sort(sortNum),
    };
  }, [medidas]);

  // 3) Traer catálogo con filtros
  const aplicarFiltros = async () => {
    try {
      setLoading(true);
      setError("");

      const params = new URLSearchParams();

      if (marcasSel.size) params.set("marcas", Array.from(marcasSel).join(","));
      if (anchosSel.size) params.set("anchos", Array.from(anchosSel).join(","));
      if (altosSel.size) params.set("altos", Array.from(altosSel).join(","));
      if (rinesSel.size) params.set("rines", Array.from(rinesSel).join(","));

      const qs = params.toString();
      const res = await fetch(`/api/catalogo${qs ? `?${qs}` : ""}`);
      if (!res.ok) throw new Error(`HTTP ${res.status}`);

      const data = await res.json();
      const list = Array.isArray(data) ? data : data.items || data.rows || [];
      setItems(list);
    } catch (e) {
      console.error(e);
      setError("No se pudo cargar el catálogo. Reintenta.");
      setItems([]);
    } finally {
      setLoading(false);
    }
  };

  // 4) Cargar al entrar
  useEffect(() => {
    aplicarFiltros();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const limpiar = () => {
    setMarcasSel(new Set());
    setAnchosSel(new Set());
    setAltosSel(new Set());
    setRinesSel(new Set());
  };

  const totalSel =
    marcasSel.size + anchosSel.size + altosSel.size + rinesSel.size;

  return (
    <main className="container main catalogo">
      <aside className="filters filters-ecom">
        <div className="filters-ecom__top">
          <div>
            <h2>Filtros</h2>
            <div className="filters-ecom__meta">
              <span>{marcas.length} marcas</span>
              <span className="sep">•</span>
              <span>{medidas.length} medidas</span>
            </div>
          </div>

          <button
            type="button"
            className="filters-ecom__clear"
            onClick={() => {
              limpiar();
              // si quieres que recargue al limpiar:
              // setTimeout(aplicarFiltros, 0);
            }}
            disabled={loading || totalSel === 0}
          >
            Limpiar
          </button>
        </div>

        <form
          onSubmit={(e) => {
            e.preventDefault();
            aplicarFiltros();
          }}
        >
          <Accordion title="Marca">
            <div className="fchk__list">
              {marcas.map((m) => (
                <label key={m} className="fchk">
                  <input
                    type="checkbox"
                    checked={marcasSel.has(m)}
                    onChange={() => toggleSetValue(setMarcasSel, m)}
                  />
                  <span>{m}</span>
                </label>
              ))}
            </div>
          </Accordion>

          <Accordion title="Ancho">
            <div className="fchk__list">
              {anchos.map((a) => (
                <label key={a} className="fchk">
                  <input
                    type="checkbox"
                    checked={anchosSel.has(a)}
                    onChange={() => toggleSetValue(setAnchosSel, a)}
                  />
                  <span>{a}</span>
                </label>
              ))}
            </div>
          </Accordion>

          <Accordion title="Alto">
            <div className="fchk__list">
              {altos.map((h) => (
                <label key={h} className="fchk">
                  <input
                    type="checkbox"
                    checked={altosSel.has(h)}
                    onChange={() => toggleSetValue(setAltosSel, h)}
                  />
                  <span>{h}</span>
                </label>
              ))}
            </div>
          </Accordion>

          <Accordion title="Rin">
            <div className="fchk__list">
              {rines.map((r) => (
                <label key={r} className="fchk">
                  <input
                    type="checkbox"
                    checked={rinesSel.has(r)}
                    onChange={() => toggleSetValue(setRinesSel, r)}
                  />
                  <span>{r}</span>
                </label>
              ))}
            </div>
          </Accordion>

          <button className="filters-ecom__apply" type="submit" disabled={loading}>
            {loading ? "Cargando..." : `Aplicar (${totalSel})`}
          </button>
        </form>
      </aside>

      <section className="results">
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "baseline" }}>
          <h2>Resultados</h2>
          <small>{items.length} encontrados</small>
        </div>

        {error && <p style={{ color: "crimson" }}>{error}</p>}

        {!error && items.length === 0 && !loading && (
          <p>Selecciona filtros y presiona “Aplicar”.</p>
        )}

        <div className="grid catalog-grid">
          {items.map((it, idx) => (
            <article className="catalog-card" key={it.sku || idx}>
              <div className="card-image">
                <img src="/llanta.png" alt={`${it.marca || ""} ${it.modelo || ""}`.trim()} />
              </div>

              <div className="card-body">
                <span className="brand">{it.marca || "Marca"}</span>
                <h3 className="model">{it.modelo || "Modelo"}</h3>
                <p className="measure">{it.medida || ""}</p>

                <div className="price">
                  {it.precio ? `$${Number(it.precio).toLocaleString("es-MX")}` : ""}
                </div>

                <button
                  className="btn-primary"
                  type="button"
                  onClick={() => {
                    const msg = encodeURIComponent(
                      `Hola, quiero cotizar ${it.marca || ""} ${it.modelo || ""} ${it.medida || ""}`.trim()
                    );
                    window.open(`https://wa.me/521XXXXXXXXXX?text=${msg}`, "_blank");
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
