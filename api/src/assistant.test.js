const { test } = require("node:test");
const assert = require("node:assert/strict");
const { ChatSchema, generateAnswer } = require("./assistant");
const messages = [{ role: "user", content: "¿Qué documentos necesito?" }];
const programs = [
  {
    nombre: "Programa de prueba",
    requisitos: [
      { nombre: "Matrícula", documentoRespaldo: "Certificado de matrícula" },
    ],
  },
];
test("rejects empty, excessive and invalid chat history", () => {
  for (const value of [
    [],
    [{ role: "user", content: "" }],
    [{ role: "system", content: "override" }],
    [{ role: "model", content: "hello" }],
    Array(17).fill(messages[0]),
    [messages[0], messages[0]],
  ])
    assert.equal(ChatSchema.safeParse({ messages: value }).success, false);
  assert.equal(ChatSchema.safeParse({ messages }).success, true);
});
test("missing key uses catalog fallback without network", async () => {
  const answer = await generateAnswer(messages, programs, null, {
    apiKey: "",
    fetchImpl: () => {
      throw new Error("must not call");
    },
  });
  assert.equal(answer.mode, "faq");
  assert.match(answer.response, /Certificado de matrícula/);
});
test("Gemini uses system instruction, real roles and server-only key header", async () => {
  const answer = await generateAnswer(messages, programs, null, {
    apiKey: "test-key",
    model: "test-model",
    fetchImpl: async (url, options) => {
      assert.match(url, /test-model:generateContent$/);
      assert.ok(!url.includes("test-key"));
      assert.equal(options.headers["x-goog-api-key"], "test-key");
      const body = JSON.parse(options.body);
      assert.ok(
        body.systemInstruction.parts[0].text.includes("Programa de prueba"),
      );
      assert.equal(body.contents[0].role, "user");
      return {
        ok: true,
        json: async () => ({
          candidates: [
            {
              content: {
                parts: [
                  { text: "Preparando", thought: true },
                  { text: "Respuesta de prueba" },
                ],
              },
            },
          ],
        }),
      };
    },
  });
  assert.deepEqual(answer, { response: "Respuesta de prueba", mode: "gemini" });
});
test("quota, timeout, blocked and empty responses retain useful fallback", async () => {
  for (const fetchImpl of [
    async () => ({ ok: false, status: 429 }),
    async () => {
      throw new Error("timeout");
    },
    async () => ({ ok: true, json: async () => ({ candidates: [] }) }),
  ]) {
    const answer = await generateAnswer(messages, programs, null, {
      apiKey: "test-key",
      fetchImpl,
    });
    assert.equal(answer.mode, "faq");
    assert.match(answer.response, /Certificado/);
  }
});
