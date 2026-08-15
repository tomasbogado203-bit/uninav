'use server'

import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import { revalidatePath } from 'next/cache'
import { retrieveChunks } from '@/lib/supabase/rag/retrieve'
import { generateSocraticResponse, type ChatMessageInput } from '@/lib/supabase/gemini/chat'
import { generateMermaidDiagram } from '@/lib/supabase/gemini/diagrams'

export async function createThread(subjectId: string, formData: FormData) {
  const supabase = await createClient()

  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) redirect('/login')

  const title = (formData.get('title') as string) || 'Nuevo Tema'

  const { data: thread, error } = await supabase
    .from('chat_threads')
    .insert({
      subject_id: subjectId,
      title: title.trim(),
    })
    .select('id')
    .single()

  if (error) {
    throw new Error(error.message)
  }

  revalidatePath(`/materias/${subjectId}/temas`)
  return thread.id
}

export async function renameThreadAction(subjectId: string, threadId: string, newTitle: string) {
  const supabase = await createClient()

  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) redirect('/login')

  if (!newTitle || newTitle.trim() === '') {
    throw new Error('El título del tema no puede estar vacío.')
  }

  const { error } = await supabase
    .from('chat_threads')
    .update({ title: newTitle.trim() })
    .eq('id', threadId)
    .eq('subject_id', subjectId)

  if (error) {
    throw new Error(error.message)
  }

  revalidatePath(`/materias/${subjectId}`)
  revalidatePath(`/materias/${subjectId}/temas`)
}

export async function deleteThreadAction(subjectId: string, threadId: string) {
  const supabase = await createClient()

  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) redirect('/login')

  const { error } = await supabase
    .from('chat_threads')
    .delete()
    .eq('id', threadId)
    .eq('subject_id', subjectId)

  if (error) {
    throw new Error(error.message)
  }

  revalidatePath(`/materias/${subjectId}`)
  revalidatePath(`/materias/${subjectId}/temas`)
}

export async function askSocraticTutor(
  subjectId: string,
  userMessage: string,
  history: ChatMessageInput[]
) {
  const supabase = await createClient()

  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) redirect('/login')

  if (!userMessage || userMessage.trim() === '') {
    throw new Error('El mensaje no puede estar vacío.')
  }

  // 1. RAG Vectorial scopeado por materia (excluye exámenes viejos)
  const chunks = await retrieveChunks(subjectId, userMessage.trim(), 5)

  // 2. Generación socrática con Gemini Flash
  const aiResponse = await generateSocraticResponse(userMessage.trim(), history, chunks)

  return {
    response: aiResponse,
    citations: chunks.map((c) => ({
      document_id: c.document_id,
      page_number: c.page_number,
      content: c.content,
    })),
  }
}

export async function getCitationContentAction(subjectId: string, pageNumber?: number | null) {
  const supabase = await createClient()

  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) redirect('/login')

  const { data: docs } = await supabase
    .from('documents')
    .select('id, title')
    .eq('subject_id', subjectId)
    .eq('document_type', 'apunte')

  if (!docs || docs.length === 0) {
    return {
      document_title: 'Bibliografía oficial',
      content: 'No hay fragmentos cargados para esta materia aún.',
      page_number: pageNumber || 1,
    }
  }

  const docIds = docs.map((d) => d.id)

  if (pageNumber) {
    const { data: chunk } = await supabase
      .from('document_chunks')
      .select('content, page_number, document_id')
      .in('document_id', docIds)
      .eq('page_number', pageNumber)
      .limit(1)
      .maybeSingle()

    if (chunk) {
      const docTitle = docs.find((d) => d.id === chunk.document_id)?.title || 'Apunte oficial'
      return {
        document_title: docTitle,
        content: chunk.content,
        page_number: chunk.page_number,
      }
    }
  }

  // Fallback al primer chunk del documento
  const { data: fallbackChunk } = await supabase
    .from('document_chunks')
    .select('content, page_number, document_id')
    .in('document_id', docIds)
    .limit(1)
    .maybeSingle()

  const docTitle = docs.find((d) => d.id === fallbackChunk?.document_id)?.title || 'Apunte oficial'

  return {
    document_title: docTitle,
    content: fallbackChunk?.content || 'Contenido conceptual extraído de la bibliografía oficial de la cursada.',
    page_number: fallbackChunk?.page_number || pageNumber || 1,
  }
}

export async function generateDiagramAction(
  turns: { role: string; content: string }[]
) {
  const supabase = await createClient()

  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) redirect('/login')

  const mermaidCode = await generateMermaidDiagram(turns)
  return mermaidCode
}
