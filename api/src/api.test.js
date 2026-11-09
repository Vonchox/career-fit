const { test } = require("node:test");
const assert = require("node:assert/strict");
const jwt = require("jsonwebtoken");
const { createApp } = require("../index");
const id = "70000000-0000-4000-8000-000000000001";
test("HTTP validation, ownership and persistence do not depend on AI", async (t) => {
  let record;
  const program = {
    id,
    institution: "uce",
    nombre: "Programa de prueba",
    ambito: "nacional",
    requisitos: [
      {
        id: "gpa",
        nombre: "Promedio",
        condicionCampo: "promedio",
        condicionOperador: ">=",
        condicionValor: "16",
      },
    ],
  };
  const database = {
    tipoMovilidad: {
      findMany: async () => [program],
      findUnique: async () => program,
    },
    evaluacion: {
      findMany: async (query) => {
        assert.equal(query.where.usuarioId, "test-user");
        return record ? [record] : [];
      },
      findFirst: async (query) => {
        assert.equal(query.where.usuarioId, "test-user");
        return null;
      },
      create: async ({ data }) => {
        assert.equal(data.usuario.connect.id, "test-user");
        assert.ok(!("tieneCertificadoB2" in data.estudiante.create));
        record = { ...data, id, fecha: new Date(), tipoMovilidad: program };
        return record;
      },
    },
  };
  const app = createApp({
    database,
    answer: async () => ({ response: "Test FAQ", mode: "faq" }),
  });
  const server = app.listen(0, "127.0.0.1");
  await new Promise((resolve) => server.once("listening", resolve));
  t.after(() => new Promise((resolve) => server.close(resolve)));
  const url = `http://127.0.0.1:${server.address().port}/api`;
  const headers = {
    "Content-Type": "application/json",
    Authorization: `Bearer ${jwt.sign({ userId: "test-user" }, process.env.JWT_SECRET || "super-secret-key-for-dev")}`,
  };
  assert.equal((await fetch(`${url}/evaluaciones`)).status, 401);
  assert.equal(
    (await fetch(`${url}/evaluar`, { method: "POST", headers, body: "{}" }))
      .status,
    400,
  );
  const response = await fetch(`${url}/evaluar`, {
    method: "POST",
    headers,
    body: JSON.stringify({
      tipoMovilidadId: id,
      carrera: "Software",
      semestre: 5,
      promedio: 17,
      creditosMatriculados: 15,
      tieneConvenioOInvitacion: true,
      tieneResolucionConsejoCarrera: false,
      tieneCertificadoB2: false,
    }),
  });
  assert.equal(response.status, 200);
  assert.equal((await response.json()).resultado, "viable");
  const history = await (
    await fetch(`${url}/evaluaciones`, { headers })
  ).json();
  assert.equal(history.length, 1);
  assert.equal(history[0].evaluacionId, id);
  assert.equal(
    (
      await fetch(`${url}/chat`, {
        method: "POST",
        headers,
        body: JSON.stringify({
          messages: [{ role: "user", content: "hola" }],
          evaluationId: id,
        }),
      })
    ).status,
    404,
  );
  assert.equal(
    (
      await fetch(`${url}/chat`, {
        method: "POST",
        headers,
        body: JSON.stringify({ messages: [] }),
      })
    ).status,
    400,
  );
  const chat = await (
    await fetch(`${url}/chat`, {
      method: "POST",
      headers,
      body: JSON.stringify({ messages: [{ role: "user", content: "hola" }] }),
    })
  ).json();
  assert.equal(chat.mode, "faq");

  const [opportunity] = require("../../shared/opportunities.json");
  const submission = {
    method: "POST",
    body: JSON.stringify({
      convocatoriaId: opportunity.id,
      responses: { english: true },
    }),
  };
  const guestEvaluation = await (
    await fetch(`${url}/evaluar`, {
      ...submission,
      headers: { "Content-Type": "application/json" },
    })
  ).json();
  assert.equal(guestEvaluation.guest, true);
  assert.equal(record.id, id);
  const savedEvaluation = await (
    await fetch(`${url}/evaluar`, { ...submission, headers })
  ).json();
  assert.equal(savedEvaluation.kind, "eligibility");
  const [restored] = await (
    await fetch(`${url}/evaluaciones`, { headers })
  ).json();
  assert.deepEqual(restored, savedEvaluation);
});
