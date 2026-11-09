import { useEffect, useRef, useState } from "react";
import { request } from "../lib/api";
let scriptPromise;
function loadGoogle() {
  if (window.google?.accounts?.id) return Promise.resolve();
  if (!scriptPromise)
    scriptPromise = new Promise((resolve, reject) => {
      const script = document.createElement("script");
      script.src = "https://accounts.google.com/gsi/client";
      script.async = true;
      script.onload = resolve;
      script.onerror = () => {
        script.remove();
        scriptPromise = null;
        reject(new Error("No se pudo cargar Google."));
      };
      document.head.append(script);
    });
  return scriptPromise;
}
export default function GoogleSignIn({ onLogin, linkToken }) {
  const container = useRef(null),
    [status, setStatus] = useState("loading"),
    [error, setError] = useState(""),
    [attempt, setAttempt] = useState(0);
  useEffect(() => {
    let cancelled = false;
    setStatus("loading");
    setError("");
    (async () => {
      const config = await request("/auth/config");
      if (cancelled) return;
      if (!config.googleClientId) {
        setStatus("unavailable");
        return;
      }
      const [challenge] = await Promise.all([
        request("/auth/google/challenge"),
        loadGoogle(),
      ]);
      if (cancelled) return;
      window.google.accounts.id.initialize({
        client_id: config.googleClientId,
        nonce: challenge.nonce,
        auto_select: false,
        ux_mode: "popup",
        callback: async (response) => {
          if (cancelled) return;
          setStatus("verifying");
          setError("");
          try {
            const result = await request(
              linkToken ? "/auth/google/link" : "/auth/google",
              {
                token: linkToken,
                method: "POST",
                body: JSON.stringify({
                  credential: response.credential,
                  challenge: challenge.challenge,
                }),
              },
            );
            if (!cancelled) onLogin(result.token, result.user);
          } catch (err) {
            if (!cancelled) {
              setError(err.message);
              setStatus("retry");
            }
          }
        },
      });
      window.google.accounts.id.renderButton(container.current, {
        type: "standard",
        theme: "outline",
        size: "large",
        text: linkToken ? "continue_with" : "signin_with",
        shape: "rectangular",
        width: Math.min(350, container.current.clientWidth || 300),
        locale: "es",
      });
      setStatus("ready");
    })().catch((err) => {
      if (!cancelled) {
        setError(err.message);
        setStatus("retry");
      }
    });
    return () => {
      cancelled = true;
      container.current?.replaceChildren();
    };
  }, [attempt, linkToken, onLogin]);
  return (
    <div className="google-signin">
      <div ref={container} hidden={status !== "ready"} />
      {status === "loading" && (
        <p className="muted" role="status">
          Preparando opciones de acceso…
        </p>
      )}
      {status === "verifying" && (
        <p className="muted" role="status">
          Verificando tu cuenta…
        </p>
      )}
      {status === "unavailable" && (
        <>
          <button className="btn btn-white google-unavailable" disabled>
            Continuar con Google
          </button>
          <p className="muted">
            Google aún no está disponible. Puedes usar tu correo o continuar sin
            cuenta.
          </p>
        </>
      )}
      {error && (
        <div className="alert error" role="alert">
          {error}
        </div>
      )}
      {status === "retry" && (
        <button className="text-link" onClick={() => setAttempt(attempt + 1)}>
          Reintentar acceso con Google
        </button>
      )}
    </div>
  );
}
