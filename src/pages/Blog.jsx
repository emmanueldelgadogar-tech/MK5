import { Link } from "react-router-dom";
import "../styles/pages.css";

const ARTICULOS = [
  {
    id: 1,
    tag: "Guía",
    emoji: "📏",
    title: "Cómo leer la medida de tu llanta",
    desc: "¿Ves un número como 205/55R16 en tu llanta y no sabes qué significa? Te lo explicamos paso a paso para que nunca elijas una medida incorrecta.",
    fecha: "15 Enero 2025",
    lectura: "5 min",
  },
  {
    id: 2,
    tag: "Mantenimiento",
    emoji: "🔧",
    title: "Señales de que ya es hora de cambiar tus llantas",
    desc: "Las llantas desgastadas son la causa número uno de accidentes viales. Aprende a identificar cuándo necesitas cambiarlas antes de que sea tarde.",
    fecha: "8 Enero 2025",
    lectura: "4 min",
  },
  {
    id: 3,
    tag: "Comparativa",
    emoji: "⭐",
    title: "Las mejores llantas para ciudad en 2025",
    desc: "Comparamos los modelos más populares para manejar en ciudad: confort, durabilidad, precio. Cuál es la mejor opción para tu auto.",
    fecha: "2 Enero 2025",
    lectura: "7 min",
  },
  {
    id: 4,
    tag: "Consejos",
    emoji: "💡",
    title: "Inflado correcto: cuánta presión debe llevar tu llanta",
    desc: "Una llanta mal inflada consume más gasolina y se desgasta más rápido. Aprende a verificar y ajustar la presión de tus llantas correctamente.",
    fecha: "20 Dic 2024",
    lectura: "3 min",
  },
  {
    id: 5,
    tag: "Guía",
    emoji: "🚗",
    title: "Run Flat: qué son y para quién son ideales",
    desc: "Las llantas Run Flat te permiten seguir manejando aunque pinches. Te explicamos cómo funcionan, sus ventajas y si son la opción correcta para ti.",
    fecha: "12 Dic 2024",
    lectura: "6 min",
  },
  {
    id: 6,
    tag: "Marcas",
    emoji: "🏆",
    title: "Pirelli vs Michelin: ¿cuál es mejor para ti?",
    desc: "Dos de las marcas más reconocidas del mundo. Comparamos precio, durabilidad, agarre y confort para ayudarte a tomar la mejor decisión.",
    fecha: "5 Dic 2024",
    lectura: "8 min",
  },
];

export default function Blog() {
  return (
    <main className="static-page">
      <div className="static-hero">
        <div className="static-hero__badge">📝 Blog MK5</div>
        <h1>Guías, consejos y comparativas de llantas</h1>
        <p>
          Todo lo que necesitas saber para elegir, mantener y aprovechar al máximo
          tus llantas. Contenido creado por expertos para conductores mexicanos.
        </p>
      </div>

      <div className="static-grid">
        {ARTICULOS.map((art) => (
          <div key={art.id} className="static-card" style={{cursor:"default"}}>
            <div className="static-card__img-placeholder">
              {art.emoji}
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
          </div>
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
