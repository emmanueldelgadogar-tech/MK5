// src/pages/Catalogo.jsx
import { useEffect, useMemo, useState } from "react";
import { useLocation, useNavigate, useParams } from "react-router-dom";
import { API_BASE } from "../config";

// ✅ IMPORTA TU CSS DEL CATALOGO (si no, no se aplicará)
import "../styles/catalogo.css";

// ✅ placeholder local (ajusta el path si tu llanta está en otro lado)
import llantaPlaceholder from "../assets/llanta.png";

import imgContinental from "../assets/CatalogoMarcas/bannercontinental.png";

const BRAND_SLUG_TO_DB = {
  continental: "CONTINENTAL",
  // si quieres hero por marca, agrega:
  // pirelli: "PIRELLI",
};

function slugToDbMarca(slug) {
  const s = (slug || "").toString().trim().toLowerCase();
  if (!s) return "";
  return (BRAND_SLUG_TO_DB[s] || s.toUpperCase()).trim();
}

const BRAND_META = {
  CONTINENTAL: {
    name: "Continental",
    image: imgContinental,
    desc: "Continental es una marca alemana reconocida por su tecnología enfocada en la seguridad y el control. Sus llantas ofrecen excelente frenado, gran estabilidad en carretera y alto desempeño en piso mojado, brindando una conducción cómoda, silenciosa y confiable En MK5 Llantas trabajamos con Continental porque creemos en la calidad real, el respaldo y la seguridad que se sienten en cada kilómetro.",
  },
  // PIRELLI: { ... }  // opcional
};

function parseMedidaParts(medida) {
  if (!medida) return null;
  const s = String(medida).toUpperCase().trim();
  const norm = s.replace(/\s+/g, "/").replace(/-/g, "/").replace(/R/g, "/");
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
    const next = new Set(prev);
    if (next.has(value)) next.delete(value);
    else next.add(value);
    return next;
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

  const { marca: marcaParam } = useParams();
  const marcaFixedUpper = slugToDbMarca(marcaParam);
  const brandMeta = marcaFixedUpper ? BRAND_META[marcaFixedUpper] : null;

  const [marcas, setMarcas] = useState([]);
  const [medidas, setMedidas] = useState([]);

  const [marcasSel, setMarcasSel] = useState(new Set());
  const [anchosSel, setAnchosSel] = useState(new Set());
  const [altosSel, setAltosSel] = useState(new Set());
  const [rinesSel, setRinesSel] = useState(new Set());

  const [qUrl, setQUrl] = useState("");
  const [medidaUrl, setMedidaUrl] = useState("");

  const [page, setPage] = useState(1);
  const [pages, setPages] = useState(1);
  const [total, setTotal] = useState(0);

  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    const params = new URLSearchParams(location.search);
    setQUrl((params.get("q") || "").trim());
    setMedidaUrl((params.get("medida") || "").trim());
  }, [location.search]);

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

  useEffect(() => {
    if (!medidaUrl) return;
    const p = parseMedidaParts(medidaUrl);
    if (!p) return;

    setAnchosSel(new Set([p.ancho]));
    setAltosSel(new Set([p.alto]));
    setRinesSel(new Set([p.rin]));
  }, [medidaUrl]);

  const aplicarFiltros = async ({ append = false, pageOverride } = {}) => {
    try {
      setLoading(true);
      setError("");

      const params = new URLSearchParams();

      const marcasFinal = new Set(marcasSel);
      if (marcaFixedUpper) {
        marcasFinal.clear();
        marcasFinal.add(marcaFixedUpper);
      }

      const qFinal = (qUrl || "").trim();
      if (qFinal) params.set("q", qFinal);

      if (marcasFinal.size) params.set("marcas", Array.from(marcasFinal).join(","));
      if (anchosSel.size) params.set("anchos", Array.from(anchosSel).join(","));
      if (altosSel.size) params.set("altos", Array.from(altosSel).join(","));
      if (rinesSel.size) params.set("rines", Array.from(rinesSel).join(","));

      params.set("sort", "price_asc");

      const nextPage = pageOverride ?? (append ? page + 1 : 1);
      params.set("page", String(nextPage));
      params.set("limit", "24");

      const res = await fetch(`${API_BASE}/api/catalogo/items?${params.toString()}`);
      if (!res.ok) throw new Error(`HTTP ${res.status}`);

      const data = await res.json();

      setTotal(data.total || 0);
      setPages(data.pages || 1);
      setPage(data.page || nextPage);

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

  useEffect(() => {
    setItems([]);
    setPage(1);
    setPages(1);
    setTotal(0);
    aplicarFiltros({ append: false, pageOverride: 1 });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [marcaFixedUpper, qUrl, medidaUrl, marcasSel, anchosSel, altosSel, rinesSel]);

  const limpiar = () => {
    if (!marcaFixedUpper) setMarcasSel(new Set());
    setAnchosSel(new Set());
    setAltosSel(new Set());
    setRinesSel(new Set());

    const target = marcaParam ? `/catalogo/${marcaParam}` : "/catalogo";
    navigate(target, { replace: true });

    setTimeout(() => aplicarFiltros({ append: false, pageOverride: 1 }), 0);
  };

  const totalSel =
    (marcaFixedUpper ? 0 : marcasSel.size) + anchosSel.size + altosSel.size + rinesSel.size;

  return (
    <main className="main catalogo catalogoWide">
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

          <button type="button" className="filters-ecom__clear" onClick={limpiar}>
            Limpiar
          </button>
        </div>

        <form
          onSubmit={(e) => {
            e.preventDefault();
            aplicarFiltros({ append: false, pageOverride: 1 });
          }}
        >
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
        {marcaFixedUpper && brandMeta && (
          <div className="brandHero">
            <div className="brandHero__media">
              <img src={brandMeta.image} alt={brandMeta.name} />
            </div>

            <div className="brandHero__info">
              <h1>Catálogo {brandMeta.name}</h1>
              <p>{brandMeta.desc}</p>

              <div className="brandHero__chips">
                <span>Instalación</span>
                <span>Garantía</span>
                <span>Atención WhatsApp</span>
              </div>
            </div>
          </div>
        )}

        <div className="catalogHead">
          <h2>{marcaFixedUpper ? `Productos ${marcaFixedUpper}` : "Resultados"}</h2>
          <small>{total} encontrados</small>
        </div>

        {error && <p className="catalogError">{error}</p>}
        {!error && items.length === 0 && !loading && <p>No hay resultados con esos filtros.</p>}

        <div className="catalog-grid">
          {items.map((it, idx) => (
            <article className="catalog-card" key={it.sku || idx}>
              <div className="card-image">
                <img
                  src={it.imagen || llantaPlaceholder}
                  alt={`${it.marca || ""} ${it.modelo || ""}`.trim()}
                  loading="lazy"
                />
              </div>

              <div className="card-body">
                <span className="brand">{it.marca || "Marca"}</span>
                <h3 className="model">{it.modelo || "Modelo"}</h3>
                <p className="measure">{it.medida || ""}</p>

                <div className="card-price">
                  {it.precio
                    ? `$${Number(it.precio).toLocaleString("es-MX", {
                        minimumFractionDigits: 2,
                        maximumFractionDigits: 2,
                      })}`
                    : ""}
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

        <div className="catalogMore">
          {page < pages && (
            <button
              className="filters-ecom__apply catalogMore__btn"
              type="button"
              disabled={loading}
              onClick={() => aplicarFiltros({ append: true })}
            >
              {loading ? "Cargando..." : "Cargar más"}
            </button>
          )}
        </div>
      </section>
    </main>
  );
}
