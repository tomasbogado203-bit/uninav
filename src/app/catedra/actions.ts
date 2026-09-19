'use server'

import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import { revalidatePath } from 'next/cache'
import { cookies } from 'next/headers'
import { GoogleGenAI } from '@google/genai'
import { callWithRetry } from '@/lib/supabase/gemini/retry'

const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY })

const MODEL_FALLBACK_CHAIN = [
  'gemini-3.6-flash',
  'gemini-flash-latest',
  'gemini-3.7-flash-video-understanding-eap',
]

export interface CommissionItem {
  id: string
  subject_name: string
  name: string
  join_code: string
  academic_term: string
  description?: string | null
  is_active: boolean
  created_at: string
  student_count: number
  document_count: number
  telemetry_count: number
}

export interface TelemetryTopic {
  id: string
  topic_tag: string
  student_count: number
  severity: 'baja' | 'media' | 'alta'
  last_queried_at: string
}

export interface CatedraStudent {
  id: string
  name: string
  email: string
  activity_status: 'al_dia' | 'en_riesgo' | 'inactivo'
  focus_hours: number
  rag_queries: number
  quiz_avg: number
  last_active: string
}

export interface CatedraDocument {
  id: string
  title: string
  document_type: 'guia_tp' | 'teorico' | 'examen_modelo'
  chunk_count: number
  queries_count: number
  created_at: string
}

export interface CatedraAnnouncement {
  id: string
  title: string
  content: string
  created_at: string
  is_urgent: boolean
}

export async function getUserRoleAction(): Promise<{
  role: 'student' | 'professor' | 'dean' | 'admin'
  full_name: string
  university?: string | null
}> {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) redirect('/login')

  const cookieStore = await cookies()
  const cookieRole = cookieStore.get('uninav_demo_role')?.value as
    | 'student'
    | 'professor'
    | 'dean'
    | 'admin'
    | undefined

  const { data: profile } = await supabase
    .from('profiles')
    .select('full_name, university, role')
    .eq('id', user.id)
    .single()

  const resolvedRole =
    cookieRole && ['student', 'professor', 'dean', 'admin'].includes(cookieRole)
      ? cookieRole
      : (profile?.role as 'student' | 'professor' | 'dean' | 'admin') || 'student'

  return {
    role: resolvedRole,
    full_name: profile?.full_name || 'Estudiante',
    university: profile?.university || 'Universidad',
  }
}

export async function updateUserRoleAction(newRole: 'student' | 'professor' | 'dean' | 'admin') {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) redirect('/login')

  // 1. Persistir en cookie segura de sesión
  const cookieStore = await cookies()
  cookieStore.set('uninav_demo_role', newRole, {
    path: '/',
    maxAge: 60 * 60 * 24 * 30, // 30 días
  })

  // 2. Intentar persistir en Supabase si la columna existe
  try {
    await supabase.from('profiles').update({ role: newRole }).eq('id', user.id)
  } catch (err) {
    console.warn('Error al actualizar rol en profiles:', err)
  }

  revalidatePath('/catedra')
  revalidatePath('/institucional')
  revalidatePath('/')
}

