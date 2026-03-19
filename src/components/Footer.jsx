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
            <a href={IG} target="_blank" rel="noreferrer" aria-label="Instagram" className="footer__social-link footer__social-link--ig">
              <svg viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" width="18" height="18">
                <rect x="2" y="2" width="20" height="20" rx="5.5" fill="currentColor"/>
                <circle cx="12" cy="12" r="4" stroke="#1a1a2e" strokeWidth="1.8" fill="none"/>
                <circle cx="17.5" cy="6.5" r="1.2" fill="#1a1a2e"/>
              </svg>
            </a>
            <a href={FB} target="_blank" rel="noreferrer" aria-label="Facebook" className="footer__social-link footer__social-link--fb">
              <svg viewBox="0 0 24 24" fill="currentColor" xmlns="http://www.w3.org/2000/svg" width="18" height="18">
                <path d="M24 12.073C24 5.405 18.627 0 12 0S0 5.405 0 12.073C0 18.1 4.388 23.094 10.125 24v-8.437H7.078v-3.49h3.047V9.41c0-3.025 1.792-4.697 4.533-4.697 1.312 0 2.686.235 2.686.235v2.97h-1.513c-1.491 0-1.956.932-1.956 1.887v2.268h3.328l-.532 3.49h-2.796V24C19.612 23.094 24 18.1 24 12.073z"/>
              </svg>
            </a>
            <a href={WA_VENTAS} target="_blank" rel="noreferrer" aria-label="WhatsApp" className="footer__social-link footer__social-link--wa">
              <svg viewBox="0 0 24 24" fill="currentColor" xmlns="http://www.w3.org/2000/svg" width="18" height="18">
                <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413Z"/>
              </svg>
            </a>
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
            <li><Link to="/privacidad">Política de privacidad</Link></li>
            <li><Link to="/ia">Asistente IA</Link></li>
            <li><Link to="/mi-cuenta">Mi cuenta</Link></li>
            <li><Link to="/rastrear-pedido">Rastrear pedido</Link></li>
          </ul>
        </div>

        {/* Col 4 — Contacto */}
        <div className="footer-col">
          <h4>Contacto</h4>
          <div className="footer__contact-item">
            <span className="footer__contact-icon">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" width="15" height="15"><path d="M22 16.92v3a2 2 0 01-2.18 2 19.79 19.79 0 01-8.63-3.07A19.5 19.5 0 013.07 9.5a19.79 19.79 0 01-3.07-8.67A2 2 0 012 .84h3a2 2 0 012 1.72c.127.96.361 1.903.7 2.81a2 2 0 01-.45 2.11L6.09 8.61a16 16 0 006.29 6.29l1.13-1.13a2 2 0 012.11-.45c.907.339 1.85.573 2.81.7A2 2 0 0122 16.92z"/></svg>
            </span>
            <a href="tel:7291022894" style={{ color: "inherit", textDecoration: "none" }}>729 102 2894</a>
          </div>
          <div className="footer__contact-item">
            <span className="footer__contact-icon">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" width="15" height="15"><path d="M22 16.92v3a2 2 0 01-2.18 2 19.79 19.79 0 01-8.63-3.07A19.5 19.5 0 013.07 9.5a19.79 19.79 0 01-3.07-8.67A2 2 0 012 .84h3a2 2 0 012 1.72c.127.96.361 1.903.7 2.81a2 2 0 01-.45 2.11L6.09 8.61a16 16 0 006.29 6.29l1.13-1.13a2 2 0 012.11-.45c.907.339 1.85.573 2.81.7A2 2 0 0122 16.92z"/></svg>
            </span>
            <a href="tel:7291136254" style={{ color: "inherit", textDecoration: "none" }}>729 113 6254 (Ventas)</a>
          </div>
          <div className="footer__contact-item">
            <span className="footer__contact-icon" style={{ color: "#25d366" }}>
              <svg viewBox="0 0 24 24" fill="currentColor" width="15" height="15"><path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413Z"/></svg>
            </span>
            <a href={WA_VENTAS} target="_blank" rel="noreferrer" style={{ color: "#25d366" }}>WhatsApp directo</a>
          </div>
          <div className="footer__contact-item">
            <span className="footer__contact-icon">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" width="15" height="15"><circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/></svg>
            </span>
            <span>Lun–Vie 9:00–18:00<br />Sáb 9:00–16:30<br />Dom: Cerrado</span>
          </div>
          <div className="footer__contact-item">
            <span className="footer__contact-icon">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" width="15" height="15"><path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0118 0z"/><circle cx="12" cy="10" r="3"/></svg>
            </span>
            <span>Toluca, Estado de México</span>
          </div>
          <div className="footer__contact-item">
            <span className="footer__contact-icon">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" width="15" height="15"><rect x="3" y="11" width="18" height="11" rx="2" ry="2"/><path d="M7 11V7a5 5 0 0110 0v4"/></svg>
            </span>
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
