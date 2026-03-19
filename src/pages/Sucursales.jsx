import { Link } from "react-router-dom";
import "../styles/pages.css";
import "../styles/sucursales.css";

/* ── Íconos de redes sociales (SVG inline para logos originales) ── */
function IconPhone() {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
      <path d="M6.62 10.79a15.05 15.05 0 0 0 6.59 6.59l2.2-2.2a1 1 0 0 1 1.02-.24 11.36 11.36 0 0 0 3.57.57 1 1 0 0 1 1 1V20a1 1 0 0 1-1 1A17 17 0 0 1 3 4a1 1 0 0 1 1-1h3.5a1 1 0 0 1 1 1c0 1.25.2 2.45.57 3.57a1 1 0 0 1-.24 1.02L6.62 10.79z"/>
    </svg>
  );
}

function IconWhatsApp() {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
      <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 0 1-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 0 1-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 0 1 2.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0 0 12.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 0 0 5.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 0 0-3.48-8.413Z"/>
    </svg>
  );
}

function IconFacebook() {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
      <path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z"/>
    </svg>
  );
}

function IconInstagram() {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
      <path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zM12 0C8.741 0 8.333.014 7.053.072 2.695.272.273 2.69.073 7.052.014 8.333 0 8.741 0 12c0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98C8.333 23.986 8.741 24 12 24c3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98C15.668.014 15.259 0 12 0zm0 5.838a6.162 6.162 0 1 0 0 12.324 6.162 6.162 0 0 0 0-12.324zM12 16a4 4 0 1 1 0-8 4 4 0 0 1 0 8zm6.406-11.845a1.44 1.44 0 1 0 0 2.881 1.44 1.44 0 0 0 0-2.881z"/>
    </svg>
  );
}

import logoMercadoLider from "../assets/minilogos/mercadolider (1).png";
import logoCobertura from "../assets/minilogos/Coberrr.png";
import logoBalanceo from "../assets/minilogos/balncllanta (2).png";
import logoBanner from "../assets/minilogos/ChatGPT Image 19 feb 2026, 10_09_11 p.m..png";

const WA_VENTAS = "https://wa.me/527291136254?text=Hola%2C%20quiero%20informaci%C3%B3n%20sobre%20llantas";
const WA_CITAS  = "https://wa.me/527291022894?text=Hola%2C%20quiero%20agendar%20instalaci%C3%B3n";
const FB        = "https://www.facebook.com/MK5Llantera";
const IG        = "https://www.instagram.com/mk5llantera?igsh=c29veDlibGdma2t2";

const SUCURSALES = [
  { nombre: "Isidro Fabela",          maps: "https://maps.app.goo.gl/DwyU2AYifAiNsg5e8",  q: "MK5+Llantas+Isidro+Fabela+Toluca+Estado+de+Mexico" },
  { nombre: "Filiberto Gómez (Pepsi)",maps: "https://maps.app.goo.gl/GtETFQe5Knr489ub9",  q: "MK5+Llantas+Filiberto+Gomez+Toluca+Estado+de+Mexico" },
  { nombre: "San Buena",              maps: "https://maps.app.goo.gl/8sLkwPS9uFuFfAZP9",  q: "MK5+Llantas+San+Buena+Toluca+Estado+de+Mexico" },
  { nombre: "Heriberto Enríquez",     maps: "https://maps.app.goo.gl/QaqhwfAzKWLUEgu46",  q: "MK5+Llantas+Heriberto+Enriquez+Toluca+Estado+de+Mexico" },
  { nombre: "Central de Abastos",     maps: "https://maps.app.goo.gl/KSsBn8m2693J74sz5",  q: "MK5+Llantas+Central+de+Abastos+Toluca+Estado+de+Mexico" },
  { nombre: "Tlacopa",                maps: "https://maps.app.goo.gl/FHsYWjfVQLtHRASA6",  q: "MK5+Llantas+Tlacopa+Toluca+Estado+de+Mexico" },
  { nombre: "Adolfo López Mateos",    maps: "https://maps.app.goo.gl/WuL3EFnSXPjy11yF7",  q: "MK5+Llantas+Adolfo+Lopez+Mateos+Toluca+Estado+de+Mexico" },
  { nombre: "Pino Suárez",            maps: "https://maps.app.goo.gl/6VunYzAtAXb9hMi29",  q: "MK5+Llantas+Pino+Suarez+Toluca+Estado+de+Mexico" },
  { nombre: "Circuito Metropolitano", maps: "https://maps.app.goo.gl/XR9i8bo2Dp3kiFSP6",  q: "MK5+Llantas+Circuito+Metropolitano+Toluca+Estado+de+Mexico" },
  { nombre: "San Mateo Atenco",       maps: "https://maps.app.goo.gl/RANjDovDxPuTgXo46",  q: "MK5+Llantas+San+Mateo+Atenco+Estado+de+Mexico" },
  { nombre: "Santín",                 maps: "https://maps.app.goo.gl/Xes4Ss1SFCDrtR738",  q: "MK5+Llantas+Santin+Toluca+Estado+de+Mexico" },
  { nombre: "Tecnológico",            maps: "https://maps.app.goo.gl/H8dgzFQmrLPV9bp47",  q: "MK5+Llantas+Tecnologico+Toluca+Estado+de+Mexico" },
  { nombre: "Tollocan",               maps: "https://maps.app.goo.gl/NJMif1LE3cEvZb2b9",  q: "MK5+Llantas+Tollocan+Toluca+Estado+de+Mexico" },
  { nombre: "Nueva Oxtotitlán",       maps: "https://maps.app.goo.gl/fizy5y5Axc53qvCS8",  q: "MK5+Llantas+Nueva+Oxtotitlan+Toluca+Estado+de+Mexico", embed: "https://www.google.com/maps/embed?pb=!1m18!1m12!1m3!1d3765.871934350331!2d-99.68947582403123!3d19.287934645283627!2m3!1f0!2f0!3f0!3m2!1i1024!2i768!4f13.1!3m3!1m2!1s0x85cd89d12ebc02f9%3A0xc8cf2110ec54f8ce!2sLLANTERA%20MK5%20(Nueva%20Oxtotitlan)!5e0!3m2!1ses-419!2smx!4v1773695562009!5m2!1ses-419!2smx" },
  { nombre: "Morelos",                maps: "https://maps.app.goo.gl/DcJnqqqENyYwvV8r9",  q: "MK5+Llantas+Morelos+Toluca+Estado+de+Mexico" },
  { nombre: "Circunvalación",         maps: "https://maps.app.goo.gl/Npd5sQz1Xc9CebBP9",  q: "MK5+Llantas+Circunvalacion+Toluca+Estado+de+Mexico" },
  { nombre: "Hipico",                 maps: "https://maps.app.goo.gl/AipHBoxbJ81Lr3vV9",  q: "MK5+Llantas+Hipico+Toluca+Estado+de+Mexico" },
];

