'use server'

import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import { revalidatePath } from 'next/cache'
import { extractTextByPage } from '@/lib/supabase/pdf/extract'
import { chunkPages } from '@/lib/supabase/rag/chunk'
import { embedText } from '@/lib/supabase/gemini/embeddings'
import { extractTopicsFromPdf } from '@/lib/supabase/gemini/chat'

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
          // Obtener temas existentes para evitar duplicados
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
