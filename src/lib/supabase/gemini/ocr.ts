import { GoogleGenAI } from '@google/genai'
import { callWithRetry } from './retry'

const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY })

const MODEL_FALLBACK_CHAIN = [
  'gemini-3.6-flash',
  'gemini-flash-latest',
  'gemini-3.7-flash-video-understanding-eap',
]

export interface DetectedEventItem {
  suggested_title: string
  suggested_type: 'parcial' | 'entrega_tp' | 'final'
  suggested_date?: string | null
}

export interface BoardPhotoAnalysis {
  ocr_text: string
  detected_events: DetectedEventItem[]
}

export async function analyzeBoardPhoto(
  imageBuffer: Buffer,
  mimeType: string = 'image/jpeg'
): Promise<BoardPhotoAnalysis> {
  const base64Data = imageBuffer.toString('base64')

  const prompt = `Sos un asistente universitario experto en análisis visual de pizarrones de clase y apuntes manuscritos.
Analizá la siguiente foto de pizarra y realizá dos tareas:

1. Transcribí de forma clara y estructurada todo el texto manuscrito, ecuaciones matemáticas (usando notación estándar o LaTeX si aplica), esquemas, definiciones o código visible en la pizarra (ocr_text). Organizalo con títulos, viñetas y pasos si es la resolución de un ejercicio.
2. Identificá si hay alguna fecha de examen, parcial, entrega de trabajo práctico o aviso importante anotado en la pizarra (detected_events).
   Para cada evento detectado, sugerí un título representativo (suggested_title), tipo ('parcial', 'entrega_tp', o 'final') y la fecha en formato YYYY-MM-DD (suggested_date). Si la fecha no especifica año, asumí el año en curso.

Respondé ÚNICAMENTE con un JSON válido estructurado como:
{
  "ocr_text": "Transcripción clara y estructurada con fórmulas y apuntes de la pizarra...",
  "detected_events": [
    {
      "suggested_title": "1er Parcial Teórico",
      "suggested_type": "parcial",
      "suggested_date": "2026-09-25"
    }
  ]
}`

  let lastError: unknown = null

  for (const modelName of MODEL_FALLBACK_CHAIN) {
    try {
      return await callWithRetry(async () => {
        const response = await ai.models.generateContent({
          model: modelName,
          contents: [
            {
              inlineData: {
                mimeType: mimeType,
                data: base64Data,
              },
            },
            prompt,
          ],
          config: {
            responseMimeType: 'application/json',
            temperature: 0.2,
          },
        })

        const jsonText = response.text ?? '{}'
        const parsed = JSON.parse(jsonText)

        return {
          ocr_text: parsed.ocr_text || 'No se detectó texto manuscrito claro en la imagen.',
          detected_events: Array.isArray(parsed.detected_events)
            ? parsed.detected_events
            : [],
        }
      })
    } catch (err) {
      console.warn(`Fallback OCR Vision en modelo ${modelName} falló:`, err)
      lastError = err
    }
  }

  console.error('Error analizando foto de pizarra con cadena de modelos Gemini:', lastError)
  return {
    ocr_text: 'Error temporal procesando la imagen con Gemini Vision. Podés intentar reanalizarla con el botón inferior.',
    detected_events: [],
  }
}
