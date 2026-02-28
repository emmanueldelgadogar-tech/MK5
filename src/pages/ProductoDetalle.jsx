import { useEffect, useMemo, useState } from "react";
import { Link, useLocation, useNavigate, useParams } from "react-router-dom";

/* ── Vehículos compatibles por medida (mercado mexicano) ── */
const VEHICULOS_POR_MEDIDA = {
  "175/65R14": ["Chevrolet Spark", "Nissan March", "Fiat 500"],
  "185/60R15": ["VW Polo", "Renault Sandero", "Peugeot 207"],
  "185/65R15": ["Honda City", "Nissan March", "Chevrolet Aveo", "Kia Rio", "Hyundai Accent"],
  "195/55R15": ["VW Golf A4", "SEAT Ibiza", "Opel Astra"],
  "195/60R15": ["Toyota Yaris", "Nissan Tiida", "Chevrolet Beat"],
  "195/65R15": ["VW Jetta A5", "SEAT Ibiza", "Chevrolet Aveo", "Ford Focus", "Nissan Tsuru"],
  "195/55R16": ["VW Golf VII", "SEAT León", "Skoda Octavia"],
  "205/55R16": ["VW Jetta", "VW Golf", "SEAT León", "Mazda 3", "Toyota Corolla", "Nissan Sentra"],
  "205/60R16": ["Toyota Camry", "Honda Accord", "Nissan Altima", "Ford Fusion"],
  "205/65R16": ["Nissan X-Trail", "Hyundai Tucson", "Kia Sportage"],
  "215/55R17": ["Toyota RAV4", "Honda CR-V", "Nissan Qashqai", "Mazda CX-5"],
  "215/60R17": ["Toyota Sienna", "Nissan Pathfinder", "Chevrolet Orlando"],
  "225/45R17": ["VW Tiguan", "Chevrolet Equinox", "Ford Edge"],
  "225/50R17": ["BMW Serie 3", "Audi A4", "Mercedes C200"],
  "225/65R17": ["Chevrolet Trax", "Nissan X-Trail", "Toyota RAV4", "Ford Escape"],
  "235/55R17": ["Toyota Highlander", "Ford Explorer", "Jeep Grand Cherokee"],
  "245/45R18": ["BMW Serie 3", "Audi A4", "Mercedes C200", "VW Passat"],
  "255/60R18": ["Chevrolet Suburban", "GMC Yukon", "Ford Expedition"],
  "265/60R18": ["Chevrolet Tahoe", "Ford F-150", "Toyota Tundra"],
  "265/70R17": ["Toyota Hilux", "Chevrolet Silverado", "Ford Ranger", "Nissan Frontier"],
};

function normalizeMedidaKey(medida) {
  const raw = String(medida || "").toUpperCase().trim();
  const m = raw.match(/(\d{3})[\/\-](\d{2})[R\/\-](\d{2})/);
  if (!m) return null;
  return `${m[1]}/${m[2]}R${m[3]}`;
}
import { API_BASE } from "../config";
import llantaPlaceholder from "../assets/llanta.png";
import logoContinental from "../assets/logos/continental.png";
import logoPirelli from "../assets/logos/pirelli.png";
import logoMichelin from "../assets/logos/michelin.png";
import logoBridgestone from "../assets/logos/bridgestone.png";
import logoGoodyear from "../assets/logos/goodyear.png";
import logoHankook from "../assets/logos/hankook.png";
import {
  addToCart,
  buildProductPath,
  buildProductSlug,
  estimateListPrice,
  formatMoney,
  getProductTitle,
} from "../utils/catalogoHelpers";
import { trackEvent } from "../utils/metrics";
import "../styles/catalogo.css";

const BRAND_LOGOS = {
  CONTINENTAL: logoContinental,
  PIRELLI: logoPirelli,
  MICHELIN: logoMichelin,
  BRIDGESTONE: logoBridgestone,
  GOODYEAR: logoGoodyear,
  HANKOOK: logoHankook,
};

function availabilityLevel(stockValue) {
  const stock = Number(stockValue || 0);
  if (stock >= 100) return 5;
  if (stock >= 50) return 4;
  if (stock >= 20) return 3;
  if (stock >= 10) return 2;
  return 1;
}

function parseMedida(medida) {
  const raw = String(medida || "").toUpperCase().trim();
  const m = raw.match(/^(\d{3})[\/-](\d{2})[R\/-]?(\d{2})/);
  if (!m) return null;
  return {
    ancho: m[1],
    perfil: m[2],
    rin: m[3],
  };
}

