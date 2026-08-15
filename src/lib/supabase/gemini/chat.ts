import { GoogleGenAI } from '@google/genai'
import type { RetrievedChunk } from '@/lib/supabase/rag/retrieve'
import { callWithRetry } from './retry'

const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY })

export interface ChatMessageInput {
  role: 'user' | 'model'
  content: string
}

const SOCRATIC_SYSTEM_PROMPT = `Eres "UniNav AI", un tutor universitario socrático diseñado para acompañar a estudiantes ingresantes.
TU OBJETIVO ES ENSEÑAR A PENSAR, NO HACER EL TRABAJO POR EL ALUMNO.
REGLAS ESTRICTAS:
1. Jamás redactes un trabajo práctico, ensayo o informe completo de cero.
2. Si el usuario pide "hazme el informe/respuesta", responde con estructura en viñetas, conceptos clave según la bibliografía cargada, y pídele un primer borrador de 2 líneas.
3. Responde ÚNICAMENTE usando el contexto en <CONTEXTO_BIBLIOGRAFICO>.
4. Si la respuesta no está en el contexto, indicá explícitamente: "Esta información no está en el apunte cargado".
5. Cada afirmación basada en contexto lleva cita [Pág. X] al final de la frase.`

const MODEL_FALLBACK_CHAIN = ['gemini-3.6-flash', 'gemini-flash-latest', 'gemini-1.5-flash']

export async function generateSocraticResponse(
  userQuery: string,
  history: ChatMessageInput[],
  contextChunks: RetrievedChunk[]
): Promise<string> {
  const topChunks = contextChunks.slice(0, 3)

  const contextBlock = topChunks.length > 0
    ? topChunks
        .map(
          (c) =>
            `[Pág. ${c.page_number ?? 'N/A'}] ${c.content.slice(0, 1000)}`
        )
        .join('\n\n')
    : 'No hay fragmentos bibliográficos disponibles para esta consulta.'

  const trimmedHistory = history
    .slice(-2)
    .map((m) => `${m.role === 'user' ? 'Alumno' : 'Tutor'}: ${m.content.slice(0, 250)}`)
    .join('\n')

  const fullPrompt = `<CONTEXTO_BIBLIOGRAFICO>
${contextBlock}
</CONTEXTO_BIBLIOGRAFICO>

Historial reciente:
${trimmedHistory}

Consulta del alumno: ${userQuery}`

  return callWithRetry(async () => {
    let lastError: any = null

    for (const modelName of MODEL_FALLBACK_CHAIN) {
      try {
        const response = await ai.models.generateContent({
          model: modelName,
          contents: fullPrompt,
          config: {
            systemInstruction: SOCRATIC_SYSTEM_PROMPT,
            temperature: 0.3,
          },
        })

        if (response.text) {
          return response.text
        }
      } catch (err: any) {
        lastError = err
        console.warn(
          `Modelo ${modelName} tuvo límite de cuota (429/500). Reintentando con modelo alternativo...`,
          err?.status || err?.code || err?.message
        )
      }
    }

    throw lastError || new Error('No se pudo obtener respuesta de la IA de Google.')
  })
}

export async function generateSocraticResponseStream(
  userQuery: string,
  history: ChatMessageInput[],
  contextChunks: RetrievedChunk[]
) {
  const topChunks = contextChunks.slice(0, 3)

  const contextBlock = topChunks.length > 0
    ? topChunks
        .map(
          (c) =>
            `[Pág. ${c.page_number ?? 'N/A'}] ${c.content.slice(0, 1000)}`
        )
        .join('\n\n')
    : 'No hay fragmentos bibliográficos disponibles para esta consulta.'

  const trimmedHistory = history
    .slice(-2)
    .map((m) => `${m.role === 'user' ? 'Alumno' : 'Tutor'}: ${m.content.slice(0, 250)}`)
    .join('\n')

  const fullPrompt = `<CONTEXTO_BIBLIOGRAFICO>
${contextBlock}
</CONTEXTO_BIBLIOGRAFICO>

Historial reciente:
${trimmedHistory}

Consulta del alumno: ${userQuery}`

  return callWithRetry(async () => {
    let lastError: any = null

    for (const modelName of MODEL_FALLBACK_CHAIN) {
      try {
        return await ai.models.generateContentStream({
          model: modelName,
          contents: fullPrompt,
          config: {
            systemInstruction: SOCRATIC_SYSTEM_PROMPT,
            temperature: 0.3,
          },
        })
      } catch (err: any) {
        lastError = err
        console.warn(
          `Stream model ${modelName} falló. Intentando con modelo alternativo...`,
          err?.status || err?.code || err?.message
        )
      }
    }

    throw lastError || new Error('No se pudo obtener stream de IA de Google.')
  })
}
