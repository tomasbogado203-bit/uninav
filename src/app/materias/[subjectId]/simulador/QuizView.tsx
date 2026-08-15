'use client'

import { useState } from 'react'
import { createQuizAction, submitQuizAttemptAction } from './actions'
import {
  IconQuiz,
  IconDocument,
  IconBook,
  IconSearch,
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
}

interface QuizViewProps {
  subjectId: string
  threads: Thread[]
  examDocuments: ExamDocument[]
  existingQuizzes?: {
    id: string
    quiz_type: string
    scope: string
    created_at: string
    quiz_questions: Question[]
  }[]
}

export default function QuizView({
  subjectId,
  threads = [],
  examDocuments = [],
}: QuizViewProps) {
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

  const handleGenerate = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    setLoading(true)
    const formData = new FormData(e.currentTarget)

    try {
      await createQuizAction(subjectId, formData)
      window.location.reload()
    } catch (err) {
      alert(err instanceof Error ? err.message : 'Error al generar el examen.')
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
    let maxPoints = 0

    if (activeQuiz.quizType === 'multiple_choice') {
      maxPoints = activeQuiz.questions.length * 10
      activeQuiz.questions.forEach((q) => {
        const userAns = selectedAnswers[q.id]
        if (userAns && userAns.trim().toLowerCase() === q.correct_answer.trim().toLowerCase()) {
          totalPoints += 10
        }
      })
    } else {
      maxPoints = activeQuiz.questions.length * 10
      activeQuiz.questions.forEach((q) => {
        totalPoints += selfScores[q.id] || 0
      })
    }

    const calculatedScore = Math.round((totalPoints / maxPoints) * 100)
    setFinalScore(calculatedScore)
    setSubmitted(true)

    try {
      await submitQuizAttemptAction(subjectId, activeQuiz.id, calculatedScore, selectedAnswers)
    } catch (err) {
      console.error('Error guardando intento:', err)
    }
  }

  return (
    <div className="flex flex-col gap-6">
      {!activeQuiz ? (
        /* Formulario de Configuración de Examen */
        <div className="rounded-2xl border border-slate-200/80 bg-white p-6 shadow-sm">
          <div className="mb-4">
            <h2 className="text-base font-bold text-slate-900 flex items-center gap-2">
              <IconQuiz className="w-5 h-5 text-indigo-600" />
              Generar nuevo examen simulado
            </h2>
            <p className="text-xs text-slate-500 mt-0.5">
              Personalizá el formato de evaluación basado en la bibliografía cargada en tu materia.
            </p>
          </div>

          <form onSubmit={handleGenerate} className="flex flex-col gap-5">
            {/* Tipo de Preguntas */}
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-2">
                1. Tipo de preguntas
              </label>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <label className="flex items-center gap-2.5 rounded-xl border border-slate-200 p-3 bg-slate-50 hover:bg-slate-100/80 cursor-pointer transition-colors">
                  <input type="radio" name="quiz_type" value="multiple_choice" defaultChecked className="text-indigo-600" />
                  <div>
                    <span className="text-xs font-semibold text-slate-800 block">Multiple Choice</span>
                    <span className="text-[11px] text-slate-500">4 opciones con respuesta única.</span>
                  </div>
                </label>

                <label className="flex items-center gap-2.5 rounded-xl border border-slate-200 p-3 bg-slate-50 hover:bg-slate-100/80 cursor-pointer transition-colors">
                  <input type="radio" name="quiz_type" value="desarrollo" className="text-indigo-600" />
                  <div>
                    <span className="text-xs font-semibold text-slate-800 block">Preguntas de Desarrollo</span>
                    <span className="text-[11px] text-slate-500">Respuestas conceptuales autoevaluables.</span>
                  </div>
                </label>
              </div>
            </div>

            {/* Scope / Temas */}
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-2">
                2. Seleccionar temas (Scope)
              </label>
              <div className="flex flex-col gap-1.5 max-h-[160px] overflow-y-auto border border-slate-200 rounded-xl p-3 bg-slate-50">
                {threads.map((t) => (
                  <label key={t.id} className="flex items-center gap-2 text-xs text-slate-700 hover:text-slate-900 cursor-pointer">
                    <input type="checkbox" name="thread_ids" value={t.id} defaultChecked className="rounded text-indigo-600" />
                    <span>Tema: {t.title}</span>
                  </label>
                ))}
                {threads.length === 0 && (
                  <p className="text-xs text-slate-400 italic">No hay temas creados. Creá un tema en la pestaña &quot;Temas&quot; primero.</p>
                )}
              </div>
            </div>

            {/* Referencia de Examen Anterior (Regla 5: Banco de Exámenes Viejos) */}
            {examDocuments?.length > 0 && (
              <div className="rounded-xl border border-indigo-100 bg-indigo-50/50 p-4">
                <label className="block text-xs font-bold text-indigo-950 mb-1 flex items-center gap-1.5">
                  <IconDocument className="w-4 h-4 text-indigo-600" />
                  3. Referencia de estilo (Opcional - Examen anterior)
                </label>
                <select
                  name="style_reference_document_id"
                  className="w-full rounded-xl border border-indigo-200 px-3 py-2 text-xs bg-white text-slate-800 focus:outline-none focus:ring-2 focus:ring-indigo-500/20"
                >
                  <option value="">Sin referencia (Formato estándar UniNav)</option>
                  {examDocuments.map((doc) => (
                    <option key={doc.id} value={doc.id}>
                      Examen anterior: {doc.title}
                    </option>
                  ))}
                </select>
                <span className="text-[10px] text-indigo-800/80 mt-1.5 block">
                  Regla 5: La IA imitará el nivel de exigencia y formato del examen anterior sin copiar su contenido ni contaminar la bibliografía de estudio.
                </span>
              </div>
            )}

            <button
              type="submit"
              disabled={loading || threads.length === 0}
              className="rounded-xl bg-indigo-600 px-5 py-3 text-xs sm:text-sm font-bold text-white shadow-sm hover:bg-indigo-700 disabled:opacity-50 transition-all"
            >
              {loading ? 'Generando examen con IA...' : 'Generar Examen Simulado'}
            </button>
          </form>
        </div>
      ) : (
        /* Vista de Examen Activo */
        <div className="rounded-2xl border border-slate-200/80 bg-white p-6 shadow-sm flex flex-col gap-6">
          <div className="flex items-center justify-between border-b pb-4">
            <div>
              <span className="text-[11px] font-bold uppercase tracking-wider text-indigo-600">
                {activeQuiz.quizType === 'multiple_choice' ? 'Multiple Choice' : 'Examen de Desarrollo'}
              </span>
              <h2 className="text-lg font-bold text-slate-900">Simulacro de Parcial</h2>
            </div>
            <button
              onClick={() => setActiveQuiz(null)}
              className="text-xs font-medium text-slate-500 hover:text-slate-800"
            >
              ✕ Cancelar
            </button>
          </div>

          {/* Preguntas */}
          <div className="flex flex-col gap-6">
            {activeQuiz.questions.map((q, idx) => (
              <div key={q.id || idx} className="rounded-xl border border-slate-200 p-4 bg-slate-50/50 flex flex-col gap-3">
                <div className="flex items-start justify-between gap-2">
                  <h3 className="text-xs sm:text-sm font-semibold text-slate-900">
                    {idx + 1}. {q.question_text}
                  </h3>
                  {q.source_page && (
                    <span className="bg-indigo-50 text-indigo-700 border border-indigo-100 text-[10px] font-medium px-2 py-0.5 rounded-full shrink-0">
                      Pág. {q.source_page}
                    </span>
                  )}
                </div>

                {/* Opciones Multiple Choice */}
                {activeQuiz.quizType === 'multiple_choice' && q.options && (
                  <div className="flex flex-col gap-2 mt-1">
                    {q.options.map((opt, i) => {
                      const isSelected = selectedAnswers[q.id] === opt
                      const isCorrect = q.correct_answer.trim().toLowerCase() === opt.trim().toLowerCase()

                      let optStyle = 'border-slate-200 bg-white text-slate-700 hover:bg-slate-100'
                      if (submitted) {
                        if (isCorrect) optStyle = 'border-emerald-300 bg-emerald-50 text-emerald-900 font-semibold'
                        else if (isSelected && !isCorrect) optStyle = 'border-rose-300 bg-rose-50 text-rose-900'
                      } else if (isSelected) {
                        optStyle = 'border-indigo-600 bg-indigo-50 text-indigo-900 font-medium'
                      }

                      return (
                        <button
                          key={i}
                          type="button"
                          disabled={submitted}
                          onClick={() => handleSelectAnswer(q.id, opt)}
                          className={`text-left text-xs p-3 rounded-xl border transition-all ${optStyle}`}
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
                      className="w-full rounded-xl border border-slate-200 p-3 text-xs bg-white focus:outline-none focus:ring-1 focus:ring-indigo-500"
                    />

                    {/* Criterios de Autoevaluación (Regla 4) */}
                    <div className="rounded-xl border border-amber-200/80 bg-amber-50/60 p-3 text-xs text-amber-900">
                      <span className="font-semibold block mb-1 flex items-center gap-1">
                        <IconSearch className="w-3.5 h-3.5 text-amber-700" />
                        Criterios clave para autoevaluación (Respuesta esperada):
                      </span>
                      <p className="whitespace-pre-wrap text-[11px] leading-relaxed text-amber-900/90">{q.correct_answer}</p>

                      <div className="mt-3 pt-2 border-t border-amber-200/60 flex flex-wrap items-center gap-2">
                        <span className="font-medium text-[11px]">¿Cómo evalúas tu respuesta?</span>
                        <button
                          type="button"
                          onClick={() => handleSelfEval(q.id, 10)}
                          className={`px-2.5 py-1 rounded-lg text-[10px] font-semibold border transition-all ${
                            selfScores[q.id] === 10
                              ? 'bg-emerald-600 text-white border-emerald-600'
                              : 'bg-white text-emerald-800 border-emerald-200 hover:bg-emerald-100'
                          }`}
                        >
                          ✓ Excelente (10 pts)
                        </button>
                        <button
                          type="button"
                          onClick={() => handleSelfEval(q.id, 5)}
                          className={`px-2.5 py-1 rounded-lg text-[10px] font-semibold border transition-all ${
                            selfScores[q.id] === 5
                              ? 'bg-amber-600 text-white border-amber-600'
                              : 'bg-white text-amber-800 border-amber-200 hover:bg-amber-100'
                          }`}
                        >
                          ½ Parcial (5 pts)
                        </button>
                        <button
                          type="button"
                          onClick={() => handleSelfEval(q.id, 0)}
                          className={`px-2.5 py-1 rounded-lg text-[10px] font-semibold border transition-all ${
                            selfScores[q.id] === 0
                              ? 'bg-rose-600 text-white border-rose-600'
                              : 'bg-white text-rose-800 border-rose-200 hover:bg-rose-100'
                          }`}
                        >
                          ✕ Incompleto (0 pts)
                        </button>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            ))}
          </div>

          {/* Puntaje Final y Finalizar */}
          {!submitted ? (
            <button
              type="button"
              onClick={handleSubmitQuiz}
              className="mt-4 w-full rounded-xl bg-indigo-600 py-3 text-xs sm:text-sm font-semibold text-white shadow-sm hover:bg-indigo-700 transition-all"
            >
              Finalizar y Ver Calificación
            </button>
          ) : (
            <div className="rounded-2xl border border-emerald-200 bg-emerald-50/80 p-5 text-center flex flex-col items-center gap-2">
              <span className="text-xs font-bold uppercase tracking-wider text-emerald-700">Resultado Final</span>
              <div className="text-3xl font-extrabold text-emerald-900">{finalScore} / 100</div>
              <p className="text-xs text-emerald-800">
                {finalScore! >= 60
                  ? '¡Aprobaste el simulacro! Buen dominio de los conceptos bibliográficos.'
                  : 'Te sugerimos revisar las citas de los temas para reforzar tu comprensión.'}
              </p>
              <button
                type="button"
                onClick={() => {
                  setSubmitted(false)
                  setActiveQuiz(null)
                }}
                className="mt-3 rounded-xl bg-emerald-700 px-4 py-2 text-xs font-semibold text-white hover:bg-emerald-800 transition-all"
              >
                Volver a la lista de exámenes
              </button>
            </div>
          )}
        </div>
      )}
    </div>
  )
}
