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

  // 1. Obtener materia actual
  const { data: subject } = await supabase
    .from('subjects')
    .select('id, name, color')
    .eq('id', subjectId)
    .single()

  // 2. Obtener todas las materias del usuario
  const { data: userSubjects } = await supabase
    .from('subjects')
    .select('id, name, color')
    .eq('user_id', user.id)
    .order('name', { ascending: true })

  const allSubjects = userSubjects || []

  // 3. Obtener eventos académicos de TODAS las materias del usuario
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

  // 4. Obtener notas adhesivas Post-it de todas las materias del usuario
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

  // 5. Consultar vista de semanas críticas
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
    <div className="mx-auto max-w-[96rem] p-4 md:p-6">
      {/* Vista Principal del Calendario y Notas */}
      <CalendarView
        subjectId={subjectId}
        currentSubjectName={subject?.name || 'Materia'}
        allSubjects={allSubjects}
        events={events}
        notes={notes}
        criticalWeeksCount={criticalCount}
      />
    </div>
  )
}
