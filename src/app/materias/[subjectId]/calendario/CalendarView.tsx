'use client'

import { useState } from 'react'
import {
  createAcademicEventAction,
  deleteAcademicEventAction,
  createStickyNoteAction,
  deleteStickyNoteAction,
} from './actions'

interface RoadmapStep {
  day_offset: number
  date_label: string
  topic: string
  activity: string
}

interface AcademicEvent {
  id: string
  event_type: 'parcial' | 'entrega_tp' | 'final'
  title: string
  event_date: string
  study_roadmap?: RoadmapStep[] | null
}

interface StickyNote {
  id: string
  title: string
  content: string
  color: 'yellow' | 'blue' | 'green' | 'pink' | 'purple'
  event_date?: string | null
  created_at?: string
}

interface CalendarViewProps {
  subjectId: string
  events: AcademicEvent[]
  notes: StickyNote[]
  criticalWeeksCount: number
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

const NOTE_COLOR_STYLES = {
  yellow: 'bg-amber-200/90 border-amber-300 text-amber-950 shadow-amber-200/50',
  blue: 'bg-sky-200/90 border-sky-300 text-sky-950 shadow-sky-200/50',
  green: 'bg-emerald-200/90 border-emerald-300 text-emerald-950 shadow-emerald-200/50',
  pink: 'bg-rose-200/90 border-rose-300 text-rose-950 shadow-rose-200/50',
  purple: 'bg-purple-200/90 border-purple-300 text-purple-950 shadow-purple-200/50',
}

export default function CalendarView({
  subjectId,
  events,
  notes,
  criticalWeeksCount,
}: CalendarViewProps) {
  const today = new Date()
  const [currentYear, setCurrentYear] = useState(today.getFullYear())
  const [currentMonth, setCurrentMonth] = useState(today.getMonth())

  // Estado de filtro simplificado: 'all' | 'event' | 'note'
  const [filterType, setFilterType] = useState<'all' | 'event' | 'note'>('all')

  // Estado para creación de evaluación
  const [eventType, setEventType] = useState<'parcial' | 'entrega_tp' | 'final'>('parcial')

  // Estado para creación por fecha seleccionada
  const [selectedDateStr, setSelectedDateStr] = useState<string>(
    today.toISOString().split('T')[0]
  )
  const [selectedColor, setSelectedColor] = useState<
    'yellow' | 'blue' | 'green' | 'pink' | 'purple'
  >('yellow')
  const [expandedRoadmapId, setExpandedRoadmapId] = useState<string | null>(null)
  const [activeTabForm, setActiveTabForm] = useState<'event' | 'note'>('event')

  const [loadingEvent, setLoadingEvent] = useState(false)
  const [loadingNote, setLoadingNote] = useState(false)

  const todayStr = today.toISOString().split('T')[0]

  // Próximo evento para la cuenta regresiva
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

  // Navegación de mes
  const handlePrevMonth = () => {
    if (currentMonth === 0) {
      setCurrentMonth(11)
      setCurrentYear(currentYear - 1)
    } else {
      setCurrentMonth(currentMonth - 1)
    }
  }

  const handleNextMonth = () => {
    if (currentMonth === 11) {
      setCurrentMonth(0)
      setCurrentYear(currentYear + 1)
    } else {
      setCurrentMonth(currentMonth + 1)
    }
  }

  const handleToday = () => {
    setCurrentYear(today.getFullYear())
    setCurrentMonth(today.getMonth())
    setSelectedDateStr(today.toISOString().split('T')[0])
  }

  // Generación de los días del mes
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
      const dateStr = prevDate.toISOString().split('T')[0]
      calendarCells.push({
        dateStr,
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
      const dateStr = nextDate.toISOString().split('T')[0]
      calendarCells.push({
        dateStr,
        dayNum: n,
        isCurrentMonth: false,
      })
    }

    return calendarCells
  }

  const calendarDays = getCalendarDays()

  // Handlers de envío
  const handleCreateEvent = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    setLoadingEvent(true)
    const formData = new FormData(e.currentTarget)
    try {
      await createAcademicEventAction(subjectId, formData)
      window.location.reload()
    } catch (err) {
      alert(err instanceof Error ? err.message : 'Error al agendar evento.')
      setLoadingEvent(false)
    }
  }

