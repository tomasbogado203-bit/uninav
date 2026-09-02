'use server'

import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import { revalidatePath } from 'next/cache'
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

export async function getUserRoleAction(): Promise<{
  role: 'student' | 'professor' | 'dean'
  full_name: string
  university?: string | null
}> {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) redirect('/login')

  const { data: profile } = await supabase
    .from('profiles')
    .select('full_name, university, role')
    .eq('id', user.id)
    .single()

  return {
    role: (profile?.role as 'student' | 'professor' | 'dean') || 'professor',
    full_name: profile?.full_name || 'Profesor',
    university: profile?.university || 'Universidad',
  }
}

export async function updateUserRoleAction(newRole: 'student' | 'professor' | 'dean') {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) redirect('/login')

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

    if (error || !commissions) return []

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
      telemetry_count: Array.isArray(c.class_confusion_telemetry) ? c.class_confusion_telemetry.length : 0,
    }))
  } catch {
    return []
  }
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

  // Generar código aleatorio limpio de 6 caracteres (ej: "AN104N")
  const prefix = data.subject_name
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

    if (error || !inserted) {
      return { success: false, error: error?.message || 'Error al crear la comisión.' }
    }

    // Insertar algunos temas de telemetría iniciales para enriquecer el mapa de calor
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
  } catch (err) {
    return {
      success: false,
      error: err instanceof Error ? err.message : 'Error inesperado al crear la comisión.',
    }
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
      recommendation = `La IA detectó que el ${list[0].student_count} alumnos registraron dudas al consultar el tutor socrático sobre "${list[0].topic_tag}". Se sugiere repasar la demostración formal y plantear 2 ejercicios de pizarrón al inicio de la cursada.`
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
    return {
      success: false,
      error: err instanceof Error ? err.message : 'Error al unirse a la comisión.',
    }
  }
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
