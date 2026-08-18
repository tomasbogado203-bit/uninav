'use client'

import { useState } from 'react'
import Link from 'next/link'
import {
  IconCalendar,
  IconFlame,
  IconChevronLeft,
  IconChevronRight,
} from '@/components/icons'

export interface GlobalEvent {
  id: string
  subject_id: string
  subject_name: string
  title: string
  event_type: 'parcial' | 'entrega_tp' | 'final'
  event_date: string
}

export interface GlobalNote {
  id: string
  subject_id: string
  title: string
  content?: string | null
  color: string
  event_date?: string | null
}

interface GlobalCalendarWidgetProps {
  events: GlobalEvent[]
  notes: GlobalNote[]
  firstSubjectId?: string | null
}

const MONTH_NAMES = [
  'Enero',
  'Febrero',
  'Marzo',
  'Abril',
  'Mayo',
  'Junio',
  'Julio',
  'Agosto',
  'Septiembre',
  'Octubre',
  'Noviembre',
  'Diciembre',
]

export default function GlobalCalendarWidget({
  events,
  notes,
  firstSubjectId,
}: GlobalCalendarWidgetProps) {
  const today = new Date()
  const [currentYear, setCurrentYear] = useState(today.getFullYear())
  const [currentMonth, setCurrentMonth] = useState(today.getMonth())

  const todayStr = today.toISOString().split('T')[0]

  // Próximo examen global
  const upcomingEvents = events
    .filter((e) => e.event_date >= todayStr)
    .sort((a, b) => a.event_date.localeCompare(b.event_date))

  const nextEvent = upcomingEvents[0]

  const getDaysDiff = (dateStr: string) => {
    const evtDate = new Date(dateStr + 'T00:00:00')
    const todayZero = new Date(todayStr + 'T00:00:00')
    return Math.ceil(
      (evtDate.getTime() - todayZero.getTime()) / (1000 * 3600 * 24)
    )
  }

  // Generar celdas del mini-calendario
  const getCalendarDays = () => {
    const firstDayOfMonth = new Date(currentYear, currentMonth, 1)
    const lastDayOfMonth = new Date(currentYear, currentMonth + 1, 0)

    let startDayOfWeek = firstDayOfMonth.getDay() - 1
    if (startDayOfWeek === -1) startDayOfWeek = 6

    const daysInMonth = lastDayOfMonth.getDate()
    const calendarCells = []

    const prevMonthLastDay = new Date(currentYear, currentMonth, 0).getDate()
    for (let i = startDayOfWeek - 1; i >= 0; i--) {
      const dayNum = prevMonthLastDay - i
      const prevDate = new Date(currentYear, currentMonth - 1, dayNum)
      calendarCells.push({
        dateStr: prevDate.toISOString().split('T')[0],
        dayNum,
        isCurrentMonth: false,
      })
    }

    for (let d = 1; d <= daysInMonth; d++) {
      const yearStr = currentYear
      const monthStr = String(currentMonth + 1).padStart(2, '0')
      const dayStr = String(d).padStart(2, '0')
      const dateStr = `${yearStr}-${monthStr}-${dayStr}`
      calendarCells.push({
        dateStr,
        dayNum: d,
        isCurrentMonth: true,
      })
    }

    const remainingCells = (7 - (calendarCells.length % 7)) % 7
    for (let n = 1; n <= remainingCells; n++) {
      const nextDate = new Date(currentYear, currentMonth + 1, n)
      calendarCells.push({
        dateStr: nextDate.toISOString().split('T')[0],
        dayNum: n,
        isCurrentMonth: false,
      })
    }

    return calendarCells
  }

  const calendarDays = getCalendarDays()

  return (
    <div className="rounded-3xl border border-slate-200/80 bg-white p-5 shadow-xs flex flex-col gap-4 select-none">
      {/* Encabezado Principal del Widget */}
      <div className="flex items-center justify-between border-b border-slate-100 pb-3 gap-2">
        <div className="flex items-center gap-2 truncate">
          <IconCalendar className="w-5 h-5 text-indigo-600 shrink-0" />
          <h2 className="text-sm font-bold text-slate-900 truncate">
            Calendario de Exámenes
          </h2>
        </div>

        {firstSubjectId && (
          <Link
            href={`/materias/${firstSubjectId}/calendario`}
            className="rounded-xl bg-indigo-600 px-3 py-1.5 text-xs font-bold text-white shadow-2xs hover:bg-indigo-700 transition-all shrink-0 flex items-center gap-1 cursor-pointer"
          >
            <span>Ver Calendario Completo →</span>
          </Link>
        )}
      </div>

      {/* Próximo Examen Destacado */}
      {nextEvent && (
        <div className="rounded-2xl border border-amber-300 bg-amber-50/90 p-3 text-amber-950 shadow-2xs flex items-center justify-between text-xs gap-2">
          <div className="flex items-center gap-2 truncate">
            <IconFlame className="w-4 h-4 text-amber-600 shrink-0" />
            <div className="truncate">
              <span className="font-bold text-slate-900 block truncate">
                {nextEvent.title} ({nextEvent.subject_name})
              </span>
              <span className="text-[10px] text-amber-800 font-mono">
                {nextEvent.event_date}
              </span>
            </div>
          </div>

          <span className="text-[10px] font-black text-amber-900 bg-amber-200 px-2 py-1 rounded-lg shrink-0">
            {getDaysDiff(nextEvent.event_date) === 0
              ? '¡HOY!'
              : `Faltan ${getDaysDiff(nextEvent.event_date)}d`}
          </span>
        </div>
      )}

      {/* BLOQUE COMBINADO: Navegación de Mes + Grilla del Calendario Unificada */}
      <div className="rounded-2xl border border-slate-200 overflow-hidden bg-white shadow-2xs">
        {/* Barra de Navegación del Mes integrada directamente sobre el calendario */}
        <div className="flex items-center justify-between px-4 py-2.5 bg-slate-100/80 border-b border-slate-200 text-xs">
          <span className="font-bold text-slate-800 text-xs tracking-tight">
            {MONTH_NAMES[currentMonth]} {currentYear}
          </span>

          <div className="flex items-center gap-1">
            <button
              type="button"
              onClick={() =>
                currentMonth === 0
                  ? (setCurrentMonth(11), setCurrentYear(currentYear - 1))
                  : setCurrentMonth(currentMonth - 1)
              }
              className="rounded-lg border border-slate-200 bg-white p-1 text-slate-600 hover:bg-slate-50 transition-colors shadow-2xs cursor-pointer"
              title="Mes anterior"
            >
              <IconChevronLeft className="w-3.5 h-3.5" />
            </button>

            <button
              type="button"
              onClick={() => {
                setCurrentYear(today.getFullYear())
                setCurrentMonth(today.getMonth())
              }}
              className="rounded-lg bg-indigo-50 border border-indigo-200/80 px-2.5 py-1 text-xs font-bold text-indigo-700 hover:bg-indigo-100 transition-colors shadow-2xs cursor-pointer"
            >
              Hoy
            </button>

            <button
              type="button"
              onClick={() =>
                currentMonth === 11
                  ? (setCurrentMonth(0), setCurrentYear(currentYear + 1))
                  : setCurrentMonth(currentMonth + 1)
              }
              className="rounded-lg border border-slate-200 bg-white p-1 text-slate-600 hover:bg-slate-50 transition-colors shadow-2xs cursor-pointer"
              title="Mes siguiente"
            >
              <IconChevronRight className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>

        {/* Encabezado de Días de la Semana */}
        <div className="grid grid-cols-7 bg-slate-900 text-white text-center font-bold text-[10px] py-1.5">
          <div>Lu</div>
          <div>Ma</div>
          <div>Mi</div>
          <div>Ju</div>
          <div>Vi</div>
          <div className="text-amber-300">Sá</div>
          <div className="text-amber-300">Do</div>
        </div>

        {/* Celdas del Calendario */}
        <div className="grid grid-cols-7 border-collapse bg-white">
          {calendarDays.map((cell, idx) => {
            const isToday = cell.dateStr === todayStr
            const dayEvents = events.filter((e) => e.event_date === cell.dateStr)
            const dayNotes = notes.filter((n) => n.event_date === cell.dateStr)

            return (
              <div
                key={idx}
                className={`min-h-[50px] sm:min-h-[56px] border-b border-r border-slate-100 p-1 flex flex-col justify-between transition-colors ${
                  !cell.isCurrentMonth
                    ? 'bg-slate-50/60 text-slate-300'
                    : isToday
                    ? 'bg-indigo-50/50 ring-1 ring-inset ring-indigo-500 font-bold'
                    : 'hover:bg-slate-50/80 text-slate-700'
                }`}
              >
                <div className="flex items-center justify-between">
                  <span
                    className={`text-[10px] font-mono leading-none ${
                      isToday
                        ? 'flex h-4 w-4 items-center justify-center rounded-full bg-indigo-600 text-white font-bold'
                        : ''
                    }`}
                  >
                    {cell.dayNum}
                  </span>
                </div>

                {/* Marcadores de eventos y notas en la celda */}
                <div className="flex flex-col gap-0.5 mt-0.5">
                  {dayEvents.slice(0, 2).map((ev) => (
                    <div
                      key={ev.id}
                      className={`truncate rounded px-1 py-0.5 text-[8px] font-bold leading-tight ${
                        ev.event_type === 'final'
                          ? 'bg-purple-600 text-white'
                          : ev.event_type === 'entrega_tp'
                          ? 'bg-sky-600 text-white'
                          : 'bg-rose-600 text-white'
                      }`}
                      title={`${ev.title} (${ev.subject_name})`}
                    >
                      {ev.title}
                    </div>
                  ))}

                  {dayNotes.length > 0 && dayEvents.length === 0 && (
                    <span className="h-1.5 w-1.5 rounded-full bg-amber-400 self-center" />
                  )}
                </div>
              </div>
            )
          })}
        </div>
      </div>

      {/* Lista de Próximos Exámenes en el Pie */}
      {upcomingEvents.length > 0 && (
        <div className="flex flex-col gap-2 pt-2 border-t border-slate-100">
          <span className="text-[10px] font-bold uppercase tracking-wider text-slate-500">
            Próximos Exámenes ({upcomingEvents.length})
          </span>
          <div className="flex flex-col gap-1.5 max-h-40 overflow-y-auto scrollbar-none">
            {upcomingEvents.slice(0, 4).map((ev) => (
              <div
                key={ev.id}
                className="flex items-center justify-between rounded-xl bg-slate-50 border border-slate-200/80 px-3 py-2 text-xs"
              >
                <div className="flex flex-col truncate pr-2">
                  <span className="text-[10px] font-bold text-indigo-600 uppercase tracking-wider">
                    {ev.subject_name}
                  </span>
                  <span className="font-bold text-slate-900 truncate">
                    {ev.title}
                  </span>
                </div>

                <div className="flex items-center gap-1.5 shrink-0">
                  <span className="text-[10px] text-slate-500 font-mono">
                    {ev.event_date}
                  </span>
                  <span className="text-[10px] font-bold text-amber-700 bg-amber-100 px-2 py-0.5 rounded-md">
                    {getDaysDiff(ev.event_date)}d
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}
