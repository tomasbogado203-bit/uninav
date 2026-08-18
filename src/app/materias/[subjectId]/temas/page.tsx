import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import TemasWorkspace from './TemasWorkspace'

export default async function TemasPage({
  params,
  searchParams,
}: {
  params: Promise<{ subjectId: string }>
  searchParams: Promise<{ threadId?: string }>
}) {
  const { subjectId } = await params
  const { threadId } = await searchParams
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
    .select('id, title, created_at')
    .eq('subject_id', subjectId)
    .order('created_at', { ascending: false })

  return (
    <div className="mx-auto max-w-[96rem] p-6 md:p-8">
      {/* Título de la Pestaña */}
      <div className="mb-6 border-b border-slate-200/80 pb-4">
        <span className="text-[10px] font-bold uppercase tracking-wider text-indigo-600 block">
          Tutor Socrático RAG
        </span>
        <h1 className="text-xl font-bold tracking-tight text-slate-900">
          Conversaciones y Temas de Estudio ({subject?.name || 'Materia'})
        </h1>
      </div>

      <TemasWorkspace
        subjectId={subjectId}
        subjectName={subject?.name || 'Materia'}
        initialThreads={threads || []}
        initialThreadId={threadId}
      />
    </div>
  )
}
