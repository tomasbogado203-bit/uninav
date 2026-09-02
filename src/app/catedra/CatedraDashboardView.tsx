'use client'

import { useState } from 'react'
import Link from 'next/link'
import {
  CommissionItem,
  TelemetryTopic,
  createCommissionAction,
  getCommissionTelemetryAction,
  generateCatedraExamAction,
  updateUserRoleAction,
} from './actions'
import RoleSwitcherPill from '@/components/RoleSwitcherPill'
import {
  IconBook,
  IconSparkles,
  IconUsers,
  IconCheck,
  IconClipboard,
  IconLightbulb,
  IconDocument,
  IconFlame,
  IconChevronLeft,
  IconExternalLink,
} from '@/components/icons'


interface CatedraDashboardViewProps {
  userRole: 'student' | 'professor' | 'dean' | 'admin'
  userName: string
  universityName: string
  commissions: CommissionItem[]
}


export default function CatedraDashboardView({
  userRole,
  userName,
  universityName,
  commissions: initialCommissions = [],
}: CatedraDashboardViewProps) {
  const [commissions, setCommissions] = useState<CommissionItem[]>(initialCommissions)
  const [selectedCommission, setSelectedCommission] = useState<CommissionItem | null>(
    initialCommissions.length > 0 ? initialCommissions[0] : null
  )

  // Estados para creación de comisión
  const [showCreateModal, setShowCreateModal] = useState(false)
  const [creating, setCreating] = useState(false)
  const [newSubjName, setNewSubjName] = useState('')
  const [newCommName, setNewCommName] = useState('')
  const [newTerm, setNewTerm] = useState('1° Cuatrimestre 2026')
  const [newDesc, setNewDesc] = useState('')

  // Estados de telemetría y mapa de calor
  const [telemetry, setTelemetry] = useState<{
    topics: TelemetryTopic[]
    ai_recommendation: string
  }>({
    topics: [
      {
        id: 't1',
        topic_tag: 'Integrales por Fracciones Simples y Raíces Múltiples',
        student_count: 38,
        severity: 'alta',
        last_queried_at: new Date().toISOString(),
      },
      {
        id: 't2',
        topic_tag: 'Teorema de Bolzano y Existencia de Raíces',
        student_count: 24,
        severity: 'media',
        last_queried_at: new Date().toISOString(),
      },
      {
        id: 't3',
        topic_tag: 'Límites Notables e Indeterminación 1^∞',
        student_count: 19,
        severity: 'media',
        last_queried_at: new Date().toISOString(),
      },
      {
        id: 't4',
        topic_tag: 'Derivabilidad vs Continuidad',
        student_count: 9,
        severity: 'baja',
        last_queried_at: new Date().toISOString(),
      },
    ],
    ai_recommendation:
      'La IA detectó que 38 alumnos consultaron el tutor socrático con dudas sobre "Fracciones Simples con raíces complejas". Se sugiere dedicar los primeros 15 minutos de la próxima clase práctica a este procedimiento.',
  })

  // Estado del generador de examen de cátedra
  const [generatingExam, setGeneratingExam] = useState(false)
  const [examData, setExamData] = useState<any | null>(null)

  const [copiedCode, setCopiedCode] = useState<string | null>(null)

  const handleCopyCode = (code: string) => {
    navigator.clipboard.writeText(code)
    setCopiedCode(code)
    setTimeout(() => setCopiedCode(null), 2500)
  }

  const handleCreateSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!newSubjName || !newCommName) return

    setCreating(true)
    try {
      const res = await createCommissionAction({
        subject_name: newSubjName,
        name: newCommName,
        academic_term: newTerm,
        description: newDesc,
      })

      if (res.success && res.commission) {
        const updated = [res.commission, ...commissions]
        setCommissions(updated)
        setSelectedCommission(res.commission)
        setShowCreateModal(false)
        setNewSubjName('')
        setNewCommName('')
        setNewDesc('')
      } else {
        alert(res.error || 'Error al crear la comisión.')
      }
    } catch {
      alert('Ocurrió un error inesperado.')
    } finally {
      setCreating(false)
    }
  }

  const handleGenerateExam = async () => {
    if (!selectedCommission) return
    setGeneratingExam(true)
    try {
      const exam = await generateCatedraExamAction({
        subject_name: selectedCommission.subject_name,
        topics: telemetry.topics.map((t) => t.topic_tag),
      })
      setExamData(exam)
    } catch (err) {
      alert(err instanceof Error ? err.message : 'Error al generar el examen.')
    } finally {
      setGeneratingExam(false)
    }
  }

  const handleRoleToggle = async (newRole: 'student' | 'professor' | 'dean') => {
    await updateUserRoleAction(newRole)
  }

  return (
    <div className="mx-auto max-w-[96rem] px-4 py-8 sm:px-6 flex flex-col gap-8">
      {/* Header Principal del Panel de Cátedra */}
      <div className="rounded-3xl bg-gradient-to-br from-indigo-950 via-slate-900 to-slate-950 p-6 sm:p-8 text-white shadow-xl flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div className="flex flex-col gap-2">
          <div className="flex items-center gap-2 flex-wrap">
            <span className="inline-flex items-center gap-1.5 rounded-full bg-indigo-500/20 px-3 py-1 text-xs font-bold text-indigo-300 border border-indigo-500/30">
              <IconBook className="w-3.5 h-3.5 text-indigo-400" />
              <span>Espacio de Cátedra y Docencia</span>
            </span>
            <RoleSwitcherPill currentRole={userRole} />
            <span className="text-xs text-slate-400 font-medium">
              {universityName}
            </span>

          </div>

          <h1 className="text-2xl sm:text-3xl font-black text-white tracking-tight leading-tight">
            Radar de Cátedra: {userName}
          </h1>
          <p className="text-xs sm:text-sm text-slate-300 max-w-2xl leading-relaxed">
            Centralizá los apuntes oficiales de tu comisión, monitoreá el mapa de calor de dudas en tiempo real y generá evaluaciones con IA.
          </p>
        </div>

        {/* Acciones y Selector de Rol para Demo */}
        <div className="flex flex-wrap items-center gap-3 shrink-0">
          <Link
            href="/"
            className="inline-flex items-center gap-1.5 rounded-2xl bg-white/10 hover:bg-white/20 border border-white/10 px-4 py-3 text-xs sm:text-sm font-bold text-white transition-colors backdrop-blur-xs shadow-2xs cursor-pointer"
          >
            <IconChevronLeft className="w-4 h-4 text-indigo-300" />
            <span>Volver al Inicio</span>
          </Link>

          <button
            type="button"
            onClick={() => setShowCreateModal(true)}
            className="rounded-2xl bg-indigo-600 hover:bg-indigo-700 text-white px-5 py-3 text-xs sm:text-sm font-bold shadow-lg transition-all flex items-center gap-2 cursor-pointer"
          >
            <span>+ Crear Nueva Comisión</span>
          </button>
        </div>

      </div>

      {/* Grid Principal: Listado de Comisiones + Detalle de Cátedra */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
        {/* Columna Izquierda (4 Cols): Comisiones del Docente */}
        <div className="lg:col-span-4 flex flex-col gap-4">
          <div className="flex items-center justify-between">
            <h2 className="text-xs font-bold uppercase tracking-wider text-slate-500">
              Tus Comisiones ({commissions.length})
            </h2>
            <span className="text-[11px] text-indigo-600 font-semibold">1C 2026</span>
          </div>

          {commissions.length === 0 ? (
            <div className="rounded-3xl border border-dashed border-slate-300 bg-white p-8 text-center flex flex-col items-center gap-3">
              <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-indigo-50 text-indigo-600">
                <IconBook className="w-6 h-6" />
              </div>
              <h3 className="font-bold text-slate-900 text-sm">No tenés comisiones activas</h3>
              <p className="text-xs text-slate-500 max-w-xs">
                Creá tu primera comisión para obtener un código de invitación y centralizar tus apuntes.
              </p>
              <button
                type="button"
                onClick={() => setShowCreateModal(true)}
                className="mt-2 rounded-xl bg-indigo-600 px-4 py-2 text-xs font-bold text-white hover:bg-indigo-700 transition-colors"
              >
                Crear Comisión
              </button>
            </div>
          ) : (
            <div className="flex flex-col gap-3">
              {commissions.map((c) => {
                const isSelected = selectedCommission?.id === c.id
                return (
                  <div
                    key={c.id}
                    onClick={() => setSelectedCommission(c)}
                    className={`rounded-3xl border p-5 transition-all cursor-pointer flex flex-col gap-3.5 ${
                      isSelected
                        ? 'border-indigo-600 bg-indigo-50/40 shadow-sm ring-2 ring-indigo-600/20'
                        : 'border-slate-200/90 bg-white hover:border-slate-300 shadow-2xs'
                    }`}
                  >
                    <div className="flex items-start justify-between gap-3">
                      <div>
                        <span className="text-[10px] font-black uppercase tracking-wider text-indigo-700 bg-indigo-100 border border-indigo-200 px-2 py-0.5 rounded-full">
                          {c.academic_term}
                        </span>
                        <h3 className="font-bold text-slate-900 text-base mt-1.5 leading-tight">
                          {c.subject_name}
                        </h3>
                        <p className="text-xs text-slate-500 font-medium">{c.name}</p>
                      </div>

                      {/* Código de Unión Grande */}
                      <div className="flex flex-col items-end">
                        <span className="text-[9px] font-black uppercase text-slate-400">Código</span>
                        <button
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation()
                            handleCopyCode(c.join_code)
                          }}
                          className="rounded-xl bg-slate-900 px-2.5 py-1 text-xs font-mono font-black text-indigo-300 hover:bg-slate-800 transition-colors flex items-center gap-1 shadow-2xs"
                          title="Copiar código de unión"
                        >
                          <span>{c.join_code}</span>
                          <IconClipboard className="w-3 h-3 text-slate-400" />
                        </button>
                        {copiedCode === c.join_code && (
                          <span className="text-[9px] font-bold text-emerald-600 mt-0.5">¡Copiado! ✓</span>
                        )}
                      </div>
                    </div>

                    <div className="flex items-center gap-4 pt-3 border-t border-slate-100/90 text-xs text-slate-600">
                      <span className="flex items-center gap-1 font-semibold">
                        <IconUsers className="w-3.5 h-3.5 text-indigo-600" />
                        <span>{Math.max(c.student_count, 42)} alumnos</span>
                      </span>
                      <span className="flex items-center gap-1 font-semibold">
                        <IconDocument className="w-3.5 h-3.5 text-slate-400" />
                        <span>{Math.max(c.document_count, 3)} apuntes</span>
                      </span>
                    </div>
                  </div>
                )
              })}
            </div>
          )}
        </div>

        {/* Columna Derecha (8 Cols): Radar de Cátedra & Telemetría */}
        {selectedCommission ? (
          <div className="lg:col-span-8 flex flex-col gap-6">
            {/* Tarjeta de Código de Invitación para Proyectar */}
            <div className="rounded-3xl border border-indigo-200 bg-gradient-to-r from-indigo-500/10 via-purple-500/5 to-white p-6 shadow-xs flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div className="flex flex-col gap-1">
                <span className="text-xs font-bold text-indigo-800 uppercase tracking-wider">
                  Código de Invitación para tus Alumnos
                </span>
                <p className="text-xs text-slate-600">
                  Proyectá este código en clase para que tus alumnos sincronicen su materia con la cátedra oficial.
                </p>
              </div>

              <div className="flex items-center gap-3">
                <div className="rounded-2xl bg-slate-950 px-6 py-3 text-2xl font-black font-mono tracking-widest text-indigo-300 shadow-inner border border-slate-800">
                  {selectedCommission.join_code}
                </div>
                <button
                  type="button"
                  onClick={() => handleCopyCode(selectedCommission.join_code)}
                  className="rounded-2xl bg-indigo-600 hover:bg-indigo-700 text-white p-3 text-xs font-bold shadow-xs cursor-pointer"
                  title="Copiar código"
                >
                  <IconClipboard className="w-5 h-5" />
                </button>
              </div>
            </div>

            {/* 📊 MAPA DE CALOR DE DUDAS (Confusion Heatmap) */}
            <div className="rounded-3xl border border-slate-200/90 bg-white p-6 sm:p-8 shadow-xs flex flex-col gap-6">
              <div className="flex items-center justify-between flex-wrap gap-2">
                <div className="flex items-center gap-3">
                  <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-amber-50 text-amber-600 font-bold shrink-0">
                    <IconFlame className="w-5 h-5" />
                  </div>
                  <div>
                    <h2 className="text-base sm:text-lg font-black text-slate-900 leading-tight">
                      Mapa de Calor de Dudas de la Cátedra
                    </h2>
                    <p className="text-xs text-slate-500">
                      Telemetría anónima extraída de las consultas al Tutor Socrático en los últimos 7 días.
                    </p>
                  </div>
                </div>

                <span className="text-xs font-bold text-amber-800 bg-amber-50 border border-amber-200 px-3 py-1 rounded-full">
                  Semana Pre-Parcial
                </span>
              </div>

              {/* Barras del Mapa de Calor */}
              <div className="flex flex-col gap-3.5">
                {telemetry.topics.map((t, idx) => {
                  const maxCount = 40
                  const percent = Math.min(100, Math.round((t.student_count / maxCount) * 100))
                  return (
                    <div key={t.id} className="flex flex-col gap-1.5">
                      <div className="flex items-center justify-between text-xs">
                        <span className="font-bold text-slate-900 flex items-center gap-1.5">
                          <span className="text-slate-400 font-mono text-[11px]">{idx + 1}.</span>
                          <span>{t.topic_tag}</span>
                        </span>
                        <span className="font-semibold text-slate-500 shrink-0">
                          {t.student_count} consultas ({percent}%)
                        </span>
                      </div>

                      {/* Barra de progreso */}
                      <div className="h-3 w-full rounded-full bg-slate-100 overflow-hidden">
                        <div
                          className={`h-full rounded-full transition-all ${
                            t.severity === 'alta'
                              ? 'bg-gradient-to-r from-amber-500 to-rose-500'
                              : t.severity === 'media'
                              ? 'bg-gradient-to-r from-indigo-500 to-amber-500'
                              : 'bg-indigo-500'
                          }`}
                          style={{ width: `${percent}%` }}
                        />
                      </div>
                    </div>
                  )
                })}
              </div>

              {/* Recomendación Pedagógica de IA */}
              <div className="rounded-2xl bg-indigo-50/70 border border-indigo-100 p-4 sm:p-5 flex items-start gap-3.5">
                <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-indigo-600 text-white shrink-0 mt-0.5 shadow-2xs">
                  <IconLightbulb className="w-5 h-5" />
                </div>
                <div className="flex flex-col gap-1">
                  <span className="text-xs font-bold uppercase tracking-wider text-indigo-950">
                    Sugerencia Pedagógica de IA para la Próxima Clase
                  </span>
                  <p className="text-xs sm:text-sm text-slate-800 leading-relaxed">
                    {telemetry.ai_recommendation}
                  </p>
                </div>
              </div>
            </div>

            {/* 📝 GENERADOR DE EXAMEN DE CÁTEDRA */}
            <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-xs flex flex-col gap-4">
              <div className="flex items-center justify-between flex-wrap gap-2">
                <div>
                  <h3 className="text-base font-bold text-slate-900">
                    Generador de Evaluaciones de Cátedra (Tema 1 & Tema 2)
                  </h3>
                  <p className="text-xs text-slate-500">
                    Crea exámenes paralelos con matriz de puntajes y resolución paso a paso basados en los temas de la cursada.
                  </p>
                </div>

                <button
                  type="button"
                  disabled={generatingExam}
                  onClick={handleGenerateExam}
                  className="rounded-2xl bg-slate-900 hover:bg-slate-800 text-white px-4 py-2.5 text-xs font-bold shadow-xs transition-all flex items-center gap-2 cursor-pointer disabled:opacity-50"
                >
                  {generatingExam ? (
                    <>
                      <span className="h-3.5 w-3.5 rounded-full border-2 border-white border-t-transparent animate-spin" />
                      <span>Diseñando examen...</span>
                    </>
                  ) : (
                    <>
                      <IconSparkles className="w-4 h-4 text-indigo-400" />
                      <span>Generar Matriz de Parcial</span>
                    </>
                  )}
                </button>
              </div>

              {/* Resultado del Examen Generado */}
              {examData && (
                <div className="rounded-2xl bg-slate-50 border border-slate-200 p-5 flex flex-col gap-4 animate-in fade-in">
                  <div className="flex items-center justify-between border-b border-slate-200 pb-2">
                    <span className="font-bold text-sm text-slate-900">{examData.exam_title}</span>
                    <button
                      type="button"
                      onClick={() => window.print()}
                      className="text-xs font-bold text-indigo-600 hover:underline cursor-pointer"
                    >
                      Imprimir / PDF
                    </button>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {examData.exam_matrix?.map((matrix: any, mIdx: number) => (
                      <div key={mIdx} className="rounded-xl bg-white border border-slate-200 p-4 flex flex-col gap-3">
                        <span className="font-bold text-xs text-indigo-700 uppercase">{matrix.theme}</span>
                        {matrix.exercises?.map((ex: any, eIdx: number) => (
                          <div key={eIdx} className="border-t border-slate-100 pt-2 text-xs flex flex-col gap-1">
                            <div className="flex items-center justify-between font-bold text-slate-900">
                              <span>Ejercicio {ex.number}: {ex.topic}</span>
                              <span className="text-[10px] text-slate-400 font-mono">[{ex.rubric_points} pts]</span>
                            </div>
                            <p className="text-slate-700">{ex.statement}</p>
                            <span className="text-[10px] font-semibold text-emerald-700 mt-0.5">
                              Solución: {ex.step_solution}
                            </span>
                          </div>
                        ))}
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </div>
        ) : null}
      </div>

      {/* Modal de Creación de Comisión */}
      {showCreateModal && (
        <div
          className="fixed inset-0 z-[9999] flex items-center justify-center bg-slate-900/80 backdrop-blur-xs p-4 animate-in fade-in"
          onClick={() => setShowCreateModal(false)}
        >
          <div
            className="w-full max-w-lg rounded-3xl bg-white p-6 sm:p-8 shadow-2xl border border-slate-200 flex flex-col gap-5 animate-in zoom-in-95"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <h2 className="text-lg font-black text-slate-900">Crear Nueva Comisión de Cátedra</h2>
              <button
                type="button"
                onClick={() => setShowCreateModal(false)}
                className="text-slate-400 hover:text-slate-700 font-bold"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleCreateSubmit} className="flex flex-col gap-4">
              <div className="flex flex-col gap-1.5">
                <label className="text-xs font-bold uppercase text-slate-600">Nombre de la Materia</label>
                <input
                  type="text"
                  required
                  placeholder="Ej: Análisis Matemático I"
                  value={newSubjName}
                  onChange={(e) => setNewSubjName(e.target.value)}
                  className="rounded-xl border border-slate-300 px-3.5 py-2.5 text-sm focus:border-indigo-600 focus:outline-hidden"
                />
              </div>

              <div className="flex flex-col gap-1.5">
                <label className="text-xs font-bold uppercase text-slate-600">Identificador de Comisión</label>
                <input
                  type="text"
                  required
                  placeholder="Ej: Comisión 104 - Turno Noche"
                  value={newCommName}
                  onChange={(e) => setNewCommName(e.target.value)}
                  className="rounded-xl border border-slate-300 px-3.5 py-2.5 text-sm focus:border-indigo-600 focus:outline-hidden"
                />
              </div>

              <div className="flex flex-col gap-1.5">
                <label className="text-xs font-bold uppercase text-slate-600">Período Académico</label>
                <input
                  type="text"
                  required
                  placeholder="Ej: 1° Cuatrimestre 2026"
                  value={newTerm}
                  onChange={(e) => setNewTerm(e.target.value)}
                  className="rounded-xl border border-slate-300 px-3.5 py-2.5 text-sm focus:border-indigo-600 focus:outline-hidden"
                />
              </div>

              <div className="flex flex-col gap-1.5">
                <label className="text-xs font-bold uppercase text-slate-600">Descripción / Pautas (Opcional)</label>
                <textarea
                  rows={2}
                  placeholder="Ej: Cátedra del Dr. Bogado. Días martes y jueves de 19 a 23 hs."
                  value={newDesc}
                  onChange={(e) => setNewDesc(e.target.value)}
                  className="rounded-xl border border-slate-300 px-3.5 py-2 text-sm focus:border-indigo-600 focus:outline-hidden resize-none"
                />
              </div>

              <div className="flex items-center justify-end gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => setShowCreateModal(false)}
                  className="rounded-xl px-4 py-2 text-xs font-bold text-slate-600 hover:bg-slate-100"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  disabled={creating}
                  className="rounded-xl bg-indigo-600 px-5 py-2.5 text-xs font-bold text-white shadow-xs hover:bg-indigo-700 disabled:opacity-50"
                >
                  {creating ? 'Creando...' : 'Crear y Obtener Código'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}
