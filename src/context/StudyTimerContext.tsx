'use client'

import React, { createContext, useContext, useState, useEffect, useCallback, useRef } from 'react'

export type TimerMode = 'idle' | 'study' | 'warning' | 'break'

export interface TimerPreset {
  id: string
  label: string
  studyMinutes: number
  breakMinutes: number
}

export const TIMER_PRESETS: TimerPreset[] = [
  { id: '25_5', label: '25m / 5m (Clásico)', studyMinutes: 25, breakMinutes: 5 },
  { id: '30_10', label: '30m / 10m (Universitario)', studyMinutes: 30, breakMinutes: 10 },
  { id: '50_10', label: '50m / 10m (Intensivo)', studyMinutes: 50, breakMinutes: 10 },
]

export interface LampPayload {
  state: 'IDLE' | 'STUDY' | 'WARNING' | 'BREAK' | 'PAUSED'
  color: 'BLUE' | 'RED' | 'YELLOW' | 'GREEN'
  hex: string
  r: number
  g: number
  b: number
  time_remaining_seconds: number
  is_active: boolean
}

interface StudyTimerContextType {
  mode: TimerMode
  timeRemaining: number
  totalStudyTodaySeconds: number
  dailyGoalMinutes: number
  isRunning: boolean
  currentPreset: TimerPreset
  lampStatus: LampPayload
  startTimer: () => void
  pauseTimer: () => void
  resetTimer: () => void
  skipToBreak: () => void
  skipToStudy: () => void
  selectPreset: (preset: TimerPreset) => void
  setDailyGoalMinutes: (mins: number) => void
}

const StudyTimerContext = createContext<StudyTimerContextType | null>(null)

