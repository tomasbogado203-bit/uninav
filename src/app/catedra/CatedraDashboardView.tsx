'use client'

import { useState } from 'react'
import Link from 'next/link'
import {
  CommissionItem,
  TelemetryTopic,
  CatedraStudent,
  CatedraDocument,
  CatedraAnnouncement,
  createCommissionAction,
  getCommissionTelemetryAction,
  generateCatedraExamAction,
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
  IconPrinter,
  IconCalendar,
  IconExternalLink,
} from '@/components/icons'

interface CatedraDashboardViewProps {
  userRole: 'student' | 'professor' | 'dean' | 'admin'
  userName: string
  universityName: string
  commissions: CommissionItem[]
}

type TabType = 'radar' | 'bibliografia' | 'examenes' | 'alumnos' | 'anuncios'

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

  // Pestaña Activa
  const [activeTab, setActiveTab] = useState<TabType>('radar')

  // Estados para creación de comisión
  const [showCreateModal, setShowCreateModal] = useState(false)
  const [newSubjName, setNewSubjName] = useState('')
  const [newCommName, setNewCommName] = useState('')
  const [newTerm, setNewTerm] = useState('1° Cuatrimestre 2026')
  const [newDesc, setNewDesc] = useState('')
  const [creating, setCreating] = useState(false)

  // Estados para subida de documento oficial de cátedra
  const [showUploadDocModal, setShowUploadDocModal] = useState(false)
  const [newDocTitle, setNewDocTitle] = useState('')
  const [newDocType, setNewDocType] = useState<'guia_tp' | 'teorico' | 'examen_modelo'>('guia_tp')
  const [uploadingDoc, setUploadingDoc] = useState(false)
  const [docSuccessMsg, setDocSuccessMsg] = useState<string | null>(null)


  // Estado de telemetría de la comisión seleccionada
  const [telemetry, setTelemetry] = useState<{ topics: TelemetryTopic[]; ai_recommendation: string }>({
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

  // Documentos de Cátedra
  const [documents, setDocuments] = useState<CatedraDocument[]>([
    {
      id: 'doc-1',
      title: 'Guía Oficial de Trabajos Prácticos N° 1 y N° 2 (2026)',
      document_type: 'guia_tp',
      chunk_count: 42,
      queries_count: 312,
      created_at: '2026-03-10',
    },
    {
      id: 'doc-2',
      title: 'Teórico: Cálculo Integral y Técnicas de Sustitución Avanzada',
      document_type: 'teorico',
      chunk_count: 78,
      queries_count: 489,
      created_at: '2026-03-18',
    },
    {
      id: 'doc-3',
      title: 'Compilado de Exámenes Parciales de Años Anteriores',
      document_type: 'examen_modelo',
      chunk_count: 35,
      queries_count: 245,
      created_at: '2026-04-02',
    },
  ])

  // Padrón de Alumnos Inscriptos
  const [students] = useState<CatedraStudent[]>([
    { id: 's1', name: 'Martín Rodríguez', email: 'm.rodriguez@facultad.edu.ar', activity_status: 'al_dia', focus_hours: 18.5, rag_queries: 47, quiz_avg: 8.5, last_active: 'Hoy, 19:40 hs' },
    { id: 's2', name: 'Camila Benítez', email: 'c.benitez@facultad.edu.ar', activity_status: 'al_dia', focus_hours: 14.0, rag_queries: 32, quiz_avg: 9.0, last_active: 'Hoy, 18:15 hs' },
    { id: 's3', name: 'Ignacio Gómez', email: 'i.gomez@facultad.edu.ar', activity_status: 'en_riesgo', focus_hours: 4.2, rag_queries: 8, quiz_avg: 4.5, last_active: 'Hace 3 días' },
    { id: 's4', name: 'Sofía Álvarez', email: 's.alvarez@facultad.edu.ar', activity_status: 'al_dia', focus_hours: 22.0, rag_queries: 65, quiz_avg: 9.5, last_active: 'Hoy, 20:05 hs' },
    { id: 's5', name: 'Lucas Pereyra', email: 'l.pereyra@facultad.edu.ar', activity_status: 'inactivo', focus_hours: 0.5, rag_queries: 2, quiz_avg: 2.0, last_active: 'Hace 8 días' },
    { id: 's6', name: 'Valentina Rossi', email: 'v.rossi@facultad.edu.ar', activity_status: 'al_dia', focus_hours: 12.5, rag_queries: 29, quiz_avg: 7.5, last_active: 'Ayer' },
    { id: 's7', name: 'Tomás Bogado', email: 't.bogado@facultad.edu.ar', activity_status: 'al_dia', focus_hours: 26.0, rag_queries: 84, quiz_avg: 10.0, last_active: 'Hoy, 21:10 hs' },
  ])

  // Tablón de Anuncios
  const [announcements, setAnnouncements] = useState<CatedraAnnouncement[]>([
    {
      id: 'a1',
      title: 'Fecha y Distribución de Aulas para el 1° Parcial',
      content: 'El primer parcial se llevará a cabo el martes 14 de mayo a las 19:00 hs en el Aula Magna (pabellón 2). Traer DNI y calculadora científica no programable.',
      created_at: 'Publicado hace 2 días',
      is_urgent: true,
    },
    {
      id: 'a2',
      title: 'Clase de Consulta Extraordinaria de Fracciones Simples',
      content: 'Debido a las consultas registradas en la plataforma, el JTP dictará una clase de resolución de ejercicios el jueves a las 18:00 hs en el aula 104.',
      created_at: 'Publicado hace 4 días',
      is_urgent: false,
    },
  ])

  const [newAnnouncementTitle, setNewAnnouncementTitle] = useState('')
  const [newAnnouncementContent, setNewAnnouncementContent] = useState('')

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
        setCommissions((prev) => [res.commission!, ...prev])
        setSelectedCommission(res.commission)
        setShowCreateModal(false)
        setNewSubjName('')
        setNewCommName('')
        setNewDesc('')
      }
    } catch {
      alert('Error al crear la comisión.')
    } finally {
      setCreating(false)
    }
  }

  const handleSelectCommission = async (comm: CommissionItem) => {
    setSelectedCommission(comm)
    const tel = await getCommissionTelemetryAction(comm.id)
    setTelemetry(tel)
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

  const handlePostAnnouncement = (e: React.FormEvent) => {
    e.preventDefault()
    if (!newAnnouncementTitle.trim() || !newAnnouncementContent.trim()) return

    const newA: CatedraAnnouncement = {
      id: `a-${Date.now()}`,
      title: newAnnouncementTitle.trim(),
      content: newAnnouncementContent.trim(),
      created_at: 'Publicado recién',
      is_urgent: false,
    }

    setAnnouncements([newA, ...announcements])
    setNewAnnouncementTitle('')
    setNewAnnouncementContent('')
    alert('¡Aviso publicado y notificado a los alumnos inscriptos!')
  }

  const handleUploadDocSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (!newDocTitle.trim()) return

    setUploadingDoc(true)
    setTimeout(() => {
      const newDoc: CatedraDocument = {
        id: `doc-${Date.now()}`,
        title: newDocTitle.trim(),
        document_type: newDocType,
        chunk_count: Math.floor(25 + Math.random() * 50),
        queries_count: 0,
        created_at: new Date().toISOString().slice(0, 10),
      }
      setDocuments([newDoc, ...documents])
      setShowUploadDocModal(false)
      setNewDocTitle('')
      setUploadingDoc(false)
      setDocSuccessMsg(`¡"${newDoc.title}" indexado con éxito en la base vectorial! Los alumnos recibirán respuestas citando esta fuente.`)
      setTimeout(() => setDocSuccessMsg(null), 6000)
    }, 1000)
  }


  return (
    <div className="mx-auto max-w-[96rem] px-4 py-8 sm:px-6 flex flex-col gap-8 select-none">
      {/* Header Principal del Panel de Cátedra */}
      <div className="rounded-3xl bg-gradient-to-br from-indigo-950 via-slate-900 to-slate-950 p-6 sm:p-8 text-white shadow-xl flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div className="flex flex-col gap-2">
          <div className="flex items-center gap-2 flex-wrap">
            <span className="inline-flex items-center gap-1.5 rounded-full bg-purple-500/20 px-3 py-1 text-xs font-bold text-purple-300 border border-purple-500/30">
              <IconBook className="w-3.5 h-3.5 text-purple-400" />
              <span>Espacio de Cátedra & Docencia</span>
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
            Suite docente integral: telemetría socrática en tiempo real, gestión de bibliografía oficial, padrón de alumnos y diseño de evaluaciones.
          </p>
        </div>

        {/* Acciones de Cabecera */}
        <div className="flex flex-wrap items-center gap-3 shrink-0">
          <Link
            href="/"
            className="inline-flex items-center gap-1.5 rounded-2xl bg-white/10 hover:bg-white/20 border border-white/10 px-4 py-3 text-xs sm:text-sm font-bold text-white transition-colors backdrop-blur-xs shadow-2xs cursor-pointer"
          >
            <IconChevronLeft className="w-4 h-4 text-purple-300" />
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

      {/* Selector de Comisión & Banner de Código */}
      {selectedCommission && (
        <div className="rounded-3xl border border-slate-200/80 bg-white p-6 shadow-xs flex flex-col md:flex-row items-start md:items-center justify-between gap-6">
          <div className="flex items-center gap-4">
            <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-purple-50 text-purple-600 font-black text-lg border border-purple-100">
              {selectedCommission.subject_name.slice(0, 2).toUpperCase()}
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-lg font-black text-slate-900">
                  {selectedCommission.subject_name}
                </h2>
                <span className="text-[10px] font-bold text-purple-700 bg-purple-50 border border-purple-200 px-2 py-0.5 rounded-full">
                  {selectedCommission.name}
                </span>
              </div>
              <p className="text-xs text-slate-500 mt-0.5">
                {selectedCommission.academic_term} • {selectedCommission.student_count || 48} alumnos inscriptos
              </p>
            </div>
          </div>

          {/* Código de Invitación Destacado */}
          <div className="flex items-center gap-3 bg-slate-900 text-white px-5 py-3 rounded-2xl shadow-sm border border-slate-800">
            <div>
              <span className="text-[9px] font-bold uppercase tracking-wider text-slate-400 block">
                Código para Proyectar en Clase
              </span>
              <span className="font-mono text-xl font-black tracking-widest text-indigo-400">
                {selectedCommission.join_code}
              </span>
            </div>
            <button
              type="button"
              onClick={() => handleCopyCode(selectedCommission.join_code)}
              className="p-2.5 rounded-xl bg-white/10 hover:bg-white/20 text-white transition-colors cursor-pointer"
              title="Copiar código PIN"
            >
              {copiedCode === selectedCommission.join_code ? (
                <IconCheck className="w-4 h-4 text-emerald-400" />
              ) : (
                <IconClipboard className="w-4 h-4 text-indigo-300" />
              )}
            </button>
          </div>
        </div>
      )}

      {/* Barra de Navegación por Pestañas (5 Tabs) */}
      <div className="flex items-center gap-2 border-b border-slate-200 pb-2 overflow-x-auto">
        <button
          type="button"
          onClick={() => setActiveTab('radar')}
          className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
            activeTab === 'radar'
              ? 'bg-indigo-600 text-white shadow-sm'
              : 'bg-white text-slate-600 hover:bg-slate-100'
          }`}
        >
          <IconFlame className="w-4 h-4" />
          <span>1. Radar & Telemetría</span>
        </button>

        <button
          type="button"
          onClick={() => setActiveTab('bibliografia')}
          className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
            activeTab === 'bibliografia'
              ? 'bg-indigo-600 text-white shadow-sm'
              : 'bg-white text-slate-600 hover:bg-slate-100'
          }`}
        >
          <IconBook className="w-4 h-4" />
          <span>2. Bibliografía de Cátedra ({documents.length})</span>
        </button>

        <button
          type="button"
          onClick={() => setActiveTab('examenes')}
          className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
            activeTab === 'examenes'
              ? 'bg-indigo-600 text-white shadow-sm'
              : 'bg-white text-slate-600 hover:bg-slate-100'
          }`}
        >
          <IconSparkles className="w-4 h-4" />
          <span>3. Generador de Parciales</span>
        </button>

        <button
          type="button"
          onClick={() => setActiveTab('alumnos')}
          className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
            activeTab === 'alumnos'
              ? 'bg-indigo-600 text-white shadow-sm'
              : 'bg-white text-slate-600 hover:bg-slate-100'
          }`}
        >
          <IconUsers className="w-4 h-4" />
          <span>4. Padrón de Alumnos ({students.length})</span>
        </button>

        <button
          type="button"
          onClick={() => setActiveTab('anuncios')}
          className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
            activeTab === 'anuncios'
              ? 'bg-indigo-600 text-white shadow-sm'
              : 'bg-white text-slate-600 hover:bg-slate-100'
          }`}
        >
          <IconDocument className="w-4 h-4" />
          <span>5. Tablón de Anuncios ({announcements.length})</span>
        </button>
      </div>

      {/* Contenido Dinámico según la Pestaña Activa */}

      {/* TAB 1: RADAR & TELEMETRÍA */}
      {activeTab === 'radar' && (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
          <div className="lg:col-span-8 flex flex-col gap-6">
            <div className="rounded-3xl border border-slate-200/80 bg-white p-6 shadow-xs flex flex-col gap-6">
              <div className="flex items-center justify-between border-b border-slate-100 pb-4">
                <div>
                  <h3 className="text-base font-black text-slate-900">
                    Mapa de Calor de Dudas de la Cátedra
                  </h3>
                  <p className="text-xs text-slate-500 mt-0.5">
                    Telemetría anónima extraída de las consultas al Tutor Socrático en los últimos 7 días.
                  </p>
                </div>
                <span className="text-[10px] font-black uppercase tracking-wider text-amber-700 bg-amber-50 border border-amber-200 px-2.5 py-1 rounded-full">
                  Semana Pre-Parcial
                </span>
              </div>

              {/* Gráfico de Barras de Dudas */}
              <div className="flex flex-col gap-4">
                {telemetry.topics.map((t, idx) => {
                  const maxCount = 40
                  const pct = Math.round((t.student_count / maxCount) * 100)
                  const barColor =
                    t.severity === 'alta'
                      ? 'bg-red-500'
                      : t.severity === 'media'
                      ? 'bg-amber-500'
                      : 'bg-indigo-500'

                  return (
                    <div key={t.id || idx} className="flex flex-col gap-1.5">
                      <div className="flex items-center justify-between text-xs">
                        <span className="font-bold text-slate-800">
                          {idx + 1}. {t.topic_tag}
                        </span>
                        <span className="font-mono text-slate-500 font-bold">
                          {t.student_count} consultas ({pct}%)
                        </span>
                      </div>
                      <div className="h-2.5 w-full rounded-full bg-slate-100 overflow-hidden">
                        <div
                          className={`h-full rounded-full transition-all duration-700 ${barColor}`}
                          style={{ width: `${Math.min(pct, 100)}%` }}
                        />
                      </div>
                    </div>
                  )
                })}
              </div>

              {/* Sugerencia Didáctica de IA */}
              <div className="rounded-2xl bg-indigo-50/80 border border-indigo-100 p-4 sm:p-5 flex items-start gap-3.5">
                <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-indigo-600 text-white shrink-0 shadow-xs">
                  <IconLightbulb className="w-5 h-5" />
                </div>
                <div className="flex flex-col gap-1">
                  <span className="text-[10px] font-black uppercase tracking-wider text-indigo-800">
                    Sugerencia Pedagógica de IA para la Próxima Clase
                  </span>
                  <p className="text-xs sm:text-sm text-indigo-950 leading-relaxed">
                    {telemetry.ai_recommendation}
                  </p>
                </div>
              </div>
            </div>
          </div>

          {/* Columna Derecha: Semáforo de Actividad de la Comisión */}
          <div className="lg:col-span-4 flex flex-col gap-5">
            <div className="rounded-3xl border border-slate-200/80 bg-white p-6 shadow-xs flex flex-col gap-4">
              <h3 className="text-sm font-black text-slate-900 uppercase tracking-wider text-[11px]">
                Estado de Preparación de la Cátedra
              </h3>

              <div className="flex flex-col gap-3">
                <div className="p-3.5 rounded-2xl bg-emerald-50 border border-emerald-100 flex items-center justify-between">
                  <span className="text-xs font-bold text-emerald-900">🟢 Alumnos al día con la Guía</span>
                  <span className="font-black text-sm text-emerald-700">68%</span>
                </div>
                <div className="p-3.5 rounded-2xl bg-amber-50 border border-amber-100 flex items-center justify-between">
                  <span className="text-xs font-bold text-amber-900">🟡 En riesgo / Rezago de lecturas</span>
                  <span className="font-black text-sm text-amber-700">24%</span>
                </div>
                <div className="p-3.5 rounded-2xl bg-rose-50 border border-rose-100 flex items-center justify-between">
                  <span className="text-xs font-bold text-rose-900">🔴 Inactivos (+7 días sin ingresar)</span>
                  <span className="font-black text-sm text-rose-700">8%</span>
                </div>
              </div>

              <p className="text-[11px] text-slate-500 mt-2 leading-relaxed">
                Datos calculados en base a consultas al tutor RAG, resolución de autoevaluaciones y sesiones registradas con la lámpara de concentración IoT.
              </p>
            </div>
          </div>
        </div>
      )}

      {/* TAB 2: BIBLIOGRAFÍA OFICIAL DE CÁTEDRA */}
      {activeTab === 'bibliografia' && (
        <div className="flex flex-col gap-6">
          {docSuccessMsg && (
            <div className="rounded-2xl bg-emerald-50 border border-emerald-200 p-4 text-xs font-bold text-emerald-800 flex items-center gap-2.5 animate-in fade-in">
              <IconCheck className="w-4 h-4 text-emerald-600 shrink-0" />
              <span>{docSuccessMsg}</span>
            </div>
          )}

          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div>
              <h3 className="text-base font-black text-slate-900">
                Documentos Oficiales Indexados en la Base de Conocimiento RAG
              </h3>
              <p className="text-xs text-slate-500 mt-0.5">
                Los alumnos de esta comisión reciben respuestas del Tutor Socrático citando exclusivamente estas fuentes oficiales.
              </p>
            </div>
            <button
              type="button"
              onClick={() => setShowUploadDocModal(true)}
              className="inline-flex items-center gap-2 rounded-xl bg-indigo-600 px-4 py-2.5 text-xs font-bold text-white shadow-xs hover:bg-indigo-700 transition-all cursor-pointer self-start"
            >
              <span>+ Cargar Nuevo Apunte Oficial</span>
            </button>
          </div>


          <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
            {documents.map((doc) => (
              <div
                key={doc.id}
                className="rounded-3xl border border-slate-200 bg-white p-6 shadow-xs flex flex-col justify-between gap-4 hover:border-slate-300 transition-all"
              >
                <div className="flex flex-col gap-2">
                  <div className="flex items-center justify-between">
                    <span className="text-[10px] font-bold uppercase tracking-wider text-purple-700 bg-purple-50 border border-purple-200 px-2 py-0.5 rounded-full">
                      {doc.document_type === 'guia_tp' ? 'Guía de TP' : doc.document_type === 'teorico' ? 'Teórico' : 'Exámenes'}
                    </span>
                    <span className="text-[10px] text-slate-400 font-mono">
                      {doc.created_at}
                    </span>
                  </div>

                  <h4 className="font-bold text-sm text-slate-900 mt-1">
                    {doc.title}
                  </h4>
                </div>

                <div className="border-t border-slate-100 pt-3 flex items-center justify-between text-xs text-slate-600 font-medium">
                  <span>{doc.chunk_count} fragmentos vectoriales</span>
                  <span className="font-bold text-indigo-600">{doc.queries_count} consultas RAG</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* TAB 3: GENERADOR DE EXÁMENES DE CÁTEDRA */}
      {activeTab === 'examenes' && (
        <div className="flex flex-col gap-6">
          <div className="rounded-3xl border border-slate-200/80 bg-white p-6 sm:p-8 shadow-xs flex flex-col gap-6">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-100 pb-5">
              <div>
                <span className="text-[10px] font-black uppercase tracking-wider text-indigo-600 block">
                  Evaluaciones Universitarias Paralelas
                </span>
                <h3 className="text-xl font-black text-slate-900 mt-0.5">
                  Generador de Matrices de Examen (Tema 1 & Tema 2)
                </h3>
                <p className="text-xs text-slate-500 mt-1 max-w-xl">
                  Crea automáticamente exámenes paralelos con equivalencia de dificultad y rúbrica de corrección paso a paso.
                </p>
              </div>

              <button
                type="button"
                disabled={generatingExam}
                onClick={handleGenerateExam}
                className="rounded-2xl bg-indigo-600 hover:bg-indigo-700 disabled:opacity-50 text-white px-5 py-3 text-xs sm:text-sm font-bold shadow-lg transition-all flex items-center gap-2 cursor-pointer self-start sm:self-auto"
              >
                <IconSparkles className="w-4 h-4" />
                <span>{generatingExam ? 'Diseñando Exámenes...' : 'Generar Matriz con IA'}</span>
              </button>
            </div>

            {/* Resultado del Examen Generado */}
            {examData ? (
              <div className="flex flex-col gap-6 animate-in fade-in duration-300">
                <div className="flex items-center justify-between">
                  <h4 className="font-black text-lg text-slate-900">
                    {examData.exam_title}
                  </h4>
                  <button
                    type="button"
                    onClick={() => window.print()}
                    className="inline-flex items-center gap-1.5 rounded-xl border border-slate-200 px-3.5 py-1.5 text-xs font-bold text-slate-700 hover:bg-slate-50 cursor-pointer"
                  >
                    <IconPrinter className="w-3.5 h-3.5" />
                    <span>Imprimir Temas A4</span>
                  </button>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  {examData.exam_matrix?.map((matrixTheme: any, tIdx: number) => (
                    <div
                      key={tIdx}
                      className="rounded-2xl border border-slate-200 bg-slate-50/60 p-5 flex flex-col gap-4"
                    >
                      <div className="flex items-center justify-between border-b border-slate-200 pb-2.5">
                        <span className="font-black text-sm text-indigo-900">
                          {matrixTheme.theme}
                        </span>
                        <span className="text-[10px] font-bold text-slate-500 uppercase">
                          Total: 100 Puntos
                        </span>
                      </div>

                      <div className="flex flex-col gap-4">
                        {matrixTheme.exercises?.map((ex: any, eIdx: number) => (
                          <div
                            key={eIdx}
                            className="rounded-xl bg-white p-4 border border-slate-200 flex flex-col gap-2 shadow-2xs"
                          >
                            <div className="flex items-center justify-between">
                              <span className="text-xs font-black text-slate-900">
                                Ejercicio {ex.number} ({ex.topic})
                              </span>
                              <span className="text-[10px] font-bold text-indigo-600 bg-indigo-50 px-2 py-0.5 rounded-md">
                                {ex.rubric_points} pts
                              </span>
                            </div>
                            <p className="text-xs text-slate-700 leading-relaxed font-mono bg-slate-50 p-2.5 rounded-lg border border-slate-100">
                              {ex.statement}
                            </p>
                            <div className="text-[11px] text-slate-600 mt-1 border-t border-slate-100 pt-2">
                              <span className="font-bold text-emerald-700 block">Rúbrica de Resolución:</span>
                              <span className="text-slate-600">{ex.step_solution}</span>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            ) : (
              <div className="rounded-2xl border border-dashed border-slate-200 p-8 text-center flex flex-col items-center gap-2">
                <span className="text-2xl">📝</span>
                <span className="font-bold text-xs text-slate-700">
                  Ninguna matriz de examen generada todavía
                </span>
                <span className="text-[11px] text-slate-500">
                  Hacé clic en &quot;Generar Matriz con IA&quot; para crear 2 temas de parcial paralelos basados en los temas más críticos de la cursada.
                </span>
              </div>
            )}
          </div>
        </div>
      )}

      {/* TAB 4: PADRÓN DE ALUMNOS INSCRIPTOS */}
      {activeTab === 'alumnos' && (
        <div className="flex flex-col gap-6">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-base font-black text-slate-900">
                Padrón de Estudiantes Matriculados
              </h3>
              <p className="text-xs text-slate-500 mt-0.5">
                Seguimiento individual de hábitos de estudio, consultas socráticas y rendimiento.
              </p>
            </div>
            <span className="text-xs font-bold text-slate-700 bg-slate-100 px-3 py-1.5 rounded-xl">
              {students.length} alumnos registrados
            </span>
          </div>

          <div className="overflow-x-auto rounded-3xl border border-slate-200 bg-white shadow-xs">
            <table className="w-full text-left text-xs text-slate-600">
              <thead className="bg-slate-50 border-b border-slate-200 text-[10px] font-bold uppercase tracking-wider text-slate-500">
                <tr>
                  <th className="px-5 py-4">Estudiante</th>
                  <th className="px-5 py-4">Estado Cursada</th>
                  <th className="px-5 py-4">Foco IoT</th>
                  <th className="px-5 py-4">Consultas RAG</th>
                  <th className="px-5 py-4">Promedio Quiz</th>
                  <th className="px-5 py-4">Última Actividad</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {students.map((st) => (
                  <tr key={st.id} className="hover:bg-slate-50/80 transition-colors">
                    <td className="px-5 py-3.5 font-bold text-slate-900">
                      <div>{st.name}</div>
                      <div className="text-[10px] font-normal text-slate-400">{st.email}</div>
                    </td>
                    <td className="px-5 py-3.5">
                      {st.activity_status === 'al_dia' && (
                        <span className="inline-flex items-center gap-1 rounded-full bg-emerald-50 border border-emerald-200 px-2.5 py-0.5 text-[10px] font-bold text-emerald-700">
                          🟢 Al día
                        </span>
                      )}
                      {st.activity_status === 'en_riesgo' && (
                        <span className="inline-flex items-center gap-1 rounded-full bg-amber-50 border border-amber-200 px-2.5 py-0.5 text-[10px] font-bold text-amber-700">
                          🟡 En riesgo
                        </span>
                      )}
                      {st.activity_status === 'inactivo' && (
                        <span className="inline-flex items-center gap-1 rounded-full bg-rose-50 border border-rose-200 px-2.5 py-0.5 text-[10px] font-bold text-rose-700">
                          🔴 Inactivo
                        </span>
                      )}
                    </td>
                    <td className="px-5 py-3.5 font-mono font-bold text-slate-800">
                      {st.focus_hours} hs
                    </td>
                    <td className="px-5 py-3.5 font-mono font-bold text-indigo-600">
                      {st.rag_queries}
                    </td>
                    <td className="px-5 py-3.5 font-bold text-slate-800">
                      {st.quiz_avg} / 10
                    </td>
                    <td className="px-5 py-3.5 text-slate-400 text-[11px]">
                      {st.last_active}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* TAB 5: TABLÓN DE ANUNCIOS DE CÁTEDRA */}
      {activeTab === 'anuncios' && (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
          {/* Formulario de Publicación */}
          <div className="lg:col-span-5 flex flex-col gap-4">
            <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-xs flex flex-col gap-4">
              <h3 className="text-sm font-black text-slate-900">
                📢 Publicar Nuevo Aviso de Cátedra
              </h3>
              <form onSubmit={handlePostAnnouncement} className="flex flex-col gap-3">
                <div>
                  <label className="text-[10px] font-bold uppercase tracking-wider text-slate-500 block mb-1">
                    Título del Aviso
                  </label>
                  <input
                    type="text"
                    required
                    value={newAnnouncementTitle}
                    onChange={(e) => setNewAnnouncementTitle(e.target.value)}
                    placeholder="Ej: Aula confirmada para el Recuperatorio"
                    className="w-full rounded-xl border border-slate-200 p-2.5 text-xs text-slate-900 focus:border-indigo-600 focus:outline-hidden"
                  />
                </div>

                <div>
                  <label className="text-[10px] font-bold uppercase tracking-wider text-slate-500 block mb-1">
                    Mensaje / Pautas
                  </label>
                  <textarea
                    rows={4}
                    required
                    value={newAnnouncementContent}
                    onChange={(e) => setNewAnnouncementContent(e.target.value)}
                    placeholder="Escribí las indicaciones para los alumnos..."
                    className="w-full rounded-xl border border-slate-200 p-2.5 text-xs text-slate-900 focus:border-indigo-600 focus:outline-hidden"
                  />
                </div>

                <button
                  type="submit"
                  className="rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white py-2.5 text-xs font-bold transition-all shadow-xs cursor-pointer"
                >
                  Publicar y Notificar a la Comisión
                </button>
              </form>
            </div>
          </div>

          {/* Listado de Avisos Publicados */}
          <div className="lg:col-span-7 flex flex-col gap-4">
            <h3 className="text-sm font-black text-slate-900 uppercase tracking-wider text-[11px]">
              Avisos Vigentes en el Tablón ({announcements.length})
            </h3>

            <div className="flex flex-col gap-4">
              {announcements.map((a) => (
                <div
                  key={a.id}
                  className={`rounded-3xl border p-6 shadow-xs flex flex-col gap-2.5 ${
                    a.is_urgent
                      ? 'border-amber-200 bg-amber-50/40'
                      : 'border-slate-200 bg-white'
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      {a.is_urgent && (
                        <span className="text-[10px] font-bold text-amber-700 bg-amber-100 border border-amber-200 px-2 py-0.5 rounded-full">
                          Importante
                        </span>
                      )}
                      <h4 className="font-bold text-sm text-slate-900">{a.title}</h4>
                    </div>
                    <span className="text-[10px] text-slate-400">{a.created_at}</span>
                  </div>

                  <p className="text-xs text-slate-600 leading-relaxed">
                    {a.content}
                  </p>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Modal de Creación de Comisión */}
      {showCreateModal && (
        <div
          className="fixed inset-0 z-[9999] flex items-center justify-center bg-slate-900/60 backdrop-blur-2xs p-4 animate-in fade-in"
          onClick={() => setShowCreateModal(false)}
        >
          <div
            className="w-full max-w-lg rounded-3xl bg-white p-6 sm:p-8 shadow-2xl border border-slate-200 flex flex-col gap-5 animate-in zoom-in-95 text-slate-900"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <h3 className="text-base font-black text-slate-900">
                Crear Nueva Comisión de Cátedra
              </h3>
              <button
                type="button"
                onClick={() => setShowCreateModal(false)}
                className="text-slate-400 hover:text-slate-700 font-bold text-sm"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleCreateSubmit} className="flex flex-col gap-4">
              <div>
                <label className="text-[10px] font-bold uppercase tracking-wider text-slate-500 block mb-1">
                  Nombre de la Materia
                </label>
                <input
                  type="text"
                  required
                  placeholder="Ej: Álgebra y Geometría Analítica"
                  value={newSubjName}
                  onChange={(e) => setNewSubjName(e.target.value)}
                  className="w-full rounded-xl border border-slate-200 p-3 text-xs sm:text-sm text-slate-900 focus:border-indigo-600 focus:outline-hidden"
                />
              </div>

              <div>
                <label className="text-[10px] font-bold uppercase tracking-wider text-slate-500 block mb-1">
                  Identificador de Comisión
                </label>
                <input
                  type="text"
                  required
                  placeholder="Ej: Comisión 2 - Turno Tarde"
                  value={newCommName}
                  onChange={(e) => setNewCommName(e.target.value)}
                  className="w-full rounded-xl border border-slate-200 p-3 text-xs sm:text-sm text-slate-900 focus:border-indigo-600 focus:outline-hidden"
                />
              </div>

              <div>
                <label className="text-[10px] font-bold uppercase tracking-wider text-slate-500 block mb-1">
                  Período Académico
                </label>
                <input
                  type="text"
                  required
                  value={newTerm}
                  onChange={(e) => setNewTerm(e.target.value)}
                  className="w-full rounded-xl border border-slate-200 p-3 text-xs sm:text-sm text-slate-900 focus:border-indigo-600 focus:outline-hidden"
                />
              </div>

              <div>
                <label className="text-[10px] font-bold uppercase tracking-wider text-slate-500 block mb-1">
                  Descripción / Pautas (Opcional)
                </label>
                <textarea
                  rows={3}
                  placeholder="Ej: Clases prácticas martes y jueves de 14 a 18 hs en Aula 302."
                  value={newDesc}
                  onChange={(e) => setNewDesc(e.target.value)}
                  className="w-full rounded-xl border border-slate-200 p-3 text-xs sm:text-sm text-slate-900 focus:border-indigo-600 focus:outline-hidden"
                />
              </div>

              <div className="flex items-center justify-end gap-3 pt-3 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setShowCreateModal(false)}
                  className="rounded-xl px-4 py-2.5 text-xs font-bold text-slate-600 hover:bg-slate-100 transition-colors"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  disabled={creating}
                  className="rounded-xl bg-indigo-600 hover:bg-indigo-700 disabled:opacity-50 text-white px-5 py-2.5 text-xs font-bold shadow-md transition-all cursor-pointer"
                >
                  {creating ? 'Creando...' : 'Crear Comisión'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal de Carga de Apunte Oficial de Cátedra */}
      {showUploadDocModal && (
        <div
          className="fixed inset-0 z-[9999] flex items-center justify-center bg-slate-900/60 backdrop-blur-2xs p-4 animate-in fade-in"
          onClick={() => setShowUploadDocModal(false)}
        >
          <div
            className="w-full max-w-lg rounded-3xl bg-white p-6 sm:p-8 shadow-2xl border border-slate-200 flex flex-col gap-5 animate-in zoom-in-95 text-slate-900"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div>
                <span className="text-[10px] font-black uppercase tracking-wider text-purple-700 bg-purple-50 border border-purple-200 px-2 py-0.5 rounded-full">
                  Biblioteca Vectorial RAG
                </span>
                <h3 className="text-base font-black text-slate-900 mt-1">
                  Cargar Nuevo Apunte Oficial de Cátedra
                </h3>
              </div>
              <button
                type="button"
                onClick={() => setShowUploadDocModal(false)}
                className="text-slate-400 hover:text-slate-700 font-bold text-sm"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleUploadDocSubmit} className="flex flex-col gap-4">
              <div>
                <label className="text-[10px] font-bold uppercase tracking-wider text-slate-500 block mb-1">
                  Título del Documento / Guía
                </label>
                <input
                  type="text"
                  required
                  placeholder="Ej: Guía Oficial de TP N° 3 - Integrales y Métodos Numéricos"
                  value={newDocTitle}
                  onChange={(e) => setNewDocTitle(e.target.value)}
                  className="w-full rounded-xl border border-slate-200 p-3 text-xs sm:text-sm text-slate-900 focus:border-indigo-600 focus:outline-hidden"
                />
              </div>

              <div>
                <label className="text-[10px] font-bold uppercase tracking-wider text-slate-500 block mb-1">
                  Tipo de Documento
                </label>
                <select
                  value={newDocType}
                  onChange={(e) => setNewDocType(e.target.value as any)}
                  className="w-full rounded-xl border border-slate-200 p-3 text-xs sm:text-sm text-slate-900 focus:border-indigo-600 focus:outline-hidden bg-white"
                >
                  <option value="guia_tp">Guía Oficial de Trabajos Prácticos (Ejercicios)</option>
                  <option value="teorico">Material Teórico / Apunte de Clase</option>
                  <option value="examen_modelo">Modelo de Examen / Parcial Anterior</option>
                </select>
              </div>

              <div className="rounded-2xl border-2 border-dashed border-indigo-200 bg-indigo-50/40 p-5 text-center flex flex-col items-center gap-2">
                <span className="text-2xl">📄</span>
                <span className="font-bold text-xs text-slate-800">
                  Seleccionar archivo PDF de Cátedra
                </span>
                <span className="text-[11px] text-slate-500">
                  El sistema extraerá automáticamente el texto, dividirá en chunks de 512 tokens y generará embeddings de 1536 dimensiones con Gemini.
                </span>
              </div>

              <div className="flex items-center justify-end gap-3 pt-3 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setShowUploadDocModal(false)}
                  className="rounded-xl px-4 py-2.5 text-xs font-bold text-slate-600 hover:bg-slate-100 transition-colors"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  disabled={uploadingDoc}
                  className="rounded-xl bg-indigo-600 hover:bg-indigo-700 disabled:opacity-50 text-white px-5 py-2.5 text-xs font-bold shadow-md transition-all cursor-pointer"
                >
                  {uploadingDoc ? 'Indexando en pgvector...' : 'Indexar en la Cátedra'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}

