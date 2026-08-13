import { createClient } from '@/lib/supabase/server'
import Link from 'next/link'
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

  const { data: threads } = await supabase
    .from('chat_threads')
    .select('id, title')
    .eq('subject_id', subjectId)
    .order('created_at', { ascending: false })

  const { data: examDocuments } = await supabase
    .from('documents')
    .select('id, title')
    .eq('subject_id', subjectId)
    .eq('document_type', 'examen_viejo')

  return (
    <div className="mx-auto max-w-4xl px-4 py-10 sm:px-6">
      {/* Encabezado */}
      <div className="mb-6 flex items-center justify-between">
        <div>
          <span className="text-xs font-semibold uppercase tracking-wider text-indigo-600">Workspace Materia</span>
          <h1 className="text-2xl font-bold tracking-tight text-slate-900">{subject?.name}</h1>
        </div>
        <Link
          href="/materias"
          className="rounded-xl border border-slate-200 bg-white px-3.5 py-2 text-xs font-semibold text-slate-700 shadow-sm hover:bg-slate-50 transition-colors"
        >
          ← Volver a materias
        </Link>
      </div>

      {/* Tabs de la materia */}
      <div className="mb-8 flex border-b border-slate-200/80 gap-2">
        <Link
          href={`/materias/${subjectId}`}
          className="border-b-2 border-transparent px-4 py-2.5 text-sm font-medium text-slate-500 hover:text-slate-900 transition-colors"
        >
          📄 Apuntes
        </Link>
        <Link
          href={`/materias/${subjectId}/temas`}
          className="border-b-2 border-transparent px-4 py-2.5 text-sm font-medium text-slate-500 hover:text-slate-900 transition-colors"
        >
          💬 Temas (Chat RAG)
        </Link>
        <Link
          href={`/materias/${subjectId}/simulador`}
          className="border-b-2 border-indigo-600 px-4 py-2.5 text-sm font-semibold text-indigo-600"
        >
          📝 Simulador
        </Link>
        <span className="px-4 py-2.5 text-sm font-medium text-slate-300 cursor-not-allowed">
          📅 Calendario
        </span>
        <span className="px-4 py-2.5 text-sm font-medium text-slate-300 cursor-not-allowed">
          📷 Pizarra
        </span>
      </div>

      {/* Vista principal del Simulador */}
      <QuizView
        subjectId={subjectId}
        threads={threads || []}
        examDocuments={examDocuments || []}
      />
    </div>
  )
}
