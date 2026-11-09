const { PrismaClient } = require("../generated/prisma");
module.exports = new PrismaClient(
  process.env.DATABASE_URL ? { datasourceUrl: process.env.DATABASE_URL } : {},
);
