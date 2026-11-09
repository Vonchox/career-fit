import { useState, useRef, useEffect, useId } from "react";
import {
  Sparkles,
  X,
  Send,
  ArrowUpRight,
  RotateCcw,
  LoaderCircle,
} from "lucide-react";
import ReactMarkdown from "react-markdown";
import { request } from "../lib/api";
const welcome = {
  role: "model",
  content:
    "Hola, soy tu asistente de Career-Fit. Podemos revisar requisitos, documentación y tus próximos pasos. ¿Por dónde empezamos?",
};
const suggestions = [
  "¿Por dónde empiezo?",
  "¿Qué documentos necesito?",
  "¿Qué requisitos me faltan?",
];
export default function Chatbot({
  token,
  institution,
  program,
  evaluation,
  open,
  onOpenChange,
}) {
  const [messages, setMessages] = useState([welcome]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [lastPrompt, setLastPrompt] = useState("");
  const end = useRef(null),
    field = useRef(null),
    dialog = useRef(null),
    launcher = useRef(null),
    busy = useRef(false),
    controller = useRef(null);
  const titleId = useId();
  useEffect(() => {
    end.current?.scrollIntoView({ block: "nearest", behavior: "smooth" });
  }, [messages, loading]);
  useEffect(() => {
    if (!open) return;
    field.current?.focus();
    const previous = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = previous;
    };
  }, [open]);
  useEffect(() => () => controller.current?.abort(), []);
  function close() {
    onOpenChange(false);
    launcher.current?.focus();
  }
  function keyboard(e) {
    if (e.key === "Escape") {
      e.preventDefault();
      close();
    }
    if (e.key === "Tab") {
      const nodes = [
        ...dialog.current.querySelectorAll(
          "button:not(:disabled),input:not(:disabled),a[href]",
        ),
      ];
      const first = nodes[0],
        last = nodes.at(-1);
      if (e.shiftKey && document.activeElement === first) {
        e.preventDefault();
        last?.focus();
      } else if (!e.shiftKey && document.activeElement === last) {
        e.preventDefault();
        first?.focus();
      }
    }
  }
  async function send(text, retry = false) {
    const content = text.trim();
    if (!content || busy.current) return;
    busy.current = true;
    setLoading(true);
    setError("");
    setInput("");
    setLastPrompt(content);
    const base =
      messages.at(-1)?.role === "user" ? messages.slice(0, -1) : messages;
    const next = retry ? messages : [...base, { role: "user", content }];
    if (!retry) setMessages(next);
    try {
      controller.current = new AbortController();
      const data = await request("/chat", {
        token,
        timeoutMs: 40000,
        method: "POST",
        signal: AbortSignal.any([
          controller.current.signal,
          AbortSignal.timeout(40000),
        ]),
        body: JSON.stringify({
          messages: next.filter((m) => m !== welcome).slice(-15),
          institution,
          programId: evaluation?.guest
            ? evaluation.tipoMovilidad.id
            : program?.id,
          evaluationId: evaluation?.guest
            ? undefined
            : evaluation?.evaluacionId,
          guestAnswers: evaluation?.guest
            ? Object.fromEntries(
                Object.entries(evaluation.answers || {}).filter(
                  ([, value]) => typeof value === "boolean",
                ),
              )
            : undefined,
        }),
      });
      setMessages([
        ...next,
        { role: "model", content: data.response, mode: data.mode },
      ]);
    } catch (err) {
      setError(err.message);
    } finally {
      busy.current = false;
      setLoading(false);
    }
  }
  return (
    <>
      <button
        ref={launcher}
        className="chat-launcher"
        onClick={() => onOpenChange(!open)}
        aria-label="Abrir asistente"
        aria-expanded={open}
      >
        <Sparkles size={21} />
        <span>Tu asistente</span>
      </button>
      {open && (
        <>
          <div className="chat-backdrop" onClick={close} />
          <section
            ref={dialog}
            className="chat-panel"
            role="dialog"
            aria-modal="true"
            aria-labelledby={titleId}
            onKeyDown={keyboard}
          >
            <header className="chat-header">
              <span className="assistant-avatar">
                <Sparkles size={20} />
              </span>
              <div>
                <h2 id={titleId}>Un poco de orientación.</h2>
                <small>
                  {!token
                    ? "Guía de orientación · sin cuenta"
                    : "Asistente de Career-Fit"}
                </small>
              </div>
              <button
                className="icon-button"
                onClick={close}
                aria-label="Cerrar asistente"
              >
                <X size={19} />
              </button>
            </header>
            {(program || evaluation) && (
              <div className="chat-context">
                Conversando sobre:{" "}
                {evaluation?.tipoMovilidad.nombre || program.nombre}
              </div>
            )}
            <div
              className="chat-messages"
              role="log"
              aria-live="polite"
              aria-relevant="additions"
            >
              {messages.map((m, i) => (
                <div
                  key={i}
                  className={`chat-message ${m.role === "user" ? "from-user" : "from-assistant"}`}
                >
                  <div className="markdown-content">
                    <ReactMarkdown
                      components={{
                        a: ({ children, ...props }) => (
                          <a {...props} target="_blank" rel="noreferrer">
                            {children}
                          </a>
                        ),
                      }}
                    >
                      {m.content}
                    </ReactMarkdown>
                  </div>
                  {(m.mode === "faq" || m.mode === "guide") && (
                    <small className="chat-mode">
                      {m.mode === "guide"
                        ? "Guía de orientación"
                        : "Guía de respaldo · IA no disponible"}
                    </small>
                  )}
                </div>
              ))}
              {loading && (
                <div className="chat-thinking" role="status">
                  <LoaderCircle className="spin" size={14} /> Preparando una
                  respuesta…
                </div>
              )}
              {error && (
                <div className="alert error" role="alert">
                  {error}
                  <button
                    className="text-link"
                    onClick={() => send(lastPrompt, true)}
                  >
                    <RotateCcw size={14} /> Reintentar
                  </button>
                </div>
              )}
              <div ref={end} />
            </div>
            {messages.length === 1 && (
              <div className="chat-suggestions">
                {suggestions.map((s) => (
                  <button key={s} onClick={() => send(s)} disabled={loading}>
                    {s}
                    <ArrowUpRight size={13} />
                  </button>
                ))}
              </div>
            )}
            <form
              className="chat-input"
              onSubmit={(e) => {
                e.preventDefault();
                send(input);
              }}
            >
              <input
                ref={field}
                value={input}
                onChange={(e) => setInput(e.target.value)}
                maxLength={2000}
                placeholder="Escribe tu pregunta…"
                aria-label="Tu pregunta"
              />
              <button
                className="icon-button send-button"
                disabled={loading || !input.trim()}
                aria-label="Enviar pregunta"
              >
                <Send size={17} />
              </button>
            </form>
            <p className="chat-disclaimer">
              Orientación informativa. Confirma los trámites con la institución.
            </p>
          </section>
        </>
      )}
    </>
  );
}
