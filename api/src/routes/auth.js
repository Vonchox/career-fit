const express = require("express");
const { z } = require("zod");
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const prisma = require("../db");

const router = express.Router();

const RegisterSchema = z.object({
  nombre: z.string().trim().min(1, "Nombre es requerido").max(100),
  email: z.string().trim().toLowerCase().email("Email inválido").max(254),
  password: z
    .string()
    .min(6, "La contraseña debe tener al menos 6 caracteres")
    .max(128),
});

const LoginSchema = z.object({
  email: z.string().trim().toLowerCase().email("Email inválido").max(254),
  password: z.string().min(1, "Contraseña requerida").max(128),
});

router.post("/register", async (req, res) => {
  try {
    const { nombre, email, password } = RegisterSchema.parse(req.body);

    const existingUser = await prisma.usuario.findUnique({ where: { email } });
    if (existingUser) {
      return res.status(400).json({ error: "El email ya está registrado" });
    }

    const salt = await bcrypt.genSalt(10);
    const passwordHash = await bcrypt.hash(password, salt);

    const newUser = await prisma.usuario.create({
      data: { nombre, email, passwordHash },
    });

    const token = jwt.sign(
      { userId: newUser.id },
      process.env.JWT_SECRET || "super-secret-key-for-dev",
      { expiresIn: "7d" },
    );

    res.json({
      token,
      user: { id: newUser.id, nombre: newUser.nombre, email: newUser.email },
    });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return res.status(400).json({ error: error.issues[0].message });
    }
    console.error(error);
    res.status(500).json({ error: "Error interno del servidor" });
  }
});

router.post("/login", async (req, res) => {
  try {
    const { email, password } = LoginSchema.parse(req.body);

    const user = await prisma.usuario.findUnique({ where: { email } });
    if (!user || !user.passwordHash) {
      return res.status(400).json({ error: "Credenciales inválidas" });
    }

    const isMatch = await bcrypt.compare(password, user.passwordHash);
    if (!isMatch) {
      return res.status(400).json({ error: "Credenciales inválidas" });
    }

    const token = jwt.sign(
      { userId: user.id },
      process.env.JWT_SECRET || "super-secret-key-for-dev",
      { expiresIn: "7d" },
    );

    res.json({
      token,
      user: {
        id: user.id,
        nombre: user.nombre,
        email: user.email,
        googleLinked: Boolean(user.googleSub),
      },
    });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return res.status(400).json({ error: error.issues[0].message });
    }
    console.error(error);
    res.status(500).json({ error: "Error interno del servidor" });
  }
});

module.exports = router;
