import { createClient } from '@/lib/supabase/server'
import Link from 'next/link'

export default async function DashboardPage() {
  const supabase = await createClient()

  const {
    data: { user },
  } = await supabase.auth.getUser()

  const { data: profile } = await supabase
    .from('profiles')
    .select('full_name, university, career_id, careers(name)')
    .eq('id', user?.id)
    .single()

  const careerName = (profile?.careers as unknown as { name: string } | null)?.name

  const { data: subjects } = await supabase
    .from('subjects')
    .select('id, name')
    .eq('user_id', user?.id)

  return (
    <div className="mx-auto max-w-4xl px-4 py-10 sm:px-6">
      {/* Hero Welcome Card */}
      <div className="rounded-2xl bg-gradient-to-br from-indigo-950 via-slate-900 to-slate-950 p-8 text-white shadow-xl">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <div className="inline-flex items-center gap-2 rounded-full bg-indigo-500/20 px-3 py-1 text-xs font-medium text-indigo-300 border border-indigo-500/30 mb-3">
              🎓 {careerName || 'Universidad'} {profile?.university ? `• ${profile.university}` : ''}
            </div>
            <h1 className="text-2xl sm:text-3xl font-bold tracking-tight">
              ¡Hola, {profile?.full_name ?? 'ingresante'}! 👋
            </h1>
            <p className="mt-2 text-sm text-slate-300 max-w-xl">
              Bienvenido a tu espacio de estudio. Tu tutor RAG socrático está listo para acompañarte en tus cursadas.
            </p>
          </div>
          <Link
            href="/materias"
            className="inline-flex items-center justify-center rounded-xl bg-indigo-600 px-5 py-3 text-sm font-semibold text-white shadow-md hover:bg-indigo-500 transition-all hover:shadow-indigo-500/25 shrink-0"
          >
            Ver mis materias →
          </Link>
        </div>
      </div>

      {/* Tarjetas Rápidas de Acceso */}
      <div className="mt-8 grid grid-cols-1 md:grid-cols-3 gap-5">
        <Link
          href="/materias"
          className="group rounded-2xl border border-slate-200/80 bg-white p-6 shadow-sm hover:shadow-md hover:border-indigo-300 transition-all"
        >
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-indigo-50 text-indigo-600 font-bold text-lg group-hover:bg-indigo-600 group-hover:text-white transition-colors">
            📚
          </div>
          <h2 className="mt-4 font-semibold text-slate-900 group-hover:text-indigo-600 transition-colors">
            Mis Materias ({subjects?.length ?? 0})
          </h2>
          <p className="mt-1 text-xs text-slate-500 leading-relaxed">
            Administrá tus materias, subí apuntes en PDF e indexalos para consultas.
          </p>
        </Link>

        <Link
          href="/materias"
          className="group rounded-2xl border border-slate-200/80 bg-white p-6 shadow-sm hover:shadow-md hover:border-indigo-300 transition-all"
        >
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-emerald-50 text-emerald-600 font-bold text-lg group-hover:bg-emerald-600 group-hover:text-white transition-colors">
            💬
          </div>
          <h2 className="mt-4 font-semibold text-slate-900 group-hover:text-emerald-600 transition-colors">
            Tutor Socrático RAG
          </h2>
          <p className="mt-1 text-xs text-slate-500 leading-relaxed">
            Consultá dudas sobre tu bibliografía con citas exactas de página.
          </p>
        </Link>

        <div className="rounded-2xl border border-slate-200/80 bg-slate-100/60 p-6 opacity-75">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-slate-200 text-slate-500 font-bold text-lg">
            📝
          </div>
          <h2 className="mt-4 font-semibold text-slate-700 flex items-center justify-between">
            <span>Simulador de Parciales</span>
            <span className="text-[10px] font-bold uppercase tracking-wider bg-slate-200 px-2 py-0.5 rounded text-slate-600">
              Próximamente
            </span>
          </h2>
          <p className="mt-1 text-xs text-slate-500 leading-relaxed">
            Generá quizes integradores multi-tema y autoevaluá tus respuestas.
          </p>
        </div>
      </div>
    </div>
  )
}
