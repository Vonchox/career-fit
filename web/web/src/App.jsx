import { useEffect, useState } from "react";
import {
  Globe2,
  History,
  BookOpen,
  Sparkles,
  ArrowUpRight,
  ArrowLeft,
  Check,
  FileText,
  LoaderCircle,
  RefreshCw,
} from "lucide-react";

import Auth from "./components/Auth";
import Brand from "./components/Brand";
import ProgramCard from "./components/ProgramCard";
import EligibilityForm from "./components/PreparationForm";
import EvaluationResult from "./components/EvaluationResult";
import Chatbot from "./components/Chatbot";
import {
  OpportunityExplorer,
  OpportunityDetail,
} from "./components/Opportunities";
import { localDate } from "./lib/dates";
import { isDemo, request, readStored } from "./lib/api";
import catalog from "../../../shared/catalog.json";
const nav = [
  { id: "programs", label: "Oportunidades", icon: Globe2 },
  { id: "history", label: "Mi historial", icon: History },
  { id: "resources", label: "Recursos", icon: BookOpen },
];
export default function App() {
  const [session, setSession] = useState(() =>
    isDemo ? null : readStored("careerfit-session", null),
  );
  const [page, setPage] = useState("app");
  const [institution, setInstitution] = useState(() =>
    readStored("careerfit-institution", "uce"),
  );
  const [section, setSection] = useState("programs");
  const [opportunities, setOpportunities] = useState([]);
  const [initialAnswers, setInitialAnswers] = useState(null);
  const [programs, setPrograms] = useState([]),
    [history, setHistory] = useState([]);
  const [selected, setSelected] = useState(null),
    [evaluation, setEvaluation] = useState(null);
  const [loading, setLoading] = useState(false),
    [evaluating, setEvaluating] = useState(false),
    [error, setError] = useState("");
  const [chatOpen, setChatOpen] = useState(false),
    [reload, setReload] = useState(0);
  const token = session?.token,
    guest = !token;
  const university =
    catalog.institutions.find((i) => i.id === institution) ||
    catalog.institutions[0];
  function logout() {
    localStorage.removeItem("careerfit-session");
    setSession(null);
    setHistory([]);
    setSection("programs");
    setSelected(null);
    setEvaluation(null);
    setChatOpen(false);
    setError("");
    setPage("app");
  }
  function navigate(id) {
    setSection(id);
    setSelected(null);
    setEvaluation(null);
    setError("");
    window.scrollTo({ top: 0, behavior: "smooth" });
  }
  function changeInstitution(value) {
    setInstitution(value);
    localStorage.setItem("careerfit-institution", JSON.stringify(value));
    setSelected(null);
    setEvaluation(null);
  }
  function login(newToken, user) {
    const next = { token: newToken, user };
    localStorage.setItem("careerfit-session", JSON.stringify(next));
    setSession(next);
    setPage("app");
    setError("");
  }
  useEffect(() => {
    if (page !== "app") return;
    const controller = new AbortController();
    setLoading(true);
    setError("");
    setPrograms([]);
    Promise.all([
      request("/convocatorias", { signal: controller.signal }),
      request("/tipos-movilidad?institution=" + university.id, {
        signal: controller.signal,
      }),
      token
        ? request("/evaluaciones", { token, signal: controller.signal })
        : Promise.resolve(readStored("careerfit-guest-history", [])),
    ])
      .then(([calls, items, records]) => {
        if (!controller.signal.aborted) {
          setOpportunities(calls);
          setPrograms(items);
          setHistory(records);
        }
      })
      .catch((err) => {
        if (controller.signal.aborted) return;
        if (err.status === 401) {
          localStorage.removeItem("careerfit-session");
          setSession(null);
          setHistory([]);
          setSelected(null);
          setEvaluation(null);
        } else setError(err.message);
      })
      .finally(() => {
        if (!controller.signal.aborted) setLoading(false);
      });
    return () => controller.abort();
  }, [page, token, university.id, reload]);
  async function evaluate(form) {
    setEvaluating(true);
    setError("");
    try {
      const record = await request("/evaluar", {
        token,
        method: "POST",
        body: JSON.stringify(
          form.convocatoriaId
            ? form
            : { ...form, tipoMovilidadId: selected.id },
        ),
      });
      setEvaluation(record);
      setHistory((previous) => {
        const next = [record, ...previous].slice(0, 50);
        if (guest)
          localStorage.setItem("careerfit-guest-history", JSON.stringify(next));
        return next;
      });
      window.scrollTo({ top: 0, behavior: "smooth" });
    } catch (err) {
      if (err.status === 401) {
        logout();
        setError("Tu sesión caducó. Puedes seguir como visitante.");
      } else setError(err.message);
    } finally {
      setEvaluating(false);
    }
  }
  async function saveEvaluation() {
    if (!evaluation?.answers) return;
    setEvaluating(true);
    try {
      const record = await request("/evaluar", {
        token,
        method: "POST",
        body: JSON.stringify(evaluation.answers),
      });
      const documents = readStored(
        `careerfit-docs-guest-${evaluation.evaluacionId}`,
        [],
      );
      localStorage.setItem(
        `careerfit-docs-${session.user.id}-${record.evaluacionId}`,
        JSON.stringify(documents),
      );
      setEvaluation(record);
      setHistory((previous) => [record, ...previous]);
    } catch (err) {
      setError(err.message);
    } finally {
      setEvaluating(false);
    }
  }
  function select(program, answers = null) {
    setInitialAnswers(answers);
    setSelected(program);
    setEvaluation(null);
    setError("");
    window.scrollTo({ top: 0, behavior: "smooth" });
  }
  const currentOpportunity = opportunities.find(
    (item) => item.id === evaluation?.tipoMovilidad.id,
  );
  const previousEvaluation =
    evaluation?.kind === "eligibility"
      ? history.find(
          (item) =>
            item.kind === "eligibility" &&
            item.tipoMovilidad.id === evaluation.tipoMovilidad.id &&
            item.fecha < evaluation.fecha,
        )
      : null;
  return (
    <>
      <a className="skip-link" href="#main-content">
        Saltar al contenido
      </a>
      {page === "login" || page === "register" || page === "account" ? (
        <Auth
          key={page}
          register={page === "register"}
          onBack={() => setPage("app")}
          account={page === "account"}
          session={session}
          onLogout={logout}
          onNavigate={() => setPage(page === "login" ? "register" : "login")}
          onLogin={login}
        />
      ) : (
        <div className="workspace portal">
          <div className="workspace-body">
            <header className="workspace-header top-header">
              <Brand onClick={() => navigate("programs")} />
              <nav aria-label="Navegación principal">
                {nav.map(({ id, label }) => (
                  <button
                    key={id}
                    onClick={() => navigate(id)}
                    aria-current={section === id ? "page" : undefined}
                  >
                    {label}
                  </button>
                ))}
              </nav>
              <div className="header-actions">
                <button
                  className="btn call-secondary"
                  onClick={() => setChatOpen(true)}
                >
                  <Sparkles size={15} /> Asistente
                </button>
                {isDemo ? (
                  <span className="demo-label">Demo pública</span>
                ) : (
                  <button
                    className="btn header-account"
                    onClick={() => setPage(guest ? "login" : "account")}
                  >
                    {guest ? "Iniciar sesión" : "Mi cuenta"}
                  </button>
                )}
              </div>
            </header>
            <main className="workspace-main portal-main" id="main-content">
              {error && (
                <div className="alert error" role="alert">
                  {error}
                  <button
                    className="text-link"
                    onClick={() => setReload(reload + 1)}
                  >
                    <RefreshCw size={14} /> Reintentar conexión
                  </button>
                </div>
              )}
              {loading ? (
                <div className="loading-state" role="status">
                  <LoaderCircle size={25} className="spin" />
                  <p>Preparando tu espacio…</p>
                </div>
              ) : evaluation ? (
                <>
                  <button
                    className="back-link text-button"
                    onClick={() => {
                      setEvaluation(null);
                      setSelected(null);
                    }}
                  >
                    <ArrowLeft size={15} />{" "}
                    {section === "history"
                      ? "Volver al historial"
                      : "Volver a oportunidades"}
                  </button>
                  <EvaluationResult
                    key={evaluation.evaluacionId}
                    data={evaluation}
                    storageScope={guest ? "guest" : session?.user?.id}
                    guest={guest}
                    onSignIn={() => setPage("login")}
                    onSave={saveEvaluation}
                    saving={evaluating}
                    onAsk={() => setChatOpen(true)}
                    previousEvaluation={previousEvaluation}
                    onReevaluate={
                      currentOpportunity
                        ? () =>
                            select(
                              currentOpportunity,
                              evaluation.answers?.responses,
                            )
                        : undefined
                    }
                    onReset={() => navigate("programs")}
                  />
                </>
              ) : selected ? (
                <>
                  <button
                    className="back-link text-button"
                    onClick={() => {
                      setSelected(null);
                      setError("");
                    }}
                  >
                    <ArrowLeft size={15} /> Volver a oportunidades
                  </button>
                  {selected.criteria ? (
                    <OpportunityDetail
                      key={selected.id}
                      opportunity={selected}
                      initialAnswers={initialAnswers}
                      onSubmit={evaluate}
                      loading={evaluating}
                    />
                  ) : (
                    <>
                      <div className="page-title">
                        <span className="eyebrow">
                          TU EVALUACIÓN, PASO A PASO
                        </span>
                        <h1>{selected.nombre}</h1>
                        <p>{selected.descripcion}</p>
                      </div>
                      <div className="evaluation-layout">
                        <EligibilityForm
                          key={selected.id}
                          program={selected}
                          onSubmit={evaluate}
                          loading={evaluating}
                          guest={guest}
                        />
                        <aside className="evaluation-guide">
                          <span className="mini-icon">
                            <FileText size={24} />
                          </span>
                          <h3>
                            Organizar tu expediente
                            <br />
                            es el primer paso.
                          </h3>
                          <p>
                            Marca tus respaldos y obtén un resumen claro de tus
                            documentos pendientes.
                          </p>
                          <ul>
                            <li>
                              <Check size={15} /> Revisa qué documentos tienes
                            </li>
                            <li>
                              <Check size={15} /> Identifica lo que falta
                            </li>
                            <li>
                              <Check size={15} /> Organiza tus documentos
                            </li>
                          </ul>
                          <div className="guide-bottom">
                            <Sparkles size={19} />
                            <p>¿Tienes alguna duda?</p>
                            <button
                              className="text-link"
                              onClick={() => setChatOpen(true)}
                            >
                              Pregunta al asistente <ArrowUpRight size={15} />
                            </button>
                          </div>
                        </aside>
                      </div>
                    </>
                  )}
                </>
              ) : section === "programs" ? (
                <>
                  <OpportunityExplorer
                    opportunities={opportunities}
                    institutions={catalog.institutions}
                    onSelect={select}
                    onHistory={() => navigate("history")}
                  />
                  <details className="legacy-guides">
                    <summary>Guías de preparación documental</summary>
                    <label>
                      Universidad{" "}
                      <select
                        value={university.id}
                        onChange={(e) => changeInstitution(e.target.value)}
                      >
                        {catalog.institutions.map((i) => (
                          <option key={i.id} value={i.id}>
                            {i.shortName}
                          </option>
                        ))}
                      </select>
                    </label>
                    <div className="program-grid">
                      {programs.map((p, i) => (
                        <ProgramCard
                          key={p.id}
                          program={p}
                          index={i}
                          onClick={select}
                        />
                      ))}
                    </div>
                  </details>
                </>
              ) : section === "history" ? (
                <>
                  <div className="page-title">
                    <span className="eyebrow">CADA PASO QUEDA CONTIGO</span>
                    <h1>Tu recorrido académico.</h1>
                    <p>
                      Consulta tus evaluaciones de becas y revisiones de
                      documentos.
                    </p>
                  </div>
                  {history.length ? (
                    <div className="history-list">
                      {history.map((record) => (
                        <button
                          className="history-item"
                          key={record.evaluacionId}
                          onClick={() => {
                            setEvaluation(record);
                            setSelected(null);
                          }}
                        >
                          <span className="mini-icon">
                            <FileText size={21} />
                          </span>
                          <div>
                            <h3>{record.tipoMovilidad.nombre}</h3>
                            <p>
                              {localDate(record.fecha)} ·{" "}
                              {record.kind === "eligibility"
                                ? "Elegibilidad"
                                : "Revisión documental"}
                            </p>
                          </div>
                          <span
                            className={`badge ${record.resultado === "incompleto" ? "amber" : record.esViable ? "green" : "amber"}`}
                          >
                            {record.resultado === "incompleto"
                              ? "Falta información"
                              : record.esViable
                                ? record.kind === "eligibility"
                                  ? "Cumples los criterios revisados"
                                  : "Respaldos preparados"
                                : "Con pendientes"}
                          </span>
                          <ArrowUpRight size={18} />
                        </button>
                      ))}
                    </div>
                  ) : (
                    <div className="empty-state">
                      <History size={34} />
                      <h3>Tu recorrido empieza aquí.</h3>
                      <p>
                        Cuando completes una evaluación, podrás encontrarla en
                        este espacio.
                      </p>
                      <button
                        className="btn btn-dark"
                        onClick={() => navigate("programs")}
                      >
                        Explorar oportunidades <ArrowUpRight size={16} />
                      </button>
                    </div>
                  )}
                </>
              ) : (
                <>
                  <label className="resources-select">
                    Universidad{" "}
                    <select
                      value={university.id}
                      onChange={(e) => changeInstitution(e.target.value)}
                    >
                      {catalog.institutions.map((i) => (
                        <option key={i.id} value={i.id}>
                          {i.shortName}
                        </option>
                      ))}
                    </select>
                  </label>
                  <Resources
                    university={university}
                    onAsk={() => setChatOpen(true)}
                  />
                </>
              )}
              <footer className="workspace-footer">
                <span>
                  {isDemo
                    ? "Demo pública · Historial en este navegador"
                    : "Career-Fit · Tu siguiente capítulo."}
                </span>
                <span>
                  Orientación informativa, no aprobación institucional.
                </span>
              </footer>
            </main>
          </div>
          <nav className="mobile-nav" aria-label="Navegación móvil">
            {nav.map(({ id, label, icon: Icon }) => (
              <button
                key={id}
                className={section === id ? "active" : ""}
                aria-current={section === id ? "page" : undefined}
                onClick={() => navigate(id)}
              >
                <Icon size={20} />
                <span>{label}</span>
              </button>
            ))}
            <button onClick={() => setChatOpen(true)}>
              <Sparkles size={20} />
              <span>Asistente</span>
            </button>
          </nav>
          <Chatbot
            key={`${guest ? "guest" : session?.user?.id}-${institution}-${evaluation?.evaluacionId || selected?.id || "general"}`}
            token={token}
            institution={university.id}
            program={selected?.criteria ? undefined : selected}
            evaluation={
              evaluation?.kind === "eligibility" ? undefined : evaluation
            }
            open={chatOpen}
            onOpenChange={setChatOpen}
          />
        </div>
      )}
    </>
  );
}
function Resources({ onAsk, university }) {
  return (
    <>
      <div className="page-title">
        <span className="eyebrow">INFORMACIÓN PARA AVANZAR</span>
        <h1>Un camino más claro.</h1>
        <p>Accede a fuentes institucionales y organiza los siguientes pasos.</p>
      </div>
      <div className="resources-grid">
        <a
          className="panel resource-card"
          href={university.sourceUrl}
          target="_blank"
          rel="noreferrer"
        >
          <span className="mini-icon">
            <BookOpen size={23} />
          </span>
          <h3>Referencias de movilidad · {university.shortName}</h3>
          <p>
            Consulta información institucional sobre becas, ayudas económicas y
            trámites.
          </p>
          <span className="text-link">
            Visitar sitio institucional <ArrowUpRight size={16} />
          </span>
        </a>
        <a
          className="panel resource-card"
          href={university.url}
          target="_blank"
          rel="noreferrer"
        >
          <span className="mini-icon">
            <Globe2 size={23} />
          </span>
          <h3>Portal de {university.shortName}</h3>
          <p>
            Encuentra los canales institucionales y confirma la información
            vigente.
          </p>
          <span className="text-link">
            Ir al portal <ArrowUpRight size={16} />
          </span>
        </a>
      </div>
      <section className="panel faq-panel">
        <h2>Antes de dar el siguiente paso.</h2>
        {[
          [
            "¿Este resultado garantiza una plaza o beca?",
            "No. Estas guías revisan la preparación de documentos, no todos los criterios de elegibilidad. La institución y la convocatoria vigente determinan la admisión y los apoyos.",
          ],
          [
            "¿Dónde encuentro mis documentos pendientes?",
            "En el resultado de cada evaluación tienes una lista personal. Puedes volver a ella desde Mi historial. Las marcas se guardan en este navegador.",
          ],
          [
            "¿Puedo usarlo desde el celular?",
            "Sí. La misma aplicación adapta el panel, los formularios y el asistente a pantallas móviles y de escritorio.",
          ],
          [
            "¿El asistente siempre usa inteligencia artificial?",
            isDemo
              ? "El asistente de esta demo usa una guía de orientación con fuentes institucionales."
              : "Puedes consultar una guía de orientación sin cuenta. Si inicias sesión, el asistente utiliza Gemini cuando está disponible y conserva una guía de respaldo.",
          ],
        ].map(([q, a]) => (
          <details key={q}>
            <summary>{q}</summary>
            <p>{a}</p>
          </details>
        ))}
        <button className="text-link" onClick={onAsk}>
          Tengo otra pregunta <ArrowUpRight size={16} />
        </button>
      </section>
    </>
  );
}
