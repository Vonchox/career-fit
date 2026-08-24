const express = require('express');
const { z } = require('zod');
const cors = require('cors');
const { PrismaClient } = require('./generated/prisma');
const { GoogleGenerativeAI } = require('@google/generative-ai');
require('dotenv').config();

const authRoutes = require('./src/routes/auth');
const authMiddleware = require('./src/middlewares/authMiddleware');

const prisma = new PrismaClient();
const app = express();

app.use(cors());
app.use(express.json());

app.use('/api/auth', authRoutes);

// Validation schema for Estudiante
const EstudianteSchema = z.object({
  carrera: z.string().min(1, "Carrera es requerida"),
  semestre: z.number().min(1).max(20),
  promedio: z.number().min(0).max(20),
  creditosMatriculados: z.number().min(0),
  tieneConvenioOInvitacion: z.boolean(),
  tieneResolucionConsejoCarrera: z.boolean(),
  tipoMovilidadId: z.string().uuid()
});

app.get('/api/tipos-movilidad', async (req, res) => {
  try {
    const tipos = await prisma.tipoMovilidad.findMany();
    res.json(tipos);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Error al obtener tipos de movilidad' });
  }
});

app.post('/api/evaluar', authMiddleware, async (req, res) => {
  try {
    const parsedData = EstudianteSchema.parse(req.body);
    
    // Evaluate logic
    const { tipoMovilidadId, ...estudianteData } = parsedData;
    
    // 1. Fetch requirements for this mobility type
    const tipoMovilidad = await prisma.tipoMovilidad.findUnique({
      where: { id: tipoMovilidadId },
      include: { requisitos: true }
    });

    if (!tipoMovilidad) {
      return res.status(404).json({ error: 'Tipo de movilidad no encontrado' });
    }

    // 2. Evaluate each requirement dynamically
    const resultadosRequisitos = tipoMovilidad.requisitos.map(req => {
      const campo = req.condicionCampo;
      const operador = req.condicionOperador;
      const valorEsperado = req.condicionValor;
      
      let cumplido = false;
      const valorEstudiante = estudianteData[campo];
      
      if (valorEstudiante !== undefined && operador && valorEsperado !== null) {
        // Parse expected value based on type of student value
        let parsedValorEsperado;
        if (typeof valorEstudiante === 'boolean') {
          parsedValorEsperado = valorEsperado === 'true';
        } else if (typeof valorEstudiante === 'number') {
          parsedValorEsperado = parseFloat(valorEsperado);
        } else {
          parsedValorEsperado = valorEsperado;
        }

        switch (operador) {
          case '>=':
            cumplido = valorEstudiante >= parsedValorEsperado;
            break;
          case '<=':
            cumplido = valorEstudiante <= parsedValorEsperado;
            break;
          case '==':
            cumplido = valorEstudiante === parsedValorEsperado;
            break;
          case '>':
            cumplido = valorEstudiante > parsedValorEsperado;
            break;
          case '<':
            cumplido = valorEstudiante < parsedValorEsperado;
            break;
          default:
            cumplido = false;
        }
      }

      return {
        id: req.id,
        nombre: req.nombre,
        descripcion: req.descripcion,
        documentoRespaldo: req.documentoRespaldo,
        articuloReglamento: req.articuloReglamento,
        cumplido,
        valorEstudiante
      };
    });

    const esViable = resultadosRequisitos.every(r => r.cumplido);
    const resultadoTexto = esViable ? 'viable' : 'no_viable';

    // 3. Generar análisis con IA
    let aiAnalysis = null;
    try {
      const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY || 'dummy_key');
      const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash" });
      
      const prompt = `
        Actúa como un asesor académico experto de la Universidad de las Fuerzas Armadas ESPE.
        Un estudiante ha solicitado una evaluación para el tipo de movilidad: "${tipoMovilidad.nombre}".
        El resultado de la evaluación lógica es: ${esViable ? 'VIABLE' : 'NO VIABLE'}.
        
        Detalles de los requisitos:
        ${resultadosRequisitos.map(r => `- ${r.nombre}: ${r.cumplido ? 'Cumple' : 'No cumple'} (Valor reportado: ${r.valorEstudiante !== undefined ? r.valorEstudiante : 'N/A'})`).join('\n')}
        
        Escribe una respuesta corta y muy profesional en formato Markdown dirigida al estudiante.
        Usa un tono institucional, empático y claro.
        Si es viable, felicítalo y dale siguientes pasos generales.
        Si no es viable, indícale qué requisitos le faltan de forma clara y motívalo a alcanzarlos.
      `;
      
      if (process.env.GEMINI_API_KEY) {
        const result = await model.generateContent(prompt);
        aiAnalysis = result.response.text();
      } else {
        aiAnalysis = `*Nota: API Key de IA no configurada. Este es un análisis simulado.*\n\nEstimado estudiante, hemos analizado su perfil para **${tipoMovilidad.nombre}** y el resultado preliminar es **${esViable ? 'VIABLE' : 'NO VIABLE'}**.\n\n${esViable ? '¡Felicidades! Cumple con los requisitos establecidos. Por favor, acérquese a la unidad de movilidad para continuar su proceso.' : 'Actualmente no cumple con todos los requisitos. Le invitamos a revisar el detalle y seguir esforzándose.'}`;
      }
    } catch (aiError) {
      console.error("Error al generar análisis de IA:", aiError);
      aiAnalysis = "No se pudo generar el análisis avanzado con IA en este momento. Por favor revise el resumen manual.";
    }

    // 4. Save evaluation (and student data)
    const evaluacion = await prisma.evaluacion.create({
      data: {
        resultado: resultadoTexto,
        detalle: JSON.stringify(resultadosRequisitos),
        aiAnalysis,
        usuario: {
          connect: { id: req.user.userId }
        },
        estudiante: {
          create: estudianteData
        },
        tipoMovilidad: {
          connect: { id: tipoMovilidadId }
        }
      }
    });

    // 5. Return response
    res.json({
      esViable,
      resultado: resultadoTexto,
      evaluacionId: evaluacion.id,
      aiAnalysis,
      requisitos: resultadosRequisitos,
      tipoMovilidad: {
        nombre: tipoMovilidad.nombre,
        ambito: tipoMovilidad.ambito
      }
    });

  } catch (error) {
    if (error instanceof z.ZodError) {
      return res.status(400).json({ error: error.errors });
    }
    console.error(error);
    res.status(500).json({ error: 'Error interno del servidor' });
  }
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`API running on http://localhost:${PORT}`);
});
