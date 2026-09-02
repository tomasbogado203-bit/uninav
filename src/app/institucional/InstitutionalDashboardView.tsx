'use client'

import { useState } from 'react'
import Link from 'next/link'
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
  IconChevronLeft,
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
    <div className="mx-auto max-w-[96rem] px-4 py-8 sm:px-6 flex flex-col gap-8 select-none">
      {/* Header Institucional */}
      <div className="rounded-3xl bg-gradient-to-br from-slate-950 via-indigo-950 to-slate-900 p-6 sm:p-8 text-white shadow-xl flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div className="flex flex-col gap-2">
          <div className="flex items-center gap-2 flex-wrap">
            <span className="inline-flex items-center gap-1.5 rounded-full bg-sky-500/20 px-3 py-1 text-xs font-bold text-sky-300 border border-sky-500/30">
              <span>Data Hub Institucional • Decanato & Secretaría Académica</span>
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
            {data.faculty_name} • Supervisión predictiva del rendimiento de cohortes, materias filtro e impacto presupuestario.
          </p>
        </div>

        <div className="flex items-center gap-3 shrink-0">
          <Link
            href="/"
            className="inline-flex items-center gap-1.5 rounded-2xl bg-white/10 hover:bg-white/20 border border-white/10 px-4 py-3 text-xs sm:text-sm font-bold text-white transition-colors backdrop-blur-xs shadow-2xs cursor-pointer"
          >
            <IconChevronLeft className="w-4 h-4 text-sky-300" />
            <span>Volver al Inicio</span>
          </Link>

          <button
            type="button"
            onClick={() => setShowConeauModal(true)}
            className="rounded-2xl bg-indigo-600 hover:bg-indigo-700 text-white px-5 py-3 text-xs sm:text-sm font-bold shadow-lg transition-all flex items-center gap-2 cursor-pointer"
          >
            <IconDocument className="w-4 h-4" />
            <span>Exportar Informe CONEAU</span>
          </button>
        </div>
      </div>

      {/* 4 KPIs Ejecutivos de Nivel Directivo */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="rounded-3xl border border-slate-200 bg-white p-5 shadow-xs flex flex-col gap-2">
          <span className="text-xs font-bold uppercase tracking-wider text-slate-400">
            Ingresantes Monitoreados
          </span>
          <div className="flex items-baseline justify-between">
            <span className="text-2xl sm:text-3xl font-black text-slate-900">
              {data.total_students.toLocaleString()}
            </span>
            <span className="text-[10px] font-bold text-indigo-700 bg-indigo-50 border border-indigo-200 px-2 py-0.5 rounded-full">
              4 Carreras
            </span>
          </div>
          <span className="text-[11px] text-slate-500">100% de la cohorte 2026 activa</span>
        </div>

        <div className="rounded-3xl border border-slate-200 bg-white p-5 shadow-xs flex flex-col gap-2">
          <span className="text-xs font-bold uppercase tracking-wider text-slate-400">
            Tasa de Retención Proyectada
          </span>
          <div className="flex items-baseline justify-between">
            <span className="text-2xl sm:text-3xl font-black text-emerald-600">
              {data.retention_rate_projected}%
            </span>
            <span className="text-[10px] font-bold text-emerald-700 bg-emerald-50 border border-emerald-200 px-2 py-0.5 rounded-full">
              ▲ +26.4% vs 2024
            </span>
          </div>
          <span className="text-[11px] text-slate-500">Objetivo institucional: &gt; 80%</span>
        </div>

        <div className="rounded-3xl border border-slate-200 bg-white p-5 shadow-xs flex flex-col gap-2">
          <span className="text-xs font-bold uppercase tracking-wider text-slate-400">
            Horas de Foco IoT Registradas
          </span>
          <div className="flex items-baseline justify-between">
            <span className="text-2xl sm:text-3xl font-black text-slate-900">
              {data.total_study_hours_iot.toLocaleString()} hs
            </span>
            <span className="text-[10px] font-bold text-amber-700 bg-amber-50 border border-amber-200 px-2 py-0.5 rounded-full">
              {data.study_habits.iot_active_percentage}% Adhesión
            </span>
          </div>
          <span className="text-[11px] text-slate-500">Estudio autónomo con semáforo Pomodoro</span>
        </div>

        <div className="rounded-3xl border border-slate-200 bg-white p-5 shadow-xs flex flex-col gap-2">
          <span className="text-xs font-bold uppercase tracking-wider text-slate-400">
            Ahorro Institucional Estimado
          </span>
          <div className="flex items-baseline justify-between">
            <span className="text-2xl sm:text-3xl font-black text-indigo-600">
              $25.5M
            </span>
            <span className="text-[10px] font-bold text-indigo-700 bg-indigo-50 border border-indigo-200 px-2 py-0.5 rounded-full">
              148 alumnos
            </span>
          </div>
          <span className="text-[11px] text-slate-500">Costos evitados por deserción temprana</span>
        </div>
      </div>

      {/* Grid Principal: Semáforo de Materias Filtro + Comparativa Interanual */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
        {/* Columna Izquierda (8 Cols): Semáforo de Materias Filtro */}
        <div className="lg:col-span-8 flex flex-col gap-6">
          <div className="rounded-3xl border border-slate-200/80 bg-white p-6 shadow-xs flex flex-col gap-5">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-100 pb-4">
              <div>
                <h3 className="text-base font-black text-slate-900">
                  🚨 Semáforo de Alerta Temprana por Cátedra (Materias Filtro)
                </h3>
                <p className="text-xs text-slate-500 mt-0.5">
                  Identificación de cuellos de botella académicos y semanas críticas de abandono.
                </p>
              </div>

              {/* Filtros de Riesgo */}
              <div className="flex items-center gap-1.5 self-start sm:self-auto">
                <button
                  type="button"
                  onClick={() => setFilterRisk('ALL')}
                  className={`px-3 py-1 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                    filterRisk === 'ALL'
                      ? 'bg-slate-900 text-white'
                      : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                  }`}
                >
                  Todas ({data.subjects_risk.length})
                </button>
                <button
                  type="button"
                  onClick={() => setFilterRisk('ALTO')}
                  className={`px-3 py-1 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                    filterRisk === 'ALTO'
                      ? 'bg-red-600 text-white'
                      : 'bg-red-50 text-red-700 hover:bg-red-100'
                  }`}
                >
                  🔴 Alto
                </button>
                <button
                  type="button"
                  onClick={() => setFilterRisk('MEDIO')}
                  className={`px-3 py-1 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                    filterRisk === 'MEDIO'
                      ? 'bg-amber-600 text-white'
                      : 'bg-amber-50 text-amber-700 hover:bg-amber-100'
                  }`}
                >
                  🟡 Medio
                </button>
                <button
                  type="button"
                  onClick={() => setFilterRisk('BAJO')}
                  className={`px-3 py-1 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                    filterRisk === 'BAJO'
                      ? 'bg-emerald-600 text-white'
                      : 'bg-emerald-50 text-emerald-700 hover:bg-emerald-100'
                  }`}
                >
                  🟢 Bajo
                </button>
              </div>
            </div>

            {/* Tabla de Materias con Alerta */}
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs text-slate-600">
                <thead className="bg-slate-50 border-b border-slate-200 text-[10px] font-bold uppercase tracking-wider text-slate-500">
                  <tr>
                    <th className="px-4 py-3">Materia</th>
                    <th className="px-4 py-3">Nivel de Riesgo</th>
                    <th className="px-4 py-3">Punto de Quiebre / Abandono</th>
                    <th className="px-4 py-3">Concepto Cuello de Botella</th>
                    <th className="px-4 py-3">RAG Activo</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {filteredSubjects.map((sub, idx) => (
                    <tr key={idx} className="hover:bg-slate-50/80 transition-colors">
                      <td className="px-4 py-3.5 font-bold text-slate-900">
                        <div>{sub.subject_name}</div>
                        <div className="text-[10px] font-normal text-slate-400">
                          {sub.enrolled_students} alumnos inscriptos
                        </div>
                      </td>
                      <td className="px-4 py-3.5">
                        {sub.risk_level === 'ALTO' && (
                          <span className="inline-flex items-center gap-1 rounded-full bg-red-50 border border-red-200 px-2.5 py-0.5 text-[10px] font-bold text-red-700">
                            🔴 RIESGO ALTO
                          </span>
                        )}
                        {sub.risk_level === 'MEDIO' && (
                          <span className="inline-flex items-center gap-1 rounded-full bg-amber-50 border border-amber-200 px-2.5 py-0.5 text-[10px] font-bold text-amber-700">
                            🟡 RIESGO MEDIO
                          </span>
                        )}
                        {sub.risk_level === 'BAJO' && (
                          <span className="inline-flex items-center gap-1 rounded-full bg-emerald-50 border border-emerald-200 px-2.5 py-0.5 text-[10px] font-bold text-emerald-700">
                            🟢 ESTABLE
                          </span>
                        )}
                      </td>
                      <td className="px-4 py-3.5 font-medium text-slate-700">
                        {sub.drop_off_week}
                      </td>
                      <td className="px-4 py-3.5 font-medium text-slate-900">
                        {sub.bottleneck_concept}
                      </td>
                      <td className="px-4 py-3.5 font-mono font-bold text-indigo-600">
                        {sub.rag_engagement_rate}%
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          {/* Matriz de Retención por Carrera */}
          <div className="rounded-3xl border border-slate-200/80 bg-white p-6 shadow-xs flex flex-col gap-4">
            <h3 className="text-base font-black text-slate-900">
              📊 Distribución de Retención por Titulación / Carrera
            </h3>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {data.career_breakdown.map((c, idx) => (
                <div
                  key={idx}
                  className="rounded-2xl border border-slate-200 bg-slate-50/50 p-4 flex flex-col justify-between gap-3"
                >
                  <div className="flex items-start justify-between gap-2">
                    <span className="font-bold text-xs text-slate-900">
                      {c.career}
                    </span>
                    <span className="text-[10px] font-bold text-indigo-700 bg-indigo-50 border border-indigo-200 px-2 py-0.5 rounded-full shrink-0">
                      {c.students} alumnos
                    </span>
                  </div>

                  <div className="flex flex-col gap-1.5">
                    <div className="flex items-center justify-between text-xs">
                      <span className="text-slate-500 font-medium">Retención Proyectada</span>
                      <span className="font-black text-slate-900">{c.retention_rate}%</span>
                    </div>
                    <div className="h-2 w-full rounded-full bg-slate-200 overflow-hidden">
                      <div
                        className="h-full rounded-full bg-indigo-600 transition-all duration-500"
                        style={{ width: `${c.retention_rate}%` }}
                      />
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Columna Derecha (4 Cols): Comparativa Interanual & Hábitos de Concentración */}
        <div className="lg:col-span-4 flex flex-col gap-6">
          {/* Comparativa Histórica */}
          <div className="rounded-3xl border border-slate-200/80 bg-white p-6 shadow-xs flex flex-col gap-5">
            <div className="flex items-center justify-between">
              <h3 className="text-sm font-black text-slate-900 uppercase tracking-wider text-[11px]">
                Evolución Histórica de Retención
              </h3>
              <span className="text-[10px] font-bold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-md">
                1er Año
              </span>
            </div>

            <div className="flex flex-col gap-4">
              {data.historical_retention.map((item, idx) => (
                <div key={idx} className="flex flex-col gap-1.5">
                  <div className="flex items-center justify-between text-xs">
                    <span className="font-bold text-slate-900">{item.year}</span>
                    <span className="font-black text-indigo-600">{item.rate}%</span>
                  </div>
                  <div className="h-2.5 w-full rounded-full bg-slate-100 overflow-hidden">
                    <div
                      className={`h-full rounded-full transition-all duration-700 ${
                        item.year.includes('2026') ? 'bg-emerald-500' : 'bg-slate-400'
                      }`}
                      style={{ width: `${item.rate}%` }}
                    />
                  </div>
                  <div className="flex items-center justify-between text-[10px] text-slate-500">
                    <span>{item.system}</span>
                    <span className="font-bold text-slate-700">{item.status}</span>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Hábitos de Estudio & IoT */}
          <div className="rounded-3xl border border-slate-200/80 bg-white p-6 shadow-xs flex flex-col gap-4">
            <h3 className="text-sm font-black text-slate-900 uppercase tracking-wider text-[11px]">
              Telemetría de Concentración & Hardware IoT
            </h3>

            <div className="flex flex-col gap-3">
              <div className="p-3.5 rounded-2xl bg-indigo-50/70 border border-indigo-100 flex flex-col gap-1">
                <span className="text-[10px] font-bold uppercase tracking-wider text-indigo-800">
                  Pico de Estudio de la Facultad
                </span>
                <span className="text-xs font-bold text-indigo-950">
                  {data.study_habits.peak_study_hours}
                </span>
              </div>

              <div className="p-3.5 rounded-2xl bg-slate-50 border border-slate-200 flex items-center justify-between">
                <span className="text-xs font-bold text-slate-700">Promedio de Foco Diario</span>
                <span className="font-black text-sm text-slate-900">
                  {data.study_habits.avg_daily_focus_hours} hs / alumno
                </span>
              </div>
            </div>

            <p className="text-[11px] text-slate-500 leading-relaxed">
              Métricas sincronizadas automáticamente desde las lámparas de estudio IoT y sesiones de Pomodoro web.
            </p>
          </div>
        </div>
      </div>

      {/* Modal Imprimible A4 de Informe CONEAU */}
      {showConeauModal && (
        <div
          className="fixed inset-0 z-[9999] flex items-center justify-center bg-slate-900/70 backdrop-blur-2xs p-4 overflow-y-auto"
          onClick={() => setShowConeauModal(false)}
        >
          <div
            className="w-full max-w-3xl rounded-3xl bg-white p-8 sm:p-10 shadow-2xl border border-slate-200 flex flex-col gap-6 text-slate-900 my-8 animate-in zoom-in-95"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Encabezado Formal CONEAU */}
            <div className="flex items-center justify-between border-b-2 border-slate-900 pb-4">
              <div>
                <span className="text-[10px] font-black uppercase tracking-widest text-slate-500 block">
                  REPÚBLICA ARGENTINA • SISTEMA UNIVERSITARIO NACIONAL
                </span>
                <h2 className="text-lg font-black tracking-tight text-slate-900">
                  INFORME DE INNOVACIÓN PEDAGÓGICA Y RETENCIÓN ESTUDIANTIL
                </h2>
                <p className="text-xs text-slate-600 font-serif">
                  {data.faculty_name} — Período Académico {data.academic_period}
                </p>
              </div>
              <button
                type="button"
                onClick={() => setShowConeauModal(false)}
                className="text-slate-400 hover:text-slate-700 font-bold text-sm"
              >
                ✕
              </button>
            </div>

            {/* Cuerpo del Informe */}
            <div className="flex flex-col gap-4 text-xs leading-relaxed text-slate-700 font-serif">
              <p>
                <strong>1. OBJETO Y ALCANCE:</strong> El presente documento certifica la implementación de la plataforma <strong>UniNav</strong> para la reducción del desgranamiento y abandono en el primer año universitario, integrando tutoría socrática mediante inteligencia artificial generativa y hardware IoT de concentración de código abierto.
              </p>

              <p>
                <strong>2. INDICADORES DE COHORTE:</strong> Durante el ciclo lectivo evaluado, se registraron <strong>{data.total_students} estudiantes ingresantes</strong>, alcanzando una tasa de retención proyectada del <strong>{data.retention_rate_projected}%</strong>, lo que representa una mejora de <strong>+26.4 puntos porcentuales</strong> respecto al promedio histórico decenal.
              </p>

              <div className="rounded-xl border border-slate-300 p-4 bg-slate-50 not-italic font-sans">
                <span className="font-bold text-slate-900 block mb-2 text-xs">
                  Resumen de Materias Críticas de Primer Año:
                </span>
                <ul className="list-disc pl-5 flex flex-col gap-1 text-[11px] text-slate-700">
                  {data.subjects_risk.map((s, idx) => (
                    <li key={idx}>
                      <strong>{s.subject_name}:</strong> Riesgo {s.risk_level} — Cuello de botella detectado en <em>{s.bottleneck_concept}</em>. Adhesión RAG: {s.rag_engagement_rate}%.
                    </li>
                  ))}
                </ul>
              </div>

              <p>
                <strong>3. DICTAMEN DE MODERNIZACIÓN DIGITAL:</strong> Se homologa el uso del Tutor Socrático con citas bibliográficas obligatorias como herramienta de acompañamiento institucional en conformidad con las pautas de calidad educativa de la Comisión Nacional de Evaluación y Acreditación Universitaria (CONEAU).
              </p>
            </div>

            {/* Firmas de Autoridades */}
            <div className="grid grid-cols-2 gap-8 border-t border-slate-300 pt-8 mt-4 text-center font-serif text-[11px] text-slate-700">
              <div className="flex flex-col items-center">
                <div className="w-36 border-b border-slate-400 mb-1" />
                <span className="font-bold">Secretaría Académica</span>
                <span className="text-[10px] text-slate-500">Dirección de Acreditación</span>
              </div>
              <div className="flex flex-col items-center">
                <div className="w-36 border-b border-slate-400 mb-1" />
                <span className="font-bold">Decanato de Facultad</span>
                <span className="text-[10px] text-slate-500">{data.faculty_name}</span>
              </div>
            </div>

            {/* Botones de Acción */}
            <div className="flex items-center justify-end gap-3 border-t border-slate-100 pt-4">
              <button
                type="button"
                onClick={() => setShowConeauModal(false)}
                className="rounded-xl px-4 py-2 text-xs font-bold text-slate-600 hover:bg-slate-100"
              >
                Cerrar
              </button>
              <button
                type="button"
                onClick={handlePrint}
                className="inline-flex items-center gap-2 rounded-xl bg-slate-900 hover:bg-slate-800 text-white px-5 py-2.5 text-xs font-bold shadow-md transition-all cursor-pointer"
              >
                <IconPrinter className="w-4 h-4" />
                <span>Imprimir Informe Oficial (A4)</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
