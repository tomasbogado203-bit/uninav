import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import Link from 'next/link'
import CalendarView from '@/app/materias/[subjectId]/calendario/CalendarView'
import { IconBook, IconCalendar, IconHome } from '@/components/icons'

export default async function GlobalCalendarioPage() {
  const supabase = await createClient()

  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) redirect('/login')

  // 1. Obtener materias del usuario
  const { data: userSubjects } = await supabase
    .from('subjects')
    .select('id, name, color')
    .eq('user_id', user.id)
    .order('name', { ascending: true })

  const allSubjects = userSubjects || []

  // 2. Obtener eventos de todas las materias
  let events: any[] = []
  try {
    const { data: rawEvents } = await supabase
      .from('academic_events')
      .select('id, subject_id, title, event_type, event_date, study_roadmap, subjects(name, color)')
      .order('event_date', { ascending: true })

    events =
      rawEvents?.map((e: any) => ({
        id: e.id,
        subject_id: e.subject_id,
        subject_name: e.subjects?.name || 'Materia',
        subject_color: e.subjects?.color,
        title: e.title || e.event_type || 'Evaluación',
        event_type: e.event_type,
        event_date: e.event_date,
        study_roadmap: e.study_roadmap,
      })) || []
  } catch {
    events = []
  }

  // 3. Obtener notas adhesivas de todas las materias
  let notes: any[] = []
  try {
    const { data: notesData } = await supabase
      .from('academic_notes')
      .select('id, subject_id, title, content, color, event_date, created_at, subjects(name)')
      .eq('user_id', user.id)
      .order('created_at', { ascending: false })

    notes =
      notesData?.map((n: any) => ({
        id: n.id,
        subject_id: n.subject_id,
        subject_name: n.subjects?.name,
        title: n.title,
        content: n.content,
        color: n.color,
        event_date: n.event_date,
        created_at: n.created_at,
      })) || []
  } catch {
    notes = []
  }

  // 4. Semanas críticas
  let criticalCount = 0
  try {
    const { data: criticalWeeks } = await supabase
      .from('critical_weeks')
      .select('total_events')

    criticalCount = criticalWeeks?.length || 0
  } catch {
    criticalCount = 0
  }

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900 font-sans antialiased">
      {/* Barra de Navegación Superior */}
      <header className="border-b border-slate-200/80 bg-white/95 backdrop-blur-xs sticky top-0 z-40 px-6 py-3.5 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Link
            href="/"
            className="flex h-8 w-8 items-center justify-center rounded-xl bg-indigo-600 text-white font-black text-sm shadow-xs"
          >
            U
          </Link>
          <div>
            <h1 className="text-sm font-bold text-slate-900 leading-tight">UniNav</h1>
            <span className="text-[10px] text-indigo-600 font-semibold uppercase tracking-wider block">
              Calendario Académico General
            </span>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <Link
            href="/materias"
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl border border-slate-200 text-xs font-semibold text-slate-600 hover:bg-slate-50 hover:text-slate-900 transition-colors shadow-2xs"
          >
            <IconBook className="w-4 h-4" />
            Mis Materias
          </Link>
          <Link
            href="/"
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-indigo-600 text-white text-xs font-semibold hover:bg-indigo-700 transition-colors shadow-2xs"
          >
            <IconHome className="w-4 h-4" />
            Inicio
          </Link>
        </div>
      </header>

      {/* Contenido Principal */}
      <main className="mx-auto max-w-[96rem] p-4 md:p-6">

        <CalendarView
          allSubjects={allSubjects}
          events={events}
          notes={notes}
          criticalWeeksCount={criticalCount}
        />
      </main>
    </div>
  )
}
