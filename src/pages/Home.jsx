import "../styles/home.css";
import { useEffect, useMemo, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { API_BASE } from "../config";

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

// ✅ PROMOS REALES (carpeta /assets/Promos)
import promoAntares from "../assets/Promos/Antares promo.jpeg";
import promoJK1 from "../assets/Promos/Jk promo.jpeg";
import promoJK2 from "../assets/Promos/Jk promo 2.jpeg";
import promoKumho from "../assets/Promos/kumho promo.jpeg";
import promoLaufenn from "../assets/Promos/Laufenn promo.jpeg";
import promoVinmax from "../assets/Promos/Vinmax promo.jpeg";

// ✅ Lottie Robot
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
];

function AiAssistantBox({ onAskAssistant, replyText, loading }) {
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

  // ✅ typewriter (solo si q está vacío y no está cargando)
  useEffect(() => {
    if (q.trim() || loading) return;

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
  }, [q, loading, examples, exIdx, pos, deleting]);

  const submit = () => {
    const msg = (q || "").trim();
    if (!msg || loading) return;
    onAskAssistant(msg);
  };

  return (
    <div className="card card--ai">
      {/* TOP: robot + nubecitas + badge */}
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
          {!q.trim() && !loading ? (
            <div className="aiFakePlaceholder" aria-hidden="true">
              {typed}
              <span className="aiCaret">|</span>
            </div>
          ) : null}

          <textarea
            className="aiTextarea"
            value={q}
            onChange={(e) => setQ(e.target.value)}
            placeholder="" // usamos placeholder falso
            onKeyDown={(e) => {
              if (e.key === "Enter" && !e.shiftKey) {
                e.preventDefault();
                submit();
              }
            }}
          />
        </div>

        <button className="aiBtn" type="button" onClick={submit} disabled={!q.trim() || loading}>
          {loading ? "Buscando..." : "Buscar"}
        </button>
      </div>

      {replyText ? (
        <div className="aiReply" style={{ marginTop: 10, fontSize: 14 }}>
          {replyText}
        </div>
      ) : null}
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
                <option key={x} value={x}>
                  {x}
                </option>
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
              disabled={!anchoSel}
            >
              <option value="">Selecciona</option>
              {alturas.map((x) => (
                <option key={x} value={x}>
                  {x}
                </option>
              ))}
            </select>
          </div>

          <div className="measure-field">
            <label>RIN</label>
            <select value={rinSel} onChange={(e) => setRinSel(e.target.value)} disabled={!anchoSel || !alturaSel}>
              <option value="">Selecciona</option>
              {rines.map((x) => (
                <option key={x} value={x}>
                  {x}
                </option>
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

  const [anchoSel, setAnchoSel] = useState("");
  const [alturaSel, setAlturaSel] = useState("");
  const [rinSel, setRinSel] = useState("");

  const [assistantReply, setAssistantReply] = useState("");
  const [assistantLoading, setAssistantLoading] = useState(false);

  const DURATION = 5000;
  const [promoIndex, setPromoIndex] = useState(0);
  const [promoProgress, setPromoProgress] = useState(0);

  const promos = useMemo(
    () => [
      { id: "antares", src: promoAntares, alt: "Promo Antares", to: "/catalogo", fit: "contain" },
      { id: "jk1", src: promoJK1, alt: "Promo JK", to: "/catalogo", fit: "contain" },
      { id: "jk2", src: promoJK2, alt: "Promo JK 2", to: "/catalogo", fit: "contain" },
      { id: "kumho", src: promoKumho, alt: "Promo Kumho", to: "/catalogo", fit: "contain" },
      { id: "laufenn", src: promoLaufenn, alt: "Promo Laufenn", to: "/catalogo", fit: "contain" },
      { id: "vinmax", src: promoVinmax, alt: "Promo Vinmax", to: "/catalogo", fit: "contain" },
    ],
    []
  );

  const promoActiva = promos[promoIndex];

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
    fetch(`${API_BASE}/api/catalogo/filtros-medida`)
      .then((r) => r.json())
      .then((data) => {
        setAnchos(data.anchos || []);
        setAlturas(data.alturas || []);
        setRines(data.rines || []);
      })
      .catch(() => {});
  }, []);

  useEffect(() => {
    const params = new URLSearchParams();
    if (anchoSel) params.set("ancho", anchoSel);
    if (alturaSel) params.set("altura", alturaSel);
    if (rinSel) params.set("rin", rinSel);

    fetch(`${API_BASE}/api/catalogo/filtros-medida?${params.toString()}`)
      .then((r) => r.json())
      .then((data) => {
        setAnchos(data.anchos || []);
        setAlturas(data.alturas || []);
        setRines(data.rines || []);
      })
      .catch(() => {});
  }, [anchoSel, alturaSel, rinSel]);

  const buscarMedida = (e) => {
    e.preventDefault();
    if (!anchoSel || !alturaSel || !rinSel) return;
    const medida = `${anchoSel}/${alturaSel}R${rinSel}`;
    navigate(`/catalogo?medida=${encodeURIComponent(medida)}`);
  };
  const askAssistant = async (text) => {
    const message = (text || "").trim();
    if (!message) return;

    setAssistantLoading(true);
    setAssistantReply("");

    try {
      const r = await fetch(`${API_BASE}/api/assistant`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ message }),
      });

      const data = await r.json();

      if (!data?.ok) {
        setAssistantReply("Ups… hubo un problema. Intenta de nuevo.");
        return;
      }

      if (data.action === "NAVIGATE" && data.path) {
        const qs = new URLSearchParams(data.query || {}).toString();
        navigate(`${data.path}${qs ? `?${qs}` : ""}`);
        return;
      }

      setAssistantReply(data.reply || "¿Me das tu medida? 🙂");
    } catch (e) {
      console.error(e);
      setAssistantReply("No pude conectar con el servidor 😕");
    } finally {
      setAssistantLoading(false);
    }
  };

  return (
    <main className="main home home-full">
      <section className="home-shell">
        <div className="home-layout">
          <div className="home-left">
            <AiAssistantBox onAskAssistant={askAssistant} replyText={assistantReply} loading={assistantLoading} />
          </div>

          <div className="home-right">
            <div className="promo-card">
              <button className="promo-viewport" type="button" onClick={() => promoActiva?.to && navigate(promoActiva.to)} aria-label="Abrir promo">
                <img
                  src={promoActiva?.src}
                  className={`promo-main ${promoActiva?.fit === "contain" ? "is-contain" : "is-cover"}`}
                  alt={promoActiva?.alt || "Promoción"}
                />
              </button>

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

            <div className="podium-grid">
              {PODIOS_DESTACADOS.map((p) => (
                <button key={p.key} type="button" className="podium-card" onClick={() => navigate(p.to)} aria-label={`Ver catálogo ${p.name}`}>
                  <img className="podium-img" src={p.img} alt={`Podio ${p.name}`} />
                </button>
              ))}
            </div>
          </div>
        </section>

        <div className="home-grid2">
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

          <div className="home-banner home-banner--full" aria-label="Promoción MSI">
            <img src={bannermsi} alt="Promoción MSI MK5" />
          </div>
        </div>
      </section>
    </main>
  );
}
