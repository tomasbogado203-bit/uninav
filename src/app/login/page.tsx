'use client'

import { useState, type FormEvent } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/client'
import { IconIncadeLogo, IconCheck, IconShield } from '@/components/icons'

function getFriendlyErrorMessage(msg: string): string {
  const lower = msg.toLowerCase()
  if (lower.includes('invalid login credentials')) {
    return 'El email o la contraseña son incorrectos. Verificá tus datos e intentá nuevamente.'
  }
  if (lower.includes('user already registered') || lower.includes('already registered')) {
    return 'Ya existe una cuenta registrada con este correo. Podés iniciar sesión directamente.'
  }
  if (lower.includes('password should be at least') || lower.includes('password')) {
    return 'La contraseña debe tener como mínimo 6 caracteres.'
  }
  if (lower.includes('email not confirmed')) {
    return 'Por favor confirmá tu correo electrónico antes de ingresar, o iniciá sesión directamente.'
  }
  if (lower.includes('invalid email') || lower.includes('valid email')) {
    return 'Por favor ingresá un formato de correo electrónico válido.'
  }
  if (
    lower.includes('security purposes') ||
    lower.includes('rate limit') ||
    lower.includes('seconds') ||
    lower.includes('over_email_send_rate_limit')
  ) {
    return 'Por motivos de seguridad del servidor, esperá unos segundos antes de volver a solicitar el registro.'
  }
  return msg
}

