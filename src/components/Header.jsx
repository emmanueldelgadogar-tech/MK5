import { NavLink, useNavigate } from "react-router-dom";
import { useState } from "react";

import logoImg from "../assets/logos/mini-logo.png";

export default function Header() {
  const navigate = useNavigate();
  const [q, setQ] = useState("");

  const onSearch = (e) => {
    e.preventDefault();
    const query = q.trim();
    if (!query) return;
    navigate(`/catalogo?q=${encodeURIComponent(query)}`);
    setQ("");
  };

  return (
    <header className="header">
      <div className="container header__inner">
        <NavLink to="/" className="header__brand" aria-label="Inicio">
          <img src={logoImg} alt="MK5" />
        </NavLink>

        
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
        </form>

        <nav className="nav">
          <NavLink to="/" className="nav__link">
            Inicio
          </NavLink>
          <NavLink to="/catalogo" className="nav__link">
            Catálogo
          </NavLink>
          <NavLink to="/checkout" className="nav__link">
            Carrito
          </NavLink>
        </nav>
      </div>
    </header>
  );
}