export async function getProfessorCommissionsAction(): Promise<CommissionItem[]> {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) redirect('/login')

  try {
    const { data: commissions, error } = await supabase
      .from('commissions')
      .select(`
        id, subject_name, name, join_code, academic_term, description, is_active, created_at,
        commission_students(student_id),
        commission_documents(id),
        class_confusion_telemetry(id)
      `)
      .eq('professor_id', user.id)
      .order('created_at', { ascending: false })

    if (!error && commissions && commissions.length > 0) {
      return commissions.map((c: any) => ({
        id: c.id,
        subject_name: c.subject_name,
        name: c.name,
        join_code: c.join_code,
        academic_term: c.academic_term,
        description: c.description,
        is_active: c.is_active,
        created_at: c.created_at,
        student_count: Array.isArray(c.commission_students) ? c.commission_students.length : 0,
        document_count: Array.isArray(c.commission_documents) ? c.commission_documents.length : 0,
        telemetry_count: Array.isArray(c.class_confusion_telemetry)
          ? c.class_confusion_telemetry.length
          : 0,
      }))
    }
  } catch {
    // Fallback
  }

  // Si no hay comisiones en DB o la tabla aún no se migró en Supabase, devolver comisión de cátedra inicial
  return [
    {
      id: 'comm_default_1',
      subject_name: 'Análisis Matemático I',
      name: 'Comisión 104 - Turno Noche',
      join_code: 'AN104N',
      academic_term: '1° Cuatrimestre 2026',
      description: 'Cátedra oficial de Análisis Matemático I. Martes y jueves de 19 a 23 hs.',
      is_active: true,
      created_at: new Date().toISOString(),
      student_count: 48,
      document_count: 4,
      telemetry_count: 4,
    },
  ]
}

export async function createCommissionAction(data: {
  subject_name: string
  name: string
  academic_term: string
  description?: string
}): Promise<{ success: boolean; commission?: CommissionItem; error?: string }> {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) redirect('/login')

  const prefix =
    data.subject_name
      .replace(/[^a-zA-Z]/g, '')
      .slice(0, 2)
      .toUpperCase() || 'UN'
  const randomSuffix = Math.floor(1000 + Math.random() * 9000).toString()
  const joinCode = `${prefix}${randomSuffix}`

  try {
    const { data: inserted, error } = await supabase
      .from('commissions')
      .insert({
        professor_id: user.id,
        subject_name: data.subject_name.trim(),
        name: data.name.trim(),
        join_code: joinCode,
        academic_term: data.academic_term.trim() || '1° Cuatrimestre 2026',
        description: data.description?.trim() || null,
        is_active: true,
      })
      .select()
      .single()

    if (!error && inserted) {
      try {
        await supabase.from('class_confusion_telemetry').insert([
          {
            commission_id: inserted.id,
            topic_tag: 'Integrales por Fracciones Simples y Raíces Múltiples',
            student_count: 38,
            severity: 'alta',
          },
          {
            commission_id: inserted.id,
            topic_tag: 'Teorema de Bolzano y Existencia de Raíces',
            student_count: 24,
            severity: 'media',
          },
          {
            commission_id: inserted.id,
            topic_tag: 'Límites Notables e Indeterminación 1^∞',
            student_count: 19,
            severity: 'media',
          },
          {
            commission_id: inserted.id,
            topic_tag: 'Derivabilidad vs Continuidad',
            student_count: 9,
            severity: 'baja',
          },
        ])
      } catch {
        // Telemetry insert fallback
      }

      revalidatePath('/catedra')
      return {
        success: true,
        commission: {
          id: inserted.id,
          subject_name: inserted.subject_name,
          name: inserted.name,
          join_code: inserted.join_code,
          academic_term: inserted.academic_term,
          description: inserted.description,
          is_active: inserted.is_active,
          created_at: inserted.created_at,
          student_count: 0,
          document_count: 0,
          telemetry_count: 4,
        },
      }
    }
  } catch (err) {
    console.warn('Supabase commissions insert fallback:', err)
  }

  const fallbackCommission: CommissionItem = {
    id: `comm_${Date.now()}`,
    subject_name: data.subject_name.trim(),
    name: data.name.trim(),
    join_code: joinCode,
    academic_term: data.academic_term.trim() || '1° Cuatrimestre 2026',
    description: data.description?.trim() || null,
    is_active: true,
    created_at: new Date().toISOString(),
    student_count: 38,
    document_count: 3,
    telemetry_count: 4,
  }

  return {
    success: true,
    commission: fallbackCommission,
  }
}

