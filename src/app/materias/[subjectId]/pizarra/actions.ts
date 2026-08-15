'use server'

import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import { revalidatePath } from 'next/cache'
import { analyzeBoardPhoto } from '@/lib/supabase/gemini/ocr'
import { generateStudyRoadmap } from '@/lib/supabase/gemini/roadmap'

export async function uploadBoardPhotoAction(
  subjectId: string,
  formData: FormData
) {
  const supabase = await createClient()

  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) redirect('/login')

  const file = formData.get('file') as File
  const skipOcr = formData.get('skip_ocr') === 'true'
  const classDate = (formData.get('class_date') as string) || new Date().toISOString().split('T')[0]

  if (!file || file.size === 0) {
    throw new Error('Debes seleccionar una imagen de pizarra (JPEG o PNG).')
  }

  // 1. Convertir imagen a Buffer
  const arrayBuffer = await file.arrayBuffer()
  const buffer = Buffer.from(arrayBuffer)
  const sanitizedFileName = file.name.replace(/[^a-zA-Z0-9._-]/g, '_')
  const filePath = `${user.id}/${subjectId}/pizarra/${Date.now()}-${sanitizedFileName}`

  // 2. Subir imagen a Supabase Storage (bucket 'apuntes')
  const { error: uploadError } = await supabase.storage
    .from('apuntes')
    .upload(filePath, buffer, {
      contentType: file.type || 'image/jpeg',
      upsert: false,
    })

  if (uploadError) {
    throw new Error(`Error al subir imagen: ${uploadError.message}`)
  }

  let ocrText: string | null = null
  let detectedEvents: any[] = []

  // 3. Ejecutar OCR solo si el usuario no solicitó omitirlo
  if (!skipOcr) {
    try {
      const analysis = await analyzeBoardPhoto(buffer, file.type || 'image/jpeg')
      ocrText = analysis.ocr_text
      detectedEvents = analysis.detected_events || []
    } catch {
      ocrText = null
    }
  }

  // 4. Registrar en la tabla board_photos
  const { data: photoData, error: dbError } = await supabase
    .from('board_photos')
    .insert({
      subject_id: subjectId,
      photo_url: filePath,
      class_date: classDate,
      ocr_text: ocrText,
      ocr_status: 'done',
    })
    .select('id')
    .single()

  if (dbError) {
    throw new Error(`Error guardando en BD: ${dbError.message}`)
  }

  // 5. Registrar eventos detectados como sugerencias (confirmed = false, Regla 7)
  if (detectedEvents && detectedEvents.length > 0) {
    const eventsToInsert = detectedEvents.map((evt) => ({
      board_photo_id: photoData.id,
      suggested_title: evt.suggested_title || 'Evaluación en Pizarra',
      suggested_type: evt.suggested_type || 'parcial',
      suggested_date: evt.suggested_date || new Date().toISOString().split('T')[0],
      confirmed: false,
    }))

    await supabase.from('detected_events').insert(eventsToInsert)
  }

  revalidatePath(`/materias/${subjectId}/pizarra`)
}

export async function analyzePhotoOnDemandAction(
  subjectId: string,
  photoId: string,
  photoUrl: string
) {
  const supabase = await createClient()

  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) redirect('/login')

  const { data: fileData, error: downloadError } = await supabase.storage
    .from('apuntes')
    .download(photoUrl)

  if (downloadError || !fileData) {
    throw new Error('No se pudo descargar la imagen para el análisis.')
  }

  const arrayBuffer = await fileData.arrayBuffer()
  const buffer = Buffer.from(arrayBuffer)
  const mimeType = fileData.type || 'image/jpeg'

  const analysis = await analyzeBoardPhoto(buffer, mimeType)

  await supabase
    .from('board_photos')
    .update({
      ocr_text: analysis.ocr_text,
      ocr_status: 'done',
    })
    .eq('id', photoId)

  if (analysis.detected_events && analysis.detected_events.length > 0) {
    const eventsToInsert = analysis.detected_events.map((evt) => ({
      board_photo_id: photoId,
      suggested_title: evt.suggested_title || 'Evaluación en Pizarra',
      suggested_type: evt.suggested_type || 'parcial',
      suggested_date: evt.suggested_date || new Date().toISOString().split('T')[0],
      confirmed: false,
    }))

    await supabase.from('detected_events').insert(eventsToInsert)
  }

  revalidatePath(`/materias/${subjectId}/pizarra`)
}

export async function confirmDetectedEventAction(
  subjectId: string,
  detectedEventId: string,
  title: string,
  eventType: 'parcial' | 'entrega_tp' | 'final',
  eventDate: string
) {
  const supabase = await createClient()

  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) redirect('/login')

  // 1. Obtener temas para la Hoja de Ruta IA
  const { data: threads } = await supabase
    .from('chat_threads')
    .select('title')
    .eq('subject_id', subjectId)

  const topics = threads?.map((t) => t.title) || []

  // 2. Generar Roadmap IA
  const roadmap = await generateStudyRoadmap(title, eventDate, eventType, topics)

  // 3. Insertar en academic_events
  const { error: eventError } = await supabase.from('academic_events').insert({
    subject_id: subjectId,
    title: title.trim(),
    event_type: eventType,
    event_date: eventDate,
    study_roadmap: roadmap,
  })

  if (eventError) {
    throw new Error(eventError.message)
  }

  // 4. Marcar detected_events como confirmado (confirmed = true, Regla 7)
  await supabase
    .from('detected_events')
    .update({ confirmed: true })
    .eq('id', detectedEventId)

  revalidatePath(`/materias/${subjectId}/pizarra`)
  revalidatePath(`/materias/${subjectId}/calendario`)
}

export async function deleteBoardPhotoAction(
  subjectId: string,
  photoId: string,
  photoUrl: string
) {
  const supabase = await createClient()

  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) redirect('/login')

  // 1. Borrar archivo de Storage
  if (photoUrl) {
    await supabase.storage.from('apuntes').remove([photoUrl])
  }

  // 2. Borrar registro de board_photos
  const { error } = await supabase
    .from('board_photos')
    .delete()
    .eq('id', photoId)
    .eq('subject_id', subjectId)

  if (error) {
    throw new Error(error.message)
  }

  revalidatePath(`/materias/${subjectId}/pizarra`)
}
