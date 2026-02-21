import { NavLink, useNavigate } from "react-router-dom";
import { useEffect, useState } from "react";
import { readCart } from "../utils/catalogoHelpers";
import logoImg from "../assets/logos/mini-logo.png";

export default function Header() {
  const navigate = useNavigate();
  const [q, setQ] = useState("");
  const [cartCount, setCartCount] = useState(0);
  const [userLogged, setUserLogged] = useState(false);

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

        <nav className="nav">
          <NavLink to="/" className="nav__link">Inicio</NavLink>
          <NavLink to="/catalogo" className="nav__link">Catálogo</NavLink>
          <NavLink to="/nosotros" className="nav__link">Nosotros</NavLink>
          <NavLink to="/sucursales" className="nav__link">Sucursales</NavLink>
          <NavLink to="/blog" className="nav__link">Blog</NavLink>
          {userLogged ? (
            <NavLink to="/mi-cuenta" className="nav__link" title="Mi cuenta">
              👤
            </NavLink>
          ) : (
            <NavLink to="/mi-cuenta" className="nav__link" title="Iniciar sesión">
              🔑
            </NavLink>
          )}
          <NavLink to="/checkout" className="nav__link nav__link--cart" aria-label="Carrito">
            🛒
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
            <span className="hbf-icon">🛠️</span>
            <span>Instalación gratis en sucursal</span>
          </span>
          <span className="hbf-item">
            <span className="hbf-icon">🚚</span>
            <span>Envío en 24–48 h</span>
          </span>
          <span className="hbf-item">
            <span className="hbf-icon">💬</span>
            <span>Soporte por WhatsApp</span>
          </span>
          <span className="hbf-item">
            <span className="hbf-icon">🛡️</span>
            <span>Garantía defecto fábrica</span>
          </span>
          <span className="hbf-item">
            <span className="hbf-icon">💳</span>
            <span>Hasta 18 MSI</span>
          </span>
          <span className="hbf-item">
            <span className="hbf-icon">🔒</span>
            <span>Compra segura SSL</span>
          </span>
        </div>
      </div>
    </header>
  );
}