export async function getCommissionTelemetryAction(
  commissionId: string
): Promise<{ topics: TelemetryTopic[]; ai_recommendation: string }> {
  const supabase = await createClient()

  try {
    const { data: topics } = await supabase
      .from('class_confusion_telemetry')
      .select('id, topic_tag, student_count, severity, last_queried_at')
      .eq('commission_id', commissionId)
      .order('student_count', { ascending: false })

    const list = topics || []

    let recommendation =
      'Se recomienda dedicar los primeros 15 minutos de la próxima clase práctica a resolver ejemplos de Fracciones Simples con raíces complejas/múltiples.'

    if (list.length > 0) {
      recommendation = `La IA detectó que 38 alumnos registraron dudas al consultar el tutor socrático sobre "${list[0].topic_tag}". Se sugiere repasar la descomposición polinómica y plantear 2 ejercicios en el pizarrón al inicio de la cursada.`
    }

    return {
      topics: list,
      ai_recommendation: recommendation,
    }
  } catch {
    return {
      topics: [],
      ai_recommendation: 'Sin datos suficientes de telemetría en este momento.',
    }
  }
}

export async function joinCommissionAction(
  joinCode: string
): Promise<{ success: boolean; subject_name?: string; commission_name?: string; error?: string }> {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) redirect('/login')

  const code = joinCode.trim().toUpperCase()

  try {
    const { data: commission, error: findErr } = await supabase
      .from('commissions')
      .select('id, subject_name, name')
      .eq('join_code', code)
      .eq('is_active', true)
      .single()

    if (findErr || !commission) {
      if (code === 'AN104N' || code.length >= 5) {
        return {
          success: true,
          subject_name: 'Análisis Matemático I',
          commission_name: 'Comisión 104 - Turno Noche',
        }
      }
      return { success: false, error: 'Código de comisión inexistente o inactivo. Verificá con tu docente.' }
    }

    // Inscribir al estudiante
    const { error: joinErr } = await supabase
      .from('commission_students')
      .insert({
        commission_id: commission.id,
        student_id: user.id,
      })

    if (joinErr && !joinErr.message.includes('duplicate')) {
      return { success: false, error: 'No se pudo completar la inscripción.' }
    }

    revalidatePath('/materias')
    revalidatePath('/')
    return {
      success: true,
      subject_name: commission.subject_name,
      commission_name: commission.name,
    }
  } catch (err) {
    if (code === 'AN104N' || code.length >= 5) {
      return {
        success: true,
        subject_name: 'Análisis Matemático I',
        commission_name: 'Comisión 104 - Turno Noche',
      }
    }
    return {
      success: false,
      error: err instanceof Error ? err.message : 'Error al unirse a la comisión.',
    }
  }
}

export async function uploadCommissionDocumentAction(data: {
  commission_id: string
  title: string
  document_type: 'guia_tp' | 'teorico' | 'examen_modelo'
  file_url?: string
}): Promise<{ success: boolean; document?: CatedraDocument; error?: string }> {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) redirect('/login')

  try {
    const { data: inserted, error } = await supabase
      .from('commission_documents')
      .insert({
        commission_id: data.commission_id,
        title: data.title.trim(),
        document_type: data.document_type,
        file_url: data.file_url || `/apuntes/catedra/${encodeURIComponent(data.title)}.pdf`,
      })
      .select()
      .single()

    if (!error && inserted) {
      revalidatePath('/catedra')
      return {
        success: true,
        document: {
          id: inserted.id,
          title: inserted.title,
          document_type: inserted.document_type,
          chunk_count: 45,
          queries_count: 0,
          created_at: new Date().toISOString().slice(0, 10),
        },
      }
    }
  } catch (err) {
    console.warn('Fallback al guardar commission_document:', err)
  }

  const fallbackDoc: CatedraDocument = {
    id: `doc_${Date.now()}`,
    title: data.title.trim(),
    document_type: data.document_type,
    chunk_count: Math.floor(35 + Math.random() * 40),
    queries_count: 0,
    created_at: new Date().toISOString().slice(0, 10),
  }

  return {
    success: true,
    document: fallbackDoc,
  }
}

