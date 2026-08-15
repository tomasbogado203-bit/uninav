'use client'

import { useState } from 'react'
import Link from 'next/link'
import { IconCalendar, IconFlame } from '@/components/icons'

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
    <div className="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm flex flex-col gap-4">
      {/* Encabezado con Botón de Acceso al Calendario Completo */}
      <div className="flex items-center justify-between border-b border-slate-100 pb-3 gap-2">
        <div className="flex items-center gap-2 truncate">
          <IconCalendar className="w-5 h-5 text-indigo-600 shrink-0" />
          <h2 className="text-sm font-bold text-slate-900 truncate">
            Panorama General ({MONTH_NAMES[currentMonth]} {currentYear})
          </h2>
        </div>

        {firstSubjectId && (
          <Link
            href={`/materias/${firstSubjectId}/calendario`}
            className="rounded-xl bg-indigo-600 px-3 py-1.5 text-xs font-bold text-white shadow-2xs hover:bg-indigo-700 transition-all shrink-0 flex items-center gap-1"
          >
            Ir al Calendario →
          </Link>
        )}
      </div>

      {/* Navegación del mes */}
      <div className="flex items-center justify-between px-1 text-xs">
        <span className="font-semibold text-slate-600">
          {MONTH_NAMES[currentMonth]} {currentYear}
        </span>
        <div className="flex items-center gap-1">
          <button
            onClick={() =>
              currentMonth === 0
                ? (setCurrentMonth(11), setCurrentYear(currentYear - 1))
                : setCurrentMonth(currentMonth - 1)
            }
            className="rounded-lg border border-slate-200 px-2 py-0.5 text-xs font-semibold text-slate-600 hover:bg-slate-50"
          >
            ←
          </button>
          <button
            onClick={() => {
              setCurrentYear(today.getFullYear())
              setCurrentMonth(today.getMonth())
            }}
            className="rounded-lg bg-indigo-50 px-2 py-0.5 text-xs font-semibold text-indigo-700 hover:bg-indigo-100"
          >
            Hoy
          </button>
          <button
            onClick={() =>
              currentMonth === 11
                ? (setCurrentMonth(0), setCurrentYear(currentYear + 1))
                : setCurrentMonth(currentMonth + 1)
            }
            className="rounded-lg border border-slate-200 px-2 py-0.5 text-xs font-semibold text-slate-600 hover:bg-slate-50"
          >
            →
          </button>
        </div>
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

      {/* Grilla Mini del Calendario */}
      <div className="rounded-2xl border border-slate-200 overflow-hidden bg-slate-50">
        <div className="grid grid-cols-7 bg-slate-900 text-white text-center font-bold text-[10px] py-1">
          <div>Lu</div>
          <div>Ma</div>
          <div>Mi</div>
          <div>Ju</div>
          <div>Vi</div>
          <div className="text-amber-300">Sá</div>
          <div className="text-amber-300">Do</div>
        </div>

        <div className="grid grid-cols-7 border-collapse bg-white">
          {calendarDays.map((cell, idx) => {
            const isToday = cell.dateStr === todayStr
            const dayEvents = events.filter((e) => e.event_date === cell.dateStr)
            const dayNotes = notes.filter((n) => n.event_date === cell.dateStr)

            return (
              <div
                key={idx}
                className={`min-h-[48px] p-1 border-b border-r border-slate-100 flex flex-col justify-between text-center relative ${
                  !cell.isCurrentMonth
                    ? 'bg-slate-50 text-slate-300'
                    : isToday
                    ? 'bg-indigo-50 ring-1 ring-indigo-500 font-bold'
                    : 'bg-white text-slate-700'
                }`}
              >
                <span
                  className={`text-[10px] ${
                    isToday
                      ? 'text-indigo-600 font-black'
                      : cell.isCurrentMonth
                      ? 'font-bold'
                      : 'text-slate-300'
                  }`}
                >
                  {cell.dayNum}
                </span>

                {/* Puntos o Badges de Eventos */}
                <div className="flex flex-col gap-0.5 items-center">
                  {dayEvents.map((evt) => (
                    <Link
                      key={evt.id}
                      href={`/materias/${evt.subject_id}/calendario`}
                      className={`w-full truncate text-[7px] font-bold px-0.5 rounded text-white ${
                        evt.event_type === 'parcial'
                          ? 'bg-rose-500'
                          : evt.event_type === 'final'
                          ? 'bg-purple-600'
                          : 'bg-sky-600'
                      }`}
                      title={`${evt.subject_name}: ${evt.title}`}
                    >
                      {evt.title}
                    </Link>
                  ))}

                  {dayNotes.map((n) => (
                    <span
                      key={n.id}
                      className="w-1.5 h-1.5 rounded-full bg-amber-400"
                      title={`Post-it: ${n.title}`}
                    />
                  ))}
                </div>
              </div>
            )
          })}
        </div>
      </div>

      {/* Lista de Próximas Evaluaciones Consolidadas */}
      {upcomingEvents.length > 0 && (
        <div className="flex flex-col gap-2">
          <h3 className="text-[11px] font-bold uppercase tracking-wider text-slate-500">
            Próximos Exámenes ({upcomingEvents.length})
          </h3>
          <div className="flex flex-col gap-1.5 max-h-[160px] overflow-y-auto pr-1">
            {upcomingEvents.slice(0, 4).map((evt) => (
              <Link
                key={evt.id}
                href={`/materias/${evt.subject_id}/calendario`}
                className="rounded-xl border border-slate-200/80 bg-slate-50 p-2 text-xs hover:bg-slate-100 transition-colors flex items-center justify-between gap-2"
              >
                <div className="truncate">
                  <span className="text-[10px] font-bold text-indigo-600 block uppercase truncate">
                    {evt.subject_name}
                  </span>
                  <span className="font-bold text-slate-900 truncate block">
                    {evt.title}
                  </span>
                </div>
                <div className="text-right shrink-0">
                  <span className="text-[10px] text-slate-500 font-mono block">
                    {evt.event_date}
                  </span>
                  <span className="text-[9px] font-bold text-amber-700 bg-amber-100 px-1.5 py-0.2 rounded">
                    {getDaysDiff(evt.event_date) === 0
                      ? '¡HOY!'
                      : `${getDaysDiff(evt.event_date)} días`}
                  </span>
                </div>
              </Link>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}
