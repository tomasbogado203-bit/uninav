import { createClient } from '@/lib/supabase/server'
import { uploadDocument, deleteDocument } from './actions'
import SubjectProgressPanel, { SubjectMetrics } from '@/components/SubjectProgressPanel'

export default async function SubjectPage({
  params,
}: {
  params: Promise<{ subjectId: string }>
}) {
  const { subjectId } = await params
  const supabase = await createClient()

  const { data: subject } = await supabase
    .from('subjects')
    .select('name, color')
    .eq('id', subjectId)
    .single()

  // 1. Apuntes y Chunks
  const { data: documents } = await supabase
    .from('documents')
    .select('id, title, document_type, created_at, document_chunks(count)')
    .eq('subject_id', subjectId)
    .order('created_at', { ascending: false })

  let totalChunks = 0
  documents?.forEach((d) => {
    const count = (d.document_chunks as unknown as { count: number }[])?.[0]?.count ?? 0
    totalChunks += count
  })

  // 2. Chat Threads (Tutor Socrático)
  const { count: threadsCount } = await supabase
    .from('chat_threads')
    .select('*', { count: 'exact', head: true })
    .eq('subject_id', subjectId)

  // 3. Quiz Attempts & Average Score
  let quizAttemptsCount = 0
  let averageScore = 0
  try {
    const { data: quizzes } = await supabase
      .from('quizzes')
      .select('id, quiz_attempts(score)')
      .eq('subject_id', subjectId)

    let totalScore = 0
    quizzes?.forEach((q) => {
      const attempts = (q.quiz_attempts as unknown as { score: number }[]) || []
      quizAttemptsCount += attempts.length
      attempts.forEach((a) => (totalScore += a.score))
    })

    if (quizAttemptsCount > 0) {
      averageScore = Math.round(totalScore / quizAttemptsCount)
    }
  } catch {
    // Ignorar errores en la consulta de quizes
  }

  // 4. Fotos de Pizarra
  let photosCount = 0
  try {
    const { count } = await supabase
      .from('board_photos')
      .select('*', { count: 'exact', head: true })
      .eq('subject_id', subjectId)

    photosCount = count || 0
  } catch {
    photosCount = 0
  }

  // 5. Próximo Examen Agendado
  const todayStr = new Date().toISOString().split('T')[0]
  let nextEvent: any = null
  try {
    const { data: upcomingEvents } = await supabase
      .from('academic_events')
      .select('title, event_type, event_date')
      .eq('subject_id', subjectId)
      .gte('event_date', todayStr)
      .order('event_date', { ascending: true })
      .limit(1)

    nextEvent = upcomingEvents?.[0] || null
  } catch {
    nextEvent = null
  }

  const metrics: SubjectMetrics = {
    documentsCount: documents?.length ?? 0,
    chunksCount: totalChunks,
    threadsCount: threadsCount ?? 0,
    quizAttemptsCount,
    averageScore,
    photosCount,
    nextEventTitle: nextEvent?.title,
    nextEventDate: nextEvent?.event_date,
    nextEventType: nextEvent?.event_type,
  }

  const uploadWithSubject = uploadDocument.bind(null, subjectId)

  return (
    <div className="mx-auto max-w-[96rem] p-6 md:p-8 flex flex-col gap-8">
      {/* Panel de Diagnóstico "Dónde estoy parado" */}
      <SubjectProgressPanel
        subjectName={subject?.name || 'Materia'}
        metrics={metrics}
      />

      {/* Sección Gestor de Apuntes e Indexación RAG */}
      <div className="flex flex-col gap-6">
        <div className="border-b border-slate-200/80 pb-4">
          <span className="text-[10px] font-bold uppercase tracking-wider text-indigo-600 block">
            Biblioteca de Estudio
          </span>
          <h1 className="text-xl font-bold tracking-tight text-slate-900">
            📄 Apuntes e Indexación RAG
          </h1>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          {/* Lista de Apuntes */}
          <div className="md:col-span-2">
            <h2 className="mb-3 text-sm font-semibold text-slate-700">Apuntes Cargados</h2>
            <ul className="flex flex-col gap-3">
              {documents?.map((d) => {
                const chunkCount = (d.document_chunks as unknown as { count: number }[])?.[0]?.count ?? 0
                const deleteWithIds = deleteDocument.bind(null, subjectId, d.id)

                return (
                  <li
                    key={d.id}
                    className="rounded-2xl border border-slate-200/80 bg-white p-4 shadow-sm hover:border-slate-300 transition-all flex items-start justify-between gap-3"
                  >
                    <div className="flex-1">
                      <div className="flex items-center gap-2">
                        <h3 className="font-semibold text-slate-900 text-sm">{d.title}</h3>
                        {d.document_type === 'examen_viejo' ? (
                          <span className="rounded-full bg-amber-50 px-2 py-0.5 text-[10px] font-semibold text-amber-800 border border-amber-200/60 shrink-0">
                            Examen anterior
                          </span>
                        ) : (
                          <span className="rounded-full bg-indigo-50 px-2 py-0.5 text-[10px] font-semibold text-indigo-700 border border-indigo-100 shrink-0">
                            Apunte teórico
                          </span>
                        )}
                      </div>
                      <p className="mt-1 text-xs text-slate-500">
                        {chunkCount > 0 ? (
                          <span className="inline-flex items-center text-emerald-600 font-medium">
                            ✓ {chunkCount} fragmentos bibliográficos indexados
                          </span>
                        ) : (
                          <span className="inline-flex items-center text-amber-600 font-medium">
                            ⏳ Procesando (o falló indexado)
                          </span>
                        )}
                      </p>
                    </div>

                    <form action={deleteWithIds} className="shrink-0">
                      <button
                        type="submit"
                        className="rounded-lg px-2.5 py-1 text-xs font-medium text-slate-400 hover:text-rose-600 hover:bg-rose-50 border border-transparent hover:border-rose-100 transition-all"
                        title="Eliminar apunte y sus fragmentos"
                      >
                        🗑️ Eliminar
                      </button>
                    </form>
                  </li>
                )
              })}
              {(!documents || documents.length === 0) && (
                <div className="rounded-2xl border border-dashed border-slate-300 bg-white p-8 text-center">
                  <p className="text-sm text-slate-500">Todavía no subiste apuntes para esta materia.</p>
                  <p className="mt-1 text-xs text-slate-400">Usá el formulario lateral para cargar tu primer apunte PDF.</p>
                </div>
              )}
            </ul>
          </div>

          {/* Subida de Apuntes Form */}
          <div className="md:col-span-1">
            <div className="rounded-2xl border border-slate-200/80 bg-white p-5 shadow-sm sticky top-6">
              <h3 className="text-sm font-semibold text-slate-900">Subir apunte PDF</h3>
              <p className="mt-1 text-xs text-slate-500 mb-4">
                Cargá la bibliografía de tu materia en PDF para habilitar las respuestas del tutor RAG.
              </p>

              <form action={uploadWithSubject} className="flex flex-col gap-3">
                <div>
                  <label className="block text-[11px] font-semibold text-slate-600 mb-1">Título (opcional)</label>
                  <input
                    type="text"
                    name="title"
                    placeholder="Ej: Unidad 1 - Algoritmos"
                    className="w-full rounded-xl border border-slate-200 px-3 py-2 text-xs bg-slate-50 focus:bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all"
                  />
                </div>

                <div>
                  <label className="block text-[11px] font-semibold text-slate-600 mb-1">Archivo PDF</label>
                  <input
                    type="file"
                    name="file"
                    accept="application/pdf"
                    required
                    className="w-full rounded-xl border border-slate-200 px-3 py-2 text-xs bg-slate-50 focus:bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all"
                  />
                </div>

                <label className="flex items-start gap-2 text-xs text-slate-600 mt-1 cursor-pointer">
                  <input type="checkbox" name="document_type" value="examen_viejo" className="mt-0.5 rounded border-slate-300 text-indigo-600" />
                  <span>Es un examen anterior (se usará solo para formato de parciales, no como bibliografía)</span>
                </label>

                <button
                  type="submit"
                  className="mt-2 w-full rounded-xl bg-indigo-600 px-4 py-2.5 text-xs font-semibold text-white shadow-sm hover:bg-indigo-700 transition-all"
                >
                  Subir e Indexar
                </button>
              </form>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
