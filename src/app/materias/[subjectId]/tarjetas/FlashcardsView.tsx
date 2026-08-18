'use client'

import { useState, useEffect, useCallback } from 'react'
import {
  generateFlashcardsAction,
  toggleMasteredAction,
  deleteFlashcardAction,
} from './actions'
import {
  IconSparkles,
  IconDocument,
  IconTrash,
  IconClipboard,
  IconLightbulb,
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
  topics?: string[]
}

export default function FlashcardsView({
  subjectId,
  subjectName,
  flashcards = [],
  topics = [],
}: FlashcardsViewProps) {
  const [cards, setCards] = useState<FlashcardItem[]>(flashcards)
  const [loading, setLoading] = useState(false)
  const [currentIndex, setCurrentIndex] = useState(0)
  const [isFlipped, setIsFlipped] = useState(false)
  const [toastMessage, setToastMessage] = useState<string | null>(null)

  // Filtros: 'all' | 'learning' | 'mastered'
  const [filterMode, setFilterMode] = useState<'all' | 'learning' | 'mastered'>('all')

  // Vista: 'study' (tarjeta individual) | 'deck' (grilla completa)
  const [viewMode, setViewMode] = useState<'study' | 'deck'>('study')

  // Selector de tema para generar
  const [selectedTopic, setSelectedTopic] = useState<string>('Todas las unidades')

  // Estado para tarjeta ampliada en modal (Modo Mazo)
  const [expandedCardIndex, setExpandedCardIndex] = useState<number | null>(null)
  const [expandedCardFlipped, setExpandedCardFlipped] = useState(false)

  // Cargar y combinar tarjetas persistidas en localStorage como fallback seguro
  useEffect(() => {
    try {
      const saved = localStorage.getItem(`uninav_flashcards_${subjectId}`)
      if (saved) {
        const parsed: FlashcardItem[] = JSON.parse(saved)
        if (Array.isArray(parsed) && parsed.length > 0) {
          const existingIds = new Set(flashcards.map((c) => c.id))
          const missingLocal = parsed.filter((c) => !existingIds.has(c.id))
          setCards([...flashcards, ...missingLocal])
          return
        }
      }
    } catch {
      // Ignorar errores
    }
    setCards(flashcards)
  }, [subjectId, flashcards])

  // Helper para persistencia local
  const saveToLocal = (updatedCards: FlashcardItem[]) => {
    setCards(updatedCards)
    try {
      localStorage.setItem(`uninav_flashcards_${subjectId}`, JSON.stringify(updatedCards))
    } catch {
      // Ignorar errores
    }
  }

  // Filtrado de tarjetas
  const activeCards = cards.filter((c) => {
    if (filterMode === 'learning') return !c.mastered
    if (filterMode === 'mastered') return c.mastered
    return true
  })

  const currentCard = activeCards[currentIndex]
  const expandedCard = expandedCardIndex !== null ? activeCards[expandedCardIndex] : null

  // Atajos de teclado para repaso activo ultra rápido
  const handleKeyDown = useCallback(
    (e: KeyboardEvent) => {
      // Ignorar si el usuario está escribiendo en un input
      if (['INPUT', 'TEXTAREA', 'SELECT'].includes((e.target as HTMLElement)?.tagName)) return

      if (expandedCardIndex !== null) {
        // Atajos dentro del modal de tarjeta ampliada
        if (e.key === 'Escape') {
          e.preventDefault()
          setExpandedCardIndex(null)
        } else if (e.code === 'Space' || e.key === ' ') {
          e.preventDefault()
          setExpandedCardFlipped((prev) => !prev)
        } else if (e.key === 'ArrowRight' || e.key === 'd' || e.key === 'D') {
          e.preventDefault()
          setExpandedCardFlipped(false)
          setExpandedCardIndex((prev) =>
            prev !== null && prev < activeCards.length - 1 ? prev + 1 : 0
          )
        } else if (e.key === 'ArrowLeft' || e.key === 'a' || e.key === 'A') {
          e.preventDefault()
          setExpandedCardFlipped(false)
          setExpandedCardIndex((prev) =>
            prev !== null && prev > 0 ? prev - 1 : activeCards.length - 1
          )
        }
        return
      }

      if (viewMode !== 'study' || activeCards.length === 0) return

      if (e.code === 'Space' || e.key === ' ') {
        e.preventDefault()
        setIsFlipped((prev) => !prev)
      } else if (e.key === 'ArrowRight' || e.key === 'd' || e.key === 'D') {
        e.preventDefault()
        setIsFlipped(false)
        setCurrentIndex((prev) => (prev < activeCards.length - 1 ? prev + 1 : 0))
      } else if (e.key === 'ArrowLeft' || e.key === 'a' || e.key === 'A') {
        e.preventDefault()
        setIsFlipped(false)
        setCurrentIndex((prev) => (prev > 0 ? prev - 1 : activeCards.length - 1))
      } else if (e.key === 'm' || e.key === 'M') {
        if (currentCard) {
          e.preventDefault()
          handleToggleMastered(currentCard.id, currentCard.mastered)
        }
      }
    },
    [viewMode, activeCards.length, currentCard, expandedCardIndex]
  )

  useEffect(() => {
    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [handleKeyDown])

  const handleGenerate = async () => {
    setLoading(true)
    setToastMessage(null)

    try {
      const newCards = await generateFlashcardsAction(
        subjectId,
        selectedTopic !== 'Todas las unidades' ? selectedTopic : undefined
      )
      if (newCards && newCards.length > 0) {
        const updated = [...newCards, ...cards]
        saveToLocal(updated)
        setCurrentIndex(0)
        setIsFlipped(false)
        setToastMessage(`¡${newCards.length} tarjetas generadas con éxito con IA!`)
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
      // Fallback local
    }
  }

  const handleDelete = async (cardId: string) => {
    if (!confirm('¿Deseás eliminar esta tarjeta didáctica?')) return

    const updated = cards.filter((c) => c.id !== cardId)
    saveToLocal(updated)

    if (currentIndex >= activeCards.length - 1) {
      setCurrentIndex(Math.max(0, activeCards.length - 2))
    }
    setIsFlipped(false)
    if (expandedCardIndex !== null) setExpandedCardIndex(null)

    try {
      await deleteFlashcardAction(subjectId, cardId)
    } catch {
      // Fallback local
    }
  }

  const handleShuffle = () => {
    const shuffled = [...cards].sort(() => Math.random() - 0.5)
    saveToLocal(shuffled)
    setCurrentIndex(0)
    setIsFlipped(false)
    setToastMessage('🔀 Mazo barajado aleatoriamente')
  }

  // Métricas de progreso
  const totalCount = cards.length
  const masteredCount = cards.filter((c) => c.mastered).length
  const progressPercent = totalCount > 0 ? Math.round((masteredCount / totalCount) * 100) : 0

  return (
    <div className="flex flex-col gap-6 max-w-5xl mx-auto">
      {/* Toast Notificación */}
      {toastMessage && (
        <div className="rounded-2xl bg-emerald-600 text-white p-3.5 text-xs font-bold shadow-lg flex items-center justify-between animate-in fade-in slide-in-from-top-2">
          <span className="flex items-center gap-2">
            <IconSparkles className="w-4 h-4" />
            {toastMessage}
          </span>
          <button onClick={() => setToastMessage(null)} className="text-white hover:opacity-80 cursor-pointer">
            ✕
          </button>
        </div>
      )}

      {/* Header Compacto con Generador de Tarjetas */}
      <div className="rounded-2xl bg-white border border-slate-200/80 p-5 shadow-xs flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="text-[10px] font-bold uppercase tracking-wider bg-indigo-50 text-indigo-700 px-2.5 py-0.5 rounded-md border border-indigo-100">
              Active Recall • {subjectName}
            </span>
          </div>
          <h1 className="text-lg sm:text-xl font-bold text-slate-900 tracking-tight">
            Tarjetas Didácticas (Flashcards)
          </h1>
          <p className="text-xs text-slate-500 mt-0.5">
            Poné a prueba tu retención activa antes de los exámenes.
          </p>
        </div>

        {/* Generador con Selector de Tema */}
        <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2">
          {topics.length > 0 && (
            <select
              value={selectedTopic}
              onChange={(e) => setSelectedTopic(e.target.value)}
              className="rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 text-xs font-semibold text-slate-700 focus:outline-none focus:ring-2 focus:ring-indigo-500/20"
            >
              <option value="Todas las unidades">🌐 Toda la materia</option>
              {topics.map((top, idx) => (
                <option key={idx} value={top}>
                  📌 {top}
                </option>
              ))}
            </select>
          )}

          <button
            type="button"
            disabled={loading}
            onClick={handleGenerate}
            className="inline-flex items-center justify-center gap-1.5 rounded-xl bg-indigo-600 px-4 py-2 text-xs font-bold text-white shadow-xs hover:bg-indigo-700 disabled:opacity-50 transition-all cursor-pointer shrink-0"
          >
            <IconSparkles className="w-3.5 h-3.5" />
            {loading ? 'Generando con IA...' : '⚡ Generar Tarjetas con IA'}
          </button>
        </div>
      </div>

      {/* Barra de Progreso y Filtros */}
      {totalCount > 0 && (
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 bg-slate-100/70 border border-slate-200/80 rounded-2xl p-3.5">
          {/* Progreso Dominado */}
          <div className="flex items-center gap-3 w-full sm:w-auto">
            <div className="w-32 bg-slate-200 rounded-full h-2.5 overflow-hidden">
              <div
                className="bg-emerald-500 h-2.5 rounded-full transition-all duration-500"
                style={{ width: `${progressPercent}%` }}
              />
            </div>
            <span className="text-xs font-bold text-slate-700">
              {masteredCount} de {totalCount} dominadas ({progressPercent}%)
            </span>
          </div>

          {/* Filtros y Selector de Vista */}
          <div className="flex items-center gap-2 flex-wrap">
            {/* Filtro de Estado */}
            <div className="inline-flex rounded-xl bg-white p-0.5 border border-slate-200 text-xs font-semibold">
              <button
                type="button"
                onClick={() => {
                  setFilterMode('all')
                  setCurrentIndex(0)
                  setIsFlipped(false)
                }}
                className={`px-2.5 py-1 rounded-lg transition-all cursor-pointer ${
                  filterMode === 'all'
                    ? 'bg-indigo-50 text-indigo-700 font-bold'
                    : 'text-slate-500 hover:text-slate-800'
                }`}
              >
                Todas ({totalCount})
              </button>
              <button
                type="button"
                onClick={() => {
                  setFilterMode('learning')
                  setCurrentIndex(0)
                  setIsFlipped(false)
                }}
                className={`px-2.5 py-1 rounded-lg transition-all cursor-pointer ${
                  filterMode === 'learning'
                    ? 'bg-indigo-50 text-indigo-700 font-bold'
                    : 'text-slate-500 hover:text-slate-800'
                }`}
              >
                En repaso ({totalCount - masteredCount})
              </button>
              <button
                type="button"
                onClick={() => {
                  setFilterMode('mastered')
                  setCurrentIndex(0)
                  setIsFlipped(false)
                }}
                className={`px-2.5 py-1 rounded-lg transition-all cursor-pointer ${
                  filterMode === 'mastered'
                    ? 'bg-emerald-50 text-emerald-700 font-bold'
                    : 'text-slate-500 hover:text-slate-800'
                }`}
              >
                ⭐ Dominadas ({masteredCount})
              </button>
            </div>

            {/* Botón Barajar */}
            <button
              type="button"
              onClick={handleShuffle}
              className="p-1.5 rounded-xl border border-slate-200 bg-white text-slate-600 hover:bg-slate-50 text-xs font-bold transition-colors cursor-pointer"
              title="Barajar tarjetas aleatoriamente"
            >
              🔀
            </button>

            {/* Selector de Modo Estudio vs Modo Mazo */}
            <div className="inline-flex rounded-xl bg-white p-0.5 border border-slate-200 text-xs font-semibold">
              <button
                type="button"
                onClick={() => setViewMode('study')}
                className={`px-2.5 py-1 rounded-lg transition-all cursor-pointer ${
                  viewMode === 'study'
                    ? 'bg-slate-900 text-white font-bold'
                    : 'text-slate-500 hover:text-slate-800'
                }`}
              >
                🎴 Estudio
              </button>
              <button
                type="button"
                onClick={() => setViewMode('deck')}
                className={`px-2.5 py-1 rounded-lg transition-all cursor-pointer ${
                  viewMode === 'deck'
                    ? 'bg-slate-900 text-white font-bold'
                    : 'text-slate-500 hover:text-slate-800'
                }`}
              >
                📋 Mazo
              </button>
            </div>
          </div>
        </div>
      )}

      {/* MODO ESTUDIO 1 A 1 */}
      {viewMode === 'study' && currentCard && (
        <div className="flex flex-col items-center gap-5">
          {/* Indicador de Avance */}
          <div className="flex items-center justify-between w-full text-xs text-slate-500 px-1 font-semibold">
            <span>
              Tarjeta {currentIndex + 1} de {activeCards.length}
            </span>
            <span className="text-[11px] text-slate-400">
              💡 Atajos: <kbd className="bg-slate-200 px-1 py-0.5 rounded text-[10px] font-mono">Espacio</kbd> voltear • <kbd className="bg-slate-200 px-1 py-0.5 rounded text-[10px] font-mono">→</kbd> siguiente • <kbd className="bg-slate-200 px-1 py-0.5 rounded text-[10px] font-mono">M</kbd> dominar
            </span>
          </div>

          {/* Tarjeta Interactiva con Animación */}
          <div
            onClick={() => setIsFlipped(!isFlipped)}
            className="w-full min-h-[300px] cursor-pointer rounded-3xl border-2 border-indigo-200/80 bg-white p-8 shadow-sm hover:shadow-md transition-all duration-300 flex flex-col justify-between relative group select-none"
          >
            {/* Lado Frontal (Concepto / Pregunta) */}
            {!isFlipped ? (
              <div className="flex flex-col justify-between h-full gap-6">
                <div className="flex items-center justify-between">
                  <span className="text-[10px] font-bold uppercase tracking-wider text-indigo-700 bg-indigo-50 border border-indigo-100 px-2.5 py-1 rounded-full">
                    ❓ Pregunta / Desafío
                  </span>
                  <span className="text-xs text-slate-400 font-medium group-hover:text-indigo-600 transition-colors">
                    Haz clic o presiona Espacio para ver respuesta ↺
                  </span>
                </div>

                <div className="my-auto py-6">
                  <h3 className="text-lg sm:text-xl font-bold text-slate-900 leading-relaxed text-center">
                    {currentCard.front_text}
                  </h3>
                </div>

                <div className="flex items-center justify-between text-[11px] text-slate-400">
                  {currentCard.source_page ? (
                    <span className="flex items-center gap-1 font-mono text-indigo-600 font-bold">
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
                    🎓 Respuesta & Concepto Clave
                  </span>
                  <span className="text-xs text-slate-400 font-medium group-hover:text-emerald-400 transition-colors">
                    Haz clic para voltear ↺
                  </span>
                </div>

                <div className="my-auto py-6">
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
                className="rounded-xl border border-slate-200 bg-white px-4 py-2 text-xs font-bold text-slate-700 hover:bg-slate-50 disabled:opacity-40 transition-colors cursor-pointer shadow-2xs"
              >
                ← Anterior
              </button>

              <button
                type="button"
                disabled={currentIndex === activeCards.length - 1}
                onClick={() => {
                  setIsFlipped(false)
                  setCurrentIndex((prev) => Math.min(activeCards.length - 1, prev + 1))
                }}
                className="rounded-xl border border-slate-200 bg-white px-4 py-2 text-xs font-bold text-slate-700 hover:bg-slate-50 disabled:opacity-40 transition-colors cursor-pointer shadow-2xs"
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
      )}

      {/* MODO MAZO COMPLETO (GRILLA) */}
      {viewMode === 'deck' && (
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
          {activeCards.map((card, idx) => (
            <div
              key={card.id || idx}
              onClick={() => {
                setExpandedCardIndex(idx)
                setExpandedCardFlipped(false)
              }}
              className={`rounded-2xl border p-4 shadow-xs flex flex-col justify-between gap-3 transition-all cursor-pointer hover:shadow-md hover:-translate-y-0.5 group relative ${
                card.mastered
                  ? 'bg-emerald-50/40 border-emerald-200/80'
                  : 'bg-white border-slate-200/80 hover:border-indigo-300'
              }`}
              title="Hacé clic para agrandar y ver en detalle"
            >
              <div className="flex flex-col gap-2">
                <div className="flex items-center justify-between text-[10px] font-bold">
                  <span className="text-indigo-600">Tarjeta #{idx + 1}</span>
                  <div className="flex items-center gap-1.5">
                    <span className="text-[10px] text-slate-400 opacity-0 group-hover:opacity-100 transition-opacity font-semibold">
                      🔍 Agrandar
                    </span>
                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation()
                        handleToggleMastered(card.id, card.mastered)
                      }}
                      className="cursor-pointer"
                    >
                      {card.mastered ? '⭐ Dominada' : '● En repaso'}
                    </button>
                  </div>
                </div>
                <h4 className="text-xs font-bold text-slate-900 leading-tight">
                  {card.front_text}
                </h4>
                <p className="text-[11px] text-slate-600 leading-relaxed pt-2 border-t border-slate-100 line-clamp-3">
                  {card.back_text}
                </p>
              </div>

              <div className="flex items-center justify-between pt-2 border-t border-slate-100 text-[10px] text-slate-400">
                {card.source_page ? (
                  <span>Pág. {card.source_page}</span>
                ) : (
                  <span />
                )}
                <button
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation()
                    handleDelete(card.id)
                  }}
                  className="text-slate-400 hover:text-rose-600 transition-colors p-1 rounded hover:bg-rose-50 cursor-pointer"
                  title="Eliminar tarjeta"
                >
                  <IconTrash className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* MODAL DE TARJETA AMPLIADA (ZOOM EN MODO MAZO) */}
      {expandedCard && expandedCardIndex !== null && (
        <div
          className="fixed inset-0 z-[9999] flex items-center justify-center bg-slate-950/75 backdrop-blur-xs p-4 animate-in fade-in"
          onClick={() => setExpandedCardIndex(null)}
        >
          <div
            className="w-full max-w-2xl rounded-3xl bg-white p-6 sm:p-8 shadow-2xl border border-slate-200 flex flex-col justify-between gap-6 animate-in zoom-in-95 min-h-[420px]"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Header del Modal */}
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div className="flex items-center gap-2">
                <span className="text-xs font-bold text-slate-800">
                  Tarjeta {expandedCardIndex + 1} de {activeCards.length}
                </span>
                <span
                  className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                    expandedCard.mastered
                      ? 'bg-emerald-100 text-emerald-800'
                      : 'bg-indigo-50 text-indigo-700'
                  }`}
                >
                  {expandedCard.mastered ? '⭐ Dominada' : '● En repaso'}
                </span>
              </div>

              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => {
                    setCurrentIndex(expandedCardIndex)
                    setViewMode('study')
                    setExpandedCardIndex(null)
                  }}
                  className="text-[11px] font-bold text-indigo-600 hover:text-indigo-800 bg-indigo-50 px-2.5 py-1 rounded-lg border border-indigo-100 transition-colors cursor-pointer"
                  title="Pasar al modo estudio individual en esta tarjeta"
                >
                  🎴 Abrir en Estudio
                </button>
                <button
                  type="button"
                  onClick={() => setExpandedCardIndex(null)}
                  className="rounded-xl bg-slate-100 p-1.5 text-slate-500 hover:bg-slate-200 text-xs font-bold cursor-pointer"
                >
                  ✕
                </button>
              </div>
            </div>

            {/* Tarjeta 3D Ampliada Interactiva */}
            <div
              onClick={() => setExpandedCardFlipped(!expandedCardFlipped)}
              className="w-full min-h-[220px] cursor-pointer rounded-2xl border-2 border-indigo-200/80 bg-slate-50/50 p-6 shadow-xs hover:shadow-sm transition-all duration-300 flex flex-col justify-between select-none relative group"
            >
              {!expandedCardFlipped ? (
                <div className="flex flex-col justify-between h-full gap-4">
                  <span className="text-[10px] font-bold uppercase tracking-wider text-indigo-700">
                    ❓ Pregunta / Desafío (Hacé clic para ver respuesta ↺)
                  </span>
                  <h3 className="text-base sm:text-xl font-bold text-slate-900 leading-relaxed text-center my-auto">
                    {expandedCard.front_text}
                  </h3>
                  <div className="text-[11px] text-slate-400 flex items-center justify-between">
                    {expandedCard.source_page ? (
                      <span>Página {expandedCard.source_page}</span>
                    ) : (
                      <span />
                    )}
                    <span>Haz clic para voltear ↺</span>
                  </div>
                </div>
              ) : (
                <div className="flex flex-col justify-between h-full gap-4 bg-slate-900 text-white -m-6 p-6 rounded-2xl animate-in fade-in">
                  <span className="text-[10px] font-bold uppercase tracking-wider text-emerald-400">
                    🎓 Respuesta & Explicación
                  </span>
                  <p className="text-sm sm:text-base text-slate-100 leading-relaxed font-sans text-center whitespace-pre-wrap my-auto">
                    {expandedCard.back_text}
                  </p>
                  <div className="text-[11px] text-slate-400 flex items-center justify-between border-t border-slate-800 pt-2">
                    <span>Fundamentado en bibliografía oficial</span>
                    <span className="text-emerald-400 font-bold">✓ Verificada</span>
                  </div>
                </div>
              )}
            </div>

            {/* Footer con Navegación Anterior / Siguiente dentro del Modal */}
            <div className="flex items-center justify-between pt-3 border-t border-slate-100 gap-2 flex-wrap">
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  disabled={expandedCardIndex === 0}
                  onClick={() => {
                    setExpandedCardFlipped(false)
                    setExpandedCardIndex((prev) => (prev !== null && prev > 0 ? prev - 1 : 0))
                  }}
                  className="rounded-xl border border-slate-200 bg-white px-3.5 py-1.5 text-xs font-bold text-slate-700 hover:bg-slate-50 disabled:opacity-40 transition-colors cursor-pointer"
                >
                  ← Anterior
                </button>

                <button
                  type="button"
                  disabled={expandedCardIndex === activeCards.length - 1}
                  onClick={() => {
                    setExpandedCardFlipped(false)
                    setExpandedCardIndex((prev) =>
                      prev !== null && prev < activeCards.length - 1 ? prev + 1 : prev
                    )
                  }}
                  className="rounded-xl border border-slate-200 bg-white px-3.5 py-1.5 text-xs font-bold text-slate-700 hover:bg-slate-50 disabled:opacity-40 transition-colors cursor-pointer"
                >
                  Siguiente →
                </button>
              </div>

              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => handleToggleMastered(expandedCard.id, expandedCard.mastered)}
                  className={`rounded-xl px-3.5 py-1.5 text-xs font-bold transition-all cursor-pointer ${
                    expandedCard.mastered
                      ? 'bg-emerald-600 text-white'
                      : 'bg-indigo-50 text-indigo-700 border border-indigo-200'
                  }`}
                >
                  {expandedCard.mastered ? '✓ Dominada' : '⭐ Marcar como dominada'}
                </button>

                <button
                  type="button"
                  onClick={() => setExpandedCardIndex(null)}
                  className="rounded-xl bg-slate-900 px-4 py-1.5 text-xs font-bold text-white hover:bg-slate-800 transition-colors cursor-pointer"
                >
                  Cerrar
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ESTADO VACÍO */}
      {totalCount === 0 && !loading && (
        <div className="rounded-2xl border border-dashed border-slate-300 bg-white p-12 text-center flex flex-col items-center gap-4">
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
            className="rounded-xl bg-indigo-600 px-5 py-2.5 text-xs font-bold text-white shadow-xs hover:bg-indigo-700 disabled:opacity-50 transition-all cursor-pointer"
          >
            {loading ? 'Generando con IA...' : '⚡ Generar tarjetas con IA'}
          </button>
        </div>
      )}
    </div>
  )
}
