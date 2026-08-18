'use client'

import { useState } from 'react'
import { explainGlossaryTermAction } from './actions'
import {
  IconLightbulb,
  IconBook,
  IconSearch,
  IconDocument,
  IconSparkles,
  IconClipboard,
  IconChevronRight,
  IconCheck,
} from '@/components/icons'

export interface CareerResource {
  id: string
  career_id?: string | null
  tool_name: string
  category: 'software' | 'plantilla' | 'otro'
  tag?: string
  description: string
  quickstart_url?: string | null
  download_url?: string | null
  display_order?: number
}

export interface GlossaryTerm {
  id: string
  term: string
  definition: string
  career_id?: string | null
}

interface RecursosViewProps {
  userCareerName?: string
  resources: CareerResource[]
  glossary: GlossaryTerm[]
}

interface TermExplanationData {
  term: string
  simple_definition: string
  practical_example: string
  pro_tip: string
}

export default function RecursosView({
  userCareerName,
  resources = [],
  glossary = [],
}: RecursosViewProps) {
  const [activeTab, setActiveTab] = useState<'herramientas' | 'glosario'>('herramientas')
  const [selectedCategory, setSelectedCategory] = useState<string>('todas')
  const [glossarySearch, setGlossarySearch] = useState<string>('')
  const [selectedLetter, setSelectedLetter] = useState<string>('todas')

  // Estado de Explicación con IA
  const [explainingTerm, setExplainingTerm] = useState<string | null>(null)
  const [activeExplanation, setActiveExplanation] = useState<TermExplanationData | null>(null)
  const [copiedExplanation, setCopiedExplanation] = useState(false)

  // Filtrado de herramientas por categoría
  const filteredResources = resources.filter((res) => {
    if (selectedCategory === 'todas') return true
    if (selectedCategory === 'software') return res.category === 'software'
    if (selectedCategory === 'plantilla') return res.category === 'plantilla'
    if (selectedCategory === 'opensource') return res.tag?.toLowerCase().includes('open source')
    return true
  })

  // Obtener letras disponibles del glosario para el filtro A-Z
  const availableLetters = Array.from(
    new Set(glossary.map((g) => g.term.charAt(0).toUpperCase()))
  ).sort()

  // Filtrado del glosario por búsqueda y letra
  const filteredGlossary = glossary.filter((g) => {
    if (selectedLetter !== 'todas' && g.term.charAt(0).toUpperCase() !== selectedLetter) {
      return false
    }
    if (!glossarySearch.trim()) return true
    const query = glossarySearch.toLowerCase()
    return (
      g.term.toLowerCase().includes(query) ||
      g.definition.toLowerCase().includes(query)
    )
  })

  const handleExplainTerm = async (termName: string) => {
    setExplainingTerm(termName)
    try {
      const explanation = await explainGlossaryTermAction(termName)
      setActiveExplanation(explanation)
    } catch (err) {
      alert(err instanceof Error ? err.message : 'Error al consultar a la IA.')
    } finally {
      setExplainingTerm(null)
    }
  }

  const handleCopyExplanation = () => {
    if (!activeExplanation) return
    const text = `# ${activeExplanation.term}\n\n${activeExplanation.simple_definition}\n\n## Ejemplo Práctico:\n${activeExplanation.practical_example}\n\n## Consejo Pro:\n${activeExplanation.pro_tip}`
    navigator.clipboard.writeText(text)
    setCopiedExplanation(true)
    setTimeout(() => setCopiedExplanation(false), 2000)
  }

  return (
    <div className="mx-auto max-w-7xl px-4 py-6 sm:px-6 flex flex-col gap-6 select-none">
      {/* Header Encabezado Compacto y Moderno */}
      <div className="rounded-3xl bg-gradient-to-br from-indigo-950 via-slate-900 to-slate-950 p-6 sm:p-8 text-white shadow-xl">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <div className="inline-flex items-center gap-2 rounded-full bg-indigo-500/20 px-3 py-0.5 text-xs font-semibold text-indigo-300 border border-indigo-500/30 mb-2">
              <IconSparkles className="w-3.5 h-3.5 text-indigo-400" />
              Guía de Supervivencia Universitaria • {userCareerName || 'Todas las Carreras'}
            </div>
            <h1 className="text-xl sm:text-2xl font-bold tracking-tight">
              Recursos Digitales & Glosario Académico
            </h1>
            <p className="mt-1 text-xs sm:text-sm text-slate-300 max-w-2xl leading-relaxed">
              Curaduría de herramientas digitales gratuitas y diccionario interactivo con el régimen de cursada universitario argentino.
            </p>
          </div>
        </div>

        {/* Pestañas Principales */}
        <div className="mt-5 flex gap-2 border-t border-slate-800/80 pt-4">
          <button
            type="button"
            onClick={() => setActiveTab('herramientas')}
            className={`rounded-xl px-4 py-2 text-xs font-bold transition-all flex items-center gap-2 cursor-pointer ${
              activeTab === 'herramientas'
                ? 'bg-indigo-600 text-white shadow-md'
                : 'bg-slate-800/80 text-slate-300 hover:bg-slate-800 hover:text-white'
            }`}
          >
            <IconLightbulb className="w-4 h-4" />
            <span>Herramientas Estudiantiles ({resources.length})</span>
          </button>
          <button
            type="button"
            onClick={() => setActiveTab('glosario')}
            className={`rounded-xl px-4 py-2 text-xs font-bold transition-all flex items-center gap-2 cursor-pointer ${
              activeTab === 'glosario'
                ? 'bg-indigo-600 text-white shadow-md'
                : 'bg-slate-800/80 text-slate-300 hover:bg-slate-800 hover:text-white'
            }`}
          >
            <IconBook className="w-4 h-4" />
            <span>Glosario Universitario ({glossary.length})</span>
          </button>
        </div>
      </div>

      {/* Pestaña 1: Herramientas por Carrera */}
      {activeTab === 'herramientas' && (
        <div className="flex flex-col gap-5">
          {/* Barra de Filtros de Categoría */}
          <div className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-200/80 pb-3">
            <div className="flex items-center gap-2">
              <span className="text-xs font-bold uppercase tracking-wider text-slate-500">
                Filtros:
              </span>
              <div className="flex items-center gap-1.5 flex-wrap">
                {[
                  { id: 'todas', label: 'Todas las herramientas' },
                  { id: 'software', label: 'Software' },
                  { id: 'plantilla', label: 'Plantillas' },
                  { id: 'opensource', label: 'Open Source' },
                ].map((cat) => (
                  <button
                    key={cat.id}
                    type="button"
                    onClick={() => setSelectedCategory(cat.id)}
                    className={`rounded-xl px-3 py-1.5 text-xs font-semibold transition-all cursor-pointer ${
                      selectedCategory === cat.id
                        ? 'bg-indigo-600 text-white shadow-2xs'
                        : 'bg-white border border-slate-200 text-slate-700 hover:bg-slate-50'
                    }`}
                  >
                    {cat.label}
                  </button>
                ))}
              </div>
            </div>

            <span className="text-xs text-slate-500 font-medium">
              Mostrando {filteredResources.length} de {resources.length} recursos
            </span>
          </div>

          {/* Grilla de Tarjetas de Herramientas */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {filteredResources.map((item) => (
              <div
                key={item.id}
                className="rounded-2xl border border-slate-200/80 bg-white p-5 shadow-xs hover:shadow-sm hover:border-indigo-300 transition-all flex flex-col justify-between gap-4"
              >
                <div>
                  <div className="flex items-center justify-between gap-2 mb-2">
                    <h2 className="text-sm font-bold text-slate-900 tracking-tight">
                      {item.tool_name}
                    </h2>
                    <span className="text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-md border bg-indigo-50 text-indigo-700 border-indigo-100">
                      {item.tag || item.category}
                    </span>
                  </div>

                  <p className="text-xs text-slate-600 leading-relaxed font-sans">
                    {item.description}
                  </p>
                </div>

                {/* Acciones directas (Quickstart & Download) */}
                <div className="flex items-center gap-2 pt-3 border-t border-slate-100">
                  {item.download_url && (
                    <a
                      href={item.download_url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex-1 rounded-xl bg-indigo-600 px-3 py-2 text-center text-xs font-bold text-white shadow-2xs hover:bg-indigo-700 transition-colors"
                    >
                      Descargar / Acceder
                    </a>
                  )}

                  {item.quickstart_url && (
                    <a
                      href={item.quickstart_url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="rounded-xl bg-slate-100 border border-slate-200/80 px-3 py-2 text-center text-xs font-semibold text-slate-700 hover:bg-slate-200 transition-colors"
                    >
                      Guía Rápida
                    </a>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Pestaña 2: Glosario Universitario con IA y Filtros A-Z */}
      {activeTab === 'glosario' && (
        <div className="flex flex-col gap-5">
          {/* Buscador de Términos + Botón de consulta IA libre */}
          <div className="flex flex-col sm:flex-row items-center gap-3">
            <div className="relative flex-1 w-full">
              <input
                type="text"
                value={glossarySearch}
                onChange={(e) => setGlossarySearch(e.target.value)}
                placeholder="Buscar término universitario (ej: Correlatividades, Promoción, Cátedra, SIU)..."
                className="w-full rounded-2xl border border-slate-200 bg-white pl-10 pr-4 py-2.5 text-xs sm:text-sm text-slate-800 shadow-2xs focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all font-medium"
              />
              <IconSearch className="absolute left-3.5 top-3 text-slate-400 w-4 h-4" />
            </div>

            {glossarySearch.trim() && (
              <button
                type="button"
                disabled={explainingTerm === glossarySearch}
                onClick={() => handleExplainTerm(glossarySearch.trim())}
                className="rounded-xl bg-indigo-600 px-4 py-2.5 text-xs font-bold text-white shadow-2xs hover:bg-indigo-700 transition-all flex items-center gap-1.5 shrink-0 cursor-pointer disabled:opacity-50"
              >
                <IconSparkles className="w-3.5 h-3.5" />
                {explainingTerm === glossarySearch
                  ? 'Explicando...'
                  : `Consultar "${glossarySearch}" a la IA`}
              </button>
            )}
          </div>

          {/* Filtros Alfabéticos A-Z */}
          <div className="flex items-center gap-1.5 overflow-x-auto pb-1 scrollbar-none">
            <button
              type="button"
              onClick={() => setSelectedLetter('todas')}
              className={`rounded-lg px-2.5 py-1 text-xs font-bold transition-all cursor-pointer ${
                selectedLetter === 'todas'
                  ? 'bg-indigo-600 text-white shadow-2xs'
                  : 'bg-white border border-slate-200 text-slate-600 hover:bg-slate-100'
              }`}
            >
              Todas
            </button>
            {availableLetters.map((letter) => (
              <button
                key={letter}
                type="button"
                onClick={() => setSelectedLetter(letter)}
                className={`rounded-lg px-2 py-1 text-xs font-bold transition-all cursor-pointer ${
                  selectedLetter === letter
                    ? 'bg-indigo-600 text-white shadow-2xs'
                    : 'bg-white border border-slate-200 text-slate-600 hover:bg-slate-100'
                }`}
              >
                {letter}
              </button>
            ))}
          </div>

          {/* Grilla de Términos del Glosario */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {filteredGlossary.map((term) => (
              <div
                key={term.id}
                className="rounded-2xl border border-slate-200/80 bg-white p-5 shadow-xs hover:border-indigo-300 transition-all flex flex-col justify-between gap-3"
              >
                <div className="flex flex-col gap-2">
                  <div className="flex items-center justify-between gap-2">
                    <h3 className="text-sm font-bold text-indigo-950 flex items-center gap-2">
                      <IconDocument className="w-4 h-4 text-indigo-600 shrink-0" />
                      {term.term}
                    </h3>
                    <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider bg-slate-100 px-2 py-0.5 rounded">
                      Académico
                    </span>
                  </div>

                  <p className="text-xs text-slate-600 leading-relaxed pl-3 border-l-2 border-indigo-400 my-0.5 font-sans">
                    {term.definition}
                  </p>
                </div>

                <div className="flex items-center justify-end pt-2 border-t border-slate-100">
                  <button
                    type="button"
                    disabled={explainingTerm === term.term}
                    onClick={() => handleExplainTerm(term.term)}
                    className="text-[11px] font-bold text-indigo-600 hover:text-indigo-800 flex items-center gap-1 transition-colors cursor-pointer disabled:opacity-50"
                  >
                    <IconSparkles className="w-3.5 h-3.5" />
                    {explainingTerm === term.term ? 'Generando...' : 'Explicar con UniNav AI'}
                    <IconChevronRight className="w-3 h-3" />
                  </button>
                </div>
              </div>
            ))}

            {filteredGlossary.length === 0 && (
              <div className="col-span-full rounded-2xl border border-dashed border-slate-300 bg-white p-8 text-center flex flex-col items-center gap-2">
                <p className="text-xs text-slate-500 font-semibold">
                  No se encontraron términos para &quot;{glossarySearch}&quot;.
                </p>
                {glossarySearch && (
                  <button
                    type="button"
                    onClick={() => handleExplainTerm(glossarySearch.trim())}
                    className="rounded-xl bg-indigo-600 px-4 py-2 text-xs font-bold text-white shadow-2xs hover:bg-indigo-700 transition-colors flex items-center gap-1.5 cursor-pointer mt-1"
                  >
                    <IconSparkles className="w-3.5 h-3.5" />
                    Pedirle a la IA que defina &quot;{glossarySearch}&quot;
                  </button>
                )}
              </div>
            )}
          </div>
        </div>
      )}

      {/* MODAL DE EXPLICACIÓN CON IA SOCRÁTICA */}
      {activeExplanation && (
        <div
          className="fixed inset-0 z-[9999] flex items-center justify-center bg-slate-950/75 backdrop-blur-xs p-4 animate-in fade-in"
          onClick={() => setActiveExplanation(null)}
        >
          <div
            className="w-full max-w-xl rounded-3xl bg-white p-6 shadow-2xl border border-slate-200 flex flex-col gap-4 animate-in zoom-in-95 max-h-[90vh] overflow-y-auto"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Header del Modal */}
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div className="flex items-center gap-2.5">
                <div className="flex h-8 w-8 items-center justify-center rounded-xl bg-indigo-100 text-indigo-700 font-bold">
                  <IconSparkles className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="text-sm font-bold text-slate-900 leading-tight">
                    Explicación Universitaria con IA
                  </h3>
                  <span className="text-[11px] font-semibold text-indigo-600">
                    Concepto: {activeExplanation.term}
                  </span>
                </div>
              </div>

              <button
                type="button"
                onClick={() => setActiveExplanation(null)}
                className="rounded-xl bg-slate-100 p-1.5 text-slate-500 hover:bg-slate-200 text-xs font-bold cursor-pointer"
              >
                ✕
              </button>
            </div>

            {/* Contenido de la Explicación */}
            <div className="flex flex-col gap-3.5 text-xs leading-relaxed text-slate-800 select-text">
              {/* Definición directa */}
              <div className="rounded-2xl bg-indigo-50/60 border border-indigo-100 p-4">
                <span className="font-bold text-indigo-950 uppercase tracking-wider text-[10px] block mb-1">
                  📌 ¿Qué significa en la facultad?
                </span>
                <p className="text-slate-800 leading-relaxed font-sans">
                  {activeExplanation.simple_definition}
                </p>
              </div>

              {/* Ejemplo práctico */}
              {activeExplanation.practical_example && (
                <div className="rounded-2xl bg-slate-50 border border-slate-200/80 p-4">
                  <span className="font-bold text-slate-900 uppercase tracking-wider text-[10px] block mb-1">
                    💡 Caso Práctico Cotidiano:
                  </span>
                  <p className="text-slate-700 leading-relaxed font-sans">
                    {activeExplanation.practical_example}
                  </p>
                </div>
              )}

              {/* Pro Tip del Tutor */}
              {activeExplanation.pro_tip && (
                <div className="rounded-2xl bg-amber-50/70 border border-amber-200/80 p-4">
                  <span className="font-bold text-amber-950 uppercase tracking-wider text-[10px] block mb-1">
                    🎯 Consejo Clave para el Estudiante:
                  </span>
                  <p className="text-amber-950 leading-relaxed font-sans">
                    {activeExplanation.pro_tip}
                  </p>
                </div>
              )}
            </div>

            {/* Footer con Copiar y Cerrar */}
            <div className="flex items-center justify-between pt-2 border-t border-slate-100">
              <button
                type="button"
                onClick={handleCopyExplanation}
                className="rounded-xl border border-indigo-200 bg-indigo-50 px-3.5 py-2 text-xs font-bold text-indigo-700 hover:bg-indigo-100 transition-colors flex items-center gap-1.5 cursor-pointer shadow-2xs"
              >
                <IconClipboard className="w-3.5 h-3.5" />
                {copiedExplanation ? '¡Copiado! ✓' : 'Copiar Explicación'}
              </button>

              <button
                type="button"
                onClick={() => setActiveExplanation(null)}
                className="rounded-xl bg-slate-900 px-4 py-2 text-xs font-bold text-white hover:bg-slate-800 transition-colors cursor-pointer"
              >
                Cerrar
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
