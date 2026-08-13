'use server'

import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import { revalidatePath } from 'next/cache'
import { retrieveChunks } from '@/lib/supabase/rag/retrieve'
import { generateSocraticResponse, type ChatMessageInput } from '@/lib/supabase/gemini/chat'

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
