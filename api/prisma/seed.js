const { PrismaClient } = require('../generated/prisma');
require('dotenv').config();

const prisma = new PrismaClient();

async function main() {
  console.log('Starting seed...');
  // Clear existing
  await prisma.evaluacion.deleteMany();
  await prisma.estudiante.deleteMany();
  await prisma.tipoMovilidad.deleteMany();
  await prisma.requisito.deleteMany();

  // Create Internacional
  const inter = await prisma.tipoMovilidad.create({
    data: {
      nombre: 'Movilidad Académica Internacional',
      descripcion: 'Programa de movilidad en universidades del extranjero.',
      ambito: 'internacional',
    }
  });

  // Create Nacional
  const nac = await prisma.tipoMovilidad.create({
    data: {
      nombre: 'Movilidad Académica Nacional',
      descripcion: 'Programa de movilidad en universidades nacionales.',
      ambito: 'nacional',
    }
  });

  // Requirements Based on Art 29-30 (simplified for demo)
  await prisma.requisito.create({
    data: {
      nombre: 'Promedio Mínimo',
      descripcion: 'Tener un promedio acumulado mínimo de 16/20',
      documentoRespaldo: 'Récord Académico',
      articuloReglamento: 'Art. 29',
      condicionCampo: 'promedio',
      condicionOperador: '>=',
      condicionValor: '16',
      tiposMovilidad: { connect: [{ id: inter.id }, { id: nac.id }] }
    }
  });

  await prisma.requisito.create({
    data: {
      nombre: 'Nivel Mínimo',
      descripcion: 'Haber aprobado al menos el tercer nivel de la carrera',
      documentoRespaldo: 'Certificado de Matrícula',
      articuloReglamento: 'Art. 29',
      condicionCampo: 'semestre',
      condicionOperador: '>=',
      condicionValor: '4', 
      tiposMovilidad: { connect: [{ id: inter.id }, { id: nac.id }] }
    }
  });

  await prisma.requisito.create({
    data: {
      nombre: 'Estudiante Regular',
      descripcion: 'Estar matriculado en un mínimo de 15 créditos',
      documentoRespaldo: 'Certificado de Matrícula',
      articuloReglamento: 'Art. 29',
      condicionCampo: 'creditosMatriculados',
      condicionOperador: '>=',
      condicionValor: '15',
      tiposMovilidad: { connect: [{ id: inter.id }, { id: nac.id }] }
    }
  });

  await prisma.requisito.create({
    data: {
      nombre: 'Convenio o Invitación',
      descripcion: 'Contar con un convenio, invitación o reconocimiento a un evento',
      documentoRespaldo: 'Carta de Invitación / Convenio',
      articuloReglamento: 'Art. 29',
      condicionCampo: 'tieneConvenioOInvitacion',
      condicionOperador: '==',
      condicionValor: 'true',
      tiposMovilidad: { connect: [{ id: inter.id }, { id: nac.id }] }
    }
  });

  await prisma.requisito.create({
    data: {
      nombre: 'Resolución de Consejo de Carrera',
      descripcion: 'Tener aprobada la movilidad por el Consejo de Carrera',
      documentoRespaldo: 'Resolución del Consejo',
      articuloReglamento: 'Art. 30',
      condicionCampo: 'tieneResolucionConsejoCarrera',
      condicionOperador: '==',
      condicionValor: 'true',
      tiposMovilidad: { connect: [{ id: inter.id }, { id: nac.id }] }
    }
  });

  console.log('Seed completed successfully!');
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