function parseLoadAndSpeed(modelo) {
  const text = String(modelo || "").toUpperCase().trim();
  const m = text.match(/(\d{2,3})([A-Z])(?:\s|$)/);
  if (!m) return { carga: "-", velocidad: "-" };
  const speedMap = {
    H: "210 km/h",
    V: "240 km/h",
    W: "270 km/h",
    T: "190 km/h",
    S: "180 km/h",
    R: "170 km/h",
    Y: "300 km/h",
  };
  return {
    carga: m[1],
    velocidad: `${m[2]} (${speedMap[m[2]] || "N/A"})`,
  };
}

function isRunFlatModel(modelo) {
  const text = String(modelo || "").toUpperCase();
  return text.includes("RFT") || text.includes("RUN FLAT");
}

export default function ProductoDetalle() {
  const { productoSlug } = useParams();
  const location = useLocation();
  const navigate = useNavigate();

  const sku = useMemo(() => {
    const p = new URLSearchParams(location.search);
    return String(p.get("sku") || "").trim();
  }, [location.search]);

  const [item, setItem] = useState(location.state?.item || null);
  const [qty, setQty] = useState(1);
  const [loading, setLoading] = useState(!location.state?.item);
  const [error, setError] = useState("");
  const [viewTracked, setViewTracked] = useState(false);
  const [similarItems, setSimilarItems] = useState([]);
  const [activeImg, setActiveImg] = useState(0);
  const [zoomOpen, setZoomOpen] = useState(false);

  const images = useMemo(() => {
    if (!item) return [llantaPlaceholder];
    if (item.imagenes) {
      try {
        const arr = JSON.parse(item.imagenes);
        if (Array.isArray(arr) && arr.length > 0) return arr;
      } catch { /* ignorar */ }
    }
    return [item.imagen || llantaPlaceholder];
  }, [item]);

  useEffect(() => {
    const stateItem = location.state?.item || null;
    if (stateItem && buildProductSlug(stateItem) === productoSlug) {
      setItem(stateItem);
      setLoading(false);
      setError("");
      return;
    }

    let cancelled = false;
    async function loadItem() {
      try {
        setLoading(true);
        setError("");

        let exact = null;
        if (sku) {
          const res = await fetch(`${API_BASE}/api/catalogo/item?sku=${encodeURIComponent(sku)}`);
          if (res.ok) {
            const data = await res.json();
            exact = data?.item || null;
          }
        }

        if (!exact) {
          const q = productoSlug.replace(/^llanta-/, "").replace(/-+/g, " ").trim();
          const p = new URLSearchParams();
          p.set("q", q);
          p.set("limit", "100");

          const res = await fetch(`${API_BASE}/api/catalogo/items?${p.toString()}`);
          if (!res.ok) throw new Error(`HTTP ${res.status}`);

          const data = await res.json();
          const rows = Array.isArray(data?.items) ? data.items : [];
          exact = rows.find((row) => buildProductSlug(row) === productoSlug) || null;
        }

        if (!exact) throw new Error("item_not_found");

        if (!cancelled) {
          setItem(exact);
          const canonical = buildProductPath(exact);
          const currentPath = `${location.pathname}${location.search}`;
          if (canonical !== currentPath) navigate(canonical, { replace: true, state: { item: exact } });
        }
      } catch {
        if (!cancelled) setError("No pude cargar ese producto desde la base de datos.");
      } finally {
        if (!cancelled) setLoading(false);
      }
    }

    loadItem();
    return () => {
      cancelled = true;
    };
  }, [location.pathname, location.search, location.state?.item, navigate, productoSlug, sku]);

  if (loading) {
    return (
      <main className="main product-page">
        <p>Cargando producto...</p>
      </main>
    );
  }

  if (error || !item) {
    return (
      <main className="main product-page">
        <p>{error || "Producto no disponible."}</p>
        <Link to="/catalogo" className="product-back">
          Volver al catálogo
        </Link>
      </main>
    );
  }

  const stock = Math.max(Number(item.stock || 0), 1);
  const oldPrice = estimateListPrice(item.precio);
  const brandKey = String(item.marca || "").trim().toUpperCase();
  const brandLogo = BRAND_LOGOS[brandKey] || null;
  const mk5Price = Number(item.precio || 0);
  const ahorro = oldPrice - mk5Price;
  const medidaData = parseMedida(item.medida);
  const loadSpeed = parseLoadAndSpeed(item.modelo);
  const runFlat = isRunFlatModel(item.modelo);

  const searchText = `${item.marca || ""} ${item.modelo || ""} ${item.medida || ""}`.trim();
  const mlUrl = `https://listado.mercadolibre.com.mx/${encodeURIComponent(searchText)}`;
  const amzUrl = `https://www.amazon.com.mx/s?k=${encodeURIComponent(searchText)}`;

  const compareRows = [
    {
      canal: "Mercado Libre",
      price: mk5Price * 1.12,
      logo: "ML",
      url: mlUrl,
    },
    {
      canal: "Amazon",
      price: mk5Price * 1.18,
      logo: "AMZ",
      url: amzUrl,
    },
    {
      canal: "MK5",
      price: mk5Price,
      logo: "MK5",
      url: "#",
    },
  ];

  useEffect(() => {
    if (!item || viewTracked) return;
    trackEvent("product_view", {
      sku: String(item.sku || "").trim(),
      amount: Number(item.precio || 0),
      source: "detalle",
    });
    setViewTracked(true);
  }, [item, viewTracked]);

  useEffect(() => {
    if (!item?.medida) return;
    const parts = parseMedida(item.medida);
    if (!parts) return;
    const params = new URLSearchParams();
    params.set("anchos", parts.ancho);
    params.set("altos", parts.perfil);
    params.set("rines", parts.rin);
    params.set("limit", "8");
    fetch(`${API_BASE}/api/catalogo/items?${params.toString()}`)
      .then((r) => r.json())
      .then((data) => {
        const currentSku = String(item.sku || "").trim();
        const rows = (data.items || []).filter(
          (x) => String(x.sku || "").trim() !== currentSku
        );
        setSimilarItems(rows.slice(0, 6));
      })
      .catch(() => {});
  }, [item?.medida, item?.sku]);

  return (
    <main className="main product-page">
      <Link to="/catalogo" className="product-back">
        ← Volver al catálogo
      </Link>

      <section className="product-layout sketch-top">
        <article className="product-gallery">
          {/* Thumbnails laterales */}
          {images.length > 1 && (
            <div className="gallery-thumbs">
              {images.map((img, i) => (
                <img
                  key={i}
                  src={img}
                  alt=""
                  className={`gallery-thumb${activeImg === i ? " active" : ""}`}
                  onClick={() => setActiveImg(i)}
                />
              ))}
            </div>
          )}

          {/* Imagen principal con botón de zoom */}
          <div className="gallery-main" onClick={() => setZoomOpen(true)}>
            <img
              src={images[activeImg]}
              alt={`${item.marca || ""} ${item.modelo || ""}`.trim()}
              loading="lazy"
            />
            <span className="gallery-zoom-btn" title="Ampliar">⊕</span>
          </div>
        </article>

        {/* Modal de zoom */}
        {zoomOpen && (
          <div className="gallery-modal" onClick={() => setZoomOpen(false)}>
            <button className="gallery-modal-close" onClick={() => setZoomOpen(false)}>✕</button>
            {images.length > 1 && (
              <button
                className="gallery-modal-prev"
                onClick={(e) => { e.stopPropagation(); setActiveImg((p) => (p - 1 + images.length) % images.length); }}
              >‹</button>
            )}
            <img
              src={images[activeImg]}
              alt={`${item.marca || ""} ${item.modelo || ""}`.trim()}
              onClick={(e) => e.stopPropagation()}
            />
            {images.length > 1 && (
              <button
                className="gallery-modal-next"
                onClick={(e) => { e.stopPropagation(); setActiveImg((p) => (p + 1) % images.length); }}
              >›</button>
            )}
            <span className="gallery-modal-counter">{activeImg + 1} / {images.length}</span>
          </div>
        )}

        <article className="product-summary">
          <span className="product-brand-pill">
            {brandLogo ? (
              <>
                <img src={brandLogo} alt={item.marca || "Marca"} />
                <strong>{item.marca || "Marca"}</strong>
              </>
            ) : (
              <span>{item.marca || "Marca"}</span>
            )}
          </span>
          <h1>{getProductTitle(item)}</h1>
          <p className="product-ref">Ref. {item.sku || "N/A"}</p>

          <div className="product-price">
            <strong>{formatMoney(mk5Price)}</strong>
            <small>{formatMoney(oldPrice)}</small>
            <span>¡Ahorras {formatMoney(ahorro)}!</span>
          </div>

          <div className="product-shipping-row">
            <p>Envio a domicilio: 2 - 5 dias</p>
            <p>Entrega en sucursal: 1 - 2 dias</p>
          </div>

          <div className="product-benefits">
            <p>
              <span className="benefit-icon" aria-hidden="true">🛠️</span>
              Instalacion y balanceo gratis en sucursal
            </p>
            <p>
              <span className="benefit-icon" aria-hidden="true">🚚</span>
              Envio gratis 1-2 dias habiles
            </p>
          </div>

          <div className="card-stock">
            <strong>Disponibilidad</strong>
            <div className="stock-line">
              <span>Nacional</span>
              <div className="stock-bars">
                {[0, 1, 2, 3, 4].map((bar) => (
                  <i key={bar} className={bar < availabilityLevel(item.stock) ? "is-on" : ""} />
                ))}
              </div>
              <span>+ {stock} pzs</span>
            </div>
          </div>

          <div className="card-qty product-qty">
            <span>Cantidad</span>
            <div>
              <button type="button" onClick={() => setQty((n) => Math.max(1, n - 1))}>
                -
              </button>
              <strong>{qty}</strong>
              <button type="button" onClick={() => setQty((n) => n + 1)}>
                +
              </button>
            </div>
          </div>

          <div className="product-actions product-actions--top">
            <button
              className="btn-primary"
              type="button"
              onClick={() => {
                const ok = addToCart(item, qty);
                if (!ok) setError("Este producto no tiene SKU válido para carrito.");
                else {
                  trackEvent("add_to_cart", {
                    sku: String(item.sku || "").trim(),
                    qty,
                    amount: Number(item.precio || 0) * qty,
                    source: "detalle",
                  });
                }
              }}
            >
              AGREGAR AL CARRITO
            </button>
          </div>

          <div className="product-actions product-actions--split">
            <button
              className="btn-primary"
              type="button"
              onClick={() => {
                const ok = addToCart(item, 2);
                if (!ok) setError("Este producto no tiene SKU válido para carrito.");
                else {
                  trackEvent("add_to_cart", {
                    sku: String(item.sku || "").trim(),
                    qty: 2,
                    amount: Number(item.precio || 0) * 2,
                    source: "detalle",
                  });
                }
              }}
            >
              AGREGAR 2 LLANTAS
            </button>
            <button
              className="btn-primary"
              type="button"
              onClick={() => {
                const ok = addToCart(item, 4);
                if (!ok) setError("Este producto no tiene SKU válido para carrito.");
                else {
                  trackEvent("add_to_cart", {
                    sku: String(item.sku || "").trim(),
                    qty: 4,
                    amount: Number(item.precio || 0) * 4,
                    source: "detalle",
                  });
                }
              }}
            >
              AGREGAR 4 LLANTAS
            </button>
          </div>

          <div className="product-actions">
            <button
              className="btn-secondary product-buy"
              type="button"
              onClick={() => {
                const ok = addToCart(item, qty);
                if (!ok) {
                  setError("Este producto no tiene SKU válido para carrito.");
                  return;
                }
                trackEvent("begin_checkout", {
                  sku: String(item.sku || "").trim(),
                  qty,
                  amount: Number(item.precio || 0) * qty,
                  source: "detalle",
                });
                navigate("/checkout");
              }}
            >
              COMPRAR AHORA
            </button>
          </div>
        </article>

        <aside className="product-side">
          <div className="side-card">
            <h3>Garantias MK5</h3>
            <ul>
              <li>Producto nuevo y sellado</li>
              <li>Facturacion inmediata</li>
              <li>Soporte por WhatsApp</li>
            </ul>
          </div>
          <div className="side-card">
            <h3>Disponibilidad tienda</h3>
            <p>Inventario nacional activo</p>
            <b>{stock} piezas</b>
          </div>
        </aside>
      </section>

      <section className="detail-bottom">
        {/* ── Descripción ── */}
        <div className="detail-section">
          <h3>Descripcion</h3>
          <div className="product-desc-logos" aria-label="Atributos de desempeño">
            {runFlat ? (
              <span className="product-desc-logo">
                <span className="product-desc-logo__icon">RF</span>
                <span>Run Flat</span>
              </span>
            ) : null}
            <span className="product-desc-logo">
              <span className="product-desc-logo__icon">SOL</span>
              <span>Piso seco</span>
            </span>
          </div>
          <p>
            Llanta {item.marca || ""} {item.modelo || ""} en medida {item.medida || ""}. Ideal para uso diario
            con enfoque en rendimiento, agarre y durabilidad.
          </p>
        </div>

        {/* ── Especificaciones ── */}
        <div className="detail-section">
          <h3>Especificaciones</h3>
          <div className="spec-layout">
            <div className="spec-col">
              <h4>Medidas</h4>
              <div className="spec-row"><span>Ancho</span><b>{medidaData?.ancho || "-"}</b></div>
              <div className="spec-row"><span>Perfil</span><b>{medidaData?.perfil || "-"}</b></div>
              <div className="spec-row"><span>Rin</span><b>{medidaData?.rin || "-"}</b></div>
              <div className="spec-row"><span>Medida completa</span><b>{item.medida || "-"}</b></div>
            </div>
            <div className="spec-col">
              <h4>Atributos</h4>
              <div className="spec-row"><span>Indice de carga</span><b>{loadSpeed.carga}</b></div>
              <div className="spec-row"><span>Indice de velocidad</span><b>{loadSpeed.velocidad}</b></div>
              <div className="spec-row"><span>Segmento</span><b>Turismo</b></div>
              <div className="spec-row"><span>Tipo de vehiculo</span><b>Sedan / Hatchback</b></div>
              <div className="spec-row"><span>Temporada</span><b>Todas las estaciones</b></div>
            </div>
          </div>
        </div>

        {/* ── Vehículos compatibles ── */}
        {(() => {
          const key = normalizeMedidaKey(item.medida);
          const vehiculos = key ? (VEHICULOS_POR_MEDIDA[key] || []) : [];
          return (
            <div className="detail-section">
              <h3>Vehiculos compatibles</h3>
              {vehiculos.length > 0 ? (
                <div className="vehicles-grid">
                  {vehiculos.map((v) => (
                    <span key={v} className="vehicle-chip">🚗 {v}</span>
                  ))}
                </div>
              ) : (
                <p style={{margin:0, color:"#6b7280", fontSize:"14px"}}>
                  Medida {item.medida || ""}. Consulta con nosotros por WhatsApp para verificar compatibilidad con tu vehiculo.
                </p>
              )}
            </div>
          );
        })()}

        {/* ── Comparacion de precios ── */}
        <div className="detail-section">
          <h3>Comparacion de precios</h3>
          <small className="compare-note">*Referencial en linea para la misma medida/modelo.</small>
          <div className="compare-table">
            {compareRows.map((row) => {
              const ahorroVs = row.price - mk5Price;
              const isMk5 = row.canal === "MK5";
              return (
                <div className={`compare-row ${isMk5 ? "is-mk5" : ""}`} key={row.canal}>
                  <div className={`market-logo ${row.logo.toLowerCase()}`}>{row.logo}</div>
                  <span>{row.canal}</span>
                  <b>{formatMoney(row.price)}</b>
                  <em>{isMk5 ? "Mejor precio" : `Ahorro ${formatMoney(ahorroVs)}`}</em>
                  {!isMk5 && (
                    <a href={row.url} target="_blank" rel="noreferrer">
                      Ver
                    </a>
                  )}
                </div>
              );
            })}
          </div>
        </div>

        {/* ── Productos similares ── */}
        {similarItems.length > 0 && (
          <div className="detail-section">
            <h3>Otros productos en medida {item.medida}</h3>
            <div className="similares-grid">
              {similarItems.map((sim) => (
                <Link
                  key={String(sim.sku || sim.id || Math.random())}
                  to={buildProductPath(sim)}
                  state={{ item: sim }}
                  className="similar-card"
                >
                  <img
                    className="similar-card__img"
                    src={sim.imagen || llantaPlaceholder}
                    alt={`${sim.marca || ""} ${sim.modelo || ""}`.trim()}
                    loading="lazy"
                  />
                  <div className="similar-card__body">
                    <p className="similar-card__brand">{sim.marca}</p>
                    <p className="similar-card__model">{sim.modelo}</p>
                    <p className="similar-card__size">{sim.medida}</p>
                    <strong className="similar-card__price">{formatMoney(Number(sim.precio || 0))}</strong>
                  </div>
                </Link>
              ))}
            </div>
          </div>
        )}
      </section>
    </main>
  );
}
