import { createClient } from '@/lib/supabase/server'
import Link from 'next/link'
import { cookies } from 'next/headers'
import GlobalCalendarWidget from '@/components/GlobalCalendarWidget'
import JoinCommissionCard from '@/components/JoinCommissionCard'
import RoleSwitcherPill from '@/components/RoleSwitcherPill'
import { getOrUpdateStudyStreak } from '@/lib/supabase/streak'

import {
  IconBook,
  IconChat,
  IconQuiz,
  IconCalendar,
  IconCamera,
  IconFlame,
  IconDocument,
  IconSparkles,
  IconLightbulb,
  IconChevronRight,
  IconUsers,
} from '@/components/icons'

export default async function DashboardPage() {
  const supabase = await createClient()

  const {
    data: { user },
  } = await supabase.auth.getUser()

  const { data: profile } = await supabase
    .from('profiles')
    .select('full_name, university, career_id, role, careers(name)')
    .eq('id', user?.id)
    .single()

  const cookieStore = await cookies()
  const cookieRole = cookieStore.get('uninav_demo_role')?.value as
    | 'student'
    | 'professor'
    | 'dean'
    | 'admin'
    | undefined

  const userRole =
    cookieRole && ['student', 'professor', 'dean', 'admin'].includes(cookieRole)
      ? cookieRole
      : (profile?.role as 'student' | 'professor' | 'dean' | 'admin') || 'student'

  const isProfessor = userRole === 'professor' || userRole === 'admin' || userRole === 'dean'
  const isDean = userRole === 'dean' || userRole === 'admin'
  const isStudent = userRole === 'student'


  const careerName = (profile?.careers as unknown as { name: string } | null)?.name

  const streakInfo = user ? await getOrUpdateStudyStreak(user.id) : null

  const { data: subjects } = await supabase
    .from('subjects')
    .select('id, name, color')
    .eq('user_id', user?.id)

  const subjectIds = subjects?.map((s) => s.id) || []


  // Consultar eventos académicos consolidados de todas las materias del usuario
  let globalEvents: any[] = []
  if (subjectIds.length > 0) {
    try {
      const { data: rawEvents } = await supabase
        .from('academic_events')
        .select('id, subject_id, title, event_type, event_date, subjects(name)')
        .in('subject_id', subjectIds)
        .order('event_date', { ascending: true })

      globalEvents =
        rawEvents?.map((e) => ({
          id: e.id,
          subject_id: e.subject_id,
          subject_name: (e.subjects as unknown as { name: string } | null)?.name || 'Materia',
          title: e.title || e.event_type || 'Evaluación',
          event_type: e.event_type,
          event_date: e.event_date,
        })) || []
    } catch {
      globalEvents = []
    }
  }

  // Consultar notas adhesivas consolidadas
  let globalNotes: any[] = []
  try {
    const { data: notesData } = await supabase
      .from('academic_notes')
      .select('id, subject_id, title, content, color, event_date')
      .eq('user_id', user?.id)

    globalNotes = notesData || []
  } catch {
    globalNotes = []
  }

  return (
    <div className="mx-auto max-w-[96rem] px-4 py-8 sm:px-6 flex flex-col gap-8 select-none">
      {/* Hero Welcome Card con Racha de Estudio Destacada */}
      <div className="rounded-3xl bg-gradient-to-br from-indigo-950 via-slate-900 to-slate-950 p-6 sm:p-8 text-white shadow-xl">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <div className="flex flex-wrap items-center gap-2 mb-3">
              <div className="inline-flex items-center gap-2 rounded-full bg-indigo-500/20 px-3 py-1 text-xs font-semibold text-indigo-300 border border-indigo-500/30">
                {careerName || 'Universidad'} {profile?.university ? `• ${profile.university}` : ''}
              </div>

              {/* Selector Rápido de Rol (Modo Demo) */}
              <RoleSwitcherPill currentRole={userRole} />

              {streakInfo && (
                <div
                  className="inline-flex items-center gap-1.5 rounded-full bg-amber-500/20 px-3 py-1 text-xs font-bold text-amber-300 border border-amber-500/40 shadow-2xs"
                  title={`Récord personal: ${streakInfo.longest_streak} días consecutivos de estudio`}
                >
                  <IconFlame className="w-3.5 h-3.5 text-amber-400" />
                  <span>
                    Racha Activa: {streakInfo.current_streak} {streakInfo.current_streak === 1 ? 'día' : 'días'} (Récord: {streakInfo.longest_streak}d)
                  </span>
                </div>
              )}
            </div>

            <h1 className="text-2xl sm:text-3xl font-bold tracking-tight">
              Bienvenido, {profile?.full_name ?? 'Estudiante'}
            </h1>
            <p className="mt-2 text-xs sm:text-sm text-slate-300 max-w-xl leading-relaxed">
              {isProfessor
                ? 'Panel de Cátedra. Gestioná tus comisiones, centralizá apuntes y visualizá el mapa de calor de dudas de tus alumnos.'
                : isDean
                ? 'Centro de Retención & Decanato. Monitoreo predictivo de riesgo de deserción y reportes de acreditación.'
                : 'Plataforma de acompañamiento universitario. Selecciona tu materia para acceder al tutor RAG socrático, simulador de parciales y calendario.'}
            </p>
          </div>

          <div className="flex items-center gap-2.5 flex-wrap">
            {/* Solo visible para Profesores y Administradores */}
            {isProfessor && (
              <Link
                href="/catedra"
                className="inline-flex items-center justify-center gap-1.5 rounded-xl bg-purple-500/20 hover:bg-purple-500/30 border border-purple-400/30 px-3.5 py-2.5 text-xs font-bold text-purple-200 transition-colors backdrop-blur-xs shadow-2xs"
                title="Panel para Profesores y JTP"
              >
                <IconBook className="w-3.5 h-3.5 text-purple-300" />
                <span>Panel Cátedra</span>
              </Link>
            )}

            {/* Solo visible para Decanatos y Administradores */}
            {isDean && (
              <Link
                href="/institucional"
                className="inline-flex items-center justify-center gap-1.5 rounded-xl bg-sky-500/20 hover:bg-sky-500/30 border border-sky-400/30 px-3.5 py-2.5 text-xs font-bold text-sky-200 transition-colors backdrop-blur-xs shadow-2xs"
                title="Panel de Decanato y Alerta Temprana"
              >
                <IconDocument className="w-3.5 h-3.5 text-sky-300" />
                <span>Panel Decanato</span>
              </Link>
            )}

            <Link
              href="/comunidad"
              className="inline-flex items-center justify-center gap-1.5 rounded-xl bg-indigo-500/30 hover:bg-indigo-500/40 border border-indigo-400/40 px-3.5 py-2.5 text-xs font-bold text-white transition-colors backdrop-blur-xs shadow-2xs"
            >
              <IconUsers className="w-3.5 h-3.5 text-indigo-300" />
              <span>Banco Comunitario</span>
            </Link>

            <Link
              href="/materias"
              className="inline-flex items-center justify-center gap-1.5 rounded-xl bg-indigo-600 px-4 py-2.5 text-xs font-bold text-white shadow-md hover:bg-indigo-500 transition-all hover:shadow-indigo-500/25 shrink-0"
            >
              <span>Gestionar materias</span>
              <IconChevronRight className="w-3.5 h-3.5" />
            </Link>
          </div>

        </div>
      </div>

      {/* Banner para Estudiantes: Sincronizarse con Comisión de Cátedra (Solo alumnos) */}
      {isStudent && <JoinCommissionCard />}



      {/* Distribución Principal: Materias a la izquierda + Calendario Mini a la derecha */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
        {/* Columna Izquierda: Tus Materias (7 columnas) */}
        <div className="lg:col-span-7 flex flex-col gap-4">
          <div className="flex items-center justify-between">
            <h2 className="text-xs font-bold uppercase tracking-wider text-slate-600">
              Tus Materias ({subjects?.length ?? 0})
            </h2>
            <Link
              href="/materias"
              className="text-xs font-bold text-indigo-600 hover:text-indigo-800"
            >
              + Nueva Materia
            </Link>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {subjects?.map((sub) => {
              const formattedName = sub.name.charAt(0).toUpperCase() + sub.name.slice(1)

              return (
                <div
                  key={sub.id}
                  className="rounded-2xl border border-slate-200/80 bg-white p-4 shadow-xs flex flex-col justify-between gap-3 hover:border-slate-300 transition-all"
                >
                  <div className="flex items-center justify-between">
                    <span className="text-[10px] font-bold uppercase tracking-wider text-indigo-600 bg-indigo-50 border border-indigo-100 px-2 py-0.5 rounded-full">
                      Materia
                    </span>
                    <Link
                      href={`/materias/${sub.id}`}
                      className="text-[10px] font-bold text-indigo-700 hover:underline bg-indigo-50 border border-indigo-100 px-2 py-0.5 rounded-full transition-colors"
                    >
                      Diagnóstico →
                    </Link>
                  </div>
                  <h3 className="text-sm font-bold text-slate-900 truncate" title={formattedName}>
                    {formattedName}
                  </h3>

                  {/* Atajos Rápidos a las Herramientas del Workspace */}
                  <div className="grid grid-cols-3 gap-1 pt-2.5 border-t border-slate-100 text-[10px] font-bold">
                    <Link
                      href={`/materias/${sub.id}`}
                      className="rounded-lg bg-slate-50 text-slate-700 hover:bg-slate-100 p-1.5 text-center transition-colors flex items-center justify-center gap-1"
                      title="Apuntes"
                    >
                      <IconDocument className="w-3 h-3 text-slate-500" />
                      <span>Apuntes</span>
                    </Link>

                    <Link
                      href={`/materias/${sub.id}/temas`}
                      className="rounded-lg bg-emerald-50 text-emerald-800 hover:bg-emerald-100 p-1.5 text-center transition-colors flex items-center justify-center gap-1"
                      title="Chat RAG"
                    >
                      <IconChat className="w-3 h-3 text-emerald-600" />
                      <span>Chat</span>
                    </Link>

                    <Link
                      href={`/materias/${sub.id}/simulador`}
                      className="rounded-lg bg-purple-50 text-purple-800 hover:bg-purple-100 p-1.5 text-center transition-colors flex items-center justify-center gap-1"
                      title="Simulador de Parciales"
                    >
                      <IconQuiz className="w-3 h-3 text-purple-600" />
                      <span>Quiz</span>
                    </Link>

                    <Link
                      href={`/materias/${sub.id}/tarjetas`}
                      className="rounded-lg bg-indigo-50 text-indigo-800 hover:bg-indigo-100 p-1.5 text-center transition-colors flex items-center justify-center gap-1"
                      title="Tarjetas Didácticas"
                    >
                      <IconSparkles className="w-3 h-3 text-indigo-600" />
                      <span>Tarjetas</span>
                    </Link>

                    <Link
                      href={`/materias/${sub.id}/calendario`}
                      className="rounded-lg bg-amber-50 text-amber-900 hover:bg-amber-100 p-1.5 text-center transition-colors flex items-center justify-center gap-1"
                      title="Calendario"
                    >
                      <IconCalendar className="w-3 h-3 text-amber-600" />
                      <span>Fechas</span>
                    </Link>

                    <Link
                      href={`/materias/${sub.id}/pizarra`}
                      className="rounded-lg bg-sky-50 text-sky-800 hover:bg-sky-100 p-1.5 text-center transition-colors flex items-center justify-center gap-1"
                      title="Fotos de Pizarra"
                    >
                      <IconCamera className="w-3 h-3 text-sky-600" />
                      <span>Pizarra</span>
                    </Link>
                  </div>
                </div>
              )
            })}

            {(!subjects || subjects.length === 0) && (
              <div className="col-span-full rounded-2xl border border-dashed border-slate-300 bg-white p-8 text-center">
                <p className="text-sm font-medium text-slate-600">No tenés materias registradas aún.</p>
                <Link
                  href="/materias"
                  className="mt-2 inline-block rounded-xl bg-indigo-600 px-4 py-2 text-xs font-semibold text-white shadow-xs hover:bg-indigo-700"
                >
                  + Crear mi primera materia
                </Link>
              </div>
            )}
          </div>
        </div>

        {/* Columna Derecha: Mini Calendario Global de Exámenes (5 columnas) */}
        <div className="lg:col-span-5">
          <GlobalCalendarWidget
            events={globalEvents}
            notes={globalNotes}
            firstSubjectId={subjectIds[0]}
          />
        </div>
      </div>
    </div>
  )
}
