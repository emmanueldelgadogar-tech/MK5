import { useEffect, useMemo, useState } from "react";
import { useNavigate, Link } from "react-router-dom";

import guideImg from "../assets/nuevafiltro.png";

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
import eudemonlogo from "../assets/eudemon.jpg";     
import generallogo from "../assets/general.png";
import goodrichlogo from "../assets/goodrich.jpg";   
import jktyrelogo from "../assets/jktyre.png";
import laufennlogo from "../assets/laufenn.png";
import michelinlogo from "../assets/michelin.png";
import miragelogo from "../assets/mirage.png";
import ovationlogo from "../assets/ovation.jpg";     
import tornellogo from "../assets/tornel.png";
import wanlilogo from "../assets/wanli.jpg";  
import goodyearlogo from "../assets/goodyear.png";       
import minelllogo from "../assets/minell.jpg";
import doublekinglogo from "../assets/doubleking.jpg";
import saferichlogo from "../assets/saferich.png";
import pegasuslogo from "../assets/pegasus.jpg";
import blackhawklogo from "../assets/blackhawk.png";
// ✅ Lista de marcas (key en minúsculas para URL /catalogo/:marca)
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
  { key: "general", name: "General", img: generallogo },
  { key: "goodrich", name: "Goodrich", img: goodrichlogo },
  { key: "jktyre", name: "JK Tyre", img: jktyrelogo },
  { key: "eudemon", name: "Eudemon", img: eudemonlogo },
  { key: "mirage", name: "Mirage", img: miragelogo },
  { key: "ovation", name: "Ovation", img: ovationlogo },
  { key: "tornel", name: "Tornel", img: tornellogo },
  { key: "wanli", name: "Wanli", img: wanlilogo },
  { key: "minell", name: "Minell", img: minelllogo },
  { key: "doubleking", name: "Double King", img: doublekinglogo },
  { key: "saferich", name: "Saferich", img: saferichlogo },
  { key: "pegasus", name: "Pegasus", img: pegasuslogo },
];

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

      <section className="brandIndex container">
        <h2 className="brandIndex__title">Marcas más buscadas</h2>

        <div className="brandIndex__grid">
          {MARCAS_DESTACADAS.map((m) => (
            <Link key={m.key} to={`/catalogo/${m.key}`} className="brandCard">
              <img className="brandCard__img" src={m.img} alt={m.name} />
            </Link>
          ))}
        </div>
      </section>
    </main>
  );
}
