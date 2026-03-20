import { Link } from "react-router-dom";
import "../styles/pages.css";

const WA = "https://wa.me/527291136254?text=Hola%2C%20quiero%20hacer%20una%20devoluci%C3%B3n%20o%20reclamaci%C3%B3n%20de%20garant%C3%ADa";

export default function Devoluciones() {
  return (
    <main className="static-page">
      <div className="static-hero">
        <div className="static-hero__badge">🔄 Devoluciones y garantías</div>
        <h1>Tu compra está protegida</h1>
        <p>
          En MK5 Llantas respaldamos cada producto con garantía oficial de 12 meses
          y política de devolución clara. Compramos porque confiamos en lo que vendemos.
        </p>
      </div>

      {/* Garantía */}
      <div className="static-section" style={{background:"#f0fdf4",border:"1px solid #bbf7d0"}}>
        <h2 style={{borderColor:"#16a34a"}}>Garantía de 12 meses</h2>
        <p>
          Todos los productos vendidos en MK5 Llantas cuentan con garantía de <strong>12 meses</strong>{" "}
          contra defectos de fabricación, contando desde la fecha de recepción del producto.
        </p>
        <div className="benefit-chips">
          {[
            ["✅","Producto original","Solo vendemos llantas 100% originales y nuevas de fábrica."],
            ["🔧","Defectos de fabricación","Cubrimos cualquier defecto que no sea por mal uso."],
            ["🚚","Sin costo de envío","El envío de vuelta es cubierto por MK5 en garantías válidas."],
            ["⚡","Respuesta en 24 h","Atendemos tu caso por WhatsApp en menos de 24 horas hábiles."],
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

      {/* Qué cubre la garantía */}
      <div className="static-section">
        <h2>¿Qué cubre la garantía?</h2>
        <h3 style={{color:"#166534"}}>✅ Sí cubre:</h3>
        <ul>
          <li>Defectos de fabricación: burbujas, separación de capas, grietas internas.</li>
          <li>Producto diferente al descrito en la tienda.</li>
          <li>Producto dañado durante el envío (con evidencia fotográfica).</li>
          <li>Llanta incorrecta enviada por error de MK5.</li>
        </ul>
        <h3 style={{color:"#991b1b",marginTop:14}}>❌ No cubre:</h3>
        <ul>
          <li>Daños por ponchaduras, clavos, cortes externos o impactos.</li>
          <li>Desgaste normal por uso.</li>
          <li>Daños por mal inflado (exceso o falta de presión).</li>
          <li>Daños por instalación incorrecta no realizada en nuestra sucursal.</li>
          <li>Llantas con más de 12 meses desde la compra.</li>
        </ul>
      </div>

      {/* Proceso de devolución */}
      <div className="static-section">
        <h2>¿Cómo hacer una devolución o reclamación?</h2>
        {[
          ["1️⃣","Contáctanos por WhatsApp","Escríbenos al 729 113 6254 con tu número de pedido y descripción del problema."],
          ["2️⃣","Envía evidencia fotográfica","Toma fotos claras del defecto o daño y envíanoslas por WhatsApp."],
          ["3️⃣","Evaluamos tu caso","En menos de 24 horas hábiles te respondemos con la solución."],
          ["4️⃣","Resolución","Reposición del producto, cambio o reembolso según corresponda."],
        ].map(([num, title, desc]) => (
          <div key={title} style={{display:"flex",gap:12,marginBottom:16}}>
            <span style={{fontSize:24,lineHeight:1.2,flexShrink:0}}>{num}</span>
            <div>
              <div style={{fontWeight:900,marginBottom:3}}>{title}</div>
              <div style={{fontSize:13,color:"#555",lineHeight:1.5}}>{desc}</div>
            </div>
          </div>
        ))}
        <a
          href={WA}
          target="_blank"
          rel="noreferrer"
          style={{
            display:"inline-block",background:"#25d366",color:"#fff",
            borderRadius:10,padding:"12px 20px",fontWeight:900,
            fontSize:14,textDecoration:"none",marginTop:8,
          }}
        >
          💬 Iniciar reclamación por WhatsApp
        </a>
      </div>

      {/* Política de devoluciones */}
      <div className="static-section">
        <h2>Política de devoluciones</h2>
        <p>
          Aceptamos devoluciones dentro de los primeros <strong>7 días naturales</strong> desde
          la recepción del producto, siempre que el artículo esté en su estado original,
          sin instalar y con empaque original.
        </p>
        <p>
          El reembolso se procesa en un plazo de <strong>3 a 7 días hábiles</strong> una vez
          recibida y verificada la devolución, al mismo método de pago utilizado en la compra.
        </p>
        <p>
          Los gastos de envío de devolución corren a cargo del cliente, excepto cuando el
          error sea imputable a MK5 Llantas (producto equivocado o defectuoso).
        </p>
      </div>

      <div className="cta-band">
        <div>
          <h3>¿Tienes algún problema con tu pedido?</h3>
          <p>Estamos aquí para ayudarte. Contáctanos por WhatsApp ahora mismo.</p>
        </div>
        <a href={WA} target="_blank" rel="noreferrer" className="cta-band__btn">
          💬 Contactar soporte
        </a>
      </div>
    </main>
  );
}
