// src/pages/Catalogo.jsx
import { useEffect, useMemo, useState } from "react";
import { useLocation, useNavigate, useParams } from "react-router-dom";
import { API_BASE } from "../config";

function parseMedidaParts(medida) {
  if (!medida) return null;
  const s = String(medida).toUpperCase().trim();
  // acepta: 155/50/16, 155/50R16, 155 50 16, 155-50-16
  const norm = s
    .replace(/\s+/g, "/")
    .replace(/-/g, "/")
    .replace(/R/g, "/");
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
  const navigate = useNavigate();
  const location = useLocation();

  // ✅ marca fija por ruta: /catalogo/:marca  (ej: /catalogo/pirelli)
  const { marca: marcaParam } = useParams();
  const marcaFixed = (marcaParam || "").trim();
  const marcaFixedUpper = marcaFixed ? marcaFixed.toUpperCase() : "";

  const [marcas, setMarcas] = useState([]);
  const [medidas, setMedidas] = useState([]);

  // ✅ multi-select (Sets)
  const [marcasSel, setMarcasSel] = useState(new Set());
  const [anchosSel, setAnchosSel] = useState(new Set());
  const [altosSel, setAltosSel] = useState(new Set());
  const [rinesSel, setRinesSel] = useState(new Set());

  // ✅ query / medida (desde URL)
  const [qUrl, setQUrl] = useState("");
  const [medidaUrl, setMedidaUrl] = useState("");

  // ✅ paginado
  const [page, setPage] = useState(1);
  const [pages, setPages] = useState(1);
  const [total, setTotal] = useState(0);

  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  // 0) Leer URL (?q=... y ?medida=...)
  useEffect(() => {
    const params = new URLSearchParams(location.search);
    const q = (params.get("q") || "").trim();
    const medida = (params.get("medida") || "").trim();

    setQUrl(q);
    setMedidaUrl(medida);
  }, [location.search]);

  // 1) Cargar filtros base (marcas + medidas)
  //    ✅ Si hay marca fija, pedir filtros recortados por esa marca
  useEffect(() => {
    const params = new URLSearchParams();
    if (marcaFixedUpper) params.set("marca", marcaFixedUpper);

    fetch(`${API_BASE}/api/catalogo/filtros?${params.toString()}`)
      .then((res) => res.json())
      .then((data) => {
        setMarcas(data.marcas || []);
        setMedidas(data.medidas || []);
      })
      .catch(() => {
        setMarcas([]);
        setMedidas([]);
      });
  }, [marcaFixedUpper]);

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

  // 3) Si viene ?medida=155/50/16, aplicar selección automática a Sets
  useEffect(() => {
    if (!medidaUrl) return;

    const p = parseMedidaParts(medidaUrl);
    if (!p) return;

    setAnchosSel(new Set([p.ancho]));
    setAltosSel(new Set([p.alto]));
    setRinesSel(new Set([p.rin]));

    // si hay marca fija, no tocamos marcasSel; si no, dejamos marcasSel como está.
    // (si quisieras limpiar marcasSel aquí, me dices)
  }, [medidaUrl]);

  // 4) Traer items con filtros + paginado
  const aplicarFiltros = async ({ append = false, pageOverride } = {}) => {
    try {
      setLoading(true);
      setError("");

      const params = new URLSearchParams();

      // ✅ marca fija por ruta tiene prioridad
      const marcasFinal = new Set(marcasSel);
      if (marcaFixedUpper) {
        marcasFinal.clear();
        marcasFinal.add(marcaFixedUpper);
      }

      // ✅ q desde URL (si existe) se manda como q
      const qFinal = (qUrl || "").trim();
      if (qFinal) params.set("q", qFinal);

      if (marcasFinal.size) params.set("marcas", Array.from(marcasFinal).join(","));
      if (anchosSel.size) params.set("anchos", Array.from(anchosSel).join(","));
      if (altosSel.size) params.set("altos", Array.from(altosSel).join(","));
      if (rinesSel.size) params.set("rines", Array.from(rinesSel).join(","));

      params.set("sort", "price_asc");

      const p = pageOverride ?? (append ? page + 1 : 1);
      params.set("page", String(p));
      params.set("limit", "24");

      const res = await fetch(`${API_BASE}/api/catalogo/items?${params.toString()}`);
      if (!res.ok) throw new Error(`HTTP ${res.status}`);

      const data = await res.json();

      setTotal(data.total || 0);
      setPages(data.pages || 1);
      setPage(data.page || p);

      if (append) setItems((prev) => [...prev, ...(data.items || [])]);
      else setItems(data.items || []);
    } catch (e) {
      console.error(e);
      setError("No se pudo cargar el catálogo. Reintenta.");
      setItems([]);
      setTotal(0);
      setPages(1);
      setPage(1);
    } finally {
      setLoading(false);
    }
  };

  // 5) Ejecutar aplicarFiltros cuando cambien filtros/URL/marca fija
  useEffect(() => {
    // reset paginado al cambiar filtros
    setItems([]);
    setPage(1);
    setPages(1);
    setTotal(0);

    if (marcaFixedUpper) setMarcasSel(new Set());

    aplicarFiltros({ append: false, pageOverride: 1 });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [
    marcaFixedUpper,
    qUrl,
    medidaUrl,
    marcasSel,
    anchosSel,
    altosSel,
    rinesSel,
  ]);

  const limpiar = () => {
    // si hay marca fija, no limpies esa
    if (!marcaFixedUpper) setMarcasSel(new Set());
    setAnchosSel(new Set());
    setAltosSel(new Set());
    setRinesSel(new Set());

    // limpia también query params en la URL (q y medida)
    navigate("/catalogo", { replace: true });

    setTimeout(() => aplicarFiltros({ append: false, pageOverride: 1 }), 0);
  };

  const totalSel =
    (marcaFixedUpper ? 0 : marcasSel.size) +
    anchosSel.size +
    altosSel.size +
    rinesSel.size;

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
              {marcaFixedUpper && (
                <>
                  <span className="sep">•</span>
                  <span>
                    Marca fija: <b>{marcaFixedUpper}</b>
                  </span>
                </>
              )}
              {medidaUrl && (
                <>
                  <span className="sep">•</span>
                  <span>
                    Medida: <b>{medidaUrl}</b>
                  </span>
                </>
              )}
              {qUrl && (
                <>
                  <span className="sep">•</span>
                  <span>
                    Búsqueda: <b>{qUrl}</b>
                  </span>
                </>
              )}
            </div>
          </div>

          <button
            type="button"
            className="filters-ecom__clear"
            onClick={limpiar}
            disabled={loading && items.length === 0}
          >
            Limpiar
          </button>
        </div>

        <form
          onSubmit={(e) => {
            e.preventDefault();
            aplicarFiltros({ append: false, pageOverride: 1 });
          }}
        >
          {/* ✅ Marca (solo si NO hay marca fija por URL) */}
          {!marcaFixedUpper && (
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
          )}

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
          <h2>{marcaFixedUpper ? `Catálogo ${marcaFixedUpper}` : "Resultados"}</h2>
          <small>{total} encontrados</small>
        </div>

        {error && <p style={{ color: "crimson" }}>{error}</p>}

        {!error && items.length === 0 && !loading && <p>No hay resultados con esos filtros.</p>}

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

        {/* ✅ Cargar más */}
        <div style={{ display: "flex", justifyContent: "center", marginTop: 18 }}>
          {page < pages && (
            <button
              className="filters-ecom__apply"
              type="button"
              disabled={loading}
              onClick={() => aplicarFiltros({ append: true })}
              style={{ maxWidth: 320 }}
            >
              {loading ? "Cargando..." : "Cargar más"}
            </button>
          )}
        </div>
      </section>
    </main>
  );
}
