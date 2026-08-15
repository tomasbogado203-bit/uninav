import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import SocraticChatView from './SocraticChatView'
import ThreadManager from './ThreadManager'

export default async function TemasPage({
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

      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        {/* Sidebar interna de gestor de temas */}
        <div className="md:col-span-1 border-r border-slate-200/80 pr-4">
          <ThreadManager subjectId={subjectId} initialThreads={threads || []} />
        </div>

        {/* Panel del Chat Socrático */}
        <div className="md:col-span-3">
          <SocraticChatView subjectId={subjectId} />
        </div>
      </div>
    </div>
  )
}
