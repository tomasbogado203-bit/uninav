'use server'

import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import { revalidatePath } from 'next/cache'
import { extractTextByPage } from '@/lib/supabase/pdf/extract'
import { chunkPages } from '@/lib/supabase/rag/chunk'
import { embedText } from '@/lib/supabase/gemini/embeddings'

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

  // Chunking + embeddings, sincrónico (aceptable para hackathon — el alumno
  // espera unos segundos en el submit). Si falla, el documento queda subido
  // igual; no rompemos la UX de upload por un error de la IA.
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
  } catch (err) {
    console.error('Error procesando embeddings del documento:', err)
  }

  revalidatePath(`/materias/${subjectId}`)
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

  revalidatePath(`/materias/${subjectId}`)
}
