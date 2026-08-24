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

// Chatbot endpoint
app.post('/api/chat', authMiddleware, async (req, res) => {
  try {
    const { messages } = req.body;
    
    if (!messages || !Array.isArray(messages)) {
      return res.status(400).json({ error: 'Formato de mensajes inválido' });
    }

    if (!process.env.GEMINI_API_KEY) {
      return res.json({ 
        response: 'Lo siento, el asistente virtual no está disponible porque no se ha configurado la clave de IA.' 
      });
    }

    const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);
    const model = genAI.getGenerativeModel({ model: 'gemini-1.5-flash' });

    // Build the system context
    const systemInstruction = `
      Eres el Asistente Virtual Oficial de "Career-Fit", la plataforma de movilidad académica de la Universidad de las Fuerzas Armadas ESPE (campus Sangolquí).
      Tu tono debe ser amable, institucional y muy preciso.
      
      Conocimiento Base Oficial de la ESPE:
      - Requisito de Suficiencia de Inglés: Es un requisito obligatorio de titulación para pregrado y de ingreso para posgrado.
      - Nivel Requerido: B2 (Intermedio Alto) según el MCER.
      - Departamento encargado: Departamento de Lenguas (antes Instituto de Idiomas).
      - Contacto de idiomas: idiomas@espe.edu.ec, Teléfono: (02) 3989-400 (Ext. 1511 para Unidad de Registro; Ext. 4600 para gestión académica).
      - Certificación: Se debe solicitar la "Certificación de Niveles Aprobados" a través de la Unidad de Registro.
      - Posgrados y Externos: Pueden rendir el Examen Oxford, reconocido internacionalmente.
      - Trámites de Movilidad: Los estudiantes deben revisar siempre el sistema BANNER o ESPEMATICO.
      - Promedio mínimo general para movilidad internacional suele ser 16/20.
      
      Usa esta información para responder las preguntas del estudiante. Si te preguntan algo fuera de este contexto académico, declina educadamente la pregunta.
      Responde de forma concisa y estructurada (usa viñetas si ayuda).
    `;

    // Convert messages for Gemini format
    const history = messages.map(msg => ({
      role: msg.role === 'user' ? 'user' : 'model',
      parts: [{ text: msg.content }]
    }));

    const chat = model.startChat({
      history: [
        { role: 'user', parts: [{ text: systemInstruction }] },
        { role: 'model', parts: [{ text: 'Entendido. Actuaré como el Asistente Virtual de Career-Fit de la ESPE basándome en esa información oficial.' }] },
        ...history.slice(0, -1) // All except the latest message
      ]
    });

    const latestMessage = messages[messages.length - 1].content;
    const result = await chat.sendMessage(latestMessage);
    const responseText = result.response.text();

    res.json({ response: responseText });
    
  } catch (error) {
    console.error("Error en Chatbot:", error);
    res.status(500).json({ error: 'Error interno del servidor al procesar el chat' });
  }
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`API running on http://localhost:${PORT}`);
});
