import { useState } from "react";
import {
  ArrowDown,
  ArrowRight,
  ArrowUpRight,
  CalendarDays,
  Globe2,
  GraduationCap,
  Search,
} from "lucide-react";

import { localDate } from "../lib/dates";

const statusLabels = {
  open: "Abierta",
  upcoming: "Próxima",
  closed: "Cerrada",
  unverified: "Por confirmar",
};

function Status({ opportunity }) {
  return (
    <span className={`call-status ${opportunity.status}`}>
      {statusLabels[opportunity.status]}
    </span>
  );
}

export function OpportunityExplorer({
  opportunities,
  institutions,
  onSelect,
  onHistory,
}) {
  const [status, setStatus] = useState("all");
  const [institution, setInstitution] = useState("all");
  const [type, setType] = useState("all");
  const [query, setQuery] = useState("");
  const open = opportunities.filter((item) => item.status === "open");
  const visible = [...opportunities]
    .filter(
      (item) =>
        (status === "all" || status === item.status) &&
        (institution === "all" || item.institution === institution) &&
        (type === "all" || item.type === type) &&
        `${item.nombre} ${item.provider}`
          .toLowerCase()
          .includes(query.trim().toLowerCase()),
    )
    .sort(
      (a, b) =>
        Number(b.status === "open") - Number(a.status === "open") ||
        (Date.parse(a.closesAt) || Infinity) -
          (Date.parse(b.closesAt) || Infinity),
    );

  return (
    <>
      <section className="opportunity-hero">
        <div>
          <span className="call-kicker">
            <Globe2 size={15} /> OPORTUNIDADES ACADÉMICAS
          </span>
          <h1>
            Tu próximo destino
            <br /> empieza aquí.
          </h1>
          <p>
            Encuentra becas y programas de movilidad. Revisa qué requisitos
            cumples y qué te falta para postular.
          </p>
          <div className="hero-actions">
            <a
              className="btn call-primary"
              href="#convocatorias"
              onClick={() => {
                setStatus("open");
                setInstitution("all");
                setType("all");
                setQuery("");
              }}
            >
              Ver convocatorias activas <ArrowDown size={16} />
            </a>
            <button className="btn call-secondary" onClick={onHistory}>
              Mi historial <ArrowRight size={16} />
            </button>
          </div>
        </div>
        <div className="opportunity-visual">
          <svg viewBox="0 0 380 280" aria-hidden="true">
            <g fill="none" stroke="currentColor">
              <circle cx="190" cy="140" r="120" />
              <ellipse cx="190" cy="140" rx="76" ry="120" />
              <ellipse cx="190" cy="140" rx="30" ry="120" />
              <ellipse cx="190" cy="140" rx="120" ry="61" />
              <path d="M53 140h274M85 82h210M85 198h210M190 12v256" />
            </g>
            <g fill="#315df4">
              <circle cx="113" cy="69" r="5" />
              <circle cx="281" cy="112" r="4" />
              <circle cx="140" cy="211" r="5" />
              <circle cx="246" cy="227" r="4" />
            </g>
          </svg>
          <span className="visual-orbit" aria-hidden="true">
            <Globe2 size={30} />
          </span>
          {open.slice(0, 1).map((item) => (
            <button
              key={item.id}
              className="visual-card"
              onClick={() => onSelect(item)}
            >
              <GraduationCap size={19} />
              <span>
                {item.nombre}
                <small>Convocatoria abierta</small>
              </span>
              <ArrowUpRight size={14} />
            </button>
          ))}
          <div className="visual-count">
            <strong>{open.length}</strong>{" "}
            {open.length === 1
              ? "convocatoria abierta"
              : "convocatorias abiertas"}
          </div>
        </div>
      </section>
      <section
        className="institution-strip"
        aria-label="Universidades del catálogo"
      >
        <span>EXPLORA POR UNIVERSIDAD</span>
        {institutions.map((item) => (
          <a
            key={item.id}
            href="#convocatorias"
            onClick={() => {
              setInstitution(item.id);
              setStatus("all");
            }}
          >
            <GraduationCap size={18} />
            {item.shortName}
          </a>
        ))}
      </section>
      <section id="convocatorias" className="call-catalog">
        <div className="catalog-heading">
          <div>
            <span className="call-kicker">CATÁLOGO</span>
            <h2>Convocatorias y becas</h2>
            <p>Ordenadas por vigencia y fecha de cierre.</p>
          </div>
          <label className="search-field">
            <Search size={16} />
            <input
              aria-label="Buscar convocatorias"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Buscar convocatorias…"
            />
          </label>
        </div>
        <div className="call-filters">
          <label>
            Estado
            <select value={status} onChange={(e) => setStatus(e.target.value)}>
              <option value="all">Todos los estados</option>
              {Object.entries(statusLabels).map(([id, name]) => (
                <option key={id} value={id}>
                  {name}
                </option>
              ))}
            </select>
          </label>
          <label>
            Universidad
            <select
              value={institution}
              onChange={(e) => setInstitution(e.target.value)}
            >
              <option value="all">Todas</option>
              {institutions.map((item) => (
                <option key={item.id} value={item.id}>
                  {item.shortName}
                </option>
              ))}
              <option value="externa">Oportunidades externas</option>
            </select>
          </label>
          <label>
            Tipo
            <select value={type} onChange={(e) => setType(e.target.value)}>
              <option value="all">Todos</option>
              {[...new Set(opportunities.map((item) => item.type))].map(
                (item) => (
                  <option key={item}>{item}</option>
                ),
              )}
            </select>
          </label>
        </div>
        {visible.length ? (
          <div className="call-grid">
            {visible.map((item) => (
              <article className="call-card" key={item.id}>
                <div className="call-card-top">
                  <span className="call-icon">
                    <GraduationCap size={21} />
                  </span>
                  <Status opportunity={item} />
                </div>
                <span className="call-kicker">
                  {item.institution === "externa"
                    ? "OPORTUNIDAD EXTERNA"
                    : item.institution.toUpperCase()}{" "}
                  · {item.type}
                </span>
                <h3>{item.nombre}</h3>
                <p>{item.descripcion}</p>
                <span className="call-date">
                  <CalendarDays size={15} />
                  {item.closesAt
                    ? `Cierre ${localDate(item.closesAt)}`
                    : "Fechas por confirmar"}
                </span>
                <button
                  className="call-card-link"
                  onClick={() => onSelect(item)}
                >
                  Ver detalles <ArrowUpRight size={17} />
                </button>
              </article>
            ))}
          </div>
        ) : (
          <div className="empty-state">
            <Search size={26} />
            <h3>No hay convocatorias para estos filtros</h3>
            <button
              className="btn call-secondary"
              onClick={() => {
                setStatus("all");
                setInstitution("all");
                setType("all");
                setQuery("");
              }}
            >
              Ver todas
            </button>
          </div>
        )}
      </section>
    </>
  );
}

