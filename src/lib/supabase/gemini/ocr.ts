import { GoogleGenAI } from '@google/genai'
import { callWithRetry } from './retry'

const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY })

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

  const prompt = `Sos un asistente universitario experto en analizar fotos de pizarrones de clase.
Analizá la siguiente foto de pizarra y realizá dos tareas:

1. Transcribí de forma clara y estructurada todo el texto manuscrito, ecuaciones, fórmulas o esquemas visibles en la pizarra (ocr_text).
2. Identificá si hay alguna fecha de examen, parcial, entrega de trabajo práctico o aviso importante anotado en la pizarra (detected_events).
   Para cada evento detectado, sugerí un título (suggested_title), tipo ('parcial', 'entrega_tp', o 'final') y la fecha si se especifica en formato YYYY-MM-DD (suggested_date). Si la fecha no tiene año, asumí el año actual.

Respondé ÚNICAMENTE con un JSON válido estructurado como:
{
  "ocr_text": "Transcripción clara de la pizarra...",
  "detected_events": [
    {
      "suggested_title": "1er Parcial Teórico",
      "suggested_type": "parcial",
      "suggested_date": "2026-09-25"
    }
  ]
}`

  try {
    return await callWithRetry(async () => {
      const response = await ai.models.generateContent({
        model: 'gemini-3.6-flash',
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
        ocr_text: parsed.ocr_text || 'No se detectó texto claro en la imagen.',
        detected_events: Array.isArray(parsed.detected_events)
          ? parsed.detected_events
          : [],
      }
    })
  } catch (err) {
    console.error('Error analizando foto de pizarra con Gemini Vision:', err)
    return {
      ocr_text: 'Error procesando OCR de la imagen por alta demanda temporal en servidores de Google.',
      detected_events: [],
    }
  }
}
