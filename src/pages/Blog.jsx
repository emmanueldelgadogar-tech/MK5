import { Link } from "react-router-dom";
import "../styles/pages.css";

import imgMedida from "../assets/blog/blog-medida.jpg";
import imgCambiar from "../assets/blog/blog-cambiar.jpg";
import imgCiudad from "../assets/blog/blog-ciudad.jpg";
import imgPresion from "../assets/blog/blog-presion.jpg";
import imgRunflat from "../assets/blog/blog-runflat.jpg";
import imgPirelliVsMichelin from "../assets/blog/blog-pirelli-vs-michelin.jpg";

const ARTICULOS = [
  {
    id: 1,
    tag: "Guía",
    img: imgMedida,
    title: "Cómo leer la medida de tu llanta",
    desc: "¿Ves un número como 205/55R16 en tu llanta y no sabes qué significa? Te lo explicamos paso a paso para que nunca elijas una medida incorrecta.",
    fecha: "15 Enero 2025",
    lectura: "5 min",
    url: "https://blog.mk5.mx/como-leer-medida-llanta",
  },
  {
    id: 2,
    tag: "Mantenimiento",
    img: imgCambiar,
    title: "Señales de que ya es hora de cambiar tus llantas",
    desc: "Las llantas desgastadas son la causa número uno de accidentes viales. Aprende a identificar cuándo necesitas cambiarlas antes de que sea tarde.",
    fecha: "8 Enero 2025",
    lectura: "4 min",
    url: "https://blog.mk5.mx/cuando-cambiar-llantas",
  },
  {
    id: 3,
    tag: "Comparativa",
    img: imgCiudad,
    title: "Las mejores llantas para ciudad en 2025",
    desc: "Comparamos los modelos más populares para manejar en ciudad: confort, durabilidad, precio. Cuál es la mejor opción para tu auto.",
    fecha: "2 Enero 2025",
    lectura: "7 min",
    url: "https://blog.mk5.mx/mejores-llantas-ciudad-2025",
  },
  {
    id: 4,
    tag: "Consejos",
    img: imgPresion,
    title: "Inflado correcto: cuánta presión debe llevar tu llanta",
    desc: "Una llanta mal inflada consume más gasolina y se desgasta más rápido. Aprende a verificar y ajustar la presión de tus llantas correctamente.",
    fecha: "20 Dic 2024",
    lectura: "3 min",
    url: "https://blog.mk5.mx/presion-correcta-llantas",
  },
  {
    id: 5,
    tag: "Guía",
    img: imgRunflat,
    title: "Run Flat: qué son y para quién son ideales",
    desc: "Las llantas Run Flat te permiten seguir manejando aunque pinches. Te explicamos cómo funcionan, sus ventajas y si son la opción correcta para ti.",
    fecha: "12 Dic 2024",
    lectura: "6 min",
    url: "https://blog.mk5.mx/llantas-run-flat",
  },
  {
    id: 6,
    tag: "Marcas",
    img: imgPirelliVsMichelin,
    title: "Pirelli vs Michelin: ¿cuál es mejor para ti?",
    desc: "Dos de las marcas más reconocidas del mundo. Comparamos precio, durabilidad, agarre y confort para ayudarte a tomar la mejor decisión.",
    fecha: "5 Dic 2024",
    lectura: "8 min",
    url: "https://blog.mk5.mx/pirelli-vs-michelin",
  },
];

export default function Blog() {
  return (
    <main className="static-page">
      <div className="static-hero">
        <div className="static-hero__badge">Blog MK5</div>
        <h1>Guías, consejos y comparativas de llantas</h1>
        <p>
          Todo lo que necesitas saber para elegir, mantener y aprovechar al máximo
          tus llantas. Contenido creado por expertos para conductores mexicanos.
        </p>
      </div>

      <div className="static-grid">
        {ARTICULOS.map((art) => (
          <a
            key={art.id}
            href={art.url}
            target="_blank"
            rel="noopener noreferrer"
            className="static-card"
            style={{ textDecoration: "none", color: "inherit", cursor: "pointer" }}
          >
            <div className="static-card__img-placeholder" style={{ padding: 0, overflow: "hidden" }}>
              {art.img ? (
                <img
                  src={art.img}
                  alt={art.title}
                  style={{ width: "100%", height: "100%", objectFit: "cover", display: "block" }}
                />
              ) : (
                <span style={{ fontSize: 48 }}>📝</span>
              )}
            </div>
            <div className="static-card__body">
              <span className="static-card__tag">{art.tag}</span>
              <div className="static-card__title">{art.title}</div>
              <p className="static-card__desc">{art.desc}</p>
              <div className="static-card__footer">
                <span>{art.fecha} · {art.lectura} lectura</span>
                <span className="static-card__cta">Leer más →</span>
              </div>
            </div>
          </a>
        ))}
      </div>

      <div className="cta-band">
        <div>
          <h3>¿Necesitas asesoría personalizada?</h3>
          <p>Nuestro asistente IA te recomienda la llanta ideal para tu auto.</p>
        </div>
        <Link to="/ia" className="cta-band__btn">Usar asistente IA →</Link>
      </div>
    </main>
  );
}
