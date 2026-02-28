import { Link } from "react-router-dom";
import "../styles/pages.css";
import "../styles/sucursales.css";

import logoMercadoLider from "../assets/minilogos/mercadolider (1).png";
import logoCobertura from "../assets/minilogos/Coberrr.png";
import logoBalanceo from "../assets/minilogos/balncllanta (2).png";
import logoBanner from "../assets/minilogos/ChatGPT Image 19 feb 2026, 10_09_11 p.m..png";

const WA_VENTAS = "https://wa.me/527291136254?text=Hola%2C%20quiero%20informaci%C3%B3n%20sobre%20llantas";
const WA_CITAS  = "https://wa.me/527291022894?text=Hola%2C%20quiero%20agendar%20instalaci%C3%B3n";
const FB        = "https://www.facebook.com/MK5Llantera";
const IG        = "https://www.instagram.com/mk5llantera?igsh=c29veDlibGdma2t2";

const SUCURSALES = [
  { nombre: "Isidro Fabela",          maps: "https://maps.app.goo.gl/DwyU2AYifAiNsg5e8" },
  { nombre: "Filiberto Gómez (Pepsi)",maps: "https://maps.app.goo.gl/GtETFQe5Knr489ub9" },
  { nombre: "San Buena",              maps: "https://maps.app.goo.gl/8sLkwPS9uFuFfAZP9" },
  { nombre: "Heriberto Enríquez",     maps: "https://maps.app.goo.gl/QaqhwfAzKWLUEgu46" },
  { nombre: "Central de Abastos",     maps: "https://maps.app.goo.gl/KSsBn8m2693J74sz5" },
  { nombre: "Tlacopa",                maps: "https://maps.app.goo.gl/FHsYWjfVQLtHRASA6" },
  { nombre: "Adolfo López Mateos",    maps: "https://maps.app.goo.gl/WuL3EFnSXPjy11yF7" },
  { nombre: "Pino Suárez",            maps: "https://maps.app.goo.gl/6VunYzAtAXb9hMi29" },
  { nombre: "Circuito Metropolitano", maps: "https://maps.app.goo.gl/XR9i8bo2Dp3kiFSP6" },
  { nombre: "San Mateo Atenco",       maps: "https://maps.app.goo.gl/RANjDovDxPuTgXo46" },
  { nombre: "Santín",                 maps: "https://maps.app.goo.gl/Xes4Ss1SFCDrtR738" },
  { nombre: "Tecnológico",            maps: "https://maps.app.goo.gl/H8dgzFQmrLPV9bp47" },
  { nombre: "Tollocan",               maps: "https://maps.app.goo.gl/NJMif1LE3cEvZb2b9" },
  { nombre: "Nueva Oxtotitlán",       maps: "https://maps.app.goo.gl/fizy5y5Axc53qvCS8" },
  { nombre: "Morelos",                maps: "https://maps.app.goo.gl/DcJnqqqENyYwvV8r9" },
  { nombre: "Circunvalación",         maps: "https://maps.app.goo.gl/Npd5sQz1Xc9CebBP9" },
  { nombre: "Hipico",                 maps: "https://maps.app.goo.gl/AipHBoxbJ81Lr3vV9" },
];

const SERVICIOS = [
  "Instalación de llantas",
  "Balanceo",
  "Alineación",
  "Inflado de nitrógeno",
  "Revisión de presión gratis",
  "Asesoría personalizada",
];

const ESTADOS_ENVIO_GRATIS = [
  "San Luis Potosí","Nuevo León","Nayarit","Durango","Colima",
  "Tlaxcala","Zacatecas","Puebla","Aguascalientes","Guanajuato",
  "Morelos","Querétaro","Hidalgo","CDMX","Estado de México",
];

