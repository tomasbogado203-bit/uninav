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

export async function generateSocraticResponse(
  userQuery: string,
  history: ChatMessageInput[],
  contextChunks: RetrievedChunk[]
): Promise<string> {
  // Limitar fragmentos a los 3 mejores para optimizar tokens y evitar rate limits (429)
  const topChunks = contextChunks.slice(0, 3)

  const contextBlock = topChunks.length > 0
    ? topChunks
        .map(
          (c) =>
            `[Pág. ${c.page_number ?? 'N/A'}] ${c.content.slice(0, 1000)}`
        )
        .join('\n\n')
    : 'No hay fragmentos bibliográficos disponibles para esta consulta.'

  // Truncar historial a los últimos 2 mensajes para ahorrar cuota de tokens
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
    const response = await ai.models.generateContent({
      model: 'gemini-3.6-flash',
      contents: fullPrompt,
      config: {
        systemInstruction: SOCRATIC_SYSTEM_PROMPT,
        temperature: 0.3,
      },
    })

    return response.text ?? 'No se pudo generar una respuesta.'
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
    return await ai.models.generateContentStream({
      model: 'gemini-3.6-flash',
      contents: fullPrompt,
      config: {
        systemInstruction: SOCRATIC_SYSTEM_PROMPT,
        temperature: 0.3,
      },
    })
  })
}
