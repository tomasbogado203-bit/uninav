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

  // 1. Cargar temas disponibles para scope
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

  return (
    <div className="mx-auto max-w-[96rem] p-6 md:p-8">
      {/* Título de la Pestaña */}
      <div className="mb-6 border-b border-slate-200/80 pb-4">
        <span className="text-[10px] font-bold uppercase tracking-wider text-indigo-600 block">
          Evaluaciones Adaptativas
        </span>
        <h1 className="text-xl font-bold tracking-tight text-slate-900">
          📝 Simulador de Parciales y Quiz ({subject?.name})
        </h1>
      </div>

      {/* Vista principal del Simulador */}
      <QuizView
        subjectId={subjectId}
        threads={threads || []}
        examDocuments={oldExams || []}
      />
    </div>
  )
}
