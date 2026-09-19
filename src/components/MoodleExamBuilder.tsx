'use client'

import { useState, useEffect } from 'react'
import {
  CustomExamData,
  CustomExamQuestion,
  CustomQuestionType,
  suggestCustomQuestionsAction,
} from '@/app/catedra/actions'
import {
  IconSparkles,
  IconPlus,
  IconTrash,
  IconCheck,
  IconPrinter,
  IconDownload,
  IconClock,
  IconBook,
  IconLightbulb,
  IconIncadeLogo,
  IconDocument,
  IconClipboard,
} from '@/components/icons'

interface MoodleExamBuilderProps {
  subjectName: string
  commissionName?: string
  initialExam?: CustomExamData
}

export default function MoodleExamBuilder({
  subjectName,
  commissionName = 'Comisión Oficial',
  initialExam,
}: MoodleExamBuilderProps) {
  // Estado general del examen
  const [exam, setExam] = useState<CustomExamData>(() => {
    if (initialExam) return initialExam
    return {
      id: `exam_${Date.now()}`,
      title: `Primer Parcial Oficial — ${subjectName}`,
      subject_name: subjectName,
      instructions:
        'Leé atentamente cada consigna antes de responder. En preguntas de opción múltiple, solo una opción es correcta. Disponés del tiempo asignado para completar la entrega.',
      time_limit_minutes: 60,
      total_points: 100,
      questions: [
        {
          id: 'q_1',
          type: 'multiple_choice',
          question_text:
            '¿Cuál de las siguientes condiciones es estrictamente necesaria y suficiente para que una función admita recta tangente horizontal en un punto x = c?',
          points: 30,
          options: [
            { id: 'opt_1', text: 'La primera derivada evaluada en c es igual a cero (f\'(c) = 0).', is_correct: true },
            { id: 'opt_2', text: 'La función es discontinua en x = c.', is_correct: false },
            { id: 'opt_3', text: 'El límite en x = c tiende a infinito.', is_correct: false },
            { id: 'opt_4', text: 'La segunda derivada es nula.', is_correct: false },
          ],
          feedback: 'Una recta tangente horizontal tiene pendiente m = 0, lo que equivale a f\'(c) = 0.',
        },
        {
          id: 'q_2',
          type: 'true_false',
          question_text:
            'Si una función f(x) es integrable en [a, b], entonces necesariamente es continua en todo el intervalo.',
          points: 30,
          correct_boolean: false,
          feedback:
            'Falso: una función con un número finito de discontinuidades de salto finito sigue siendo integrable según Riemann.',
        },
        {
          id: 'q_3',
          type: 'development',
          question_text:
            'Enuncie el Teorema Fundamental del Cálculo y explique su relevancia para el cálculo de áreas mediante integrales definidas.',
          points: 40,
          rubric_guidelines:
            'Criterios de corrección (40 pts):\n- 20 pts: Enunciado formal y condiciones de hipótesis (continuidad de f en [a, b]).\n- 10 pts: Expresión matemática de la regla de Barrow (F(b) - F(a)).\n- 10 pts: Interpretación geométrica y relación entre derivación e integración.',
        },
      ],
    }
  })

  // Vista activa: 'editor' | 'preview' | 'print' | 'moodle_xml'
  const [activeView, setActiveView] = useState<'editor' | 'preview' | 'print' | 'moodle_xml'>('editor')

  // Estado para la generación asistida con IA
  const [showAiModal, setShowAiModal] = useState(false)
  const [aiTopic, setAiTopic] = useState('')
  const [aiQuestionCount, setAiQuestionCount] = useState(3)
  const [generatingAi, setGeneratingAi] = useState(false)

  // Estado para la vista previa interactiva (Modo Alumno)
  const [previewAnswers, setPreviewAnswers] = useState<Record<string, any>>({})
  const [previewSubmitted, setPreviewSubmitted] = useState(false)
  const [previewScore, setPreviewScore] = useState(0)

  // Estado de guardado local / copiado
  const [savedSuccess, setSavedSuccess] = useState(false)
  const [copiedXml, setCopiedXml] = useState(false)

  // Calcular puntaje total automáticamente
  const totalCalculatedPoints = exam.questions.reduce((acc, q) => acc + (Number(q.points) || 0), 0)

  // Sincronizar puntaje total
  useEffect(() => {
    setExam((prev) => ({ ...prev, total_points: totalCalculatedPoints }))
  }, [totalCalculatedPoints])

  // Manejadores del Editor
  const handleUpdateExamField = (field: keyof CustomExamData, value: any) => {
    setExam((prev) => ({ ...prev, [field]: value }))
  }

  const handleAddQuestion = (type: CustomQuestionType) => {
    const newQ: CustomExamQuestion = {
      id: `q_${Date.now()}`,
      type,
      question_text:
        type === 'multiple_choice'
          ? 'Nueva pregunta de opción múltiple...'
          : type === 'true_false'
          ? 'Afirmación para evaluar si es Verdadera o Falsa...'
          : 'Consigna de desarrollo o resolución de ejercicio...',
      points: 25,
      options:
        type === 'multiple_choice'
          ? [
              { id: 'opt_1', text: 'Opción A', is_correct: true },
              { id: 'opt_2', text: 'Opción B', is_correct: false },
              { id: 'opt_3', text: 'Opción C', is_correct: false },
              { id: 'opt_4', text: 'Opción D', is_correct: false },
            ]
          : undefined,
      correct_boolean: type === 'true_false' ? true : undefined,
      rubric_guidelines:
        type === 'development'
          ? 'Criterios de corrección:\n- Planteo correcto: 50%\n- Justificación teórica: 50%'
          : undefined,
    }

    setExam((prev) => ({ ...prev, questions: [...prev.questions, newQ] }))
  }

  const handleUpdateQuestion = (qId: string, updated: Partial<CustomExamQuestion>) => {
    setExam((prev) => ({
      ...prev,
      questions: prev.questions.map((q) => (q.id === qId ? { ...q, ...updated } : q)),
    }))
  }

  const handleDeleteQuestion = (qId: string) => {
    if (exam.questions.length <= 1) {
      alert('El examen debe tener al menos una pregunta.')
      return
    }
    setExam((prev) => ({
      ...prev,
      questions: prev.questions.filter((q) => q.id !== qId),
    }))
  }

  const handleAddOption = (qId: string) => {
    setExam((prev) => ({
      ...prev,
      questions: prev.questions.map((q) => {
        if (q.id !== qId) return q
        const currentOpts = q.options || []
        const newOpt = {
          id: `opt_${Date.now()}_${currentOpts.length + 1}`,
          text: `Nueva opción ${String.fromCharCode(65 + currentOpts.length)}`,
          is_correct: false,
        }
        return { ...q, options: [...currentOpts, newOpt] }
      }),
    }))
  }

  const handleDeleteOption = (qId: string, optId: string) => {
    setExam((prev) => ({
      ...prev,
      questions: prev.questions.map((q) => {
        if (q.id !== qId) return q
        const filtered = (q.options || []).filter((o) => o.id !== optId)
        // Asegurar que al menos una quede como correcta si se borró la correcta
        if (filtered.length > 0 && !filtered.some((o) => o.is_correct)) {
          filtered[0].is_correct = true
        }
        return { ...q, options: filtered }
      }),
    }))
  }

  const handleSetCorrectOption = (qId: string, optId: string) => {
    setExam((prev) => ({
      ...prev,
      questions: prev.questions.map((q) => {
        if (q.id !== qId) return q
        return {
          ...q,
          options: (q.options || []).map((o) => ({ ...o, is_correct: o.id === optId })),
        }
      }),
    }))
  }

  // Generación Asistida con IA
  const handleGenerateAiQuestions = async () => {
    if (generatingAi) return
    setGeneratingAi(true)

    try {
      const suggested = await suggestCustomQuestionsAction({
        subject_name: subjectName,
        topic_prompt: aiTopic || 'Conceptos nodales de la materia',
        question_count: aiQuestionCount,
      })

      if (suggested && suggested.length > 0) {
        setExam((prev) => ({ ...prev, questions: [...prev.questions, ...suggested] }))
        setShowAiModal(false)
        setAiTopic('')
      }
    } catch (err) {
      alert('No se pudieron sugerir preguntas en este momento. Intentalo de nuevo.')
    } finally {
      setGeneratingAi(false)
    }
  }

  // Guardar Examen Localmente
  const handleSaveExam = () => {
    try {
      localStorage.setItem(`uninav_custom_exam_${exam.id}`, JSON.stringify(exam))
      setSavedSuccess(true)
      setTimeout(() => setSavedSuccess(false), 2500)
    } catch {
      // Ignorar errores de storage
    }
  }

  // Simulación de Entrega en Vista Previa
  const handlePreviewSubmit = () => {
    let earned = 0
    exam.questions.forEach((q) => {
      const userAns = previewAnswers[q.id]
      if (q.type === 'multiple_choice') {
        const correctOpt = q.options?.find((o) => o.is_correct)?.id
        if (userAns === correctOpt) {
          earned += Number(q.points) || 0
        }
      } else if (q.type === 'true_false') {
        if (userAns === q.correct_boolean) {
          earned += Number(q.points) || 0
        }
      } else if (q.type === 'development') {
        // En desarrollo, simular asignación completa si respondió algo
        if (userAns && userAns.trim().length > 10) {
          earned += Number(q.points) || 0
        }
      }
    })

    setPreviewScore(earned)
    setPreviewSubmitted(true)
  }

  // Generador de Formato Moodle XML
  const generateMoodleXml = () => {
    let xml = `<?xml version="1.0" encoding="UTF-8"?>\n<quiz>\n`
    xml += `  <!-- Examen generado desde UniNav Campus INCADE -->\n`
    xml += `  <!-- Materia: ${exam.subject_name} -->\n\n`

    exam.questions.forEach((q, idx) => {
      if (q.type === 'multiple_choice') {
        xml += `  <question type="multichoice">\n`
        xml += `    <name><text>Pregunta ${idx + 1} - ${q.question_text.slice(0, 30)}...</text></name>\n`
        xml += `    <questiontext format="html">\n`
        xml += `      <text><![CDATA[<p>${q.question_text}</p>]]></text>\n`
        xml += `    </questiontext>\n`
        xml += `    <defaultgrade>${q.points}</defaultgrade>\n`
        xml += `    <single>true</single>\n`
        xml += `    <shuffleanswers>true</shuffleanswers>\n`
        xml += `    <answernumbering>abc</answernumbering>\n`
        q.options?.forEach((opt) => {
          xml += `    <answer fraction="${opt.is_correct ? '100' : '0'}" format="html">\n`
          xml += `      <text><![CDATA[<p>${opt.text}</p>]]></text>\n`
          if (q.feedback) {
            xml += `      <feedback format="html"><text><![CDATA[<p>${q.feedback}</p>]]></text></feedback>\n`
          }
          xml += `    </answer>\n`
        })
        xml += `  </question>\n\n`
      } else if (q.type === 'true_false') {
        xml += `  <question type="truefalse">\n`
        xml += `    <name><text>Pregunta ${idx + 1} - V/F</text></name>\n`
        xml += `    <questiontext format="html">\n`
        xml += `      <text><![CDATA[<p>${q.question_text}</p>]]></text>\n`
        xml += `    </questiontext>\n`
        xml += `    <defaultgrade>${q.points}</defaultgrade>\n`
        xml += `    <answer fraction="${q.correct_boolean ? '100' : '0'}">\n`
        xml += `      <text>true</text>\n`
        xml += `    </answer>\n`
        xml += `    <answer fraction="${!q.correct_boolean ? '100' : '0'}">\n`
        xml += `      <text>false</text>\n`
        xml += `    </answer>\n`
        xml += `  </question>\n\n`
      } else if (q.type === 'development') {
        xml += `  <question type="essay">\n`
        xml += `    <name><text>Pregunta ${idx + 1} - Desarrollo</text></name>\n`
        xml += `    <questiontext format="html">\n`
        xml += `      <text><![CDATA[<p>${q.question_text}</p>]]></text>\n`
        xml += `    </questiontext>\n`
        xml += `    <defaultgrade>${q.points}</defaultgrade>\n`
        if (q.rubric_guidelines) {
          xml += `    <graderinfo format="html"><text><![CDATA[<pre>${q.rubric_guidelines}</pre>]]></text></graderinfo>\n`
        }
        xml += `  </question>\n\n`
      }
    })

    xml += `</quiz>`
    return xml
  }

  const handleDownloadMoodleXml = () => {
    const xml = generateMoodleXml()
    const blob = new Blob([xml], { type: 'application/xml;charset=utf-8' })
    const url = URL.createObjectURL(blob)
    const link = document.createElement('a')
    const safeName = exam.title.replace(/[^a-zA-Z0-9_-]/g, '_')
    link.href = url
    link.download = `Moodle_Quiz_${safeName}.xml`
    link.click()
    URL.revokeObjectURL(url)
  }

  const handleCopyMoodleXml = () => {
    const xml = generateMoodleXml()
    navigator.clipboard.writeText(xml)
    setCopiedXml(true)
    setTimeout(() => setCopiedXml(false), 2000)
  }

  return (
    <div className="flex flex-col gap-6 select-none">
      {/* Barra de Control Principal y Selector de Vistas */}
      <div className="rounded-3xl border border-slate-200/90 bg-white p-5 sm:p-6 shadow-xs flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-[#1E1B4B] text-white shrink-0 shadow-2xs border border-slate-800">
            <IconDocument className="w-5 h-5 text-indigo-300" />
          </div>
          <div className="flex flex-col">
            <div className="flex items-center gap-2">
              <span className="text-[10px] font-black uppercase tracking-wider text-purple-700 bg-purple-50 border border-purple-200 px-2 py-0.5 rounded-full">
                Diseñador de Evaluaciones
              </span>
              <span className="text-[10px] font-bold text-slate-500 bg-slate-100 px-2 py-0.5 rounded-full">
                Estilo Moodle & Campus Virtual
              </span>
            </div>
            <h2 className="text-base sm:text-lg font-black text-slate-900 mt-0.5">
              Constructor de Exámenes Personalizados
            </h2>
          </div>
        </div>

        {/* Selector de Pestañas */}
        <div className="flex items-center gap-1.5 bg-slate-100 p-1.5 rounded-2xl border border-slate-200 shrink-0 overflow-x-auto">
          <button
            type="button"
            onClick={() => setActiveView('editor')}
            className={`rounded-xl px-3 py-1.5 text-xs font-bold transition-all cursor-pointer ${
              activeView === 'editor'
                ? 'bg-white text-indigo-700 shadow-2xs'
                : 'text-slate-600 hover:text-slate-900 hover:bg-slate-200/60'
            }`}
          >
            ✏️ Diseñador
          </button>

          <button
            type="button"
            onClick={() => {
              setActiveView('preview')
              setPreviewSubmitted(false)
            }}
            className={`rounded-xl px-3 py-1.5 text-xs font-bold transition-all cursor-pointer ${
              activeView === 'preview'
                ? 'bg-white text-indigo-700 shadow-2xs'
                : 'text-slate-600 hover:text-slate-900 hover:bg-slate-200/60'
            }`}
          >
            👁️ Vista Alumno (Moodle)
          </button>

          <button
            type="button"
            onClick={() => setActiveView('print')}
            className={`rounded-xl px-3 py-1.5 text-xs font-bold transition-all cursor-pointer ${
              activeView === 'print'
                ? 'bg-white text-indigo-700 shadow-2xs'
                : 'text-slate-600 hover:text-slate-900 hover:bg-slate-200/60'
            }`}
          >
            📄 Formato A4
          </button>

          <button
            type="button"
            onClick={() => setActiveView('moodle_xml')}
            className={`rounded-xl px-3 py-1.5 text-xs font-bold transition-all cursor-pointer ${
              activeView === 'moodle_xml'
                ? 'bg-white text-indigo-700 shadow-2xs'
                : 'text-slate-600 hover:text-slate-900 hover:bg-slate-200/60'
            }`}
          >
            📦 Moodle XML
          </button>
        </div>
      </div>

      {/* ─────────────────────────────────────────────────────────────
          VISTA 1: EDITOR / CONSTRUCTOR DE PREGUNTAS
      ───────────────────────────────────────────────────────────── */}
      {activeView === 'editor' && (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
          {/* Panel Izquierdo: Configuración General del Examen (4 cols) */}
          <div className="lg:col-span-4 flex flex-col gap-5">
            <div className="rounded-3xl border border-slate-200/90 bg-white p-5 sm:p-6 shadow-xs flex flex-col gap-4">
              <h3 className="text-xs font-black uppercase tracking-wider text-slate-700 flex items-center gap-1.5">
                <span>⚙️</span> Parámetros del Examen
              </h3>

              <div className="flex flex-col gap-3">
                <div>
                  <label className="text-[10px] font-bold uppercase tracking-wider text-slate-500 block mb-1">
                    Título de la Evaluación
                  </label>
                  <input
                    type="text"
                    value={exam.title}
                    onChange={(e) => handleUpdateExamField('title', e.target.value)}
                    placeholder="Ej: Primer Parcial Oficial"
                    className="w-full rounded-xl border border-slate-200 p-2.5 text-xs font-semibold text-slate-900 bg-slate-50 focus:bg-white focus:border-indigo-600 focus:outline-hidden"
                  />
                </div>

                <div>
                  <label className="text-[10px] font-bold uppercase tracking-wider text-slate-500 block mb-1">
                    Instrucciones para el Estudiante
                  </label>
                  <textarea
                    rows={3}
                    value={exam.instructions}
                    onChange={(e) => handleUpdateExamField('instructions', e.target.value)}
                    placeholder="Pautas de examen..."
                    className="w-full rounded-xl border border-slate-200 p-2.5 text-xs text-slate-800 bg-slate-50 focus:bg-white focus:border-indigo-600 focus:outline-hidden leading-relaxed"
                  />
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="text-[10px] font-bold uppercase tracking-wider text-slate-500 block mb-1">
                      Tiempo Límite
                    </label>
                    <select
                      value={exam.time_limit_minutes}
                      onChange={(e) =>
                        handleUpdateExamField('time_limit_minutes', Number(e.target.value))
                      }
                      className="w-full rounded-xl border border-slate-200 p-2.5 text-xs font-bold text-slate-900 bg-slate-50 focus:bg-white focus:outline-hidden cursor-pointer"
                    >
                      <option value={0}>Sin límite</option>
                      <option value={30}>30 minutos</option>
                      <option value={45}>45 minutos</option>
                      <option value={60}>60 minutos</option>
                      <option value={90}>90 minutos</option>
                      <option value={120}>120 minutos</option>
                    </select>
                  </div>

                  <div>
                    <label className="text-[10px] font-bold uppercase tracking-wider text-slate-500 block mb-1">
                      Puntaje Total
                    </label>
                    <div className="rounded-xl border border-indigo-200 bg-indigo-50/60 p-2.5 text-center font-mono font-black text-xs text-indigo-900">
                      {totalCalculatedPoints} Puntos
                    </div>
                  </div>
                </div>
              </div>

              {/* Botón Guardar Examen */}
              <button
                type="button"
                onClick={handleSaveExam}
                className="w-full rounded-xl bg-slate-900 hover:bg-slate-800 text-white py-2.5 text-xs font-bold transition-all shadow-2xs flex items-center justify-center gap-1.5 cursor-pointer"
              >
                <IconCheck className="w-3.5 h-3.5 text-emerald-400" />
                <span>{savedSuccess ? '¡Examen Guardado!' : 'Guardar Cambios de Examen'}</span>
              </button>
            </div>

            {/* Asistente IA para Sugerir Preguntas */}
            <div className="rounded-3xl border border-indigo-200 bg-indigo-50/50 p-5 shadow-xs flex flex-col gap-3">
              <div className="flex items-center gap-2">
                <span className="flex h-7 w-7 items-center justify-center rounded-xl bg-indigo-600 text-white font-bold text-xs shrink-0 shadow-2xs">
                  <IconSparkles className="w-3.5 h-3.5" />
                </span>
                <div>
                  <h4 className="text-xs font-black text-indigo-950">Asistente IA de Cátedra</h4>
                  <p className="text-[11px] text-indigo-800">
                    Sugerí borradores de preguntas según tus apuntes y modificalas.
                  </p>
                </div>
              </div>

              <button
                type="button"
                onClick={() => setShowAiModal(true)}
                className="rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white py-2 px-3 text-xs font-bold transition-all shadow-xs flex items-center justify-center gap-1.5 cursor-pointer"
              >
                <IconSparkles className="w-3.5 h-3.5" />
                <span>+ Sugerir Preguntas con IA</span>
              </button>
            </div>
          </div>

          {/* Panel Derecho: Lista de Preguntas Personalizadas (8 cols) */}
          <div className="lg:col-span-8 flex flex-col gap-5">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-200 pb-3">
              <div>
                <h3 className="text-sm font-black text-slate-900 uppercase tracking-wider text-[11px]">
                  Banco de Preguntas del Examen ({exam.questions.length})
                </h3>
                <p className="text-xs text-slate-500">
                  Agregá, personalizá opciones, respuestas correctas y puntajes.
                </p>
              </div>

              {/* Botones Agregar Pregunta Rápida */}
              <div className="flex items-center gap-2 flex-wrap">
                <button
                  type="button"
                  onClick={() => handleAddQuestion('multiple_choice')}
                  className="rounded-xl border border-slate-200 bg-white hover:bg-slate-50 px-3 py-1.5 text-xs font-bold text-slate-700 transition-colors shadow-2xs cursor-pointer flex items-center gap-1"
                >
                  <IconPlus className="w-3 h-3 text-indigo-600" />
                  <span>+ Opción Múltiple</span>
                </button>

                <button
                  type="button"
                  onClick={() => handleAddQuestion('true_false')}
                  className="rounded-xl border border-slate-200 bg-white hover:bg-slate-50 px-3 py-1.5 text-xs font-bold text-slate-700 transition-colors shadow-2xs cursor-pointer flex items-center gap-1"
                >
                  <IconPlus className="w-3 h-3 text-purple-600" />
                  <span>+ V / F</span>
                </button>

                <button
                  type="button"
                  onClick={() => handleAddQuestion('development')}
                  className="rounded-xl border border-slate-200 bg-white hover:bg-slate-50 px-3 py-1.5 text-xs font-bold text-slate-700 transition-colors shadow-2xs cursor-pointer flex items-center gap-1"
                >
                  <IconPlus className="w-3 h-3 text-emerald-600" />
                  <span>+ Desarrollo</span>
                </button>
              </div>
            </div>

            {/* Lista de Preguntas */}
            <div className="flex flex-col gap-5">
              {exam.questions.map((q, idx) => (
                <div
                  key={q.id}
                  className="rounded-3xl border border-slate-200/90 bg-white p-5 sm:p-6 shadow-xs flex flex-col gap-4 relative group hover:border-indigo-300 transition-all"
                >
                  {/* Cabecera de la Pregunta */}
                  <div className="flex items-center justify-between border-b border-slate-100 pb-3">
                    <div className="flex items-center gap-2.5">
                      <span className="flex h-7 w-7 items-center justify-center rounded-xl bg-slate-900 text-white font-black text-xs shrink-0">
                        {idx + 1}
                      </span>
                      <span
                        className={`text-[10px] font-bold uppercase tracking-wider px-2.5 py-0.5 rounded-full border ${
                          q.type === 'multiple_choice'
                            ? 'bg-indigo-50 border-indigo-200 text-indigo-700'
                            : q.type === 'true_false'
                            ? 'bg-purple-50 border-purple-200 text-purple-700'
                            : 'bg-emerald-50 border-emerald-200 text-emerald-700'
                        }`}
                      >
                        {q.type === 'multiple_choice'
                          ? 'Opción Múltiple'
                          : q.type === 'true_false'
                          ? 'Verdadero / Falso'
                          : 'Desarrollo / Práctico'}
                      </span>
                    </div>

                    <div className="flex items-center gap-3">
                      {/* Puntaje de la pregunta */}
                      <div className="flex items-center gap-1.5">
                        <span className="text-[10px] font-bold text-slate-400 uppercase">Puntos:</span>
                        <input
                          type="number"
                          min={1}
                          max={100}
                          value={q.points}
                          onChange={(e) =>
                            handleUpdateQuestion(q.id, { points: Number(e.target.value) || 0 })
                          }
                          className="w-16 rounded-lg border border-slate-200 p-1 text-center font-mono font-bold text-xs text-slate-900 bg-slate-50 focus:bg-white focus:outline-hidden"
                        />
                      </div>

                      {/* Botón Borrar */}
                      <button
                        type="button"
                        onClick={() => handleDeleteQuestion(q.id)}
                        className="text-slate-400 hover:text-rose-600 p-1.5 rounded-lg hover:bg-rose-50 transition-colors cursor-pointer"
                        title="Eliminar pregunta"
                      >
                        <IconTrash className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>

                  {/* Enunciado de la Pregunta */}
                  <div className="flex flex-col gap-1.5">
                    <label className="text-[10px] font-bold uppercase tracking-wider text-slate-500">
                      Enunciado de la Pregunta
                    </label>
                    <textarea
                      rows={2}
                      value={q.question_text}
                      onChange={(e) => handleUpdateQuestion(q.id, { question_text: e.target.value })}
                      placeholder="Escribí el texto de la consigna..."
                      className="w-full rounded-2xl border border-slate-200 p-3 text-xs font-semibold text-slate-900 bg-slate-50/60 focus:bg-white focus:border-indigo-600 focus:outline-hidden"
                    />
                  </div>

                  {/* Renderizado Específico según Tipo de Pregunta */}
                  {/* 1. OPCIÓN MÚLTIPLE */}
                  {q.type === 'multiple_choice' && (
                    <div className="flex flex-col gap-2.5 pt-1">
                      <div className="flex items-center justify-between">
                        <span className="text-[10px] font-bold uppercase tracking-wider text-slate-500">
                          Opciones de Respuesta (Marcá la Correcta):
                        </span>
                        <button
                          type="button"
                          onClick={() => handleAddOption(q.id)}
                          className="text-[10px] font-bold text-indigo-600 hover:underline cursor-pointer"
                        >
                          + Agregar Opción
                        </button>
                      </div>

                      <div className="flex flex-col gap-2">
                        {q.options?.map((opt, optIdx) => (
                          <div
                            key={opt.id}
                            className={`flex items-center gap-2.5 p-2 rounded-xl border transition-all ${
                              opt.is_correct
                                ? 'border-emerald-300 bg-emerald-50/60 shadow-2xs'
                                : 'border-slate-200 bg-slate-50/40'
                            }`}
                          >
                            <input
                              type="radio"
                              name={`correct_${q.id}`}
                              checked={opt.is_correct}
                              onChange={() => handleSetCorrectOption(q.id, opt.id)}
                              className="h-4 w-4 text-emerald-600 focus:ring-emerald-500 cursor-pointer"
                              title="Marcar como respuesta correcta"
                            />

                            <span className="font-mono font-bold text-xs text-slate-500 w-5 text-center shrink-0">
                              {String.fromCharCode(65 + optIdx)})
                            </span>

                            <input
                              type="text"
                              value={opt.text}
                              onChange={(e) => {
                                const newOpts = (q.options || []).map((o) =>
                                  o.id === opt.id ? { ...o, text: e.target.value } : o
                                )
                                handleUpdateQuestion(q.id, { options: newOpts })
                              }}
                              className="flex-1 bg-transparent text-xs font-medium text-slate-900 focus:outline-hidden"
                            />

                            {opt.is_correct && (
                              <span className="text-[9px] font-black text-emerald-700 uppercase bg-white border border-emerald-300 px-2 py-0.5 rounded-md shrink-0">
                                Correcta
                              </span>
                            )}

                            {(q.options?.length || 0) > 2 && (
                              <button
                                type="button"
                                onClick={() => handleDeleteOption(q.id, opt.id)}
                                className="text-slate-400 hover:text-rose-600 text-xs px-1"
                                title="Eliminar opción"
                              >
                                ✕
                              </button>
                            )}
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* 2. VERDADERO / FALSO */}
                  {q.type === 'true_false' && (
                    <div className="flex flex-col gap-2 pt-1">
                      <span className="text-[10px] font-bold uppercase tracking-wider text-slate-500">
                        Valor de Verdad Correcto:
                      </span>
                      <div className="flex items-center gap-4">
                        <label className="flex items-center gap-2 cursor-pointer p-2 rounded-xl border border-slate-200 bg-slate-50 hover:bg-slate-100 text-xs font-bold text-slate-800">
                          <input
                            type="radio"
                            name={`tf_${q.id}`}
                            checked={q.correct_boolean === true}
                            onChange={() => handleUpdateQuestion(q.id, { correct_boolean: true })}
                            className="h-4 w-4 text-indigo-600 focus:ring-indigo-500"
                          />
                          <span>Verdadero (True)</span>
                        </label>

                        <label className="flex items-center gap-2 cursor-pointer p-2 rounded-xl border border-slate-200 bg-slate-50 hover:bg-slate-100 text-xs font-bold text-slate-800">
                          <input
                            type="radio"
                            name={`tf_${q.id}`}
                            checked={q.correct_boolean === false}
                            onChange={() => handleUpdateQuestion(q.id, { correct_boolean: false })}
                            className="h-4 w-4 text-indigo-600 focus:ring-indigo-500"
                          />
                          <span>Falso (False)</span>
                        </label>
                      </div>
                    </div>
                  )}

                  {/* 3. DESARROLLO / PRÁCTICO */}
                  {q.type === 'development' && (
                    <div className="flex flex-col gap-1.5 pt-1">
                      <label className="text-[10px] font-bold uppercase tracking-wider text-slate-500">
                        Rúbrica de Corrección y Criterios Esperados
                      </label>
                      <textarea
                        rows={2}
                        value={q.rubric_guidelines || ''}
                        onChange={(e) =>
                          handleUpdateQuestion(q.id, { rubric_guidelines: e.target.value })
                        }
                        placeholder="Puntos clave que el alumno debe fundamentar..."
                        className="w-full rounded-xl border border-slate-200 p-2.5 text-xs text-slate-700 bg-slate-50 focus:bg-white focus:border-indigo-600 focus:outline-hidden font-mono"
                      />
                    </div>
                  )}

                  {/* Retroalimentación Formativa Opcional */}
                  <div className="flex flex-col gap-1 border-t border-slate-100 pt-2">
                    <label className="text-[9px] font-bold uppercase tracking-wider text-slate-400">
                      Retroalimentación Formativa (Feedback para el alumno al terminar)
                    </label>
                    <input
                      type="text"
                      value={q.feedback || ''}
                      onChange={(e) => handleUpdateQuestion(q.id, { feedback: e.target.value })}
                      placeholder="Explicación pedagógica de la solución..."
                      className="w-full rounded-lg border border-slate-100 bg-slate-50/50 px-2.5 py-1.5 text-xs text-slate-700 focus:bg-white focus:outline-hidden"
                    />
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* ─────────────────────────────────────────────────────────────
          VISTA 2: VISTA PREVIA DEL ESTUDIANTE (MODO MOODLE)
      ───────────────────────────────────────────────────────────── */}
      {activeView === 'preview' && (
        <div className="max-w-4xl mx-auto w-full flex flex-col gap-6">
          <div className="rounded-3xl border border-slate-200 bg-white p-6 sm:p-8 shadow-xs flex flex-col gap-4">
            <div className="flex items-center justify-between border-b border-slate-100 pb-4">
              <div>
                <span className="text-[10px] font-black uppercase tracking-wider text-indigo-700 bg-indigo-50 border border-indigo-200 px-2.5 py-0.5 rounded-full">
                  Campus Virtual • Cuestionario Moodle
                </span>
                <h2 className="text-xl font-black text-slate-900 mt-1">{exam.title}</h2>
                <p className="text-xs text-slate-500 mt-0.5">
                  {commissionName} • {exam.subject_name}
                </p>
              </div>

              {exam.time_limit_minutes > 0 && (
                <div className="flex items-center gap-1.5 rounded-2xl bg-slate-900 text-white px-3.5 py-2 text-xs font-mono font-bold shadow-2xs">
                  <IconClock className="w-4 h-4 text-indigo-300" />
                  <span>{exam.time_limit_minutes}:00 min</span>
                </div>
              )}
            </div>

            <p className="text-xs text-slate-600 bg-slate-50 p-3.5 rounded-2xl border border-slate-200 leading-relaxed">
              <strong>Instrucciones:</strong> {exam.instructions}
            </p>

            {/* Lista de Preguntas en Modo Cuestionario */}
            <div className="flex flex-col gap-6 mt-2">
              {exam.questions.map((q, idx) => {
                const userAns = previewAnswers[q.id]
                const isCorrect =
                  q.type === 'multiple_choice'
                    ? userAns === q.options?.find((o) => o.is_correct)?.id
                    : q.type === 'true_false'
                    ? userAns === q.correct_boolean
                    : Boolean(userAns);

                return (
                  <div
                    key={q.id}
                    className="rounded-3xl border border-slate-200 bg-white p-6 shadow-xs flex flex-col gap-4"
                  >
                    <div className="flex items-center justify-between border-b border-slate-100 pb-2.5">
                      <span className="font-black text-xs text-slate-900">
                        Pregunta {idx + 1}
                      </span>
                      <span className="text-[10px] font-bold text-slate-500 bg-slate-100 px-2 py-0.5 rounded-md">
                        Puntúa sobre {q.points} pts
                      </span>
                    </div>

                    <p className="text-xs sm:text-sm font-semibold text-slate-800 leading-relaxed">
                      {q.question_text}
                    </p>

                    {/* Render Opciones */}
                    {q.type === 'multiple_choice' && (
                      <div className="flex flex-col gap-2">
                        {q.options?.map((opt, optIdx) => (
                          <label
                            key={opt.id}
                            className={`flex items-center gap-3 p-3 rounded-2xl border transition-all cursor-pointer ${
                              previewAnswers[q.id] === opt.id
                                ? 'border-indigo-600 bg-indigo-50/80 text-indigo-950 font-bold'
                                : 'border-slate-200 hover:bg-slate-50 text-slate-700'
                            }`}
                          >
                            <input
                              type="radio"
                              name={`preview_${q.id}`}
                              disabled={previewSubmitted}
                              checked={previewAnswers[q.id] === opt.id}
                              onChange={() =>
                                setPreviewAnswers((prev) => ({ ...prev, [q.id]: opt.id }))
                              }
                              className="h-4 w-4 text-indigo-600"
                            />
                            <span className="font-mono text-xs">{String.fromCharCode(65 + optIdx)})</span>
                            <span className="text-xs">{opt.text}</span>
                          </label>
                        ))}
                      </div>
                    )}

                    {q.type === 'true_false' && (
                      <div className="flex items-center gap-3">
                        <label
                          className={`flex items-center gap-2 p-3 rounded-2xl border cursor-pointer ${
                            previewAnswers[q.id] === true
                              ? 'border-indigo-600 bg-indigo-50 text-indigo-900 font-bold'
                              : 'border-slate-200 hover:bg-slate-50 text-slate-700'
                          }`}
                        >
                          <input
                            type="radio"
                            name={`preview_${q.id}`}
                            disabled={previewSubmitted}
                            checked={previewAnswers[q.id] === true}
                            onChange={() =>
                              setPreviewAnswers((prev) => ({ ...prev, [q.id]: true }))
                            }
                            className="h-4 w-4 text-indigo-600"
                          />
                          <span className="text-xs">Verdadero</span>
                        </label>

                        <label
                          className={`flex items-center gap-2 p-3 rounded-2xl border cursor-pointer ${
                            previewAnswers[q.id] === false
                              ? 'border-indigo-600 bg-indigo-50 text-indigo-900 font-bold'
                              : 'border-slate-200 hover:bg-slate-50 text-slate-700'
                          }`}
                        >
                          <input
                            type="radio"
                            name={`preview_${q.id}`}
                            disabled={previewSubmitted}
                            checked={previewAnswers[q.id] === false}
                            onChange={() =>
                              setPreviewAnswers((prev) => ({ ...prev, [q.id]: false }))
                            }
                            className="h-4 w-4 text-indigo-600"
                          />
                          <span className="text-xs">Falso</span>
                        </label>
                      </div>
                    )}

                    {q.type === 'development' && (
                      <div className="flex flex-col gap-2">
                        <textarea
                          rows={4}
                          disabled={previewSubmitted}
                          value={previewAnswers[q.id] || ''}
                          onChange={(e) =>
                            setPreviewAnswers((prev) => ({ ...prev, [q.id]: e.target.value }))
                          }
                          placeholder="Escribí tu fundamentación o resolución..."
                          className="w-full rounded-2xl border border-slate-200 p-3 text-xs text-slate-900 focus:outline-hidden"
                        />
                      </div>
                    )}

                    {/* Resultado / Feedback en Preview Post-Entrega */}
                    {previewSubmitted && (
                      <div
                        className={`rounded-2xl p-4 text-xs flex flex-col gap-1.5 border ${
                          isCorrect
                            ? 'bg-emerald-50 border-emerald-200 text-emerald-900'
                            : 'bg-rose-50 border-rose-200 text-rose-900'
                        }`}
                      >
                        <span className="font-bold flex items-center gap-1">
                          {isCorrect ? '✓ Respuesta Correcta' : '✗ Respuesta Incorrecta'}
                        </span>
                        {q.feedback && <p className="text-[11px]">{q.feedback}</p>}
                        {q.rubric_guidelines && (
                          <div className="mt-1 pt-1 border-t border-emerald-200 text-[11px] font-mono">
                            <strong>Rúbrica de corrección:</strong>
                            <pre className="whitespace-pre-wrap mt-0.5">{q.rubric_guidelines}</pre>
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                )
              })}
            </div>

            {/* Barra Inferior de Entrega del Cuestionario */}
            <div className="border-t border-slate-100 pt-5 flex items-center justify-between">
              {previewSubmitted ? (
                <div className="flex items-center gap-3">
                  <div className="flex flex-col">
                    <span className="text-[10px] font-bold uppercase text-slate-400">Calificación Obtenida</span>
                    <span className="text-lg font-black text-indigo-900">
                      {previewScore} / {totalCalculatedPoints} pts (
                      {Math.round((previewScore / Math.max(1, totalCalculatedPoints)) * 100)}%)
                    </span>
                  </div>
                  <button
                    type="button"
                    onClick={() => {
                      setPreviewSubmitted(false)
                      setPreviewAnswers({})
                    }}
                    className="rounded-xl border border-slate-200 bg-white hover:bg-slate-50 px-4 py-2 text-xs font-bold text-slate-700 cursor-pointer shadow-2xs"
                  >
                    Reintentar Vista Previa
                  </button>
                </div>
              ) : (
                <button
                  type="button"
                  onClick={handlePreviewSubmit}
                  className="rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white px-6 py-2.5 text-xs font-bold transition-all shadow-xs cursor-pointer"
                >
                  Terminar Intento y Enviar Examen
                </button>
              )}
            </div>
          </div>
        </div>
      )}

      {/* ─────────────────────────────────────────────────────────────
          VISTA 3: FORMATO IMPRESIÓN A4 (HOJA FORMAL INCADE)
      ───────────────────────────────────────────────────────────── */}
      {activeView === 'print' && (
        <div className="flex flex-col gap-4 max-w-4xl mx-auto w-full">
          <div className="flex items-center justify-between no-print bg-slate-900 text-white p-4 rounded-2xl">
            <div className="flex items-center gap-2">
              <IconPrinter className="w-4 h-4 text-indigo-300" />
              <span className="text-xs font-bold">Plantilla Imprimible A4 de Cátedra Oficial</span>
            </div>
            <button
              type="button"
              onClick={() => window.print()}
              className="rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white px-4 py-2 text-xs font-bold transition-all cursor-pointer shadow-xs"
            >
              Imprimir Examen A4 (PDF)
            </button>
          </div>

          {/* Hoja Formal A4 */}
          <div className="rounded-3xl border border-slate-300 bg-white p-8 sm:p-12 shadow-md flex flex-col gap-6 font-serif select-text text-slate-900">
            {/* Encabezado Institucional */}
            <div className="flex items-start justify-between border-b-2 border-slate-900 pb-5">
              <div className="flex items-center gap-4">
                <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-[#1E1B4B] p-1.5 shrink-0">
                  <IconIncadeLogo className="w-10 h-10 text-white" />
                </div>
                <div>
                  <h1 className="text-lg font-black tracking-tight uppercase font-sans">
                    Instituto Superior INCADE
                  </h1>
                  <h2 className="text-sm font-bold text-slate-700 font-sans">
                    {exam.subject_name} • {commissionName}
                  </h2>
                  <span className="text-xs font-semibold text-slate-500 font-sans">
                    {exam.title}
                  </span>
                </div>
              </div>

              <div className="border border-slate-900 p-3 rounded-xl text-center font-sans">
                <span className="text-[10px] font-bold uppercase block">Calificación</span>
                <span className="text-xl font-black">___ / 100</span>
              </div>
            </div>

            {/* Datos del Alumno */}
            <div className="grid grid-cols-2 gap-4 font-sans text-xs border-b border-slate-200 pb-4">
              <div>
                <strong>Apellido y Nombre:</strong> ___________________________________
              </div>
              <div>
                <strong>DNI:</strong> ______________________ <strong>Fecha:</strong> ___/___/2026
              </div>
            </div>

            {/* Instrucciones */}
            <div className="text-xs font-sans italic text-slate-600">
              <strong>Pautas:</strong> {exam.instructions}
            </div>

            {/* Preguntas Formales */}
            <div className="flex flex-col gap-6 font-sans">
              {exam.questions.map((q, idx) => (
                <div key={q.id} className="flex flex-col gap-2">
                  <div className="flex items-center justify-between font-bold text-xs">
                    <span>
                      {idx + 1}. {q.question_text}
                    </span>
                    <span className="font-mono text-slate-500 font-normal">({q.points} pts)</span>
                  </div>

                  {q.type === 'multiple_choice' && (
                    <div className="grid grid-cols-1 gap-1.5 pl-4 text-xs text-slate-700">
                      {q.options?.map((opt, optIdx) => (
                        <div key={opt.id} className="flex items-center gap-2">
                          <span className="inline-block w-4 h-4 border border-slate-400 rounded-sm text-center text-[10px]"></span>
                          <span>
                            {String.fromCharCode(65 + optIdx)}) {opt.text}
                          </span>
                        </div>
                      ))}
                    </div>
                  )}

                  {q.type === 'true_false' && (
                    <div className="flex items-center gap-6 pl-4 text-xs text-slate-700">
                      <div className="flex items-center gap-1.5">
                        <span className="inline-block w-4 h-4 border border-slate-400 rounded-sm"></span>
                        <span>Verdadero</span>
                      </div>
                      <div className="flex items-center gap-1.5">
                        <span className="inline-block w-4 h-4 border border-slate-400 rounded-sm"></span>
                        <span>Falso</span>
                      </div>
                    </div>
                  )}

                  {q.type === 'development' && (
                    <div className="pt-2">
                      <div className="border-b border-dashed border-slate-300 h-6"></div>
                      <div className="border-b border-dashed border-slate-300 h-6"></div>
                      <div className="border-b border-dashed border-slate-300 h-6"></div>
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* ─────────────────────────────────────────────────────────────
          VISTA 4: EXPORTAR FORMATO MOODLE XML
      ───────────────────────────────────────────────────────────── */}
      {activeView === 'moodle_xml' && (
        <div className="rounded-3xl border border-slate-200 bg-white p-6 sm:p-8 shadow-xs flex flex-col gap-5">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-100 pb-4">
            <div>
              <span className="text-[10px] font-black uppercase tracking-wider text-purple-700 bg-purple-50 border border-purple-200 px-2 py-0.5 rounded-full">
                Estándar Internacional LMS
              </span>
              <h3 className="text-lg font-black text-slate-900 mt-1">
                Exportar Banco de Preguntas Moodle XML
              </h3>
              <p className="text-xs text-slate-500 mt-0.5">
                Importá directamente este archivo en el Campus Virtual Moodle de INCADE (Administración del curso &gt; Banco de preguntas &gt; Importar).
              </p>
            </div>

            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={handleCopyMoodleXml}
                className="rounded-xl border border-slate-200 bg-slate-50 hover:bg-slate-100 px-3.5 py-2 text-xs font-bold text-slate-700 transition-colors flex items-center gap-1.5 cursor-pointer shadow-2xs"
              >
                <IconClipboard className="w-3.5 h-3.5" />
                <span>{copiedXml ? '¡Copiado!' : 'Copiar XML'}</span>
              </button>

              <button
                type="button"
                onClick={handleDownloadMoodleXml}
                className="rounded-xl bg-indigo-600 hover:bg-indigo-700 px-4 py-2 text-xs font-bold text-white transition-colors flex items-center gap-1.5 cursor-pointer shadow-2xs"
              >
                <IconDownload className="w-3.5 h-3.5" />
                <span>Descargar archivo .xml</span>
              </button>
            </div>
          </div>

          <div className="rounded-2xl bg-slate-950 p-5 text-slate-200 font-mono text-xs overflow-x-auto max-h-[450px] leading-relaxed select-text">
            <pre>{generateMoodleXml()}</pre>
          </div>
        </div>
      )}

      {/* ─────────────────────────────────────────────────────────────
          MODAL: ASISTENTE IA PARA SUGERIR PREGUNTAS
      ───────────────────────────────────────────────────────────── */}
      {showAiModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/60 backdrop-blur-xs p-4 animate-in fade-in">
          <div className="relative w-full max-w-lg rounded-3xl border border-slate-200 bg-white p-6 shadow-2xl flex flex-col gap-4">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div className="flex items-center gap-2.5">
                <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-indigo-600 text-white font-bold text-xs shadow-2xs">
                  <IconSparkles className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="text-sm font-black text-slate-900">Sugerir Preguntas con IA</h3>
                  <p className="text-[11px] text-slate-500">Materia: {subjectName}</p>
                </div>
              </div>

              <button
                type="button"
                onClick={() => setShowAiModal(false)}
                className="text-slate-400 hover:text-slate-700 text-sm font-bold"
              >
                ✕
              </button>
            </div>

            <div className="flex flex-col gap-3">
              <div>
                <label className="text-[10px] font-bold uppercase tracking-wider text-slate-500 block mb-1">
                  Tema o Unidad Específica a Evaluar
                </label>
                <input
                  type="text"
                  value={aiTopic}
                  onChange={(e) => setAiTopic(e.target.value)}
                  placeholder="Ej: Teorema de Rolle, Integrales por partes, Matrices..."
                  className="w-full rounded-xl border border-slate-200 p-2.5 text-xs text-slate-900 bg-slate-50 focus:bg-white focus:outline-hidden"
                />
              </div>

              <div>
                <label className="text-[10px] font-bold uppercase tracking-wider text-slate-500 block mb-1">
                  Cantidad de Preguntas a Generar
                </label>
                <select
                  value={aiQuestionCount}
                  onChange={(e) => setAiQuestionCount(Number(e.target.value))}
                  className="w-full rounded-xl border border-slate-200 p-2.5 text-xs font-bold text-slate-900 bg-slate-50 focus:outline-hidden cursor-pointer"
                >
                  <option value={2}>2 preguntas</option>
                  <option value={3}>3 preguntas</option>
                  <option value={4}>4 preguntas</option>
                  <option value={5}>5 preguntas</option>
                </select>
              </div>
            </div>

            <div className="flex items-center justify-end gap-2 pt-3 border-t border-slate-100">
              <button
                type="button"
                onClick={() => setShowAiModal(false)}
                className="px-3.5 py-2 rounded-xl text-xs font-bold text-slate-600 hover:bg-slate-100"
              >
                Cancelar
              </button>
              <button
                type="button"
                disabled={generatingAi}
                onClick={handleGenerateAiQuestions}
                className="px-5 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold transition-all shadow-xs flex items-center gap-1.5 cursor-pointer disabled:opacity-50"
              >
                <IconSparkles className="w-3.5 h-3.5" />
                <span>{generatingAi ? 'Generando...' : 'Generar Preguntas'}</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