export function OpportunityDetail({
  opportunity,
  initialAnswers,
  onSubmit,
  loading,
}) {
  const [answers, setAnswers] = useState(initialAnswers || {});
  return (
    <>
      <div className="page-title">
        <Status opportunity={opportunity} />
        <h1>{opportunity.nombre}</h1>
        <p>{opportunity.descripcion}</p>
      </div>
      <div className="evaluation-layout call-detail">
        <section className="form-card">
          <h2>
            {opportunity.status === "unverified"
              ? "Requisitos de referencia"
              : "Requisitos de la convocatoria"}
          </h2>
          {opportunity.criteria.length ? (
            <form
              onSubmit={(event) => {
                event.preventDefault();
                onSubmit({
                  convocatoriaId: opportunity.id,
                  responses: Object.fromEntries(
                    Object.entries(answers).filter(
                      ([, value]) => value !== undefined,
                    ),
                  ),
                });
              }}
            >
              <p className="muted">
                Responde según tu situación actual. Puedes dejar en «Por
                confirmar» los datos que aún no tengas.
              </p>
              {opportunity.criteria.map((criterion) => (
                <label className="criterion-field" key={criterion.id}>
                  <strong>{criterion.question}</strong>
                  <span>{criterion.description}</span>
                  {typeof criterion.expected === "number" ? (
                    <input
                      type="number"
                      min="0"
                      max="100"
                      step="any"
                      placeholder="Porcentaje de 0 a 100"
                      value={answers[criterion.id] ?? ""}
                      onChange={(e) =>
                        setAnswers({
                          ...answers,
                          [criterion.id]:
                            e.target.value === ""
                              ? undefined
                              : e.target.valueAsNumber,
                        })
                      }
                    />
                  ) : (
                    <select
                      value={String(answers[criterion.id] ?? "")}
                      onChange={(e) =>
                        setAnswers({
                          ...answers,
                          [criterion.id]:
                            e.target.value === ""
                              ? undefined
                              : e.target.value === "true",
                        })
                      }
                    >
                      <option value="">Por confirmar</option>
                      <option value="true">Sí</option>
                      <option value="false">No</option>
                    </select>
                  )}
                </label>
              ))}
              <p className="info-note">{opportunity.manualReview}</p>
              <button className="btn call-primary" disabled={loading}>
                {loading ? "Evaluando…" : "Ver si cumplo"}{" "}
                <ArrowRight size={16} />
              </button>
            </form>
          ) : (
            <p className="muted">
              Consulta la fuente institucional para confirmar las fechas y los
              requisitos de la próxima convocatoria.
            </p>
          )}
        </section>
        <aside className="panel call-facts">
          <h3>Datos de la oportunidad</h3>
          <p>{opportunity.provider}</p>
          <dl>
            <dt>Quién puede postular</dt>
            <dd>{opportunity.audience}</dd>
            {opportunity.benefit && (
              <>
                <dt>Qué cubre</dt>
                <dd>{opportunity.benefit}</dd>
              </>
            )}
            <dt>Cierre</dt>
            <dd>
              {opportunity.closesAt
                ? new Intl.DateTimeFormat("es-EC", {
                    dateStyle: "medium",
                    timeStyle: "short",
                    timeZone: "America/Guayaquil",
                  }).format(new Date(opportunity.closesAt)) +
                  " (hora de Ecuador continental)"
                : "Por confirmar"}
            </dd>
            <dt>Fuente revisada</dt>
            <dd>{localDate(opportunity.verifiedOn + "T12:00:00Z")}</dd>
          </dl>
          {opportunity.documents?.length > 0 && (
            <>
              <h4>Documentos para postular</h4>
              <ul>
                {opportunity.documents.map((doc) => (
                  <li key={doc}>{doc}</li>
                ))}
              </ul>
            </>
          )}
          <a
            className="btn call-secondary"
            href={opportunity.sourceUrl}
            target="_blank"
            rel="noreferrer"
          >
            Consultar fuente oficial <ArrowUpRight size={15} />
          </a>
          {opportunity.rulesUrl && (
            <a
              className="text-link call-rules-link"
              href={opportunity.rulesUrl}
              target="_blank"
              rel="noreferrer"
            >
              Ver reglamento de movilidad <ArrowUpRight size={15} />
            </a>
          )}
        </aside>
      </div>
    </>
  );
}
