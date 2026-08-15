import { GoogleGenAI } from '@google/genai'
import { callWithRetry } from './retry'

const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY })

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
  return callWithRetry(async () => {
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
  })
}
