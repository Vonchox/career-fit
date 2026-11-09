const { test } = require("node:test");
const assert = require("node:assert/strict");
const { evaluateOpportunity, opportunityStatus } = require("./opportunities");
const [grenfin, uce, epn] = require("../../shared/opportunities.json");

test("an official application window changes state at its exact boundaries", () => {
  assert.equal(
    opportunityStatus(grenfin, Date.parse(grenfin.opensAt) - 1),
    "upcoming",
  );
  assert.equal(opportunityStatus(grenfin, Date.parse(grenfin.opensAt)), "open");
  assert.equal(
    opportunityStatus(grenfin, Date.parse(grenfin.closesAt)),
    "closed",
  );
  assert.equal(opportunityStatus(uce), "unverified");
});

test("curricular percentages use each university's published threshold", () => {
  const uceProfile = { regular: true, average: true, graduating: false };
  assert.equal(
    evaluateOpportunity({
      convocatoriaId: uce.id,
      responses: { ...uceProfile, progress: 60 },
    }).resultado,
    "no_viable",
  );
  assert.equal(
    evaluateOpportunity({
      convocatoriaId: uce.id,
      responses: { ...uceProfile, progress: 60.1 },
    }).resultado,
    "viable",
  );
  assert.equal(
    evaluateOpportunity({
      convocatoriaId: epn.id,
      responses: { regular: true, average: true, arrears: false, progress: 50 },
    }).resultado,
    "viable",
  );
  assert.throws(
    () =>
      evaluateOpportunity({
        convocatoriaId: uce.id,
        responses: { progress: true },
      }),
    /respuesta no es válida/,
  );
});

test("unanswered and failed criteria are distinguishable in historical snapshots", () => {
  const unknown = evaluateOpportunity({
    convocatoriaId: grenfin.id,
    responses: {},
  });
  assert.equal(unknown.resultado, "incompleto");
  const result = evaluateOpportunity({
    convocatoriaId: grenfin.id,
    responses: { priorScholarship: true },
  });
  assert.equal(result.resultado, "no_viable");
  assert.equal(
    result.requisitos.find((item) => item.id === "priorScholarship").evaluable,
    true,
  );
  assert.equal(
    result.requisitos.find((item) => item.id === "english").evaluable,
    false,
  );
  assert.equal(result.tipoMovilidad.sourceUrl, grenfin.sourceUrl);
  assert.equal(result.kind, "eligibility");
});
