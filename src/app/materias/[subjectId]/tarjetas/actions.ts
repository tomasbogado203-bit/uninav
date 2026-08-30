'use server'

import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import { revalidatePath } from 'next/cache'
import { generateFlashcardsFromChunks } from '@/lib/supabase/gemini/flashcards'

export interface FlashcardsActionResult {
  success: boolean
  data?: any[]
  error?: string
}

export async function generateFlashcardsAction(
  subjectId: string,
  topicTitle?: string
): Promise<FlashcardsActionResult> {
  try {
    const supabase = await createClient()

    const {
      data: { user },
    } = await supabase.auth.getUser()

    if (!user) redirect('/login')

    // 1. Obtener los documentos tipo 'apunte' de la materia
    const { data: docs } = await supabase
      .from('documents')
      .select('id')
      .eq('subject_id', subjectId)
      .eq('document_type', 'apunte')

    if (!docs || docs.length === 0) {
      return {
        success: false,
        error: 'Debés cargar al menos un apunte PDF en la biblioteca para generar tarjetas didácticas.',
      }
    }

    const docIds = docs.map((d) => d.id)

    // 2. Traer un muestreo representativo de fragmentos (chunks)
    let query = supabase
      .from('document_chunks')
      .select('id, document_id, content, page_number')
      .in('document_id', docIds)

    if (topicTitle && topicTitle !== 'general' && topicTitle !== 'Todas las unidades') {
      query = query.ilike('content', `%${topicTitle.replace(/[^a-zA-Z0-9]/g, '%')}%`)
    }

    let { data: chunks } = await query.limit(12)

    if (!chunks || chunks.length === 0) {
      // Si no encontró por filtro estricto, recuperar los primeros 12 chunks
      const { data: fallbackChunks } = await supabase
        .from('document_chunks')
        .select('id, document_id, content, page_number')
        .in('document_id', docIds)
        .limit(12)

      chunks = fallbackChunks
    }

    if (!chunks || chunks.length === 0) {
      return {
        success: false,
        error: 'No se encontraron fragmentos indexados en los PDFs de esta materia. Verificá que el archivo contenga texto legible.',
      }
    }

    // 3. Generar tarjetas con Gemini
    const generated = await generateFlashcardsFromChunks(chunks, topicTitle)

    if (!generated || generated.length === 0) {
      return {
        success: false,
        error: 'No se pudieron procesar las tarjetas con IA en este momento. Por favor, intentalo de nuevo.',
      }
    }

    // 4. Guardar en Supabase con fallback seguro
    const savedCards = []

    for (let i = 0; i < generated.length; i++) {
      const fc = generated[i]
      const fallbackId = `fc_${Date.now()}_${i}`

      try {
        const { data: inserted, error: dbErr } = await supabase
          .from('flashcards')
          .insert({
            subject_id: subjectId,
            front_text: fc.front_text,
            back_text: fc.back_text,
            source_page: fc.source_page || null,
            mastered: false,
          })
          .select('id, subject_id, front_text, back_text, source_page, mastered')
          .single()

        if (!dbErr && inserted) {
          savedCards.push(inserted)
        } else {
          savedCards.push({
            id: fallbackId,
            subject_id: subjectId,
            front_text: fc.front_text,
            back_text: fc.back_text,
            source_page: fc.source_page || null,
            mastered: false,
          })
        }
      } catch {
        savedCards.push({
          id: fallbackId,
          subject_id: subjectId,
          front_text: fc.front_text,
          back_text: fc.back_text,
          source_page: fc.source_page || null,
          mastered: false,
        })
      }
    }

    revalidatePath(`/materias/${subjectId}/tarjetas`)
    return {
      success: true,
      data: savedCards,
    }
  } catch (err) {
    console.error('Error en generateFlashcardsAction:', err)
    return {
      success: false,
      error:
        err instanceof Error
          ? err.message
          : 'Ocurrió un error inesperado al procesar las tarjetas.',
    }
  }
}

export async function toggleMasteredAction(
  subjectId: string,
  flashcardId: string,
  currentStatus: boolean
) {
  const supabase = await createClient()

  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) redirect('/login')

  try {
    await supabase
      .from('flashcards')
      .update({ mastered: !currentStatus })
      .eq('id', flashcardId)
  } catch {
    // Ignorar si no existe la tabla
  }

  revalidatePath(`/materias/${subjectId}/tarjetas`)
}

export async function deleteFlashcardAction(
  subjectId: string,
  flashcardId: string
) {
  const supabase = await createClient()

  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) redirect('/login')

  try {
    await supabase
      .from('flashcards')
      .delete()
      .eq('id', flashcardId)
  } catch {
    // Ignorar si no existe la tabla
  }

  revalidatePath(`/materias/${subjectId}/tarjetas`)
}
