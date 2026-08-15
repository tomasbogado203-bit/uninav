import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import { createThread } from './actions'
import SocraticChatView from './SocraticChatView'

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

  const createThreadWithSubject = createThread.bind(null, subjectId)

  return (
    <div className="mx-auto max-w-[96rem] p-6 md:p-8">
      {/* Título de la Pestaña */}
      <div className="mb-6 border-b border-slate-200/80 pb-4">
        <span className="text-[10px] font-bold uppercase tracking-wider text-indigo-600 block">
          Tutor Socrático RAG
        </span>
        <h1 className="text-xl font-bold tracking-tight text-slate-900">
          💬 Conversaciones y Temas de Estudio ({subject?.name})
        </h1>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        {/* Sidebar interna de hilos de conversación */}
        <div className="md:col-span-1 border-r border-slate-200/80 pr-4 flex flex-col gap-4">
          <div className="rounded-2xl border border-slate-200/80 bg-white p-4 shadow-sm">
            <h3 className="text-xs font-bold text-slate-800 uppercase tracking-wider mb-2">
              Crear nuevo tema
            </h3>
            <form action={createThreadWithSubject} className="flex flex-col gap-2">
              <input
                type="text"
                name="title"
                placeholder="Ej: Unidad 2 - Redes..."
                required
                className="w-full rounded-xl border border-slate-200 px-3 py-2 text-xs bg-slate-50 focus:bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all"
              />
              <button
                type="submit"
                className="w-full rounded-xl bg-indigo-600 px-3 py-2 text-xs font-semibold text-white shadow-sm hover:bg-indigo-700 transition-all"
              >
                + Crear Tema
              </button>
            </form>
          </div>

          <div className="flex flex-col gap-1.5 overflow-y-auto max-h-[450px]">
            <h3 className="text-[11px] font-bold text-slate-400 uppercase tracking-wider mb-1 px-1">
              Temas activos
            </h3>
            {threads?.map((t) => (
              <div
                key={t.id}
                className="rounded-xl border border-slate-200/80 px-3 py-2.5 text-xs font-medium text-slate-700 bg-white hover:bg-slate-50 hover:border-indigo-200 cursor-pointer transition-all flex items-center justify-between"
              >
                <span className="truncate">💬 {t.title}</span>
              </div>
            ))}
            {(!threads || threads.length === 0) && (
              <p className="text-xs text-slate-400 italic px-1">No hay temas creados aún.</p>
            )}
          </div>
        </div>

        {/* Panel del Chat Socrático */}
        <div className="md:col-span-3">
          <SocraticChatView subjectId={subjectId} />
        </div>
      </div>
    </div>
  )
}
