import "../styles/home.css";
import "../styles/pages.css";
import { useEffect, useMemo, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { API_BASE } from "../config";
import { formatMoney, getProductTitle, addToCart, getItemSku, buildProductPath } from "../utils/catalogoHelpers";
import llantaPlaceholder from "../assets/llanta.png";

import pirelliLogo from "../assets/logos/pirelli.png";
import firestoneLogo from "../assets/logos/firestone.png";
import euzkadiLogo from "../assets/logos/euzkadi.png";
import antareslogo from "../assets/logos/antares.png";
import bridgestonelogo from "../assets/logos/bridgestone.png";
import continentalLogo from "../assets/logos/continental.png";
import hankookLogo from "../assets/logos/hankook.png";
import cooperlogo from "../assets/logos/cooper.png";
import blackhawklogo from "../assets/logos/blackhawk.png";
import laufennlogo from "../assets/logos/laufenn.png";
import michelinlogo from "../assets/logos/michelin.png";
import goodyearlogo from "../assets/logos/goodyear.png";
import nuevafiltro from "../assets/logos/nuevafiltro.png";
import goodrichlogo from "../assets/logos/goodrich.jpg";
import tornellogo from "../assets/logos/tornel.png";
import pegasuslogo from "../assets/logos/pegasus.jpg";
import vinmaxlogo from "../assets/logos/vinmax.png";
import bannermsi from "../assets/logos/bannermsi.png";

import bridgestonePodio from "../assets/Marcas/bridgestone podio.jpeg";
import michelinPodio from "../assets/Marcas/michelin podio.jpg";
import goodyearPodio from "../assets/Marcas/goodyear podio.jpeg";
import continentalPodio from "../assets/Marcas/continental podio.jpg";
import pirelliPodio from "../assets/Marcas/pirelli podio.jpg";
import hankookPodio from "../assets/Marcas/hankook podio.png";
import firestonePodio from "../assets/Marcas/firestone podio.png";
import antaresPodio from "../assets/Marcas/podio antares.jpg";
import blackhawkPodio from "../assets/Marcas/podio blackhawk.jpg";
import cooperPodio from "../assets/Marcas/podio cooper.jpg";
import euzkadiPodio from "../assets/Marcas/podio euzkadi.jpg";
import goodrichPodio from "../assets/Marcas/podio goodrich.jpg";
import laufennPodio from "../assets/Marcas/podio laufenn.jpg";
import tornelPodio from "../assets/Marcas/podio tornel.jpg";
import vinmaxPodio from "../assets/Marcas/podio vinmax.jpg";


import promoMensualGoodyear from "../assets/promos mensuales/cuadraro goodyear.jpg";
import promoMensualJK from "../assets/promos mensuales/cuadrado jk.jpg";
import promoMensualKumho from "../assets/promos mensuales/cuadrado kumho.jpg";
import promoMensualMaxtrek from "../assets/promos mensuales/cuadrado maxtrek.jpg";
import promoMensualMinnell from "../assets/promos mensuales/cuadrado minnell.jpg";
import promoMensualVinmax from "../assets/promos mensuales/cuadrado vinmax.jpg";
import promoMensualVinmax2 from "../assets/promos mensuales/cuadrado vinmax 2.jpg";
import promoMensualVinmax3 from "../assets/promos mensuales/cuadrado vinmax 3.jpg";

import promoHeaderAntares from "../assets/promos header/promo antares.jpg";
import promoHeaderJK1 from "../assets/promos header/promo jk.jpg";
import promoHeaderJK2 from "../assets/promos header/promo jk 2.jpg";
import promoHeaderKumho from "../assets/promos header/promo kumho.jpg";
import promoHeaderLaufenn from "../assets/promos header/promo laufenn.jpg";

import AsistenteMK5 from "../components/AsistenteMK5";

const MARCAS_DESTACADAS = [
  { key: "pirelli", name: "Pirelli", img: pirelliLogo },
  { key: "bridgestone", name: "Bridgestone", img: bridgestonelogo },
  { key: "continental", name: "Continental", img: continentalLogo },
  { key: "michelin", name: "Michelin", img: michelinlogo },
  { key: "goodyear", name: "Goodyear", img: goodyearlogo },
  { key: "hankook", name: "Hankook", img: hankookLogo },
  { key: "firestone", name: "Firestone", img: firestoneLogo },
  { key: "euzkadi", name: "Euzkadi", img: euzkadiLogo },
  { key: "antares", name: "Antares", img: antareslogo },
  { key: "cooper", name: "Cooper", img: cooperlogo },
  { key: "blackhawk", name: "Blackhawk", img: blackhawklogo },
  { key: "laufenn", name: "Laufenn", img: laufennlogo },
  { key: "goodrich", name: "Goodrich", img: goodrichlogo },
  { key: "tornel", name: "Tornel", img: tornellogo },
  { key: "pegasus", name: "Pegasus", img: pegasuslogo },
  { key: "vinmax", name: "Vinmax", img: vinmaxlogo },
];

const PODIOS_DESTACADOS = [
  { key: "pirelli", name: "Pirelli", img: pirelliPodio, to: "/catalogo/pirelli" },
  { key: "bridgestone", name: "Bridgestone", img: bridgestonePodio, to: "/catalogo/bridgestone" },
  { key: "continental", name: "Continental", img: continentalPodio, to: "/catalogo/continental" },
  { key: "michelin", name: "Michelin", img: michelinPodio, to: "/catalogo/michelin" },
  { key: "goodyear", name: "Goodyear", img: goodyearPodio, to: "/catalogo/goodyear" },
  { key: "hankook", name: "Hankook", img: hankookPodio, to: "/catalogo/hankook" },
  { key: "firestone", name: "Firestone", img: firestonePodio, to: "/catalogo/firestone" },
  { key: "antares", name: "Antares", img: antaresPodio, to: "/catalogo/antares" },
  { key: "blackhawk", name: "Blackhawk", img: blackhawkPodio, to: "/catalogo/blackhawk" },
  { key: "cooper", name: "Cooper", img: cooperPodio, to: "/catalogo/cooper" },
  { key: "euzkadi", name: "Euzkadi", img: euzkadiPodio, to: "/catalogo/euzkadi" },
  { key: "goodrich", name: "Goodrich", img: goodrichPodio, to: "/catalogo/goodrich" },
  { key: "laufenn", name: "Laufenn", img: laufennPodio, to: "/catalogo/laufenn" },
  { key: "tornel", name: "Tornel", img: tornelPodio, to: "/catalogo/tornel" },
  { key: "vinmax", name: "Vinmax", img: vinmaxPodio, to: "/catalogo/vinmax" },
];

const PROMOS_MENSUALES = [
  { id: "goodyear", name: "Goodyear", img: promoMensualGoodyear, to: "/catalogo/goodyear" },
  { id: "jk", name: "JK", img: promoMensualJK, to: "/catalogo/jk" },
  { id: "kumho", name: "Kumho", img: promoMensualKumho, to: "/catalogo/kumho" },
  { id: "maxtrek", name: "Maxtrek", img: promoMensualMaxtrek, to: "/catalogo/maxtrek" },
  { id: "minnell", name: "Minnell", img: promoMensualMinnell, to: "/catalogo/minnell" },
  { id: "vinmax", name: "Vinmax", img: promoMensualVinmax, to: "/catalogo/vinmax" },
  { id: "vinmax-2", name: "Vinmax", img: promoMensualVinmax2, to: "/catalogo/vinmax" },
  { id: "vinmax-3", name: "Vinmax", img: promoMensualVinmax3, to: "/catalogo/vinmax" },
];

function TopSellerCard({ item }) {
  const navigate = useNavigate();
  const price = Number(item?.precio || 0);
  const productPath = buildProductPath(item);

  const handleAddToCart = (e) => {
    e.preventDefault();
    e.stopPropagation();
    addToCart(item, 1);
    alert("Agregado al carrito: " + getProductTitle(item));
  };

  const handleBuyNow = (e) => {
    e.preventDefault();
    e.stopPropagation();
    addToCart(item, 1);
    navigate("/checkout");
  };

  return (
    <Link className="ts-card" to={productPath} state={{ item }}>
      <div className="ts-card__badge-msi">6 MSI</div>
      <div className="ts-card__image-wrapper">
         <img src={item.imagen || llantaPlaceholder} alt={getProductTitle(item)} className="ts-card__image" onError={(e) => { e.target.onerror = null; e.target.src = llantaPlaceholder; }} />
      </div>
      <div className="ts-card__info">
         <h4 className="ts-card__title">{getProductTitle(item)}</h4>

         <div className="ts-card__availability">
            <svg className="ts-icon-stock" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"></path><polyline points="22 4 12 14.01 9 11.01"></polyline></svg>
            Disponibilidad
         </div>

         <div className="ts-card__prices">
            <strong className="ts-price-new">{formatMoney(price)}</strong>
            <small className="ts-price-note">Instalación, Válvula y Balanceo INCLUIDO</small>
         </div>

         <div className="ts-card__actions">
            <button className="ts-btn ts-btn--cart" onClick={handleAddToCart}>AGREGAR AL CARRITO</button>
            <button className="ts-btn ts-btn--buy" onClick={handleBuyNow}>COMPRAR AHORA</button>
         </div>
      </div>
    </Link>
  );
}

function AiAssistantBox({ onAskAssistant }) {
  const [q, setQ] = useState("");

  const examples = useMemo(
    () => [
      "Busco llanta 215/55/16…",
      "Llantas para Nissan March 2018…",
      "Busco llantas para Ford Fiesta 2015…",
      "Quiero llantas económicas para un Aveo 2015",
      "¿Qué llantas me recomiendas para un Honda Civic?",
    ],
    []
  );

  const [typed, setTyped] = useState("");
  const [exIdx, setExIdx] = useState(0);
  const [pos, setPos] = useState(0);
  const [deleting, setDeleting] = useState(false);

  useEffect(() => {
    if (q.trim()) return;

    const current = examples[exIdx] || "";
    const speed = deleting ? 28 : 40;

    const t = setTimeout(() => {
      if (!deleting) {
        const next = current.slice(0, pos + 1);
        setTyped(next);
        setPos(pos + 1);

        if (pos + 1 >= current.length) {
          setTimeout(() => setDeleting(true), 900);
        }
      } else {
        const next = current.slice(0, Math.max(0, pos - 1));
        setTyped(next);
        setPos(Math.max(0, pos - 1));

        if (pos - 1 <= 0) {
          setDeleting(false);
          setExIdx((i) => (i + 1) % examples.length);
        }
      }
    }, speed);

    return () => clearTimeout(t);
  }, [q, examples, exIdx, pos, deleting]);

  const submit = () => {
    const msg = (q || "").trim();
    if (!msg) return;
    onAskAssistant(msg);
  };

  return (
    <div className="card card--ai">
      <div className="aiTop">
        <div className="aiRobotZone" aria-hidden="true">
          <div className="aiRobotWrap">
            <AsistenteMK5 />
          </div>

          <div className="aiBubbles">
            <div className="aiBubble aiBubble--1">Estoy aqui para darte opiniones</div>
            <div className="aiBubble aiBubble--2">Puedo darte una recomendacion</div>
            <div className="aiBubble aiBubble--3">Si no sabes tu medida, solo escribe tu auto</div>
            <div className="aiBubble aiBubble--4">Preguntame si tienes dudas de envio o pagos</div>
          </div>
        </div>
      </div>

      <div className="aiInputRow">
        <div className="aiTextareaWrap">
          {!q.trim() ? (
            <div className="aiFakePlaceholder" aria-hidden="true">
              {typed}
              <span className="aiCaret">|</span>
            </div>
          ) : null}

          <textarea
            className="aiTextarea"
            value={q}
            onChange={(e) => setQ(e.target.value)}
            placeholder=""
            onKeyDown={(e) => {
              if (e.key === "Enter" && !e.shiftKey) {
                e.preventDefault();
                submit();
              }
            }}
          />
        </div>

        <button className="aiBtn" type="button" onClick={submit} disabled={!q.trim()}>
          Buscar
        </button>
      </div>
    </div>
  );
}

function ManualMeasureBox({
  anchos,
  alturas,
  rines,
  anchoSel,
  alturaSel,
  rinSel,
  setAnchoSel,
  setAlturaSel,
  setRinSel,
  onSubmit,
}) {
  return (
    <div className="card card--manual">
      <div className="card__head">
        <h3 className="card__title">Búsqueda manual por medida</h3>
        <p className="card__sub">Si ya sabes tu medida, búscala aquí rápido.</p>
      </div>

      <form className="measure-form measure-form--compact" onSubmit={onSubmit}>
        <div className="measure-row">
          <div className="measure-field">
            <label>ANCHO</label>
            <select
              value={anchoSel}
              onChange={(e) => {
                setAnchoSel(e.target.value);
                setAlturaSel("");
                setRinSel("");
              }}
            >
              <option value="">Selecciona</option>
              {anchos.map((x) => (
                <option key={x} value={x}>{x}</option>
              ))}
            </select>
          </div>

          <div className="measure-field">
            <label>ALTO</label>
            <select
              value={alturaSel}
              onChange={(e) => {
                setAlturaSel(e.target.value);
                setRinSel("");
              }}
            >
              <option value="">Selecciona</option>
              {alturas.map((x) => (
                <option key={x} value={x}>{x}</option>
              ))}
            </select>
          </div>

          <div className="measure-field">
            <label>RIN</label>
            <select value={rinSel} onChange={(e) => setRinSel(e.target.value)}>
              <option value="">Selecciona</option>
              {rines.map((x) => (
                <option key={x} value={x}>{x}</option>
              ))}
            </select>
          </div>
        </div>

        <button className="measure-btn" type="submit">
          BUSCAR
        </button>

        <div className="measure-guide">
          <img src={nuevafiltro} alt="Guía para identificar medida de llanta" />
        </div>
      </form>
    </div>
  );
}

export default function Home() {
  const navigate = useNavigate();

  const [anchos, setAnchos] = useState([]);
  const [alturas, setAlturas] = useState([]);
  const [rines, setRines] = useState([]);

  const [topSellers, setTopSellers] = useState([]);

  const [anchoSel, setAnchoSel] = useState("");
  const [alturaSel, setAlturaSel] = useState("");
  const [rinSel, setRinSel] = useState("");

  const DURATION = 5000;
  const PODIUM_DURATION = 4200;
  const [promoIndex, setPromoIndex] = useState(0);
  const [promoProgress, setPromoProgress] = useState(0);
  const [podiumIndex, setPodiumIndex] = useState(0);
  const [podiumVisibleCount, setPodiumVisibleCount] = useState(5);

  const promos = useMemo(
    () => [
      { id: "antares", src: promoHeaderAntares, alt: "Promo Antares", to: "/catalogo/antares", fit: "cover" },
      { id: "jk1", src: promoHeaderJK1, alt: "Promo JK", to: "/catalogo?q=JK", fit: "cover" },
      { id: "jk2", src: promoHeaderJK2, alt: "Promo JK 2", to: "/catalogo?q=JK", fit: "cover" },
      { id: "kumho", src: promoHeaderKumho, alt: "Promo Kumho", to: "/catalogo?q=KUMHO", fit: "cover" },
      { id: "laufenn", src: promoHeaderLaufenn, alt: "Promo Laufenn", to: "/catalogo/laufenn", fit: "cover" },
    ],
    []
  );

  const promoActiva = promos[promoIndex];

  const podiumVisible = useMemo(() => {
    if (!PODIOS_DESTACADOS.length) return [];
    const count = Math.min(Math.max(podiumVisibleCount, 1), PODIOS_DESTACADOS.length);
    return Array.from({ length: count }, (_, offset) => PODIOS_DESTACADOS[(podiumIndex + offset) % PODIOS_DESTACADOS.length]);
  }, [podiumIndex, podiumVisibleCount]);

  useEffect(() => {
    if (!promos.length) return;
    setPromoProgress(0);
    const start = Date.now();
    const tick = setInterval(() => {
      const p = ((Date.now() - start) / DURATION) * 100;
      if (p >= 100) {
        clearInterval(tick);
        setPromoIndex((i) => (i + 1) % promos.length);
      } else {
        setPromoProgress(p);
      }
    }, 80);
    return () => clearInterval(tick);
  }, [promoIndex, promos]);

  useEffect(() => {
    if (PODIOS_DESTACADOS.length <= 1) return;
    const tick = setInterval(() => {
      setPodiumIndex((i) => (i + 1) % PODIOS_DESTACADOS.length);
    }, PODIUM_DURATION);
    return () => clearInterval(tick);
  }, []);

  useEffect(() => {
    const updateVisible = () => {
      const w = window.innerWidth;
      if (w <= 560) setPodiumVisibleCount(2);
      else if (w <= 980) setPodiumVisibleCount(3);
      else if (w <= 1366) setPodiumVisibleCount(4);
      else setPodiumVisibleCount(5);
    };
    updateVisible();
    window.addEventListener("resize", updateVisible);
    return () => window.removeEventListener("resize", updateVisible);
  }, []);

  // Carga inicial: anchos completos + top sellers
  useEffect(() => {
    fetch(`${API_BASE}/api/catalogo/filtros-medida`)
      .then((r) => r.json())
      .then((data) => {
        setAnchos(data.anchos || []);
      })
      .catch(() => {});

    fetch(`${API_BASE}/api/catalogo/items?limit=10&sort=price_desc`)
      .then(res => res.json())
      .then(data => {
        if(data.ok && data.items) setTopSellers(data.items);
      })
      .catch(() => {});
  }, []);

  // Cascade: cuando cambia ANCHO carga alturas filtradas; cuando cambia ALTO carga rines filtrados
  useEffect(() => {
    if (!anchoSel) { setAlturas([]); setRines([]); return; }
    const params = new URLSearchParams({ ancho: anchoSel });
    fetch(`${API_BASE}/api/catalogo/filtros-medida?${params.toString()}`)
      .then((r) => r.json())
      .then((data) => { setAlturas(data.alturas || []); setRines(data.rines || []); })
      .catch(() => {});
  }, [anchoSel]);

  useEffect(() => {
    if (!anchoSel || !alturaSel) return;
    const params = new URLSearchParams({ ancho: anchoSel, altura: alturaSel });
    fetch(`${API_BASE}/api/catalogo/filtros-medida?${params.toString()}`)
      .then((r) => r.json())
      .then((data) => { setRines(data.rines || []); })
      .catch(() => {});
  }, [anchoSel, alturaSel]);

  const buscarMedida = (e) => {
    e.preventDefault();
    if (!anchoSel || !alturaSel || !rinSel) return;
    const medida = `${anchoSel}-${alturaSel}-${rinSel}`;
    navigate(`/catalogo?medida=${encodeURIComponent(medida)}`);
  };

  const askAssistant = (text) => {
    const message = (text || "").trim();
    if (!message) return;
    navigate(`/ia?q=${encodeURIComponent(message)}`);
  };

  const goToPrevPodium = () => {
    if (!PODIOS_DESTACADOS.length) return;
    setPodiumIndex((i) => (i - 1 + PODIOS_DESTACADOS.length) % PODIOS_DESTACADOS.length);
  };

  const goToNextPodium = () => {
    if (!PODIOS_DESTACADOS.length) return;
    setPodiumIndex((i) => (i + 1) % PODIOS_DESTACADOS.length);
  };

  return (
    <main className="main home home-full">
      <section className="home-shell">
        <div className="home-layout">
          <div className="home-left">
            <AiAssistantBox onAskAssistant={askAssistant} />
          </div>

          <div className="home-right">
            <div className="promo-card">
              <Link className="promo-viewport" to={promoActiva?.to || "/catalogo"} aria-label="Abrir promo">
                <img
                  src={promoActiva?.src}
                  className={`promo-main ${promoActiva?.fit === "contain" ? "is-contain" : "is-cover"}`}
                  alt={promoActiva?.alt || "Promoción"}
                  loading="eager"
                  decoding="async"
                />
              </Link>

              <div className="promo-dots">
                {promos.map((p, idx) => (
                  <button
                    key={p.id}
                    type="button"
                    className={`dot ${idx === promoIndex ? "is-active" : ""}`}
                    onClick={() => setPromoIndex(idx)}
                    aria-label={`Ver ${p.alt}`}
                  />
                ))}
              </div>

              <div className="promo-progress" aria-hidden="true">
                <div className="promo-progress__bar" style={{ width: `${promoProgress}%` }} />
              </div>
            </div>
          </div>

        </div>

        <section className="podium-section">
          <div className="podium-shell">
            <div className="podium-head">
              <h2 className="podium-title">Destacadas por marca</h2>
              <p className="podium-sub">Toca una llanta para ver el catálogo filtrado.</p>
            </div>

            <div className="podium-trackWrap">
              <button type="button" className="podium-navBtn podium-navBtn--left" onClick={goToPrevPodium} aria-label="Ver podios anteriores">
                &lt;
              </button>

              <div className="podium-grid" style={{ gridTemplateColumns: `repeat(${podiumVisible.length}, minmax(0, 1fr))` }}>
                {podiumVisible.map((p) => (
                  <button key={p.key} type="button" className="podium-card" onClick={() => navigate(p.to)} aria-label={`Ver catálogo ${p.name}`}>
                    <img className="podium-img" src={p.img} alt={`Podio ${p.name}`} loading="lazy" decoding="async" />
                  </button>
                ))}
              </div>

              <button type="button" className="podium-navBtn podium-navBtn--right" onClick={goToNextPodium} aria-label="Ver podios siguientes">
                &gt;
              </button>
            </div>
          </div>
        </section>

        <div className="home-grid2" style={{ marginBottom: 40 }}>
          <div className="card card--brands">
            <div className="card__head card__head--row">
              <div>
                <h3 className="card__title">Marcas más buscadas</h3>
                <p className="card__sub">Entra por marca en un click.</p>
              </div>

              <Link className="ghostLink" to="/catalogo">
                Ver catálogo →
              </Link>
            </div>

            <div className="brandGrid brandGrid--compact">
              {MARCAS_DESTACADAS.map((m) => (
                <Link key={m.key} to={`/catalogo/${m.key}`} className="brandCard">
                  <img className="brandCard__img" src={m.img} alt={m.name} />
                </Link>
              ))}
            </div>
          </div>

          <ManualMeasureBox
            anchos={anchos}
            alturas={alturas}
            rines={rines}
            anchoSel={anchoSel}
            alturaSel={alturaSel}
            rinSel={rinSel}
            setAnchoSel={setAnchoSel}
            setAlturaSel={setAlturaSel}
            setRinSel={setRinSel}
            onSubmit={buscarMedida}
          />
        </div>


        <section className="monthly-promos">
          <div className="monthly-promos__head">
            <div>
              <h2 className="monthly-promos__title">Promociones mensuales</h2>
              <p className="monthly-promos__sub">Aprovecha ofertas activas y entra directo al catálogo.</p>
            </div>
            <Link className="ghostLink" to="/catalogo">Ver catálogo →</Link>
          </div>
          <div className="monthly-promos__grid">
            {PROMOS_MENSUALES.map((promo) => (
              <Link key={promo.id} to={promo.to} className="monthly-promo-card" aria-label={`Ver promoción ${promo.name}`}>
                <img src={promo.img} alt={`Promoción ${promo.name}`} loading="lazy" decoding="async" />
              </Link>
            ))}
          </div>
        </section>

        <section className="podium-section" style={{ marginTop: 40, background: '#f5f5f5', border: 'none' }}>
          <div className="podium-shell">
            <div className="podium-head">
              <h2 className="podium-title" style={{ color: '#111' }}>Llantas más compradas</h2>
              <p className="podium-sub" style={{ color: '#555' }}>Los modelos más buscados en el mercado.</p>
            </div>

            <div className="ts-trackWrap">
              <div className="ts-grid">
                {topSellers.map((item) => (
                  <TopSellerCard key={getItemSku(item)} item={item} />
                ))}
              </div>
            </div>
          </div>
        </section>

        {/* ── Reviews / Testimonios ── */}
      <section className="reviews-section">
        <div className="reviews-section__head">
          <h2>Lo que dicen nuestros clientes</h2>
          <div className="reviews-section__score">
            <span className="reviews-score-num">4.9</span>
            <span className="reviews-stars">⭐⭐⭐⭐⭐</span>
            <span className="reviews-count">+500 reseñas</span>
          </div>
        </div>
        <div className="reviews-grid">
          {[
            { nombre:"Carlos M.", ini:"C", texto:"Excelente servicio, las llantas llegaron en 2 días perfectamente embaladas. La instalación en sucursal fue rapidísima. 100% recomendado.", via:"Google" },
            { nombre:"Ana L.", ini:"A", texto:"Precios muy competitivos y excelente atención por WhatsApp. Me ayudaron a elegir la medida correcta para mi Jetta. Muy profesionales.", via:"Google" },
            { nombre:"Roberto G.", ini:"R", texto:"Compré 4 llantas Pirelli y la experiencia fue perfecta. El asistente IA me recomendó exactamente lo que necesitaba. Volvería a comprar aquí.", via:"Google" },
            { nombre:"Diego R.", ini:"D", texto:"La IA de MK5 me ayudó a encontrar las llantas para mi Toyota RAV4. Rápido, fácil y con mejor precio que otras tiendas. Muy recomendado.", via:"Google" },
            { nombre:"Mariana V.", ini:"M", texto:"Ya es mi segunda compra en MK5. Siempre cumplen con los tiempos de entrega y el producto es 100% original. No compraría en otro lugar.", via:"Google" },
            { nombre:"Luis H.", ini:"L", texto:"Me pareció muy completo el catálogo. Encontré llantas Continental para mi BMW que no encontraba en otras tiendas. Envío puntual y sin daños.", via:"Google" },
          ].map((r) => (
            <div key={r.nombre} className="review-card">
              <div className="review-card__stars">⭐⭐⭐⭐⭐</div>
              <p className="review-card__text">{r.texto}</p>
              <div className="review-card__author">
                <div className="review-author-avatar">{r.ini}</div>
                <div>
                  <div className="review-author-name">{r.nombre}</div>
                  <div className="review-author-via">{r.via} ✓</div>
                </div>
              </div>
            </div>
          ))}
        </div>
      </section>

      <div className="home-banner home-banner--full" style={{ marginTop: 40 }} aria-label="Promoción MSI">
        <img src={bannermsi} alt="Promoción MSI MK5" loading="lazy" decoding="async" />
      </div>

      {/* The home-grid2 section was moved above reviews-section */}
      </section>
    </main>
  );
}

