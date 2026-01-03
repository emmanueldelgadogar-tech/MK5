import promo from "../assets/DICIEMBRE.jpeg";
import { Link } from "react-router-dom";

export default function Home() {
  return (
    <main className="container main">
      <section className="hero">
        <div className="hero__text">
          <h1>MK5 Llantas</h1>
          <p>Cotiza por medida, marca o modelo en segundos.</p>

          <form className="search" onSubmit={(e) => e.preventDefault()}>
            <input className="search__input" placeholder="Ej: 205/55R16 o Tornel" />
            <button className="btn btn--dark" type="submit">Buscar</button>
          </form>

          <div className="quick">
            <Link className="chip" to="/catalogo">Ver catálogo</Link>
            <Link className="chip" to="/checkout">Agendar cita</Link>
          </div>
        </div>

        <div className="promo-wrap">
          <img src={promo} className="Promo-Diciembre" alt="Promo del mes" />
        </div>
      </section>

      <section className="grid">
        <article className="card">
          <h3>Catálogo</h3>
          <p>Explora marcas, medidas y disponibilidad.</p>
          <Link className="link" to="/catalogo">Abrir →</Link>
        </article>

        <article className="card">
          <h3>Cotizar</h3>
          <p>Te ayudamos por WhatsApp en minutos.</p>
          <a className="link" href="https://wa.me/521XXXXXXXXXX" target="_blank" rel="noreferrer">
            Ir a WhatsApp →
          </a>
        </article>

        <article className="card">
          <h3>Agendar cita</h3>
          <p>Selecciona sucursal, fecha y hora.</p>
          <Link className="link" to="/checkout">Continuar →</Link>
        </article>
      </section>
    </main>
  );
}
