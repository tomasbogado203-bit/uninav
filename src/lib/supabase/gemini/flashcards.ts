import { GoogleGenAI } from '@google/genai'
import { callWithRetry } from './retry'
import type { RetrievedChunk } from '@/lib/supabase/rag/retrieve'

const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY })

export interface GeneratedFlashcard {
  front_text: string
  back_text: string
  source_page?: number | null
}

export async function generateFlashcardsFromChunks(
  chunks: RetrievedChunk[]
): Promise<GeneratedFlashcard[]> {
  if (chunks.length === 0) return []

  const contextText = chunks
    .map((c) => `[Pág. ${c.page_number ?? 'N/A'}] ${c.content}`)
    .join('\n\n')

  const prompt = `Sos un experto pedagógico universitario creando tarjetas didácticas (Flashcards estilo NotebookLM) para que los estudiantes repasen de forma activa.

<BIBLIOGRAFIA_MATERIA>
${contextText}
</BIBLIOGRAFIA_MATERIA>

CONSIGNA:
Generá 6 tarjetas didácticas sintéticas de alta efectividad conceptual basadas en el texto.
Cada tarjeta tiene:
- "front_text": Un concepto clave o pregunta directa corta que desafíe al estudiante.
- "back_text": La explicación sintética, clara y fundamentada con viñetas o frases concisas.
- "source_page": Número de página de origen si está disponible.

Respondé ÚNICAMENTE con un JSON válido de la siguiente forma:
[
  {
    "front_text": "¿Qué establece la Segunda Ley de la Termodinámica?",
    "back_text": "Establece que la entropía de un sistema aislado siempre aumenta en un proceso espontáneo, definiendo la irreversibilidad.",
    "source_page": 4
  }
]`

  return callWithRetry(async () => {
    const response = await ai.models.generateContent({
      model: 'gemini-3.6-flash',
      contents: prompt,
      config: {
        responseMimeType: 'application/json',
        temperature: 0.3,
      },
    })

    const jsonText = response.text ?? '[]'
    try {
      const parsed = JSON.parse(jsonText)
      return Array.isArray(parsed) ? parsed : []
    } catch {
      return []
    }
  })
}
