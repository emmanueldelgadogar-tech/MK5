import { Link } from "react-router-dom";
import "../styles/pages.css";

const VALORES = [
  { icon: "🏆", title: "Calidad garantizada", desc: "Solo trabajamos con marcas certificadas y productos 100% originales." },
  { icon: "🚀", title: "Envío rápido", desc: "Entrega en 48–72 horas en toda la República Mexicana." },
  { icon: "💬", title: "Soporte real", desc: "Atención personalizada por WhatsApp con expertos en llantas." },
  { icon: "💰", title: "Mejor precio", desc: "Precios competitivos y hasta 18 meses sin intereses." },
  { icon: "📄", title: "Facturación inmediata", desc: "Te facturamos al instante para tu empresa o deducción." },
  { icon: "🔒", title: "Compra segura", desc: "Plataforma segura con múltiples métodos de pago." },
];

const MARCAS_ALIADAS = [
  "Pirelli","Michelin","Continental","Bridgestone","Goodyear",
  "Hankook","Cooper","Firestone","Tornel","Laufenn",
  "Euzkadi","Kumho","Falken","Nexen","Dunlop",
  "Vinmax","Antares","Blackhawk","Maxtrek","Pegasus",
];

export default function Nosotros() {
  return (
    <main className="static-page">
      {/* Hero */}
      <div className="static-hero">
        <div className="static-hero__badge">⭐ Sobre nosotros</div>
        <h1>Tu aliado de confianza en llantas desde México</h1>
        <p>
          MK5 Llantas nació con una misión clara: hacer que comprar llantas de calidad
          sea fácil, rápido y accesible para todos los mexicanos. Somos una empresa
          100% mexicana comprometida con el servicio, la honestidad y la seguridad vial.
        </p>
      </div>

      {/* Stats */}
      <div className="stats-row">
        <div className="stat-box">
          <div className="stat-box__num">1,200+</div>
          <div className="stat-box__label">Modelos disponibles</div>
        </div>
        <div className="stat-box">
          <div className="stat-box__num">30+</div>
          <div className="stat-box__label">Marcas aliadas</div>
        </div>
        <div className="stat-box">
          <div className="stat-box__num">5,000+</div>
          <div className="stat-box__label">Clientes satisfechos</div>
        </div>
        <div className="stat-box">
          <div className="stat-box__num">12</div>
          <div className="stat-box__label">Meses de garantía</div>
        </div>
      </div>

      {/* Misión */}
      <div className="static-section">
        <h2>Nuestra misión</h2>
        <p>
          En MK5 Llantas queremos que cada conductor mexicano pueda acceder a llantas de
          calidad con la mejor asesoría, precio justo y servicio post-venta real. No somos
          solo una tienda: somos tu equipo de confianza para que manejes seguro.
        </p>
        <p>
          Operamos desde Toluca, Estado de México, combinando nuestra sucursal física con tienda
          en línea para mantenerte los costos bajos y pasarte el ahorro directamente. Nuestro
          catálogo incluye más de 1,200 modelos de las mejores marcas globales con stock nacional disponible.
        </p>
      </div>

      {/* Valores */}
      <div className="static-section">
        <h2>Por qué elegir MK5</h2>
        <div className="benefit-chips">
          {VALORES.map((v) => (
            <div key={v.title} className="benefit-chip">
              <span className="benefit-chip__icon">{v.icon}</span>
              <div>
                <div style={{fontWeight:900,marginBottom:2}}>{v.title}</div>
                <div style={{fontWeight:400,fontSize:12,color:"#555"}}>{v.desc}</div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Marcas aliadas */}
      <div className="static-section">
        <h2>Marcas que manejamos</h2>
        <div style={{display:"flex",flexWrap:"wrap",gap:10,marginTop:8}}>
          {MARCAS_ALIADAS.map((m) => (
            <Link
              key={m}
              to={`/catalogo/${m.toLowerCase()}`}
              style={{
                background:"#f3f4f6",
                border:"1px solid #e5e7eb",
                borderRadius:8,
                padding:"8px 16px",
                fontWeight:800,
                fontSize:13,
                color:"#111",
                textDecoration:"none",
              }}
            >
              {m}
            </Link>
          ))}
        </div>
      </div>

      {/* Proceso de compra */}
      <div className="static-section">
        <h2>¿Cómo funciona la compra?</h2>
        {[
          ["1️⃣","Busca tu medida","Usa el buscador, el asistente IA o los filtros del catálogo para encontrar tu llanta."],
          ["2️⃣","Agrega al carrito","Selecciona cantidad y agrega al carrito. Puedes comprar 1, 2 o 4 llantas."],
          ["3️⃣","Elige cómo pagar","Tarjeta, MSI, MercadoPago, PayPal, OXXO o transferencia bancaria."],
          ["4️⃣","Recibe o instala","Envío a domicilio en 48–72 h, o recoge e instala gratis en sucursal."],
        ].map(([num, title, desc]) => (
          <div key={title} style={{display:"flex",gap:12,marginBottom:14}}>
            <span style={{fontSize:24,lineHeight:1.2,flexShrink:0}}>{num}</span>
            <div>
              <div style={{fontWeight:900,marginBottom:3}}>{title}</div>
              <div style={{fontSize:13,color:"#555",lineHeight:1.5}}>{desc}</div>
            </div>
          </div>
        ))}
      </div>

      {/* CTA */}
      <div className="cta-band">
        <div>
          <h3>¿Listo para encontrar tus llantas?</h3>
          <p>Más de 1,200 modelos con envío gratis y garantía incluida.</p>
        </div>
        <Link to="/catalogo" className="cta-band__btn">Ver catálogo →</Link>
      </div>
    </main>
  );
}
