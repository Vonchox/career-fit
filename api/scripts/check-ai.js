require("dotenv").config({
  path: require("node:path").join(__dirname, "../.env"),
  quiet: true,
});
const { generateAnswer } = require("../src/assistant");
if (process.argv.includes("--probe")) {
  const model =
    process.argv.find((arg) => arg.startsWith("--model="))?.slice(8) ||
    process.env.GEMINI_MODEL ||
    "gemini-3.1-flash-lite";
  fetch(
    `https://generativelanguage.googleapis.com/v1beta/models/${encodeURIComponent(model)}:generateContent`,
    {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "x-goog-api-key": process.env.GEMINI_API_KEY,
      },
      body: JSON.stringify({
        contents: [
          { role: "user", parts: [{ text: "Responde hola en español." }] },
        ],
        generationConfig: { maxOutputTokens: 100 },
      }),
      signal: AbortSignal.timeout(20000),
    },
  )
    .then(async (response) => {
      const data = await response.json();
      console.log(`Model: ${model}; status: ${response.status}`);
      console.log(
        data.error?.message?.replaceAll(
          process.env.GEMINI_API_KEY,
          "[redacted]",
        ) ||
          data.candidates?.[0]?.content?.parts
            ?.filter((p) => !p.thought)
            .map((p) => p.text)
            .join("") ||
          "No text returned",
      );
    })
    .catch((error) => {
      console.error(error.name);
      process.exitCode = 1;
    });
} else if (process.argv.includes("--list-models")) {
  fetch("https://generativelanguage.googleapis.com/v1beta/models", {
    headers: { "x-goog-api-key": process.env.GEMINI_API_KEY },
    signal: AbortSignal.timeout(15000),
  })
    .then(async (response) => {
      console.log(`Model catalog status: ${response.status}`);
      const data = await response.json();
      console.log(
        (data.models || [])
          .filter((m) =>
            m.supportedGenerationMethods?.includes("generateContent"),
          )
          .map((m) => m.name)
          .join("\n"),
      );
    })
    .catch(() => {
      console.error("Model catalog unavailable.");
      process.exitCode = 1;
    });
} else
  generateAnswer(
    [{ role: "user", content: "¿Cómo empiezo a usar Career-Fit?" }],
    [],
    null,
  ).then((result) => {
    console.log(`Assistant mode: ${result.mode}`);
    console.log(result.response);
    if (result.mode !== "gemini") process.exitCode = 1;
  });
