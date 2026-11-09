const {
  catalog,
  institutionIds,
  programInfo,
  programRequirements,
} = require("../../shared/catalog.mjs");
async function seedInstitutions(database) {
  for (const program of catalog.programs) {
    const { requirements, ...data } = program;
    // Existing institutional rules and all evaluations are preserved.
    await database.tipoMovilidad.upsert({
      where: { id: program.id },
      update: {},
      create: {
        ...data,
        requisitos: {
          create: programRequirements(program.id, requirements),
        },
      },
    });
  }
}
module.exports = { catalog, institutionIds, programInfo, seedInstitutions };
