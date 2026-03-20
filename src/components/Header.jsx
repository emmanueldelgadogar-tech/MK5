import { NavLink, useNavigate } from "react-router-dom";
import { useEffect, useState } from "react";
import { readCart } from "../utils/catalogoHelpers";
import logoImg from "../assets/logos/mini-logo.png";

export default function Header() {
  const navigate = useNavigate();
  const [q, setQ] = useState("");
  const [cartCount, setCartCount] = useState(0);
  const [userLogged, setUserLogged] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);

  useEffect(() => {
    function refreshCartCount() {
      try {
        const parsed = readCart();
        const total = parsed.reduce(
          (acc, row) => acc + Math.max(parseInt(row?.qty, 10) || 0, 0),
          0
        );
        setCartCount(total);
      } catch {
        setCartCount(0);
      }
    }

    function checkUser() {
      try {
        const u = localStorage.getItem("mk5_user");
        setUserLogged(!!u);
      } catch {
        setUserLogged(false);
      }
    }

    refreshCartCount();
    checkUser();
    window.addEventListener("storage", refreshCartCount);
    window.addEventListener("mk5-cart-updated", refreshCartCount);
    window.addEventListener("mk5-user-updated", checkUser);
    window.addEventListener("focus", refreshCartCount);
    return () => {
      window.removeEventListener("storage", refreshCartCount);
      window.removeEventListener("mk5-cart-updated", refreshCartCount);
      window.removeEventListener("mk5-user-updated", checkUser);
      window.removeEventListener("focus", refreshCartCount);
    };
  }, []);

  const onSearch = (e) => {
    e.preventDefault();
    const query = q.trim();
    if (!query) return;
    navigate(`/catalogo?q=${encodeURIComponent(query)}`);
    setQ("");
  };

  const onSearchIA = (e) => {
    e.preventDefault();
    const query = q.trim();
    navigate(`/ia${query ? `?q=${encodeURIComponent(query)}` : ""}`);
    setQ("");
  };

  return (
    <header className="header">
      {/* ── Barra de anuncio ── */}
      <div className="header__topbar">
        <div className="header__topbar-inner">
          <span>🚚 ENVÍO GRATIS EN ESTADOS SELECCIONADOS</span>
          <span className="htb-sep">|</span>
          <span>PAGOS A MESES SIN INTERESES CON MERCADO PAGO</span>
          <span className="htb-sep">|</span>
          <span>GARANTÍA CONTRA DEFECTO DE FÁBRICA</span>
        </div>
      </div>

      {/* ── Nav principal ── */}
      <div className="container header__inner">
        <NavLink to="/" className="header__brand" aria-label="Inicio">
          <img src={logoImg} alt="MK5 Llantas" />
        </NavLink>

        {/* Búsqueda mejorada con botón IA */}
        <form className="header__search" onSubmit={onSearch}>
          <input
            className="header__searchInput"
            value={q}
            onChange={(e) => setQ(e.target.value)}
            placeholder="Buscar medida, marca o modelo…"
          />
          <button className="header__searchBtn" type="submit">
            Buscar
          </button>
          <button
            className="header__searchBtn header__searchBtn--ia"
            type="button"
            onClick={onSearchIA}
            title="Buscar con Inteligencia Artificial"
          >
            🤖 IA
          </button>
        </form>

        <button className="nav__hamburger" onClick={() => setMenuOpen(!menuOpen)} aria-label="Menú">
          <span/><span/><span/>
        </button>
        <nav className={`nav ${menuOpen ? "nav--open" : ""}`} onClick={() => setMenuOpen(false)}>
          <NavLink to="/" className="nav__link">Inicio</NavLink>
          <NavLink to="/catalogo" className="nav__link">Catálogo</NavLink>
          <NavLink to="/nosotros" className="nav__link">Nosotros</NavLink>
          <NavLink to="/sucursales" className="nav__link">Sucursales</NavLink>
          <NavLink to="/blog" className="nav__link">Blog</NavLink>
          <NavLink to="/mi-cuenta" className="nav__link" title={userLogged ? "Mi cuenta" : "Iniciar sesión"} aria-label="Mi cuenta">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" width="20" height="20">
              <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/>
              <circle cx="12" cy="7" r="4"/>
            </svg>
          </NavLink>
          <NavLink to="/checkout" className="nav__link nav__link--cart" aria-label="Carrito">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" width="20" height="20">
              <circle cx="9" cy="21" r="1"/><circle cx="20" cy="21" r="1"/>
              <path d="M1 1h4l2.68 13.39a2 2 0 0 0 2 1.61h9.72a2 2 0 0 0 2-1.61L23 6H6"/>
            </svg>
            {cartCount > 0 && (
              <span className="nav__cartBadge">{cartCount}</span>
            )}
          </NavLink>
        </nav>
      </div>

      {/* ── Barra de beneficios ── */}
      <div className="header__benefits">
        <div className="header__benefits-inner">
          <span className="hbf-item">
            <span className="hbf-icon">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" width="15" height="15"><path d="M14.7 6.3a1 1 0 0 0 0 1.4l1.6 1.6a1 1 0 0 0 1.4 0l3.77-3.77a6 6 0 0 1-7.94 7.94l-6.91 6.91a2.12 2.12 0 0 1-3-3l6.91-6.91a6 6 0 0 1 7.94-7.94l-3.76 3.76z"/></svg>
            </span>
            <span>Instalación gratis en sucursal</span>
          </span>
          <span className="hbf-item">
            <span className="hbf-icon">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" width="15" height="15"><rect x="1" y="3" width="15" height="13"/><polygon points="16 8 20 8 23 11 23 16 16 16 16 8"/><circle cx="5.5" cy="18.5" r="2.5"/><circle cx="18.5" cy="18.5" r="2.5"/></svg>
            </span>
            <span>Envío en 48–72 h</span>
          </span>
          <span className="hbf-item">
            <span className="hbf-icon">
              <svg viewBox="0 0 24 24" fill="currentColor" width="15" height="15"><path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413Z"/></svg>
            </span>
            <span>Soporte por WhatsApp</span>
          </span>
          <span className="hbf-item">
            <span className="hbf-icon">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" width="15" height="15"><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/></svg>
            </span>
            <span>Garantía defecto fábrica</span>
          </span>
          <span className="hbf-item">
            <span className="hbf-icon">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" width="15" height="15"><rect x="1" y="4" width="22" height="16" rx="2" ry="2"/><line x1="1" y1="10" x2="23" y2="10"/></svg>
            </span>
            <span>Hasta 18 MSI</span>
          </span>
          <span className="hbf-item">
            <span className="hbf-icon">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" width="15" height="15"><rect x="3" y="11" width="18" height="11" rx="2" ry="2"/><path d="M7 11V7a5 5 0 0 1 10 0v4"/></svg>
            </span>
            <span>Compra segura SSL</span>
          </span>
        </div>
      </div>
    </header>
  );
}
