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
    throw new Error('Debés seleccionar al menos un tema para generar el examen.')
  }

  // 1. Obtener texto de referencia de examen viejo si aplica (Regla 5: solo formato)
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

  // 2. Recuperar chunks por thread de forma independiente (Regla 3: sin sesgar)
  const allRetrievedChunks: RetrievedChunk[] = []
  const threadCoverages: { threadId: string; coverage: 'ok' | 'baja' }[] = []

  for (const threadId of selectedThreadIds) {
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
    .select('id, quiz_type, scope, created_at')
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

  // 5. Generar preguntas estructuradas con Gemini
  const generatedQuestions = await generateQuizQuestions(
    quizType,
    allRetrievedChunks.length > 0
      ? allRetrievedChunks
      : [{ id: '1', document_id: '1', content: 'Conceptos clave de la materia', page_number: 1 }],
    examStyleText
  )

  // 6. Guardar preguntas en quiz_questions
  const savedQuestions = []
  for (const q of generatedQuestions) {
    const { data: qData } = await supabase
      .from('quiz_questions')
      .insert({
        quiz_id: quiz.id,
        question_text: q.question_text,
        question_format: q.question_format,
        options: q.options || null,
        correct_answer: q.correct_answer,
        source_page: q.source_page || null,
      })
      .select('id, question_text, question_format, options, correct_answer, source_page')
      .single()

    if (qData) {
      savedQuestions.push({
        ...qData,
        explanation: q.explanation,
      })
    } else {
      savedQuestions.push({
        id: `q_${Date.now()}_${Math.random()}`,
        question_text: q.question_text,
        question_format: q.question_format,
        options: q.options || null,
        correct_answer: q.correct_answer,
        source_page: q.source_page || null,
        explanation: q.explanation,
      })
    }
  }

  revalidatePath(`/materias/${subjectId}/simulador`)

  return {
    id: quiz.id,
    quiz_type: quiz.quiz_type as 'multiple_choice' | 'desarrollo',
    scope: quiz.scope,
    created_at: quiz.created_at,
    quiz_questions: savedQuestions,
  }
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

export async function deleteQuizAction(
  subjectId: string,
  quizId: string
) {
  const supabase = await createClient()

  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) redirect('/login')

  const { error } = await supabase
    .from('quizzes')
    .delete()
    .eq('id', quizId)
    .eq('subject_id', subjectId)

  if (error) {
    throw new Error(error.message)
  }

  revalidatePath(`/materias/${subjectId}/simulador`)
}
