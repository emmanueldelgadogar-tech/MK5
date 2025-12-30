import { NavLink } from "react-router-dom";
export default function Footer() {
  return (
    <footer className="footer">
      <div className="container">
        <p>© {new Date().getFullYear()} MK5. Todos los derechos reservados.</p>
      </div>
    </footer>
  );
}