const METODOS_PAGO = [
  {
    icono: "💳",
    nombre: "Mercado Pago",
    desc: "Tarjeta de crédito o débito. Meses sin intereses de acuerdo a tu banco y las promociones vigentes de la plataforma.",
    badge: "MSI disponibles",
  },
  {
    icono: "🅿️",
    nombre: "PayPal",
    desc: "Paga de forma segura con tu cuenta PayPal o tarjeta vinculada.",
    badge: "Protección al comprador",
  },
  {
    icono: "🏦",
    nombre: "Transferencia SPEI",
    desc: "Transferencia bancaria directa a nuestra cuenta CLABE. Confirmación en minutos.",
    badge: "Sin comisiones",
  },
  {
    icono: "🏪",
    nombre: "OXXO Pay",
    desc: "Genera tu referencia y paga en cualquier tienda OXXO del país.",
    badge: "+20,000 tiendas",
  },
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
          <a href="tel:7291022894" className="suc-hero-btn suc-hero-btn--call">
            📞 Llamar: 729 102 2894
          </a>
          <a href={WA_VENTAS} target="_blank" rel="noreferrer" className="suc-hero-btn suc-hero-btn--wa">
            💬 WhatsApp ventas: 729 113 6254
          </a>
          <a href={FB} target="_blank" rel="noreferrer" className="suc-hero-btn suc-hero-btn--fb">
            📘 Facebook
          </a>
          <a href={IG} target="_blank" rel="noreferrer" className="suc-hero-btn suc-hero-btn--ig">
            📸 Instagram
          </a>
        </div>
      </div>

      {/* Mini logos banner */}
      <div className="suc-minilogos-banner">
        <img src={logoBanner}      alt="MK5 Llantas"        className="suc-minilogo" />
        <img src={logoMercadoLider} alt="Mercado Líder"     className="suc-minilogo" />
        <img src={logoCobertura}   alt="Cobertura nacional" className="suc-minilogo" />
        <img src={logoBalanceo}    alt="Balanceo y alineación" className="suc-minilogo" />
      </div>

      {/* 17 tarjetas de sucursales */}
      <div className="suc-cards-list">
        {SUCURSALES.map((s) => (
          <div key={s.nombre} className="static-section suc-card">
            <div className="suc-card__header">
              <h2>MK5 Llantas — {s.nombre}</h2>
              <span className="suc-badge suc-badge--open">Abierto</span>
            </div>

            <div className="suc-card__body">
              <div className="suc-info">
                <div className="info-row">
                  <span className="info-row__icon">📍</span>
                  <span>Toluca, Estado de México — Sucursal {s.nombre}</span>
                </div>
                <div className="info-row">
                  <span className="info-row__icon">🕐</span>
                  <div>
                    <div><strong>Lun – Vie:</strong> 9:00 am – 6:00 pm</div>
                    <div><strong>Sábado:</strong> 9:00 am – 4:30 pm</div>
                    <div style={{ color: "#999", fontSize: 12 }}>Domingos: Cerrado</div>
                  </div>
                </div>
                <div className="info-row">
                  <span className="info-row__icon">📞</span>
                  <div>
                    <div><strong>Ventas:</strong> <a href="tel:7291136254" className="suc-tel-link">729 113 6254</a></div>
                    <div><strong>Llamadas:</strong> <a href="tel:7291022894" className="suc-tel-link">729 102 2894</a></div>
                  </div>
                </div>
                <div className="info-row">
                  <span className="info-row__icon">📘</span>
                  <a href={FB} target="_blank" rel="noreferrer" className="suc-tel-link">facebook.com/MK5Llantera</a>
                </div>
                <div className="info-row">
                  <span className="info-row__icon">📸</span>
                  <a href={IG} target="_blank" rel="noreferrer" className="suc-tel-link">@mk5llantera</a>
                </div>

                <div style={{ marginTop: 14 }}>
                  <p style={{ fontWeight: 900, fontSize: 13, marginBottom: 8 }}>Servicios disponibles:</p>
                  <ul style={{ paddingLeft: 18, margin: 0 }}>
                    {SERVICIOS.map((srv) => (
                      <li key={srv} style={{ fontSize: 13, color: "#ccc", marginBottom: 4 }}>{srv}</li>
                    ))}
                  </ul>
                </div>

                <div style={{ marginTop: 16, display: "flex", gap: 10, flexWrap: "wrap" }}>
                  <a href={WA_CITAS} target="_blank" rel="noreferrer" className="suc-btn-wa">
                    💬 Agendar por WhatsApp
                  </a>
                  <a href={s.maps} target="_blank" rel="noreferrer" className="suc-btn-maps">
                    📍 Ver en Maps
                  </a>
                </div>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Banner garantía */}
      <div className="static-section suc-garantia">
        <h2>🛡️ Garantía contra defecto de fábrica</h2>
        <p>
          Todos nuestros productos cuentan con <strong>garantía contra defecto de fábrica</strong>.
          Si tu llanta presenta un defecto de fabricación, la reemplazamos sin costo.
          El desgaste natural, daños por impactos o mal uso no están cubiertos por esta garantía.
        </p>
        <p style={{ fontSize: 13, color: "#666" }}>
          Para hacer válida tu garantía, conserva tu comprobante de compra y contáctanos
          directamente por WhatsApp o llámanos.
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
        <p style={{ marginTop: 12, fontSize: 13, color: "#666" }}>
          * Los meses sin intereses están sujetos a las promociones vigentes de Mercado Pago
          y al banco emisor de tu tarjeta. Consulta disponibilidad al momento de tu compra.
        </p>
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
        <p style={{ marginTop: 12, fontSize: 13, color: "#666" }}>
          Para otros estados aplica costo de envío según destino. Consulta antes de comprar.
        </p>
      </div>

      {/* Banner instalación gratis */}
      <div className="static-section" style={{ background: "#f0fdf4", border: "1px solid #bbf7d0" }}>
        <h2 style={{ borderColor: "#16a34a" }}>🛠️ ¿Compraste en línea? La instalación es gratis</h2>
        <p>
          Todos nuestros clientes que compran en línea pueden llevar sus llantas a cualquiera de nuestras
          sucursales en Toluca para instalación y balanceo <strong>sin costo adicional</strong>.
          Solo agenda tu cita por WhatsApp y listo.
        </p>
        <div style={{ display: "flex", gap: 10, marginTop: 8, flexWrap: "wrap" }}>
          <a
            href={WA_CITAS}
            target="_blank"
            rel="noreferrer"
            style={{
              background: "#16a34a", color: "#fff", borderRadius: 10,
              padding: "10px 18px", fontWeight: 900, fontSize: 13, textDecoration: "none",
            }}
          >
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
