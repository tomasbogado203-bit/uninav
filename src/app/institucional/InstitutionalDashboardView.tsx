'use client'

import { useState } from 'react'
import { FacultyAnalyticsData } from './actions'
import RoleSwitcherPill from '@/components/RoleSwitcherPill'
import {
  IconUsers,
  IconFlame,
  IconDocument,
  IconSparkles,
  IconCheck,
  IconPrinter,
  IconClipboard,
  IconLightbulb,
} from '@/components/icons'

interface InstitutionalDashboardViewProps {
  data: FacultyAnalyticsData
}

export default function InstitutionalDashboardView({
  data,
}: InstitutionalDashboardViewProps) {
  const [showConeauModal, setShowConeauModal] = useState(false)
  const [filterRisk, setFilterRisk] = useState<'ALL' | 'ALTO' | 'MEDIO' | 'BAJO'>('ALL')

  const filteredSubjects = data.subjects_risk.filter((s) => {
    if (filterRisk === 'ALL') return true
    return s.risk_level === filterRisk
  })

  const handlePrint = () => {
    window.print()
  }

  return (
    <div className="mx-auto max-w-[96rem] px-4 py-8 sm:px-6 flex flex-col gap-8">
      {/* Header Institucional */}
      <div className="rounded-3xl bg-gradient-to-br from-slate-950 via-indigo-950 to-slate-900 p-6 sm:p-8 text-white shadow-xl flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div className="flex flex-col gap-2">
          <div className="flex items-center gap-2 flex-wrap">
            <span className="inline-flex items-center gap-1.5 rounded-full bg-indigo-500/20 px-3 py-1 text-xs font-bold text-indigo-300 border border-indigo-500/30">
              <span>Panel de Decanato & Secretaría Académica</span>
            </span>
            <RoleSwitcherPill currentRole="dean" />
            <span className="text-xs text-slate-400 font-medium">
              {data.academic_period}
            </span>
          </div>


          <h1 className="text-2xl sm:text-3xl font-black text-white tracking-tight leading-tight">
            Centro de Retención & Alerta Temprana
          </h1>
          <p className="text-xs sm:text-sm text-slate-300 max-w-2xl leading-relaxed">
            {data.faculty_name} • Monitoreo predictivo de deserción estudiantil y telemetría de estudio en tiempo real.
          </p>
        </div>

        <div className="flex items-center gap-3 shrink-0">
          <button
            type="button"
            onClick={() => setShowConeauModal(true)}
            className="rounded-2xl bg-indigo-600 hover:bg-indigo-700 text-white px-5 py-3 text-xs sm:text-sm font-bold shadow-lg transition-all flex items-center gap-2 cursor-pointer"
          >
            <IconDocument className="w-4 h-4" />
            <span>Exportar Informe de Acreditación</span>
          </button>
        </div>
      </div>

      {/* 4 KPIs Ejecutivos */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="rounded-3xl border border-slate-200 bg-white p-5 shadow-xs flex flex-col gap-2">
          <span className="text-xs font-bold uppercase tracking-wider text-slate-400">
            Ingresantes Activos
          </span>
          <div className="flex items-baseline gap-2">
            <span className="text-3xl font-black text-slate-900">
              {data.total_students.toLocaleString('es-AR')}
            </span>
            <span className="text-xs font-bold text-emerald-600">+12% vs 2025</span>
          </div>
          <span className="text-[11px] text-slate-500 font-medium">
            Registrados en materias de 1er año
          </span>
        </div>

        <div className="rounded-3xl border border-slate-200 bg-white p-5 shadow-xs flex flex-col gap-2">
          <span className="text-xs font-bold uppercase tracking-wider text-slate-400">
            Retención Proyectada
          </span>
          <div className="flex items-baseline gap-2">
            <span className="text-3xl font-black text-indigo-600">
              {data.retention_rate_projected}%
            </span>
            <span className="text-xs font-bold text-emerald-600">▲ +8.4 pts</span>
          </div>
          <span className="text-[11px] text-slate-500 font-medium">
            Estimada por actividad RAG y simulacros
          </span>
        </div>

        <div className="rounded-3xl border border-slate-200 bg-white p-5 shadow-xs flex flex-col gap-2">
          <span className="text-xs font-bold uppercase tracking-wider text-slate-400">
            Horas de Estudio Foco (IoT)
          </span>
          <div className="flex items-baseline gap-2">
            <span className="text-3xl font-black text-slate-900">
              {data.total_study_hours_iot.toLocaleString('es-AR')} hs
            </span>
            <span className="text-xs font-bold text-amber-600 font-mono">2.6h/día</span>
          </div>
          <span className="text-[11px] text-slate-500 font-medium">
            84% con Semáforo de Estudio activo
          </span>
        </div>

        <div className="rounded-3xl border border-slate-200 bg-white p-5 shadow-xs flex flex-col gap-2">
          <span className="text-xs font-bold uppercase tracking-wider text-slate-400">
            Materias en Alerta Roja
          </span>
          <div className="flex items-baseline gap-2">
            <span className="text-3xl font-black text-rose-600">
              {data.critical_subjects_count}
            </span>
            <span className="text-xs font-bold text-rose-600">Atención Cátedra</span>
          </div>
          <span className="text-[11px] text-slate-500 font-medium">
            Análisis I y Física I con mayor rezago
          </span>
        </div>
      </div>

      {/* 🚨 SEMÁFORO DE ALERTA TEMPRANA POR MATERIA */}
      <div className="rounded-3xl border border-slate-200 bg-white p-6 sm:p-8 shadow-xs flex flex-col gap-6">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h2 className="text-lg font-black text-slate-900 leading-tight">
              Semáforo de Alerta Temprana por Materia (Riesgo de Recursado)
            </h2>
            <p className="text-xs text-slate-500">
              Clasificación predictiva basada en consultas de bloqueo al Tutor IA, horas de concentración y simuladores.
            </p>
          </div>

          {/* Filtro de Riesgo */}
          <div className="flex items-center gap-1.5 bg-slate-100 p-1 rounded-2xl">
            {(['ALL', 'ALTO', 'MEDIO', 'BAJO'] as const).map((r) => (
              <button
                key={r}
                type="button"
                onClick={() => setFilterRisk(r)}
                className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                  filterRisk === r
                    ? 'bg-white text-slate-900 shadow-2xs'
                    : 'text-slate-500 hover:text-slate-900'
                }`}
              >
                {r === 'ALL' ? 'Todas' : r}
              </button>
            ))}
          </div>
        </div>

        {/* Tabla del Semáforo */}
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs text-slate-700">
            <thead className="border-b border-slate-200 text-[10px] font-black uppercase tracking-wider text-slate-400 bg-slate-50/50">
              <tr>
                <th className="py-3.5 px-4 rounded-l-xl">Materia</th>
                <th className="py-3.5 px-4 text-center">Alumnos</th>
                <th className="py-3.5 px-4 text-center">Uso RAG %</th>
                <th className="py-3.5 px-4 text-center">Simulacro Aprob.</th>
                <th className="py-3.5 px-4 text-center">Nivel de Riesgo</th>
                <th className="py-3.5 px-4 rounded-r-xl">Factores Críticos Detectados</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filteredSubjects.map((s, idx) => (
                <tr key={idx} className="hover:bg-slate-50/80 transition-colors">
                  <td className="py-4 px-4 font-bold text-slate-900 text-sm">
                    {s.subject_name}
                  </td>
                  <td className="py-4 px-4 text-center font-medium text-slate-600">
                    {s.enrolled_students}
                  </td>
                  <td className="py-4 px-4 text-center font-semibold text-indigo-700">
                    {s.rag_engagement_rate}%
                  </td>
                  <td className="py-4 px-4 text-center font-semibold text-slate-900">
                    {s.simulated_pass_rate}%
                  </td>
                  <td className="py-4 px-4 text-center">
                    <span
                      className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[10px] font-black tracking-wide ${
                        s.risk_level === 'ALTO'
                          ? 'bg-rose-50 text-rose-700 border border-rose-200'
                          : s.risk_level === 'MEDIO'
                          ? 'bg-amber-50 text-amber-700 border border-amber-200'
                          : 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                      }`}
                    >
                      {s.risk_level === 'ALTO' ? '🔴 ALTO' : s.risk_level === 'MEDIO' ? '🟡 MEDIO' : '🟢 BAJO'}
                    </span>
                  </td>
                  <td className="py-4 px-4 text-slate-600 text-[11px]">
                    {s.risk_factors.join(' • ')}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Modal de Informe para CONEAU / Acreditación */}
      {showConeauModal && (
        <div
          className="fixed inset-0 z-[9999] flex items-center justify-center bg-slate-900/80 backdrop-blur-xs p-4 animate-in fade-in"
          onClick={() => setShowConeauModal(false)}
        >
          <div
            className="w-full max-w-4xl max-h-[90vh] overflow-y-auto rounded-3xl bg-white p-6 sm:p-10 shadow-2xl border border-slate-200 flex flex-col gap-6 animate-in zoom-in-95 print:p-0 print:border-none print:shadow-none print:max-h-none print:overflow-visible"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Header del Informe */}
            <div className="flex items-center justify-between border-b-2 border-slate-900 pb-4 print:border-b-2">
              <div>
                <span className="text-[10px] font-black uppercase tracking-widest text-indigo-700 bg-indigo-50 border border-indigo-200 px-2.5 py-1 rounded-full">
                  Reporte de Acreditación Institucional
                </span>
                <h2 className="text-xl sm:text-2xl font-black text-slate-950 mt-2">
                  Informe de Retención y Rendimiento Académico
                </h2>
                <p className="text-xs text-slate-600 font-medium">
                  {data.faculty_name} • {data.academic_period}
                </p>
              </div>

              <div className="flex items-center gap-2 print:hidden">
                <button
                  type="button"
                  onClick={handlePrint}
                  className="rounded-xl bg-indigo-600 text-white px-4 py-2 text-xs font-bold shadow-xs hover:bg-indigo-700 flex items-center gap-1.5 cursor-pointer"
                >
                  <IconPrinter className="w-4 h-4" />
                  <span>Imprimir A4 / PDF</span>
                </button>
                <button
                  type="button"
                  onClick={() => setShowConeauModal(false)}
                  className="rounded-xl bg-slate-100 p-2 text-slate-500 hover:bg-slate-200 font-bold"
                >
                  ✕
                </button>
              </div>
            </div>

            {/* Cuerpo del Informe */}
            <div className="flex flex-col gap-6 text-xs text-slate-800 leading-relaxed font-sans">
              <div className="rounded-2xl bg-slate-50 border border-slate-200 p-5 flex flex-col gap-2">
                <h3 className="font-bold text-sm text-slate-900 uppercase">
                  1. Resumen Ejecutivo de Retención
                </h3>
                <p>
                  Durante el presente ciclo lectivo, se implementó el ecosistema <strong>UniNav</strong> para asistir a los {data.total_students.toLocaleString('es-AR')} ingresantes de primer año. La tasa de retención proyectada alcanza el <strong>{data.retention_rate_projected}%</strong>, lo que representa una mejora de 8.4 puntos porcentuales frente a los promedios históricos de la facultad.
                </p>
              </div>

              <div className="flex flex-col gap-2">
                <h3 className="font-bold text-sm text-slate-900 uppercase">
                  2. Matriz de Materias Críticas de 1er Año
                </h3>
                <div className="border border-slate-200 rounded-xl overflow-hidden">
                  <table className="w-full text-left text-[11px]">
                    <thead className="bg-slate-100 font-bold text-slate-900">
                      <tr>
                        <th className="p-2.5">Materia</th>
                        <th className="p-2.5 text-center">Inscriptos</th>
                        <th className="p-2.5 text-center">Riesgo</th>
                        <th className="p-2.5">Acción Preventiva Recomendada</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-200">
                      {data.subjects_risk.map((sub, i) => (
                        <tr key={i}>
                          <td className="p-2.5 font-bold">{sub.subject_name}</td>
                          <td className="p-2.5 text-center">{sub.enrolled_students}</td>
                          <td className="p-2.5 text-center font-bold">
                            {sub.risk_level === 'ALTO' ? '🔴 ALTO' : sub.risk_level === 'MEDIO' ? '🟡 MEDIO' : '🟢 BAJO'}
                          </td>
                          <td className="p-2.5">{sub.risk_factors[0]}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>

              <div className="rounded-2xl bg-indigo-50/60 border border-indigo-100 p-4">
                <h3 className="font-bold text-xs text-indigo-950 uppercase mb-1">
                  3. Dictamen de Innovación Tecnológica
                </h3>
                <p className="text-[11px] text-slate-700">
                  La integración del Tutor Socrático RAG y el hardware IoT de Concentración permitió acumular {data.total_study_hours_iot.toLocaleString('es-AR')} horas de estudio verificadas, validando el cumplimiento de estándares de calidad educativa y seguimiento continuo del alumno.
                </p>
              </div>
            </div>

            {/* Firmas Institucionales */}
            <div className="grid grid-cols-2 gap-8 pt-8 border-t border-slate-200 text-center text-xs text-slate-500">
              <div className="flex flex-col items-center">
                <div className="w-48 border-b border-slate-400 mb-1"></div>
                <span className="font-bold text-slate-800">Secretaría Académica</span>
                <span className="text-[10px]">{data.faculty_name}</span>
              </div>
              <div className="flex flex-col items-center">
                <div className="w-48 border-b border-slate-400 mb-1"></div>
                <span className="font-bold text-slate-800">Dirección de Cátedras & Tutorías</span>
                <span className="text-[10px]">UniNav Academic Analytics</span>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
