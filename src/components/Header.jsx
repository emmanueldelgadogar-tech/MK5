import { NavLink } from "react-router-dom";

export default function Header() {
  return (
    <header className="header">
      <div className="container header__inner">
        <strong className="logo">MK5</strong>

        <nav className="nav">
          <NavLink to="/" className="nav__link">Home</NavLink>
          <NavLink to="/catalogo" className="nav__link">Catalogo</NavLink>
          <NavLink to="/checkout" className="nav__link">Checkout</NavLink>
        </nav>

        <button className="btn">Cotizar</button>
      </div>
    </header>
  );
}
