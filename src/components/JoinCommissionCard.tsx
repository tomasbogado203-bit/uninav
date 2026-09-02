'use client'

import { useState } from 'react'
import { joinCommissionAction } from '@/app/catedra/actions'
import { IconUsers, IconCheck, IconSparkles } from '@/components/icons'

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
    <div className="rounded-3xl border border-indigo-200/90 bg-gradient-to-br from-indigo-50/70 via-purple-50/30 to-white p-5 sm:p-6 shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-5">
      <div className="flex items-start gap-3.5">
        <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-indigo-600 text-white shadow-xs shrink-0 mt-0.5">
          <IconUsers className="w-5 h-5" />
        </div>
        <div className="flex flex-col gap-1">
          <div className="flex items-center gap-2">
            <span className="text-[10px] font-black uppercase tracking-wider text-indigo-700 bg-indigo-100 border border-indigo-200 px-2.5 py-0.5 rounded-full">
              Cátedra Oficial
            </span>
            <span className="text-xs text-slate-400 font-medium">Sincronización RAG</span>
          </div>
          <h3 className="text-sm sm:text-base font-bold text-slate-900 leading-tight">
            ¿Tenés un código de comisión de tu profesor?
          </h3>
          <p className="text-xs text-slate-600 max-w-lg leading-relaxed">
            Ingresá el código de 6 caracteres que te dio tu cátedra (ej: <span className="font-mono font-bold text-indigo-700">AN104N</span>) para heredar los apuntes oficiales y sincronizarte con el curso.
          </p>
        </div>
      </div>

      <form onSubmit={handleJoin} className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2 shrink-0">
        <input
          type="text"
          maxLength={8}
          placeholder="Código (ej: AN104N)"
          value={code}
          onChange={(e) => setCode(e.target.value.toUpperCase())}
          className="rounded-xl border border-indigo-300 bg-white px-4 py-2.5 text-xs sm:text-sm font-mono font-bold tracking-widest text-slate-900 uppercase focus:border-indigo-600 focus:outline-hidden shadow-2xs text-center sm:text-left min-w-[160px]"
        />

        <button
          type="submit"
          disabled={loading || !code.trim()}
          className="rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white px-5 py-2.5 text-xs font-bold shadow-xs transition-all flex items-center justify-center gap-1.5 cursor-pointer disabled:opacity-50"
        >
          {loading ? (
            <span>Conectando...</span>
          ) : (
            <>
              <IconSparkles className="w-4 h-4" />
              <span>Unirse a Cátedra</span>
            </>
          )}
        </button>
      </form>

      {result && (
        <div className="col-span-full w-full">
          {result.success ? (
            <div className="rounded-xl bg-emerald-50 border border-emerald-200 p-3 text-xs font-bold text-emerald-800 flex items-center gap-2 animate-in fade-in">
              <IconCheck className="w-4 h-4 text-emerald-600" />
              <span>
                ¡Te uniste con éxito a la cátedra de {result.subject_name} ({result.commission_name})! Recargando...
              </span>
            </div>
          ) : (
            <div className="rounded-xl bg-rose-50 border border-rose-200 p-3 text-xs font-bold text-rose-800 animate-in fade-in">
              {result.error}
            </div>
          )}
        </div>
      )}
    </div>
  )
}
