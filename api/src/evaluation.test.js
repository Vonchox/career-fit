const { test } = require("node:test");
const assert = require("node:assert/strict");
const { evaluateRequirements, summarize } = require("./evaluation");
const rule = (field, operator, value) => ({
  id: field,
  nombre: field,
  condicionCampo: field,
  condicionOperador: operator,
  condicionValor: value,
});
test("numeric boundaries and boolean conditions determine eligibility", () => {
  const program = {
    nombre: "Movilidad",
    requisitos: [
      rule("promedio", ">=", "16"),
      rule("semestre", ">", "3"),
      rule("convenio", "==", "true"),
    ],
  };
  const input = { promedio: 16, semestre: 4, convenio: true };
  assert.equal(summarize(evaluateRequirements(program, input)), "viable");
  assert.equal(
    summarize(evaluateRequirements(program, { ...input, promedio: 15.99 })),
    "no_viable",
  );
  assert.equal(
    summarize(evaluateRequirements(program, { ...input, convenio: false })),
    "no_viable",
  );
});
test("empty catalog, absent values and malformed rules are incomplete", () => {
  assert.equal(summarize([]), "incompleto");
  for (const requirement of [
    rule("promedio", ">=", "NaN"),
    rule("promedio", "unsupported", "16"),
    rule("promedio", ">=", ""),
    rule("missing", "==", "true"),
  ]) {
    assert.equal(
      summarize(
        evaluateRequirements(
          { nombre: "Movilidad", requisitos: [requirement] },
          { promedio: 18 },
        ),
      ),
      "incompleto",
    );
  }
});
test("English certificate cannot be satisfied by an invitation", () => {
  const program = {
    nombre: "Suficiencia de Inglés (B2)",
    requisitos: [rule("tieneConvenioOInvitacion", "==", "true")],
  };
  assert.equal(
    summarize(
      evaluateRequirements(program, {
        tieneConvenioOInvitacion: true,
        tieneCertificadoB2: false,
      }),
    ),
    "no_viable",
  );
  assert.equal(
    summarize(
      evaluateRequirements(program, {
        tieneConvenioOInvitacion: false,
        tieneCertificadoB2: true,
      }),
    ),
    "viable",
  );
});
