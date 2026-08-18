'use server'

import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import { revalidatePath } from 'next/cache'
import { extractTextByPage } from '@/lib/supabase/pdf/extract'
import { chunkPages } from '@/lib/supabase/rag/chunk'
import { embedText } from '@/lib/supabase/gemini/embeddings'
import { extractTopicsFromPdf } from '@/lib/supabase/gemini/chat'

export async function uploadCommunityContributionAction(formData: FormData) {
  const supabase = await createClient()

  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) redirect('/login')

  const { data: profile } = await supabase
    .from('profiles')
    .select('career_id')
    .eq('id', user.id)
    .single()

  if (!profile?.career_id) {
    throw new Error('Debés tener una carrera seleccionada en tu perfil para subir aportes a la comunidad.')
  }

  const file = formData.get('file') as File
  const title = (formData.get('title') as string) || file?.name
  const subjectName = (formData.get('subject_name') as string) || 'Materia General'
  const description = (formData.get('description') as string) || ''
  const resourceType = (formData.get('resource_type') as string) || 'apunte'

  if (!file || file.size === 0) {
    throw new Error('Debés seleccionar un archivo PDF.')
  }

  const buffer = Buffer.from(await file.arrayBuffer())
  const safeFileName = file.name.replace(/[^a-zA-Z0-9._-]/g, '_')
  const path = `${user.id}/community/${Date.now()}-${safeFileName}.pdf`

  const { error: uploadError } = await supabase.storage
    .from('apuntes')
    .upload(path, buffer, { contentType: 'application/pdf' })

  if (uploadError) throw new Error(uploadError.message)


  const { data: contribution, error: insertError } = await supabase
    .from('community_contributions')
    .insert({
      user_id: user.id,
      career_id: profile.career_id,
      subject_name: subjectName.trim(),
      title: title.trim(),
      description: description.trim(),
      resource_type: resourceType,
      file_url: path,
      upvotes_count: 0,
      downloads_count: 0,
    })
    .select('id')
    .single()

  if (insertError) throw new Error(insertError.message)

  revalidatePath('/comunidad')
  return contribution.id
}

export async function toggleUpvoteContributionAction(contributionId: string) {
  const supabase = await createClient()

  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) redirect('/login')

  // Verificar si ya votó
  const { data: existingVote } = await supabase
    .from('community_upvotes')
    .select('id')
    .eq('contribution_id', contributionId)
    .eq('user_id', user.id)
    .maybeSingle()

  if (existingVote) {
    // Quitar voto
    await supabase.from('community_upvotes').delete().eq('id', existingVote.id)
    
    // Decrementar upvotes_count
    const { data: current } = await supabase
      .from('community_contributions')
      .select('upvotes_count')
      .eq('id', contributionId)
      .single()

    const newCount = Math.max(0, (current?.upvotes_count || 1) - 1)
    await supabase
      .from('community_contributions')
      .update({ upvotes_count: newCount })
      .eq('id', contributionId)

    revalidatePath('/comunidad')
    return { upvoted: false, count: newCount }
  } else {
    // Agregar voto
    await supabase.from('community_upvotes').insert({
      contribution_id: contributionId,
      user_id: user.id,
    })

    const { data: current } = await supabase
      .from('community_contributions')
      .select('upvotes_count')
      .eq('id', contributionId)
      .single()

    const newCount = (current?.upvotes_count || 0) + 1
    await supabase
      .from('community_contributions')
      .update({ upvotes_count: newCount })
      .eq('id', contributionId)

    revalidatePath('/comunidad')
    return { upvoted: true, count: newCount }
  }
}

export async function importContributionToSubjectAction(
  contributionId: string,
  targetSubjectId: string
) {
  const supabase = await createClient()

  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) redirect('/login')

  // 1. Obtener aporte comunitario
  const { data: contribution, error: contribError } = await supabase
    .from('community_contributions')
    .select('*')
    .eq('id', contributionId)
    .single()

  if (contribError || !contribution) {
    throw new Error('No se encontró el aporte en la comunidad.')
  }

  // 2. Descargar el archivo desde Storage
  const { data: fileData, error: downloadError } = await supabase.storage
    .from('apuntes')
    .download(contribution.file_url)

  if (downloadError || !fileData) {
    throw new Error('No se pudo acceder al archivo original en la nube.')
  }

  const buffer = Buffer.from(await fileData.arrayBuffer())
  const safeFileName = contribution.title.replace(/[^a-zA-Z0-9._-]/g, '_')
  const newPath = `${user.id}/${targetSubjectId}/${Date.now()}-${safeFileName}.pdf`

  // 3. Subir copia al storage de la materia del usuario
  await supabase.storage
    .from('apuntes')
    .upload(newPath, buffer, { contentType: 'application/pdf' })

  // 4. Crear registro en documents
  const isExamen = contribution.resource_type === 'parcial_resuelto'
  const { data: newDoc, error: docError } = await supabase
    .from('documents')
    .insert({
      user_id: user.id,
      subject_id: targetSubjectId,
      title: `[Comunidad] ${contribution.title}`,
      file_url: newPath,
      document_type: isExamen ? 'examen_viejo' : 'apunte',
    })
    .select('id')
    .single()

  if (docError || !newDoc) {
    throw new Error('Error al registrar documento en tu materia.')
  }

  // 5. Chunking + embeddings + extracción de temas para RAG inmediato
  try {
    const pages = await extractTextByPage(buffer)
    const chunks = chunkPages(pages)

    for (const chunk of chunks) {
      const embedding = await embedText(chunk.content, 'RETRIEVAL_DOCUMENT')

      await supabase.from('document_chunks').insert({
        document_id: newDoc.id,
        content: chunk.content,
        page_number: chunk.page_number,
        embedding,
      })
    }

    if (!isExamen && pages.length > 0) {
      try {
        const detectedTopics = await extractTopicsFromPdf(pages)
        if (detectedTopics && detectedTopics.length > 0) {
          const { data: existingThreads } = await supabase
            .from('chat_threads')
            .select('title')
            .eq('subject_id', targetSubjectId)

          const existingTitles = new Set(
            (existingThreads || []).map((t) => t.title.toLowerCase().trim())
          )

          for (const topicTitle of detectedTopics) {
            if (!existingTitles.has(topicTitle.toLowerCase().trim())) {
              await supabase.from('chat_threads').insert({
                subject_id: targetSubjectId,
                title: topicTitle,
              })
            }
          }
        }
      } catch {
        // Ignorar
      }
    }
  } catch (err) {
    console.error('Error indexando apunte importado:', err)
  }

  // Incrementar descargas del aporte
  await supabase
    .from('community_contributions')
    .update({ downloads_count: (contribution.downloads_count || 0) + 1 })
    .eq('id', contributionId)

  revalidatePath(`/materias/${targetSubjectId}`)
  revalidatePath(`/materias/${targetSubjectId}/temas`)
  revalidatePath('/comunidad')
}

export async function deleteContributionAction(contributionId: string) {
  const supabase = await createClient()

  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) redirect('/login')

  const { error } = await supabase
    .from('community_contributions')
    .delete()
    .eq('id', contributionId)
    .eq('user_id', user.id)

  if (error) throw new Error(error.message)

  revalidatePath('/comunidad')
}