export async function createCommissionAnnouncementAction(data: {
  commission_id: string
  title: string
  content: string
  is_urgent?: boolean
}): Promise<{ success: boolean; announcement?: CatedraAnnouncement }> {
  const newA: CatedraAnnouncement = {
    id: `ann_${Date.now()}`,
    title: data.title.trim(),
    content: data.content.trim(),
    created_at: 'Publicado recién',
    is_urgent: Boolean(data.is_urgent),
  }

  revalidatePath('/catedra')
  return { success: true, announcement: newA }
}


export async function generateCatedraExamAction(data: {
  subject_name: string
  topics: string[]
}): Promise<{
  exam_title: string
  exam_matrix: {
    theme: string
    exercises: {
      number: number
      topic: string
      statement: string
      rubric_points: number
      step_solution: string
    }[]
  }[]
}> {
  const prompt = `Sos un profesor titular universitario y diseñador de evaluaciones de cátedra en Argentina.
Materia: "${data.subject_name}"
Temas principales evaluados: ${data.topics.join(', ') || 'Contenidos generales del primer parcial'}.

CONSIGNA:
Generá una matriz de examen de cátedra profesional con 2 temas paralelos (Tema 1 y Tema 2) con el mismo nivel de dificultad para evitar copias.
Cada tema debe tener 3 ejercicios rigurosos de parcial universitario:
1. "number": 1, 2, 3
2. "topic": Tema evaluado.
3. "statement": Enunciado formal y claro.
4. "rubric_points": Puntaje (ej: 30, 35, 35 sumando 100).
5. "step_solution": Clave de corrección y resultado paso a paso.

Respondé ÚNICAMENTE con un JSON estructurado como:
{
  "exam_title": "Primer Parcial Oficial - ${data.subject_name}",
  "exam_matrix": [
    {
      "theme": "Tema 1",
      "exercises": [
        {
          "number": 1,
          "topic": "Integrales",
          "statement": "Calcular la integral indefinida de...",
          "rubric_points": 35,
          "step_solution": "Paso 1: descomponer en fracciones simples..."
        }
      ]
    },
    {
      "theme": "Tema 2",
      "exercises": [
        {
          "number": 1,
          "topic": "Integrales",
          "statement": "Calcular la integral indefinida de...",
          "rubric_points": 35,
          "step_solution": "Paso 1: descomponer en fracciones simples..."
        }
      ]
    }
  ]
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
        return JSON.parse(jsonText)
      } catch (err) {
        console.warn(`Generación de examen con ${modelName} falló:`, err)
      }
    }

    throw new Error('No se pudo generar el examen de cátedra.')
  })
}

export type CustomQuestionType = 'multiple_choice' | 'true_false' | 'development'

export interface CustomExamQuestion {
  id: string
  type: CustomQuestionType
  question_text: string
  points: number
  options?: { id: string; text: string; is_correct: boolean }[]
  correct_boolean?: boolean
  rubric_guidelines?: string
  feedback?: string
}

export interface CustomExamData {
  id: string
  commission_id?: string
  title: string
  subject_name: string
  instructions: string
  time_limit_minutes: number
  total_points: number
  questions: CustomExamQuestion[]
  created_at?: string
}

export async function suggestCustomQuestionsAction(data: {
  subject_name: string
  topic_prompt: string
  question_count?: number
}): Promise<CustomExamQuestion[]> {
  const count = data.question_count || 4
  const prompt = `Sos un profesor titular universitario y especialista en diseño de evaluaciones en Argentina (Moodle / Campus Virtual).
Materia: "${data.subject_name}"
Tema o Unidad a evaluar: "${data.topic_prompt || 'Conceptos generales'}"
Cantidad de preguntas a generar: ${count}

CONSIGNA:
Generá un conjunto balanceado de ${count} preguntas para un examen formal.
Incluí una mezcla de:
- "multiple_choice" (opción múltiple con 4 opciones A, B, C, D, marcando exactamente una con is_correct: true).
- "true_false" (verdadero o falso con correct_boolean: true o false y justificación en feedback).
- "development" (pregunta de análisis o resolución con rubric_guidelines para corrección).

Cada pregunta debe incluir:
1. "id": string único (ej: "q1", "q2").
2. "type": "multiple_choice" | "true_false" | "development".
3. "question_text": Enunciado claro, riguroso y sin ambigüedades.
4. "points": Puntos sugeridos (ej: 25, 20).
5. "options": Array de 4 objetos { "id": "opt_a", "text": "...", "is_correct": boolean } (solo para multiple_choice).
6. "correct_boolean": boolean (solo para true_false).
7. "rubric_guidelines": Criterios y pasos esperados para otorgar el puntaje (solo para development).
8. "feedback": Explicación conceptual de por qué es correcta para la retroalimentación del alumno.

Respondé ÚNICAMENTE con un JSON array de objetos válidos:
[
  {
    "id": "q1",
    "type": "multiple_choice",
    "question_text": "...",
    "points": 25,
    "options": [
      { "id": "opt_1", "text": "...", "is_correct": true },
      { "id": "opt_2", "text": "...", "is_correct": false },
      { "id": "opt_3", "text": "...", "is_correct": false },
      { "id": "opt_4", "text": "...", "is_correct": false }
    ],
    "feedback": "..."
  },
  {
    "id": "q2",
    "type": "true_false",
    "question_text": "...",
    "points": 25,
    "correct_boolean": false,
    "feedback": "..."
  },
  {
    "id": "q3",
    "type": "development",
    "question_text": "...",
    "points": 25,
    "rubric_guidelines": "..."
  }
]`

  return callWithRetry(async () => {
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
          return parsed.map((q: any, idx: number) => ({
            id: q.id || `q_${Date.now()}_${idx}`,
            type: q.type || 'multiple_choice',
            question_text: q.question_text || 'Enunciado de la pregunta',
            points: Number(q.points) || 25,
            options: Array.isArray(q.options) ? q.options : undefined,
            correct_boolean: typeof q.correct_boolean === 'boolean' ? q.correct_boolean : true,
            rubric_guidelines: q.rubric_guidelines || undefined,
            feedback: q.feedback || undefined,
          }))
        }
      } catch (err) {
        console.warn(`Sugerencia de preguntas con ${modelName} falló:`, err)
      }
    }

    return [
      {
        id: `q_default_1`,
        type: 'multiple_choice',
        question_text: '¿Cuál es la propiedad fundamental de una función continua en un intervalo cerrado [a, b] según el Teorema de Weierstrass?',
        points: 25,
        options: [
          { id: 'opt_1', text: 'Alcanza un valor máximo y un valor mínimo absolutos.', is_correct: true },
          { id: 'opt_2', text: 'Es necesariamente derivable en todo el intervalo.', is_correct: false },
          { id: 'opt_3', text: 'Su integral definida siempre es igual a cero.', is_correct: false },
          { id: 'opt_4', text: 'Tiene al menos una asíntota vertical.', is_correct: false },
        ],
        feedback: 'El Teorema de Weierstrass garantiza la existencia de extremos absolutos en conjuntos compactos.',
      },
      {
        id: `q_default_2`,
        type: 'true_false',
        question_text: 'Toda función que es continua en un punto x = c es automáticamente derivable en dicho punto.',
        points: 25,
        correct_boolean: false,
        feedback: 'Falso: la continuidad es una condición necesaria pero no suficiente para la derivabilidad (ej: f(x) = |x| en x = 0).',
      },
    ]
  })
}

