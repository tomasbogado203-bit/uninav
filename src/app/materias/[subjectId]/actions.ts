'use server'

import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import { revalidatePath } from 'next/cache'
import { extractTextByPage } from '@/lib/supabase/pdf/extract'
import { chunkPages } from '@/lib/supabase/rag/chunk'
import { embedText } from '@/lib/supabase/gemini/embeddings'
import { extractTopicsFromPdf } from '@/lib/supabase/gemini/chat'
import { GoogleGenAI } from '@google/genai'
import { callWithRetry } from '@/lib/supabase/gemini/retry'

const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY })

const MODEL_FALLBACK_CHAIN = [
  'gemini-3.6-flash',
  'gemini-flash-latest',
  'gemini-3.7-flash-video-understanding-eap',
]

export async function uploadDocument(subjectId: string, formData: FormData) {
  const supabase = await createClient()

  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) redirect('/login')

  const file = formData.get('file') as File
  const title = (formData.get('title') as string) || file?.name
  const isExamenViejo = formData.get('document_type') === 'examen_viejo'

  if (!file || file.size === 0) {
    throw new Error('No se seleccionó ningún archivo')
  }

  const buffer = Buffer.from(await file.arrayBuffer())
  const safeFileName = file.name.replace(/[^a-zA-Z0-9._-]/g, '_')
  const path = `${user.id}/${subjectId}/${Date.now()}-${safeFileName}`

  const { error: uploadError } = await supabase.storage
    .from('apuntes')
    .upload(path, buffer, { contentType: 'application/pdf' })

  if (uploadError) throw new Error(uploadError.message)

  const { data: document, error: insertError } = await supabase
    .from('documents')
    .insert({
      user_id: user.id,
      subject_id: subjectId,
      title,
      file_url: path,
      document_type: isExamenViejo ? 'examen_viejo' : 'apunte',
    })
    .select('id')
    .single()

  if (insertError) throw new Error(insertError.message)

  // Chunking + embeddings + auto-extracción de temas de estudio
  try {
    const pages = await extractTextByPage(buffer)
    const chunks = chunkPages(pages)

    for (const chunk of chunks) {
      const embedding = await embedText(chunk.content, 'RETRIEVAL_DOCUMENT')

      const { error: chunkError } = await supabase.from('document_chunks').insert({
        document_id: document.id,
        content: chunk.content,
        page_number: chunk.page_number,
        embedding,
      })

      if (chunkError) {
        console.error('Error guardando chunk:', chunkError.message)
      }
    }

    // Auto-generación de temas de estudio al subir un apunte (no aplica a exámenes viejos)
    if (!isExamenViejo && pages.length > 0) {
      try {
        const detectedTopics = await extractTopicsFromPdf(pages)

        if (detectedTopics && detectedTopics.length > 0) {
          const { data: existingThreads } = await supabase
            .from('chat_threads')
            .select('title')
            .eq('subject_id', subjectId)

          const existingTitles = new Set(
            (existingThreads || []).map((t) => t.title.toLowerCase().trim())
          )

          for (const topicTitle of detectedTopics) {
            if (!existingTitles.has(topicTitle.toLowerCase().trim())) {
              await supabase.from('chat_threads').insert({
                subject_id: subjectId,
                title: topicTitle,
              })
            }
          }
        }
      } catch (topicErr) {
        console.error('Error auto-detectando temas del PDF:', topicErr)
      }
    }
  } catch (err) {
    console.error('Error procesando embeddings del documento:', err)
  }

  revalidatePath(`/materias/${subjectId}`, 'layout')
  revalidatePath(`/materias/${subjectId}/temas`)
}

export async function deleteDocument(subjectId: string, documentId: string) {
  const supabase = await createClient()

  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) redirect('/login')

  // 1. Obtener documento para conocer la ruta del archivo en Storage
  const { data: document } = await supabase
    .from('documents')
    .select('file_url')
    .eq('id', documentId)
    .eq('user_id', user.id)
    .single()

  if (document?.file_url) {
    await supabase.storage.from('apuntes').remove([document.file_url])
  }

  // 2. Eliminar fragmentos indexados asociados
  await supabase.from('document_chunks').delete().eq('document_id', documentId)

  // 3. Eliminar registro en la tabla documents
  const { error } = await supabase
    .from('documents')
    .delete()
    .eq('id', documentId)
    .eq('user_id', user.id)

  if (error) {
    throw new Error(error.message)
  }

  // 4. Si no quedan más documentos en la materia, limpiar los temas asociados
  const { count: remainingDocsCount } = await supabase
    .from('documents')
    .select('id', { count: 'exact', head: true })
    .eq('subject_id', subjectId)
    .eq('user_id', user.id)

  if (!remainingDocsCount || remainingDocsCount === 0) {
    await supabase.from('chat_threads').delete().eq('subject_id', subjectId)
  }

  revalidatePath(`/materias/${subjectId}`, 'layout')
  revalidatePath(`/materias/${subjectId}/temas`)
}

