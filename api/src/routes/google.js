const express = require("express");
const jwt = require("jsonwebtoken");
const { randomUUID } = require("node:crypto");
const { z } = require("zod");
const { OAuth2Client } = require("google-auth-library");
const auth = require("../middlewares/authMiddleware");
const credentials = z.object({
  credential: z.string().min(1).max(16000),
  challenge: z.string().min(1).max(4000),
});
function createGoogleRouter({
  database,
  clientId = process.env.GOOGLE_CLIENT_ID,
  verifyGoogle,
} = {}) {
  const router = express.Router(),
    client = new OAuth2Client();
  const secret = () => process.env.JWT_SECRET || "super-secret-key-for-dev";
  router.get("/config", (req, res) =>
    res.json({ googleClientId: clientId || null }),
  );
  router.get("/google/challenge", (req, res) => {
    res.set("Cache-Control", "no-store");
    if (!clientId)
      return res
        .status(503)
        .json({ error: "Google no está disponible por el momento." });
    const nonce = randomUUID();
    res.json({
      nonce,
      challenge: jwt.sign({ nonce }, secret(), {
        audience: "google-signin",
        expiresIn: "5m",
      }),
    });
  });
  const check = async (req, res, next) => {
    if (!clientId)
      return res
        .status(503)
        .json({
          error:
            "Google no está disponible por el momento. Puedes continuar sin cuenta.",
        });
    const parsed = credentials.safeParse(req.body);
    if (!parsed.success)
      return res
        .status(400)
        .json({ error: "La respuesta de Google no es válida." });
    try {
      const challenge = jwt.verify(parsed.data.challenge, secret(), {
        audience: "google-signin",
      });
      const payload = verifyGoogle
        ? await verifyGoogle(parsed.data.credential, clientId)
        : (
            await client.verifyIdToken({
              idToken: parsed.data.credential,
              audience: clientId,
            })
          ).getPayload();
      if (
        !payload?.sub ||
        !payload.email ||
        payload.email_verified !== true ||
        payload.nonce !== challenge.nonce
      )
        throw new Error("Invalid identity");
      req.googleIdentity = {
        sub: payload.sub,
        email: payload.email.toLowerCase(),
        nombre: (payload.name || payload.email.split("@")[0]).slice(0, 100),
      };
      next();
    } catch {
      res
        .status(401)
        .json({
          error:
            "No pudimos verificar tu acceso con Google. Inténtalo de nuevo.",
        });
    }
  };
  function respond(res, user) {
    res.json({
      token: jwt.sign({ userId: user.id }, secret(), { expiresIn: "7d" }),
      user: {
        id: user.id,
        nombre: user.nombre,
        email: user.email,
        googleLinked: Boolean(user.googleSub),
      },
    });
  }
  router.post("/google", check, async (req, res, next) => {
    try {
      const identity = req.googleIdentity;
      let user = await database.usuario.findUnique({
        where: { googleSub: identity.sub },
      });
      if (!user) {
        const existing = await database.usuario.findUnique({
          where: { email: identity.email },
        });
        if (existing)
          return res
            .status(409)
            .json({
              error:
                "Este correo ya tiene cuenta. Entra con tu contraseña y vincula Google desde Mi cuenta.",
            });
        user = await database.usuario.create({
          data: {
            nombre: identity.nombre,
            email: identity.email,
            googleSub: identity.sub,
          },
        });
      }
      respond(res, user);
    } catch (error) {
      if (error.code === "P2002")
        return res
          .status(409)
          .json({ error: "La cuenta ya existe. Vuelve a iniciar sesión." });
      next(error);
    }
  });
  router.post("/google/link", auth, check, async (req, res, next) => {
    try {
      const user = await database.usuario.findUnique({
          where: { id: req.user.userId },
        }),
        identity = req.googleIdentity;
      if (!user || user.email.toLowerCase() !== identity.email)
        return res
          .status(409)
          .json({
            error:
              "Selecciona la cuenta de Google con el mismo correo de tu cuenta de Career-Fit.",
          });
      if (user.googleSub && user.googleSub !== identity.sub)
        return res
          .status(409)
          .json({
            error: "Esta cuenta ya está vinculada a otro acceso de Google.",
          });
      const linked = await database.usuario.findUnique({
        where: { googleSub: identity.sub },
      });
      if (linked && linked.id !== user.id)
        return res
          .status(409)
          .json({
            error: "Este acceso de Google ya está vinculado a otra cuenta.",
          });
      respond(
        res,
        await database.usuario.update({
          where: { id: user.id },
          data: { googleSub: identity.sub },
        }),
      );
    } catch (error) {
      next(error);
    }
  });
  return router;
}
module.exports = { createGoogleRouter };
