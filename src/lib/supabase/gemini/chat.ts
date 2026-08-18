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
4. Si la respuesta no está en el contexto, indicá explicítamente: "Esta información no está en el apunte cargado".
5. Cada afirmación basada en contexto lleva cita [Pág. X] al final de la frase.`

const MODEL_FALLBACK_CHAIN = [
  'gemini-3.6-flash',
  'gemini-flash-latest',
  'gemini-3.7-flash-video-understanding-eap',
]

export async function extractTopicsFromPdf(
  pages: { page?: number; text?: string; content?: string }[]
): Promise<string[]> {
  if (pages.length === 0) return []

  const sampleText = pages
    .slice(0, 5)
    .map((p) => `[Pág. ${p.page || 1}] ${(p.text || p.content || '').slice(0, 800)}`)
    .join('\n\n')

  const prompt = `Analizá el inicio de este documento bibliográfico universitario y extraé entre 2 y 4 temas de estudio o unidades temáticas principales presentes en el texto.
Ejemplos de respuesta: ["Unidad 1 - Atributos de Calidad", "Patrones Arquitectónicos MVC", "Casos de Uso UML"]

TEXTO DEL DOCUMENTO:
${sampleText}

Respondé ÚNICAMENTE con un JSON array de strings válido:
["Tema 1", "Tema 2", "Tema 3"]`

  return callWithRetry(async () => {
    for (const modelName of MODEL_FALLBACK_CHAIN) {
      try {
        const response = await ai.models.generateContent({
          model: modelName,
          contents: prompt,
          config: {
            responseMimeType: 'application/json',
            temperature: 0.2,
          },
        })

        const jsonText = response.text ?? '[]'
        try {
          const parsed = JSON.parse(jsonText)
          if (Array.isArray(parsed) && parsed.length > 0) {
            return parsed.map((t: any) => String(t).trim()).filter(Boolean)
          }
        } catch {
          // Ignorar errores de parseo
        }
      } catch (err: any) {
        console.warn(`Extracción de temas con ${modelName} omitida:`, err?.message || err)
      }
    }

    return []
  })
}

export async function generateFollowUpSuggestions(
  lastResponse: string,
  topicTitle?: string
): Promise<string[]> {
  const prompt = `A partir de la siguiente respuesta explicativa del tutor universitario sobre el tema "${topicTitle || 'General'}":

"${lastResponse.slice(0, 700)}"

Generá exactamente 3 repreguntas socráticas o preguntas de profundización cortas (máximo 6 a 8 palabras) que el estudiante podría hacer para seguir aprendiendo.
Ejemplos:
- "¿Cómo se evalúa esto en un parcial?"
- "Dame un ejemplo práctico cotidiano"
- "Desafíame con una pregunta sobre esto"

Respondé ÚNICAMENTE con un JSON array de 3 strings válido:
["Pregunta 1", "Pregunta 2", "Pregunta 3"]`

  for (const modelName of MODEL_FALLBACK_CHAIN) {
    try {
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
      if (Array.isArray(parsed) && parsed.length > 0) {
        return parsed.slice(0, 3).map((s: any) => String(s).trim())
      }
    } catch {
      // Fallback
    }
  }

  return [
    '¿Cómo se evalúa esto en un parcial?',
    'Dame un ejemplo práctico aplicado',
    'Desafíame con una pregunta sobre este tema',
  ]
}

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
    let lastErrorMsg = ''

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
        lastErrorMsg = err?.message || String(err)
        console.warn(
          `Modelo ${modelName} indisponible temporalmente (${err?.status || err?.code || '429'}). Probando alternativo...`
        )
      }
    }

    return `Estimado estudiante, UniNav AI experimentó una alta demanda temporal en la API de Google (${lastErrorMsg || 'Cuota alcanzada'}). Por favor, reintentá tu consulta enviando el mensaje nuevamente en unos segundos.`
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
