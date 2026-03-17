import { useRef } from "react";
import "../styles/googleMapsReviews.css";

const GOOGLE_REVIEWS_URL =
  "https://www.google.com/maps/place/LLANTERA+MK5+(Nueva+Oxtotitlan)/@19.2879346,-99.6894758,17z/data=!4m8!3m7!1s0x85cd89d12ebc02f9:0xc8cf2110ec54f8ce!8m2!3d19.2879346!4d-99.6869009!9m1!1b1!16s%2Fg%2F11v0f9ff0j";

const GOOGLE_REVIEWS = [
  { author: "Alejandro Vidal-R.", avatar: "A", date: "hace 1 mes", rating: 5, text: "Excelente servicio y muy buena atencion. Me ayudaron a elegir la medida correcta y la instalacion fue muy rapida." },
  { author: "JRBD", avatar: "J", date: "hace 2 meses", rating: 5, text: "Todo bien. Buena experiencia de compra, atencion clara y entrega en tiempo." },
  { author: "Miguel Garcia", avatar: "M", date: "hace 6 meses", rating: 5, text: "Vayan a la alineacion y balanceo, excelente servicio y muy buenos precios en llantas." },
  { author: "Valente Tello", avatar: "V", date: "hace 11 meses", rating: 5, text: "Excelente servicio. Me atendieron rapido y resolvieron todas mis dudas sin complicaciones." },
  { author: "Ramiro Molina", avatar: "R", date: "hace 1 año", rating: 5, text: "Gran servicio y atencion por parte del equipo. Muy amable Jordan y muy buena instalacion." },
  { author: "Ana Martinez", avatar: "A", date: "hace 3 semanas", rating: 5, text: "Buen precio, producto original y excelente seguimiento por WhatsApp durante toda la compra." },
  { author: "Carlos Herrera", avatar: "C", date: "hace 4 meses", rating: 5, text: "Llegaron rapido, bien empacadas y la instalacion en sucursal fue muy ordenada. Volveria a comprar." },
  { author: "Diana Lopez", avatar: "D", date: "hace 7 meses", rating: 5, text: "Me ayudaron a elegir las llantas correctas para mi camioneta y el precio fue mejor que en otros lados." },
  { author: "Fernando Cruz", avatar: "F", date: "hace 9 meses", rating: 5, text: "Atencion profesional, entrega agil y buena comunicacion. Muy recomendable para comprar llantas en linea." },
];

export default function GoogleMapsReviewsEmbed({
  title = "Experiencia de clientes",
  subtitle = "Opiniones reales compartidas por clientes que compraron con MK5.",
  className = "",
}) {
  const trackRef = useRef(null);
  const sectionClassName = ["google-maps-reviews", className].filter(Boolean).join(" ");

  const scrollCards = (direction) => {
    const node = trackRef.current;
    if (!node) return;
    const card = node.querySelector(".google-maps-reviews__card");
    const amount = (card ? card.clientWidth : 280) + 16;
    node.scrollBy({ left: amount * direction, behavior: "smooth" });
  };

  return (
    <section className={sectionClassName}>
      <div className="google-maps-reviews__header">
        <div className="google-maps-reviews__heading">
          <p className="google-maps-reviews__eyebrow">Reseñas verificadas</p>
          <h3 className="google-maps-reviews__title">{title}</h3>
          {subtitle ? <p className="google-maps-reviews__subtitle">{subtitle}</p> : null}
        </div>

        <div className="google-maps-reviews__summary" aria-label="Calificacion Google">
          <span className="google-maps-reviews__score">4.9</span>
          <div className="google-maps-reviews__stars" aria-hidden="true">
            {"★★★★★".split("").map((star, index) => (
              <span key={index}>{star}</span>
            ))}
          </div>
          <span className="google-maps-reviews__count">48+ reseñas en Google</span>
        </div>
      </div>

      <div className="google-maps-reviews__carousel">
        <button
          type="button"
          className="google-maps-reviews__nav"
          aria-label="Ver reseñas anteriores"
          onClick={() => scrollCards(-1)}
        >
          ‹
        </button>

        <div ref={trackRef} className="google-maps-reviews__track">
          {GOOGLE_REVIEWS.map((review, index) => (
            <article key={`${review.author}-${index}`} className="google-maps-reviews__card">
              <div className="google-maps-reviews__card-top">
                <div
                  className="google-maps-reviews__avatar"
                  style={{ backgroundColor: ["#14532d", "#5b4636", "#1f2937", "#9a3412", "#4b5563"][index % 5] }}
                >
                  {review.avatar}
                </div>
                <div className="google-maps-reviews__meta">
                  <p className="google-maps-reviews__author">{review.author}</p>
                  <p className="google-maps-reviews__date">{review.date}</p>
                </div>
              </div>

              <div className="google-maps-reviews__stars google-maps-reviews__stars--card" aria-hidden="true">
                {"★★★★★".split("").map((star, starIndex) => (
                  <span key={starIndex} className={starIndex < review.rating ? "is-on" : "is-off"}>
                    {star}
                  </span>
                ))}
              </div>

              <p className="google-maps-reviews__text">{review.text}</p>

              <div className="google-maps-reviews__source">
                <span className="google-maps-reviews__google-icon" aria-hidden="true">G</span>
                <span>
                  Publicado en
                  <strong> Google</strong>
                </span>
              </div>
            </article>
          ))}
        </div>

        <button
          type="button"
          className="google-maps-reviews__nav"
          aria-label="Ver más reseñas"
          onClick={() => scrollCards(1)}
        >
          ›
        </button>
      </div>

      <div className="google-maps-reviews__actions">
        <a className="google-maps-reviews__more" href={GOOGLE_REVIEWS_URL} target="_blank" rel="noreferrer">
          Ver más reseñas
        </a>
      </div>
    </section>
  );
}
