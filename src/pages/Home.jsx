import { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";

import guideImg from "../assets/nuevafiltro.png";

import promoEnero from "../assets/ENERO.png";
import promo1 from "../assets/ENERO.png";

export default function Home() {
  const navigate = useNavigate();

  const [anchos, setAnchos] = useState([]);
  const [alturas, setAlturas] = useState([]);
  const [rines, setRines] = useState([]);

  const [anchoSel, setAnchoSel] = useState("");
  const [alturaSel, setAlturaSel] = useState("");
  const [rinSel, setRinSel] = useState("");

  const promos = useMemo(
    () => [
      { id: "enero", src: promoEnero, alt: "Promo Enero", to: "/catalogo" },
      { id: "promo1", src: promo1, alt: "Promo 1", to: "/catalogo" },
    ],
    []
  );

  const [promoIndex, setPromoIndex] = useState(0);

  useEffect(() => {
    if (!promos.length) return;
    const t = setInterval(() => {
      setPromoIndex((i) => (i + 1) % promos.length);
    }, 5000);
    return () => clearInterval(t);
  }, [promos.length]);

  const promoActiva = promos[promoIndex];

  useEffect(() => {
    fetch("/api/catalogo/filtros-medida")
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

    fetch(`/api/catalogo/filtros-medida?${params.toString()}`)
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

  return (
    <main className="main main--home">
      <section className="home-shell">
        <div className="home-layout">
          <div className="home-left">
            <div className="home-searchbox">
              <h2>Búsqueda por Medida</h2>

              <form className="measure-form" onSubmit={buscarMedida}>
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

                <button className="measure-btn" type="submit">
                  BUSCAR
                </button>
              </form>

              <div className="measure-help">
                <img src={guideImg} alt="Guía de medida" />
              </div>
            </div>
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
      </section>
    </main>
  );
}