export async function generateDocumentSummaryAction(
  subjectId: string,
  documentId: string
) {
  const supabase = await createClient()

  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) redirect('/login')

  const { data: document } = await supabase
    .from('documents')
    .select('title')
    .eq('id', documentId)
    .single()

  const { data: chunks } = await supabase
    .from('document_chunks')
    .select('content, page_number')
    .eq('document_id', documentId)
    .limit(10)

  if (!chunks || chunks.length === 0) {
    throw new Error('No hay fragmentos indexados suficientes para generar el resumen.')
  }

  const sampleContext = chunks
    .map((c) => `[Pág. ${c.page_number ?? 'N/A'}] ${c.content.slice(0, 600)}`)
    .join('\n\n')

  const prompt = `Sos un tutor universitario de élite. Analizá los siguientes fragmentos de la bibliografía oficial del apunte "${document?.title || 'Apunte'}":

<FRAGMENTOS>
${sampleContext}
</FRAGMENTOS>

CONSIGNA:
Generá un resumen ejecutivo estructurado para estudiantes universitarios con:
1. "summary": Síntesis conceptual clara y concisa (1 a 2 párrafos).
2. "key_takeaways": Array de 3 a 5 conclusiones o ideas centrales que el alumno debe saber.
3. "exam_topics": Array de 2 a 3 temas o preguntas típicas que los profesores evalúan sobre este texto.

Respondé ÚNICAMENTE con un JSON válido estructurado como:
{
  "summary": "...",
  "key_takeaways": ["Punto 1...", "Punto 2..."],
  "exam_topics": ["Pregunta 1...", "Pregunta 2..."]
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
          title: document?.title || 'Resumen del Apunte',
          summary: parsed.summary || 'Resumen no disponible.',
          key_takeaways: Array.isArray(parsed.key_takeaways) ? parsed.key_takeaways : [],
          exam_topics: Array.isArray(parsed.exam_topics) ? parsed.exam_topics : [],
        }
      } catch (err) {
        console.warn(`Resumen con ${modelName} omitido:`, err)
      }
    }

    return {
      title: document?.title || 'Resumen del Apunte',
      summary: 'No se pudo generar el resumen con IA en este momento.',
      key_takeaways: [],
      exam_topics: [],
    }
  })
}

export interface SubjectCheatSheetData {
  subject_name: string
  overview: string
  core_concepts: {
    term: string
    definition: string
    citation_page?: number | null
  }[]
  formulas_and_algorithms: {
    name: string
    formula: string
    description: string
    when_to_use: string
  }[]
  exam_traps: {
    trap: string
    explanation: string
    advice: string
  }[]
  self_check_questions: {
    question: string
    key_answer: string
  }[]
}

export interface CheatSheetActionResult {
  success: boolean
  data?: SubjectCheatSheetData
  error?: string
}

export async function generateSubjectCheatSheetAction(
  subjectId: string
): Promise<CheatSheetActionResult> {
  try {
    const supabase = await createClient()

    const {
      data: { user },
    } = await supabase.auth.getUser()

    if (!user) redirect('/login')

    const { data: subject } = await supabase
      .from('subjects')
      .select('name')
      .eq('id', subjectId)
      .single()

    const { data: docs } = await supabase
      .from('documents')
      .select('id, title')
      .eq('subject_id', subjectId)
      .eq('document_type', 'apunte')

    if (!docs || docs.length === 0) {
      return {
        success: false,
        error: 'Primero debés subir al menos un apunte PDF para generar la ficha de repaso.',
      }
    }

    const docIds = docs.map((d) => d.id)

    const { data: chunks } = await supabase
      .from('document_chunks')
      .select('content, page_number, document_id')
      .in('document_id', docIds)
      .limit(30)

    if (!chunks || chunks.length === 0) {
      return {
        success: false,
        error: 'Los apuntes aún no tienen fragmentos indexados. Subí un PDF válido.',
      }
    }

    const sampleContext = chunks
      .map((c) => {
        const docName = docs.find((d) => d.id === c.document_id)?.title || 'Apunte'
        return `[${docName} - Pág. ${c.page_number ?? 'N/A'}] ${c.content.slice(0, 500)}`
      })
      .join('\n\n')

    const prompt = `Sos un profesor titular y tutor universitario de élite en Argentina.
