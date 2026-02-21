import { Link } from "react-router-dom";
import "../styles/pages.css";

const METODOS = [
  {
    icon: "💳",
    name: "Tarjeta de crédito / débito",
    desc: "VISA, Mastercard y American Express. Procesado de forma segura con encriptación SSL.",
    badge: "Inmediato",
    msi: "Hasta 18 meses sin intereses con bancos participantes",
  },
  {
    icon: "🟡",
    name: "Mercado Pago",
    desc: "Paga con tu cuenta Mercado Pago, tarjeta o en efectivo en puntos de pago. Seguro y rápido.",
    badge: "Inmediato",
    msi: "Hasta 12 MSI disponible",
  },
  {
    icon: "🔵",
    name: "PayPal",
    desc: "Pago seguro con tu cuenta PayPal o tarjeta vinculada. Protección al comprador incluida.",
    badge: "Inmediato",
    msi: null,
  },
  {
    icon: "🏪",
    name: "OXXO Pay",
    desc: "Genera tu referencia de pago y paga en efectivo en cualquier tienda OXXO del país.",
    badge: "48h hábiles",
    msi: null,
  },
  {
    icon: "🏦",
    name: "Transferencia bancaria",
    desc: "Transfiere a nuestra cuenta CLABE y envíanos el comprobante por WhatsApp para confirmar.",
    badge: "24h hábiles",
    msi: null,
  },
  {
    icon: "📱",
    name: "CoDi / SPEI inmediato",
    desc: "Transfiere por CoDi desde tu app bancaria. Confirmación inmediata.",
    badge: "Inmediato",
    msi: null,
  },
];

const MSI_BANCOS = [
  "BBVA","Banamex","Santander","HSBC","Banorte","Scotiabank","Inbursa","American Express",
];

export default function MetodosPago() {
  return (
    <main className="static-page">
      <div className="static-hero">
        <div className="static-hero__badge">💳 Métodos de pago</div>
        <h1>Paga como más te convenga</h1>
        <p>
          Aceptamos múltiples formas de pago para que tu experiencia de compra sea
          fácil y segura. Todos los pagos procesados con encriptación SSL 256 bits.
        </p>
      </div>

      {/* Métodos */}
      <div className="static-section">
        <h2>Formas de pago aceptadas</h2>
        <div className="payment-grid">
          {METODOS.map((m) => (
            <div key={m.name} className="payment-card">
              <span className="payment-card__icon">{m.icon}</span>
              <div className="payment-card__name">{m.name}</div>
              <p className="payment-card__desc">{m.desc}</p>
              {m.msi && (
                <div style={{fontSize:12,color:"#ff5b00",fontWeight:800}}>{m.msi}</div>
              )}
              <span className="payment-card__badge">⚡ {m.badge}</span>
            </div>
          ))}
        </div>
      </div>

      {/* MSI */}
      <div className="static-section" style={{background:"#fff9f0",border:"1px solid #fed7aa"}}>
        <h2 style={{borderColor:"#f97316"}}>Meses sin intereses</h2>
        <p>
          Compra con tarjeta de crédito y paga en cómodas mensualidades sin pagar de más.
          Hasta 18 meses sin intereses con los siguientes bancos:
        </p>
        <div style={{display:"flex",flexWrap:"wrap",gap:8,marginTop:10}}>
          {MSI_BANCOS.map((b) => (
            <span key={b} style={{
              background:"#fff",border:"1px solid #fed7aa",borderRadius:8,
              padding:"6px 12px",fontSize:13,fontWeight:800,color:"#111"
            }}>
              {b}
            </span>
          ))}
        </div>
        <p style={{marginTop:12,color:"#999",fontSize:12}}>
          * Aplican términos y condiciones de cada banco. Sujeto a autorización.
        </p>
      </div>

      {/* Seguridad */}
      <div className="static-section">
        <h2>Tu pago siempre está protegido</h2>
        <div className="benefit-chips">
          {[
            ["🔒","SSL 256 bits","Todos los pagos viajan encriptados."],
            ["🛡️","Verificación 3D","Doble verificación en pagos con tarjeta."],
            ["📧","Confirmación inmediata","Recibe tu comprobante al instante por email."],
            ["💬","Soporte 24/7","Cualquier problema, te ayudamos por WhatsApp."],
          ].map(([ic, t, d]) => (
            <div key={t} className="benefit-chip">
              <span className="benefit-chip__icon">{ic}</span>
              <div>
                <div style={{fontWeight:900,marginBottom:2}}>{t}</div>
                <div style={{fontSize:12,color:"#555"}}>{d}</div>
              </div>
            </div>
          ))}
        </div>
      </div>

      <div className="cta-band">
        <div>
          <h3>¿Tienes dudas sobre tu pago?</h3>
          <p>Escríbenos por WhatsApp y te ayudamos en minutos.</p>
        </div>
        <a
          href="https://wa.me/525512345678"
          target="_blank"
          rel="noreferrer"
          className="cta-band__btn"
        >
          💬 Contactar por WhatsApp
        </a>
      </div>
    </main>
  );
}
