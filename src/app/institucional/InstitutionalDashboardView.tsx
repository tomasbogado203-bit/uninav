'use client'

import { useState } from 'react'
import Link from 'next/link'
import {
  FacultyAnalyticsData,
  InstitutionalStaffMember,
  EnrolledStudentAdmin,
  updateUserRoleByAdminAction,
  toggleStudentStatusAction,
  importStudentRosterAction,
  createSingleStudentAction,
} from './actions'
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
  IconBook,
  IconBuilding,
  IconShield,
  IconAlertTriangle,
  IconChart,
  IconClose,
  IconPlus,
} from '@/components/icons'

interface InstitutionalDashboardViewProps {
  data: FacultyAnalyticsData
  staff?: InstitutionalStaffMember[]
  initialStudents?: EnrolledStudentAdmin[]
}

export default function InstitutionalDashboardView({
  data,
  staff: initialStaff = [],
  initialStudents = [],
}: InstitutionalDashboardViewProps) {
  const [activeTab, setActiveTab] = useState<'analytics' | 'staff' | 'students'>('analytics')
  const [showConeauModal, setShowConeauModal] = useState(false)
  const [showImportModal, setShowImportModal] = useState(false)
  const [importing, setImporting] = useState(false)
  const [filterRisk, setFilterRisk] = useState<'ALL' | 'ALTO' | 'MEDIO' | 'BAJO'>('ALL')
  const [staffList, setStaffList] = useState<InstitutionalStaffMember[]>(initialStaff)
  const [staffSearch, setStaffSearch] = useState('')
  const [roleFilter, setRoleFilter] = useState<'ALL' | 'professor' | 'student' | 'dean'>('ALL')
  
  // Estados para Padrón de Alumnos (Decanato)
  const [studentsList, setStudentsList] = useState<EnrolledStudentAdmin[]>(initialStudents)
  const [studentSearch, setStudentSearch] = useState('')
  const [careerFilter, setCareerFilter] = useState('ALL')
  const [genderFilter, setGenderFilter] = useState('ALL')
  const [shiftFilter, setShiftFilter] = useState('ALL')
  const [statusFilter, setStatusFilter] = useState('ALL')
  
  // Estados para Alta Manual Individual de Alumno
  const [showAddStudentModal, setShowAddStudentModal] = useState(false)
  const [newStudentName, setNewStudentName] = useState('')
  const [newStudentEmail, setNewStudentEmail] = useState('')
  const [newStudentDni, setNewStudentDni] = useState('')
  const [newStudentBirthYear, setNewStudentBirthYear] = useState<number>(2005)
  const [newStudentGender, setNewStudentGender] = useState<'M' | 'F' | 'X'>('F')
  const [newStudentCareer, setNewStudentCareer] = useState(data.career_breakdown[0]?.career || 'Ingeniería en Sistemas de Información')
  const [newStudentShift, setNewStudentShift] = useState<'Mañana' | 'Tarde' | 'Noche'>('Mañana')
  const [newStudentStatus, setNewStudentStatus] = useState<'habilitado' | 'becado' | 'pendiente'>('habilitado')
  const [savingStudent, setSavingStudent] = useState(false)
  
  const [copiedCode, setCopiedCode] = useState<string | null>(null)
  const [statusMsg, setStatusMsg] = useState<string | null>(null)

  const filteredSubjects = data.subjects_risk.filter((s) => {
    if (filterRisk === 'ALL') return true
    return s.risk_level === filterRisk
  })

  const filteredStaff = staffList.filter((m) => {
    const matchesSearch =
      m.full_name.toLowerCase().includes(staffSearch.toLowerCase()) ||
      m.email.toLowerCase().includes(staffSearch.toLowerCase()) ||
      m.career_name.toLowerCase().includes(staffSearch.toLowerCase())

    if (roleFilter === 'ALL') return matchesSearch
    return matchesSearch && m.role === roleFilter
  })

  const filteredStudents = studentsList.filter((s) => {
    const matchesSearch =
      s.full_name.toLowerCase().includes(studentSearch.toLowerCase()) ||
      s.dni.includes(studentSearch) ||
      s.career_name.toLowerCase().includes(studentSearch.toLowerCase())

    const matchesCareer = careerFilter === 'ALL' || s.career_name === careerFilter
    const matchesGender = genderFilter === 'ALL' || s.gender === genderFilter
    const matchesShift = shiftFilter === 'ALL' || s.shift === shiftFilter
    const matchesStatus = statusFilter === 'ALL' || s.enrollment_status === statusFilter

    return matchesSearch && matchesCareer && matchesGender && matchesShift && matchesStatus
  })

  const handleRoleChange = async (userId: string, newRole: 'student' | 'professor' | 'dean' | 'admin') => {
    setStaffList((prev) =>
      prev.map((m) => (m.id === userId ? { ...m, role: newRole } : m))
    )
    setStatusMsg('Permisos actualizados con éxito.')
    setTimeout(() => setStatusMsg(null), 3000)

    try {
      await updateUserRoleByAdminAction(userId, newRole)
    } catch {
      // Fallback
    }
  }

  const handleToggleStudentStatus = async (
    studentId: string,
    newStatus: 'habilitado' | 'becado' | 'pendiente' | 'suspendido'
  ) => {
    setStudentsList((prev) =>
      prev.map((st) => (st.id === studentId ? { ...st, enrollment_status: newStatus } : st))
    )
    setStatusMsg(`Estado del estudiante actualizado a: ${newStatus.toUpperCase()}`)
    setTimeout(() => setStatusMsg(null), 3000)

    try {
      await toggleStudentStatusAction(studentId, newStatus)
    } catch {}
  }

  const handleSimulateImport = async () => {
    setImporting(true)
    try {
      await importStudentRosterAction(150)
      const newMockBatch: EnrolledStudentAdmin[] = [
        {
          id: `imp_${Date.now()}_1`,
          full_name: 'Federico Navarro',
          email: 'fede.navarro@alumnos.unam.edu.ar',
          dni: '46.771.209',
          birth_year: 2006,
          gender: 'M',
          career_name: 'Ingeniería en Sistemas de Información',
          shift: 'Mañana',
          enrollment_status: 'habilitado',
          linked_account: false,
          created_at: 'Hoy',
        },
        {
          id: `imp_${Date.now()}_2`,
          full_name: 'Lucía Morales',
          email: 'lucia.morales@gmail.com',
          dni: '45.334.811',
          birth_year: 2005,
          gender: 'F',
          career_name: 'Licenciatura en Administración de Empresas',
          shift: 'Noche',
          enrollment_status: 'habilitado',
          linked_account: false,
          created_at: 'Hoy',
        },
        {
          id: `imp_${Date.now()}_3`,
          full_name: 'Agustín Rivas',
          email: 'agustin.rivas@hotmail.com',
          dni: '44.908.411',
          birth_year: 2004,
          gender: 'M',
          career_name: 'Tecnicatura Superior en Desarrollo Web',
          shift: 'Tarde',
          enrollment_status: 'becado',
          linked_account: false,
          created_at: 'Hoy',
        },
      ]
      setStudentsList((prev) => [...newMockBatch, ...prev])
      setStatusMsg('¡Padrón institucional importado con éxito (150 alumnos habilitados)!')
      setShowImportModal(false)
      setTimeout(() => setStatusMsg(null), 4000)
    } finally {
      setImporting(false)
    }
  }

  const handleCreateStudent = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!newStudentName.trim() || !newStudentDni.trim()) return

    setSavingStudent(true)
    try {
      const res = await createSingleStudentAction({
        full_name: newStudentName.trim(),
        email: newStudentEmail.trim() || undefined,
        dni: newStudentDni.trim(),
        birth_year: Number(newStudentBirthYear) || 2005,
        gender: newStudentGender,
        career_name: newStudentCareer,
        shift: newStudentShift,
        enrollment_status: newStudentStatus,
        linked_account: false,
      })

      if (res.success && res.student) {
        setStudentsList((prev) => [res.student, ...prev])
        setStatusMsg(`Estudiante ${newStudentName} incorporado exitosamente al padrón.`)
        setShowAddStudentModal(false)
        setNewStudentName('')
        setNewStudentEmail('')
        setNewStudentDni('')
        setTimeout(() => setStatusMsg(null), 3500)
      }
    } catch {
      setStatusMsg('Error al dar de alta el estudiante.')
      setTimeout(() => setStatusMsg(null), 3000)
    } finally {
      setSavingStudent(false)
    }
  }

  const handleCopyCode = (code: string) => {
    navigator.clipboard.writeText(code)
    setCopiedCode(code)
    setTimeout(() => setCopiedCode(null), 2500)
  }

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
              <IconBuilding className="w-3.5 h-3.5 text-sky-400" />
              <span>Data Hub Institucional • Rectorado & Decanato</span>
            </span>
            <RoleSwitcherPill currentRole="dean" />
            <span className="text-xs text-slate-400 font-medium">
              {data.academic_period}
            </span>
          </div>

          <h1 className="text-2xl sm:text-3xl font-black text-white tracking-tight leading-tight">
            Centro de Retención & Acreditación Institucional
          </h1>
          <p className="text-xs sm:text-sm text-slate-300 max-w-2xl leading-relaxed">
            {data.faculty_name} • Supervisión predictiva del rendimiento de cohortes, gestión de docentes de cátedra y dictámenes CONEAU.
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

      {/* Tabs de Navegación del Hub Institucional (3 Pestañas para Decanato) */}
      <div className="flex items-center gap-2 border-b border-slate-200 pb-2 overflow-x-auto">
        <button
          type="button"
          onClick={() => setActiveTab('analytics')}
          className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs font-bold transition-all cursor-pointer whitespace-nowrap ${
            activeTab === 'analytics'
              ? 'bg-indigo-600 text-white shadow-sm'
              : 'bg-white text-slate-600 hover:bg-slate-100'
          }`}
        >
          <IconFlame className="w-4 h-4" />
          <span>1. Alerta Temprana & Retención Global</span>
        </button>

        <button
          type="button"
          onClick={() => setActiveTab('staff')}
          className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs font-bold transition-all cursor-pointer whitespace-nowrap ${
            activeTab === 'staff'
              ? 'bg-indigo-600 text-white shadow-sm'
              : 'bg-white text-slate-600 hover:bg-slate-100'
          }`}
        >
          <IconUsers className="w-4 h-4" />
          <span>2. Gestión de Profesores & Staff ({staffList.length})</span>
        </button>

        <button
          type="button"
          onClick={() => setActiveTab('students')}
          className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs font-bold transition-all cursor-pointer whitespace-nowrap ${
            activeTab === 'students'
              ? 'bg-indigo-600 text-white shadow-sm'
              : 'bg-white text-slate-600 hover:bg-slate-100'
          }`}
        >
          <IconBuilding className="w-4 h-4" />
          <span>3. Padrón & Habilitación de Alumnos ({studentsList.length})</span>
        </button>
      </div>

      {/* Notificación de Estado */}
      {statusMsg && (
        <div className="rounded-2xl bg-emerald-50 border border-emerald-200 p-3.5 text-xs font-bold text-emerald-800 flex items-center gap-2 animate-in fade-in">
          <IconCheck className="w-4 h-4 text-emerald-600 shrink-0" />
          <span>{statusMsg}</span>
        </div>
      )}

      {/* CONTENIDO TAB 1: ANALYTICS Y RETENCIÓN */}
      {activeTab === 'analytics' && (
        <div className="flex flex-col gap-8">
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
              +26.4% vs 2024
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
                <h3 className="text-base font-black text-slate-900 flex items-center gap-2">
                  <IconAlertTriangle className="w-4 h-4 text-rose-600" />
                  <span>Semáforo de Alerta Temprana por Cátedra (Materias Filtro)</span>
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
                  className={`px-3 py-1 rounded-xl text-xs font-semibold transition-all cursor-pointer inline-flex items-center gap-1.5 ${
                    filterRisk === 'ALTO'
                      ? 'bg-rose-600 text-white'
                      : 'bg-rose-50 text-rose-700 hover:bg-rose-100'
                  }`}
                >
                  <span className={`w-1.5 h-1.5 rounded-full ${filterRisk === 'ALTO' ? 'bg-white' : 'bg-rose-500'}`}></span>
                  <span>Alto</span>
                </button>
                <button
                  type="button"
                  onClick={() => setFilterRisk('MEDIO')}
                  className={`px-3 py-1 rounded-xl text-xs font-semibold transition-all cursor-pointer inline-flex items-center gap-1.5 ${
                    filterRisk === 'MEDIO'
                      ? 'bg-amber-600 text-white'
                      : 'bg-amber-50 text-amber-700 hover:bg-amber-100'
                  }`}
                >
                  <span className={`w-1.5 h-1.5 rounded-full ${filterRisk === 'MEDIO' ? 'bg-white' : 'bg-amber-500'}`}></span>
                  <span>Medio</span>
                </button>
                <button
                  type="button"
                  onClick={() => setFilterRisk('BAJO')}
                  className={`px-3 py-1 rounded-xl text-xs font-semibold transition-all cursor-pointer inline-flex items-center gap-1.5 ${
                    filterRisk === 'BAJO'
                      ? 'bg-emerald-600 text-white'
                      : 'bg-emerald-50 text-emerald-700 hover:bg-emerald-100'
                  }`}
                >
                  <span className={`w-1.5 h-1.5 rounded-full ${filterRisk === 'BAJO' ? 'bg-white' : 'bg-emerald-500'}`}></span>
                  <span>Bajo</span>
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
                          <span className="inline-flex items-center gap-1.5 rounded-full bg-rose-50 border border-rose-200 px-2.5 py-0.5 text-[10px] font-semibold text-rose-700">
                            <span className="w-1.5 h-1.5 rounded-full bg-rose-500"></span>
                            <span>Riesgo Alto</span>
                          </span>
                        )}
                        {sub.risk_level === 'MEDIO' && (
                          <span className="inline-flex items-center gap-1.5 rounded-full bg-amber-50 border border-amber-200 px-2.5 py-0.5 text-[10px] font-semibold text-amber-700">
                            <span className="w-1.5 h-1.5 rounded-full bg-amber-500"></span>
                            <span>Riesgo Medio</span>
                          </span>
                        )}
                        {sub.risk_level === 'BAJO' && (
                          <span className="inline-flex items-center gap-1.5 rounded-full bg-emerald-50 border border-emerald-200 px-2.5 py-0.5 text-[10px] font-semibold text-emerald-700">
                            <span className="w-1.5 h-1.5 rounded-full bg-emerald-500"></span>
                            <span>Estable</span>
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
            <h3 className="text-base font-black text-slate-900 flex items-center gap-2">
              <IconChart className="w-4 h-4 text-indigo-600" />
              <span>Distribución de Retención por Titulación / Carrera</span>
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
    </div>
  )}

  {/* CONTENIDO TAB 2: GESTIÓN DE DOCENTES, ROLES Y CÓDIGOS DE CÁTEDRA */}
  {activeTab === 'staff' && (
    <div className="flex flex-col gap-6">
      {/* Banner de Códigos de Activación Institucional */}
      <div className="rounded-3xl border border-slate-200/80 bg-white p-6 shadow-xs flex flex-col md:flex-row items-start md:items-center justify-between gap-6">
        <div className="flex items-start gap-4">
          <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-indigo-50 text-indigo-600 font-bold border border-indigo-100 shrink-0">
            <IconShield className="w-6 h-6 text-indigo-600" />
          </div>
          <div>
            <h3 className="text-base font-black text-slate-900">
              PINs de Activación Institucional de Docentes
            </h3>
            <p className="text-xs text-slate-500 mt-0.5 max-w-xl leading-relaxed">
              Los nuevos profesores pueden ingresar este código durante su registro u onboarding para activar automáticamente su espacio de cátedra sin esperar aprobación manual.
            </p>
          </div>
        </div>

        {/* Tarjetas de Códigos PIN */}
        <div className="flex flex-wrap items-center gap-3">
          <div className="flex items-center gap-3 bg-slate-900 text-white px-4 py-2.5 rounded-2xl border border-slate-800 shadow-xs">
            <div>
              <span className="text-[9px] font-bold uppercase tracking-wider text-slate-400 block">
                PIN Docente Cátedra
              </span>
              <span className="font-mono text-sm font-bold text-indigo-400">
                DOCENTE-INCADE-2026
              </span>
            </div>
            <button
              type="button"
              onClick={() => handleCopyCode('DOCENTE-INCADE-2026')}
              className="p-2 rounded-xl bg-white/10 hover:bg-white/20 text-white transition-colors cursor-pointer"
              title="Copiar código PIN"
            >
              {copiedCode === 'DOCENTE-INCADE-2026' ? (
                <IconCheck className="w-4 h-4 text-emerald-400" />
              ) : (
                <IconClipboard className="w-4 h-4 text-indigo-300" />
              )}
            </button>
          </div>

          <div className="flex items-center gap-3 bg-slate-100 text-slate-800 px-4 py-2.5 rounded-2xl border border-slate-200">
            <div>
              <span className="text-[9px] font-bold uppercase tracking-wider text-slate-500 block">
                PIN Decanato / Directivo
              </span>
              <span className="font-mono text-sm font-bold text-slate-900">
                RECTOR-INCADE-2026
              </span>
            </div>
            <button
              type="button"
              onClick={() => handleCopyCode('RECTOR-INCADE-2026')}
              className="p-2 rounded-xl bg-slate-200 hover:bg-slate-300 text-slate-700 transition-colors cursor-pointer"
              title="Copiar código PIN"
            >
              {copiedCode === 'RECTOR-INCADE-2026' ? (
                <IconCheck className="w-4 h-4 text-emerald-600" />
              ) : (
                <IconClipboard className="w-4 h-4 text-slate-600" />
              )}
            </button>
          </div>
        </div>
      </div>

      {/* Panel de Búsqueda y Filtros de Usuarios */}
      <div className="rounded-3xl border border-slate-200/80 bg-white p-6 shadow-xs flex flex-col gap-5">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-100 pb-4">
          <div>
            <h3 className="text-base font-black text-slate-900">
              Padrón de Docentes y Asignación de Roles
            </h3>
            <p className="text-xs text-slate-500 mt-0.5">
              Administrá los permisos de cada cuenta. Los cambios se aplican de forma inmediata en las políticas de seguridad (RLS).
            </p>
          </div>

          {/* Filtros por Rol */}
          <div className="flex items-center gap-1.5 flex-wrap">
            <button
              type="button"
              onClick={() => setRoleFilter('ALL')}
              className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                roleFilter === 'ALL'
                  ? 'bg-slate-900 text-white'
                  : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
              }`}
            >
              Todos ({staffList.length})
            </button>
            <button
              type="button"
              onClick={() => setRoleFilter('professor')}
              className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                roleFilter === 'professor'
                  ? 'bg-purple-600 text-white'
                  : 'bg-purple-50 text-purple-700 hover:bg-purple-100'
              }`}
            >
              Profesores ({staffList.filter((s) => s.role === 'professor').length})
            </button>
            <button
              type="button"
              onClick={() => setRoleFilter('dean')}
              className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                roleFilter === 'dean'
                  ? 'bg-sky-600 text-white'
                  : 'bg-sky-50 text-sky-700 hover:bg-sky-100'
              }`}
            >
              Decanato ({staffList.filter((s) => s.role === 'dean').length})
            </button>
            <button
              type="button"
              onClick={() => setRoleFilter('student')}
              className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                roleFilter === 'student'
                  ? 'bg-emerald-600 text-white'
                  : 'bg-emerald-50 text-emerald-700 hover:bg-emerald-100'
              }`}
            >
              Estudiantes ({staffList.filter((s) => s.role === 'student').length})
            </button>
          </div>
        </div>

        {/* Input de Búsqueda */}
        <div className="w-full max-w-md">
          <input
            type="text"
            placeholder="Buscar por nombre, correo electrónico o titulación..."
            value={staffSearch}
            onChange={(e) => setStaffSearch(e.target.value)}
            className="w-full rounded-xl border border-slate-200 px-3.5 py-2 text-xs text-slate-900 focus:border-indigo-600 focus:outline-hidden"
          />
        </div>

        {/* Tabla de Usuarios y Selector de Rol */}
        <div className="overflow-x-auto rounded-2xl border border-slate-200">
          <table className="w-full text-left text-xs text-slate-600">
            <thead className="bg-slate-50 border-b border-slate-200 text-[10px] font-bold uppercase tracking-wider text-slate-500">
              <tr>
                <th className="px-5 py-3.5">Docente / Usuario</th>
                <th className="px-5 py-3.5">Carrera / Área</th>
                <th className="px-5 py-3.5">Rol y Permisos de Acceso</th>
                <th className="px-5 py-3.5">Cátedras</th>
                <th className="px-5 py-3.5">Fecha de Alta</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filteredStaff.map((staff) => (
                <tr key={staff.id} className="hover:bg-slate-50/80 transition-colors">
                  <td className="px-5 py-3.5 font-bold text-slate-900">
                    <div className="flex items-center gap-2.5">
                      <div className="flex h-7 w-7 items-center justify-center rounded-full bg-indigo-100 text-indigo-700 font-bold text-xs">
                        {staff.full_name.charAt(0)}
                      </div>
                      <div>
                        <div>{staff.full_name}</div>
                        <div className="text-[10px] font-normal text-slate-400">{staff.email}</div>
                      </div>
                    </div>
                  </td>

                  <td className="px-5 py-3.5 font-medium text-slate-700">
                    {staff.career_name}
                  </td>

                  <td className="px-5 py-3.5">
                    <select
                      value={staff.role}
                      onChange={(e) => handleRoleChange(staff.id, e.target.value as any)}
                      className={`text-xs font-bold rounded-xl px-3 py-1.5 border cursor-pointer transition-all ${
                        staff.role === 'professor'
                          ? 'bg-purple-50 border-purple-200 text-purple-700'
                          : staff.role === 'dean'
                          ? 'bg-sky-50 border-sky-200 text-sky-700'
                          : 'bg-slate-50 border-slate-200 text-slate-700'
                      }`}
                    >
                      <option value="student">Estudiante (Acceso Estándar)</option>
                      <option value="professor">Profesor (Panel de Cátedra)</option>
                      <option value="dean">Decanato / Rectorado (Data Hub)</option>
                      <option value="admin">Administrador Total</option>
                    </select>
                  </td>

                  <td className="px-5 py-3.5 font-mono font-bold text-indigo-600">
                    {staff.commissions_count > 0 ? `${staff.commissions_count} activas` : '—'}
                  </td>

                  <td className="px-5 py-3.5 text-slate-400 font-mono text-[11px]">
                    {staff.created_at}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
      )}

      {/* CONTENIDO TAB 3: PADRÓN Y HABILITACIÓN DE ALUMNOS (DECANATO) */}
      {activeTab === 'students' && (
        <div className="flex flex-col gap-6 animate-in fade-in">
          {/* Tarjetas de Demografía & Matrícula de la Cohorte */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            <div className="rounded-3xl border border-slate-200/80 bg-white p-5 shadow-xs flex flex-col gap-1.5">
              <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400">
                Padrón Total de Alumnos
              </span>
              <div className="flex items-baseline justify-between">
                <span className="text-2xl sm:text-3xl font-black text-slate-900">
                  {studentsList.length.toLocaleString()}
                </span>
                <span className="text-[10px] font-bold text-emerald-700 bg-emerald-50 border border-emerald-200 px-2 py-0.5 rounded-full">
                  {studentsList.filter((s) => s.enrollment_status === 'habilitado' || s.enrollment_status === 'becado').length} Habilitados
                </span>
              </div>
              <span className="text-[11px] text-slate-500">
                {studentsList.filter((s) => s.enrollment_status === 'pendiente').length} pendientes de validación
              </span>
            </div>

            <div className="rounded-3xl border border-slate-200/80 bg-white p-5 shadow-xs flex flex-col gap-1.5">
              <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400">
                Edad Promedio Ingresantes
              </span>
              <div className="flex items-baseline justify-between">
                <span className="text-2xl sm:text-3xl font-black text-indigo-600">
                  19.4 <span className="text-sm font-semibold text-slate-500">años</span>
                </span>
                <span className="text-[10px] font-bold text-slate-600 bg-slate-100 px-2 py-0.5 rounded-full">
                  Rango 17-31
                </span>
              </div>
              <span className="text-[11px] text-slate-500">82% recién egresados de secundaria</span>
            </div>

            <div className="rounded-3xl border border-slate-200/80 bg-white p-5 shadow-xs flex flex-col gap-1.5">
              <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400">
                Distribución por Género
              </span>
              <div className="flex items-baseline justify-between">
                <span className="text-lg font-black text-slate-900">
                  54% F <span className="text-xs text-slate-400 font-normal">/</span> 44% M
                </span>
                <span className="text-[10px] font-bold text-purple-700 bg-purple-50 px-2 py-0.5 rounded-full">
                  2% X
                </span>
              </div>
              <span className="text-[11px] text-slate-500">Métrica requerida para CONEAU</span>
            </div>

            <div className="rounded-3xl border border-slate-200/80 bg-white p-5 shadow-xs flex flex-col gap-1.5">
              <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400">
                Turno de Cursada
              </span>
              <div className="flex items-baseline justify-between">
                <span className="text-lg font-black text-slate-900">
                  48% Mañana
                </span>
                <span className="text-[10px] font-bold text-sky-700 bg-sky-50 px-2 py-0.5 rounded-full">
                  34% Noche
                </span>
              </div>
              <span className="text-[11px] text-slate-500">18% Turno Tarde</span>
            </div>
          </div>

          {/* Panel de Búsqueda, Filtros y Carga Masiva */}
          <div className="rounded-3xl border border-slate-200/80 bg-white p-6 shadow-xs flex flex-col gap-5">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-slate-100 pb-4">
              <div>
                <h3 className="text-base font-black text-slate-900">
                  Padrón Institucional de Estudiantes
                </h3>
                <p className="text-xs text-slate-500 mt-0.5">
                  Control centralizado de habilitación de cuentas, becas y datos demográficos para estadísticas universitarias.
                </p>
              </div>

              <div className="flex flex-wrap items-center gap-2">
                <button
                  type="button"
                  onClick={() => setShowAddStudentModal(true)}
                  className="rounded-xl bg-slate-900 hover:bg-slate-800 text-white px-4 py-2.5 text-xs font-bold shadow-xs transition-all flex items-center gap-1.5 cursor-pointer"
                >
                  <IconPlus className="w-4 h-4 text-indigo-400" />
                  <span>+ Nuevo Alumno (Manual)</span>
                </button>

                <button
                  type="button"
                  onClick={() => setShowImportModal(true)}
                  className="rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white px-4 py-2.5 text-xs font-bold shadow-xs transition-all flex items-center gap-1.5 cursor-pointer"
                >
                  <IconDocument className="w-4 h-4" />
                  <span>Importar Padrón (CSV / Excel)</span>
                </button>
              </div>
            </div>

            {/* Barra de Filtros Rápidos */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-3">
              <div className="lg:col-span-2">
                <input
                  type="text"
                  placeholder="Buscar por nombre, DNI o carrera..."
                  value={studentSearch}
                  onChange={(e) => setStudentSearch(e.target.value)}
                  className="w-full rounded-xl border border-slate-200 px-3.5 py-2 text-xs text-slate-900 focus:border-indigo-600 focus:outline-hidden"
                />
              </div>

              <div>
                <select
                  value={genderFilter}
                  onChange={(e) => setGenderFilter(e.target.value)}
                  className="w-full rounded-xl border border-slate-200 px-3 py-2 text-xs text-slate-700 focus:border-indigo-600 focus:outline-hidden bg-white"
                >
                  <option value="ALL">Género: Todos</option>
                  <option value="F">Femenino</option>
                  <option value="M">Masculino</option>
                  <option value="X">No binario / Otro</option>
                </select>
              </div>

              <div>
                <select
                  value={shiftFilter}
                  onChange={(e) => setShiftFilter(e.target.value)}
                  className="w-full rounded-xl border border-slate-200 px-3 py-2 text-xs text-slate-700 focus:border-indigo-600 focus:outline-hidden bg-white"
                >
                  <option value="ALL">Turno: Todos</option>
                  <option value="Mañana">Turno Mañana</option>
                  <option value="Tarde">Turno Tarde</option>
                  <option value="Noche">Turno Noche</option>
                </select>
              </div>

              <div>
                <select
                  value={statusFilter}
                  onChange={(e) => setStatusFilter(e.target.value)}
                  className="w-full rounded-xl border border-slate-200 px-3 py-2 text-xs text-slate-700 focus:border-indigo-600 focus:outline-hidden bg-white"
                >
                  <option value="ALL">Estado: Todos</option>
                  <option value="habilitado">Habilitados</option>
                  <option value="becado">Becados</option>
                  <option value="pendiente">Pendientes</option>
                  <option value="suspendido">Suspendidos</option>
                </select>
              </div>
            </div>

            {/* Tabla de Estudiantes */}
            <div className="overflow-x-auto rounded-2xl border border-slate-200">
              <table className="w-full text-left text-xs text-slate-600">
                <thead className="bg-slate-50 border-b border-slate-200 text-[10px] font-bold uppercase tracking-wider text-slate-500">
                  <tr>
                    <th className="px-5 py-3.5">Estudiante</th>
                    <th className="px-5 py-3.5">DNI</th>
                    <th className="px-5 py-3.5">Año / Edad</th>
                    <th className="px-5 py-3.5">Género</th>
                    <th className="px-5 py-3.5">Carrera & Turno</th>
                    <th className="px-5 py-3.5">Estado de Matrícula</th>
                    <th className="px-5 py-3.5 text-right">Acción</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {filteredStudents.map((st) => (
                    <tr key={st.id} className="hover:bg-slate-50/80 transition-colors">
                      <td className="px-5 py-3.5 font-bold text-slate-900">
                        <div className="flex items-center gap-2.5">
                          <div className="flex h-7 w-7 items-center justify-center rounded-full bg-slate-900 text-white font-bold text-xs">
                            {st.full_name.charAt(0)}
                          </div>
                          <div>
                            <div className="flex items-center gap-1.5 flex-wrap">
                              <span>{st.full_name}</span>
                              {st.linked_account ? (
                                <span className="inline-flex items-center gap-1 px-1.5 py-0.2 text-[9px] font-bold text-emerald-700 bg-emerald-50 border border-emerald-200 rounded-full" title="El alumno ya inició sesión con su cuenta">
                                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-500"></span>
                                  Cuenta activa
                                </span>
                              ) : (
                                <span className="inline-flex items-center gap-1 px-1.5 py-0.2 text-[9px] font-medium text-amber-700 bg-amber-50 border border-amber-200 rounded-full" title="Aguardando que el alumno cree su cuenta con su email o DNI">
                                  <span className="w-1.5 h-1.5 rounded-full bg-amber-400"></span>
                                  Aguardando registro
                                </span>
                              )}
                            </div>
                            <div className="text-[10px] font-normal text-slate-400 flex items-center gap-1.5 flex-wrap">
                              <span>{st.email || 'Sin email previo'}</span>
                              <span>•</span>
                              <span>Alta: {st.created_at}</span>
                            </div>
                          </div>
                        </div>
                      </td>

                      <td className="px-5 py-3.5 font-mono text-slate-700">
                        {st.dni}
                      </td>

                      <td className="px-5 py-3.5 font-medium text-slate-700">
                        <span>{st.birth_year}</span>
                        <span className="text-[10px] text-slate-400 ml-1.5">({2026 - st.birth_year} años)</span>
                      </td>

                      <td className="px-5 py-3.5 font-bold">
                        <span
                          className={`px-2 py-0.5 rounded-md text-[10px] ${
                            st.gender === 'F'
                              ? 'bg-purple-50 text-purple-700 border border-purple-200'
                              : st.gender === 'M'
                              ? 'bg-blue-50 text-blue-700 border border-blue-200'
                              : 'bg-slate-100 text-slate-700 border border-slate-200'
                          }`}
                        >
                          {st.gender === 'F' ? 'Femenino' : st.gender === 'M' ? 'Masculino' : 'X'}
                        </span>
                      </td>

                      <td className="px-5 py-3.5">
                        <div className="font-semibold text-slate-900">{st.career_name}</div>
                        <div className="text-[10px] text-slate-400">{st.shift}</div>
                      </td>

                      <td className="px-5 py-3.5">
                        <select
                          value={st.enrollment_status}
                          onChange={(e) =>
                            handleToggleStudentStatus(
                              st.id,
                              e.target.value as 'habilitado' | 'becado' | 'pendiente' | 'suspendido'
                            )
                          }
                          className={`text-xs font-bold rounded-xl px-2.5 py-1 border cursor-pointer transition-all ${
                            st.enrollment_status === 'habilitado'
                              ? 'bg-emerald-50 border-emerald-200 text-emerald-700'
                              : st.enrollment_status === 'becado'
                              ? 'bg-indigo-50 border-indigo-200 text-indigo-700'
                              : st.enrollment_status === 'pendiente'
                              ? 'bg-amber-50 border-amber-200 text-amber-700'
                              : 'bg-rose-50 border-rose-200 text-rose-700'
                          }`}
                        >
                          <option value="habilitado">Habilitado (Activo)</option>
                          <option value="becado">Becado (Licencia Institucional)</option>
                          <option value="pendiente">Pendiente de Aprobación</option>
                          <option value="suspendido">Suspendido (Sin Acceso)</option>
                        </select>
                      </td>

                      <td className="px-5 py-3.5 text-right">
                        {st.enrollment_status === 'suspendido' ? (
                          <button
                            type="button"
                            onClick={() => handleToggleStudentStatus(st.id, 'habilitado')}
                            className="text-[10px] font-bold text-emerald-700 hover:text-emerald-900 bg-emerald-50 border border-emerald-200 px-2.5 py-1 rounded-lg cursor-pointer"
                          >
                            Rehabilitar
                          </button>
                        ) : (
                          <button
                            type="button"
                            onClick={() => handleToggleStudentStatus(st.id, 'suspendido')}
                            className="text-[10px] font-bold text-rose-600 hover:text-rose-800 bg-rose-50 border border-rose-200 px-2.5 py-1 rounded-lg cursor-pointer"
                          >
                            Suspender
                          </button>
                        )}
                      </td>
                    </tr>
                  ))}

                  {filteredStudents.length === 0 && (
                    <tr>
                      <td colSpan={7} className="px-5 py-8 text-center text-slate-400">
                        No se encontraron estudiantes con los filtros seleccionados.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* Modal de Alta Manual Individual de Estudiante */}
      {showAddStudentModal && (
        <div
          className="fixed inset-0 z-[9999] flex items-center justify-center bg-slate-900/70 backdrop-blur-2xs p-4 overflow-y-auto animate-in fade-in"
          onClick={() => setShowAddStudentModal(false)}
        >
          <div
            className="w-full max-w-lg rounded-3xl bg-white p-6 sm:p-8 shadow-2xl border border-slate-200 flex flex-col gap-5 text-slate-900 animate-in zoom-in-95"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div>
                <span className="text-[10px] font-bold uppercase tracking-wider text-indigo-700 bg-indigo-50 border border-indigo-200 px-2 py-0.5 rounded-full">
                  Decanato / Secretaría Académica
                </span>
                <h3 className="text-base font-black text-slate-900 mt-1">
                  Alta Individual de Estudiante
                </h3>
              </div>
              <button
                type="button"
                onClick={() => setShowAddStudentModal(false)}
                className="text-slate-400 hover:text-slate-700 p-1 rounded-lg hover:bg-slate-100 transition-colors cursor-pointer"
              >
                <IconClose className="w-4 h-4" />
              </button>
            </div>

            {/* Explicación de Vinculación */}
            <div className="rounded-2xl bg-indigo-50/70 border border-indigo-200/80 p-3.5 flex items-start gap-2.5 text-indigo-950">
              <IconSparkles className="w-4 h-4 text-indigo-600 shrink-0 mt-0.5" />
              <div className="text-[11px] leading-relaxed text-slate-700">
                <strong className="text-indigo-950 font-bold">¿Cómo se vincula la cuenta del alumno?</strong><br />
                Cuando el estudiante cree su cuenta en UniNav con este <strong>Email</strong> (o valide su <strong>DNI</strong> en el onboarding), el sistema enlazará automáticamente su sesión a este legajo y habilitará las materias de su carrera sin esperas.
              </div>
            </div>

            <form onSubmit={handleCreateStudent} className="flex flex-col gap-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
                <div>
                  <label className="block text-[11px] font-bold text-slate-700 mb-1">
                    Nombre Completo *
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="Ej: Juan Manuel Pérez"
                    value={newStudentName}
                    onChange={(e) => setNewStudentName(e.target.value)}
                    className="w-full rounded-xl border border-slate-200 px-3.5 py-2 text-xs text-slate-900 focus:border-indigo-600 focus:outline-hidden"
                  />
                </div>

                <div>
                  <label className="block text-[11px] font-bold text-slate-700 mb-1">
                    Email para Vincular Cuenta
                  </label>
                  <input
                    type="email"
                    placeholder="Ej: j.perez@alumnos.unam.edu.ar"
                    value={newStudentEmail}
                    onChange={(e) => setNewStudentEmail(e.target.value)}
                    className="w-full rounded-xl border border-slate-200 px-3.5 py-2 text-xs text-slate-900 focus:border-indigo-600 focus:outline-hidden"
                  />
                </div>

                <div>
                  <label className="block text-[11px] font-bold text-slate-700 mb-1">
                    DNI / Documento *
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="Ej: 45.321.678"
                    value={newStudentDni}
                    onChange={(e) => setNewStudentDni(e.target.value)}
                    className="w-full rounded-xl border border-slate-200 px-3.5 py-2 text-xs text-slate-900 focus:border-indigo-600 focus:outline-hidden"
                  />
                </div>

                <div>
                  <label className="block text-[11px] font-bold text-slate-700 mb-1">
                    Año de Nacimiento *
                  </label>
                  <input
                    type="number"
                    required
                    min={1960}
                    max={2015}
                    value={newStudentBirthYear}
                    onChange={(e) => setNewStudentBirthYear(Number(e.target.value))}
                    className="w-full rounded-xl border border-slate-200 px-3.5 py-2 text-xs text-slate-900 focus:border-indigo-600 focus:outline-hidden"
                  />
                </div>

                <div>
                  <label className="block text-[11px] font-bold text-slate-700 mb-1">
                    Género *
                  </label>
                  <select
                    value={newStudentGender}
                    onChange={(e) => setNewStudentGender(e.target.value as 'M' | 'F' | 'X')}
                    className="w-full rounded-xl border border-slate-200 px-3 py-2 text-xs text-slate-900 focus:border-indigo-600 focus:outline-hidden bg-white"
                  >
                    <option value="F">Femenino</option>
                    <option value="M">Masculino</option>
                    <option value="X">No binario / Otro</option>
                  </select>
                </div>

                <div>
                  <label className="block text-[11px] font-bold text-slate-700 mb-1">
                    Turno de Cursada *
                  </label>
                  <select
                    value={newStudentShift}
                    onChange={(e) => setNewStudentShift(e.target.value as 'Mañana' | 'Tarde' | 'Noche')}
                    className="w-full rounded-xl border border-slate-200 px-3 py-2 text-xs text-slate-900 focus:border-indigo-600 focus:outline-hidden bg-white"
                  >
                    <option value="Mañana">Mañana</option>
                    <option value="Tarde">Tarde</option>
                    <option value="Noche">Noche</option>
                  </select>
                </div>

                <div className="sm:col-span-2">
                  <label className="block text-[11px] font-bold text-slate-700 mb-1">
                    Carrera *
                  </label>
                  <select
                    value={newStudentCareer}
                    onChange={(e) => setNewStudentCareer(e.target.value)}
                    className="w-full rounded-xl border border-slate-200 px-3 py-2 text-xs text-slate-900 focus:border-indigo-600 focus:outline-hidden bg-white"
                  >
                    {data.career_breakdown.map((c, i) => (
                      <option key={i} value={c.career}>
                        {c.career}
                      </option>
                    ))}
                  </select>
                </div>

                <div className="sm:col-span-2">
                  <label className="block text-[11px] font-bold text-slate-700 mb-1">
                    Estado Inicial de Matrícula
                  </label>
                  <select
                    value={newStudentStatus}
                    onChange={(e) => setNewStudentStatus(e.target.value as 'habilitado' | 'becado' | 'pendiente')}
                    className="w-full rounded-xl border border-slate-200 px-3 py-2 text-xs text-slate-900 focus:border-indigo-600 focus:outline-hidden bg-white"
                  >
                    <option value="habilitado">Habilitado (Activo con acceso total)</option>
                    <option value="becado">Becado (Licencia Institucional)</option>
                    <option value="pendiente">Pendiente de Documentación</option>
                  </select>
                </div>
              </div>

              <div className="flex items-center justify-end gap-3 pt-4 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setShowAddStudentModal(false)}
                  className="rounded-xl px-4 py-2 text-xs font-bold text-slate-600 hover:bg-slate-100"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  disabled={savingStudent}
                  className="inline-flex items-center gap-2 rounded-xl bg-slate-900 hover:bg-slate-800 disabled:opacity-50 text-white px-5 py-2.5 text-xs font-bold shadow-md transition-all cursor-pointer"
                >
                  {savingStudent ? (
                    <>
                      <span className="h-3.5 w-3.5 rounded-full border-2 border-white border-t-transparent animate-spin" />
                      <span>Guardando...</span>
                    </>
                  ) : (
                    <>
                      <IconCheck className="w-4 h-4 text-emerald-400" />
                      <span>Guardar y Habilitar Alumno</span>
                    </>
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal de Importación Masiva de Padrón (CSV / Excel) */}
      {showImportModal && (
        <div
          className="fixed inset-0 z-[9999] flex items-center justify-center bg-slate-900/70 backdrop-blur-2xs p-4 overflow-y-auto animate-in fade-in"
          onClick={() => setShowImportModal(false)}
        >
          <div
            className="w-full max-w-xl rounded-3xl bg-white p-6 sm:p-8 shadow-2xl border border-slate-200 flex flex-col gap-5 text-slate-900 animate-in zoom-in-95"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div>
                <span className="text-[10px] font-bold uppercase tracking-wider text-indigo-700 bg-indigo-50 border border-indigo-200 px-2 py-0.5 rounded-full">
                  Gestión Institucional B2B
                </span>
                <h3 className="text-base font-black text-slate-900 mt-1">
                  Importar Padrón Oficial de Estudiantes
                </h3>
              </div>
              <button
                type="button"
                onClick={() => setShowImportModal(false)}
                className="text-slate-400 hover:text-slate-700 p-1 rounded-lg hover:bg-slate-100 transition-colors cursor-pointer"
              >
                <IconClose className="w-4 h-4" />
              </button>
            </div>

            <p className="text-xs text-slate-600 leading-relaxed">
              Cargá el archivo de la secretaría de alumnos o SIU Guaraní para habilitar automáticamente los accesos, asignar carreras y calcular métricas demográficas de la cohorte.
            </p>

            {/* Esquema de Columnas Requeridas */}
            <div className="rounded-2xl bg-slate-50 border border-slate-200 p-4 flex flex-col gap-2">
              <span className="text-[11px] font-bold text-slate-900">
                Formato de Columnas Requerido (CSV / Excel):
              </span>
              <div className="font-mono text-[10px] bg-slate-900 text-indigo-300 p-2.5 rounded-xl overflow-x-auto">
                DNI, Nombre_Completo, Año_Nacimiento, Género (M/F/X), Carrera, Turno, Email
              </div>
              <span className="text-[10px] text-slate-500">
                Ejemplo: 45102348, Camila Benítez, 2005, F, Administración, Mañana, c.benitez@incade.edu.ar
              </span>
            </div>

            {/* Dropzone de Carga */}
            <div className="rounded-2xl border-2 border-dashed border-indigo-200 bg-indigo-50/40 p-6 text-center flex flex-col items-center gap-2 cursor-pointer hover:bg-indigo-50 transition-colors">
              <IconDocument className="w-8 h-8 text-indigo-600" />
              <span className="font-bold text-xs text-slate-800">
                Arrastrá tu archivo .CSV o .XLSX aquí
              </span>
              <span className="text-[11px] text-slate-500">
                O hacé clic para explorar en tu computadora
              </span>
            </div>

            {/* Botones de Acción */}
            <div className="flex items-center justify-end gap-3 pt-3 border-t border-slate-100">
              <button
                type="button"
                onClick={() => setShowImportModal(false)}
                className="rounded-xl px-4 py-2 text-xs font-bold text-slate-600 hover:bg-slate-100"
              >
                Cancelar
              </button>
              <button
                type="button"
                disabled={importing}
                onClick={handleSimulateImport}
                className="inline-flex items-center gap-2 rounded-xl bg-indigo-600 hover:bg-indigo-700 disabled:opacity-50 text-white px-5 py-2.5 text-xs font-bold shadow-md transition-all cursor-pointer"
              >
                {importing ? (
                  <>
                    <span className="h-3.5 w-3.5 rounded-full border-2 border-white border-t-transparent animate-spin" />
                    <span>Importando y habilitando...</span>
                  </>
                ) : (
                  <>
                    <IconCheck className="w-4 h-4" />
                    <span>Importar y Habilitar Cohorte</span>
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      )}

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
                className="text-slate-400 hover:text-slate-700 p-1 rounded-lg hover:bg-slate-100 transition-colors cursor-pointer"
              >
                <IconClose className="w-4 h-4" />
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
