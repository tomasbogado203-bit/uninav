import Link from 'next/link'
import { createClient } from '@/lib/supabase/server'

export default async function Navbar() {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) return null

  const { data: profile } = await supabase
    .from('profiles')
    .select('full_name, careers(name)')
    .eq('id', user.id)
    .single()

  const careerName = (profile?.careers as unknown as { name: string } | null)?.name

  return (
    <header className="sticky top-0 z-50 border-b border-slate-200/80 bg-white/80 backdrop-blur-md">
      <div className="mx-auto flex max-w-6xl items-center justify-between px-4 py-3 sm:px-6">
        {/* Logo UniNav */}
        <Link href="/" className="flex items-center gap-2 group">
          <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-indigo-600 text-white font-bold text-lg shadow-sm group-hover:bg-indigo-700 transition-colors">
            U
          </div>
          <div>
            <span className="font-bold text-slate-900 text-base tracking-tight">UniNav</span>
            <span className="ml-2 rounded-full bg-indigo-50 px-2 py-0.5 text-[10px] font-semibold text-indigo-700 border border-indigo-100">
              Socrático
            </span>
          </div>
        </Link>

        {/* Links de Navegación */}
        <nav className="flex items-center gap-1 sm:gap-4">
          <Link
            href="/"
            className="rounded-lg px-3 py-1.5 text-sm font-medium text-slate-600 hover:bg-slate-100 hover:text-slate-900 transition-colors"
          >
            Inicio
          </Link>
          <Link
            href="/materias"
            className="rounded-lg px-3 py-1.5 text-sm font-medium text-slate-600 hover:bg-slate-100 hover:text-slate-900 transition-colors"
          >
            Mis Materias
          </Link>
        </nav>

        {/* Perfil del Alumno */}
        <div className="flex items-center gap-3">
          <div className="hidden text-right sm:block">
            <p className="text-xs font-semibold text-slate-800">
              {profile?.full_name || 'Estudiante'}
            </p>
            {careerName && (
              <p className="text-[11px] text-slate-500 max-w-[160px] truncate">{careerName}</p>
            )}
          </div>
          <div className="flex h-8 w-8 items-center justify-center rounded-full bg-indigo-100 text-indigo-700 font-bold text-xs">
            {(profile?.full_name || 'E').charAt(0).toUpperCase()}
          </div>
        </div>
      </div>
    </header>
  )
}
