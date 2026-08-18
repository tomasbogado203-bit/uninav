'use server'

import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import { GoogleGenAI } from '@google/genai'
import { callWithRetry } from '@/lib/supabase/gemini/retry'

const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY })

const MODEL_FALLBACK_CHAIN = [
  'gemini-3.6-flash',
  'gemini-flash-latest',
  'gemini-3.7-flash-video-understanding-eap',
]

export async function explainGlossaryTermAction(term: string) {
  const supabase = await createClient()

  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) redirect('/login')

  if (!term || term.trim() === '') {
    throw new Error('El término no puede estar vacío.')
  }

  const prompt = `Sos un tutor universitario argentino de UniNav. Explicá el concepto o término académico "${term.trim()}" a un estudiante universitario ingresante de primer año.

CONSIGNA:
1. Explicación directa y clara de qué significa y cómo funciona en las universidades argentinas (UBA, UTN, UNLP, UNC, etc.).
2. Un ejemplo práctico cotidiano o caso típico de la vida universitaria.
3. Un consejo o advertencia clave que todo estudiante debe saber para no tener problemas con su cursada.

Respondé ÚNICAMENTE con un JSON válido estructurado como:
{
  "term": "${term.trim()}",
  "simple_definition": "...",
  "practical_example": "...",
  "pro_tip": "..."
}`

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

        const jsonText = response.text ?? '{}'
        const parsed = JSON.parse(jsonText)
        return {
          term: parsed.term || term,
          simple_definition: parsed.simple_definition || 'Definición no disponible.',
          practical_example: parsed.practical_example || 'Ejemplo no disponible.',
          pro_tip: parsed.pro_tip || 'Consultá siempre el régimen de correlatividades de tu facultad.',
        }
      } catch (err) {
        console.warn(`Explicación de término con ${modelName} omitida:`, err)
      }
    }

    return {
      term: term,
      simple_definition: 'No se pudo generar la explicación con IA en este momento.',
      practical_example: '',
      pro_tip: 'Revisá la cartelera y el centro de estudiantes de tu sede.',
    }
  })
}
