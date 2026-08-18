'use client'

import { useState } from 'react'
import Link from 'next/link'
import { useStudyTimer, TIMER_PRESETS } from '@/context/StudyTimerContext'
import {
  IconPlay,
  IconPause,
  IconRefresh,
  IconMenu,
  IconSparkles,
  IconCheck,
} from '@/components/icons'

export default function StudyTimerCapsule() {
  const {
    mode,
    timeRemaining,
    totalStudyTodaySeconds,
    dailyGoalMinutes,
    isRunning,
    currentPreset,
    startTimer,
    pauseTimer,
    resetTimer,
    skipToBreak,
    skipToStudy,
    selectPreset,
    setDailyGoalMinutes,
  } = useStudyTimer()

  const [showMenu, setShowMenu] = useState(false)

  // Formato MM:SS del tiempo restante
  const minutes = Math.floor(timeRemaining / 60)
  const seconds = timeRemaining % 60
  const formattedTimer = `${minutes.toString().padStart(2, '0')}:${seconds
    .toString()
    .padStart(2, '0')}`

  // Formato "X hr Y min" de estudio hoy
  const todayTotalMins = Math.floor(totalStudyTodaySeconds / 60)
  const todayHours = Math.floor(todayTotalMins / 60)
  const todayRemainingMins = todayTotalMins % 60
  const formattedWorkHours = `${todayHours} hr ${todayRemainingMins} min`

  // Porcentaje de meta diaria completada
  const percentOfDay = Math.round((todayTotalMins / Math.max(1, dailyGoalMinutes)) * 100)

  // Estilo visual del modo actual
  const getModeTheme = () => {
    switch (mode) {
      case 'study':
        return {
          label: 'TIEMPO DE FOCO',
          dotColor: 'bg-rose-500 shadow-[0_0_10px_rgba(239,68,68,0.8)]',
          textColor: 'text-rose-400',
          borderColor: 'border-rose-500/30',
        }
      case 'warning':
        return {
          label: 'ÚLTIMOS 2 MIN',
          dotColor: 'bg-amber-400 animate-pulse shadow-[0_0_10px_rgba(245,158,11,0.8)]',
          textColor: 'text-amber-300',
          borderColor: 'border-amber-500/30',
        }
      case 'break':
        return {
          label: 'DESCANSO LIBRE',
          dotColor: 'bg-emerald-400 shadow-[0_0_10px_rgba(16,185,129,0.8)]',
          textColor: 'text-emerald-400',
          borderColor: 'border-emerald-500/30',
        }
      default:
        return {
          label: 'LISTO PARA FOCO',
          dotColor: 'bg-indigo-400',
          textColor: 'text-indigo-300',
          borderColor: 'border-slate-800',
        }
    }
  }

  const theme = getModeTheme()

  return (
    <div className="relative inline-block select-none z-50">
      {/* PÍLDORA CÁPSULA DINÁMICA (Idéntica a la referencia de diseño) */}
      <div
        className={`flex items-center rounded-full bg-slate-950/95 backdrop-blur-md border ${theme.borderColor} px-4 sm:px-5 py-2 shadow-2xl transition-all gap-3 sm:gap-6 text-white text-xs font-sans`}
      >
        {/* SECCIÓN 1: Cronómetro en Vivo */}
        <div
          onClick={() => (isRunning ? pauseTimer() : startTimer())}
          className="flex items-center gap-2 cursor-pointer group"
          title={isRunning ? 'Hacé clic para pausar' : 'Hacé clic para iniciar foco'}
        >
          <span className={`h-2.5 w-2.5 rounded-full ${theme.dotColor} transition-all`} />

          <div className="flex flex-col">
            <span className="font-mono text-sm sm:text-base font-black tracking-tight text-white group-hover:text-indigo-300 transition-colors">
              {formattedTimer}
            </span>
            <span className="text-[9px] font-bold tracking-wider text-slate-400 uppercase -mt-0.5">
              {theme.label}
            </span>
          </div>
        </div>

        {/* Separador vertical sutil */}
        <div className="h-6 w-px bg-slate-800/80" />

        {/* SECCIÓN 2: Horas de Estudio Hoy */}
        <div className="flex flex-col">
          <span className="font-mono text-xs sm:text-sm font-bold text-indigo-300">
            {formattedWorkHours}
          </span>
          <span className="text-[9px] font-bold tracking-wider text-slate-400 uppercase -mt-0.5">
            ESTUDIO HOY
          </span>
        </div>

        {/* Separador vertical sutil */}
        <div className="h-6 w-px bg-slate-800/80" />

        {/* SECCIÓN 3: Porcentaje de Meta Diaria */}
        <div className="flex flex-col">
          <span
            className={`font-mono text-xs sm:text-sm font-bold ${
              percentOfDay >= 100 ? 'text-emerald-400' : 'text-slate-200'
            }`}
          >
            {percentOfDay}%
          </span>
          <span className="text-[9px] font-bold tracking-wider text-slate-400 uppercase -mt-0.5">
            META DIARIA
          </span>
        </div>

        {/* BOTÓN MENÚ / AJUSTES */}
        <button
          type="button"
          onClick={() => setShowMenu(!showMenu)}
          className={`flex h-7 w-7 items-center justify-center rounded-full bg-slate-900 border border-slate-700/80 text-slate-300 hover:text-white hover:bg-slate-800 transition-all cursor-pointer ${
            showMenu ? 'ring-2 ring-indigo-500 bg-slate-800 text-white' : ''
          }`}
          title="Ajustes de Pomodoro e IoT"
        >
          <IconMenu className="w-3.5 h-3.5" />
        </button>
      </div>

      {/* DROPDOWN FLOTANTE DE CONTROL Y AJUSTES */}
      {showMenu && (
        <div
          className="absolute right-0 top-full mt-2 w-72 rounded-2xl border border-slate-800 bg-slate-950/98 backdrop-blur-xl p-4 text-white shadow-2xl animate-in zoom-in-95 flex flex-col gap-3.5 z-50 text-xs"
          onClick={(e) => e.stopPropagation()}
        >
          {/* Header del Menú */}
          <div className="flex items-center justify-between border-b border-slate-800 pb-2">
            <span className="font-bold text-slate-200 text-xs">Control de Productividad</span>
            <span className="text-[10px] font-semibold text-indigo-400">
              {currentPreset.label}
            </span>
          </div>

          {/* Botones de Control Principal */}
          <div className="grid grid-cols-3 gap-2">
            <button
              type="button"
              onClick={() => (isRunning ? pauseTimer() : startTimer())}
              className={`rounded-xl py-2 px-3 font-bold text-xs flex items-center justify-center gap-1.5 transition-all cursor-pointer ${
                isRunning
                  ? 'bg-amber-500 hover:bg-amber-600 text-slate-950 shadow-xs'
                  : 'bg-indigo-600 hover:bg-indigo-500 text-white shadow-xs'
              }`}
            >
              {isRunning ? (
                <>
                  <IconPause className="w-3 h-3" />
                  <span>Pausar</span>
                </>
              ) : (
                <>
                  <IconPlay className="w-3 h-3" />
                  <span>Iniciar</span>
                </>
              )}
            </button>

            <button
              type="button"
              onClick={resetTimer}
              className="rounded-xl bg-slate-900 border border-slate-800 py-2 px-2.5 font-bold text-xs text-slate-300 hover:bg-slate-800 hover:text-white flex items-center justify-center gap-1 cursor-pointer transition-colors"
            >
              <IconRefresh className="w-3 h-3" />
              <span>Reiniciar</span>
            </button>

            <button
              type="button"
              onClick={() => (mode === 'study' ? skipToBreak() : skipToStudy())}
              className="rounded-xl bg-slate-900 border border-slate-800 py-2 px-2 font-bold text-xs text-slate-300 hover:bg-slate-800 hover:text-white flex items-center justify-center gap-1 cursor-pointer transition-colors text-[11px]"
            >
              <span>{mode === 'break' ? 'A Foco' : 'A Pausa'}</span>
            </button>
          </div>

          {/* Selector de Presets */}
          <div className="flex flex-col gap-1.5">
            <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400">
              Presets de Bloque:
            </span>
            <div className="flex flex-col gap-1">
              {TIMER_PRESETS.map((preset) => (
                <button
                  key={preset.id}
                  type="button"
                  onClick={() => selectPreset(preset)}
                  className={`flex items-center justify-between rounded-xl px-3 py-2 text-xs font-semibold transition-all cursor-pointer ${
                    currentPreset.id === preset.id
                      ? 'bg-indigo-600 text-white shadow-2xs font-bold'
                      : 'bg-slate-900 border border-slate-800 text-slate-300 hover:bg-slate-800'
                  }`}
                >
                  <span>{preset.label}</span>
                  {currentPreset.id === preset.id && <IconCheck className="w-3.5 h-3.5" />}
                </button>
              ))}
            </div>
          </div>

          {/* Meta Diaria de Estudio */}
          <div className="flex flex-col gap-1.5 pt-2 border-t border-slate-800">
            <div className="flex items-center justify-between">
              <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400">
                Meta Diaria:
              </span>
              <span className="text-xs font-bold text-indigo-400">
                {Math.round(dailyGoalMinutes / 60)} horas ({dailyGoalMinutes} min)
              </span>
            </div>
            <div className="grid grid-cols-4 gap-1">
              {[60, 120, 180, 240].map((mins) => (
                <button
                  key={mins}
                  type="button"
                  onClick={() => setDailyGoalMinutes(mins)}
                  className={`rounded-lg py-1 text-center text-xs font-bold transition-all cursor-pointer ${
                    dailyGoalMinutes === mins
                      ? 'bg-indigo-600 text-white'
                      : 'bg-slate-900 text-slate-400 hover:bg-slate-800 hover:text-white'
                  }`}
                >
                  {mins / 60}h
                </button>
              ))}
            </div>
          </div>

          {/* Acceso al Hardware IoT Companion */}
          <Link
            href="/iot"
            onClick={() => setShowMenu(false)}
            className="flex items-center justify-center gap-1.5 rounded-xl bg-slate-900 hover:bg-indigo-950 border border-indigo-500/30 py-2 text-xs font-bold text-indigo-300 transition-colors cursor-pointer mt-1"
          >
            <IconSparkles className="w-3.5 h-3.5" />
            <span>Lámpara Semáforo IoT (ESP32)</span>
          </Link>
        </div>
      )}
    </div>
  )
}
