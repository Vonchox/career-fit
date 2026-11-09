const { test } = require("node:test");
const assert = require("node:assert/strict");
const { createApp } = require("../index");
for (const institution of ["uce", "epn", "espe"])
  test(`guest can browse, evaluate and ask for ${institution} without writes or Gemini`, async (t) => {
    const id = "81000000-0000-4000-8000-000000000001";
    let writes = 0,
      aiCalls = 0;
    const program = {
      id,
      institution,
      nombre: "Guía UCE",
      ambito: "internacional",
      requisitos: [
        {
          id: "doc",
          nombre: "Récord",
          documentoRespaldo: "Récord académico",
          condicionCampo: "tieneRecordAcademico",
          condicionOperador: "==",
          condicionValor: "true",
        },
      ],
    };
    const app = createApp({
      database: {
        tipoMovilidad: {
          findMany: async (query) => {
            assert.ok(query.where.institution || query.where.id);
            return [program];
          },
          findUnique: async () => program,
        },
        evaluacion: {
          create: async () => {
            writes++;
          },
        },
      },
      answer: async () => {
        aiCalls++;
      },
    });
    const server = app.listen(0, "127.0.0.1");
    await new Promise((resolve) => server.once("listening", resolve));
    t.after(() => new Promise((resolve) => server.close(resolve)));
    const url = `http://127.0.0.1:${server.address().port}/api`,
      headers = { "Content-Type": "application/json" };
    const catalog = await (
      await fetch(url + "/tipos-movilidad?institution=" + institution)
    ).json();
    assert.equal(catalog[0].institution, institution);
    assert.equal(catalog[0].preparationOnly, true);
    assert.equal(
      (await fetch(url + "/tipos-movilidad?institution=other")).status,
      400,
    );
    const result = await (
      await fetch(url + "/evaluar", {
        method: "POST",
        headers,
        body: JSON.stringify({
          tipoMovilidadId: id,
          tieneRecordAcademico: true,
        }),
      })
    ).json();
    assert.equal(result.guest, true);
    assert.equal(result.requisitos[0].cumplido, true);
    assert.equal(writes, 0);
    assert.equal((await fetch(url + "/evaluaciones")).status, 401);
    assert.equal(
      (
        await fetch(url + "/evaluar", {
          method: "POST",
          headers: { ...headers, Authorization: "Bearer invalid" },
          body: JSON.stringify({ tipoMovilidadId: id }),
        })
      ).status,
      401,
    );
    const chat = await (
      await fetch(url + "/chat", {
        method: "POST",
        headers,
        body: JSON.stringify({
          messages: [{ role: "user", content: "¿Qué me falta?" }],
          programId: id,
          guestAnswers: { tieneRecordAcademico: false },
        }),
      })
    ).json();
    assert.equal(chat.mode, "guide");
    assert.match(chat.response, /Récord/);
    assert.equal(aiCalls, 0);
    assert.equal(
      (
        await fetch(url + "/chat", {
          method: "POST",
          headers,
          body: JSON.stringify({
            messages: [{ role: "user", content: "hola" }],
            evaluationId: id,
          }),
        })
      ).status,
      401,
    );
  });