Analizá los siguientes fragmentos de la bibliografía oficial de la materia "${subject?.name || 'Materia'}":

<CONTEXTO_BIBLIOGRAFICO>
${sampleContext}
</CONTEXTO_BIBLIOGRAFICO>

CONSIGNA:
Generá una "Ficha de Fórmulas y Resumen de Repaso Rápido" (Cheat Sheet) de alto rendimiento para que el alumno estudie antes del examen.

Debe incluir rigurosamente:
1. "overview": Síntesis conceptual maestra de 2 párrafos que conecte todos los temas vistos.
2. "core_concepts": Lista de 4 a 6 conceptos teóricos indispensables. Cada uno con:
   - "term": Nombre del concepto.
   - "definition": Definición formal y clara en 2 líneas.
   - "citation_page": Número de página aproximada si surge del contexto (número entero o null).
3. "formulas_and_algorithms": Lista de 3 a 5 fórmulas matemáticas, propiedades o algoritmos clave. Cada uno con:
   - "name": Nombre de la fórmula / propiedad.
   - "formula": Notación matemática en texto legible o LaTeX (ej: lim(x->a) f(x) = L, o dy/dx = f'(x)).
   - "description": Qué calcula o qué expresa.
   - "when_to_use": En qué tipo de ejercicios del parcial se debe aplicar.
4. "exam_traps": Lista de 3 errores o trampas típicas de parcial que los alumnos suelen cometer al resolver ejercicios de esta materia. Cada uno con:
   - "trap": Error común (ej: Olvidar comprobar la continuidad antes de derivar).
   - "explanation": Por qué es un error según la teoría.
   - "advice": Cómo evitarlo en el examen.
5. "self_check_questions": Lista de 3 a 4 preguntas de autoevaluación rápida para que el alumno verifique si está listo. Cada una con:
   - "question": La pregunta de parcial.
   - "key_answer": La respuesta clave sintetizada.

Respondé ÚNICAMENTE con un JSON válido con la siguiente estructura exacta:
{
  "subject_name": "${subject?.name || 'Materia'}",
  "overview": "...",
  "core_concepts": [
    { "term": "...", "definition": "...", "citation_page": 1 }
  ],
  "formulas_and_algorithms": [
    { "name": "...", "formula": "...", "description": "...", "when_to_use": "..." }
  ],
  "exam_traps": [
    { "trap": "...", "explanation": "...", "advice": "..." }
  ],
  "self_check_questions": [
    { "question": "...", "key_answer": "..." }
  ]
}`

    const generated = await callWithRetry(async () => {
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
            subject_name: parsed.subject_name || subject?.name || 'Materia',
            overview: parsed.overview || 'Resumen general no disponible.',
            core_concepts: Array.isArray(parsed.core_concepts) ? parsed.core_concepts : [],
            formulas_and_algorithms: Array.isArray(parsed.formulas_and_algorithms)
              ? parsed.formulas_and_algorithms
              : [],
            exam_traps: Array.isArray(parsed.exam_traps) ? parsed.exam_traps : [],
            self_check_questions: Array.isArray(parsed.self_check_questions)
              ? parsed.self_check_questions
              : [],
          }
        } catch (err) {
          console.warn(`Cheat Sheet con ${modelName} omitido:`, err)
        }
      }

      return null
    })

    if (!generated) {
      return {
        success: false,
        error: 'No se pudo generar la ficha de repaso en este momento. Intentalo nuevamente.',
      }
    }

    return {
      success: true,
      data: generated,
    }
  } catch (err) {
    console.error('Error en generateSubjectCheatSheetAction:', err)
    return {
      success: false,
      error:
        err instanceof Error
          ? err.message
          : 'Ocurrió un error inesperado al generar la ficha de repaso.',
    }
  }
}


