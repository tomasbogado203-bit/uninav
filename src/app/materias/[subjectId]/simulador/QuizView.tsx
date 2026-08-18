'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { createQuizAction, submitQuizAttemptAction, deleteQuizAction } from './actions'
import {
  IconQuiz,
  IconDocument,
  IconBook,
  IconSearch,
  IconSparkles,
  IconTrash,
  IconChat,
} from '@/components/icons'

interface Thread {
  id: string
  title: string
}

interface ExamDocument {
  id: string
  title: string
}

interface Question {
  id: string
  question_text: string
  question_format: 'multiple_choice' | 'desarrollo'
  options?: string[] | null
  correct_answer: string
  source_page?: number | null
  explanation?: string
}

interface QuizAttempt {
  id: string
  score: number
  attempted_at: string
}

export interface QuizItem {
  id: string
  quiz_type: string
  scope: string
  created_at: string
  quiz_questions: Question[]
  quiz_attempts?: QuizAttempt[]
}

interface QuizViewProps {
  subjectId: string
  subjectName?: string
  threads: Thread[]
  examDocuments: ExamDocument[]
  existingQuizzes?: QuizItem[]
}

export default function QuizView({
  subjectId,
  subjectName = 'Materia',
  threads = [],
  examDocuments = [],
  existingQuizzes = [],
}: QuizViewProps) {
  const [quizzesList, setQuizzesList] = useState<QuizItem[]>(existingQuizzes)
  const [loading, setLoading] = useState(false)
  const [activeQuiz, setActiveQuiz] = useState<{
    id: string
    quizType: 'multiple_choice' | 'desarrollo'
    questions: Question[]
  } | null>(null)

  const [selectedAnswers, setSelectedAnswers] = useState<Record<string, string>>({})
  const [selfScores, setSelfScores] = useState<Record<string, number>>({})
  const [submitted, setSubmitted] = useState(false)
  const [finalScore, setFinalScore] = useState<number | null>(null)

  // Temporizador opcional en minutos
  const [timerMinutes, setTimerMinutes] = useState<number>(0) // 0 = Sin límite
  const [timeRemainingSeconds, setTimeRemainingSeconds] = useState<number | null>(null)

  useEffect(() => {
    setQuizzesList(existingQuizzes)
  }, [existingQuizzes])

  // Lógica del Temporizador de Examen
  useEffect(() => {
    if (!activeQuiz || submitted || timeRemainingSeconds === null || timeRemainingSeconds <= 0) return

    const interval = setInterval(() => {
      setTimeRemainingSeconds((prev) => {
        if (prev === null || prev <= 1) {
          clearInterval(interval)
          // Finalizar automáticamente cuando se agota el tiempo
          handleSubmitQuiz()
          return 0
        }
        return prev - 1
      })
    }, 1000)

    return () => clearInterval(interval)
  }, [activeQuiz, submitted, timeRemainingSeconds])

  const formatTimer = (secs: number) => {
    const mins = Math.floor(secs / 60)
    const remSecs = secs % 60
    return `${mins.toString().padStart(2, '0')}:${remSecs.toString().padStart(2, '0')}`
  }

  const handleStartQuiz = (quiz: QuizItem, timerMins: number = 0) => {
    setActiveQuiz({
      id: quiz.id,
      quizType: quiz.quiz_type as 'multiple_choice' | 'desarrollo',
      questions: quiz.quiz_questions,
    })
    setSelectedAnswers({})
    setSelfScores({})
    setSubmitted(false)
    setFinalScore(null)

    if (timerMins > 0) {
      setTimeRemainingSeconds(timerMins * 60)
    } else {
      setTimeRemainingSeconds(null)
    }
  }

  const handleGenerate = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    setLoading(true)
    const formData = new FormData(e.currentTarget)

    try {
      const newQuiz = await createQuizAction(subjectId, formData)
      if (newQuiz) {
        setQuizzesList((prev) => [newQuiz, ...prev])
        handleStartQuiz(newQuiz, timerMinutes)
      }
    } catch (err) {
      alert(err instanceof Error ? err.message : 'Error al generar el examen con IA.')
    } finally {
      setLoading(false)
    }
  }

  const handleSelectAnswer = (qId: string, option: string) => {
    setSelectedAnswers((prev) => ({ ...prev, [qId]: option }))
  }

  const handleSelfEval = (qId: string, scorePoints: number) => {
    setSelfScores((prev) => ({ ...prev, [qId]: scorePoints }))
  }

  const handleSubmitQuiz = async () => {
    if (!activeQuiz) return

    let totalPoints = 0
    const totalQuestions = activeQuiz.questions.length

    if (activeQuiz.quizType === 'multiple_choice') {
      const pointsPerQ = 100 / (totalQuestions || 1)
      activeQuiz.questions.forEach((q) => {
        const userAns = selectedAnswers[q.id]
        if (userAns && userAns.trim().toLowerCase().startsWith(q.correct_answer.trim().toLowerCase().substring(0, 2))) {
          totalPoints += pointsPerQ
        }
      })
    } else {
      const pointsPerQ = 100 / (totalQuestions || 1)
      activeQuiz.questions.forEach((q) => {
        const selfPoints = selfScores[q.id] || 0 // 10, 5 o 0
        totalPoints += (selfPoints / 10) * pointsPerQ
      })
    }

    const calculatedScore = Math.round(totalPoints)
    setFinalScore(calculatedScore)
    setSubmitted(true)

    try {
      await submitQuizAttemptAction(subjectId, activeQuiz.id, calculatedScore, selectedAnswers)
    } catch {
      // Ignorar errores de guardado de intento
    }
  }

  const handleDeleteQuiz = async (quizId: string) => {
    if (!confirm('¿Eliminar este simulacro de examen y sus intentos?')) return
    try {
      await deleteQuizAction(subjectId, quizId)
      setQuizzesList((prev) => prev.filter((q) => q.id !== quizId))
      if (activeQuiz?.id === quizId) setActiveQuiz(null)
    } catch (err) {
      alert(err instanceof Error ? err.message : 'Error al eliminar examen.')
    }
  }

  return (
    <div className="flex flex-col gap-6 max-w-5xl mx-auto">
      {!activeQuiz ? (
        <>
          {/* Formulario de Generación de Examen */}
          <div className="rounded-2xl border border-slate-200/80 bg-white p-6 shadow-xs flex flex-col gap-5">
            <div>
              <div className="flex items-center gap-2 mb-1">
                <span className="text-[10px] font-bold uppercase tracking-wider bg-indigo-50 text-indigo-700 px-2.5 py-0.5 rounded-md border border-indigo-100">
                  Simulador Adaptativo • {subjectName}
                </span>
              </div>
              <h2 className="text-lg sm:text-xl font-bold text-slate-900 tracking-tight flex items-center gap-2">
                <IconQuiz className="w-5 h-5 text-indigo-600" />
                Configurar Nuevo Simulacro de Parcial
              </h2>
              <p className="text-xs text-slate-500 mt-0.5">
                Generá un examen adaptativo basado en los apuntes de tu materia para entrenar bajo condiciones de parcial real.
              </p>
            </div>

            <form onSubmit={handleGenerate} className="flex flex-col gap-5">
              {/* Tipo de Preguntas y Alcance */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                {/* 1. Tipo de Examen */}
                <div className="flex flex-col gap-1.5">
                  <label className="text-xs font-bold text-slate-700">Formato del Examen:</label>
                  <select
                    name="quiz_type"
                    className="rounded-xl border border-slate-200 bg-slate-50 px-3 py-2.5 text-xs font-semibold text-slate-800 focus:outline-none focus:ring-2 focus:ring-indigo-500/20"
                  >
                    <option value="multiple_choice">Multiple Choice (4-5 preguntas)</option>
                    <option value="desarrollo">Desarrollo Teórico (con autoevaluación)</option>
                  </select>
                </div>

                {/* 2. Alcance */}
                <div className="flex flex-col gap-1.5">
                  <label className="text-xs font-bold text-slate-700">Alcance de Temas:</label>
                  <select
                    name="scope"
                    className="rounded-xl border border-slate-200 bg-slate-50 px-3 py-2.5 text-xs font-semibold text-slate-800 focus:outline-none focus:ring-2 focus:ring-indigo-500/20"
                  >
                    <option value="tema_unico">Tema Único</option>
                    <option value="integrador">Parcial Integrador (Multi-tema)</option>
                  </select>
                </div>

                {/* 3. Temporizador Opcional */}
                <div className="flex flex-col gap-1.5">
                  <label className="text-xs font-bold text-slate-700">Temporizador (Timer):</label>
                  <select
                    value={timerMinutes}
                    onChange={(e) => setTimerMinutes(parseInt(e.target.value, 10))}
                    className="rounded-xl border border-slate-200 bg-slate-50 px-3 py-2.5 text-xs font-semibold text-slate-800 focus:outline-none focus:ring-2 focus:ring-indigo-500/20"
                  >
                    <option value={0}>⏳ Sin límite de tiempo</option>
                    <option value={15}>⏱️ 15 Minutos (Test Rápido)</option>
                    <option value={30}>⏱️ 30 Minutos (Parcial Estándar)</option>
                    <option value={45}>⏱️ 45 Minutos (Examen Completo)</option>
                  </select>
                </div>
              </div>

              {/* Selección de Temas */}
              <div className="flex flex-col gap-2">
                <label className="text-xs font-bold text-slate-700">
                  Seleccioná los temas a evaluar:
                </label>
                <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-2.5 max-h-48 overflow-y-auto p-1">
                  {threads.map((t) => (
                    <label
                      key={t.id}
                      className="flex items-center gap-2.5 rounded-xl border border-slate-200 p-2.5 hover:bg-slate-50 transition-colors text-xs font-medium text-slate-800 cursor-pointer bg-white"
                    >
                      <input
                        type="checkbox"
                        name="thread_ids"
                        value={t.id}
                        defaultChecked
                        className="rounded border-slate-300 text-indigo-600 focus:ring-indigo-500 h-4 w-4"
                      />
                      <span className="truncate">{t.title}</span>
                    </label>
                  ))}
                  {threads.length === 0 && (
                    <p className="col-span-full text-xs text-slate-400 italic py-2">
                      Subí apuntes PDF en la biblioteca para extraer automáticamente los temas de la materia.
                    </p>
                  )}
                </div>
              </div>

              {/* Referencia de Exámenes Viejos (Regla 5) */}
              {examDocuments.length > 0 && (
                <div className="flex flex-col gap-1.5 border-t border-slate-100 pt-3">
                  <label className="text-xs font-bold text-slate-700 flex items-center gap-1.5">
                    <IconBook className="w-3.5 h-3.5 text-indigo-600" />
                    Estilo de redacción según Examen Anterior (Opcional):
                  </label>
                  <select
                    name="style_reference_document_id"
                    className="rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 text-xs font-medium text-slate-700 focus:outline-none"
                  >
                    <option value="">Ninguno (Formato estándar)</option>
                    {examDocuments.map((doc) => (
                      <option key={doc.id} value={doc.id}>
                        {doc.title}
                      </option>
                    ))}
                  </select>
                </div>
              )}

              <button
                type="submit"
                disabled={loading || threads.length === 0}
                className="rounded-xl bg-indigo-600 px-5 py-3 text-xs sm:text-sm font-bold text-white shadow-xs hover:bg-indigo-700 disabled:opacity-50 transition-all flex items-center justify-center gap-2 cursor-pointer"
              >
                <IconSparkles className="w-4 h-4" />
                {loading ? 'Generando examen con IA...' : 'Generar y Rendir Simulacro con IA'}
              </button>
            </form>
          </div>

          {/* Historial de Simulacros Anteriores */}
          {quizzesList.length > 0 && (
            <div className="flex flex-col gap-3">
              <h3 className="text-xs font-bold uppercase tracking-wider text-slate-500">
                Historial de Simulacros Guardados ({quizzesList.length})
              </h3>

              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
                {quizzesList.map((quiz, idx) => {
                  const lastAttempt = quiz.quiz_attempts?.[0]
                  const hasAttempt = lastAttempt !== undefined

                  return (
                    <div
                      key={quiz.id || idx}
                      className="rounded-2xl border border-slate-200/80 bg-white p-4 shadow-xs flex flex-col justify-between gap-3 hover:border-indigo-300 transition-all"
                    >
                      <div className="flex flex-col gap-1.5">
                        <div className="flex items-center justify-between text-[10px] font-bold">
                          <span className="bg-indigo-50 text-indigo-700 px-2 py-0.5 rounded-full border border-indigo-100 uppercase">
                            {quiz.quiz_type === 'multiple_choice' ? 'Multiple Choice' : 'Desarrollo'}
                          </span>
                          <span className="text-slate-400">
                            {new Date(quiz.created_at).toLocaleDateString('es-AR')}
                          </span>
                        </div>

                        <h4 className="text-xs font-bold text-slate-900 mt-1">
                          Simulacro #{quizzesList.length - idx} ({quiz.quiz_questions.length} preguntas)
                        </h4>

                        {hasAttempt ? (
                          <div className="flex items-center gap-1.5 text-xs mt-1">
                            <span className="text-slate-500 font-medium">Última nota:</span>
                            <span
                              className={`font-black px-2 py-0.5 rounded-md text-[11px] ${
                                lastAttempt.score >= 60
                                  ? 'bg-emerald-100 text-emerald-800'
                                  : 'bg-rose-100 text-rose-800'
                              }`}
                            >
                              {lastAttempt.score} / 100
                            </span>
                          </div>
                        ) : (
                          <span className="text-[11px] text-amber-700 italic mt-1 font-medium">
                            ● Pendiente de rendir
                          </span>
                        )}
                      </div>

                      <div className="flex items-center justify-between pt-2 border-t border-slate-100 gap-2">
                        <button
                          type="button"
                          onClick={() => handleStartQuiz(quiz, timerMinutes)}
                          className="flex-1 rounded-xl bg-indigo-50 hover:bg-indigo-600 hover:text-white text-indigo-700 px-3 py-1.5 text-xs font-bold border border-indigo-100 transition-all cursor-pointer text-center"
                        >
                          {hasAttempt ? 'Rendir de nuevo' : 'Comenzar examen'}
                        </button>

                        <button
                          type="button"
                          onClick={() => handleDeleteQuiz(quiz.id)}
                          className="p-1.5 rounded-lg text-slate-400 hover:text-rose-600 hover:bg-rose-50 transition-colors cursor-pointer"
                          title="Eliminar examen"
                        >
                          <IconTrash className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </div>
                  )
                })}
              </div>
            </div>
          )}
        </>
      ) : (
        /* VISTA DE EXAMEN ACTIVO */
        <div className="rounded-2xl border border-slate-200/80 bg-white p-6 shadow-sm flex flex-col gap-6 animate-in fade-in">
          {/* Header del Examen Activo con Temporizador */}
          <div className="flex items-center justify-between border-b border-slate-100 pb-4 flex-wrap gap-3">
            <div>
              <div className="flex items-center gap-2">
                <span className="text-[10px] font-bold uppercase tracking-wider text-indigo-600 bg-indigo-50 border border-indigo-100 px-2.5 py-0.5 rounded-full">
                  {activeQuiz.quizType === 'multiple_choice' ? 'Multiple Choice' : 'Examen de Desarrollo'}
                </span>
                <span className="text-xs text-slate-500 font-semibold">
                  {activeQuiz.questions.length} preguntas
                </span>
              </div>
              <h2 className="text-base sm:text-lg font-bold text-slate-900 mt-1">
                Simulacro de Examen ({subjectName})
              </h2>
            </div>

            <div className="flex items-center gap-3">
              {/* Reloj Temporizador */}
              {timeRemainingSeconds !== null && (
                <div
                  className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl border font-mono text-xs font-black shadow-2xs ${
                    timeRemainingSeconds < 120
                      ? 'bg-rose-100 border-rose-300 text-rose-700 animate-pulse'
                      : 'bg-slate-100 border-slate-200 text-slate-800'
                  }`}
                >
                  <span>⏱️</span>
                  <span>{formatTimer(timeRemainingSeconds)}</span>
                </div>
              )}

              <button
                type="button"
                onClick={() => setActiveQuiz(null)}
                className="text-xs font-semibold text-slate-500 hover:text-slate-900 px-3 py-1.5 rounded-xl hover:bg-slate-100 transition-colors cursor-pointer"
              >
                ✕ Salir
              </button>
            </div>
          </div>

          {/* Preguntas del Examen */}
          <div className="flex flex-col gap-6">
            {activeQuiz.questions.map((q, idx) => (
              <div
                key={q.id || idx}
                className="rounded-2xl border border-slate-200/80 p-5 bg-slate-50/50 flex flex-col gap-3.5"
              >
                <div className="flex items-start justify-between gap-3">
                  <h3 className="text-xs sm:text-sm font-bold text-slate-900 leading-relaxed">
                    <span className="text-indigo-600 mr-1.5">{idx + 1}.</span>
                    {q.question_text}
                  </h3>
                  {q.source_page && (
                    <span className="bg-indigo-50 text-indigo-700 border border-indigo-100 text-[10px] font-bold px-2 py-0.5 rounded-full shrink-0 font-mono">
                      Pág. {q.source_page}
                    </span>
                  )}
                </div>

                {/* Opciones Multiple Choice */}
                {activeQuiz.quizType === 'multiple_choice' && q.options && (
                  <div className="flex flex-col gap-2 mt-1">
                    {q.options.map((opt, i) => {
                      const isSelected = selectedAnswers[q.id] === opt
                      const isCorrect =
                        q.correct_answer.trim().toLowerCase().startsWith(opt.trim().toLowerCase().substring(0, 2)) ||
                        q.correct_answer.trim().toLowerCase() === opt.trim().toLowerCase()

                      let optStyle = 'border-slate-200 bg-white text-slate-700 hover:bg-slate-100'
                      if (submitted) {
                        if (isCorrect) {
                          optStyle = 'border-emerald-400 bg-emerald-50 text-emerald-950 font-bold'
                        } else if (isSelected && !isCorrect) {
                          optStyle = 'border-rose-400 bg-rose-50 text-rose-950 font-medium'
                        }
                      } else if (isSelected) {
                        optStyle = 'border-indigo-600 bg-indigo-50 text-indigo-950 font-bold ring-2 ring-indigo-500/30'
                      }

                      return (
                        <button
                          key={i}
                          type="button"
                          disabled={submitted}
                          onClick={() => handleSelectAnswer(q.id, opt)}
                          className={`text-left text-xs p-3.5 rounded-xl border transition-all cursor-pointer ${optStyle}`}
                        >
                          {opt}
                        </button>
                      )
                    })}
                  </div>
                )}

                {/* Pregunta de Desarrollo (Regla 4: Autoevaluación) */}
                {activeQuiz.quizType === 'desarrollo' && (
                  <div className="flex flex-col gap-3 mt-1">
                    <textarea
                      rows={3}
                      disabled={submitted}
                      placeholder="Escribí tu respuesta fundamentada..."
                      onChange={(e) => setSelectedAnswers((prev) => ({ ...prev, [q.id]: e.target.value }))}
                      className="w-full rounded-xl border border-slate-200 p-3 text-xs bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500/20 font-medium text-slate-800 leading-relaxed"
                    />

                    {/* Criterios de Autoevaluación (Regla 4) */}
                    <div className="rounded-xl border border-amber-200 bg-amber-50/70 p-3.5 text-xs text-amber-950">
                      <span className="font-bold block mb-1 flex items-center gap-1.5 text-amber-900">
                        <IconSearch className="w-3.5 h-3.5 text-amber-700" />
                        Criterios clave para autoevaluación (Respuesta esperada):
                      </span>
                      <p className="whitespace-pre-wrap text-[11px] leading-relaxed text-amber-950/90 font-sans">
                        {q.correct_answer}
                      </p>

                      <div className="mt-3 pt-2 border-t border-amber-200/70 flex flex-wrap items-center gap-2">
                        <span className="font-bold text-[11px] text-amber-900">Tu autoevaluación:</span>
                        <button
                          type="button"
                          onClick={() => handleSelfEval(q.id, 10)}
                          className={`px-3 py-1.5 rounded-xl text-[10px] font-bold border transition-all cursor-pointer ${
                            selfScores[q.id] === 10
                              ? 'bg-emerald-600 text-white border-emerald-600 shadow-2xs'
                              : 'bg-white text-emerald-800 border-emerald-200 hover:bg-emerald-100'
                          }`}
                        >
                          ✓ Excelente (10 pts)
                        </button>
                        <button
                          type="button"
                          onClick={() => handleSelfEval(q.id, 5)}
                          className={`px-3 py-1.5 rounded-xl text-[10px] font-bold border transition-all cursor-pointer ${
                            selfScores[q.id] === 5
                              ? 'bg-amber-600 text-white border-amber-600 shadow-2xs'
                              : 'bg-white text-amber-800 border-amber-200 hover:bg-amber-100'
                          }`}
                        >
                          ½ Parcial (5 pts)
                        </button>
                        <button
                          type="button"
                          onClick={() => handleSelfEval(q.id, 0)}
                          className={`px-3 py-1.5 rounded-xl text-[10px] font-bold border transition-all cursor-pointer ${
                            selfScores[q.id] === 0
                              ? 'bg-rose-600 text-white border-rose-600 shadow-2xs'
                              : 'bg-white text-rose-800 border-rose-200 hover:bg-rose-100'
                          }`}
                        >
                          ✕ Incompleto (0 pts)
                        </button>
                      </div>
                    </div>
                  </div>
                )}

                {/* Explicación y Justificación Post-Examen */}
                {submitted && q.explanation && (
                  <div className="mt-2 rounded-xl bg-indigo-50 border border-indigo-100 p-3 text-xs text-indigo-950 flex flex-col gap-1.5">
                    <span className="font-bold text-[11px] text-indigo-800 uppercase tracking-wider flex items-center gap-1">
                      <IconSparkles className="w-3.5 h-3.5 text-indigo-600" />
                      Fundamentación Bibliográfica:
                    </span>
                    <p className="text-[11px] text-slate-700 leading-relaxed">{q.explanation}</p>
                    <Link
                      href={`/materias/${subjectId}/temas`}
                      className="text-[11px] font-bold text-indigo-600 hover:underline inline-flex items-center gap-1 mt-1"
                    >
                      <IconChat className="w-3 h-3" />
                      Profundizar este concepto con el Tutor Socrático
                    </Link>
                  </div>
                )}
              </div>
            ))}
          </div>

          {/* Puntaje Final y Botón de Envío */}
          {!submitted ? (
            <button
              type="button"
              onClick={handleSubmitQuiz}
              className="mt-2 w-full rounded-xl bg-indigo-600 py-3.5 text-xs sm:text-sm font-bold text-white shadow-xs hover:bg-indigo-700 transition-all cursor-pointer"
            >
              Finalizar y Ver Calificación
            </button>
          ) : (
            <div className="rounded-2xl border border-emerald-200 bg-emerald-50 p-6 text-center flex flex-col items-center gap-3 animate-in zoom-in-95">
              <span className="text-xs font-bold uppercase tracking-wider text-emerald-800">
                Resultado de la Evaluación
              </span>
              <div className="text-4xl font-black text-emerald-950">
                {finalScore} / 100
              </div>
              <p className="text-xs font-medium text-emerald-900 max-w-md">
                {finalScore! >= 60
                  ? '¡Excelente! Aprobaste el simulacro con sólido dominio conceptual de la bibliografía oficial.'
                  : 'Te sugerimos repasar los puntos marcados con el Tutor Socrático para reforzar antes de la fecha oficial de examen.'}
              </p>
              <div className="flex items-center gap-2 mt-2">
                <button
                  type="button"
                  onClick={() => setActiveQuiz(null)}
                  className="rounded-xl bg-slate-900 px-5 py-2.5 text-xs font-bold text-white hover:bg-slate-800 transition-colors cursor-pointer"
                >
                  Volver al Historial de Exámenes
                </button>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  )
}
