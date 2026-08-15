'use client'

import { useState } from 'react'
import {
  IconLightbulb,
  IconBook,
  IconSearch,
  IconDocument,
} from '@/components/icons'

export interface CareerResource {
  id: string
  career_id?: string | null
  tool_name: string
  category: 'software' | 'plantilla' | 'otro'
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

export default function RecursosView({
  userCareerName,
  resources,
  glossary,
}: RecursosViewProps) {
  const [activeTab, setActiveTab] = useState<'herramientas' | 'glosario'>(
    'herramientas'
  )
  const [selectedCategory, setSelectedCategory] = useState<string>('todas')
  const [glossarySearch, setGlossarySearch] = useState<string>('')

  // Filtrado de herramientas por categoría
  const filteredResources = resources.filter((res) => {
    if (selectedCategory === 'todas') return true
    return res.category === selectedCategory
  })

  // Filtrado del glosario por búsqueda en tiempo real
  const filteredGlossary = glossary.filter((g) => {
    if (!glossarySearch.trim()) return true
    const query = glossarySearch.toLowerCase()
    return (
      g.term.toLowerCase().includes(query) ||
      g.definition.toLowerCase().includes(query)
    )
  })

  return (
    <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 flex flex-col gap-8">
      {/* Header Encabezado */}
      <div className="rounded-3xl bg-gradient-to-br from-indigo-950 via-slate-900 to-slate-950 p-8 text-white shadow-xl">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <div className="inline-flex items-center gap-2 rounded-full bg-indigo-500/20 px-3 py-1 text-xs font-medium text-indigo-300 border border-indigo-500/30 mb-3">
              Módulo A • {userCareerName || 'Todas las carreras'}
            </div>
            <h1 className="text-2xl sm:text-3xl font-bold tracking-tight">
              Recursos & Glosario Universitario
            </h1>
            <p className="mt-2 text-sm text-slate-300 max-w-2xl">
              Curaduría de herramientas digitales indispensables y diccionario interactivo con el lenguaje y régimen de cursada universitario argentino.
            </p>
          </div>
        </div>

        {/* Pestañas Principales */}
        <div className="mt-6 flex gap-2 border-t border-slate-800 pt-5">
          <button
            type="button"
            onClick={() => setActiveTab('herramientas')}
            className={`rounded-xl px-4 py-2.5 text-xs font-bold transition-all flex items-center gap-2 ${
              activeTab === 'herramientas'
                ? 'bg-indigo-600 text-white shadow-md'
                : 'bg-slate-800/80 text-slate-300 hover:bg-slate-800 hover:text-white'
            }`}
          >
            <IconLightbulb className="w-4 h-4" />
            Herramientas por Carrera ({resources.length})
          </button>
          <button
            type="button"
            onClick={() => setActiveTab('glosario')}
            className={`rounded-xl px-4 py-2.5 text-xs font-bold transition-all flex items-center gap-2 ${
              activeTab === 'glosario'
                ? 'bg-indigo-600 text-white shadow-md'
                : 'bg-slate-800/80 text-slate-300 hover:bg-slate-800 hover:text-white'
            }`}
          >
            <IconBook className="w-4 h-4" />
            Glosario Universitario ({glossary.length})
          </button>
        </div>
      </div>

      {/* Pestaña 1: Herramientas por Carrera */}
      {activeTab === 'herramientas' && (
        <div className="flex flex-col gap-6">
          {/* Barra de Filtros de Categoría */}
          <div className="flex flex-wrap items-center justify-between gap-4 border-b border-slate-200/80 pb-4">
            <div className="flex items-center gap-2">
              <span className="text-xs font-bold uppercase tracking-wider text-slate-500">
                Categorías:
              </span>
              <div className="flex items-center gap-1.5">
                {[
                  { id: 'todas', label: 'Todas' },
                  { id: 'software', label: 'Software' },
                  { id: 'plantilla', label: 'Plantillas' },
                  { id: 'otro', label: 'Otros' },
                ].map((cat) => (
                  <button
                    key={cat.id}
                    type="button"
                    onClick={() => setSelectedCategory(cat.id)}
                    className={`rounded-xl px-3 py-1.5 text-xs font-semibold transition-all ${
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
              Mostrando {filteredResources.length} de {resources.length} herramientas
            </span>
          </div>

          {/* Grilla de Tarjetas de Herramientas */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
            {filteredResources.map((item) => (
              <div
                key={item.id}
                className="rounded-2xl border border-slate-200/80 bg-white p-5 shadow-sm hover:shadow-md hover:border-indigo-300 transition-all flex flex-col justify-between gap-4"
              >
                <div>
                  <div className="flex items-center justify-between gap-2 mb-2">
                    <h2 className="text-base font-bold text-slate-900 tracking-tight">
                      {item.tool_name}
                    </h2>
                    <span
                      className={`text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-md border ${
                        item.category === 'software'
                          ? 'bg-sky-50 text-sky-700 border-sky-200'
                          : item.category === 'plantilla'
                          ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
                          : 'bg-purple-50 text-purple-700 border-purple-200'
                      }`}
                    >
                      {item.category}
                    </span>
                  </div>

                  <p className="text-xs text-slate-600 leading-relaxed">
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
                      Descargar
                    </a>
                  )}

                  {item.quickstart_url && (
                    <a
                      href={item.quickstart_url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex-1 rounded-xl bg-slate-100 border border-slate-200/80 px-3 py-2 text-center text-xs font-semibold text-slate-700 hover:bg-slate-200 transition-colors"
                    >
                      Guía Rápida
                    </a>
                  )}
                </div>
              </div>
            ))}

            {filteredResources.length === 0 && (
              <div className="col-span-full rounded-2xl border border-dashed border-slate-300 bg-white p-8 text-center text-slate-500 text-xs">
                No hay herramientas registradas en esta categoría.
              </div>
            )}
          </div>
        </div>
      )}

      {/* Pestaña 2: Glosario Universitario */}
      {activeTab === 'glosario' && (
        <div className="flex flex-col gap-6">
          {/* Buscador de Términos */}
          <div className="relative max-w-xl">
            <input
              type="text"
              value={glossarySearch}
              onChange={(e) => setGlossarySearch(e.target.value)}
              placeholder="Buscar término universitario (ej: Correlativas, Promoción, Cátedra)..."
              className="w-full rounded-2xl border border-slate-200 bg-white pl-10 pr-4 py-3 text-xs sm:text-sm text-slate-800 shadow-2xs focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all"
            />
            <IconSearch className="absolute left-3.5 top-3.5 text-slate-400 w-4 h-4" />
          </div>

          {/* Grilla del Glosario */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {filteredGlossary.map((term) => (
              <div
                key={term.id}
                className="rounded-2xl border border-slate-200/80 bg-white p-5 shadow-sm hover:border-indigo-300 transition-all flex flex-col gap-2"
              >
                <div className="flex items-center justify-between gap-2">
                  <h3 className="text-sm font-bold text-indigo-950 flex items-center gap-2">
                    <IconDocument className="w-4 h-4 text-indigo-600 shrink-0" />
                    {term.term}
                  </h3>
                  <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider bg-slate-100 px-2 py-0.5 rounded">
                    Término Académico
                  </span>
                </div>

                <p className="text-xs text-slate-600 leading-relaxed pl-4 border-l-2 border-indigo-400 my-1">
                  {term.definition}
                </p>
              </div>
            ))}

            {filteredGlossary.length === 0 && (
              <div className="col-span-full rounded-2xl border border-dashed border-slate-300 bg-white p-8 text-center text-slate-500 text-xs">
                No se encontraron términos que coincidan con &quot;{glossarySearch}&quot;.
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  )
}
