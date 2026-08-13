import { GoogleGenAI } from '@google/genai'
import type { RetrievedChunk } from '@/lib/supabase/rag/retrieve'

const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY })

export interface GeneratedQuestion {
  question_text: string
  question_format: 'multiple_choice' | 'desarrollo'
  options?: string[]
  correct_answer: string
  source_page?: number
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
      ? `Generá 4 preguntas de opción múltiple (Multiple Choice). Para cada pregunta proveé "question_text", un array de 4 "options", la respuesta correcta exacta en "correct_answer", y la página de origen en "source_page".`
      : `Generá 3 preguntas de desarrollo conceptual. Para cada pregunta proveé "question_text", en "correct_answer" una lista detallada de los PUNTOS CLAVE O CRITERIOS que debe contener la respuesta para que el alumno pueda autoevaluarse, y "source_page". NO incluyas "options".`

  const styleInstruction = examStyleText
    ? `\nFORMATO Y ESTILO DE REFERENCIA (Examen anterior):\nUsá el estilo de redacción y tono de las siguientes preguntas de examen de muestra como guía para el formato (sin copiar el contenido textual):\n${examStyleText.slice(0, 1000)}\n`
    : ''

  const prompt = `Sos un profesor universitario experto elaborando un parcial evaluativo para estudiantes ingresantes.

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
    "options": ["A) ...", "B) ...", "C) ...", "D) ..."], // Solo si es multiple_choice
    "correct_answer": "...",
    "source_page": 1
  }
]`

  const response = await ai.models.generateContent({
    model: 'gemini-3.6-flash',
    contents: prompt,
    config: {
      responseMimeType: 'application/json',
      temperature: 0.2,
    },
  })

  const jsonText = response.text ?? '[]'
  try {
    const parsed = JSON.parse(jsonText)
    return Array.isArray(parsed) ? parsed : []
  } catch (err) {
    console.error('Error parseando preguntas del quiz:', err, jsonText)
    return []
  }
}
