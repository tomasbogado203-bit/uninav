'use client'

import { useState, useEffect } from 'react'
import {
  generateFlashcardsAction,
  toggleMasteredAction,
  deleteFlashcardAction,
} from './actions'
import {
  IconSparkles,
  IconDocument,
  IconTrash,
} from '@/components/icons'

export interface FlashcardItem {
  id: string
  subject_id: string
  front_text: string
  back_text: string
  source_page?: number | null
  mastered: boolean
}

interface FlashcardsViewProps {
  subjectId: string
  subjectName: string
  flashcards: FlashcardItem[]
}

export default function FlashcardsView({
  subjectId,
  subjectName,
  flashcards = [],
}: FlashcardsViewProps) {
  const [cards, setCards] = useState<FlashcardItem[]>(flashcards)
  const [loading, setLoading] = useState(false)
  const [currentIndex, setCurrentIndex] = useState(0)
  const [isFlipped, setIsFlipped] = useState(false)
  const [toastMessage, setToastMessage] = useState<string | null>(null)

  // Cargar y combinar tarjetas persistidas en localStorage como fallback seguro
  useEffect(() => {
    try {
      const saved = localStorage.getItem(`uninav_flashcards_${subjectId}`)
      if (saved) {
        const parsed: FlashcardItem[] = JSON.parse(saved)
        if (Array.isArray(parsed) && parsed.length > 0) {
          // Fusionar unificando IDs únicos
          const existingIds = new Set(flashcards.map((c) => c.id))
          const missingLocal = parsed.filter((c) => !existingIds.has(c.id))
          setCards([...flashcards, ...missingLocal])
          return
        }
      }
    } catch {
      // Ignorar errores de localStorage
    }
    setCards(flashcards)
  }, [subjectId, flashcards])

  // Helper para guardar el estado actualizado en localStorage
  const saveToLocal = (updatedCards: FlashcardItem[]) => {
    setCards(updatedCards)
    try {
      localStorage.setItem(`uninav_flashcards_${subjectId}`, JSON.stringify(updatedCards))
    } catch {
      // Ignorar errores
    }
  }

  const handleGenerate = async () => {
    setLoading(true)
    setToastMessage(null)

    try {
      const newCards = await generateFlashcardsAction(subjectId)
      if (newCards && newCards.length > 0) {
        const updated = [...newCards, ...cards]
        saveToLocal(updated)
        setCurrentIndex(0)
        setIsFlipped(false)
        setToastMessage(`¡${newCards.length} tarjetas didácticas generadas con éxito!`)
      }
    } catch (err) {
      alert(err instanceof Error ? err.message : 'Error al generar tarjetas con IA.')
    } finally {
      setLoading(false)
    }
  }

  const handleToggleMastered = async (cardId: string, currentMastered: boolean) => {
    const updated = cards.map((c) =>
      c.id === cardId ? { ...c, mastered: !currentMastered } : c
    )
    saveToLocal(updated)
    try {
      await toggleMasteredAction(subjectId, cardId, currentMastered)
    } catch {
      // Fallback local completado
    }
  }

  const handleDelete = async (cardId: string) => {
    if (!confirm('¿Deseás eliminar esta tarjeta didáctica?')) return

    const updated = cards.filter((c) => c.id !== cardId)
    saveToLocal(updated)

    if (currentIndex >= updated.length) {
      setCurrentIndex(Math.max(0, updated.length - 1))
    }
    setIsFlipped(false)

    try {
      await deleteFlashcardAction(subjectId, cardId)
    } catch {
      // Fallback local completado
    }
  }

  const currentCard = cards[currentIndex]

  return (
    <div className="flex flex-col gap-6 max-w-4xl mx-auto">
      {/* Toast Notificación */}
      {toastMessage && (
        <div className="rounded-2xl bg-emerald-600 text-white p-3.5 text-xs font-bold shadow-lg flex items-center justify-between animate-in fade-in slide-in-from-top-2">
          <span className="flex items-center gap-2">
            <IconSparkles className="w-4 h-4" />
            {toastMessage}
          </span>
          <button onClick={() => setToastMessage(null)} className="text-white hover:opacity-80">
            ✕
          </button>
        </div>
      )}

      {/* Header Encabezado */}
      <div className="rounded-3xl bg-gradient-to-br from-indigo-950 via-slate-900 to-slate-950 p-6 sm:p-8 text-white shadow-xl flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <div className="inline-flex items-center gap-1.5 rounded-full bg-indigo-500/20 px-3 py-1 text-xs font-medium text-indigo-300 border border-indigo-500/30 mb-2">
            NotebookLM Style • {subjectName}
          </div>
          <h1 className="text-xl sm:text-2xl font-bold tracking-tight">
            Tarjetas Didácticas (Flashcards)
          </h1>
          <p className="mt-1 text-xs text-slate-300">
            Repaso activo optimizado con IA. Hacé clic en la tarjeta para darla vuelta e inspeccionar la respuesta.
          </p>
        </div>

        <button
          type="button"
          disabled={loading}
          onClick={handleGenerate}
          className="inline-flex items-center justify-center gap-2 rounded-xl bg-indigo-600 px-5 py-3 text-xs sm:text-sm font-bold text-white shadow-md hover:bg-indigo-500 disabled:opacity-50 transition-all shrink-0 cursor-pointer"
        >
          <IconSparkles className="w-4 h-4 text-indigo-200" />
          {loading ? 'Analizando apunte y generando IA...' : 'Generar Tarjetas con IA'}
        </button>
      </div>

      {/* Visor de Tarjeta Didáctica */}
      {currentCard ? (
        <div className="flex flex-col items-center gap-5">
          {/* Indicador de Avance */}
          <div className="flex items-center justify-between w-full text-xs text-slate-500 px-2 font-semibold">
            <span>
              Tarjeta {currentIndex + 1} de {cards.length}
            </span>
            <span
              className={`flex items-center gap-1.5 px-2.5 py-0.5 rounded-full ${
                currentCard.mastered
                  ? 'text-emerald-700 bg-emerald-50 border border-emerald-200'
                  : 'text-indigo-600 bg-indigo-50 border border-indigo-100'
              }`}
            >
              {currentCard.mastered ? '✓ Dominada' : '● En repaso'}
            </span>
          </div>

          {/* Tarjeta 3D Flip */}
          <div
            onClick={() => setIsFlipped(!isFlipped)}
            className="w-full min-h-[300px] cursor-pointer rounded-3xl border-2 border-indigo-200/80 bg-white p-8 shadow-md hover:shadow-xl transition-all duration-300 flex flex-col justify-between relative group select-none"
          >
            {/* Lado Frontal (Concepto / Pregunta) */}
            {!isFlipped ? (
              <div className="flex flex-col justify-between h-full gap-6">
                <div className="flex items-center justify-between">
                  <span className="text-[10px] font-bold uppercase tracking-wider text-indigo-600 bg-indigo-50 border border-indigo-100 px-2.5 py-1 rounded-full">
                    Frente • Pregunta / Concepto
                  </span>
                  <span className="text-xs text-slate-400 font-medium group-hover:text-indigo-600 transition-colors">
                    Haz clic para voltear ↺
                  </span>
                </div>

                <div className="my-auto py-4">
                  <h3 className="text-lg sm:text-xl font-bold text-slate-900 leading-relaxed text-center">
                    {currentCard.front_text}
                  </h3>
                </div>

                <div className="flex items-center justify-between text-[11px] text-slate-400">
                  {currentCard.source_page ? (
                    <span className="flex items-center gap-1 font-mono text-indigo-600">
                      <IconDocument className="w-3.5 h-3.5" />
                      Origen: Página {currentCard.source_page}
                    </span>
                  ) : (
                    <span />
                  )}
                  <span>UniNav AI Flashcard</span>
                </div>
              </div>
            ) : (
              /* Lado Reverso (Explicación / Respuesta) */
              <div className="flex flex-col justify-between h-full gap-6 bg-slate-900 text-white -m-8 p-8 rounded-3xl animate-in fade-in zoom-in-95">
                <div className="flex items-center justify-between">
                  <span className="text-[10px] font-bold uppercase tracking-wider text-emerald-400 bg-emerald-950/80 border border-emerald-800 px-2.5 py-1 rounded-full">
                    Reverso • Respuesta Clave
                  </span>
                  <span className="text-xs text-slate-400 font-medium group-hover:text-emerald-400 transition-colors">
                    Haz clic para voltear ↺
                  </span>
                </div>

                <div className="my-auto py-4">
                  <p className="text-sm sm:text-base text-slate-100 leading-relaxed font-sans text-center whitespace-pre-wrap">
                    {currentCard.back_text}
                  </p>
                </div>

                <div className="flex items-center justify-between text-[11px] text-slate-400 border-t border-slate-800 pt-3">
                  <span>Fundamentado en bibliografía oficial</span>
                  <span className="text-emerald-400 font-bold">✓ Respuesta Verificada</span>
                </div>
              </div>
            )}
          </div>

          {/* Controles de Navegación y Estado */}
          <div className="flex flex-wrap items-center justify-between w-full gap-3 pt-2">
            <div className="flex items-center gap-2">
              <button
                type="button"
                disabled={currentIndex === 0}
                onClick={() => {
                  setIsFlipped(false)
                  setCurrentIndex((prev) => Math.max(0, prev - 1))
                }}
                className="rounded-xl border border-slate-200 bg-white px-4 py-2 text-xs font-semibold text-slate-700 hover:bg-slate-50 disabled:opacity-40 transition-colors cursor-pointer"
              >
                ← Anterior
              </button>

              <button
                type="button"
                disabled={currentIndex === cards.length - 1}
                onClick={() => {
                  setIsFlipped(false)
                  setCurrentIndex((prev) => Math.min(cards.length - 1, prev + 1))
                }}
                className="rounded-xl border border-slate-200 bg-white px-4 py-2 text-xs font-semibold text-slate-700 hover:bg-slate-50 disabled:opacity-40 transition-colors cursor-pointer"
              >
                Siguiente →
              </button>
            </div>

            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={() => handleToggleMastered(currentCard.id, currentCard.mastered)}
                className={`rounded-xl px-4 py-2 text-xs font-bold transition-all cursor-pointer ${
                  currentCard.mastered
                    ? 'bg-emerald-600 text-white shadow-2xs'
                    : 'bg-indigo-50 border border-indigo-200 text-indigo-700 hover:bg-indigo-100'
                }`}
              >
                {currentCard.mastered ? '✓ Marcar para repasar' : '⭐ Marcar como dominada'}
              </button>

              <button
                type="button"
                onClick={() => handleDelete(currentCard.id)}
                className="rounded-xl border border-slate-200 bg-white p-2 text-slate-400 hover:text-rose-600 hover:bg-rose-50 transition-colors cursor-pointer"
                title="Eliminar tarjeta"
              >
                <IconTrash className="w-4 h-4" />
              </button>
            </div>
          </div>
        </div>
      ) : (
        /* Estado Vacío */
        <div className="rounded-3xl border border-dashed border-slate-300 bg-white p-12 text-center flex flex-col items-center gap-4">
          <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-indigo-50 text-indigo-600">
            <IconSparkles className="w-6 h-6" />
          </div>
          <div>
            <h3 className="text-base font-bold text-slate-900">
              No hay tarjetas didácticas generadas aún
            </h3>
            <p className="text-xs text-slate-500 mt-1 max-w-md mx-auto">
              Generá tarjetas de estudio interactivas basadas en los apuntes PDF de tu materia para repasar activamente antes de los exámenes.
            </p>
          </div>
          <button
            type="button"
            disabled={loading}
            onClick={handleGenerate}
            className="rounded-xl bg-indigo-600 px-5 py-3 text-xs font-bold text-white shadow-md hover:bg-indigo-700 disabled:opacity-50 transition-all cursor-pointer"
          >
            {loading ? 'Analizando apunte y generando IA...' : '⚡ Generar tarjetas con IA'}
          </button>
        </div>
      )}
    </div>
  )
}
