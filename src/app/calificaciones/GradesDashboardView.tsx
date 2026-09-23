'use client'

import { useState } from 'react'
import Link from 'next/link'
import {
  AcademicGradeItem,
  GradesSummaryData,
  GradeStatus,
  computeGradeCondition,
} from './calculator'
import {
  upsertSubjectGradeAction,
  deleteSubjectGradeAction,
} from './actions'
import {
  IconAcademicCap,
  IconCalculator,
  IconAward,
  IconBook,
  IconCheck,
  IconPrinter,
  IconChevronLeft,
  IconFlame,
  IconDocument,
  IconSparkles,
  IconBuilding,
  IconEdit,
  IconClose,
} from '@/components/icons'

interface GradesDashboardViewProps {
  initialData: GradesSummaryData
}

export default function GradesDashboardView({ initialData }: GradesDashboardViewProps) {
  const [data, setData] = useState<GradesSummaryData>(initialData)
  const [selectedYearFilter, setSelectedYearFilter] = useState<number | 'ALL'>('ALL')
  const [searchQuery, setSearchQuery] = useState('')

  // Modales
  const [showEditModal, setShowEditModal] = useState(false)
  const [showSimModal, setShowSimModal] = useState(false)
  const [showPrintModal, setShowPrintModal] = useState(false)

  // Estado para edición / nueva nota
  const [editingItem, setEditingItem] = useState<Partial<AcademicGradeItem> | null>(null)
  const [saving, setSaving] = useState(false)

  // Estado para el Simulador Predictivo
  const [simSubject, setSimSubject] = useState<AcademicGradeItem | null>(
    initialData.grades.find((g) => g.status === 'en_curso' || g.status === 'a_recuperatorio') || initialData.grades[0] || null
  )
  const [simP1, setSimP1] = useState<number>(simSubject?.partial_1_grade ?? 6.0)
  const [simP2, setSimP2] = useState<number>(7.0)
  const [simTp, setSimTp] = useState<number>(simSubject?.tp_average ?? 8.5)
  const [simAttendance, setSimAttendance] = useState<number>(simSubject?.attendance_percentage ?? 90)

  // Filtrado de materias
  const filteredGrades = data.grades.filter((g) => {
    const matchesYear = selectedYearFilter === 'ALL' || g.year_level === selectedYearFilter
    const matchesSearch =
      g.subject_name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      g.term.toLowerCase().includes(searchQuery.toLowerCase())
    return matchesYear && matchesSearch
  })

  // Años disponibles en el historial
  const yearLevels = Array.from(new Set(data.grades.map((g) => g.year_level))).sort((a, b) => a - b)

  // Abrir modal de creación
  const handleOpenNew = () => {
    setEditingItem({
      subject_name: '',
      academic_year: 2026,
      year_level: data.current_year_level || 2,
      term: '1° Cuatrimestre',
      partial_1_grade: null,
      partial_2_grade: null,
      recuperatorio_1_grade: null,
      recuperatorio_2_grade: null,
      tp_average: null,
      attendance_percentage: 90,
      final_exam_grade: null,
      promotion_min_grade: 7.0,
      regular_min_grade: 4.0,
      notes: '',
    })
    setShowEditModal(true)
  }

  // Abrir modal de edición
  const handleOpenEdit = (item: AcademicGradeItem) => {
    setEditingItem({ ...item })
    setShowEditModal(true)
  }

  // Abrir simulador para una materia específica
  const handleOpenSimulator = (item: AcademicGradeItem) => {
    setSimSubject(item)
    setSimP1(item.partial_1_grade ?? 6.0)
    setSimP2(item.partial_2_grade ?? 7.0)
    setSimTp(item.tp_average ?? 8.5)
    setSimAttendance(item.attendance_percentage ?? 90)
    setShowSimModal(true)
  }

  // Guardar nota
  const handleSaveGrade = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!editingItem || !editingItem.subject_name?.trim()) return

    setSaving(true)
    try {
      const res = await upsertSubjectGradeAction({
        id: editingItem.id,
        subject_name: editingItem.subject_name.trim(),
        subject_id: editingItem.subject_id,
        academic_year: editingItem.academic_year || 2026,
        year_level: editingItem.year_level || 1,
        term: editingItem.term || '1° Cuatrimestre',
        partial_1_grade: editingItem.partial_1_grade ?? null,
        partial_2_grade: editingItem.partial_2_grade ?? null,
        recuperatorio_1_grade: editingItem.recuperatorio_1_grade ?? null,
        recuperatorio_2_grade: editingItem.recuperatorio_2_grade ?? null,
        tp_average: editingItem.tp_average ?? null,
        attendance_percentage: editingItem.attendance_percentage ?? 85,
        final_exam_grade: editingItem.final_exam_grade ?? null,
        promotion_min_grade: editingItem.promotion_min_grade ?? 7.0,
        regular_min_grade: editingItem.regular_min_grade ?? 4.0,
        notes: editingItem.notes,
      })

      if (res.success && res.grade) {
        const exists = data.grades.some((g) => g.id === res.grade!.id)
        const updatedGrades = exists
          ? data.grades.map((g) => (g.id === res.grade!.id ? res.grade! : g))
          : [res.grade!, ...data.grades]

        // Recalcular métricas
        const finished = updatedGrades
          .filter((g) => g.status === 'promocionada' || g.status === 'aprobada_final')
          .map((g) => g.final_exam_grade ?? g.calculated_average ?? 0)
          .filter((n) => n > 0)

        const gpa =
          finished.length > 0
            ? Number((finished.reduce((a, b) => a + b, 0) / finished.length).toFixed(2))
            : data.overall_gpa

        setData({
          ...data,
          overall_gpa: gpa,
          approved_subjects_count: updatedGrades.filter(
            (g) => g.status === 'promocionada' || g.status === 'aprobada_final'
          ).length,
          promoted_count: updatedGrades.filter((g) => g.status === 'promocionada').length,
          in_progress_count: updatedGrades.filter((g) => g.status === 'en_curso' || g.status === 'regular').length,
          at_risk_count: updatedGrades.filter((g) => g.status === 'a_recuperatorio' || g.status === 'libre').length,
          grades: updatedGrades,
        })
        setShowEditModal(false)
      }
    } catch {
      alert('Error al guardar la calificación.')
    } finally {
      setSaving(false)
    }
  }

  // Eliminar materia
  const handleDeleteGrade = async (gradeId: string) => {
    if (!confirm('¿Estás seguro de eliminar este registro de la libreta?')) return
    await deleteSubjectGradeAction(gradeId)
    const updated = data.grades.filter((g) => g.id !== gradeId)
    setData({ ...data, grades: updated })
    setShowEditModal(false)
  }

  // Cálculo en vivo del Simulador
  const simResult = computeGradeCondition({
    partial_1_grade: simP1,
    partial_2_grade: simP2,
    tp_average: simTp,
    attendance_percentage: simAttendance,
    promotion_min_grade: simSubject?.promotion_min_grade ?? 7.0,
    regular_min_grade: simSubject?.regular_min_grade ?? 4.0,
  })

  // Badge de Estado Helper
  const getStatusBadge = (status: GradeStatus) => {
    switch (status) {
      case 'promocionada':
        return (
          <span className="inline-flex items-center gap-1.5 rounded-full bg-emerald-50 border border-emerald-200 px-2.5 py-0.5 text-[11px] font-bold text-emerald-700">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
            <span>Promocionada (Directa)</span>
          </span>
        )
      case 'aprobada_final':
        return (
          <span className="inline-flex items-center gap-1.5 rounded-full bg-indigo-50 border border-indigo-200 px-2.5 py-0.5 text-[11px] font-bold text-indigo-700">
            <IconAward className="w-3.5 h-3.5 text-indigo-600" />
            <span>Aprobada con Final</span>
          </span>
        )
      case 'regular':
        return (
          <span className="inline-flex items-center gap-1.5 rounded-full bg-sky-50 border border-sky-200 px-2.5 py-0.5 text-[11px] font-bold text-sky-700">
            <span className="w-1.5 h-1.5 rounded-full bg-sky-500" />
            <span>Regular (Habilitado a Final)</span>
          </span>
        )
      case 'a_recuperatorio':
        return (
          <span className="inline-flex items-center gap-1.5 rounded-full bg-amber-50 border border-amber-200 px-2.5 py-0.5 text-[11px] font-bold text-amber-700">
            <span className="w-1.5 h-1.5 rounded-full bg-amber-500" />
            <span>A Recuperatorio</span>
          </span>
        )
      case 'libre':
        return (
          <span className="inline-flex items-center gap-1.5 rounded-full bg-rose-50 border border-rose-200 px-2.5 py-0.5 text-[11px] font-bold text-rose-700">
            <span className="w-1.5 h-1.5 rounded-full bg-rose-500" />
            <span>Libre / Recursante</span>
          </span>
        )
      case 'en_curso':
      default:
        return (
          <span className="inline-flex items-center gap-1.5 rounded-full bg-slate-100 border border-slate-200 px-2.5 py-0.5 text-[11px] font-bold text-slate-700">
            <span className="w-1.5 h-1.5 rounded-full bg-slate-400" />
            <span>Cursando</span>
          </span>
        )
    }
  }

  return (
    <div className="mx-auto max-w-[96rem] px-4 py-8 sm:px-6 flex flex-col gap-8 select-none">
      {/* Header Principal de la Libreta */}
      <div className="rounded-3xl bg-gradient-to-br from-[#1E1B4B] via-indigo-950 to-slate-900 p-6 sm:p-8 text-white shadow-xl flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div className="flex flex-col gap-2">
          <div className="flex items-center gap-2 flex-wrap">
            <span className="inline-flex items-center gap-1.5 rounded-full bg-indigo-500/20 px-3 py-1 text-xs font-bold text-indigo-300 border border-indigo-500/30">
              <IconAcademicCap className="w-3.5 h-3.5 text-indigo-300" />
              <span>Libreta Universitaria Digital & Analítico</span>
            </span>
            <span className="text-xs text-slate-300 font-medium">
              {data.university_name}
            </span>
          </div>

          <h1 className="text-2xl sm:text-3xl font-black text-white tracking-tight leading-tight">
            Control de Notas y Parciales: {data.student_name}
          </h1>
          <p className="text-xs sm:text-sm text-slate-300 max-w-2xl leading-relaxed">
            {data.career_name} • Seguimiento de parciales de 1°, 2° año y superiores, cálculo predictivo de notas para promoción directa y prevención de recursería.
          </p>
        </div>

        {/* Botones de Acción de Cabecera */}
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
            onClick={() => setShowSimModal(true)}
            className="inline-flex items-center gap-2 rounded-2xl bg-indigo-500/30 hover:bg-indigo-500/40 border border-indigo-400/40 text-white px-4 py-3 text-xs sm:text-sm font-bold shadow-md transition-all cursor-pointer"
          >
            <IconCalculator className="w-4 h-4 text-indigo-300" />
            <span>Simulador de Parciales</span>
          </button>

          <button
            type="button"
            onClick={() => setShowPrintModal(true)}
            className="inline-flex items-center gap-2 rounded-2xl bg-slate-800 hover:bg-slate-700 text-white border border-slate-700 px-4 py-3 text-xs sm:text-sm font-bold shadow-md transition-all cursor-pointer"
          >
            <IconPrinter className="w-4 h-4 text-slate-300" />
            <span>Imprimir Analítico A4</span>
          </button>

          <button
            type="button"
            onClick={handleOpenNew}
            className="rounded-2xl bg-indigo-600 hover:bg-indigo-700 text-white px-5 py-3 text-xs sm:text-sm font-bold shadow-lg transition-all flex items-center gap-2 cursor-pointer"
          >
            <span>+ Cargar Materia / Nota</span>
          </button>
        </div>
      </div>

      {/* 4 KPIs Académicos */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Promedio General */}
        <div className="rounded-3xl border border-slate-200 bg-white p-5 shadow-xs flex flex-col gap-2">
          <span className="text-xs font-bold uppercase tracking-wider text-slate-400">
            Promedio General (GPA)
          </span>
          <div className="flex items-baseline justify-between">
            <span className="text-3xl font-black text-indigo-600">
              {data.overall_gpa}
            </span>
            <span className="text-[10px] font-bold text-indigo-700 bg-indigo-50 border border-indigo-200 px-2 py-0.5 rounded-full">
              Escala 1 a 10
            </span>
          </div>
          <span className="text-[11px] text-slate-500">
            {data.overall_gpa >= 8 ? 'Nivel de Excelencia Académica (Promedio destacado)' : 'Promedio ponderado de materias finalizadas'}
          </span>
        </div>

        {/* Avance de Carrera */}
        <div className="rounded-3xl border border-slate-200 bg-white p-5 shadow-xs flex flex-col gap-2">
          <span className="text-xs font-bold uppercase tracking-wider text-slate-400">
            Materias Aprobadas / Finalizadas
          </span>
          <div className="flex items-baseline justify-between">
            <span className="text-3xl font-black text-emerald-600">
              {data.approved_subjects_count}
            </span>
            <span className="text-[10px] font-bold text-emerald-700 bg-emerald-50 border border-emerald-200 px-2 py-0.5 rounded-full">
              {data.total_subjects_count > 0 ? `${Math.round((data.approved_subjects_count / data.total_subjects_count) * 100)}% de avance` : '0%'}
            </span>
          </div>
          <span className="text-[11px] text-slate-500">
            {data.promoted_count} promociones directas + {data.approved_subjects_count - data.promoted_count} finales rendidos
          </span>
        </div>

        {/* Cursada Activa */}
        <div className="rounded-3xl border border-slate-200 bg-white p-5 shadow-xs flex flex-col gap-2">
          <span className="text-xs font-bold uppercase tracking-wider text-slate-400">
            Materias en Cursada Actual
          </span>
          <div className="flex items-baseline justify-between">
            <span className="text-3xl font-black text-slate-900">
              {data.in_progress_count}
            </span>
            <span className="text-[10px] font-bold text-slate-700 bg-slate-100 border border-slate-200 px-2 py-0.5 rounded-full">
              2° Año
            </span>
          </div>
          <span className="text-[11px] text-slate-500">Cursando con parciales en desarrollo</span>
        </div>

        {/* Semáforo de Alerta */}
        <div className="rounded-3xl border border-slate-200 bg-white p-5 shadow-xs flex flex-col gap-2">
          <span className="text-xs font-bold uppercase tracking-wider text-slate-400">
            Atención / A Recuperatorio
          </span>
          <div className="flex items-baseline justify-between">
            <span className={`text-3xl font-black ${data.at_risk_count > 0 ? 'text-amber-600' : 'text-emerald-600'}`}>
              {data.at_risk_count}
            </span>
            <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${data.at_risk_count > 0 ? 'text-amber-700 bg-amber-50 border border-amber-200' : 'text-emerald-700 bg-emerald-50 border border-emerald-200'}`}>
              {data.at_risk_count > 0 ? 'Requiere Repaso' : 'Sin Riesgo'}
            </span>
          </div>
          <span className="text-[11px] text-slate-500">
            {data.at_risk_count > 0 ? 'Revisá la nota necesaria en el simulador' : 'Todas tus materias están al día'}
          </span>
        </div>
      </div>

      {/* Contenedor Principal: Filtros y Tabla de Libreta */}
      <div className="rounded-3xl border border-slate-200/80 bg-white p-6 sm:p-8 shadow-xs flex flex-col gap-6">
        {/* Barra Superior: Filtro por Año + Buscador */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-100 pb-4">
          <div className="flex items-center gap-1.5 flex-wrap">
            <button
              type="button"
              onClick={() => setSelectedYearFilter('ALL')}
              className={`px-3.5 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                selectedYearFilter === 'ALL'
                  ? 'bg-slate-900 text-white shadow-xs'
                  : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
              }`}
            >
              Historial Completo ({data.grades.length})
            </button>
            {yearLevels.map((year) => (
              <button
                key={year}
                type="button"
                onClick={() => setSelectedYearFilter(year)}
                className={`px-3.5 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                  selectedYearFilter === year
                    ? 'bg-indigo-600 text-white shadow-xs'
                    : 'bg-indigo-50 text-indigo-700 hover:bg-indigo-100'
                }`}
              >
                {year}° Año ({data.grades.filter((g) => g.year_level === year).length})
              </button>
            ))}
          </div>

          <div className="w-full sm:w-72">
            <input
              type="text"
              placeholder="Buscar materia o cuatrimestre..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full rounded-xl border border-slate-200 px-3.5 py-2 text-xs text-slate-900 focus:border-indigo-600 focus:outline-hidden"
            />
          </div>
        </div>

        {/* Tabla de Calificaciones */}
        <div className="overflow-x-auto rounded-2xl border border-slate-200">
          <table className="w-full text-left text-xs text-slate-600">
            <thead className="bg-slate-50 border-b border-slate-200 text-[10px] font-bold uppercase tracking-wider text-slate-500">
              <tr>
                <th className="px-4 py-3.5">Materia / Año</th>
                <th className="px-4 py-3.5 text-center">1° Parcial</th>
                <th className="px-4 py-3.5 text-center">2° Parcial</th>
                <th className="px-4 py-3.5 text-center">TPs</th>
                <th className="px-4 py-3.5 text-center">Asistencia</th>
                <th className="px-4 py-3.5 text-center">Ex. Final</th>
                <th className="px-4 py-3.5 text-center">Promedio</th>
                <th className="px-4 py-3.5">Condición Académica</th>
                <th className="px-4 py-3.5 text-right">Acciones</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filteredGrades.map((g) => (
                <tr key={g.id} className="hover:bg-slate-50/80 transition-colors">
                  {/* Nombre y Cuatrimestre */}
                  <td className="px-4 py-3.5 font-bold text-slate-900">
                    <div>{g.subject_name}</div>
                    <div className="text-[10px] font-normal text-slate-400">
                      {g.year_level}° Año • {g.term} ({g.academic_year})
                    </div>
                  </td>

                  {/* 1° Parcial */}
                  <td className="px-4 py-3.5 text-center">
                    {g.partial_1_grade !== null ? (
                      <div>
                        <span className={`font-mono font-bold text-sm ${g.partial_1_grade >= g.promotion_min_grade ? 'text-emerald-600' : g.partial_1_grade >= g.regular_min_grade ? 'text-slate-800' : 'text-rose-600'}`}>
                          {g.partial_1_grade}
                        </span>
                        {g.recuperatorio_1_grade !== null && (
                          <div className="text-[10px] text-amber-700 font-semibold font-mono">
                            Recup: {g.recuperatorio_1_grade}
                          </div>
                        )}
                      </div>
                    ) : (
                      <span className="text-slate-300 font-mono">—</span>
                    )}
                  </td>

                  {/* 2° Parcial */}
                  <td className="px-4 py-3.5 text-center">
                    {g.partial_2_grade !== null ? (
                      <div>
                        <span className={`font-mono font-bold text-sm ${g.partial_2_grade >= g.promotion_min_grade ? 'text-emerald-600' : g.partial_2_grade >= g.regular_min_grade ? 'text-slate-800' : 'text-rose-600'}`}>
                          {g.partial_2_grade}
                        </span>
                        {g.recuperatorio_2_grade !== null && (
                          <div className="text-[10px] text-amber-700 font-semibold font-mono">
                            Recup: {g.recuperatorio_2_grade}
                          </div>
                        )}
                      </div>
                    ) : (
                      <span className="text-slate-300 font-mono">—</span>
                    )}
                  </td>

                  {/* TPs */}
                  <td className="px-4 py-3.5 text-center font-mono font-semibold text-slate-700">
                    {g.tp_average !== null ? g.tp_average : '—'}
                  </td>

                  {/* Asistencia */}
                  <td className="px-4 py-3.5 text-center font-mono">
                    <span className={`font-bold ${g.attendance_percentage >= 75 ? 'text-emerald-700' : 'text-rose-600'}`}>
                      {g.attendance_percentage}%
                    </span>
                  </td>

                  {/* Final */}
                  <td className="px-4 py-3.5 text-center font-mono font-black text-indigo-600 text-sm">
                    {g.final_exam_grade !== null ? g.final_exam_grade : '—'}
                  </td>

                  {/* Promedio Calculado */}
                  <td className="px-4 py-3.5 text-center font-mono font-bold text-slate-900">
                    {g.calculated_average !== null ? g.calculated_average : '—'}
                  </td>

                  {/* Condición */}
                  <td className="px-4 py-3.5">
                    {getStatusBadge(g.status)}
                    {g.required_p2_promotion !== null && g.status === 'en_curso' && (
                      <div className="text-[10px] text-indigo-600 font-semibold mt-0.5">
                        Necesitás {g.required_p2_promotion} en P2 para promo
                      </div>
                    )}
                  </td>

                  {/* Acciones */}
                  <td className="px-4 py-3.5 text-right">
                    <div className="flex items-center justify-end gap-1.5">
                      <button
                        type="button"
                        onClick={() => handleOpenSimulator(g)}
                        title="Simular nota necesaria"
                        className="p-1.5 rounded-lg bg-indigo-50 text-indigo-700 hover:bg-indigo-100 transition-colors cursor-pointer"
                      >
                        <IconCalculator className="w-3.5 h-3.5" />
                      </button>
                      <button
                        type="button"
                        onClick={() => handleOpenEdit(g)}
                        title="Editar notas"
                        className="p-1.5 rounded-lg bg-slate-100 text-slate-700 hover:bg-slate-200 transition-colors cursor-pointer"
                      >
                        <IconEdit className="w-3.5 h-3.5 text-slate-700" />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* MODAL 1: SIMULADOR PREDICTIVO DE NOTAS */}
      {showSimModal && (
        <div
          className="fixed inset-0 z-[9999] flex items-center justify-center bg-slate-900/60 backdrop-blur-2xs p-4 animate-in fade-in"
          onClick={() => setShowSimModal(false)}
        >
          <div
            className="w-full max-w-xl rounded-3xl bg-white p-6 sm:p-8 shadow-2xl border border-slate-200 flex flex-col gap-6 animate-in zoom-in-95 text-slate-900"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div className="flex items-center gap-2.5">
                <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-indigo-600 text-white font-bold shadow-xs">
                  <IconCalculator className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-base font-black text-slate-900">
                    Calculadora Predictiva de Regularidad & Promoción
                  </h3>
                  <p className="text-[11px] text-slate-500">
                    Simulá tu nota del 2° Parcial y proyectá tu condición académica final.
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setShowSimModal(false)}
                className="text-slate-400 hover:text-slate-700 font-bold p-1 rounded-lg hover:bg-slate-100 transition-colors cursor-pointer"
              >
                <IconClose className="w-4 h-4" />
              </button>
            </div>

            {/* Selector de Materia a Simular */}
            <div className="flex flex-col gap-1.5">
              <label className="text-xs font-bold text-slate-700">Materia a Simular</label>
              <select
                value={simSubject?.id || ''}
                onChange={(e) => {
                  const sub = data.grades.find((g) => g.id === e.target.value)
                  if (sub) {
                    setSimSubject(sub)
                    setSimP1(sub.partial_1_grade ?? 6.0)
                    setSimP2(sub.partial_2_grade ?? 7.0)
                    setSimTp(sub.tp_average ?? 8.5)
                    setSimAttendance(sub.attendance_percentage ?? 90)
                  }
                }}
                className="rounded-xl border border-slate-200 p-2.5 text-xs sm:text-sm font-semibold text-slate-900 focus:border-indigo-600 focus:outline-hidden bg-white"
              >
                {data.grades.map((g) => (
                  <option key={g.id} value={g.id}>
                    {g.subject_name} ({g.year_level}° Año - {g.term})
                  </option>
                ))}
              </select>
            </div>

            {/* Sliders / Inputs Interactivos */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 bg-slate-50 p-4 rounded-2xl border border-slate-200/80">
              <div>
                <div className="flex items-center justify-between text-xs font-bold text-slate-700 mb-1">
                  <span>Nota 1° Parcial</span>
                  <span className="font-mono text-indigo-600 font-black text-sm">{simP1}</span>
                </div>
                <input
                  type="range"
                  min="1"
                  max="10"
                  step="0.5"
                  value={simP1}
                  onChange={(e) => setSimP1(parseFloat(e.target.value))}
                  className="w-full accent-indigo-600 cursor-pointer"
                />
              </div>

              <div>
                <div className="flex items-center justify-between text-xs font-bold text-slate-700 mb-1">
                  <span>Nota Simulada 2° Parcial</span>
                  <span className="font-mono text-indigo-600 font-black text-sm">{simP2}</span>
                </div>
                <input
                  type="range"
                  min="1"
                  max="10"
                  step="0.5"
                  value={simP2}
                  onChange={(e) => setSimP2(parseFloat(e.target.value))}
                  className="w-full accent-indigo-600 cursor-pointer"
                />
              </div>

              <div>
                <div className="flex items-center justify-between text-xs font-bold text-slate-700 mb-1">
                  <span>Promedio de TPs</span>
                  <span className="font-mono text-slate-900 font-bold">{simTp}</span>
                </div>
                <input
                  type="range"
                  min="1"
                  max="10"
                  step="0.5"
                  value={simTp}
                  onChange={(e) => setSimTp(parseFloat(e.target.value))}
                  className="w-full accent-indigo-600 cursor-pointer"
                />
              </div>

              <div>
                <div className="flex items-center justify-between text-xs font-bold text-slate-700 mb-1">
                  <span>Asistencia a Clases</span>
                  <span className="font-mono text-slate-900 font-bold">{simAttendance}%</span>
                </div>
                <input
                  type="range"
                  min="50"
                  max="100"
                  step="5"
                  value={simAttendance}
                  onChange={(e) => setSimAttendance(parseInt(e.target.value))}
                  className="w-full accent-indigo-600 cursor-pointer"
                />
              </div>
            </div>

            {/* Resultado Predictivo Destacado */}
            <div className="rounded-2xl border p-5 flex flex-col gap-3 bg-gradient-to-br from-indigo-50/70 to-slate-50 border-indigo-100">
              <div className="flex items-center justify-between">
                <span className="text-[10px] font-black uppercase tracking-wider text-indigo-800">
                  Condición Académica Proyectada
                </span>
                {getStatusBadge(simResult.status)}
              </div>

              <div className="flex items-baseline justify-between border-t border-indigo-100/80 pt-2">
                <span className="text-xs text-slate-600 font-medium">Promedio Final de Cursada:</span>
                <span className="text-2xl font-black font-mono text-indigo-700">
                  {simResult.calculated_average !== null ? simResult.calculated_average : '—'}
                </span>
              </div>

              {/* Explicación en Lenguaje Natural */}
              <div className="text-xs text-slate-700 leading-relaxed font-medium">
                {simResult.status === 'promocionada' && (
                  <p className="text-emerald-800 font-semibold">
                    ¡Excelente! Con estas notas promocionás directamente la materia sin necesidad de rendir examen final.
                  </p>
                )}
                {simResult.status === 'regular' && (
                  <p className="text-sky-800">
                    Quedás en condición de <strong>Alumno Regular</strong>. Aprobaste la cursada y quedás habilitado para rendir el Examen Final en los turnos de julio o diciembre.
                  </p>
                )}
                {simResult.status === 'a_recuperatorio' && (
                  <p className="text-amber-800">
                    Tenés un parcial desaprobado. Podés presentarte al Recuperatorio al final del cuatrimestre para regularizar la cursada.
                  </p>
                )}
                {simResult.status === 'libre' && (
                  <p className="text-rose-800">
                    Con estos valores quedarías en condición Libre {simAttendance < 75 ? '(por asistencia inferior al 75%)' : '(por ambos parciales desaprobados)'}. Contactá a la cátedra para solicitar tutoría socrática.
                  </p>
                )}
              </div>
            </div>

            <div className="flex justify-end">
              <button
                type="button"
                onClick={() => setShowSimModal(false)}
                className="rounded-xl bg-slate-900 text-white px-5 py-2.5 text-xs font-bold hover:bg-slate-800 cursor-pointer"
              >
                Entendido, volver a la Libreta
              </button>
            </div>
          </div>
        </div>
      )}

      {/* MODAL 2: CARGA Y EDICIÓN DE NOTAS */}
      {showEditModal && editingItem && (
        <div
          className="fixed inset-0 z-[9999] flex items-center justify-center bg-slate-900/60 backdrop-blur-2xs p-4 animate-in fade-in overflow-y-auto"
          onClick={() => setShowEditModal(false)}
        >
          <div
            className="w-full max-w-lg rounded-3xl bg-white p-6 sm:p-8 shadow-2xl border border-slate-200 flex flex-col gap-5 animate-in zoom-in-95 text-slate-900 my-8"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <h3 className="text-base font-black text-slate-900">
                {editingItem.id ? 'Editar Calificaciones de la Materia' : 'Cargar Nueva Materia a la Libreta'}
              </h3>
              <button
                type="button"
                onClick={() => setShowEditModal(false)}
                className="text-slate-400 hover:text-slate-700 font-bold p-1 rounded-lg hover:bg-slate-100 transition-colors cursor-pointer"
              >
                <IconClose className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleSaveGrade} className="flex flex-col gap-4 text-xs">
              <div>
                <label className="text-[10px] font-bold uppercase tracking-wider text-slate-500 block mb-1">
                  Nombre de la Materia
                </label>
                <input
                  type="text"
                  required
                  placeholder="Ej: Análisis Matemático II"
                  value={editingItem.subject_name || ''}
                  onChange={(e) => setEditingItem({ ...editingItem, subject_name: e.target.value })}
                  className="w-full rounded-xl border border-slate-200 p-2.5 text-xs sm:text-sm text-slate-900 focus:border-indigo-600 focus:outline-hidden"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-[10px] font-bold uppercase tracking-wider text-slate-500 block mb-1">
                    Año de Cursada
                  </label>
                  <select
                    value={editingItem.year_level || 2}
                    onChange={(e) => setEditingItem({ ...editingItem, year_level: parseInt(e.target.value) })}
                    className="w-full rounded-xl border border-slate-200 p-2.5 text-xs text-slate-900 focus:border-indigo-600 bg-white"
                  >
                    <option value={1}>1° Año (Ingreso)</option>
                    <option value={2}>2° Año</option>
                    <option value={3}>3° Año</option>
                    <option value={4}>4° Año</option>
                    <option value={5}>5° Año</option>
                  </select>
                </div>

                <div>
                  <label className="text-[10px] font-bold uppercase tracking-wider text-slate-500 block mb-1">
                    Período / Cuatrimestre
                  </label>
                  <select
                    value={editingItem.term || '1° Cuatrimestre'}
                    onChange={(e) => setEditingItem({ ...editingItem, term: e.target.value })}
                    className="w-full rounded-xl border border-slate-200 p-2.5 text-xs text-slate-900 focus:border-indigo-600 bg-white"
                  >
                    <option value="1° Cuatrimestre">1° Cuatrimestre</option>
                    <option value="2° Cuatrimestre">2° Cuatrimestre</option>
                    <option value="Anual">Anual</option>
                  </select>
                </div>
              </div>

              {/* Notas de Parciales */}
              <div className="grid grid-cols-2 gap-3 bg-slate-50 p-3.5 rounded-2xl border border-slate-200">
                <div>
                  <label className="text-[10px] font-bold uppercase tracking-wider text-slate-700 block mb-1">
                    Nota 1° Parcial
                  </label>
                  <input
                    type="number"
                    min="1"
                    max="10"
                    step="0.5"
                    placeholder="Ej: 8"
                    value={editingItem.partial_1_grade ?? ''}
                    onChange={(e) =>
                      setEditingItem({
                        ...editingItem,
                        partial_1_grade: e.target.value ? parseFloat(e.target.value) : null,
                      })
                    }
                    className="w-full rounded-xl border border-slate-200 bg-white p-2 text-xs font-mono font-bold text-slate-900"
                  />
                </div>

                <div>
                  <label className="text-[10px] font-bold uppercase tracking-wider text-slate-700 block mb-1">
                    Recuperatorio 1° Parcial
                  </label>
                  <input
                    type="number"
                    min="1"
                    max="10"
                    step="0.5"
                    placeholder="Opcional"
                    value={editingItem.recuperatorio_1_grade ?? ''}
                    onChange={(e) =>
                      setEditingItem({
                        ...editingItem,
                        recuperatorio_1_grade: e.target.value ? parseFloat(e.target.value) : null,
                      })
                    }
                    className="w-full rounded-xl border border-slate-200 bg-white p-2 text-xs font-mono font-bold text-slate-900"
                  />
                </div>

                <div>
                  <label className="text-[10px] font-bold uppercase tracking-wider text-slate-700 block mb-1">
                    Nota 2° Parcial
                  </label>
                  <input
                    type="number"
                    min="1"
                    max="10"
                    step="0.5"
                    placeholder="Ej: 7"
                    value={editingItem.partial_2_grade ?? ''}
                    onChange={(e) =>
                      setEditingItem({
                        ...editingItem,
                        partial_2_grade: e.target.value ? parseFloat(e.target.value) : null,
                      })
                    }
                    className="w-full rounded-xl border border-slate-200 bg-white p-2 text-xs font-mono font-bold text-slate-900"
                  />
                </div>

                <div>
                  <label className="text-[10px] font-bold uppercase tracking-wider text-slate-700 block mb-1">
                    Recuperatorio 2° Parcial
                  </label>
                  <input
                    type="number"
                    min="1"
                    max="10"
                    step="0.5"
                    placeholder="Opcional"
                    value={editingItem.recuperatorio_2_grade ?? ''}
                    onChange={(e) =>
                      setEditingItem({
                        ...editingItem,
                        recuperatorio_2_grade: e.target.value ? parseFloat(e.target.value) : null,
                      })
                    }
                    className="w-full rounded-xl border border-slate-200 bg-white p-2 text-xs font-mono font-bold text-slate-900"
                  />
                </div>
              </div>

              {/* TPs, Asistencia y Final */}
              <div className="grid grid-cols-3 gap-3">
                <div>
                  <label className="text-[10px] font-bold uppercase tracking-wider text-slate-500 block mb-1">
                    Promedio TPs
                  </label>
                  <input
                    type="number"
                    min="1"
                    max="10"
                    step="0.5"
                    placeholder="Ej: 9"
                    value={editingItem.tp_average ?? ''}
                    onChange={(e) =>
                      setEditingItem({
                        ...editingItem,
                        tp_average: e.target.value ? parseFloat(e.target.value) : null,
                      })
                    }
                    className="w-full rounded-xl border border-slate-200 p-2 text-xs font-mono font-bold text-slate-900"
                  />
                </div>

                <div>
                  <label className="text-[10px] font-bold uppercase tracking-wider text-slate-500 block mb-1">
                    Asistencia (%)
                  </label>
                  <input
                    type="number"
                    min="0"
                    max="100"
                    placeholder="Ej: 90"
                    value={editingItem.attendance_percentage ?? 85}
                    onChange={(e) =>
                      setEditingItem({
                        ...editingItem,
                        attendance_percentage: e.target.value ? parseInt(e.target.value) : 85,
                      })
                    }
                    className="w-full rounded-xl border border-slate-200 p-2 text-xs font-mono font-bold text-slate-900"
                  />
                </div>

                <div>
                  <label className="text-[10px] font-bold uppercase tracking-wider text-slate-500 block mb-1">
                    Examen Final
                  </label>
                  <input
                    type="number"
                    min="1"
                    max="10"
                    step="0.5"
                    placeholder="Si rindió final"
                    value={editingItem.final_exam_grade ?? ''}
                    onChange={(e) =>
                      setEditingItem({
                        ...editingItem,
                        final_exam_grade: e.target.value ? parseFloat(e.target.value) : null,
                      })
                    }
                    className="w-full rounded-xl border border-slate-200 p-2 text-xs font-mono font-bold text-indigo-700"
                  />
                </div>
              </div>

              <div>
                <label className="text-[10px] font-bold uppercase tracking-wider text-slate-500 block mb-1">
                  Notas / Observaciones
                </label>
                <textarea
                  rows={2}
                  placeholder="Ej: P2 confirmado para el 28 de mayo. Rúbrica de TP incluye coloquio."
                  value={editingItem.notes || ''}
                  onChange={(e) => setEditingItem({ ...editingItem, notes: e.target.value })}
                  className="w-full rounded-xl border border-slate-200 p-2 text-xs text-slate-900 focus:border-indigo-600"
                />
              </div>

              <div className="flex items-center justify-between border-t border-slate-100 pt-3">
                {editingItem.id ? (
                  <button
                    type="button"
                    onClick={() => handleDeleteGrade(editingItem.id!)}
                    className="text-rose-600 hover:text-rose-800 font-bold text-xs cursor-pointer"
                  >
                    Eliminar Materia
                  </button>
                ) : (
                  <span />
                )}

                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => setShowEditModal(false)}
                    className="rounded-xl px-4 py-2 text-xs font-bold text-slate-600 hover:bg-slate-100 cursor-pointer"
                  >
                    Cancelar
                  </button>
                  <button
                    type="submit"
                    disabled={saving}
                    className="rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white px-5 py-2 text-xs font-bold shadow-md cursor-pointer disabled:opacity-50"
                  >
                    {saving ? 'Guardando...' : 'Guardar Calificación'}
                  </button>
                </div>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL 3: IMPRESIÓN OFICIAL A4 DE LIBRETA UNIVERSITARIA */}
      {showPrintModal && (
        <div
          className="fixed inset-0 z-[9999] flex items-center justify-center bg-slate-900/70 backdrop-blur-2xs p-4 overflow-y-auto"
          onClick={() => setShowPrintModal(false)}
        >
          <div
            className="w-full max-w-3xl rounded-3xl bg-white p-8 sm:p-10 shadow-2xl border border-slate-200 flex flex-col gap-6 text-slate-900 my-8 animate-in zoom-in-95"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Encabezado Formal INCADE */}
            <div className="flex items-center justify-between border-b-2 border-slate-900 pb-4">
              <div>
                <span className="text-[10px] font-black uppercase tracking-widest text-slate-500 block">
                  INSTITUTO SUPERIOR INCADE • SECRETARÍA DE ASUNTOS ESTUDIANTILES
                </span>
                <h2 className="text-lg font-black tracking-tight text-slate-900">
                  LIBRETA DE CALIFICACIONES & CERTIFICADO ANALÍTICO PROVISORIO
                </h2>
                <p className="text-xs text-slate-600 font-serif">
                  Estudiante: <strong>{data.student_name}</strong> • Carrera: <strong>{data.career_name}</strong>
                </p>
              </div>
              <button
                type="button"
                onClick={() => setShowPrintModal(false)}
                className="text-slate-400 hover:text-slate-700 font-bold p-1 rounded-lg hover:bg-slate-100 transition-colors cursor-pointer"
              >
                <IconClose className="w-4 h-4" />
              </button>
            </div>

            {/* Tabla Analítica Formal */}
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs border border-slate-300 font-serif">
                <thead className="bg-slate-100 border-b border-slate-300 text-[10px] font-bold uppercase">
                  <tr>
                    <th className="p-2 border-r border-slate-300">Asignatura</th>
                    <th className="p-2 border-r border-slate-300 text-center">Año</th>
                    <th className="p-2 border-r border-slate-300 text-center">P1</th>
                    <th className="p-2 border-r border-slate-300 text-center">P2</th>
                    <th className="p-2 border-r border-slate-300 text-center">Final</th>
                    <th className="p-2 border-r border-slate-300 text-center">Promedio</th>
                    <th className="p-2">Condición Oficial</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-200">
                  {data.grades.map((g, idx) => (
                    <tr key={idx}>
                      <td className="p-2 border-r border-slate-300 font-bold">{g.subject_name}</td>
                      <td className="p-2 border-r border-slate-300 text-center">{g.year_level}° Año</td>
                      <td className="p-2 border-r border-slate-300 text-center">{g.recuperatorio_1_grade ?? g.partial_1_grade ?? '—'}</td>
                      <td className="p-2 border-r border-slate-300 text-center">{g.recuperatorio_2_grade ?? g.partial_2_grade ?? '—'}</td>
                      <td className="p-2 border-r border-slate-300 text-center font-bold">{g.final_exam_grade ?? '—'}</td>
                      <td className="p-2 border-r border-slate-300 text-center font-bold">{g.calculated_average ?? '—'}</td>
                      <td className="p-2 uppercase text-[10px] font-bold">
                        {g.status.replace('_', ' ')}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Resumen Ponderado */}
            <div className="flex items-center justify-between border-t border-slate-300 pt-3 text-xs font-serif">
              <span>Materias Aprobadas: <strong>{data.approved_subjects_count}</strong> de {data.total_subjects_count}</span>
              <span className="text-sm font-bold">Promedio General Ponderado: <strong>{data.overall_gpa}</strong></span>
            </div>

            {/* Firmas */}
            <div className="grid grid-cols-2 gap-8 border-t border-slate-300 pt-8 mt-4 text-center font-serif text-[11px] text-slate-700">
              <div className="flex flex-col items-center">
                <div className="w-36 border-b border-slate-400 mb-1" />
                <span className="font-bold">Dirección de Alumnos y Bedelía</span>
                <span className="text-[10px] text-slate-500">Instituto Superior INCADE</span>
              </div>
              <div className="flex flex-col items-center">
                <div className="w-36 border-b border-slate-400 mb-1" />
                <span className="font-bold">Firma del Estudiante</span>
                <span className="text-[10px] text-slate-500">DNI / Legajo Académico</span>
              </div>
            </div>

            {/* Botones de Acción */}
            <div className="flex items-center justify-end gap-3 border-t border-slate-100 pt-4">
              <button
                type="button"
                onClick={() => setShowPrintModal(false)}
                className="rounded-xl px-4 py-2 text-xs font-bold text-slate-600 hover:bg-slate-100 cursor-pointer"
              >
                Cerrar
              </button>
              <button
                type="button"
                onClick={() => window.print()}
                className="inline-flex items-center gap-2 rounded-xl bg-slate-900 hover:bg-slate-800 text-white px-5 py-2.5 text-xs font-bold shadow-md transition-all cursor-pointer"
              >
                <IconPrinter className="w-4 h-4" />
                <span>Imprimir Libreta Oficial (A4)</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
