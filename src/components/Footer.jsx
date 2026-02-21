import { Link } from "react-router-dom";
import logoImg from "../assets/logos/mini-logo.png";

const WA_VENTAS = "https://wa.me/527291136254?text=Hola%2C%20me%20interesa%20informaci%C3%B3n%20sobre%20llantas";
const FB        = "https://www.facebook.com/MK5Llantera";
const IG        = "https://www.instagram.com/mk5llantera?igsh=c29veDlibGdma2t2";

export default function Footer() {
  const year = new Date().getFullYear();

  return (
    <footer className="footer">
      <div className="footer__main">

        {/* Col 1 — Marca */}
        <div className="footer-col">
          <img src={logoImg} alt="MK5 Llantas" className="footer__logo" />
          <h4>MK5 Llantas</h4>
          <p>
            Tu tienda online de llantas en México. Más de 500 modelos de las mejores marcas
            con instalación, garantía y envío a domicilio.
          </p>
          <div className="footer__social">
            <a href={IG} target="_blank" rel="noreferrer" aria-label="Instagram">📸</a>
            <a href={FB} target="_blank" rel="noreferrer" aria-label="Facebook">📘</a>
            <a href={WA_VENTAS} target="_blank" rel="noreferrer" aria-label="WhatsApp">💬</a>
          </div>
        </div>

        {/* Col 2 — Catálogo */}
        <div className="footer-col">
          <h4>Catálogo</h4>
          <ul>
            <li><Link to="/catalogo">Todos los productos</Link></li>
            <li><Link to="/catalogo/pirelli">Pirelli</Link></li>
            <li><Link to="/catalogo/michelin">Michelin</Link></li>
            <li><Link to="/catalogo/continental">Continental</Link></li>
            <li><Link to="/catalogo/bridgestone">Bridgestone</Link></li>
            <li><Link to="/catalogo/goodyear">Goodyear</Link></li>
            <li><Link to="/catalogo/hankook">Hankook</Link></li>
            <li><Link to="/catalogo/cooper">Cooper</Link></li>
          </ul>
        </div>

        {/* Col 3 — Información */}
        <div className="footer-col">
          <h4>Información</h4>
          <ul>
            <li><Link to="/nosotros">Nosotros</Link></li>
            <li><Link to="/blog">Blog</Link></li>
            <li><Link to="/sucursales">Sucursales</Link></li>
            <li><Link to="/metodos-de-pago">Métodos de pago</Link></li>
            <li><Link to="/devoluciones">Devoluciones y garantías</Link></li>
            <li><Link to="/terminos">Términos y condiciones</Link></li>
            <li><Link to="/ia">Asistente IA</Link></li>
            <li><Link to="/mi-cuenta">Mi cuenta</Link></li>
            <li><Link to="/rastrear-pedido">Rastrear pedido</Link></li>
          </ul>
        </div>

        {/* Col 4 — Contacto */}
        <div className="footer-col">
          <h4>Contacto</h4>
          <div className="footer__contact-item">
            <span className="footer__contact-icon">📞</span>
            <a href="tel:7291022894" style={{ color: "inherit", textDecoration: "none" }}>
              729 102 2894
            </a>
          </div>
          <div className="footer__contact-item">
            <span className="footer__contact-icon">🛒</span>
            <a href="tel:7291136254" style={{ color: "inherit", textDecoration: "none" }}>
              729 113 6254 (Ventas)
            </a>
          </div>
          <div className="footer__contact-item">
            <span className="footer__contact-icon">💬</span>
            <a href={WA_VENTAS} target="_blank" rel="noreferrer" style={{ color: "#25d366" }}>
              WhatsApp directo
            </a>
          </div>
          <div className="footer__contact-item">
            <span className="footer__contact-icon">🕐</span>
            <span>
              Lun–Vie 9:00–18:00<br />
              Sáb 9:00–16:30<br />
              Dom: Cerrado
            </span>
          </div>
          <div className="footer__contact-item">
            <span className="footer__contact-icon">📍</span>
            <span>Toluca, Estado de México</span>
          </div>
          <div className="footer__contact-item">
            <span className="footer__contact-icon">🔒</span>
            <span style={{ fontSize: 12, color: "#aaa" }}>Sitio protegido con SSL</span>
          </div>
        </div>
      </div>

      <hr className="footer__divider" />

      <div className="footer__bottom">
        <p>© {year} MK5 Llantas. Todos los derechos reservados.</p>
        <div className="footer__payment">
          <span className="footer__payment-badge">VISA</span>
          <span className="footer__payment-badge">Mastercard</span>
          <span className="footer__payment-badge">AMEX</span>
          <span className="footer__payment-badge">Mercado Pago</span>
          <span className="footer__payment-badge">PayPal</span>
          <span className="footer__payment-badge">OXXO</span>
          <span className="footer__payment-badge">SPEI</span>
          <span className="footer__payment-badge">🔒 SSL</span>
        </div>
      </div>
    </footer>
  );
}