const ESTADOS_ENVIO_GRATIS = [
  "San Luis Potosí","Nuevo León","Nayarit","Durango","Colima",
  "Tlaxcala","Zacatecas","Puebla","Aguascalientes","Guanajuato",
  "Morelos","Querétaro","Hidalgo","CDMX","Estado de México",
];

const METODOS_PAGO = [
  { icono: "💳", nombre: "Mercado Pago",       desc: "Tarjeta de crédito o débito. Meses sin intereses disponibles.", badge: "MSI disponibles" },
  { icono: "🅿️", nombre: "PayPal",             desc: "Paga de forma segura con tu cuenta PayPal o tarjeta vinculada.", badge: "Protección al comprador" },
  { icono: "🏦", nombre: "Transferencia SPEI", desc: "Transferencia bancaria directa a nuestra cuenta CLABE.", badge: "Sin comisiones" },
  { icono: "🏪", nombre: "OXXO Pay",           desc: "Genera tu referencia y paga en cualquier tienda OXXO.", badge: "+20,000 tiendas" },
];

export default function Sucursales() {
  return (
    <main className="static-page">
      {/* Hero */}
      <div className="static-hero suc-hero">
        <div className="static-hero__badge">📍 Sucursales</div>
        <h1>MK5 Llantas — 17 Sucursales en Toluca</h1>
        <p>
          Visítanos en cualquiera de nuestras sucursales para instalación, balanceo y alineación.
          Atendemos con cita previa por WhatsApp para reducir tiempos de espera.
        </p>
        <div className="suc-hero-contacts">
          <a href="tel:7291022894" className="suc-hero-btn suc-hero-btn--call"><IconPhone /> 729 102 2894</a>
          <a href={WA_VENTAS} target="_blank" rel="noreferrer" className="suc-hero-btn suc-hero-btn--wa"><IconWhatsApp /> WhatsApp ventas</a>
          <a href={FB} target="_blank" rel="noreferrer" className="suc-hero-btn suc-hero-btn--fb"><IconFacebook /> Facebook</a>
          <a href={IG} target="_blank" rel="noreferrer" className="suc-hero-btn suc-hero-btn--ig"><IconInstagram /> Instagram</a>
        </div>
      </div>

      {/* Mini logos banner */}
      <div className="suc-minilogos-banner">
        <img src={logoBanner}       alt="MK5 Llantas"          className="suc-minilogo" />
        <img src={logoMercadoLider} alt="Mercado Líder"        className="suc-minilogo" />
        <img src={logoCobertura}    alt="Cobertura nacional"    className="suc-minilogo" />
        <img src={logoBalanceo}     alt="Balanceo y alineación" className="suc-minilogo" />
      </div>

      {/* Grid 2 columnas de sucursales */}
      <div className="static-section" style={{ paddingBottom: 8 }}>
        <h2>📍 Nuestras 17 sucursales</h2>
        <p style={{ color: "#999", fontSize: 13, marginBottom: 24 }}>
          Toluca, Estado de México — Lun–Vie 9:00–18:00 · Sáb 9:00–16:30
        </p>

        <div className="suc-2col-grid">
          {SUCURSALES.map((s) => (
            <div key={s.nombre} className="suc-mini-card">
              {/* Header */}
              <div className="suc-mini-card__header">
                <h3 className="suc-mini-card__name">MK5 — {s.nombre}</h3>
                <span className="suc-badge suc-badge--open">Abierto</span>
              </div>

              {/* Body: info + mapa */}
              <div className="suc-mini-card__body">
                <div className="suc-mini-card__info">
                  <div className="info-row">
                    <span className="info-row__icon">📍</span>
                    <span>Toluca, Estado de México</span>
                  </div>
                  <div className="info-row">
                    <span className="info-row__icon">🕐</span>
                    <div>
                      <div><strong>Lun–Vie:</strong> 9:00–18:00</div>
                      <div><strong>Sábado:</strong> 9:00–16:30</div>
                      <div style={{ color: "#999", fontSize: 12 }}>Dom: Cerrado</div>
                    </div>
                  </div>
                  <div className="info-row">
                    <span className="info-row__icon">📞</span>
                    <div>
                      <div><strong>Ventas:</strong> <a href="tel:7291136254" className="suc-tel-link">729 113 6254</a></div>
                      <div><strong>Llamadas:</strong> <a href="tel:7291022894" className="suc-tel-link">729 102 2894</a></div>
                    </div>
                  </div>

                  <div className="suc-mini-card__actions">
                    <a href={WA_CITAS} target="_blank" rel="noreferrer" className="suc-btn-wa">
                      <IconWhatsApp /> Agendar por WhatsApp
                    </a>
                    <a href={s.maps} target="_blank" rel="noreferrer" className="suc-btn-llegar">
                      📍 Llegar a {s.nombre}
                    </a>
                  </div>
                </div>

                {/* Mapa embed */}
                <div className="map-placeholder">
                  <iframe
                    src={s.embed || `https://www.google.com/maps?q=${s.q}&output=embed&z=15`}
                    title={`Mapa MK5 ${s.nombre}`}
                    loading="lazy"
                    allowFullScreen
                    referrerPolicy="no-referrer-when-downgrade"
                  />
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Banner garantía */}
      <div className="static-section suc-garantia">
        <h2>🛡️ Garantía contra defecto de fábrica</h2>
        <p>
          Todos nuestros productos cuentan con <strong>garantía contra defecto de fábrica</strong>.
          Si tu llanta presenta un defecto de fabricación, la reemplazamos sin costo.
        </p>
      </div>

      {/* Métodos de pago */}
      <div className="static-section">
        <h2>💳 Métodos de pago aceptados</h2>
        <div className="payment-grid" style={{ gridTemplateColumns: "repeat(2, 1fr)" }}>
          {METODOS_PAGO.map((m) => (
            <div key={m.nombre} className="payment-card">
              <div className="payment-card__icon">{m.icono}</div>
              <div className="payment-card__name">{m.nombre}</div>
              <div className="payment-card__desc">{m.desc}</div>
              <span className="payment-card__badge">{m.badge}</span>
            </div>
          ))}
        </div>
      </div>

      {/* Envío gratis */}
      <div className="static-section suc-envio">
        <h2>🚚 Envío gratis a estos estados</h2>
        <p>Si tu estado está en la siguiente lista, el envío es completamente gratis:</p>
        <div className="suc-estados-grid">
          {ESTADOS_ENVIO_GRATIS.map((e) => (
            <div key={e} className="suc-estado-chip">
              <span className="suc-estado-check">✓</span>
              {e}
            </div>
          ))}
        </div>
      </div>

      {/* Banner instalación gratis */}
      <div className="static-section" style={{ background: "#f0fdf4", border: "1px solid #bbf7d0" }}>
        <h2 style={{ borderColor: "#16a34a" }}>🛠️ ¿Compraste en línea? La instalación es gratis</h2>
        <p>
          Lleva tus llantas a cualquiera de nuestras sucursales en Toluca para instalación y
          balanceo <strong>sin costo adicional</strong>. Solo agenda tu cita por WhatsApp.
        </p>
        <div style={{ display: "flex", gap: 10, marginTop: 8 }}>
          <a href={WA_CITAS} target="_blank" rel="noreferrer"
            style={{ background: "#16a34a", color: "#fff", borderRadius: 10, padding: "10px 18px", fontWeight: 900, fontSize: 13, textDecoration: "none" }}>
            💬 Agendar instalación gratis
          </a>
        </div>
      </div>

      {/* CTA final */}
      <div className="cta-band">
        <div>
          <h3>¿Prefieres recibirlas en tu casa?</h3>
          <p>Envío a domicilio en 24–48 h. Gratis en estados seleccionados.</p>
        </div>
        <Link to="/catalogo" className="cta-band__btn">Ver catálogo →</Link>
      </div>
    </main>
  );
}
