'use client'

import { useState } from 'react'
import {
  createAcademicEventAction,
  deleteAcademicEventAction,
  createStickyNoteAction,
  deleteStickyNoteAction,
} from './actions'
import {
  IconCalendar,
  IconSparkles,
  IconTrash,
  IconDocument,
  IconBook,
} from '@/components/icons'

interface RoadmapStep {
  day_offset: number
  date_label: string
  topic: string
  activity: string
}

export interface AcademicEvent {
  id: string
  subject_id?: string
  subject_name?: string
  subject_color?: string
  event_type: 'parcial' | 'entrega_tp' | 'final'
  title: string
  event_date: string
  study_roadmap?: RoadmapStep[] | null
}

export interface StickyNote {
  id: string
  subject_id?: string
  subject_name?: string
  title: string
  content: string
  color: 'yellow' | 'blue' | 'green' | 'pink' | 'purple'
  event_date?: string | null
  created_at?: string
}

export interface SubjectOption {
  id: string
  name: string
  color?: string
}

interface CalendarViewProps {
  subjectId?: string
  currentSubjectName?: string
  allSubjects?: SubjectOption[]
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
  yellow: 'bg-amber-100 border-amber-300 text-amber-950 shadow-2xs',
  blue: 'bg-sky-100 border-sky-300 text-sky-950 shadow-2xs',
  green: 'bg-emerald-100 border-emerald-300 text-emerald-950 shadow-2xs',
  pink: 'bg-rose-100 border-rose-300 text-rose-950 shadow-2xs',
  purple: 'bg-purple-100 border-purple-300 text-purple-950 shadow-2xs',
}

