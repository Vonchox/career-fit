import { useState } from "react";
import { ArrowLeft, ArrowRight, LoaderCircle, Eye, EyeOff } from "lucide-react";
import Brand from "./Brand";
import FlowLines from "./FlowLines";
import { request } from "../lib/api";
import GoogleSignIn from "./GoogleSignIn";
export default function Auth({
  register,
  onNavigate,
  onBack,
  onLogin,
  account,
  session,
  onLogout,
}) {
  const [form, setForm] = useState({ nombre: "", email: "", password: "" });
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [visible, setVisible] = useState(false);
  async function submit(e) {
    e.preventDefault();
    setError("");
    setLoading(true);
    try {
      const data = await request(`/auth/${register ? "register" : "login"}`, {
        method: "POST",
        body: JSON.stringify(form),
      });
      onLogin(data.token, data.user);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }
  return (
    <main className="auth-page" id="main-content">
      <section className="auth-story">
        <Brand onClick={onBack} />
        <FlowLines />
        <div>
          <span className="eyebrow">TU PRÓXIMO CAPÍTULO</span>
          <h1>
            Las grandes
            <br />
            experiencias
            <br />
            <em>empiezan contigo.</em>
          </h1>
          <p>
            Un espacio para descubrir posibilidades y preparar tu siguiente paso
            académico.
          </p>
        </div>
        <small>Career-Fit · Movilidad académica</small>
      </section>
      <section className="auth-main">
        <button className="text-button back-link" onClick={onBack}>
          <ArrowLeft size={16} />{" "}
          {account ? "Volver al panel" : "Continuar sin registro"}
        </button>
        <div className="auth-form">
          <span className="eyebrow">BIENVENIDO A CAREER-FIT</span>
          <h2>
            {account
              ? "Tu cuenta, a tu manera."
              : register
                ? "Guarda tu recorrido."
                : "Vuelve cuando quieras."}
          </h2>
          <p>
            {account
              ? session?.user?.email
              : register
                ? "Crea tu cuenta y guarda el progreso de tus evaluaciones."
                : "Iniciar sesión es opcional. Úsalo para guardar tu historial entre dispositivos."}
          </p>
          {account && session?.user?.googleLinked ? (
            <div className="info-note">
              Tu cuenta ya está conectada con Google.
            </div>
          ) : (
            <GoogleSignIn
              onLogin={onLogin}
              linkToken={account ? session?.token : undefined}
            />
          )}
          {!account && (
            <>
              <div className="auth-divider">o usa tu correo</div>
              <form onSubmit={submit}>
                {register && (
                  <label>
                    Nombre completo
                    <input
                      autoComplete="name"
                      value={form.nombre}
                      onChange={(e) =>
                        setForm({ ...form, nombre: e.target.value })
                      }
                      required
                      maxLength={100}
                      placeholder="¿Cómo te llamas?"
                    />
                  </label>
                )}
                <label>
                  Correo electrónico
                  <input
                    type="email"
                    autoComplete="email"
                    value={form.email}
                    onChange={(e) =>
                      setForm({ ...form, email: e.target.value })
                    }
                    required
                    maxLength={254}
                    placeholder="tu@correo.com"
                  />
                </label>
                <label>
                  Contraseña
                  <span className="password-field">
                    <input
                      type={visible ? "text" : "password"}
                      autoComplete={
                        register ? "new-password" : "current-password"
                      }
                      value={form.password}
                      onChange={(e) =>
                        setForm({ ...form, password: e.target.value })
                      }
                      required
                      minLength={register ? 6 : 1}
                      maxLength={128}
                      placeholder={
                        register ? "Al menos 6 caracteres" : "Tu contraseña"
                      }
                    />
                    <button
                      type="button"
                      className="icon-button"
                      aria-label={
                        visible ? "Ocultar contraseña" : "Mostrar contraseña"
                      }
                      onClick={() => setVisible(!visible)}
                    >
                      {visible ? <EyeOff size={18} /> : <Eye size={18} />}
                    </button>
                  </span>
                </label>
                {error && (
                  <div className="alert error" role="alert">
                    {error}
                  </div>
                )}
                <button className="btn btn-dark" disabled={loading}>
                  {loading ? (
                    <LoaderCircle className="spin" size={17} />
                  ) : (
                    <ArrowRight size={17} />
                  )}{" "}
                  {loading
                    ? "Un momento…"
                    : register
                      ? "Crear mi cuenta"
                      : "Entrar a mi espacio"}
                </button>
              </form>
              <p className="auth-switch">
                {register ? "¿Ya tienes una cuenta?" : "¿Es tu primera vez?"}{" "}
                <button className="text-link" onClick={onNavigate}>
                  {register ? "Inicia sesión" : "Crea tu cuenta"}
                </button>
              </p>
            </>
          )}
          {account && (
            <button className="btn btn-white" onClick={onLogout}>
              Cerrar sesión y seguir como visitante
            </button>
          )}
          <button className="text-link continue-guest" onClick={onBack}>
            {account ? "Volver al panel" : "Prefiero seguir sin cuenta"}{" "}
            <ArrowRight size={15} />
          </button>
          <small className="muted">
            Herramienta informativa independiente. La elegibilidad final
            corresponde a la institución.
          </small>
        </div>
      </section>
    </main>
  );
}
