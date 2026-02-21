import { Link } from "react-router-dom";
import "../styles/pages.css";

const SECCIONES = [
  {
    titulo: "1. Uso del sitio web",
    contenido: [
      "Al acceder y utilizar mk5llantas.com, aceptas cumplir con estos Términos y Condiciones. Si no estás de acuerdo con alguna parte de estos términos, por favor abstente de utilizar nuestro sitio.",
      "El sitio está destinado exclusivamente a mayores de 18 años o personas con capacidad legal para contratar. El uso del sitio para fines ilegales o no autorizados está estrictamente prohibido.",
    ],
  },
  {
    titulo: "2. Información de productos",
    contenido: [
      "Nos esforzamos por mostrar información precisa sobre precios, disponibilidad y características de los productos. Sin embargo, MK5 Llantas se reserva el derecho de corregir errores tipográficos o de información sin previo aviso.",
      "Las imágenes de los productos son ilustrativas. El producto final puede presentar variaciones menores en apariencia sin afectar sus especificaciones técnicas.",
      "Los precios mostrados incluyen IVA y están expresados en pesos mexicanos (MXN).",
    ],
  },
  {
    titulo: "3. Proceso de compra y pagos",
    contenido: [
      "Al realizar un pedido, aceptas proporcionar información veraz y completa. MK5 Llantas se reserva el derecho de cancelar pedidos en caso de información incorrecta o fraude.",
      "El pedido se confirma una vez procesado el pago. En caso de pago por OXXO o transferencia, la confirmación puede tardar hasta 48 horas hábiles.",
      "Los pagos a meses sin intereses están sujetos a la aprobación del banco emisor. MK5 Llantas no es responsable por rechazos bancarios.",
    ],
  },
  {
    titulo: "4. Envíos y entregas",
    contenido: [
      "Los envíos se realizan a toda la República Mexicana. El tiempo estimado de entrega es de 2 a 5 días hábiles dependiendo de la ubicación.",
      "El envío a domicilio es gratuito en pedidos de más de $1,500 MXN. Para pedidos menores, se aplicará una cuota de envío que se mostrará en el proceso de pago.",
      "MK5 Llantas no es responsable por retrasos causados por la paquetería, fenómenos naturales o circunstancias ajenas a nuestro control.",
    ],
  },
  {
    titulo: "5. Devoluciones y garantías",
    contenido: [
      "Aceptamos devoluciones dentro de los 7 días naturales posteriores a la recepción del producto, siempre que el artículo esté sin instalar y en su empaque original.",
      "Todos los productos cuentan con garantía de 12 meses contra defectos de fabricación. Para más detalles, consulta nuestra Política de Devoluciones y Garantías.",
    ],
  },
  {
    titulo: "6. Propiedad intelectual",
    contenido: [
      "Todo el contenido del sitio, incluyendo textos, imágenes, logotipos y diseño, es propiedad de MK5 Llantas o sus licenciantes y está protegido por las leyes de propiedad intelectual.",
      "Queda prohibida la reproducción, distribución o uso comercial de cualquier contenido del sitio sin autorización previa por escrito.",
    ],
  },
  {
    titulo: "7. Privacidad y datos personales",
    contenido: [
      "MK5 Llantas recopila y trata datos personales de conformidad con la Ley Federal de Protección de Datos Personales en Posesión de los Particulares (LFPDPPP).",
      "Los datos recopilados se utilizan exclusivamente para procesar pedidos, mejorar el servicio y enviar comunicaciones relacionadas con tu compra. No vendemos ni compartimos tus datos con terceros con fines comerciales.",
    ],
  },
  {
    titulo: "8. Limitación de responsabilidad",
    contenido: [
      "MK5 Llantas no será responsable por daños indirectos, incidentales o consecuentes derivados del uso del sitio o de los productos adquiridos más allá de lo establecido en nuestra política de garantías.",
      "La responsabilidad máxima de MK5 Llantas se limita al valor del producto adquirido.",
    ],
  },
  {
    titulo: "9. Modificaciones",
    contenido: [
      "MK5 Llantas se reserva el derecho de modificar estos Términos y Condiciones en cualquier momento. Los cambios entrarán en vigor en el momento de su publicación en el sitio.",
      "Te recomendamos revisar periódicamente esta página para estar al tanto de cualquier actualización.",
    ],
  },
  {
    titulo: "10. Ley aplicable y jurisdicción",
    contenido: [
      "Estos Términos y Condiciones se rigen por las leyes de los Estados Unidos Mexicanos. Cualquier controversia será sometida a los tribunales competentes de la Ciudad de México, renunciando las partes a cualquier otro fuero que pudiera corresponderles.",
    ],
  },
];

export default function Terminos() {
  return (
    <main className="static-page">
      <div className="static-hero">
        <div className="static-hero__badge">📄 Legal</div>
        <h1>Términos y condiciones</h1>
        <p>
          Última actualización: Enero 2025. Estos términos regulan el uso de
          mk5llantas.com y la relación comercial entre MK5 Llantas y sus clientes.
        </p>
      </div>

      {SECCIONES.map((s) => (
        <div key={s.titulo} className="static-section">
          <h2>{s.titulo}</h2>
          {s.contenido.map((p, i) => (
            <p key={i}>{p}</p>
          ))}
        </div>
      ))}

      <div className="static-section" style={{background:"#f8fafc"}}>
        <h2>Contacto legal</h2>
        <p>
          Para cualquier consulta relacionada con estos términos, contáctanos en:
        </p>
        <div className="info-row">
          <span className="info-row__icon">📧</span>
          <span>legal@mk5llantas.com</span>
        </div>
        <div className="info-row">
          <span className="info-row__icon">💬</span>
          <span>WhatsApp: +52 55 1234 5678</span>
        </div>
        <div className="info-row">
          <span className="info-row__icon">📍</span>
          <span>Ciudad de México, México</span>
        </div>
      </div>
    </main>
  );
}
