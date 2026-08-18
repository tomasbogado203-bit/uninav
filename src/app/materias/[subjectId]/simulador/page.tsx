import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import QuizView from './QuizView'

export default async function SimuladorPage({
  params,
}: {
  params: Promise<{ subjectId: string }>
}) {
  const { subjectId } = await params
  const supabase = await createClient()

  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) redirect('/login')

  const { data: subject } = await supabase
    .from('subjects')
    .select('name')
    .eq('id', subjectId)
    .single()

  // 1. Cargar temas disponibles
  const { data: threads } = await supabase
    .from('chat_threads')
    .select('id, title')
    .eq('subject_id', subjectId)
    .order('created_at', { ascending: false })

  // 2. Cargar exámenes viejos como referencia de estilo (Regla 5)
  const { data: oldExams } = await supabase
    .from('documents')
    .select('id, title')
    .eq('subject_id', subjectId)
    .eq('document_type', 'examen_viejo')

  // 3. Cargar historial de quizzes generados con sus preguntas e intentos
  let existingQuizzes: any[] = []
  try {
    const { data: quizzesData } = await supabase
      .from('quizzes')
      .select(`
        id,
        quiz_type,
        scope,
        created_at,
        quiz_questions (
          id,
          question_text,
          question_format,
          options,
          correct_answer,
          source_page
        ),
        quiz_attempts (
          id,
          score,
          answers,
          attempted_at
        )
      `)
      .eq('subject_id', subjectId)
      .order('created_at', { ascending: false })

    existingQuizzes = quizzesData || []
  } catch {
    existingQuizzes = []
  }

  return (
    <div className="mx-auto max-w-[96rem] p-4 md:p-6">
      {/* Vista principal del Simulador */}
      <QuizView
        subjectId={subjectId}
        subjectName={subject?.name || 'Materia'}
        threads={threads || []}
        examDocuments={oldExams || []}
        existingQuizzes={existingQuizzes}
      />
    </div>
  )
}
