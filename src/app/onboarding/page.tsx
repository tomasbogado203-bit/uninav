import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import { completeOnboarding } from './actions'

export default async function OnboardingPage() {
  const supabase = await createClient()

  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) redirect('/login')

  // Si el usuario ya tiene carrera elegida, redirigir directo al Dashboard
  const { data: profile } = await supabase
    .from('profiles')
    .select('career_id')
    .eq('id', user.id)
    .maybeSingle()

  if (profile?.career_id) {
    redirect('/')
  }

  const { data: careers } = await supabase
    .from('careers')
    .select('id, name, university, faculty')
    .order('university')

  return (
    <div className="min-h-screen flex items-center justify-center bg-slate-50 p-4 select-none">
      <div className="w-full max-w-md rounded-3xl border border-slate-200/80 bg-white p-6 sm:p-8 shadow-sm flex flex-col gap-5">
        <div className="flex flex-col gap-1">
          <div className="flex items-center gap-2 mb-1">
            <span className="flex h-8 w-8 items-center justify-center rounded-xl bg-indigo-600 text-white font-black text-sm">
              U
            </span>
            <span className="font-bold text-slate-900 text-lg tracking-tight">UniNav</span>
          </div>
          <h1 className="text-xl font-bold text-slate-900 tracking-tight">
            Contanos sobre vos
          </h1>
          <p className="text-xs text-slate-500">
            Esto nos permite configurar tus herramientas, glosario y tutor IA para tu carrera.
          </p>
        </div>

        <form action={completeOnboarding} className="flex flex-col gap-3.5">
          <div className="flex flex-col gap-1">
            <label className="text-xs font-semibold text-slate-700">Tu Nombre Completo</label>
            <input
              type="text"
              name="full_name"
              placeholder="Ej: Tomás Bogado"
              required
              className="rounded-xl border border-slate-200 px-3.5 py-2.5 text-xs sm:text-sm text-slate-900 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all font-medium"
            />
          </div>

          <div className="flex flex-col gap-1">
            <label className="text-xs font-semibold text-slate-700">Carrera Universitaria</label>
            <select
              name="career_id"
              required
              defaultValue=""
              className="rounded-xl border border-slate-200 px-3.5 py-2.5 text-xs sm:text-sm text-slate-900 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all font-medium bg-white"
            >
              <option value="" disabled>
                Seleccioná tu carrera
              </option>
              {careers?.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.name} — {c.university}
                </option>
              ))}
            </select>
          </div>

          <button
            type="submit"
            className="rounded-xl bg-indigo-600 hover:bg-indigo-700 px-4 py-2.5 text-xs font-bold text-white shadow-xs transition-all cursor-pointer mt-2"
          >
            Comenzar mi Cursada →
          </button>
        </form>
      </div>
    </div>
  )
}
