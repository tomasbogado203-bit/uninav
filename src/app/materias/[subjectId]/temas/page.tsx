import { createClient } from '@/lib/supabase/server'
import Link from 'next/link'
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
    <div className="mx-auto max-w-5xl px-4 py-10 sm:px-6">
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
          className="border-b-2 border-indigo-600 px-4 py-2.5 text-sm font-semibold text-indigo-600"
        >
          💬 Temas (Chat RAG)
        </Link>
        <Link
          href={`/materias/${subjectId}/simulador`}
          className="border-b-2 border-transparent px-4 py-2.5 text-sm font-medium text-slate-500 hover:text-slate-900 transition-colors"
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

      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        {/* Sidebar de hilos de conversación */}
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
