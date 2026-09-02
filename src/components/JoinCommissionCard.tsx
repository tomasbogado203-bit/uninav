'use client'

import { useState } from 'react'
import { joinCommissionAction } from '@/app/catedra/actions'
import { IconBook, IconCheck, IconSparkles } from '@/components/icons'

export default function JoinCommissionCard() {
  const [code, setCode] = useState('')
  const [loading, setLoading] = useState(false)
  const [result, setResult] = useState<{
    success: boolean
    subject_name?: string
    commission_name?: string
    error?: string
  } | null>(null)

  const handleJoin = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!code.trim()) return

    setLoading(true)
    setResult(null)
    try {
      const res = await joinCommissionAction(code)
      setResult(res)
      if (res.success) {
        setCode('')
        setTimeout(() => {
          window.location.reload()
        }, 1500)
      }
    } catch {
      setResult({ success: false, error: 'Ocurrió un error al unirse.' })
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="rounded-2xl border border-slate-200/90 bg-white p-4 sm:p-5 shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-4">
      <div className="flex items-center gap-3.5">
        <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-indigo-50 text-indigo-600 shrink-0 border border-indigo-100/80">
          <IconBook className="w-5 h-5" />
        </div>
        <div className="flex flex-col">
          <div className="flex items-center gap-2">
            <h3 className="text-xs sm:text-sm font-bold text-slate-900">
              Vincular Cátedra Oficial
            </h3>
            <span className="text-[10px] font-semibold text-indigo-700 bg-indigo-50 border border-indigo-200/60 px-2 py-0.2 rounded-full">
              Código PIN
            </span>
          </div>
          <p className="text-xs text-slate-500 mt-0.5">
            Ingresá el código de 6 letras de tu docente (ej: <span className="font-mono font-bold text-indigo-600">AN104N</span>) para heredar los apuntes oficiales.
          </p>
        </div>
      </div>

      <form onSubmit={handleJoin} className="flex items-center gap-2 shrink-0">
        <input
          type="text"
          maxLength={8}
          placeholder="Código (AN104N)"
          value={code}
          onChange={(e) => setCode(e.target.value.toUpperCase())}
          className="rounded-xl border border-slate-200 bg-slate-50 px-3.5 py-2 text-xs sm:text-sm font-mono font-bold tracking-wider text-slate-900 uppercase focus:bg-white focus:border-indigo-600 focus:outline-hidden transition-all text-center sm:text-left w-36 sm:w-44"
        />

        <button
          type="submit"
          disabled={loading || !code.trim()}
          className="rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white px-4 py-2 text-xs font-bold transition-all flex items-center justify-center gap-1.5 cursor-pointer disabled:opacity-50 shadow-2xs"
        >
          {loading ? (
            <span>Conectando...</span>
          ) : (
            <>
              <IconSparkles className="w-3.5 h-3.5" />
              <span>Vincular</span>
            </>
          )}
        </button>
      </form>

      {result && (
        <div className="col-span-full w-full">
          {result.success ? (
            <div className="rounded-xl bg-emerald-50 border border-emerald-200 p-3 text-xs font-semibold text-emerald-800 flex items-center gap-2 animate-in fade-in">
              <IconCheck className="w-4 h-4 text-emerald-600 shrink-0" />
              <span>
                Te uniste con éxito a la cátedra de {result.subject_name} ({result.commission_name}). Actualizando vista...
              </span>
            </div>
          ) : (
            <div className="rounded-xl bg-rose-50 border border-rose-200 p-3 text-xs font-semibold text-rose-800 animate-in fade-in">
              {result.error}
            </div>
          )}
        </div>
      )}
    </div>
  )
}