export function StudyTimerProvider({ children }: { children: React.ReactNode }) {
  const [currentPreset, setCurrentPreset] = useState<TimerPreset>(TIMER_PRESETS[1]) // Default 30/10
  const [mode, setMode] = useState<TimerMode>('idle')
  const [timeRemaining, setTimeRemaining] = useState<number>(30 * 60)
  const [isRunning, setIsRunning] = useState<boolean>(false)
  const [totalStudyTodaySeconds, setTotalStudyTodaySeconds] = useState<number>(0)
  const [dailyGoalMinutes, setDailyGoalMinutes] = useState<number>(120) // 2 horas de meta

  const intervalRef = useRef<NodeJS.Timeout | null>(null)

  // Cargar estado inicial desde localStorage
  useEffect(() => {
    try {
      const savedToday = localStorage.getItem('uninav_study_today_secs')
      if (savedToday) setTotalStudyTodaySeconds(parseInt(savedToday, 10))

      const savedGoal = localStorage.getItem('uninav_study_goal_mins')
      if (savedGoal) setDailyGoalMinutes(parseInt(savedGoal, 10))

      const savedPresetId = localStorage.getItem('uninav_preset_id')
      if (savedPresetId) {
        const found = TIMER_PRESETS.find((p) => p.id === savedPresetId)
        if (found) {
          setCurrentPreset(found)
          setTimeRemaining(found.studyMinutes * 60)
        }
      }
    } catch {
      // Ignorar en SSR
    }
  }, [])

  // Sincronizar estado con API local / endpoint de lámpara IoT
  const syncLampState = useCallback((currentMode: TimerMode, remainingSecs: number, active: boolean) => {
    let payload: LampPayload

    if (!active) {
      // Si está en pausa o inactivo, la lámpara se pone en color azul / espera
      payload = {
        state: currentMode === 'idle' ? 'IDLE' : 'PAUSED',
        color: 'BLUE',
        hex: '#6366F1',
        r: 99,
        g: 102,
        b: 241,
        time_remaining_seconds: remainingSecs,
        is_active: false,
      }
    } else {
      switch (currentMode) {
        case 'study':
          payload = {
            state: 'STUDY',
            color: 'RED',
            hex: '#EF4444',
            r: 239,
            g: 68,
            b: 68,
            time_remaining_seconds: remainingSecs,
            is_active: true,
          }
          break
        case 'warning':
          payload = {
            state: 'WARNING',
            color: 'YELLOW',
            hex: '#F59E0B',
            r: 245,
            g: 158,
            b: 11,
            time_remaining_seconds: remainingSecs,
            is_active: true,
          }
          break
        case 'break':
          payload = {
            state: 'BREAK',
            color: 'GREEN',
            hex: '#10B981',
            r: 16,
            g: 185,
            b: 129,
            time_remaining_seconds: remainingSecs,
            is_active: true,
          }
          break
        default:
          payload = {
            state: 'IDLE',
            color: 'BLUE',
            hex: '#6366F1',
            r: 99,
            g: 102,
            b: 241,
            time_remaining_seconds: remainingSecs,
            is_active: false,
          }
      }
    }

    try {
      fetch('/api/iot/lamp', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      }).catch(() => {})
    } catch {
      // Fallback
    }

    return payload
  }, [])

  // Ticker de 1 segundo del cronómetro
  useEffect(() => {
    if (isRunning) {
      intervalRef.current = setInterval(() => {
        setTimeRemaining((prev) => {
          if (prev <= 1) {
            // Cambio de fase automático
            if (mode === 'study' || mode === 'warning') {
              // Fin de estudio -> Iniciar descanso
              setMode('break')
              const breakSecs = currentPreset.breakMinutes * 60
              syncLampState('break', breakSecs, true)
              return breakSecs
            } else if (mode === 'break') {
              // Fin de descanso -> Volver a estudio
              setMode('study')
              const studySecs = currentPreset.studyMinutes * 60
              syncLampState('study', studySecs, true)
              return studySecs
            }
          }

          // Detección de últimos 2 minutos para el estado amarillo de advertencia
          if ((mode === 'study' || mode === 'warning') && prev - 1 <= 120 && prev - 1 > 0) {
            if (mode !== 'warning') {
              setMode('warning')
              syncLampState('warning', prev - 1, true)
            }
          }

          // Si estamos en estudio, acumular segundos de estudio hoy
          if (mode === 'study' || mode === 'warning') {
            setTotalStudyTodaySeconds((total) => {
              const updated = total + 1
              try {
                localStorage.setItem('uninav_study_today_secs', updated.toString())
              } catch {}
              return updated
            })
          }

          return prev - 1
        })
      }, 1000)
    } else {
      if (intervalRef.current) clearInterval(intervalRef.current)
    }

    return () => {
      if (intervalRef.current) clearInterval(intervalRef.current)
    }
  }, [isRunning, mode, currentPreset, syncLampState])

  const startTimer = () => {
    if (mode === 'idle') {
      setMode('study')
      syncLampState('study', timeRemaining, true)
    } else {
      syncLampState(mode, timeRemaining, true)
    }
    setIsRunning(true)
  }

  const pauseTimer = () => {
    setIsRunning(false)
    syncLampState(mode, timeRemaining, false)
  }

  const resetTimer = () => {
    setIsRunning(false)
    setMode('idle')
    const initialSecs = currentPreset.studyMinutes * 60
    setTimeRemaining(initialSecs)
    syncLampState('idle', initialSecs, false)
  }

  const skipToBreak = () => {
    setMode('break')
    const breakSecs = currentPreset.breakMinutes * 60
    setTimeRemaining(breakSecs)
    syncLampState('break', breakSecs, isRunning)
  }

  const skipToStudy = () => {
    setMode('study')
    const studySecs = currentPreset.studyMinutes * 60
    setTimeRemaining(studySecs)
    syncLampState('study', studySecs, isRunning)
  }

  const selectPreset = (preset: TimerPreset) => {
    setCurrentPreset(preset)
    try {
      localStorage.setItem('uninav_preset_id', preset.id)
    } catch {}
    setIsRunning(false)
    setMode('idle')
    const initialSecs = preset.studyMinutes * 60
    setTimeRemaining(initialSecs)
    syncLampState('idle', initialSecs, false)
  }

  const handleSetDailyGoal = (mins: number) => {
    setDailyGoalMinutes(mins)
    try {
      localStorage.setItem('uninav_study_goal_mins', mins.toString())
    } catch {}
  }

  const lampStatus: LampPayload = (() => {
    if (!isRunning) {
      return {
        state: mode === 'idle' ? 'IDLE' : 'PAUSED',
        color: 'BLUE',
        hex: '#6366F1',
        r: 99,
        g: 102,
        b: 241,
        time_remaining_seconds: timeRemaining,
        is_active: false,
      }
    }

    switch (mode) {
      case 'study':
        return {
          state: 'STUDY',
          color: 'RED',
          hex: '#EF4444',
          r: 239,
          g: 68,
          b: 68,
          time_remaining_seconds: timeRemaining,
          is_active: true,
        }
      case 'warning':
        return {
          state: 'WARNING',
          color: 'YELLOW',
          hex: '#F59E0B',
          r: 245,
          g: 158,
          b: 11,
          time_remaining_seconds: timeRemaining,
          is_active: true,
        }
      case 'break':
        return {
          state: 'BREAK',
          color: 'GREEN',
          hex: '#10B981',
          r: 16,
          g: 185,
          b: 129,
          time_remaining_seconds: timeRemaining,
          is_active: true,
        }
      default:
        return {
          state: 'IDLE',
          color: 'BLUE',
          hex: '#6366F1',
          r: 99,
          g: 102,
          b: 241,
          time_remaining_seconds: timeRemaining,
          is_active: false,
        }
    }
  })()

  return (
    <StudyTimerContext.Provider
      value={{
        mode,
        timeRemaining,
        totalStudyTodaySeconds,
        dailyGoalMinutes,
        isRunning,
        currentPreset,
        lampStatus,
        startTimer,
        pauseTimer,
        resetTimer,
        skipToBreak,
        skipToStudy,
        selectPreset,
        setDailyGoalMinutes: handleSetDailyGoal,
      }}
    >
      {children}
    </StudyTimerContext.Provider>
  )
}

export function useStudyTimer() {
  const context = useContext(StudyTimerContext)
  if (!context) {
    throw new Error('useStudyTimer must be used within a StudyTimerProvider')
  }
  return context
}
