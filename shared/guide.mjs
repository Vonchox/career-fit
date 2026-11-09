import { catalog } from "./catalog.mjs";

function sourceLinks(programs) {
  const institutions = catalog.institutions;
  const ids = new Set(programs.map((p) => p.institution));
  const sources = institutions.filter((i) => ids.has(i.id));
  return (sources.length ? sources : institutions)
    .map((i) => "[" + i.shortName + "](" + i.sourceUrl + ")")
    .join(" · ");
}
function fallbackAnswer(question, programs, evaluation, { demo = false } = {}) {
  const q = question.toLowerCase(),
    sources = sourceLinks(programs);
  if (/falt|resultado|cumpl/.test(q) && evaluation) {
    const pending = evaluation.requisitos.filter((r) => !r.cumplido);
    return (
      (pending.length
        ? "Según tu revisión, tienes estos respaldos pendientes:\n" +
          pending
            .map((r) => "- **" + r.nombre + "**: " + r.descripcion)
            .join("\n")
        : "Declaraste preparados los documentos de esta guía. Esto no determina tu elegibilidad.") +
      "\n\nConfirma la lista completa y la convocatoria con tu universidad. Fuentes: " +
      sources
    );
  }
  if (/document|requisit|promedio|semestre|ingl[eé]s|cr[eé]dito/.test(q)) {
    const list =
      evaluation?.requisitos || programs.flatMap((p) => p.requisitos);
    if (!list.length)
      return (
        "Aún no hay una guía configurada para esta consulta. Revisa la fuente institucional: " +
        sources
      );
    if (/document/.test(q))
      return (
        "En estas guías puedes organizar:\n" +
        [...new Set(list.map((r) => r.documentoRespaldo).filter(Boolean))]
          .map((d) => "- " + d)
          .join("\n") +
        "\n\nNo es una lista exhaustiva de elegibilidad. Confirma los formatos y condiciones vigentes: " +
        sources
      );
    return (
      "Career-Fit revisa preparación documental, no tu elegibilidad académica. Los promedios, idiomas, plazos y demás condiciones deben confirmarse en la convocatoria de tu universidad. Fuentes: " +
      sources
    );
  }
  return (
    "Puedes empezar sin cuenta: elige **UCE, EPN o ESPE**, abre una guía y marca los documentos que tienes preparados. No necesitas dar tu nombre ni subir archivos. " +
    (demo
      ? "El historial de esta demo se guarda en tu navegador."
      : "Iniciar sesión es opcional y sirve para guardar tu historial entre dispositivos.") +
    "\n\nFuentes institucionales: " +
    sources
  );
}

export { fallbackAnswer };
