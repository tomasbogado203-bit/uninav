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

  const isDean = userRole === 'dean' || userRole === 'admin'
  const isProfessor = userRole === 'professor'
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
                {isDean
                  ? 'Decanato & Secretaría Académica'
                  : isProfessor
                  ? 'Claustro Docente'
                  : careerName || 'Universidad'}{' '}
                {profile?.university ? `• ${profile.university}` : ''}
              </div>

              {/* Selector Rápido de Rol (Modo Demo) */}
              <RoleSwitcherPill currentRole={userRole} />

              {isStudent && streakInfo && (
                <div
                  className="inline-flex items-center gap-1.5 rounded-full bg-amber-500/20 px-3 py-1 text-xs font-bold text-amber-300 border border-amber-500/40 shadow-2xs"
                  title={`Récord personal: ${streakInfo.longest_streak} días consecutivos de estudio`}
                >
                  <IconFlame className="w-3.5 h-3.5 text-amber-400" />
                  <span>
                    Racha Activa: {streakInfo.current_streak}{' '}
                    {streakInfo.current_streak === 1 ? 'día' : 'días'} (Récord:{' '}
                    {streakInfo.longest_streak}d)
                  </span>
                </div>
              )}
            </div>

            <h1 className="text-2xl sm:text-3xl font-bold tracking-tight">
              Bienvenido, {profile?.full_name ?? 'Usuario'}
            </h1>
            <p className="mt-2 text-xs sm:text-sm text-slate-300 max-w-xl leading-relaxed">
              {isDean
                ? 'Portal de Gestión y Decanato. Supervisá la tasa de retención estudiantil, materias filtro y emití informes de acreditación.'
                : isProfessor
                ? 'Espacio de Cátedra. Monitoreá el mapa de calor de dudas de tus alumnos, centralizá apuntes y diseñá evaluaciones.'
                : 'Plataforma de acompañamiento universitario. Selecciona tu materia para acceder al tutor RAG socrático, simulador de parciales y calendario.'}
            </p>
          </div>

          <div className="flex items-center gap-2.5 flex-wrap">
            {/* Solo visible para Profesores */}
            {isProfessor && (
              <Link
                href="/catedra"
                className="inline-flex items-center justify-center gap-1.5 rounded-xl bg-purple-500/20 hover:bg-purple-500/30 border border-purple-400/30 px-4 py-2.5 text-xs font-bold text-purple-200 transition-colors backdrop-blur-xs shadow-2xs"
              >
                <IconBook className="w-3.5 h-3.5 text-purple-300" />
                <span>Ir al Panel de Cátedra</span>
                <IconChevronRight className="w-3.5 h-3.5" />
              </Link>
            )}

            {/* Solo visible para Decanatos */}
            {isDean && (
              <Link
                href="/institucional"
                className="inline-flex items-center justify-center gap-1.5 rounded-xl bg-sky-500/20 hover:bg-sky-500/30 border border-sky-400/30 px-4 py-2.5 text-xs font-bold text-sky-200 transition-colors backdrop-blur-xs shadow-2xs"
              >
                <IconDocument className="w-3.5 h-3.5 text-sky-300" />
                <span>Ir al Centro de Retención</span>
                <IconChevronRight className="w-3.5 h-3.5" />
              </Link>
            )}

            <Link
              href="/comunidad"
              className="inline-flex items-center justify-center gap-1.5 rounded-xl bg-indigo-500/30 hover:bg-indigo-500/40 border border-indigo-400/40 px-3.5 py-2.5 text-xs font-bold text-white transition-colors backdrop-blur-xs shadow-2xs"
            >
              <IconUsers className="w-3.5 h-3.5 text-indigo-300" />
              <span>Banco Comunitario</span>
            </Link>

            {isStudent && (
              <Link
                href="/materias"
                className="inline-flex items-center justify-center gap-1.5 rounded-xl bg-indigo-600 px-4 py-2.5 text-xs font-bold text-white shadow-md hover:bg-indigo-500 transition-all hover:shadow-indigo-500/25 shrink-0"
              >
                <span>Gestionar materias</span>
                <IconChevronRight className="w-3.5 h-3.5" />
              </Link>
            )}
          </div>
        </div>
      </div>

      {/* ─────────────────────────────────────────────────────────────
          1. VISTA EXCLUSIVA PARA DECANATO & AUTORIDADES (isDean)
      ───────────────────────────────────────────────────────────── */}
      {isDean && (
        <div className="flex flex-col gap-8 animate-in fade-in">
          {/* 4 Accesos Directos a las Herramientas de Decanato */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
            <Link
              href="/institucional"
              className="rounded-3xl border border-sky-200 bg-sky-50/50 p-6 shadow-xs flex flex-col justify-between gap-4 hover:border-sky-300 hover:bg-sky-50 transition-all group"
            >
              <div className="flex items-center justify-between">
                <span className="text-[10px] font-black uppercase tracking-wider text-sky-700 bg-sky-100 border border-sky-200 px-2.5 py-1 rounded-full">
                  Semáforo Predictivo
                </span>
                <span className="text-xl">🚨</span>
              </div>
              <div>
                <h3 className="text-base font-black text-slate-900 group-hover:text-sky-700 transition-colors">
                  Centro de Retención & Materias Filtro
                </h3>
                <p className="text-xs text-slate-600 mt-1 leading-relaxed">
                  Monitoreá las 5 materias críticas de 1er año con puntos de quiebre y riesgo de deserción por cohorte.
                </p>
              </div>
              <span className="text-xs font-bold text-sky-600 flex items-center gap-1">
                Abrir Data Hub →
              </span>
            </Link>

            <Link
              href="/institucional"
              className="rounded-3xl border border-indigo-200 bg-indigo-50/50 p-6 shadow-xs flex flex-col justify-between gap-4 hover:border-indigo-300 hover:bg-indigo-50 transition-all group"
            >
              <div className="flex items-center justify-between">
                <span className="text-[10px] font-black uppercase tracking-wider text-indigo-700 bg-indigo-100 border border-indigo-200 px-2.5 py-1 rounded-full">
                  Acreditación Formal
                </span>
                <span className="text-xl">📄</span>
              </div>
              <div>
                <h3 className="text-base font-black text-slate-900 group-hover:text-indigo-700 transition-colors">
                  Generador de Informes CONEAU (A4)
                </h3>
                <p className="text-xs text-slate-600 mt-1 leading-relaxed">
                  Exportá e imprimí el dossier institucional de innovación pedagógica y retención interanual.
                </p>
              </div>
              <span className="text-xs font-bold text-indigo-600 flex items-center gap-1">
                Generar Informe →
              </span>
            </Link>

            <Link
              href="/comunidad"
              className="rounded-3xl border border-slate-200 bg-white p-6 shadow-xs flex flex-col justify-between gap-4 hover:border-slate-300 transition-all group"
            >
              <div className="flex items-center justify-between">
                <span className="text-[10px] font-black uppercase tracking-wider text-slate-700 bg-slate-100 border border-slate-200 px-2.5 py-1 rounded-full">
                  Transparencia Académica
                </span>
                <span className="text-xl">📚</span>
              </div>
              <div>
                <h3 className="text-base font-black text-slate-900 group-hover:text-slate-800 transition-colors">
                  Supervisión de Banco Comunitario
                </h3>
                <p className="text-xs text-slate-600 mt-1 leading-relaxed">
                  Revisá los exámenes viejos y modelos de parcial compartidos entre las diferentes comisiones.
                </p>
              </div>
              <span className="text-xs font-bold text-slate-700 flex items-center gap-1">
                Ver Banco →
              </span>
            </Link>
          </div>

          {/* Directorio de Carreras y Cohortes de la Facultad */}
          <div className="rounded-3xl border border-slate-200/80 bg-white p-6 sm:p-8 shadow-xs flex flex-col gap-6">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-100 pb-4">
              <div>
                <h3 className="text-lg font-black text-slate-900">
                  Directorio de Carreras de la Facultad (Cohorte 2026)
                </h3>
                <p className="text-xs text-slate-500 mt-0.5">
                  1.840 estudiantes ingresantes distribuidos en 4 titulaciones universitarias.
                </p>
              </div>
              <span className="text-xs font-bold text-emerald-700 bg-emerald-50 border border-emerald-200 px-3 py-1 rounded-xl self-start sm:self-auto">
                Retención Global: 85.8%
              </span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
              <div className="p-5 rounded-2xl bg-slate-50 border border-slate-200 flex flex-col justify-between gap-3">
                <div>
                  <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">
                    Ingeniería en Sistemas
                  </span>
                  <h4 className="font-black text-base text-slate-900 mt-1">680 Ingresantes</h4>
                  <p className="text-xs text-slate-500 mt-0.5">12 comisiones activas</p>
                </div>
                <div className="border-t border-slate-200/80 pt-2 flex items-center justify-between text-xs font-bold">
                  <span className="text-slate-600">Retención:</span>
                  <span className="text-emerald-600">88.5%</span>
                </div>
              </div>

              <div className="p-5 rounded-2xl bg-slate-50 border border-slate-200 flex flex-col justify-between gap-3">
                <div>
                  <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">
                    Lic. en Computación
                  </span>
                  <h4 className="font-black text-base text-slate-900 mt-1">510 Ingresantes</h4>
                  <p className="text-xs text-slate-500 mt-0.5">8 comisiones activas</p>
                </div>
                <div className="border-t border-slate-200/80 pt-2 flex items-center justify-between text-xs font-bold">
                  <span className="text-slate-600">Retención:</span>
                  <span className="text-emerald-600">86.2%</span>
                </div>
              </div>

              <div className="p-5 rounded-2xl bg-slate-50 border border-slate-200 flex flex-col justify-between gap-3">
                <div>
                  <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">
                    Ingeniería Electrónica
                  </span>
                  <h4 className="font-black text-base text-slate-900 mt-1">360 Ingresantes</h4>
                  <p className="text-xs text-slate-500 mt-0.5">6 comisiones activas</p>
                </div>
                <div className="border-t border-slate-200/80 pt-2 flex items-center justify-between text-xs font-bold">
                  <span className="text-slate-600">Retención:</span>
                  <span className="text-amber-600">78.4%</span>
                </div>
              </div>

              <div className="p-5 rounded-2xl bg-slate-50 border border-slate-200 flex flex-col justify-between gap-3">
                <div>
                  <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">
                    Ingeniería Mecánica
                  </span>
                  <h4 className="font-black text-base text-slate-900 mt-1">290 Ingresantes</h4>
                  <p className="text-xs text-slate-500 mt-0.5">5 comisiones activas</p>
                </div>
                <div className="border-t border-slate-200/80 pt-2 flex items-center justify-between text-xs font-bold">
                  <span className="text-slate-600">Retención:</span>
                  <span className="text-amber-600">74.0%</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ─────────────────────────────────────────────────────────────
          2. VISTA EXCLUSIVA PARA PROFESORES / CÁTEDRA (isProfessor)
      ───────────────────────────────────────────────────────────── */}
      {isProfessor && (
        <div className="flex flex-col gap-8 animate-in fade-in">
          <div className="rounded-3xl border border-slate-200/80 bg-white p-6 sm:p-8 shadow-xs flex flex-col gap-6">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-100 pb-4">
              <div>
                <span className="text-[10px] font-black uppercase tracking-wider text-purple-700 bg-purple-50 border border-purple-200 px-2.5 py-0.5 rounded-full">
                  Gestión Docente
                </span>
                <h2 className="text-xl font-black text-slate-900 mt-1">
                  Tus Comisiones de Cátedra a Cargo
                </h2>
                <p className="text-xs text-slate-500 mt-0.5">
                  Accedé al radar de dudas, bibliografía oficial y generador de parciales para tu cursada.
                </p>
              </div>

              <Link
                href="/catedra"
                className="inline-flex items-center gap-2 rounded-2xl bg-indigo-600 hover:bg-indigo-700 text-white px-5 py-3 text-xs sm:text-sm font-bold shadow-md transition-all self-start sm:self-auto"
              >
                <IconSparkles className="w-4 h-4" />
                <span>Abrir Radar de Cátedra Completo</span>
              </Link>
            </div>

            {/* Comisión Activa Destacada */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
              <div className="rounded-2xl border border-purple-200 bg-purple-50/40 p-6 flex flex-col justify-between gap-4">
                <div className="flex flex-col gap-2">
                  <div className="flex items-center justify-between">
                    <span className="text-[10px] font-bold text-purple-700 uppercase tracking-wider">
                      Comisión Oficial
                    </span>
                    <span className="font-mono text-xs font-black text-purple-900 bg-purple-100 border border-purple-200 px-2 py-0.5 rounded-md">
                      PIN: AN104N
                    </span>
                  </div>
                  <h3 className="text-lg font-black text-slate-900">
                    Análisis Matemático I
                  </h3>
                  <p className="text-xs text-slate-600">
                    Comisión 104 • Turno Noche • 48 alumnos inscriptos
                  </p>
                </div>

                <div className="border-t border-purple-200/60 pt-3 flex items-center justify-between">
                  <span className="text-xs font-bold text-red-600 flex items-center gap-1">
                    🔴 38 alumnos con dudas en Fracciones Simples
                  </span>
                  <Link
                    href="/catedra"
                    className="text-xs font-bold text-indigo-700 hover:underline"
                  >
                    Ver Telemetría →
                  </Link>
                </div>
              </div>

              <div className="rounded-2xl border border-slate-200 bg-white p-6 flex flex-col justify-between gap-4">
                <div className="flex flex-col gap-2">
                  <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">
                    Herramientas de Cátedra
                  </span>
                  <h3 className="text-base font-bold text-slate-900">
                    Generador de Evaluaciones Paralelas
                  </h3>
                  <p className="text-xs text-slate-600">
                    Creá matrices de examen (Tema 1 & Tema 2) con el mismo nivel de dificultad para evitar copias.
                  </p>
                </div>

                <Link
                  href="/catedra"
                  className="text-xs font-bold text-indigo-600 hover:underline"
                >
                  Diseñar nuevo parcial con IA →
                </Link>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ─────────────────────────────────────────────────────────────
          3. VISTA EXCLUSIVA PARA ESTUDIANTES (isStudent)
      ───────────────────────────────────────────────────────────── */}
      {isStudent && (
        <div className="flex flex-col gap-8 animate-in fade-in">
          {/* Banner de Sincronización con Comisión de Cátedra */}
          <JoinCommissionCard />

          {/* Grid Principal: Materias a la izquierda + Calendario a la derecha */}
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
            {/* Columna Izquierda: Tus Materias Cursadas (7 columnas) */}
            <div className="lg:col-span-7 flex flex-col gap-4">
              <div className="flex items-center justify-between">
                <h2 className="text-xs font-bold uppercase tracking-wider text-slate-600">
                  Tus Materias Cursadas ({subjects?.length ?? 0})
                </h2>
                <Link
                  href="/materias"
                  className="text-xs font-bold text-indigo-600 hover:text-indigo-800"
                >
                  + Nueva Materia
                </Link>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
                {subjects?.map((sub) => {
                  const formattedName = sub.name.charAt(0).toUpperCase() + sub.name.slice(1)
                  const isAnalysis = formattedName.toLowerCase().includes('analisis') || formattedName.toLowerCase().includes('análisis')

                  return (
                    <div
                      key={sub.id}
                      className="group flex flex-col justify-between rounded-3xl border border-slate-200/80 bg-white p-5 shadow-xs hover:shadow-md hover:border-indigo-300 transition-all gap-4"
                    >
                      <div className="flex flex-col gap-2.5">
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-2">
                            <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-indigo-50 text-indigo-600 font-bold group-hover:bg-indigo-600 group-hover:text-white transition-colors shadow-2xs">
                              <IconBook className="w-4 h-4" />
                            </span>
                            {isAnalysis ? (
                              <span className="text-[10px] font-bold text-emerald-700 bg-emerald-50 border border-emerald-200 px-2.5 py-0.5 rounded-full inline-flex items-center gap-1">
                                <span>●</span> Cátedra Oficial
                              </span>
                            ) : (
                              <span className="text-[10px] font-bold text-slate-500 bg-slate-100 border border-slate-200 px-2 py-0.5 rounded-full">
                                Cursando
                              </span>
                            )}
                          </div>
                        </div>

                        <Link href={`/materias/${sub.id}`} className="block mt-1">
                          <h3 className="text-base font-black text-slate-900 group-hover:text-indigo-600 transition-colors truncate" title={formattedName}>
                            {formattedName}
                          </h3>
                        </Link>
                      </div>

                      {/* Botón Principal y Accesos Rápidos */}
                      <div className="flex flex-col gap-2.5 pt-3 border-t border-slate-100">
                        <Link
                          href={`/materias/${sub.id}`}
                          className="w-full inline-flex items-center justify-center gap-1.5 rounded-xl bg-slate-900 hover:bg-indigo-600 text-white py-2 text-xs font-bold transition-all shadow-2xs"
                        >
                          <span>Entrar al Workspace</span>
                          <span className="text-indigo-300">→</span>
                        </Link>

                        <div className="flex items-center justify-between gap-1 text-[10px] text-slate-500 font-bold px-0.5">
                          <Link
                            href={`/materias/${sub.id}/temas`}
                            className="hover:text-indigo-600 hover:bg-indigo-50 px-1.5 py-1 rounded-md transition-colors flex items-center gap-1"
                            title="Chat RAG"
                          >
                            <IconChat className="w-3 h-3 text-emerald-600" />
                            <span>Chat</span>
                          </Link>

                          <Link
                            href={`/materias/${sub.id}/simulador`}
                            className="hover:text-indigo-600 hover:bg-indigo-50 px-1.5 py-1 rounded-md transition-colors flex items-center gap-1"
                            title="Simulador de Parciales"
                          >
                            <IconQuiz className="w-3 h-3 text-purple-600" />
                            <span>Quiz</span>
                          </Link>

                          <Link
                            href={`/materias/${sub.id}/tarjetas`}
                            className="hover:text-indigo-600 hover:bg-indigo-50 px-1.5 py-1 rounded-md transition-colors flex items-center gap-1"
                            title="Tarjetas Didácticas"
                          >
                            <IconSparkles className="w-3 h-3 text-indigo-600" />
                            <span>Tarjetas</span>
                          </Link>

                          <Link
                            href={`/materias/${sub.id}/calendario`}
                            className="hover:text-indigo-600 hover:bg-indigo-50 px-1.5 py-1 rounded-md transition-colors flex items-center gap-1"
                            title="Fechas de Examen"
                          >
                            <IconCalendar className="w-3 h-3 text-amber-600" />
                            <span>Fechas</span>
                          </Link>
                        </div>
                      </div>
                    </div>
                  )
                })}
              </div>

            </div>

            {/* Columna Derecha: Calendario Mini (5 columnas) */}
            <div className="lg:col-span-5 flex flex-col gap-4">
              <div className="flex items-center justify-between">
                <h2 className="text-xs font-bold uppercase tracking-wider text-slate-600">
                  Próximos Exámenes & Eventos
                </h2>
                <span className="text-[10px] text-slate-400 font-medium">Consolidado</span>
              </div>

              <GlobalCalendarWidget events={globalEvents} notes={globalNotes} />
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
