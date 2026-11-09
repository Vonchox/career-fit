import { useState } from "react";
import { Check, ArrowLeft, ArrowRight, LoaderCircle } from "lucide-react";
export default function PreparationForm({ program, onSubmit, loading, guest }) {
  const [step, setStep] = useState(0),
    [answers, setAnswers] = useState({});
  const requirements = program.requisitos || [];
  function submit(e) {
    e.preventDefault();
    if (step === 0) {
      setStep(1);
      return;
    }
    onSubmit(
      Object.fromEntries(
        requirements.map((r) => [
          r.condicionCampo,
          answers[r.condicionCampo] === true,
        ]),
      ),
    );
  }
  return (
    <div className="form-card">
      <div className="form-progress" aria-label={`Paso ${step + 1} de 2`}>
        {["Tus documentos", "Tu revisión"].map((name, i) => (
          <div key={name} className={i <= step ? "current" : ""}>
            <span>{i < step ? <Check size={13} /> : i + 1}</span>
            <small>{name}</small>
          </div>
        ))}
      </div>
      <form onSubmit={submit}>
        <span className="eyebrow">SIN NOMBRES, PROMEDIOS NI ARCHIVOS</span>
        <h3>
          {step === 0
            ? "¿Qué tienes preparado?"
            : "Revisemos tu punto de partida."}
        </h3>
        <p className="muted">
          Esta revisión organiza documentos. No determina tu elegibilidad ni
          confirma convocatorias abiertas.
        </p>
        {step === 0 ? (
          requirements.map((rule) => (
            <label className="check-option" key={rule.id}>
              <input
                type="checkbox"
                checked={answers[rule.condicionCampo] === true}
                onChange={(e) =>
                  setAnswers({
                    ...answers,
                    [rule.condicionCampo]: e.target.checked,
                  })
                }
              />
              <span>
                <strong>{rule.nombre}</strong>
                <small>{rule.descripcion}</small>
              </span>
            </label>
          ))
        ) : (
          <dl className="review-list">
            {requirements.map((rule) => (
              <div key={rule.id}>
                <dt>{rule.nombre}</dt>
                <dd>
                  {answers[rule.condicionCampo] ? "Preparado" : "Pendiente"}
                </dd>
              </div>
            ))}
          </dl>
        )}
        <div className="info-note">
          {guest
            ? "Sin cuenta, tu resultado se conserva solo en este navegador. No necesitas registrarte para continuar."
            : "Tu revisión se guardará en tu historial."}{" "}
          Confirma siempre la lista completa y los formatos vigentes con tu
          universidad.
        </div>
        <div className="form-actions">
          {step > 0 && (
            <button
              type="button"
              className="btn btn-white"
              disabled={loading}
              onClick={() => setStep(0)}
            >
              <ArrowLeft size={15} /> Atrás
            </button>
          )}
          <button
            className="btn btn-dark"
            disabled={loading || !requirements.length}
          >
            {loading ? (
              <LoaderCircle className="spin" size={16} />
            ) : (
              <ArrowRight size={16} />
            )}{" "}
            {loading
              ? "Revisando…"
              : step === 0
                ? "Continuar"
                : "Ver mi preparación"}
          </button>
        </div>
      </form>
    </div>
  );
}
