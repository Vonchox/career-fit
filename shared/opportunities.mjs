import opportunities from "./opportunities.json" with { type: "json" };
import { evaluateRequirements } from "./evaluation.mjs";

function opportunityStatus(opportunity, now = Date.now()) {
  const opens = Date.parse(opportunity.opensAt);
  const closes = Date.parse(opportunity.closesAt);
  if (!Number.isFinite(opens) || !Number.isFinite(closes) || opens >= closes)
    return "unverified";
  if (now >= closes) return "closed";
  return now < opens ? "upcoming" : "open";
}

function listOpportunities() {
  return opportunities.map((item) => ({
    ...item,
    status: opportunityStatus(item),
  }));
}

function evaluateOpportunity({ convocatoriaId, responses }) {
  const opportunity = listOpportunities().find(
    (item) => item.id === convocatoriaId,
  );
  if (!opportunity)
    return { error: "No encontramos esa convocatoria.", status: 404 };
  if (!opportunity.criteria.length)
    return {
      error:
        "Esta oportunidad aún requiere bases verificadas para poder evaluarla.",
      status: 409,
    };

  const answers = {};
  let invalidField;
  const rules = opportunity.criteria.map((criterion) => {
    const value = responses[criterion.id];
    const isNumber = typeof criterion.expected === "number";
    if (value !== undefined) {
      if (
        isNumber
          ? !Number.isFinite(value) || value < 0 || value > 100
          : typeof value !== "boolean"
      ) {
        invalidField = criterion.id;
        return null;
      }
      answers[criterion.id] = value;
    }
    return {
      id: criterion.id,
      nombre: criterion.label,
      descripcion: criterion.description,
      condicionCampo: criterion.id,
      condicionOperador: criterion.operator || "==",
      condicionValor: String(criterion.expected),
    };
  });
  if (invalidField)
    return {
      error: "La respuesta no es válida para este criterio.",
      status: 400,
      field: invalidField,
    };
  const requisitos = evaluateRequirements(
    { nombre: opportunity.nombre, requisitos: rules },
    answers,
  );
  let resultado = "viable";
  if (requisitos.some((rule) => rule.evaluable && !rule.cumplido))
    resultado = "no_viable";
  else if (requisitos.some((rule) => !rule.evaluable)) resultado = "incompleto";
  return {
    evaluacionId: crypto.randomUUID(),
    fecha: new Date().toISOString(),
    kind: "eligibility",
    resultado,
    esViable: resultado === "viable",
    requisitos,
    tipoMovilidad: opportunity,
    answers: { convocatoriaId, responses: answers },
  };
}

export { evaluateOpportunity, listOpportunities, opportunityStatus };
export const opportunityIds = opportunities.map((item) => item.id);
