import { GoogleGenAI } from '@google/genai'
import { callWithRetry } from './retry'
import type { RetrievedChunk } from '@/lib/supabase/rag/retrieve'

const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY })

const MODEL_FALLBACK_CHAIN = [
  'gemini-3.6-flash',
  'gemini-flash-latest',
  'gemini-3.7-flash-video-understanding-eap',
]

export interface GeneratedFlashcard {
  front_text: string
  back_text: string
  source_page?: number | null
}

export async function generateFlashcardsFromChunks(
  chunks: RetrievedChunk[],
  topicTitle?: string
): Promise<GeneratedFlashcard[]> {
  if (chunks.length === 0) return []

  const contextText = chunks
    .map((c) => `[Pág. ${c.page_number ?? 'N/A'}] ${c.content}`)
    .join('\n\n')

  const prompt = `Sos un pedagogo universitario de élite especializado en técnicas de recuperación activa (Active Recall y Spaced Repetition estilo Anki/NotebookLM).

${topicTitle ? `TEMA ESPECÍFICO A ENFOCAR: "${topicTitle}"` : 'TEMA: CONTENIDOS CLAVE DE LA MATERIA'}

<BIBLIOGRAFIA_OFICIAL>
${contextText}
</BIBLIOGRAFIA_OFICIAL>

CONSIGNA:
Generá entre 6 y 8 tarjetas didácticas de alto valor conceptual para preparar al estudiante para exámenes universitarios.
- "front_text": Pregunta directa, definición desafiante o caso práctico corto (de 1 a 2 líneas).
- "back_text": Explicación sintética, rigurosa y directa con los puntos clave, fórmulas o diferencias fundamentales.
- "source_page": Número de página de la cita correspondiente.

Respondé ÚNICAMENTE con un JSON válido estructurado como:
[
  {
    "front_text": "¿Cuál es la diferencia fundamental entre abstracción y encapsulamiento?",
    "back_text": "La abstracción oculta la complejidad mostrando solo lo esencial, mientras que el encapsulamiento restringe el acceso directo a los datos internos protegiendo el estado.",
    "source_page": 1
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
            temperature: 0.3,
          },
        })

        const jsonText = response.text ?? '[]'
        const parsed = JSON.parse(jsonText)
        return Array.isArray(parsed) ? parsed : []
      })
    } catch (err) {
      console.warn(`Fallback Flashcards en modelo ${modelName} falló:`, err)
      lastError = err
    }
  }

  console.error('Error generando tarjetas con cadena de modelos Gemini:', lastError)
  return []
}
