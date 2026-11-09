require("dotenv").config({
  path: require("node:path").join(__dirname, ".env"),
  quiet: true,
});
const express = require("express");
const { z } = require("zod");
const cors = require("cors");
const prisma = require("./src/db");
const authRoutes = require("./src/routes/auth");
const authMiddleware = require("./src/middlewares/authMiddleware");
const { evaluateRequirements, summarize } = require("./src/evaluation");
const { ChatSchema, generateAnswer } = require("./src/assistant");
const { fallbackAnswer } = require("./src/assistant");
const { catalog, programInfo, institutionIds } = require("./src/catalog");
const { createGoogleRouter } = require("./src/routes/google");
const {
  evaluateOpportunity,
  listOpportunities,
  opportunityIds,
} = require("./src/opportunities");
const answerFields = {
  tieneRecordAcademico: z.boolean().default(false),
  tieneCertificadoMatricula: z.boolean().default(false),
  tieneCartaMotivacion: z.boolean().default(false),
  tieneFormularioAplicacion: z.boolean().default(false),
  tieneInvitacion: z.boolean().default(false),
  tieneSolicitudApoyo: z.boolean().default(false),
  tienePresupuesto: z.boolean().default(false),
  tieneCartaCompromiso: z.boolean().default(false),
};
const EstudianteSchema = z.object({
  carrera: z
    .string()
    .trim()
    .min(1, "La carrera es requerida")
    .max(150)
    .optional(),
  semestre: z.number().int().min(1).max(20).optional(),
  promedio: z.number().min(0).max(20).optional(),
  creditosMatriculados: z.number().int().min(0).max(1000).optional(),
  tieneConvenioOInvitacion: z.boolean().default(false),
  tieneResolucionConsejoCarrera: z.boolean().default(false),
  tieneCertificadoB2: z.boolean().default(false),
  tipoMovilidadId: z.string().uuid(),
  ...answerFields,
});
function recordResponse(record) {
  const detail = JSON.parse(record.detalle);
  if (detail.kind === "eligibility") return detail;
  return {
    evaluacionId: record.id,
    fecha: record.fecha,
    resultado: record.resultado,
    esViable: record.resultado === "viable",
    requisitos: detail,
    tipoMovilidad: programInfo({
      id: record.tipoMovilidad.id,
      nombre: record.tipoMovilidad.nombre,
      ambito: record.tipoMovilidad.ambito,
      institution: record.tipoMovilidad.institution,
    }),
  };
}
function createApp({ database = prisma, answer = generateAnswer } = {}) {
  const app = express();
  const origins = process.env.CORS_ORIGIN?.split(",").map((s) => s.trim());
  app.use(cors(origins ? { origin: origins } : {}));
  app.use(express.json({ limit: "100kb" }));
  app.use("/api/auth", authRoutes);
  app.use("/api/auth", createGoogleRouter({ database }));
  app.get("/api/instituciones", (req, res) => res.json(catalog.institutions));
  app.get("/api/convocatorias", (req, res) => {
    res.set("Cache-Control", "no-store").json(listOpportunities());
  });
  app.get("/api/health", async (req, res, next) => {
    try {
      await database.$queryRaw`SELECT 1`;
      res.json({ status: "ok" });
    } catch (error) {
      next(error);
    }
  });
  app.get("/api/tipos-movilidad", async (req, res, next) => {
    try {
      const institution = z
        .enum(institutionIds)
        .optional()
        .parse(req.query.institution);
      res.json(
        (
          await database.tipoMovilidad.findMany({
            where: {
              institution: institution || { in: institutionIds },
              id: { notIn: opportunityIds },
            },
            include: { requisitos: true },
            orderBy: { nombre: "asc" },
          })
        ).map(programInfo),
      );
    } catch (error) {
      next(error);
    }
  });
  app.get("/api/evaluaciones", authMiddleware, async (req, res, next) => {
    try {
      const records = await database.evaluacion.findMany({
        where: { usuarioId: req.user.userId },
        include: { tipoMovilidad: true },
        orderBy: { fecha: "desc" },
        take: 50,
      });
      res.json(records.map(recordResponse));
    } catch (error) {
      next(error);
    }
  });
  app.post("/api/evaluar", authMiddleware.optional, async (req, res, next) => {
    try {
      if (req.body?.convocatoriaId !== undefined) {
        const result = evaluateOpportunity(req.body);
        if (result.error)
          return res.status(result.status).json({ error: result.error });
        if (!req.user) return res.json({ ...result, guest: true });

        const { id, institution, nombre, descripcion, ambito } =
          result.tipoMovilidad;
        await database.evaluacion.create({
          data: {
            id: result.evaluacionId,
            fecha: new Date(result.fecha),
            resultado: result.resultado,
            detalle: JSON.stringify(result),
            usuario: { connect: { id: req.user.userId } },
            estudiante: {
              create: {
                tieneConvenioOInvitacion: false,
                tieneResolucionConsejoCarrera: false,
              },
            },
            tipoMovilidad: {
              connectOrCreate: {
                where: { id },
                create: { id, institution, nombre, descripcion, ambito },
              },
            },
          },
        });
        return res.json(result);
      }
      const form = EstudianteSchema.parse(req.body);
      const program = await database.tipoMovilidad.findUnique({
        where: { id: form.tipoMovilidadId },
        include: { requisitos: true },
      });
      if (!program)
        return res.status(404).json({ error: "No encontramos ese programa." });
      const requirements = evaluateRequirements(program, form),
        result = summarize(requirements);
      if (!req.user) {
        if (!institutionIds.includes(program.institution))
          return res.status(404).json({
            error: "Este programa ya no forma parte del catálogo público.",
          });
        return res.json({
          evaluacionId: require("node:crypto").randomUUID(),
          fecha: new Date().toISOString(),
          resultado: result,
          esViable: result === "viable",
          requisitos: requirements,
          tipoMovilidad: programInfo(program),
          guest: true,
          answers: form,
        });
      }
      const { tipoMovilidadId } = form;
      const studentData = Object.fromEntries(
        [
          "carrera",
          "semestre",
          "promedio",
          "creditosMatriculados",
          "tieneConvenioOInvitacion",
          "tieneResolucionConsejoCarrera",
        ]
          .filter((key) => form[key] !== undefined)
          .map((key) => [key, form[key]]),
      );
      const record = await database.evaluacion.create({
        data: {
          resultado: result,
          detalle: JSON.stringify(requirements),
          usuario: { connect: { id: req.user.userId } },
          estudiante: { create: studentData },
          tipoMovilidad: { connect: { id: tipoMovilidadId } },
        },
        include: { tipoMovilidad: true },
      });
      res.json(recordResponse(record));
    } catch (error) {
      next(error);
    }
  });
  const chatLimits = new Map();
  app.post("/api/chat", authMiddleware.optional, async (req, res, next) => {
    try {
      const body = ChatSchema.parse(req.body);
      const now = Date.now();
      for (const [key, value] of chatLimits)
        if (value.expires < now) chatLimits.delete(key);
      const limitKey = req.user?.userId || `guest:${req.ip}`;
      const limit = chatLimits.get(limitKey) || {
        count: 0,
        expires: now + 15 * 60 * 1000,
      };
      if (limit.count >= 30)
        return res.status(429).json({
          error:
            "Has alcanzado el límite de consultas. Inténtalo en unos minutos.",
        });
      limit.count++;
      chatLimits.set(limitKey, limit);
      let evaluation = null;
      if (body.evaluationId) {
        if (!req.user)
          return res.status(401).json({
            error: "Inicia sesión para consultar una evaluación guardada.",
          });
        const record = await database.evaluacion.findFirst({
          where: { id: body.evaluationId, usuarioId: req.user.userId },
          include: { tipoMovilidad: true },
        });
        if (!record)
          return res
            .status(404)
            .json({ error: "No encontramos esa evaluación en tu cuenta." });
        evaluation = recordResponse(record);
      }
      const programId = evaluation?.tipoMovilidad.id || body.programId;
      const programs = await database.tipoMovilidad.findMany({
        where: programId
          ? { id: programId }
          : { institution: body.institution || { in: institutionIds } },
        include: { requisitos: true },
      });
      if (programId && !programs.length)
        return res.status(404).json({ error: "No encontramos ese programa." });
      if (
        !evaluation &&
        body.guestAnswers &&
        programId &&
        programs.length === 1
      ) {
        const form = EstudianteSchema.parse({
          ...body.guestAnswers,
          tipoMovilidadId: programId,
        });
        const requisitos = evaluateRequirements(programs[0], form);
        evaluation = { resultado: summarize(requisitos), requisitos };
      }
      if (!req.user) {
        if (programs.some((p) => !institutionIds.includes(p.institution)))
          return res.status(404).json({
            error: "Este programa ya no está en el catálogo público.",
          });
        return res.json({
          response: fallbackAnswer(
            body.messages.at(-1).content,
            programs,
            evaluation,
          ),
          mode: "guide",
        });
      }
      res.json(await answer(body.messages, programs, evaluation));
    } catch (error) {
      next(error);
    }
  });
  app.use((error, req, res, next) => {
    if (error instanceof z.ZodError)
      return res.status(400).json({ error: error.issues });
    if (error.type === "entity.parse.failed")
      return res
        .status(400)
        .json({ error: "El cuerpo de la solicitud no es JSON válido." });
    if (error.type === "entity.too.large")
      return res
        .status(413)
        .json({ error: "La solicitud es demasiado grande." });
    console.error("API error:", error.code || error.name);
    res.status(500).json({
      error: "No pudimos completar la solicitud. Inténtalo de nuevo.",
    });
  });
  return app;
}
if (require.main === module) {
  if (process.env.NODE_ENV === "production" && !process.env.JWT_SECRET)
    throw new Error("JWT_SECRET is required in production.");
  const port = process.env.PORT || 3000;
  createApp().listen(port, () =>
    console.log(`Career-Fit API: http://localhost:${port}`),
  );
}
module.exports = { createApp };
