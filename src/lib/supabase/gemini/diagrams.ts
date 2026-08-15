import { GoogleGenAI } from '@google/genai'
import { callWithRetry } from './retry'

const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY })

export async function generateMermaidDiagram(
  turns: { role: string; content: string }[]
): Promise<string> {
  const context = turns
    .map((t) => `${t.role === 'user' ? 'Alumno' : 'Tutor'}: ${t.content}`)
    .join('\n\n')

  const prompt = `Sos un experto en visualización de información y arquitectura de datos.
Basándote ÚNICAMENTE en el siguiente intercambio de conversación entre un estudiante universitario y su tutor:

<INTERCAMBIO_CHAT>
${context}
</INTERCAMBIO_CHAT>

Generá un diagrama explicativo claro en código sintáctico **Mermaid.js**.
Podés elegir el tipo de diagrama que mejor exprese la idea:
- \`graph TD\` o \`graph LR\` (mapas de flujo o jerarquías)
- \`mindmap\` (mapa mental de conceptos)
- \`sequenceDiagram\` (secuencias o procesos)

REGLAS STRICTAS:
1. Devolvé ÚNICAMENTE el código sintáctico puro de Mermaid.
2. NO incluyas bloques de marcado markdown (\`\`\`mermaid o \`\`\`).
3. Asegurate de que los textos dentro de los nodos no contengan paréntesis o caracteres especiales que rompan el parser de Mermaid (usá comillas en las etiquetas si contienen espacios o puntuación, ej: A["Concepto Clave"]).
4. El diagrama debe ser conciso, con 4 a 10 nodos principales.

Código Mermaid:`

  try {
    return await callWithRetry(async () => {
      const response = await ai.models.generateContent({
        model: 'gemini-3.6-flash',
        contents: prompt,
        config: {
          temperature: 0.2,
        },
      })

      let code = response.text ?? ''
      code = code.replace(/```mermaid/gi, '').replace(/```/g, '').trim()
      return code
    })
  } catch (err) {
    console.error('Error generando diagrama Mermaid con Gemini:', err)
    return `graph TD
    A["El servicio de IA está en alta demanda"] --> B["Por favor reintentá en unos segundos"]`
  }
}
