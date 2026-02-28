// En producción define VITE_API_BASE en tu .env (sin barra final)
// Ejemplo: VITE_API_BASE=https://tu-servidor.com
export const API_BASE = import.meta.env.VITE_API_BASE || "http://localhost:4000";
