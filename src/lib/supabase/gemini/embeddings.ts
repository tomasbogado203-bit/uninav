import { GoogleGenAI } from '@google/genai'

const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY })

// Coincide con vector(1536) en document_chunks. gemini-embedding-001 sale
// nativo en 3072 — al truncar a 1536 hay que renormalizar (L2) a mano,
// el modelo no lo hace solo salvo que uses la dimensión completa.
function l2Normalize(vec: number[]): number[] {
  const norm = Math.sqrt(vec.reduce((sum, v) => sum + v * v, 0))
  if (norm === 0) return vec
  return vec.map((v) => v / norm)
}

export type EmbeddingTaskType = 'RETRIEVAL_DOCUMENT' | 'RETRIEVAL_QUERY'

export async function embedText(
  text: string,
  taskType: EmbeddingTaskType = 'RETRIEVAL_DOCUMENT'
): Promise<number[]> {
  const result = await ai.models.embedContent({
    model: 'gemini-embedding-001',
    contents: text,
    config: {
      taskType,
      outputDimensionality: 1536,
    },
  })

  const values = result.embeddings?.[0]?.values ?? []
  return l2Normalize(values)
}
