import { GoogleGenAI } from '@google/genai'

const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY })

export interface RoadmapStep {
  day_offset: number
  date_label: string
  topic: string
  activity: string
}

export async function generateStudyRoadmap(
  title: string,
  eventDateStr: string,
  eventType: string,
  topics: string[]
): Promise<RoadmapStep[]> {
  const topicsList = topics.length > 0 ? topics.join(', ') : 'Conceptos clave de la materia'

  const prompt = `Sos un tutor universitario experto en planificación de estudio y técnicas de aprendizaje activo.
Se ha agendado la siguiente evaluación académica:
- Título: ${title}
- Tipo: ${eventType} (Parcial, Entrega TP o Final)
- Fecha del examen: ${eventDateStr}
- Temas a evaluar: ${topicsList}

CONSIGNA:
Diseñá una hoja de ruta de estudio estructurada paso a paso previa a la fecha del examen.
Generá entre 3 y 5 hitos de estudio ("day_offset" representan días antes de la evaluación, ej: -7, -4, -2, -1).

Respondé ÚNICAMENTE con un JSON válido estructurado como array de objetos:
[
  {
    "day_offset": 5,
    "date_label": "5 días antes",
    "topic": "Repaso de Unidad 1",
    "activity": "Lectura activa de apuntes y elaboración de resúmenes."
  }
]`

  try {
    const response = await ai.models.generateContent({
      model: 'gemini-3.6-flash',
      contents: prompt,
      config: {
        responseMimeType: 'application/json',
        temperature: 0.3,
      },
    })

    const jsonText = response.text ?? '[]'
    const parsed = JSON.parse(jsonText)
    return Array.isArray(parsed) ? parsed : []
  } catch (err) {
    console.error('Error generando roadmap de estudio con Gemini:', err)
    return [
      {
        day_offset: 3,
        date_label: '3 días antes',
        topic: title,
        activity: 'Repaso general de conceptos principales de la bibliografía.',
      },
      {
        day_offset: 1,
        date_label: '1 día antes',
        topic: title,
        activity: 'Simulacro de preguntas y descanso antes del examen.',
      },
    ]
  }
}
