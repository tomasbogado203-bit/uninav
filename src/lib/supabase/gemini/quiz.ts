import { GoogleGenAI } from '@google/genai'
import { callWithRetry } from './retry'
import type { RetrievedChunk } from '@/lib/supabase/rag/retrieve'

const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY })

const MODEL_FALLBACK_CHAIN = [
  'gemini-3.6-flash',
  'gemini-flash-latest',
  'gemini-3.7-flash-video-understanding-eap',
]

export interface GeneratedQuestion {
  question_text: string
  question_format: 'multiple_choice' | 'desarrollo'
  options?: string[]
  correct_answer: string
  source_page?: number
  explanation?: string
}

export async function generateQuizQuestions(
  quizType: 'multiple_choice' | 'desarrollo',
  chunks: RetrievedChunk[],
  examStyleText?: string
): Promise<GeneratedQuestion[]> {
  const contextText = chunks
    .map((c) => `[Pág. ${c.page_number ?? 'N/A'}] ${c.content}`)
    .join('\n\n')

  const formatInstruction =
    quizType === 'multiple_choice'
      ? `Generá 4 a 5 preguntas de opción múltiple (Multiple Choice). Para cada pregunta proveé:
- "question_text": Enunciado claro y preciso del ejercicio o concepto.
- "options": Array de 4 opciones identificadas con letras ("A) ...", "B) ...", "C) ...", "D) ...").
- "correct_answer": La opción correcta exacta (ej: "B) ...").
- "source_page": Número de página de la bibliografía de origen.
- "explanation": Breve explicación didáctica (2 líneas) justificando por qué es la opción correcta según el apunte.`
      : `Generá 3 a 4 preguntas de desarrollo conceptual. Para cada pregunta proveé:
- "question_text": Pregunta de análisis o desarrollo conceptual.
- "correct_answer": Lista estructurada en viñetas de los PUNTOS CLAVE O CRITERIOS que debe contener la respuesta ideal para que el estudiante pueda autoevaluarse con rigor.
- "source_page": Número de página de origen.
- "explanation": Criterio docente de evaluación. NO incluyas "options".`

  const styleInstruction = examStyleText
    ? `\nFORMATO Y ESTILO DE REFERENCIA (Examen anterior):\nUsá el estilo de redacción y tono de las siguientes preguntas de examen de muestra como guía para el formato (sin copiar el contenido textual):\n${examStyleText.slice(0, 1000)}\n`
    : ''

  const prompt = `Sos un profesor universitario experto elaborando un parcial evaluativo para estudiantes universitarios ingresantes.

<CONTEXTO_BIBLIOGRAFICO>
${contextText}
</CONTEXTO_BIBLIOGRAFICO>
${styleInstruction}
CONSIGNA:
${formatInstruction}

Respondé ÚNICAMENTE con un JSON válido con la siguiente estructura de array:
[
  {
    "question_text": "...",
    "question_format": "${quizType}",
    "options": ["A) ...", "B) ...", "C) ...", "D) ..."],
    "correct_answer": "...",
    "source_page": 1,
    "explanation": "..."
  }
]`

  let lastError: unknown = null

  for (const modelName of MODEL_FALLBACK_CHAIN) {
    try {
      return await callWithRetry(async () => {
        const response = await ai.models.generateContent({
          model: modelName,
          contents: prompt,
          config: {
            responseMimeType: 'application/json',
            temperature: 0.2,
          },
        })

        const jsonText = response.text ?? '[]'
        const parsed = JSON.parse(jsonText)
        return Array.isArray(parsed) ? parsed : []
      })
    } catch (err) {
      console.warn(`Fallback Quiz en modelo ${modelName} falló:`, err)
      lastError = err
    }
  }

  console.error('Error generando preguntas de quiz con cadena de modelos Gemini:', lastError)
  return []
}
