// Rules are data-driven; unsupported or absent rules must never imply eligibility.
function evaluateRequirements(program, student) {
  return program.requisitos.map((rule) => {
    const field =
      /inglés/i.test(program.nombre) &&
      rule.condicionCampo === "tieneConvenioOInvitacion"
        ? "tieneCertificadoB2"
        : rule.condicionCampo;
    const actual = student[field];
    let expected = rule.condicionValor;
    const operators = {
      ">=": (a, b) => a >= b,
      "<=": (a, b) => a <= b,
      "==": (a, b) => a === b,
      ">": (a, b) => a > b,
      "<": (a, b) => a < b,
    };
    let evaluable =
      actual !== undefined &&
      expected !== null &&
      expected !== undefined &&
      Boolean(operators[rule.condicionOperador]);
    if (typeof actual === "number") {
      expected = Number(expected);
      evaluable =
        evaluable &&
        Number.isFinite(actual) &&
        Number.isFinite(expected) &&
        rule.condicionValor.trim() !== "";
    } else if (typeof actual === "boolean") {
      evaluable = evaluable && ["true", "false"].includes(expected);
      expected = expected === "true";
    }
    return {
      id: rule.id,
      nombre: rule.nombre,
      descripcion: rule.descripcion,
      documentoRespaldo: rule.documentoRespaldo,
      articuloReglamento: rule.articuloReglamento,
      cumplido: evaluable
        ? operators[rule.condicionOperador](actual, expected)
        : false,
      evaluable,
      valorEstudiante: actual,
    };
  });
}
function summarize(requirements) {
  if (!requirements.length || requirements.some((r) => !r.evaluable))
    return "incompleto";
  return requirements.every((r) => r.cumplido) ? "viable" : "no_viable";
}
export { evaluateRequirements, summarize };
