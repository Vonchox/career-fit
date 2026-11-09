import { useState } from "react";
import {
  Check,
  Circle,
  ArrowUpRight,
  Sparkles,
  RotateCcw,
  Printer,
  FileCheck2,
} from "lucide-react";
import { isDemo, readStored } from "../lib/api";
export default function EvaluationResult({
  data,
  onAsk,
  onReset,
  storageScope,
  guest,
  onSignIn,
  onSave,
  saving,
  previousEvaluation,
  onReevaluate,
}) {
  const { requisitos, tipoMovilidad } = data;
  const eligibility = data.kind === "eligibility";
  const resultTitle = {
    viable: "Cumples los criterios revisados",
    no_viable: "Te falta cumplir algún requisito",
    incompleto: "Falta información para evaluar",
  };
  const complete = requisitos.filter((r) => r.cumplido).length;
  const key = `careerfit-docs-${data.guest ? "guest" : storageScope}-${data.evaluacionId}`;
  const [checked, setChecked] = useState(() => readStored(key, []));
  const docs = [
    ...new Set(
      eligibility
        ? tipoMovilidad.documents || []
        : requisitos.map((r) => r.documentoRespaldo).filter(Boolean),
    ),
  ];
  function toggle(doc) {
    const next = checked.includes(doc)
      ? checked.filter((d) => d !== doc)
      : [...checked, doc];
    setChecked(next);
    localStorage.setItem(key, JSON.stringify(next));
  }
  return (
    <div className="result-page">
      <div className={`result-hero ${data.esViable ? "positive" : ""}`}>
        <span className="eyebrow">
          {eligibility
            ? "EVALUACIÓN PRELIMINAR"
            : data.tipoMovilidad.preparationOnly
              ? "TU PREPARACIÓN DOCUMENTAL"
              : "TU RESULTADO ORIENTATIVO"}
        </span>
        <h2>
          {eligibility
            ? resultTitle[data.resultado]
            : data.esViable
              ? "Tu próximo paso está más cerca."
              : "Cada paso cuenta."}
        </h2>
        <p>
          {eligibility
            ? tipoMovilidad.manualReview
            : data.resultado === "incompleto"
              ? "Falta información para determinar tu elegibilidad."
              : data.esViable
                ? "Declaraste preparados los respaldos de esta guía. Confirma la lista completa y tu elegibilidad con la universidad."
                : "Ya sabes por dónde avanzar. Revisa los requisitos pendientes y prepara tu camino."}
        </p>
        {!eligibility && (
          <div className="result-score">
            <strong>
              {complete}
              <span>/{requisitos.length}</span>
            </strong>
            <div>
              {data.tipoMovilidad.preparationOnly
                ? "respaldos preparados"
                : "requisitos cumplidos"}
              <div className="progress-track">
                <span
                  style={{
                    width: `${requisitos.length ? (complete / requisitos.length) * 100 : 0}%`,
                  }}
                />
              </div>
            </div>
          </div>
        )}
      </div>
      {eligibility && (
        <div className="panel eligibility-history">
          <p>
            Evaluación del{" "}
            {new Intl.DateTimeFormat("es-EC", {
              dateStyle: "medium",
              timeStyle: "short",
              timeZone: "America/Guayaquil",
            }).format(new Date(data.fecha))}
          </p>
          <p>Se conservan los criterios que se aplicaron en esa fecha.</p>
          {previousEvaluation && (
            <p>
              Resultado anterior para esta oportunidad:{" "}
              <strong>{resultTitle[previousEvaluation.resultado]}</strong>.
            </p>
          )}
          {onReevaluate && (
            <button className="btn call-primary" onClick={onReevaluate}>
              <RotateCcw size={15} /> Volver a evaluar con los criterios
              actuales
            </button>
          )}
        </div>
      )}
      {data.guest && (
        <div className="guest-notice">
          <span>
            {isDemo
              ? "Tu resultado se guarda en este navegador. Puedes volver a él desde Mi historial."
              : guest
                ? "Tu resultado está en este navegador. Iniciar sesión es opcional."
                : "Puedes guardar esta revisión en tu cuenta."}
          </span>
          {!isDemo && (
            <button
              className="text-link"
              disabled={saving}
              onClick={guest ? onSignIn : onSave}
            >
              {guest
                ? "Iniciar sesión para guardar"
                : saving
                  ? "Guardando…"
                  : eligibility
                    ? "Reevaluar y guardar"
                    : "Guardar esta revisión"}
            </button>
          )}
        </div>
      )}
      <div className="result-columns">
        <section className="panel">
          <div className="panel-heading">
            <h3>Tu perfil, requisito por requisito</h3>
            <FileCheck2 size={19} />
          </div>
          <p className="muted">{tipoMovilidad.nombre}</p>
          <div className="requirement-list">
            {requisitos.map((req) => (
              <article key={req.id} className="requirement">
                <span
                  className={`requirement-status ${req.cumplido ? "done" : ""}`}
                >
                  {req.cumplido ? <Check size={15} /> : <Circle size={14} />}
                </span>
                <div>
                  <h4>{req.nombre}</h4>
                  <p>{req.descripcion}</p>
                  <span className={`badge ${req.cumplido ? "green" : "amber"}`}>
                    {req.evaluable === false
                      ? "Por confirmar"
                      : req.cumplido
                        ? "Cumplido"
                        : "Pendiente"}
                  </span>
                  {eligibility && (
                    <p className="criterion-answer">
                      Tu respuesta:{" "}
                      {req.evaluable === false
                        ? "Por confirmar"
                        : typeof req.valorEstudiante === "number"
                          ? `${req.valorEstudiante} %`
                          : req.valorEstudiante
                            ? "Sí"
                            : "No"}
                    </p>
                  )}
                  {eligibility &&
                    previousEvaluation?.requisitos.some(
                      (previous) =>
                        previous.id === req.id &&
                        previous.evaluable &&
                        !previous.cumplido,
                    ) &&
                    req.cumplido && (
                      <small className="rule-reference">
                        Ahora cumples este criterio
                      </small>
                    )}
                  {req.articuloReglamento && (
                    <small className="rule-reference">
                      {req.articuloReglamento}
                    </small>
                  )}
                </div>
              </article>
            ))}
          </div>
        </section>
        <aside className="result-aside">
          <section className="panel">
            <span className="eyebrow">TU SIGUIENTE PASO</span>
            <h3>Prepara tus documentos.</h3>
            <p className="muted">
              Lista personal en este dispositivo. Marcar un documento no lo
              envía ni lo valida.
            </p>
            <div className="document-list">
              {docs.map((doc) => (
                <label key={doc}>
                  <input
                    type="checkbox"
                    checked={checked.includes(doc)}
                    onChange={() => toggle(doc)}
                  />
                  <span>{doc}</span>
                </label>
              ))}
            </div>
            {tipoMovilidad.sourceUrl ? (
              <a
                className="text-link"
                href={tipoMovilidad.sourceUrl}
                target="_blank"
                rel="noreferrer"
              >
                Consultar fuente de {tipoMovilidad.institutionName}{" "}
                <ArrowUpRight size={16} />
              </a>
            ) : (
              <p className="muted">
                Registro histórico de un catálogo anterior. Revisa la fuente
                original de esa evaluación.
              </p>
            )}
          </section>
          <section className="panel assistant-callout">
            <Sparkles size={22} />
            <h3>¿Algo no queda claro?</h3>
            <p>Conversemos sobre tus requisitos y próximos pasos.</p>
            <button className="btn btn-white" onClick={onAsk}>
              Preguntar al asistente <ArrowUpRight size={16} />
            </button>
          </section>
        </aside>
      </div>
      <div className="result-actions">
        <button className="btn btn-white" onClick={onReset}>
          <RotateCcw size={15} /> Nueva evaluación
        </button>
        <button className="btn btn-white" onClick={() => window.print()}>
          <Printer size={15} /> Imprimir resultado
        </button>
      </div>
      <p className="legal-note">
        {data.demo ? "Datos y criterios de ejemplo. " : ""}Career-Fit es un
        proyecto independiente. Este resultado no garantiza una beca, plaza o
        aprobación institucional.
      </p>
    </div>
  );
}
