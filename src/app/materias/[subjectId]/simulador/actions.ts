'use server'

import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import { revalidatePath } from 'next/cache'
import { retrieveChunks, type RetrievedChunk } from '@/lib/supabase/rag/retrieve'
import { generateQuizQuestions } from '@/lib/supabase/gemini/quiz'

export async function createQuizAction(
  subjectId: string,
  formData: FormData
) {
  const supabase = await createClient()

  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) redirect('/login')

  const quizType = (formData.get('quiz_type') as 'multiple_choice' | 'desarrollo') || 'multiple_choice'
  const scope = (formData.get('scope') as 'tema_unico' | 'integrador') || 'tema_unico'
  const selectedThreadIds = formData.getAll('thread_ids') as string[]
  const styleReferenceDocumentId = (formData.get('style_reference_document_id') as string) || null

  if (selectedThreadIds.length === 0) {
    throw new Error('Debés seleccionar al menos un tema o hilo para generar el examen.')
  }

  // 1. Obtener texto de referencia si se seleccionó un examen viejo (Regla 5: solo formato/estilo)
  let examStyleText: string | undefined = undefined
  if (styleReferenceDocumentId) {
    const { data: styleDoc } = await supabase
      .from('documents')
      .select('id')
      .eq('id', styleReferenceDocumentId)
      .single()

    if (styleDoc) {
      const { data: styleChunks } = await supabase
        .from('document_chunks')
        .select('content')
        .eq('document_id', styleDoc.id)
        .limit(3)

      if (styleChunks && styleChunks.length > 0) {
        examStyleText = styleChunks.map((c) => c.content).join('\n')
      }
    }
  }

  // 2. Recuperar chunks por thread de forma independiente (Regla 3: sin sesgar hacia un tema)
  const allRetrievedChunks: RetrievedChunk[] = []
  const threadCoverages: { threadId: string; coverage: 'ok' | 'baja' }[] = []

  for (const threadId of selectedThreadIds) {
    // Obtener título del tema
    const { data: threadData } = await supabase
      .from('chat_threads')
      .select('title')
      .eq('id', threadId)
      .single()

    const query = threadData?.title || 'Conceptos principales'
    const chunks = await retrieveChunks(subjectId, query, 4)

    const coverage = chunks.length < 3 ? 'baja' : 'ok'
    threadCoverages.push({ threadId, coverage })

    allRetrievedChunks.push(...chunks)
  }

  // 3. Crear registro en tabla quizzes
  const { data: quiz, error: quizError } = await supabase
    .from('quizzes')
    .insert({
      subject_id: subjectId,
      quiz_type: quizType,
      scope: scope,
      style_reference_document_id: styleReferenceDocumentId || null,
    })
    .select('id')
    .single()

  if (quizError || !quiz) {
    throw new Error(quizError?.message || 'No se pudo registrar el examen.')
  }

  // 4. Guardar relaciones en quiz_threads
  for (const tc of threadCoverages) {
    await supabase.from('quiz_threads').insert({
      quiz_id: quiz.id,
      thread_id: tc.threadId,
      coverage: tc.coverage,
    })
  }

  // 5. Generar preguntas estructuradas con Gemini 3.6 Flash
  const questions = await generateQuizQuestions(
    quizType,
    allRetrievedChunks.length > 0 ? allRetrievedChunks : [{ id: '1', document_id: '1', content: 'Conceptos de la materia', page_number: 1 }],
    examStyleText
  )

  // 6. Guardar preguntas en quiz_questions
  for (const q of questions) {
    await supabase.from('quiz_questions').insert({
      quiz_id: quiz.id,
      question_text: q.question_text,
      question_format: q.question_format,
      options: q.options || null,
      correct_answer: q.correct_answer,
      source_page: q.source_page || null,
    })
  }

  revalidatePath(`/materias/${subjectId}/simulador`)
  return quiz.id
}

export async function submitQuizAttemptAction(
  subjectId: string,
  quizId: string,
  score: number,
  answers: Record<string, string>
) {
  const supabase = await createClient()

  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) redirect('/login')

  const { error } = await supabase.from('quiz_attempts').insert({
    quiz_id: quizId,
    score: score,
    answers: answers,
  })

  if (error) {
    throw new Error(error.message)
  }

  revalidatePath(`/materias/${subjectId}/simulador`)
}
