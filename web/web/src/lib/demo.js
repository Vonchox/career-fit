import { listPrograms } from "../../../../shared/catalog.mjs";
import {
  evaluateRequirements,
  summarize,
} from "../../../../shared/evaluation.mjs";
import { fallbackAnswer } from "../../../../shared/guide.mjs";
import {
  evaluateOpportunity,
  listOpportunities,
} from "../../../../shared/opportunities.mjs";

export function demoRequest(path, { method = "GET", body, signal } = {}) {
  signal?.throwIfAborted();
  const [route, search] = path.split("?");
  if (method === "GET") {
    if (route === "/convocatorias") return listOpportunities();
    if (route === "/tipos-movilidad")
      return listPrograms(new URLSearchParams(search).get("institution"));
  }
  if (method === "POST" && route === "/evaluar") {
    const form = JSON.parse(body);
    if (form.convocatoriaId) {
      const result = evaluateOpportunity(form);
      if (result.error)
        throw Object.assign(new Error(result.error), { status: result.status });
      return { ...result, guest: true };
    }
    const program = listPrograms().find(
      (item) => item.id === form.tipoMovilidadId,
    );
    if (!program) throw new Error("No encontramos esa guía de preparación.");
    const requisitos = evaluateRequirements(program, form);
    const resultado = summarize(requisitos);
    return {
      evaluacionId: crypto.randomUUID(),
      fecha: new Date().toISOString(),
      resultado,
      esViable: resultado === "viable",
      requisitos,
      tipoMovilidad: program,
      guest: true,
      answers: form,
    };
  }
  if (method === "POST" && route === "/chat") {
    const { messages, institution, programId, guestAnswers } = JSON.parse(body);
    const programs = listPrograms(institution).filter(
      (item) => !programId || item.id === programId,
    );
    const evaluation =
      guestAnswers && programs.length === 1
        ? { requisitos: evaluateRequirements(programs[0], guestAnswers) }
        : null;
    return {
      response: fallbackAnswer(messages.at(-1).content, programs, evaluation, {
        demo: true,
      }),
      mode: "guide",
    };
  }
  throw new Error("Esta función requiere la versión con servidor.");
}
