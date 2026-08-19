'use client'

import {
  IconDocument,
  IconChat,
  IconQuiz,
  IconCalendar,
  IconChart,
} from '@/components/icons'

export interface SubjectMetrics {
  documentsCount: number
  chunksCount: number
  threadsCount: number
  quizAttemptsCount: number
  averageScore: number
  photosCount: number
  nextEventTitle?: string | null
  nextEventDate?: string | null
  nextEventType?: string | null
}

interface SubjectProgressPanelProps {
  subjectName: string
  metrics: SubjectMetrics
}

export default function SubjectProgressPanel({
  subjectName,
  metrics,
}: SubjectProgressPanelProps) {
  // Cálculo del Nivel de Preparación Global (0 a 100%)
  const docScore = Math.min(30, metrics.documentsCount * 15)
  const chatScore = Math.min(20, metrics.threadsCount * 10)
  const quizScore = metrics.quizAttemptsCount > 0 ? Math.round((metrics.averageScore / 100) * 30) : 0
  const photoScore = Math.min(20, metrics.photosCount * 10)

  const readinessPercentage = Math.min(100, docScore + chatScore + quizScore + photoScore)

  const getDaysDiff = (dateStr: string) => {
    const todayZero = new Date(new Date().toISOString().split('T')[0] + 'T00:00:00')
    const evtDate = new Date(dateStr + 'T00:00:00')
    return Math.ceil((evtDate.getTime() - todayZero.getTime()) / (1000 * 3600 * 24))
  }

  return (
    <div className="rounded-3xl border border-slate-200/80 bg-white p-4 sm:p-5 shadow-xs flex flex-col gap-4">
      {/* Encabezado con Barra de Progreso Principal */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 border-b border-slate-100 pb-3.5">
        <div>
          <div className="inline-flex items-center gap-1.5 rounded-full bg-indigo-50 border border-indigo-100 px-2.5 py-0.5 text-[11px] font-bold text-indigo-700 mb-1">
            <IconChart className="w-3 h-3" />
            Diagnóstico • {subjectName}
          </div>
          <h2 className="text-lg font-bold text-slate-900 tracking-tight">
            Estado de Avance y Preparación
          </h2>
          <p className="text-[11px] text-slate-500">
            Resumen de salud académica y preparación para exámenes de esta cursada.
          </p>
        </div>

        {/* Nivel de Preparación General */}
        <div className="flex flex-col items-end shrink-0">
          <div className="flex items-center gap-2">
            <span className="text-[11px] font-bold uppercase tracking-wider text-slate-500">
              Nivel de Preparación:
            </span>
            <span className="text-lg font-black text-indigo-600 font-mono">
              {readinessPercentage}%
            </span>
          </div>

          <div className="w-40 sm:w-48 h-2.5 rounded-full bg-slate-100 overflow-hidden border border-slate-200/80 mt-1">
            <div
              className={`h-full rounded-full transition-all duration-500 ${
                readinessPercentage >= 70
                  ? 'bg-gradient-to-r from-emerald-500 to-teal-500'
                  : readinessPercentage >= 40
                  ? 'bg-gradient-to-r from-indigo-500 to-sky-500'
                  : 'bg-gradient-to-r from-amber-500 to-orange-500'
              }`}
              style={{ width: `${Math.max(5, readinessPercentage)}%` }}
            />
          </div>
        </div>
      </div>

      {/* Grilla de 4 Tarjetas de Métricas */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
        {/* 1. Biblioteca & RAG */}
        <div className="rounded-2xl border border-slate-200/80 bg-slate-50/60 p-3 flex flex-col justify-between gap-1.5">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-bold uppercase tracking-wider text-slate-500">
              Apuntes RAG
            </span>
            <IconDocument className="w-3.5 h-3.5 text-indigo-600" />
          </div>
          <div>
            <span className="text-xl font-black text-slate-900 block">
              {metrics.documentsCount} {metrics.documentsCount === 1 ? 'PDF' : 'PDFs'}
            </span>
            <span className="text-[10px] text-slate-500 font-medium block">
              {metrics.chunksCount} fragmentos indexados
            </span>
          </div>
        </div>

        {/* 2. Chat Socrático */}
        <div className="rounded-2xl border border-slate-200/80 bg-slate-50/60 p-3 flex flex-col justify-between gap-1.5">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-bold uppercase tracking-wider text-slate-500">
              Consultas Tutor
            </span>
            <IconChat className="w-3.5 h-3.5 text-emerald-600" />
          </div>
          <div>
            <span className="text-xl font-black text-slate-900 block">
              {metrics.threadsCount} {metrics.threadsCount === 1 ? 'Tema' : 'Temas'}
            </span>
            <span className="text-[10px] text-slate-500 font-medium block">
              Consultas socráticas activas
            </span>
          </div>
        </div>

        {/* 3. Rendimiento Quizes */}
        <div className="rounded-2xl border border-slate-200/80 bg-slate-50/60 p-3 flex flex-col justify-between gap-1.5">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-bold uppercase tracking-wider text-slate-500">
              Simulacros
            </span>
            <IconQuiz className="w-3.5 h-3.5 text-purple-600" />
          </div>
          <div>
            <span className="text-xl font-black text-indigo-700 block">
              {metrics.quizAttemptsCount > 0 ? `${metrics.averageScore}%` : 'S/D'}
            </span>
            <span className="text-[10px] text-slate-500 font-medium block">
              {metrics.quizAttemptsCount} {metrics.quizAttemptsCount === 1 ? 'intento realizado' : 'intentos realizados'}
            </span>
          </div>
        </div>

        {/* 4. Próximo Examen */}
        <div className="rounded-2xl border border-amber-200 bg-amber-50/80 p-3 flex flex-col justify-between gap-1.5">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-bold uppercase tracking-wider text-amber-900">
              Próximo Examen
            </span>
            <IconCalendar className="w-3.5 h-3.5 text-amber-600" />
          </div>
          <div>
            {metrics.nextEventDate ? (
              <>
                <span className="text-xs font-bold text-amber-950 block truncate">
                  {metrics.nextEventTitle}
                </span>
                <span className="text-[10px] font-bold text-amber-900 bg-amber-200/80 px-2 py-0.5 rounded-md inline-block mt-0.5 font-mono">
                  {getDaysDiff(metrics.nextEventDate) === 0
                    ? '¡HOY!'
                    : `Faltan ${getDaysDiff(metrics.nextEventDate)} días`}
                </span>
              </>
            ) : (
              <span className="text-xs text-amber-800 italic block">
                Sin exámenes agendados aún
              </span>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
