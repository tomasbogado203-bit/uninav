'use client'

import { useState, type FormEvent } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'

function getFriendlyErrorMessage(msg: string): string {
  const lower = msg.toLowerCase()
  if (lower.includes('invalid login credentials')) {
    return 'El email o la contraseña son incorrectos.'
  }
  if (lower.includes('user already registered')) {
    return 'Ya existe una cuenta registrada con este correo.'
  }
  if (lower.includes('password should be at least')) {
    return 'La contraseña debe tener como mínimo 6 caracteres.'
  }
  if (lower.includes('email not confirmed')) {
    return 'Debes confirmar tu correo electrónico antes de iniciar sesión.'
  }
  if (lower.includes('invalid email') || lower.includes('valid email')) {
    return 'Por favor ingresá un formato de email válido.'
  }
  if (lower.includes('rate limit')) {
    return 'Demasiados intentos. Por favor esperá unos minutos.'
  }
  return msg
}

export default function LoginPage() {
  const [mode, setMode] = useState<'signin' | 'signup'>('signin')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)

  const router = useRouter()
  const supabase = createClient()

  async function handleSubmit(e: FormEvent) {
    e.preventDefault()
    setError(null)
    setLoading(true)

    const { error } =
      mode === 'signin'
        ? await supabase.auth.signInWithPassword({ email, password })
        : await supabase.auth.signUp({ email, password })

    setLoading(false)

    if (error) {
      setError(getFriendlyErrorMessage(error.message))
      return
    }

    router.push('/')
    router.refresh()
  }


  return (
    <div className="min-h-screen flex items-center justify-center bg-slate-50 p-4 select-none">
      <div className="w-full max-w-sm rounded-3xl border border-slate-200/80 bg-white p-6 sm:p-8 shadow-sm flex flex-col gap-5">
        <div className="flex flex-col gap-1">
          <div className="flex items-center gap-2 mb-1">
            <span className="flex h-8 w-8 items-center justify-center rounded-xl bg-indigo-600 text-white font-black text-sm">
              U
            </span>
            <span className="font-bold text-slate-900 text-lg tracking-tight">UniNav</span>
          </div>
          <h1 className="text-xl font-bold text-slate-900 tracking-tight">
            {mode === 'signin' ? 'Iniciar sesión' : 'Crear cuenta'}
          </h1>
          <p className="text-xs text-slate-500">
            {mode === 'signin'
              ? 'Ingresá tus datos para acceder a tus materias y apuntes.'
              : 'Registrate para comenzar a organizar tu cursada universitaria.'}
          </p>
        </div>

        <form onSubmit={handleSubmit} className="flex flex-col gap-3.5">
          <div className="flex flex-col gap-1">
            <label className="text-xs font-semibold text-slate-700">Correo Electrónico</label>
            <input
              type="email"
              placeholder="tu.email@universidad.edu.ar"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              className="rounded-xl border border-slate-200 px-3.5 py-2.5 text-xs sm:text-sm text-slate-900 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all font-medium"
            />
          </div>

          <div className="flex flex-col gap-1">
            <label className="text-xs font-semibold text-slate-700">Contraseña</label>
            <input
              type="password"
              placeholder="••••••••"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              minLength={6}
              className="rounded-xl border border-slate-200 px-3.5 py-2.5 text-xs sm:text-sm text-slate-900 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all font-medium"
            />
          </div>

          {error && (
            <div className="rounded-xl bg-rose-50 border border-rose-200/80 p-3 text-xs font-medium text-rose-700 leading-tight animate-in fade-in">
              {error}
            </div>
          )}

          <button
            type="submit"
            disabled={loading}
            className="rounded-xl bg-indigo-600 hover:bg-indigo-700 px-4 py-2.5 text-xs font-bold text-white shadow-xs transition-all disabled:opacity-50 cursor-pointer mt-1"
          >
            {loading ? 'Cargando...' : mode === 'signin' ? 'Iniciar Sesión' : 'Registrarme'}
          </button>
        </form>

        <div className="border-t border-slate-100 pt-4 text-center">
          <button
            type="button"
            onClick={() => {
              setError(null)
              setMode(mode === 'signin' ? 'signup' : 'signin')
            }}
            className="text-xs font-semibold text-indigo-600 hover:text-indigo-800 transition-colors cursor-pointer"
          >
            {mode === 'signin'
              ? '¿No tenés cuenta? Registrate gratis'
              : '¿Ya tenés cuenta? Iniciá sesión'}
          </button>
        </div>
      </div>
    </div>
  )
}