export default function CalendarView({
  subjectId,
  currentSubjectName,
  allSubjects = [],
  events,
  notes,
  criticalWeeksCount,
}: CalendarViewProps) {
  const today = new Date()
  const [currentYear, setCurrentYear] = useState(today.getFullYear())
  const [currentMonth, setCurrentMonth] = useState(today.getMonth())

  // Modo de alcance: 'current' (esta materia) o 'all' (todas las materias)
  const [scopeMode, setScopeMode] = useState<'current' | 'all'>(
    subjectId ? 'all' : 'all'
  )

  // Filtro de visualización: 'all' | 'event' | 'note'
  const [filterType, setFilterType] = useState<'all' | 'event' | 'note'>('all')

  // Estado para creación de evaluación
  const [eventType, setEventType] = useState<'parcial' | 'entrega_tp' | 'final'>('parcial')
  const [selectedSubjectId, setSelectedSubjectId] = useState<string>(
    subjectId || allSubjects[0]?.id || ''
  )

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

  // Filtrar eventos y notas según el alcance seleccionado
  const filteredEvents =
    scopeMode === 'current' && subjectId
      ? events.filter((e) => e.subject_id === subjectId)
      : events

  const filteredNotes =
    scopeMode === 'current' && subjectId
      ? notes.filter((n) => n.subject_id === subjectId)
      : notes

  // Próximos eventos para la cuenta regresiva
  const upcomingEvents = filteredEvents
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

  // Generación de celdas del calendario
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
    const targetSubject = (formData.get('subject_id') as string) || subjectId || selectedSubjectId
    try {
      await createAcademicEventAction(targetSubject, formData)
      window.location.reload()
    } catch (err) {
      alert(err instanceof Error ? err.message : 'Error al agendar evento.')
      setLoadingEvent(false)
    }
  }

  const handleDeleteEvent = async (targetSubId: string | undefined, eventId: string) => {
    if (!confirm('¿Eliminar esta evaluación del calendario?')) return
    try {
      await deleteAcademicEventAction(targetSubId || subjectId || '', eventId)
      window.location.reload()
    } catch (err) {
      alert(err instanceof Error ? err.message : 'Error al eliminar evento.')
    }
  }

  const handleCreateNote = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    setLoadingNote(true)
    const formData = new FormData(e.currentTarget)
    const targetSubject = (formData.get('subject_id') as string) || subjectId || selectedSubjectId
    try {
      await createStickyNoteAction(targetSubject, formData)
      window.location.reload()
    } catch (err) {
      alert(err instanceof Error ? err.message : 'Error al crear nota.')
      setLoadingNote(false)
    }
  }

  const handleDeleteNote = async (targetSubId: string | undefined, noteId: string) => {
    try {
      await deleteStickyNoteAction(targetSubId || subjectId || '', noteId)
      window.location.reload()
    } catch (err) {
      alert(err instanceof Error ? err.message : 'Error al eliminar nota.')
    }
  }

  return (
    <div className="flex flex-col gap-6">
      {/* Banner Superior: Selector Multi-Materia y Alerta de Semanas Críticas */}
      <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4 bg-white border border-slate-200/80 rounded-2xl p-4 shadow-xs">
        {/* Selector de Alcance (Esta Materia vs Todas las Materias) */}
        <div className="flex items-center gap-2 flex-wrap">
          <span className="text-xs font-bold text-slate-700 uppercase tracking-wider">
            Vista de Exámenes:
          </span>
          <div className="inline-flex rounded-xl bg-slate-100 p-1 border border-slate-200 text-xs font-bold">
            {subjectId && currentSubjectName && (
              <button
                type="button"
                onClick={() => setScopeMode('current')}
                className={`px-3 py-1.5 rounded-lg transition-all cursor-pointer ${
                  scopeMode === 'current'
                    ? 'bg-white text-indigo-700 shadow-2xs'
                    : 'text-slate-500 hover:text-slate-800'
                }`}
              >
                🔘 Solo {currentSubjectName}
              </button>
            )}
            <button
              type="button"
              onClick={() => setScopeMode('all')}
              className={`px-3 py-1.5 rounded-lg transition-all cursor-pointer ${
                scopeMode === 'all'
                  ? 'bg-white text-indigo-700 shadow-2xs'
                  : 'text-slate-500 hover:text-slate-800'
              }`}
            >
              🌐 Todas mis Materias ({events.length} eventos)
            </button>
          </div>
        </div>

        {/* Alerta de Semanas Críticas */}
        {criticalWeeksCount > 0 && (
          <div className="flex items-center gap-2 bg-amber-50 border border-amber-200 text-amber-900 px-3.5 py-1.5 rounded-xl text-xs font-bold animate-in fade-in">
            <span>⚠️</span>
            <span>
              {criticalWeeksCount} {criticalWeeksCount === 1 ? 'semana crítica' : 'semanas críticas'}{' '}
              con 2+ exámenes solapados
            </span>
          </div>
        )}
      </div>

      {/* Tarjeta de Cuenta Regresiva al Próximo Examen */}
      {nextEvent && (
        <div className="rounded-2xl border border-indigo-100 bg-gradient-to-r from-indigo-500 to-indigo-700 p-5 text-white shadow-sm flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
          <div className="flex items-center gap-3.5">
            <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-white/20 text-white font-bold backdrop-blur-xs text-xl shrink-0">
              <IconCalendar className="w-6 h-6" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="text-[10px] font-bold uppercase tracking-wider bg-white/25 px-2 py-0.5 rounded-full">
                  Próxima Evaluación
                </span>
                {nextEvent.subject_name && (
                  <span className="text-[10px] font-bold bg-amber-400 text-amber-950 px-2 py-0.5 rounded-full">
                    {nextEvent.subject_name}
                  </span>
                )}
              </div>
              <h2 className="text-base sm:text-lg font-bold mt-1 leading-tight">
                {nextEvent.title} ({nextEvent.event_type.toUpperCase().replace('_', ' ')})
              </h2>
              <p className="text-xs text-indigo-100 mt-0.5">
                Fecha agendada: {nextEvent.event_date}
              </p>
            </div>
          </div>

          <div className="bg-white/15 px-4 py-2 rounded-xl text-right shrink-0 backdrop-blur-xs">
            <span className="text-2xl font-black block leading-none">
              {getDaysDiff(nextEvent.event_date)}
            </span>
            <span className="text-[10px] font-bold uppercase tracking-wider text-indigo-100">
              Días restantes
            </span>
          </div>
        </div>
      )}

      {/* Grid Principal: Calendario (Izquierda 8 Cols) y Panel de Agendado/Notas (Derecha 4 Cols) */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Panel del Calendario Unificado */}
        <div className="lg:col-span-8">
          <div className="rounded-2xl border border-slate-200/80 bg-white shadow-xs overflow-hidden">
            {/* Header del Mes Integrado */}
            <div className="flex items-center justify-between px-5 py-3.5 border-b border-slate-100 bg-white">
              <div className="flex items-center gap-2.5">
                <h2 className="text-base font-bold text-slate-800 tracking-tight">
                  {MONTH_NAMES[currentMonth]} {currentYear}
                </h2>
                <button
                  type="button"
                  onClick={handleToday}
                  className="text-[11px] font-bold text-indigo-600 bg-indigo-50 hover:bg-indigo-100 px-2.5 py-1 rounded-lg border border-indigo-200/60 transition-colors cursor-pointer"
                >
                  Hoy
                </button>
              </div>

              <div className="flex items-center gap-1">
                <button
                  type="button"
                  onClick={handlePrevMonth}
                  className="h-8 w-8 flex items-center justify-center rounded-lg border border-slate-200 bg-slate-50 hover:bg-slate-100 text-slate-700 font-bold transition-colors cursor-pointer text-sm"
                  title="Mes anterior"
                >
                  ‹
                </button>
                <button
                  type="button"
                  onClick={handleNextMonth}
                  className="h-8 w-8 flex items-center justify-center rounded-lg border border-slate-200 bg-slate-50 hover:bg-slate-100 text-slate-700 font-bold transition-colors cursor-pointer text-sm"
                  title="Mes siguiente"
                >
                  ›
                </button>
              </div>
            </div>

            {/* Fila de Días de la Semana */}
            <div className="grid grid-cols-7 border-b border-slate-100 bg-slate-50/80 text-center text-[11px] font-bold text-slate-500 py-2">
              <span>Lun</span>
              <span>Mar</span>
              <span>Mié</span>
              <span>Jue</span>
              <span>Vie</span>
              <span>Sáb</span>
              <span>Dom</span>
            </div>

            <div className="grid grid-cols-7 auto-rows-fr divide-x divide-y divide-slate-100 text-xs">
              {calendarDays.map((cell, idx) => {
                const dayEvents = filteredEvents.filter((e) => e.event_date === cell.dateStr)
                const dayNotes = filteredNotes.filter((n) => n.event_date === cell.dateStr)
                const isSelected = selectedDateStr === cell.dateStr
                const isToday = todayStr === cell.dateStr

                return (
                  <div
                    key={idx}
                    onClick={() => setSelectedDateStr(cell.dateStr)}
                    className={`min-h-[100px] p-2 flex flex-col gap-1 transition-all cursor-pointer select-none ${
                      cell.isCurrentMonth ? 'bg-white' : 'bg-slate-50/50 text-slate-400'
                    } ${isSelected ? 'ring-2 ring-indigo-500 ring-inset bg-indigo-50/30' : 'hover:bg-slate-50/80'}`}
                  >
                    <div className="flex items-center justify-between">
                      <span
                        className={`text-[11px] font-bold h-5 w-5 flex items-center justify-center rounded-full ${
                          isToday
                            ? 'bg-indigo-600 text-white'
                            : isSelected
                            ? 'text-indigo-600 font-black'
                            : 'text-slate-700'
                        }`}
                      >
                        {cell.dayNum}
                      </span>

                      {dayEvents.length > 1 && (
                        <span
                          className="h-2 w-2 rounded-full bg-amber-500"
                          title="Semana / Día con múltiples eventos"
                        />
                      )}
                    </div>

                    {/* Pastillas de Eventos */}
                    <div className="flex flex-col gap-1 mt-1 overflow-hidden">
                      {dayEvents.map((evt) => (
                        <div
                          key={evt.id}
                          className="rounded-md bg-indigo-600 text-white px-1.5 py-0.5 text-[10px] font-bold truncate flex items-center justify-between gap-1 shadow-2xs"
                          title={`${evt.subject_name ? `[${evt.subject_name}] ` : ''}${evt.title}`}
                        >
                          <span className="truncate">
                            {evt.subject_name && (
                              <span className="text-indigo-200 mr-1 font-normal">
                                [{evt.subject_name}]
                              </span>
                            )}
                            {evt.title}
                          </span>
                        </div>
                      ))}

                      {/* Pastillas de Notas */}
                      {dayNotes.map((note) => (
                        <div
                          key={note.id}
                          className={`rounded-md px-1.5 py-0.5 text-[10px] font-semibold truncate border ${NOTE_COLOR_STYLES[note.color]}`}
                          title={note.title}
                        >
                          📌 {note.title}
                        </div>
                      ))}
                    </div>
                  </div>
                )
              })}
            </div>
          </div>
        </div>

        {/* Panel Lateral: Formulario de Agendado y Lista de Evaluaciones */}
        <div className="lg:col-span-4 flex flex-col gap-4">
          {/* Tarjeta de Creación de Evento / Nota */}
          <div className="rounded-2xl border border-slate-200/80 bg-white p-5 shadow-xs flex flex-col gap-3.5">
            {/* Selector de Pestañas del Formulario */}
            <div className="flex items-center justify-between border-b border-slate-100 pb-2.5">
              <span className="text-xs font-bold text-slate-800">
                Fecha seleccionada: {selectedDateStr}
              </span>
              <div className="flex rounded-lg bg-slate-100 p-0.5 text-[11px] font-bold">
                <button
                  type="button"
                  onClick={() => setActiveTabForm('event')}
                  className={`px-2.5 py-1 rounded-md transition-all cursor-pointer ${
                    activeTabForm === 'event'
                      ? 'bg-white text-indigo-700 shadow-2xs'
                      : 'text-slate-500'
                  }`}
                >
                  Examen
                </button>
                <button
                  type="button"
                  onClick={() => setActiveTabForm('note')}
                  className={`px-2.5 py-1 rounded-md transition-all cursor-pointer ${
                    activeTabForm === 'note'
                      ? 'bg-white text-indigo-700 shadow-2xs'
                      : 'text-slate-500'
                  }`}
                >
                  Post-it
                </button>
              </div>
            </div>

            {/* Formulario de Evaluación con IA Roadmap */}
            {activeTabForm === 'event' ? (
              <form onSubmit={handleCreateEvent} className="flex flex-col gap-3">
                {/* Selector de Materia si hay varias */}
                {allSubjects.length > 0 && (
                  <div>
                    <label className="text-[11px] font-bold text-slate-600 block mb-1">
                      Materia:
                    </label>
                    <select
                      name="subject_id"
                      value={selectedSubjectId}
                      onChange={(e) => setSelectedSubjectId(e.target.value)}
                      className="w-full rounded-xl border border-slate-200 px-3 py-2 text-xs bg-slate-50 font-semibold text-slate-800 focus:outline-none focus:ring-2 focus:ring-indigo-500/20"
                    >
                      {allSubjects.map((s) => (
                        <option key={s.id} value={s.id}>
                          {s.name}
                        </option>
                      ))}
                    </select>
                  </div>
                )}

                <div>
                  <label className="text-[11px] font-bold text-slate-600 block mb-1">
                    Título de la Evaluación:
                  </label>
                  <input
                    type="text"
                    name="title"
                    required
                    placeholder="Ej: Primer Parcial Teórico"
                    className="w-full rounded-xl border border-slate-200 px-3 py-2 text-xs bg-slate-50 font-medium text-slate-800 focus:outline-none focus:ring-2 focus:ring-indigo-500/20"
                  />
                </div>

                <div className="grid grid-cols-2 gap-2">
                  <div>
                    <label className="text-[11px] font-bold text-slate-600 block mb-1">
                      Tipo:
                    </label>
                    <select
                      name="event_type"
                      value={eventType}
                      onChange={(e) =>
                        setEventType(
                          e.target.value as 'parcial' | 'entrega_tp' | 'final'
                        )
                      }
                      className="w-full rounded-xl border border-slate-200 px-2.5 py-2 text-xs bg-slate-50 font-medium text-slate-800 focus:outline-none"
                    >
                      <option value="parcial">Parcial</option>
                      <option value="entrega_tp">Entrega TP</option>
                      <option value="final">Examen Final</option>
                    </select>
                  </div>

                  <div>
                    <label className="text-[11px] font-bold text-slate-600 block mb-1">
                      Fecha:
                    </label>
                    <input
                      type="date"
                      name="event_date"
                      required
                      defaultValue={selectedDateStr}
                      key={selectedDateStr}
                      className="w-full rounded-xl border border-slate-200 px-2.5 py-1.5 text-xs bg-slate-50 font-medium text-slate-800 focus:outline-none"
                    />
                  </div>
                </div>

                <button
                  type="submit"
                  disabled={loadingEvent}
                  className="rounded-xl bg-indigo-600 px-4 py-2.5 text-xs font-bold text-white shadow-xs hover:bg-indigo-700 transition-all flex items-center justify-center gap-1.5 disabled:opacity-50 cursor-pointer"
                >
                  <IconSparkles className="w-3.5 h-3.5" />
                  {loadingEvent ? 'Generando Roadmap IA...' : 'Agendar con Roadmap IA'}
                </button>
              </form>
            ) : (
              /* Formulario de Nota Adhesiva Post-it */
              <form onSubmit={handleCreateNote} className="flex flex-col gap-3">
                {allSubjects.length > 0 && (
                  <div>
                    <label className="text-[11px] font-bold text-slate-600 block mb-1">
                      Materia:
                    </label>
                    <select
                      name="subject_id"
                      value={selectedSubjectId}
                      onChange={(e) => setSelectedSubjectId(e.target.value)}
                      className="w-full rounded-xl border border-slate-200 px-3 py-2 text-xs bg-slate-50 font-semibold text-slate-800 focus:outline-none"
                    >
                      {allSubjects.map((s) => (
                        <option key={s.id} value={s.id}>
                          {s.name}
                        </option>
                      ))}
                    </select>
                  </div>
                )}

                <div>
                  <label className="text-[11px] font-bold text-slate-600 block mb-1">
                    Título del Post-it:
                  </label>
                  <input
                    type="text"
                    name="title"
                    required
                    placeholder="Ej: Repasar Unidad 2..."
                    className="w-full rounded-xl border border-slate-200 px-3 py-2 text-xs bg-slate-50 font-medium text-slate-800 focus:outline-none"
                  />
                </div>

                <div>
                  <label className="text-[11px] font-bold text-slate-600 block mb-1">
                    Contenido / Recordatorio:
                  </label>
                  <textarea
                    name="content"
                    rows={2}
                    placeholder="Detalles o puntos clave a recordar..."
                    className="w-full rounded-xl border border-slate-200 px-3 py-2 text-xs bg-slate-50 font-medium text-slate-800 focus:outline-none"
                  />
                </div>

                <input type="hidden" name="event_date" value={selectedDateStr} />
                <input type="hidden" name="color" value={selectedColor} />

                {/* Selector de Color del Post-it */}
                <div className="flex items-center gap-2">
                  <span className="text-[11px] font-bold text-slate-600">Color:</span>
                  {(['yellow', 'blue', 'green', 'pink', 'purple'] as const).map((c) => (
                    <button
                      key={c}
                      type="button"
                      onClick={() => setSelectedColor(c)}
                      className={`h-5 w-5 rounded-full border-2 transition-transform cursor-pointer ${
                        c === 'yellow'
                          ? 'bg-amber-300'
                          : c === 'blue'
                          ? 'bg-sky-300'
                          : c === 'green'
                          ? 'bg-emerald-300'
                          : c === 'pink'
                          ? 'bg-rose-300'
                          : 'bg-purple-300'
                      } ${selectedColor === c ? 'scale-125 border-slate-800' : 'border-white'}`}
                    />
                  ))}
                </div>

                <button
                  type="submit"
                  disabled={loadingNote}
                  className="rounded-xl bg-slate-900 px-4 py-2.5 text-xs font-bold text-white shadow-xs hover:bg-slate-800 transition-all flex items-center justify-center gap-1.5 disabled:opacity-50 cursor-pointer"
                >
                  {loadingNote ? 'Guardando...' : 'Pegar Post-it en Calendario'}
                </button>
              </form>
            )}
          </div>

          {/* Lista de Evaluaciones Agendadas */}
          <div className="rounded-2xl border border-slate-200/80 bg-white p-5 shadow-xs flex flex-col gap-3">
            <h3 className="text-xs font-bold text-slate-800 uppercase tracking-wider flex items-center justify-between">
              <span>Evaluaciones ({filteredEvents.length})</span>
              <span className="text-[10px] text-slate-400 font-semibold">
                {scopeMode === 'all' ? 'Todas las materias' : currentSubjectName}
              </span>
            </h3>

            <div className="flex flex-col gap-2.5 max-h-80 overflow-y-auto pr-1">
              {filteredEvents.map((evt) => (
                <div
                  key={evt.id}
                  className="rounded-xl border border-slate-200/80 p-3 flex flex-col gap-2 bg-slate-50/50 hover:bg-white transition-all shadow-2xs"
                >
                  <div className="flex items-start justify-between gap-2">
                    <div>
                      {evt.subject_name && (
                        <span className="text-[10px] font-bold bg-indigo-100 text-indigo-800 px-2 py-0.5 rounded-md inline-block mb-1">
                          {evt.subject_name}
                        </span>
                      )}
                      <h4 className="text-xs font-bold text-slate-900 leading-tight">
                        {evt.title}
                      </h4>
                      <span className="text-[11px] text-slate-500 font-semibold block mt-0.5">
                        📅 {evt.event_date} • {evt.event_type.toUpperCase().replace('_', ' ')}
                      </span>
                    </div>

                    <button
                      type="button"
                      onClick={() => handleDeleteEvent(evt.subject_id, evt.id)}
                      className="text-slate-400 hover:text-rose-600 p-1 rounded-md hover:bg-rose-50 transition-colors"
                      title="Eliminar evento"
                    >
                      <IconTrash className="w-3.5 h-3.5" />
                    </button>
                  </div>

                  {/* Botón para desplegar Roadmap IA */}
                  {evt.study_roadmap && evt.study_roadmap.length > 0 && (
                    <div>
                      <button
                        type="button"
                        onClick={() =>
                          setExpandedRoadmapId(
                            expandedRoadmapId === evt.id ? null : evt.id
                          )
                        }
                        className="text-[11px] font-bold text-indigo-600 hover:text-indigo-800 flex items-center gap-1 hover:underline cursor-pointer"
                      >
                        <IconSparkles className="w-3 h-3" />
                        {expandedRoadmapId === evt.id
                          ? 'Ocultar Roadmap de Estudio'
                          : 'Ver Roadmap de Estudio IA'}
                      </button>

                      {expandedRoadmapId === evt.id && (
                        <div className="mt-2 rounded-xl bg-indigo-50/80 p-3 border border-indigo-100 flex flex-col gap-2 animate-in fade-in">
                          <span className="text-[10px] font-bold text-indigo-900 uppercase tracking-wider">
                            Hoja de Ruta Sugerida:
                          </span>
                          <ul className="flex flex-col gap-1.5 text-xs text-slate-700">
                            {evt.study_roadmap.map((step, sIdx) => (
                              <li
                                key={sIdx}
                                className="flex items-start gap-1.5 bg-white p-2 rounded-lg border border-indigo-100/80"
                              >
                                <span className="font-bold text-indigo-700 shrink-0 text-[11px]">
                                  {step.date_label || `Día -${step.day_offset}`}:
                                </span>
                                <div>
                                  <span className="font-semibold text-slate-900 block leading-tight">
                                    {step.topic}
                                  </span>
                                  <span className="text-[11px] text-slate-600 block mt-0.5">
                                    {step.activity}
                                  </span>
                                </div>
                              </li>
                            ))}
                          </ul>
                        </div>
                      )}
                    </div>
                  )}
                </div>
              ))}

              {filteredEvents.length === 0 && (
                <p className="text-xs text-slate-400 italic py-4 text-center">
                  No hay evaluaciones agendadas.
                </p>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
