import { NavLink } from "react-router-dom";
import miniLogo from "../assets/mini-logo.png";

export default function Header() {
  return (
    <header className="header">
      <div className="container header__inner">
        <NavLink to="/" className="header__brand">
          <img src={miniLogo} alt="MK5" />
        </NavLink>

        <nav className="nav">
          <NavLink to="/" className={({ isActive }) => `nav__link ${isActive ? "is-active" : ""}`}>
            Inicio
          </NavLink>

          <NavLink to="/catalogo" className={({ isActive }) => `nav__link ${isActive ? "is-active" : ""}`}>
            Catálogo
          </NavLink>

          <NavLink to="/checkout" className={({ isActive }) => `nav__link ${isActive ? "is-active" : ""}`}>
            Cita
          </NavLink>
        </nav>
      </div>
    </header>
  );
}

