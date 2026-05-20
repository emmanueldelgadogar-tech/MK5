import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import "../styles/cookieBanner.css";

const STORAGE_KEY = "mk5_cookie_consent";

export default function CookieBanner() {
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    // Mostrar solo si el usuario aún no decidió
    try {
      const saved = localStorage.getItem(STORAGE_KEY);
      if (!saved) {
        // Pequeño delay para no chocar con el primer paint
        const t = setTimeout(() => setVisible(true), 600);
        return () => clearTimeout(t);
      }
    } catch {
      // localStorage bloqueado (modo privado) → mostrar igual
      setVisible(true);
    }
  }, []);

  const persist = (value) => {
    try {
      localStorage.setItem(STORAGE_KEY, value);
      localStorage.setItem(`${STORAGE_KEY}_date`, new Date().toISOString());
    } catch {
      /* noop */
    }
    setVisible(false);
  };

  if (!visible) return null;

  return (
    <div className="cookie-banner" role="dialog" aria-live="polite" aria-label="Aviso de cookies">
      <div className="cookie-banner__content">
        <p className="cookie-banner__text">
          Usamos cookies y almacenamiento local para el funcionamiento del sitio
          (carrito, sesión, preferencias). Al continuar navegando aceptas nuestro{" "}
          <Link to="/privacidad" className="cookie-banner__link">
            Aviso de Privacidad
          </Link>
          .
        </p>
        <div className="cookie-banner__actions">
          <button
            type="button"
            className="cookie-banner__btn cookie-banner__btn--secondary"
            onClick={() => persist("essential_only")}
          >
            Solo necesarias
          </button>
          <button
            type="button"
            className="cookie-banner__btn cookie-banner__btn--primary"
            onClick={() => persist("accepted")}
          >
            Aceptar todas
          </button>
        </div>
      </div>
    </div>
  );
}