export default function LoginPage() {
  const [mode, setMode] = useState<'signin' | 'signup'>('signin')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [successMessage, setSuccessMessage] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)

  const router = useRouter()
  const supabase = createClient()

  async function handleSubmit(e: FormEvent) {
    e.preventDefault()
    setError(null)
    setSuccessMessage(null)
    setLoading(true)

    const normalizedEmail = email.trim().toLowerCase()

    try {
      if (mode === 'signin') {
        const { error } = await supabase.auth.signInWithPassword({
          email: normalizedEmail,
          password,
        })
        if (error) {
          setError(getFriendlyErrorMessage(error.message))
          setLoading(false)
          return
        }
        // En Safari iOS, window.location.href fuerza a WebKit a enviar las cookies de sesión en el request
        window.location.href = '/'
      } else {
        const { data, error } = await supabase.auth.signUp({
          email: normalizedEmail,
          password,
        })
        if (error) {
          setError(getFriendlyErrorMessage(error.message))
          setLoading(false)
          return
        }
        // Si el registro fue exitoso
        if (data.session) {
          window.location.href = '/onboarding'
        } else {
          setSuccessMessage(
            '¡Cuenta creada con éxito! Si tu cuenta requiere confirmación por email, revisá tu casilla; o probá iniciar sesión ahora.'
          )
          setMode('signin')
          setLoading(false)
        }
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Ocurrió un error inesperado.')
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-slate-50 p-4 sm:p-6 select-none">
      {/* Tarjeta Principal de Autenticación */}
      <div className="w-full max-w-md rounded-3xl border border-slate-200/90 bg-white p-6 sm:p-8 shadow-sm flex flex-col gap-6">
        {/* Cabecera Institucional Co-Branded INCADE */}
        <div className="flex flex-col items-center text-center gap-3">
          <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-[#1E1B4B] p-2 shadow-sm border border-slate-800">
            <IconIncadeLogo className="w-10 h-10" />
          </div>

          <div>
            <div className="flex items-center justify-center gap-1.5">
              <span className="text-xl font-black text-slate-900 tracking-tight">INCADE</span>
              <span className="text-[9px] font-bold text-indigo-700 bg-indigo-50 border border-indigo-200 px-1.5 py-0.5 rounded">
                CAMPUS
              </span>
            </div>
            <p className="text-xs text-slate-500 font-medium mt-0.5">
              Portal Académico de Acompañamiento Universitario
            </p>
          </div>
        </div>

        {/* Selector de Modo (Tabs Modernos) */}
        <div className="grid grid-cols-2 p-1 bg-slate-100/80 rounded-2xl border border-slate-200/70">
          <button
            type="button"
            onClick={() => {
              setMode('signin')
              setError(null)
              setSuccessMessage(null)
            }}
            className={`py-2 text-xs font-bold rounded-xl transition-all cursor-pointer ${
              mode === 'signin'
                ? 'bg-white text-slate-900 shadow-2xs'
                : 'text-slate-500 hover:text-slate-800'
            }`}
          >
            Iniciar Sesión
          </button>
          <button
            type="button"
            onClick={() => {
              setMode('signup')
              setError(null)
              setSuccessMessage(null)
            }}
            className={`py-2 text-xs font-bold rounded-xl transition-all cursor-pointer ${
              mode === 'signup'
                ? 'bg-white text-slate-900 shadow-2xs'
                : 'text-slate-500 hover:text-slate-800'
            }`}
          >
            Crear Cuenta
          </button>
        </div>

        {/* Mensaje de Éxito */}
        {successMessage && (
          <div className="rounded-2xl bg-emerald-50 border border-emerald-200 p-3.5 text-xs font-semibold text-emerald-800 flex items-start gap-2 animate-in fade-in">
            <IconCheck className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
            <span>{successMessage}</span>
          </div>
        )}

        {/* Mensaje de Error */}
        {error && (
          <div className="rounded-2xl bg-rose-50 border border-rose-200 p-3.5 text-xs font-semibold text-rose-800 flex items-start gap-2 animate-in fade-in">
            <span className="w-2 h-2 rounded-full bg-rose-500 shrink-0 mt-1.5" />
            <span>{error}</span>
          </div>
        )}

        {/* Formulario */}
        <form onSubmit={handleSubmit} className="flex flex-col gap-4">
          <div className="flex flex-col gap-1.5">
            <label className="text-xs font-bold text-slate-700">
              Correo Electrónico
            </label>
            <input
              type="email"
              placeholder="nombre@incade.edu.ar"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              autoCapitalize="none"
              autoCorrect="off"
              spellCheck={false}
              className="rounded-xl border border-slate-200 bg-slate-50/50 px-3.5 py-2.5 text-xs sm:text-sm text-slate-900 focus:bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all font-medium"
            />
          </div>

          <div className="flex flex-col gap-1.5">
            <div className="flex items-center justify-between">
              <label className="text-xs font-bold text-slate-700">Contraseña</label>
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="text-[11px] font-semibold text-slate-400 hover:text-indigo-600 transition-colors cursor-pointer"
              >
                {showPassword ? 'Ocultar' : 'Mostrar'}
              </button>
            </div>
            <input
              type={showPassword ? 'text' : 'password'}
              placeholder="••••••••"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              minLength={6}
              autoCapitalize="none"
              autoCorrect="off"
              spellCheck={false}
              className="rounded-xl border border-slate-200 bg-slate-50/50 px-3.5 py-2.5 text-xs sm:text-sm text-slate-900 focus:bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all font-medium"
            />
            {mode === 'signup' && (
              <span className="text-[10px] text-slate-400">Mínimo 6 caracteres</span>
            )}
          </div>

          <button
            type="submit"
            disabled={loading || !email.trim() || !password}
            className="rounded-xl bg-indigo-600 hover:bg-indigo-700 px-4 py-3 text-xs sm:text-sm font-bold text-white shadow-xs transition-all disabled:opacity-50 cursor-pointer mt-2"
          >
            {loading
              ? 'Procesando...'
              : mode === 'signin'
              ? 'Ingresar al Campus'
              : 'Registrar Cuenta'}
          </button>
        </form>

        {/* Footer Discreto e Informativo */}
        <div className="border-t border-slate-100 pt-3 text-center flex flex-col items-center gap-1.5">
          <div className="text-[11px] text-slate-500 font-medium">
            ¿Sos docente o directivo? Podés ingresar con tu cuenta institucional o activar tu cátedra durante el registro.
          </div>
          <div className="text-[10px] text-slate-400 font-medium">
            Tecnología <span className="font-bold text-slate-600">UniNav Core</span> • Instituto Superior INCADE
          </div>
        </div>
      </div>
    </div>
  )
}
