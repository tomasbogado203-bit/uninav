import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import CalendarView from './CalendarView'

export default async function CalendarioPage({
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

  // 1. Obtener eventos académicos agendados (con fallback para title)
  let events: { id: string; title: string; event_type: 'parcial' | 'entrega_tp' | 'final'; event_date: string; study_roadmap: any }[] = []
  try {
    const { data: rawEvents } = await supabase
      .from('academic_events')
      .select('*')
      .eq('subject_id', subjectId)
      .order('event_date', { ascending: true })

    events =
      rawEvents?.map((e) => ({
        id: e.id as string,
        title: (e.title as string) || (e.event_type as string) || 'Evaluación',
        event_type: e.event_type as 'parcial' | 'entrega_tp' | 'final',
        event_date: e.event_date as string,
        study_roadmap: e.study_roadmap,
      })) || []
  } catch {
    events = []
  }

  // 2. Obtener notas adhesivas Post-it
  let notes: any[] = []
  try {
    const { data: notesData } = await supabase
      .from('academic_notes')
      .select('id, title, content, color, event_date, created_at')
      .eq('subject_id', subjectId)
      .eq('user_id', user.id)
      .order('created_at', { ascending: false })

    notes = notesData || []
  } catch {
    notes = []
  }

  // 3. Consultar vista de semanas críticas
  let criticalCount = 0
  try {
    const { data: criticalWeeks } = await supabase
      .from('critical_weeks')
      .select('total_events')
      .eq('subject_id', subjectId)

    criticalCount = criticalWeeks?.length || 0
  } catch {
    criticalCount = 0
  }

  return (
    <div className="mx-auto max-w-[96rem] p-6 md:p-8">
      {/* Título de la Pestaña */}
      <div className="mb-6 border-b border-slate-200/80 pb-4">
        <span className="text-[10px] font-bold uppercase tracking-wider text-indigo-600 block">
          Planificación Académica
        </span>
        <h1 className="text-xl font-bold tracking-tight text-slate-900">
          📅 Calendario de Exámenes y Notas Post-it ({subject?.name})
        </h1>
      </div>

      {/* Vista Principal del Calendario y Notas */}
      <CalendarView
        subjectId={subjectId}
        events={events}
        notes={notes}
        criticalWeeksCount={criticalCount}
      />
    </div>
  )
}
