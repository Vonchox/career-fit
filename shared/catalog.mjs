import catalog from "./catalog.json" with { type: "json" };
const institutionIds = catalog.institutions.map((i) => i.id);
function programInfo(program) {
  return {
    ...program,
    institution: program.institution || "legacy",
    institutionName:
      catalog.institutions.find((i) => i.id === program.institution)?.name ||
      "Archivo histórico",
    sourceUrl: catalog.institutions.find((i) => i.id === program.institution)
      ?.sourceUrl,
    preparationOnly: institutionIds.includes(program.institution),
  };
}

function programRequirements(programId, requirements) {
  return requirements.map((rule, index) => ({
    id: `${programId}-doc-${index}`,
    nombre: rule.nombre,
    descripcion: rule.descripcion,
    documentoRespaldo: rule.documentoRespaldo,
    articuloReglamento: "Referencia documental institucional",
    condicionCampo: rule.field,
    condicionOperador: "==",
    condicionValor: "true",
  }));
}

function listPrograms(institution) {
  return catalog.programs
    .filter((item) => !institution || item.institution === institution)
    .map(({ requirements, ...program }) =>
      programInfo({
        ...program,
        requisitos: programRequirements(program.id, requirements),
      }),
    )
    .sort((a, b) => a.nombre.localeCompare(b.nombre, "es"));
}

export {
  catalog,
  institutionIds,
  programInfo,
  programRequirements,
  listPrograms,
};
