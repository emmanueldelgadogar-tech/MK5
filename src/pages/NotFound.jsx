import { Link } from "react-router-dom";
import "../styles/pages.css";

export default function NotFound() {
  return (
    <main className="static-page" style={{ minHeight: "70vh", display: "flex", alignItems: "center", justifyContent: "center" }}>
      <div style={{ textAlign: "center", padding: "2rem" }}>
        <div style={{ fontSize: 80, marginBottom: 16 }}>🛞</div>
        <h1 style={{ fontSize: "2.5rem", fontWeight: 900, color: "#ff5b00", marginBottom: 8 }}>
          404
        </h1>
        <h2 style={{ fontSize: "1.4rem", color: "#fff", marginBottom: 12 }}>
          Página no encontrada
        </h2>
        <p style={{ color: "#999", marginBottom: 32, maxWidth: 400 }}>
          La página que buscas no existe o fue movida. Puede que el enlace esté desactualizado.
        </p>
        <div style={{ display: "flex", gap: 16, justifyContent: "center", flexWrap: "wrap" }}>
          <Link to="/" style={{ background: "#ff5b00", color: "#fff", padding: "12px 28px", borderRadius: 8, fontWeight: 700, textDecoration: "none" }}>
            Ir al inicio
          </Link>
          <Link to="/catalogo" style={{ background: "transparent", color: "#ff5b00", border: "2px solid #ff5b00", padding: "12px 28px", borderRadius: 8, fontWeight: 700, textDecoration: "none" }}>
            Ver catálogo
          </Link>
        </div>
        <p style={{ color: "#666", marginTop: 32, fontSize: 14 }}>
          ¿Necesitas ayuda?{" "}
          <a href="https://wa.me/527291136254" target="_blank" rel="noreferrer" style={{ color: "#25D366", fontWeight: 700 }}>
            Contáctanos por WhatsApp
          </a>
        </p>
      </div>
    </main>
  );
}
