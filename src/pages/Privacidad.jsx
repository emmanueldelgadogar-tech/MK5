import { Link } from "react-router-dom";
import "../styles/pages.css";

const SECCIONES = [
  {
    titulo: "1. Responsable del tratamiento de datos",
    contenido: [
      "MK5 Llantas, con domicilio en México, es el responsable del tratamiento de tus datos personales conforme a la Ley Federal de Protección de Datos Personales en Posesión de los Particulares (LFPDPPP).",
      "Para cualquier consulta sobre el tratamiento de tus datos puedes contactarnos a través de WhatsApp o por correo electrónico.",
    ],
  },
  {
    titulo: "2. Datos que recopilamos",
    contenido: [
      "Recopilamos únicamente los datos necesarios para procesar tu compra y brindarte el servicio:",
      "• Nombre completo, correo electrónico y número de teléfono (al crear una cuenta o realizar un pedido).",
      "• Dirección de envío (calle, ciudad, estado, código postal).",
      "• Información de pago: NO almacenamos datos de tarjeta. Los pagos son procesados directamente por MercadoPago o PayPal, quienes cuentan con sus propias políticas de privacidad.",
      "• Datos de navegación anónimos (eventos de visita, productos vistos) para mejorar la experiencia del usuario.",
    ],
  },
  {
    titulo: "3. Finalidad del tratamiento",
    contenido: [
      "Utilizamos tus datos exclusivamente para:",
      "• Procesar y gestionar tu pedido de llantas.",
      "• Enviarte actualizaciones sobre el estado de tu pedido.",
      "• Brindarte soporte al cliente.",
      "• Mejorar nuestros servicios y personalizar tu experiencia de compra.",
      "No utilizamos tus datos para vender publicidad ni los compartimos con terceros con fines comerciales.",
    ],
  },
  {
    titulo: "4. Cookies y tecnologías de rastreo",
    contenido: [
      "Nuestro sitio utiliza cookies de sesión para mantener tu carrito de compras y una sesión de usuario segura.",
      "No utilizamos cookies de rastreo publicitario (Google Ads, Facebook Pixel, etc.) en este momento.",
      "Puedes configurar tu navegador para rechazar cookies, aunque esto puede afectar algunas funciones del sitio.",
    ],
  },
  {
    titulo: "5. Compartición de datos con terceros",
    contenido: [
      "Compartimos tus datos solo con los terceros estrictamente necesarios para procesar tu pedido:",
      "• MercadoPago / PayPal: para procesar pagos de forma segura.",
      "• Transportistas y paqueterías: nombre, dirección y teléfono para realizar la entrega.",
      "No vendemos, rentamos ni transferimos tus datos personales a terceros con fines de marketing.",
    ],
  },
  {
    titulo: "6. Seguridad de los datos",
    contenido: [
      "Implementamos medidas técnicas y organizativas para proteger tus datos:",
      "• Contraseñas almacenadas con hashing seguro (scrypt).",
      "• Sesiones cifradas con JWT (JSON Web Tokens) en cookies httpOnly.",
      "• Comunicaciones cifradas mediante HTTPS/TLS.",
      "• Acceso restringido a la base de datos.",
    ],
  },
  {
    titulo: "7. Derechos ARCO",
    contenido: [
      "Conforme a la LFPDPPP, tienes derecho a:",
      "• Acceso: conocer qué datos tenemos sobre ti.",
      "• Rectificación: corregir datos inexactos o incompletos.",
      "• Cancelación: solicitar la eliminación de tus datos.",
      "• Oposición: oponerte al tratamiento de tus datos.",
      "Para ejercer estos derechos, contáctanos por WhatsApp al +52 729 113 6254 o al correo indicado en nuestro sitio. Responderemos en un plazo máximo de 20 días hábiles.",
    ],
  },
  {
    titulo: "8. Retención de datos",
    contenido: [
      "Conservamos tus datos personales mientras tengas una cuenta activa o sea necesario para cumplir obligaciones legales y fiscales.",
      "Los datos de pedidos se conservan por el tiempo mínimo requerido por la legislación fiscal mexicana (5 años).",
      "Los datos analíticos anónimos se eliminan automáticamente después de 90 días.",
    ],
  },
  {
    titulo: "9. Cambios a esta política",
    contenido: [
      "Podemos actualizar esta Política de Privacidad ocasionalmente. Te notificaremos de cambios significativos a través de nuestro sitio web.",
      "La fecha de última actualización se indica al final de este documento.",
    ],
  },
];

export default function Privacidad() {
  return (
    <main className="static-page">
      <div className="static-hero">
        <div className="static-hero__badge">🔒 Privacidad</div>
        <h1>Política de Privacidad</h1>
        <p>
          En MK5 Llantas, tu privacidad es importante. Esta política explica cómo
          recopilamos, usamos y protegemos tu información personal.
        </p>
        <p style={{ fontSize: 13, color: "#aaa", marginTop: 8 }}>
          Última actualización: febrero 2026
        </p>
      </div>

      {SECCIONES.map((sec) => (
        <div className="static-section" key={sec.titulo}>
          <h2>{sec.titulo}</h2>
          {sec.contenido.map((p, i) => (
            <p key={i}>{p}</p>
          ))}
        </div>
      ))}

      <div className="static-section" style={{ textAlign: "center" }}>
        <p style={{ color: "#999", fontSize: 13 }}>
          ¿Tienes preguntas sobre cómo manejamos tus datos?
        </p>
        <div style={{ display: "flex", gap: 16, justifyContent: "center", marginTop: 16, flexWrap: "wrap" }}>
          <a
            href="https://wa.me/527291136254?text=Hola%2C%20tengo%20una%20pregunta%20sobre%20privacidad"
            target="_blank"
            rel="noreferrer"
            style={{ background: "#25D366", color: "#fff", padding: "10px 24px", borderRadius: 8, fontWeight: 700, textDecoration: "none" }}
          >
            💬 WhatsApp
          </a>
          <Link to="/terminos" style={{ background: "transparent", color: "#ff5b00", border: "2px solid #ff5b00", padding: "10px 24px", borderRadius: 8, fontWeight: 700, textDecoration: "none" }}>
            Ver Términos y Condiciones
          </Link>
        </div>
      </div>
    </main>
  );
}