  const handleCreateNote = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    setLoadingNote(true)
    const formData = new FormData(e.currentTarget)
    formData.set('color', selectedColor)
    try {
      await createStickyNoteAction(subjectId, formData)
      window.location.reload()
    } catch (err) {
      alert(err instanceof Error ? err.message : 'Error al guardar la nota.')
      setLoadingNote(false)
    }
  }

  const handleDeleteEvent = async (eventId: string) => {
    if (!confirm('¿Eliminar esta evaluación del calendario?')) return
    try {
      await deleteAcademicEventAction(subjectId, eventId)
      window.location.reload()
    } catch (err) {
      alert(err instanceof Error ? err.message : 'Error al borrar evento.')
    }
  }

  const handleDeleteNote = async (noteId: string) => {
    try {
      await deleteStickyNoteAction(subjectId, noteId)
      window.location.reload()
    } catch (err) {
      alert(err instanceof Error ? err.message : 'Error al borrar la nota.')
    }
  }

  return (
    <div className="grid grid-cols-1 lg:grid-cols-12 gap-5 items-start">
      {/* COLUMNA IZQUIERDA: CALENDARIO MENSUAL COMPACTO (8 columnas) */}
      <div className="lg:col-span-8 flex flex-col gap-4">
        {/* MICRO-BANNER DE CUENTA REGRESIVA AL PRÓXIMO EXAMEN (COMPACTO) */}
        {nextEvent && (
          <div className="rounded-2xl border border-indigo-200 bg-gradient-to-r from-indigo-950 via-slate-900 to-indigo-900 px-3.5 py-2 text-white shadow-xs flex items-center justify-between gap-3 text-xs">
            <div className="flex items-center gap-2.5">
              <span className="flex h-7 w-7 items-center justify-center rounded-lg bg-amber-400 text-slate-950 font-black text-sm shrink-0">
                🔥
              </span>
              <div className="flex items-center gap-2">
                <span className="font-semibold text-white truncate max-w-[240px] sm:max-w-[320px]">
                  {nextEvent.title}
                </span>
                <span className="text-[10px] text-indigo-300 font-mono">
                  ({nextEvent.event_date})
                </span>
              </div>
            </div>

            <div className="flex items-center gap-2 shrink-0">
              <span className="text-xs font-black text-amber-300 bg-indigo-900/80 px-2 py-0.5 rounded-md border border-indigo-700/60">
                {getDaysDiff(nextEvent.event_date) === 0
                  ? '¡HOY! 🎯'
                  : `Faltan ${getDaysDiff(nextEvent.event_date)} días`}
              </span>
            </div>
          </div>
        )}

        {/* Alerta de Semanas Críticas Compacta */}
        {criticalWeeksCount > 0 && (
          <div className="rounded-2xl border border-amber-300 bg-amber-50 px-3.5 py-2 text-amber-900 shadow-xs flex items-center gap-2.5 text-xs">
            <span className="flex h-6 w-6 items-center justify-center rounded-lg bg-amber-500 text-white font-bold text-xs shrink-0">
              ⚠️
            </span>
            <p className="text-[11px] text-amber-800">
              <span className="font-bold">¡Semana Crítica!</span> {criticalWeeksCount} semana(s) con 2+ evaluaciones solapadas.
            </p>
          </div>
        )}

        {/* ENCABEZADO DEL CALENDARIO VISUAL COMPACTO */}
        <div className="rounded-2xl border border-slate-200 bg-white shadow-sm overflow-hidden">
          {/* Barra Superior con Navegación de Mes */}
          <div className="bg-slate-900 px-4 py-2.5 flex items-center justify-between text-white">
            <div className="flex items-center gap-2">
              <span className="text-base">🗓️</span>
              <h2 className="text-sm font-bold tracking-tight">
                {MONTH_NAMES[currentMonth]} {currentYear}
              </h2>
            </div>

            <div className="flex items-center gap-1">
              <button
                onClick={handlePrevMonth}
                className="rounded-md border border-slate-700 bg-slate-800 px-2 py-0.5 text-[11px] font-semibold text-slate-200 hover:bg-slate-700 transition-colors"
              >
                ← Prev
              </button>
              <button
                onClick={handleToday}
                className="rounded-md bg-indigo-600 px-2.5 py-0.5 text-[11px] font-semibold text-white shadow-2xs hover:bg-indigo-500 transition-colors"
              >
                Hoy
              </button>
              <button
                onClick={handleNextMonth}
                className="rounded-md border border-slate-700 bg-slate-800 px-2 py-0.5 text-[11px] font-semibold text-slate-200 hover:bg-slate-700 transition-colors"
              >
                Sig →
              </button>
            </div>
          </div>

          {/* BARRA DE FILTROS SIMPLIFICADA (Examen y Post-it) */}
          <div className="px-3 py-1.5 bg-slate-800 border-t border-slate-700/80 flex items-center justify-between gap-2 overflow-x-auto">
            <span className="text-[10px] text-slate-400 font-medium shrink-0">
              Filtro:
            </span>
            <div className="flex items-center gap-1 shrink-0">
              {[
                { key: 'all', label: 'Todos' },
                { key: 'event', label: '🎯 Exámenes' },
                { key: 'note', label: '📌 Post-its' },
              ].map((f) => (
                <button
                  key={f.key}
                  onClick={() => setFilterType(f.key as any)}
                  className={`px-3 py-0.5 rounded-md text-[10px] font-bold transition-all ${
                    filterType === f.key
                      ? 'bg-amber-400 text-slate-950 shadow-2xs'
                      : 'bg-slate-700/70 text-slate-300 hover:bg-slate-700'
                  }`}
                >
                  {f.label}
                </button>
              ))}
            </div>
          </div>

          {/* Encabezado de Días de la Semana */}
          <div className="grid grid-cols-7 border-b border-slate-200 bg-amber-400 text-slate-950 text-center font-bold text-[11px] py-1.5">
            <div>Lu</div>
            <div>Ma</div>
            <div>Mi</div>
            <div>Ju</div>
            <div>Vi</div>
            <div className="bg-amber-300">Sá</div>
            <div className="bg-amber-300">Do</div>
          </div>

          {/* Malla Grilla del Calendario Mensual Compacta */}
          <div className="grid grid-cols-7 border-collapse bg-slate-100/40">
            {calendarDays.map((cell, idx) => {
              const isToday = cell.dateStr === todayStr
              const isSelected = cell.dateStr === selectedDateStr

              const dayEvents = events
                .filter((e) => e.event_date === cell.dateStr)
                .filter(() => filterType === 'all' || filterType === 'event')

              const dayNotes = notes
                .filter((n) => n.event_date === cell.dateStr)
                .filter(() => filterType === 'all' || filterType === 'note')

              const hasItems = dayEvents.length > 0 || dayNotes.length > 0

              return (
                <div
                  key={idx}
                  onClick={() => setSelectedDateStr(cell.dateStr)}
                  className={`min-h-[80px] sm:min-h-[92px] p-1 border-b border-r border-slate-200/80 transition-all flex flex-col justify-between cursor-pointer relative group ${
                    !cell.isCurrentMonth
                      ? 'bg-slate-100/50 text-slate-400'
                      : isToday
                      ? 'bg-indigo-50/60 text-slate-900 ring-2 ring-indigo-500 ring-inset'
                      : 'bg-white text-slate-800 hover:bg-slate-50/90'
                  } ${isSelected ? 'bg-amber-50/80 ring-2 ring-amber-400 ring-inset' : ''}`}
                >
                  {/* Encabezado de la celda: Número del día y Botones directos */}
                  <div className="flex items-center justify-between">
                    <span
                      className={`text-[11px] font-bold px-1 py-0.2 rounded ${
                        isToday
                          ? 'bg-indigo-600 text-white shadow-2xs'
                          : isSelected
                          ? 'bg-amber-500 text-white'
                          : cell.isCurrentMonth
                          ? 'text-slate-700 group-hover:text-indigo-600'
                          : 'text-slate-400'
                      }`}
                    >
                      {cell.dayNum}
                    </span>

                    {/* Botones de creación rápida directa sobre la celda */}
                    <div className="flex items-center gap-0.5">
                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation()
                          setSelectedDateStr(cell.dateStr)
                          setActiveTabForm('event')
                        }}
                        className="opacity-0 group-hover:opacity-100 transition-opacity bg-indigo-50 text-indigo-700 hover:bg-indigo-600 hover:text-white text-[8px] font-bold px-1 py-0.2 rounded"
                        title={`Agendar Examen para el ${cell.dateStr}`}
                      >
                        +🎯
                      </button>
                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation()
                          setSelectedDateStr(cell.dateStr)
                          setActiveTabForm('note')
                        }}
                        className="opacity-0 group-hover:opacity-100 transition-opacity bg-amber-100 text-amber-900 hover:bg-amber-400 text-[8px] font-bold px-1 py-0.2 rounded"
                        title={`Pegar Post-it para el ${cell.dateStr}`}
                      >
                        +📌
                      </button>
                      {hasItems && (
                        <span className="text-[9px] text-amber-600 font-bold ml-0.5">
                          {dayEvents.length > 0 ? '🎯' : '📌'}
                        </span>
                      )}
                    </div>
                  </div>

                  {/* Badges y Post-its en la celda */}
                  <div className="flex flex-col gap-0.5 my-0.5 overflow-y-auto max-h-[60px] scrollbar-none">
                    {dayEvents.map((evt) => (
                      <div
                        key={evt.id}
                        onClick={(e) => {
                          e.stopPropagation()
                          setExpandedRoadmapId(
                            expandedRoadmapId === evt.id ? null : evt.id
                          )
                        }}
                        className={`rounded px-1 py-0.2 text-[8px] font-bold border truncate shadow-2xs flex items-center justify-between transition-all ${
                          evt.event_type === 'parcial'
                            ? 'bg-rose-500 text-white border-rose-600 hover:bg-rose-600'
                            : evt.event_type === 'final'
                            ? 'bg-purple-600 text-white border-purple-700 hover:bg-purple-700'
                            : 'bg-sky-600 text-white border-sky-700 hover:bg-sky-700'
                        }`}
                        title={`${evt.title} (Clic para ver Plan IA)`}
                      >
                        <span className="truncate">
                          {evt.event_type === 'parcial'
                            ? '📝'
                            : evt.event_type === 'final'
                            ? '🎓'
                            : '📂'}{' '}
                          {evt.title}
                        </span>
                        <button
                          onClick={(e) => {
                            e.stopPropagation()
                            handleDeleteEvent(evt.id)
                          }}
                          className="ml-1 opacity-70 hover:opacity-100 text-white font-normal"
                        >
                          ✕
                        </button>
                      </div>
                    ))}

                    {dayNotes.map((note) => {
                      const noteStyle =
                        NOTE_COLOR_STYLES[note.color] || NOTE_COLOR_STYLES.yellow

                      return (
                        <div
                          key={note.id}
                          className={`rounded px-1 py-0.2 text-[8px] font-semibold border shadow-2xs transition-all ${noteStyle}`}
                          title={note.content || note.title}
                        >
                          <div className="flex items-center justify-between gap-0.5">
                            <span className="truncate font-bold">📌 {note.title}</span>
                            <button
                              onClick={(e) => {
                                e.stopPropagation()
                                handleDeleteNote(note.id)
                              }}
                              className="opacity-40 hover:opacity-100 text-slate-900 font-normal"
                            >
                              ✕
                            </button>
                          </div>
                        </div>
                      )
                    })}
                  </div>
                </div>
              )
            })}
          </div>
        </div>
      </div>

      {/* COLUMNA DERECHA: PANEL COMPACTO DE ACCIONES Y POST-ITS (4 columnas) */}
      <div className="lg:col-span-4 flex flex-col gap-4 sticky top-4">
        {/* 1. Panel de Formulario Rápido para la Fecha Seleccionada */}
        <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
          <div className="flex items-center justify-between border-b pb-2 mb-3">
            <div>
              <span className="text-[9px] font-bold uppercase tracking-wider text-indigo-600 block">
                Fecha Seleccionada
              </span>
              <h3 className="text-xs font-bold text-slate-900">
                {selectedDateStr === todayStr
                  ? '📅 Hoy (' + selectedDateStr + ')'
                  : '📅 ' + selectedDateStr}
              </h3>
            </div>

            {/* Toggle entre Agendar Examen o Pegar Post-it */}
            <div className="flex rounded-lg bg-slate-100 p-0.5 shrink-0">
              <button
                type="button"
                onClick={() => setActiveTabForm('event')}
                className={`rounded-md px-2 py-0.5 text-[10px] font-semibold transition-all ${
                  activeTabForm === 'event'
                    ? 'bg-white text-slate-900 shadow-2xs'
                    : 'text-slate-500 hover:text-slate-900'
                }`}
              >
                🎯 Examen
              </button>
              <button
                type="button"
                onClick={() => setActiveTabForm('note')}
                className={`rounded-md px-2 py-0.5 text-[10px] font-semibold transition-all ${
                  activeTabForm === 'note'
                    ? 'bg-amber-300 text-slate-950 shadow-2xs'
                    : 'text-slate-500 hover:text-slate-900'
                }`}
              >
                📌 Post-it
              </button>
            </div>
          </div>

          {/* Formulario de Examen */}
          {activeTabForm === 'event' && (
            <form onSubmit={handleCreateEvent} className="flex flex-col gap-2.5">
              <input type="hidden" name="event_date" value={selectedDateStr} />
              <input type="hidden" name="event_type" value={eventType} />

              <div>
                <label className="block text-[10px] font-semibold text-slate-700 mb-1">
                  Tipo de Evaluación
                </label>
                <div className="grid grid-cols-3 gap-1">
                  {[
                    { value: 'parcial', label: '📝 Parcial', style: 'bg-rose-50 border-rose-300 text-rose-800' },
                    { value: 'entrega_tp', label: '📂 TP', style: 'bg-sky-50 border-sky-300 text-sky-800' },
                    { value: 'final', label: '🎓 Final', style: 'bg-purple-50 border-purple-300 text-purple-800' },
                  ].map((opt) => (
                    <button
                      key={opt.value}
                      type="button"
                      onClick={() => setEventType(opt.value as any)}
                      className={`px-1.5 py-1.5 rounded-lg border text-[10px] font-bold text-center transition-all ${
                        eventType === opt.value
                          ? `${opt.style} ring-2 ring-indigo-600 shadow-2xs`
                          : 'bg-slate-50 border-slate-200 text-slate-600 hover:bg-slate-100'
                      }`}
                    >
                      {opt.label}
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <label className="block text-[10px] font-semibold text-slate-700 mb-0.5">
                  Nombre / Título
                </label>
                <input
                  type="text"
                  name="title"
                  placeholder="Ej: 1er Parcial Práctico"
                  required
                  className="w-full rounded-lg border border-slate-200 px-2.5 py-1 text-xs bg-slate-50 focus:bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500/20"
                />
              </div>

              <button
                type="submit"
                disabled={loadingEvent}
                className="mt-0.5 w-full rounded-lg bg-indigo-600 px-3 py-2 text-xs font-semibold text-white shadow-2xs hover:bg-indigo-700 transition-all disabled:opacity-50"
              >
                {loadingEvent
                  ? 'Agendando...'
                  : `🎯 Agendar Examen para ${selectedDateStr}`}
              </button>
            </form>
          )}

          {/* Formulario de Post-it */}
          {activeTabForm === 'note' && (
            <form onSubmit={handleCreateNote} className="flex flex-col gap-2.5">
              <input type="hidden" name="event_date" value={selectedDateStr} />

              <div>
                <label className="block text-[10px] font-semibold text-slate-700 mb-0.5">
                  Título del Post-it
                </label>
                <input
                  type="text"
                  name="title"
                  placeholder="Ej: Borrador de entrega..."
                  required
                  className="w-full rounded-lg border border-slate-200 px-2.5 py-1 text-xs bg-slate-50 focus:bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500/20"
                />
              </div>

              <div>
                <label className="block text-[10px] font-semibold text-slate-700 mb-0.5">
                  Detalle / Recordatorio
                </label>
                <input
                  type="text"
                  name="content"
                  placeholder="Ej: Revisar ejercicios pendientes"
                  className="w-full rounded-lg border border-slate-200 px-2.5 py-1 text-xs bg-slate-50 focus:bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500/20"
                />
              </div>

              {/* Color del Post-it */}
              <div className="flex items-center justify-between py-0.5">
                <span className="text-[10px] font-semibold text-slate-700">Color:</span>
                <div className="flex items-center gap-1">
                  {(['yellow', 'blue', 'green', 'pink', 'purple'] as const).map(
                    (color) => (
                      <button
                        key={color}
                        type="button"
                        onClick={() => setSelectedColor(color)}
                        className={`h-5 w-5 rounded-full border transition-all ${
                          color === 'yellow'
                            ? 'bg-amber-300 border-amber-400'
                            : color === 'blue'
                            ? 'bg-sky-300 border-sky-400'
                            : color === 'green'
                            ? 'bg-emerald-300 border-emerald-400'
                            : color === 'pink'
                            ? 'bg-rose-300 border-rose-400'
                            : 'bg-purple-300 border-purple-400'
                        } ${
                          selectedColor === color
                            ? 'scale-110 ring-2 ring-slate-900'
                            : 'hover:scale-105'
                        }`}
                      />
                    )
                  )}
                </div>
              </div>

              <button
                type="submit"
                disabled={loadingNote}
                className="mt-0.5 w-full rounded-lg bg-slate-900 px-3 py-2 text-xs font-semibold text-white shadow-2xs hover:bg-slate-800 transition-all disabled:opacity-50"
              >
                {loadingNote
                  ? 'Pegando...'
                  : `📌 Pegar Post-it en ${selectedDateStr}`}
              </button>
            </form>
          )}
        </div>

        {/* 2. Hojas de Ruta IA (Roadmaps) en el Panel Lateral */}
        {events.some((e) => e.study_roadmap && e.study_roadmap.length > 0) && (
          <div className="rounded-2xl border border-indigo-200 bg-indigo-50/60 p-4 shadow-2xs">
            <h3 className="text-xs font-bold text-indigo-900 flex items-center gap-1.5 mb-2">
              <span>🧠</span> Hojas de Ruta de Repaso IA
            </h3>

            <div className="flex flex-col gap-2.5 max-h-[240px] overflow-y-auto pr-1">
              {events
                .filter((e) => e.study_roadmap && e.study_roadmap.length > 0)
                .map((evt) => (
                  <div
                    key={evt.id}
                    className="rounded-xl border border-indigo-200 bg-white p-2.5 shadow-2xs"
                  >
                    <div className="flex items-center justify-between mb-1">
                      <span className="text-[11px] font-bold text-slate-900 truncate">
                        {evt.title} ({evt.event_date})
                      </span>
                      <span className="text-[8px] font-semibold text-indigo-600 bg-indigo-50 border border-indigo-100 px-1.5 py-0.2 rounded shrink-0">
                        {evt.event_type.toUpperCase()}
                      </span>
                    </div>

                    <ul className="flex flex-col gap-1 border-t border-slate-100 pt-1.5">
                      {evt.study_roadmap?.map((step, idx) => (
                        <li key={idx} className="text-[10px] text-slate-800 flex items-start gap-1.5">
                          <span className="bg-indigo-600 text-white font-bold text-[8px] px-1 py-0.2 rounded shrink-0 mt-0.5">
                            {step.date_label || `Día -${step.day_offset}`}
                          </span>
                          <div>
                            <span className="font-semibold text-slate-900">
                              {step.topic}:{' '}
                            </span>
                            <span className="text-slate-600">{step.activity}</span>
                          </div>
                        </li>
                      ))}
                    </ul>
                  </div>
                ))}
            </div>
          </div>
        )}

        {/* 3. Panel de Todas las Notas Post-it */}
        <div className="rounded-2xl border border-slate-200 bg-amber-50/50 p-4 shadow-sm flex flex-col gap-2.5">
          <div className="flex items-center gap-1.5">
            <span className="text-sm">📌</span>
            <h3 className="text-xs font-bold text-slate-900">Todas las Notas Post-it</h3>
          </div>

          <div className="flex flex-col gap-2 max-h-[300px] overflow-y-auto pr-1">
            {notes.map((note) => {
              const noteStyle =
                NOTE_COLOR_STYLES[note.color] || NOTE_COLOR_STYLES.yellow

              return (
                <div
                  key={note.id}
                  className={`rounded-xl border p-2.5 shadow-2xs transition-all flex flex-col justify-between relative ${noteStyle}`}
                >
                  <div>
                    <div className="flex items-start justify-between gap-1">
                      <h4 className="font-bold text-[11px]">{note.title}</h4>
                      <button
                        onClick={() => handleDeleteNote(note.id)}
                        className="text-[9px] opacity-40 hover:opacity-100 p-0.5"
                      >
                        ✕
                      </button>
                    </div>
                    {note.content && (
                      <p className="mt-0.5 text-[10px] opacity-90 leading-relaxed whitespace-pre-wrap">
                        {note.content}
                      </p>
                    )}
                  </div>

                  <div className="mt-1.5 pt-1 border-t border-black/10 flex items-center justify-between text-[8px] opacity-75 font-medium">
                    <span>📌 Post-it</span>
                    {note.event_date ? (
                      <span>📅 {note.event_date}</span>
                    ) : (
                      <span>General</span>
                    )}
                  </div>
                </div>
              )
            })}

            {notes.length === 0 && (
              <div className="rounded-xl border border-dashed border-amber-300 bg-white/60 p-4 text-center">
                <p className="text-[11px] text-amber-900 font-medium">No tenés notas pegadas.</p>
                <p className="mt-0.5 text-[9px] text-amber-800/80">
                  Hacé clic en cualquier día para pegar una nota Post-it.
                </p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
