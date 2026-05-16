import { useState, useEffect } from "react";
import { Link, useNavigate, useSearchParams } from "react-router-dom";
import "../styles/pages.css";
import "../styles/cuenta.css";
import { API_BASE } from "../config";
import AdminPanel from "./AdminPanel";

function isValidEmail(email) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim());
}

const ERROR_MESSAGES = {
  auth_failed: "Correo o contraseña incorrectos.",
  email_already_registered: "Ese correo ya está registrado. Inicia sesión.",
  invalid_credentials: "Revisa tu correo y contraseña (mínimo 8 caracteres).",
  invalid_email: "Ingresa un correo electrónico válido.",
  name_too_long: "El nombre es demasiado largo.",
  too_many_requests: "Demasiados intentos. Espera 15 minutos e intenta de nuevo.",
  session_expired: "Tu sesión expiró. Inicia sesión de nuevo.",
};

function friendlyError(code, fallback) {
  return ERROR_MESSAGES[code] || fallback;
}

export default function MiCuenta() {
  useNavigate();
  const [searchParams] = useSearchParams();
  // "login" | "register" | "forgot" | "reset"
  const [mode, setMode] = useState(() => searchParams.get("reset") ? "reset" : "login");
  const [resetToken] = useState(() => searchParams.get("reset") || "");
  const [user, setUser] = useState(null);
  const [sessionLoading, setSessionLoading] = useState(true);

  const [form, setForm] = useState({ name: "", email: "", phone: "", password: "" });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [fieldErrors, setFieldErrors] = useState({});
  const [showPass, setShowPass] = useState(false);
  const [newPassword, setNewPassword] = useState("");
  const [forgotEmail, setForgotEmail] = useState("");

  // Verifica sesión usando token almacenado en localStorage
  useEffect(() => {
    async function checkSession() {
      try {
        const stored = localStorage.getItem("mk5_user");
        if (!stored) { setSessionLoading(false); return; }
        const cached = JSON.parse(stored);
        if (!cached?.session_token) {
          // Sesión antigua sin token — limpiar
          localStorage.removeItem("mk5_user");
          window.dispatchEvent(new Event("mk5-user-updated"));
          setSessionLoading(false);
          return;
        }
        // Verificar token contra el servidor
        const res = await fetch(`${API_BASE}/api/auth/me`, {
          headers: { "Authorization": `Bearer ${cached.session_token}` },
        });
        if (res.ok) {
          const data = await res.json();
          if (data?.ok && data?.user) {
            const updated = { ...cached, ...data.user };
            setUser(updated);
            localStorage.setItem("mk5_user", JSON.stringify(updated));
            window.dispatchEvent(new Event("mk5-user-updated"));
          }
        } else if (res.status === 401 || res.status === 403) {
          // Token expirado o inválido
          localStorage.removeItem("mk5_user");
          window.dispatchEvent(new Event("mk5-user-updated"));
        }
        // Para otros errores del servidor (500, 503…) conservar sesión en caché
      } catch {
        // Sin conexión: usar caché local
        try {
          const stored = localStorage.getItem("mk5_user");
          if (stored) setUser(JSON.parse(stored));
        } catch { /* ignorar */ }
      } finally {
        setSessionLoading(false);
      }
    }
    checkSession();
  }, []);

  async function logout() {
    try {
      await fetch(`${API_BASE}/api/auth/logout`, {
        method: "POST",
        credentials: "include",
      });
    } catch { /* ignorar errores de red */ }
    localStorage.removeItem("mk5_user");
    setUser(null);
    window.dispatchEvent(new Event("mk5-user-updated"));
  }

  function validate() {
    const errs = {};
    if (mode === "register" && !form.name.trim())
      errs.name = "El nombre es obligatorio.";
    if (!form.email.trim()) {
      errs.email = "El correo es obligatorio.";
    } else if (!isValidEmail(form.email)) {
      errs.email = "Ingresa un correo válido.";
    }
    if (!form.password) {
      errs.password = "La contraseña es obligatoria.";
    } else if (form.password.length < 8) {
      errs.password = "Mínimo 8 caracteres.";
    }
    return errs;
  }

  async function handleForgot(e) {
    e.preventDefault();
    if (!isValidEmail(forgotEmail)) { setError("Ingresa un correo válido."); return; }
    setError(""); setLoading(true);
    try {
      await fetch(`${API_BASE}/api/auth/forgot-password`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: forgotEmail }),
      });
      setSuccess("Si ese correo existe, recibirás un enlace en tu bandeja de entrada (revisa spam).");
    } catch {
      setError("Error de conexión. Intenta de nuevo.");
    } finally {
      setLoading(false);
    }
  }

  async function handleReset(e) {
    e.preventDefault();
    if (newPassword.length < 8) { setError("La contraseña debe tener al menos 8 caracteres."); return; }
    setError(""); setLoading(true);
    try {
      const res = await fetch(`${API_BASE}/api/auth/reset-password`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ token: resetToken, password: newPassword }),
      });
      const data = await res.json();
      if (!data.ok) {
        const msgs = {
          token_invalid: "Enlace inválido. Solicita uno nuevo.",
          token_expired: "El enlace expiró (válido 1 hora). Solicita uno nuevo.",
          token_already_used: "Este enlace ya fue usado. Solicita uno nuevo.",
        };
        setError(msgs[data.error] || "No se pudo cambiar la contraseña.");
      } else {
        setSuccess("¡Contraseña cambiada! Ya puedes iniciar sesión.");
        setTimeout(() => setMode("login"), 2000);
      }
    } catch {
      setError("Error de conexión. Intenta de nuevo.");
    } finally {
      setLoading(false);
    }
  }

  async function handleSubmit(e) {
    e.preventDefault();
    setError("");
    setSuccess("");

    const errs = validate();
    if (Object.keys(errs).length) { setFieldErrors(errs); return; }
    setFieldErrors({});
    setLoading(true);

    try {
      const endpoint = mode === "login" ? "/api/auth/login" : "/api/auth/register";
      const body = mode === "login"
        ? { email: form.email, password: form.password }
        : { name: form.name, email: form.email, phone: form.phone, password: form.password };

      const res = await fetch(`${API_BASE}${endpoint}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",   // necesario para recibir la cookie JWT
        body: JSON.stringify(body),
      });
      const data = await res.json();

      if (!res.ok || !data?.ok) {
        setError(friendlyError(data?.error, mode === "login" ? "Credenciales incorrectas." : "No se pudo crear la cuenta."));
        return;
      }

      const src = data.user || data;
      const userData = {
        id: src.id,
        name: src.name,
        email: src.email,
        is_admin: src.is_admin || false,
        session_token: src.session_token || null,
      };
      localStorage.setItem("mk5_user", JSON.stringify(userData));
      window.dispatchEvent(new Event("mk5-user-updated"));
      setUser(userData);
      setSuccess(mode === "login" ? "¡Bienvenido de vuelta!" : "¡Cuenta creada! Bienvenido.");
    } catch {
      setError("Error de conexión. Intenta de nuevo.");
    } finally {
      setLoading(false);
    }
  }

  if (sessionLoading) {
    return (
      <main className="static-page">
        <div className="static-hero cuenta-hero">
          <p style={{ color: "#999" }}>Verificando sesión…</p>
        </div>
      </main>
    );
  }

  // Usuario admin → panel completo
  if (user?.is_admin) {
    return (
      <main className="static-page" style={{ paddingBottom: 0 }}>
        <div className="static-hero cuenta-hero" style={{ paddingBottom: 12 }}>
          <div className="static-hero__badge">⚙️ Administrador</div>
          <h1 style={{ display: "flex", alignItems: "center", gap: 12 }}>
            {user.name || user.email}
            <button type="button" onClick={logout} className="cuenta-action-btn cuenta-action-btn--danger"
              style={{ fontSize: 12, padding: "6px 14px", marginTop: 0 }}>
              Cerrar sesión
            </button>
          </h1>
        </div>
        <AdminPanel />
      </main>
    );
  }

  // Usuario ya logueado (cliente normal)
  if (user) {
    return (
      <main className="static-page">
        <div className="static-hero cuenta-hero">
          <div className="static-hero__badge">👤 Mi Cuenta</div>
          <h1>Hola, {user.name || user.email} 👋</h1>
          <p>Gestiona tus pedidos y datos desde aquí.</p>
        </div>

        <div className="cuenta-grid">
          <div className="static-section cuenta-info">
            <h2>Mis datos</h2>
            <div className="info-row">
              <span className="info-row__icon">📧</span>
              <span>{user.email}</span>
            </div>
            {user.name && (
              <div className="info-row">
                <span className="info-row__icon">👤</span>
                <span>{user.name}</span>
              </div>
            )}
          </div>

          <div className="static-section cuenta-acciones">
            <h2>Acciones rápidas</h2>
            <div className="cuenta-btns">
              <Link to="/rastrear-pedido" className="cuenta-action-btn">
                📦 Rastrear mi pedido
              </Link>
              <Link to="/checkout" className="cuenta-action-btn cuenta-action-btn--outline">
                🛒 Ir al carrito
              </Link>
              <Link to="/catalogo" className="cuenta-action-btn cuenta-action-btn--outline">
                🔍 Ver catálogo
              </Link>
              <button type="button" onClick={logout} className="cuenta-action-btn cuenta-action-btn--danger">
                🚪 Cerrar sesión
              </button>
            </div>
          </div>
        </div>

        <div className="cta-band">
          <div>
            <h3>¿Tienes un folio de pedido?</h3>
            <p>Rastrear el estado de tu envío es muy fácil.</p>
          </div>
          <Link to="/rastrear-pedido" className="cta-band__btn">Rastrear pedido →</Link>
        </div>
      </main>
    );
  }

  // ── Pantalla: Olvidé mi contraseña ────────────────────
  if (mode === "forgot") {
    return (
      <main className="static-page">
        <div className="static-hero cuenta-hero">
          <div className="static-hero__badge">🔒 Recuperar cuenta</div>
          <h1>Olvidé mi contraseña</h1>
          <p>Te enviaremos un enlace para restablecer tu contraseña.</p>
        </div>
        <div className="cuenta-form-wrap">
          <form className="cuenta-form" onSubmit={handleForgot}>
            {error   && <div className="cuenta-alert cuenta-alert--error">{error}</div>}
            {success && <div className="cuenta-alert cuenta-alert--success">{success}</div>}
            {!success && (
              <>
                <label>
                  Correo electrónico *
                  <input type="email" value={forgotEmail} autoComplete="email" placeholder="correo@ejemplo.com"
                    onChange={e => setForgotEmail(e.target.value)} />
                </label>
                <button type="submit" className="cuenta-submit" disabled={loading}>
                  {loading ? "Enviando…" : "Enviar enlace de recuperación"}
                </button>
              </>
            )}
          </form>
          <p style={{ textAlign: "center", fontSize: 13, color: "#666", marginTop: 12 }}>
            <button type="button" className="cuenta-link" onClick={() => { setError(""); setSuccess(""); setMode("login"); }}>
              Volver al inicio de sesión
            </button>
          </p>
        </div>
      </main>
    );
  }

  // ── Pantalla: Restablecer contraseña (desde enlace email) ──
  if (mode === "reset") {
    return (
      <main className="static-page">
        <div className="static-hero cuenta-hero">
          <div className="static-hero__badge">🔑 Nueva contraseña</div>
          <h1>Restablecer contraseña</h1>
          <p>Elige una nueva contraseña para tu cuenta.</p>
        </div>
        <div className="cuenta-form-wrap">
          <form className="cuenta-form" onSubmit={handleReset}>
            {error   && <div className="cuenta-alert cuenta-alert--error">{error}</div>}
            {success && <div className="cuenta-alert cuenta-alert--success">{success}</div>}
            {!success && (
              <>
                <label>
                  Nueva contraseña *
                  <div className="pass-wrap">
                    <input
                      type={showPass ? "text" : "password"}
                      value={newPassword}
                      autoComplete="new-password"
                      placeholder="Mínimo 8 caracteres"
                      onChange={e => setNewPassword(e.target.value)}
                    />
                    <button type="button" className="pass-toggle" onClick={() => setShowPass(v => !v)}>
                      {showPass ? "🙈" : "👁️"}
                    </button>
                  </div>
                </label>
                <button type="submit" className="cuenta-submit" disabled={loading}>
                  {loading ? "Guardando…" : "Guardar nueva contraseña"}
                </button>
              </>
            )}
          </form>
          <p style={{ textAlign: "center", fontSize: 13, color: "#666", marginTop: 12 }}>
            <button type="button" className="cuenta-link" onClick={() => { setError(""); setSuccess(""); setMode("login"); }}>
              Volver al inicio de sesión
            </button>
          </p>
        </div>
      </main>
    );
  }

  return (
    <main className="static-page">
      <div className="static-hero cuenta-hero">
        <div className="static-hero__badge">🔑 Acceso</div>
        <h1>{mode === "login" ? "Iniciar sesión" : "Crear cuenta"}</h1>
        <p>
          {mode === "login"
            ? "Accede para rastrear tus pedidos y gestionar tu cuenta."
            : "Regístrate para rastrear pedidos y tener acceso a beneficios."}
        </p>
      </div>

      <div className="cuenta-form-wrap">
        <div className="cuenta-tabs">
          <button
            type="button"
            className={`cuenta-tab ${mode === "login" ? "is-active" : ""}`}
            onClick={() => { setMode("login"); setError(""); setFieldErrors({}); }}
          >
            Iniciar sesión
          </button>
          <button
            type="button"
            className={`cuenta-tab ${mode === "register" ? "is-active" : ""}`}
            onClick={() => { setMode("register"); setError(""); setFieldErrors({}); }}
          >
            Crear cuenta
          </button>
        </div>

        <form className="cuenta-form" onSubmit={handleSubmit} autoComplete="on">
          {error   && <div className="cuenta-alert cuenta-alert--error">{error}</div>}
          {success && <div className="cuenta-alert cuenta-alert--success">{success}</div>}

          {mode === "register" && (
            <label className={fieldErrors.name ? "has-error" : ""}>
              Nombre completo *
              <input type="text" value={form.name} autoComplete="name" maxLength={120}
                onChange={(e) => setForm((p) => ({ ...p, name: e.target.value }))} />
              {fieldErrors.name && <span className="field-error">{fieldErrors.name}</span>}
            </label>
          )}

          <label className={fieldErrors.email ? "has-error" : ""}>
            Correo electrónico *
            <input type="email" value={form.email} autoComplete="email"
              placeholder="correo@ejemplo.com"
              onChange={(e) => setForm((p) => ({ ...p, email: e.target.value }))} />
            {fieldErrors.email && <span className="field-error">{fieldErrors.email}</span>}
          </label>

          {mode === "register" && (
            <label>
              Teléfono (opcional)
              <input type="tel" value={form.phone} autoComplete="tel"
                maxLength={10} placeholder="5512345678"
                onChange={(e) => setForm((p) => ({ ...p, phone: e.target.value.replace(/\D/g,"") }))} />
            </label>
          )}

          <label className={fieldErrors.password ? "has-error" : ""}>
            Contraseña *
            <div className="pass-wrap">
              <input
                type={showPass ? "text" : "password"}
                value={form.password}
                autoComplete={mode === "login" ? "current-password" : "new-password"}
                onChange={(e) => setForm((p) => ({ ...p, password: e.target.value }))}
              />
              <button type="button" className="pass-toggle" onClick={() => setShowPass((v) => !v)}>
                {showPass ? "🙈" : "👁️"}
              </button>
            </div>
            {fieldErrors.password && <span className="field-error">{fieldErrors.password}</span>}
            {mode === "register" && (
              <small style={{ color: "#999", fontSize: 12 }}>Mínimo 8 caracteres</small>
            )}
          </label>

          <button type="submit" className="cuenta-submit" disabled={loading}>
            {loading
              ? "Cargando..."
              : mode === "login" ? "Entrar" : "Crear cuenta"}
          </button>
        </form>

        {mode === "login" && (
          <p style={{ textAlign: "center", fontSize: 13, marginTop: 4 }}>
            <button type="button" className="cuenta-link" onClick={() => { setError(""); setSuccess(""); setMode("forgot"); }}>
              ¿Olvidaste tu contraseña?
            </button>
          </p>
        )}

        <p style={{ textAlign: "center", fontSize: 13, color: "#666", marginTop: 12 }}>
          {mode === "login"
            ? <>¿No tienes cuenta? <button type="button" className="cuenta-link" onClick={() => setMode("register")}>Regístrate gratis</button></>
            : <>¿Ya tienes cuenta? <button type="button" className="cuenta-link" onClick={() => setMode("login")}>Inicia sesión</button></>}
        </p>

        <div className="cuenta-seguridad">
          🔒 Tu contraseña se almacena de forma cifrada. Nunca la compartimos.
        </div>
      </div>
    </main>
  );
}
