import "../styles/home.css";
import { useEffect, useMemo, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { API_BASE } from "../config";

import promoEnero from "../assets/ENERO.png";
import promo1 from "../assets/ENERO.png";
import pirelliLogo from "../assets/pirelli.png";
import firestoneLogo from "../assets/firestone.png";
import euzkadiLogo from "../assets/euzkadi.png";
import antareslogo from "../assets/antares.png";
import bridgestonelogo from "../assets/bridgestone.png";
import continentalLogo from "../assets/continental.png";
import hankookLogo from "../assets/hankook.png";
import cooperlogo from "../assets/cooper.png";
import blackhawklogo from "../assets/blackhawk.png";
import laufennlogo from "../assets/laufenn.png";
import michelinlogo from "../assets/michelin.png";
import goodyearlogo from "../assets/goodyear.png";
import nuevafiltro from "../assets/nuevafiltro.png";
import goodrichlogo from "../assets/goodrich.jpg";
import tornellogo from "../assets/tornel.png";
import pegasuslogo from "../assets/pegasus.jpg";
import vinmaxlogo from "../assets/vinmax.png";
import bannermsi from "../assets/bannermsi.png";

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

// ✅ ahora el asistente muestra respuesta y loading
function AiAssistantBox({
  onAskAssistant,
  replyText,
  loading,
}) {
  const [q, setQ] = useState("");

  return (
    <div className="card card--ai">
      <div className="card__head">
        <div className="aiBadge">Asistente MK5</div>
      </div>

      <div className="aiInputRow">
        <textarea
          className="aiTextarea"
          value={q}
          onChange={(e) => setQ(e.target.value)}
          placeholder="Escribe tu auto, medida o lo que estas buscando.."
        />
        <button
          className="aiBtn"
          type="button"
          onClick={() => onAskAssistant(q)}
          disabled={!q.trim() || loading}
        >
          {loading ? "Buscando..." : "Buscar"}
        </button>
      </div>

      {/* ✅ respuesta del asistente */}
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
            <select
              value={rinSel}
              onChange={(e) => setRinSel(e.target.value)}
              disabled={!anchoSel || !alturaSel}
            >
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

  // ✅ estado del asistente
  const [assistantReply, setAssistantReply] = useState("");
  const [assistantLoading, setAssistantLoading] = useState(false);

  const promos = useMemo(
    () => [
      { id: "enero", src: promoEnero, alt: "Promo Enero", to: "/catalogo" },
      { id: "promo1", src: promo1, alt: "Promo 1", to: "/catalogo" },
    ],
    []
  );

  const [promoIndex, setPromoIndex] = useState(0);
  const promoActiva = promos[promoIndex];

  useEffect(() => {
    if (!promos.length) return;
    const t = setInterval(() => {
      setPromoIndex((i) => (i + 1) % promos.length);
    }, 5000);
    return () => clearInterval(t);
  }, [promos]);

  // ✅ cargar filtros iniciales desde el BACKEND (API_BASE)
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

  // ✅ filtros dependientes (API_BASE)
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

  // ✅ NUEVO: esto ya llama a tu backend /api/assistant
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
    <main className="main main--home">
      <section className="home-shell">
        {/* FILA 1 */}
        <div className="home-layout">
          <div className="home-left">
            <AiAssistantBox
              onAskAssistant={askAssistant}
              replyText={assistantReply}
              loading={assistantLoading}
            />
          </div>

          <div className="home-right">
            <div className="promo-card">
              <button
                className="promo-viewport"
                type="button"
                onClick={() => promoActiva?.to && navigate(promoActiva.to)}
                aria-label="Abrir promo"
              >
                <img
                  src={promoActiva.src}
                  className="promo-main"
                  alt={promoActiva.alt}
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

              <div className="promo-thumbs">
                {promos.map((p, idx) => (
                  <button
                    key={p.id}
                    type="button"
                    className={`thumb ${idx === promoIndex ? "is-active" : ""}`}
                    onClick={() => setPromoIndex(idx)}
                    aria-label={`Seleccionar ${p.alt}`}
                  >
                    <img src={p.src} alt={p.alt} />
                  </button>
                ))}
              </div>
            </div>
          </div>
        </div>

        {/* FILA 2 */}
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

          {/* ✅ BANNER MSI: abajo y full width */}
          <div className="home-banner home-banner--full" aria-label="Promoción MSI">
            <img src={bannermsi} alt="Promoción MSI MK5" />
          </div>
        </div>
      </section>
    </main>
  );
}
