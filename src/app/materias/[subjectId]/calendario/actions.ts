'use server'

import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import { revalidatePath } from 'next/cache'
import { generateStudyRoadmap } from '@/lib/supabase/gemini/roadmap'

export async function createAcademicEventAction(
  subjectId: string,
  formData: FormData
) {
  const supabase = await createClient()

  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) redirect('/login')

  const targetSubjectId = (formData.get('subject_id') as string) || subjectId
  const title = formData.get('title') as string
  const eventType = (formData.get('event_type') as 'parcial' | 'entrega_tp' | 'final') || 'parcial'
  const eventDate = formData.get('event_date') as string

  if (!title || !eventDate || !targetSubjectId) {
    throw new Error('El título, la fecha y la materia son obligatorios.')
  }

  // 1. Obtener lista de temas para contextualizar la IA
  const { data: threads } = await supabase
    .from('chat_threads')
    .select('title')
    .eq('subject_id', targetSubjectId)

  const topics = threads?.map((t) => t.title) || []

  // 2. Generar hoja de ruta (roadmap) con Gemini
  const roadmap = await generateStudyRoadmap(title, eventDate, eventType, topics)

  // 3. Registrar evento en academic_events
  const { error } = await supabase.from('academic_events').insert({
    subject_id: targetSubjectId,
    title: title.trim(),
    event_type: eventType,
    event_date: eventDate,
    study_roadmap: roadmap,
  })

  if (error) {
    if (error.message.includes('title')) {
      const { error: fallbackError } = await supabase.from('academic_events').insert({
        subject_id: targetSubjectId,
        event_type: eventType,
        event_date: eventDate,
        study_roadmap: roadmap,
      })
      if (fallbackError) throw new Error(fallbackError.message)
    } else {
      throw new Error(error.message)
    }
  }

  revalidatePath(`/materias/${targetSubjectId}/calendario`)
  revalidatePath('/calendario')
}

export async function deleteAcademicEventAction(
  subjectId: string,
  eventId: string
) {
  const supabase = await createClient()

  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) redirect('/login')

  const { error } = await supabase
    .from('academic_events')
    .delete()
    .eq('id', eventId)

  if (error) {
    throw new Error(error.message)
  }

  if (subjectId) {
    revalidatePath(`/materias/${subjectId}/calendario`)
  }
  revalidatePath('/calendario')
}

export async function createStickyNoteAction(
  subjectId: string,
  formData: FormData
) {
  const supabase = await createClient()

  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) redirect('/login')

  const targetSubjectId = (formData.get('subject_id') as string) || subjectId
  const title = (formData.get('title') as string) || 'Nota'
  const content = formData.get('content') as string
  const color = (formData.get('color') as 'yellow' | 'blue' | 'green' | 'pink' | 'purple') || 'yellow'
  const eventDate = (formData.get('event_date') as string) || null

  const { error } = await supabase.from('academic_notes').insert({
    subject_id: targetSubjectId,
    user_id: user.id,
    title: title.trim(),
    content: content ? content.trim() : '',
    color: color,
    event_date: eventDate || null,
  })

  if (error) {
    throw new Error(error.message)
  }

  revalidatePath(`/materias/${targetSubjectId}/calendario`)
  revalidatePath('/calendario')
}

export async function deleteStickyNoteAction(
  subjectId: string,
  noteId: string
) {
  const supabase = await createClient()

  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) redirect('/login')

  const { error } = await supabase
    .from('academic_notes')
    .delete()
    .eq('id', noteId)
    .eq('user_id', user.id)

  if (error) {
    throw new Error(error.message)
  }

  if (subjectId) {
    revalidatePath(`/materias/${subjectId}/calendario`)
  }
  revalidatePath('/calendario')
}
