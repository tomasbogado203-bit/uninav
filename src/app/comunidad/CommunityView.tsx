'use client'

import { useState } from 'react'
import Link from 'next/link'
import {
  uploadCommunityContributionAction,
  toggleUpvoteContributionAction,
  importContributionToSubjectAction,
  deleteContributionAction,
} from './actions'
import {
  IconUsers,
  IconDocument,
  IconSparkles,
  IconThumbUp,
  IconDownload,
  IconTrash,
  IconSearch,
  IconPlus,
  IconChevronLeft,
  IconCheck,
  IconBook,
} from '@/components/icons'

export interface CommunityItem {
  id: string
  user_id: string
  author_name?: string
  subject_name: string
  title: string
  description?: string | null
  resource_type: 'apunte' | 'parcial_resuelto' | 'receta_formulas' | 'resumen'
  file_url: string
  signed_url?: string | null
  upvotes_count: number
  downloads_count: number
  created_at: string
}

export interface UserSubject {
  id: string
  name: string
}

interface CommunityViewProps {
  careerName?: string
  contributions: CommunityItem[]
  userSubjects: UserSubject[]
  userUpvotedIds: string[]
  currentUserId?: string
}

export default function CommunityView({
  careerName = 'Tu Carrera',
  contributions: initialContributions = [],
  userSubjects = [],
  userUpvotedIds: initialUpvotedIds = [],
  currentUserId,
}: CommunityViewProps) {
  const [items, setItems] = useState<CommunityItem[]>(initialContributions)
  const [upvotedIds, setUpvotedIds] = useState<Set<string>>(new Set(initialUpvotedIds))
  const [selectedType, setSelectedType] = useState<string>('todos')
  const [searchQuery, setSearchQuery] = useState<string>('')
  const [sortBy, setSortBy] = useState<'top' | 'recent'>('top')

  // Modal de Subida de Aporte
  const [showUploadModal, setShowUploadModal] = useState(false)
  const [uploading, setUploading] = useState(false)
  const [dragOver, setDragOver] = useState(false)
  const [selectedFile, setSelectedFile] = useState<File | null>(null)

  // Modal de Importación a Materia
  const [importingItem, setImportingItem] = useState<CommunityItem | null>(null)
  const [selectedSubjectId, setSelectedSubjectId] = useState<string>(
    userSubjects[0]?.id || ''
  )
  const [importingLoading, setImportingLoading] = useState(false)
  const [importSuccessMsg, setImportSuccessMsg] = useState<string | null>(null)

  // Filtrado de aportes
  const filteredItems = items
    .filter((item) => {
      if (selectedType !== 'todos' && item.resource_type !== selectedType) {
        return false
      }
      if (!searchQuery.trim()) return true
      const q = searchQuery.toLowerCase()
      return (
        item.title.toLowerCase().includes(q) ||
        item.subject_name.toLowerCase().includes(q) ||
        (item.description && item.description.toLowerCase().includes(q))
      )
    })
    .sort((a, b) => {
      if (sortBy === 'top') {
        return b.upvotes_count - a.upvotes_count
      }
      return new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
    })

  const handleToggleUpvote = async (itemId: string) => {
    // Actualización optimista local
    const isUpvoted = upvotedIds.has(itemId)
    const newUpvoted = new Set(upvotedIds)
    if (isUpvoted) newUpvoted.delete(itemId)
    else newUpvoted.add(itemId)
    setUpvotedIds(newUpvoted)

    setItems((prev) =>
      prev.map((it) =>
        it.id === itemId
          ? { ...it, upvotes_count: Math.max(0, it.upvotes_count + (isUpvoted ? -1 : 1)) }
          : it
      )
    )

    try {
      await toggleUpvoteContributionAction(itemId)
    } catch {
      // Fallback
    }
  }

  const handleUploadSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    if (!selectedFile) return
    setUploading(true)

    const formData = new FormData(e.currentTarget)
    formData.set('file', selectedFile)

    try {
      await uploadCommunityContributionAction(formData)
      window.location.reload()
    } catch (err) {
      alert(err instanceof Error ? err.message : 'Error al publicar aporte.')
      setUploading(false)
    }
  }

  const handleImportSubmit = async () => {
    if (!importingItem || !selectedSubjectId) return
    setImportingLoading(true)

    try {
      await importContributionToSubjectAction(importingItem.id, selectedSubjectId)
      setImportSuccessMsg(
        `"${importingItem.title}" fue importado con éxito. Tu Tutor Socrático RAG ya lo aprendió.`
      )
      setTimeout(() => {
        setImportSuccessMsg(null)
        setImportingItem(null)
      }, 3000)
    } catch (err) {
      alert(err instanceof Error ? err.message : 'Error al importar.')
    } finally {
      setImportingLoading(false)
    }
  }

  const handleDelete = async (itemId: string) => {
    if (!confirm('¿Eliminar este aporte comunitario?')) return
    try {
      await deleteContributionAction(itemId)
      setItems((prev) => prev.filter((it) => it.id !== itemId))
    } catch (err) {
      alert(err instanceof Error ? err.message : 'Error al eliminar.')
    }
  }

  const getResourceTypeBadge = (type: string) => {
    switch (type) {
      case 'parcial_resuelto':
        return { label: 'Parcial Resuelto', style: 'bg-rose-50 text-rose-700 border-rose-200' }
      case 'receta_formulas':
        return { label: 'Receta de Fórmulas', style: 'bg-amber-50 text-amber-800 border-amber-200' }
      case 'resumen':
        return { label: 'Resumen de Cursada', style: 'bg-purple-50 text-purple-700 border-purple-200' }
      default:
        return { label: 'Apunte Teórico', style: 'bg-indigo-50 text-indigo-700 border-indigo-200' }
    }
  }

  return (
    <div className="mx-auto max-w-7xl px-4 py-6 sm:px-6 flex flex-col gap-6 select-none">
      {/* Botones de Navegación Superior */}
      <div className="flex items-center justify-between gap-3">
        <Link
          href="/"
          className="inline-flex items-center gap-1.5 rounded-xl bg-white border border-slate-200/90 px-3.5 py-2 text-xs font-bold text-slate-700 hover:bg-slate-50 hover:text-slate-900 transition-all shadow-2xs cursor-pointer active:scale-95"
        >
          <IconChevronLeft className="w-3.5 h-3.5" />
          <span>Volver al Inicio</span>
        </Link>

        <Link
          href="/materias"
          className="inline-flex items-center gap-1.5 rounded-xl bg-indigo-50 border border-indigo-200 px-3.5 py-2 text-xs font-bold text-indigo-700 hover:bg-indigo-100 transition-all shadow-2xs cursor-pointer active:scale-95"
        >
          <IconBook className="w-3.5 h-3.5" />
          <span>Mis Materias</span>
        </Link>
      </div>

      {/* Hero Banner de la Comunidad con Botón de Subida Integrado */}
      <div className="rounded-3xl bg-gradient-to-br from-indigo-950 via-slate-900 to-slate-950 p-6 sm:p-8 text-white shadow-xl">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-5">
          <div className="max-w-2xl">
            <div className="inline-flex items-center gap-2 rounded-full bg-indigo-500/20 px-3 py-0.5 text-xs font-semibold text-indigo-300 border border-indigo-500/30 mb-2">
              <IconUsers className="w-3.5 h-3.5 text-indigo-400" />
              Banco Colaborativo • {careerName}
            </div>
            <h1 className="text-xl sm:text-2xl font-bold tracking-tight">
              Banco Comunitario de la Carrera
            </h1>
            <p className="mt-1 text-xs sm:text-sm text-slate-300 leading-relaxed">
              Descubrí apuntes teóricos, parciales resueltos y recetas de fórmulas compartidas por estudiantes de tu misma carrera. Importalos a tu materia en 1 clic para entrenar a tu tutor IA.
            </p>
          </div>

          <button
            type="button"
            onClick={() => setShowUploadModal(true)}
            className="inline-flex items-center justify-center gap-2 rounded-2xl bg-indigo-600 hover:bg-indigo-500 px-5 py-3 text-xs font-bold text-white shadow-lg hover:shadow-indigo-500/25 transition-all shrink-0 cursor-pointer active:scale-95"
          >
            <IconPlus className="w-4 h-4" />
            <span>Subir Aporte Comunitario</span>
          </button>
        </div>
      </div>


      {/* Barra de Filtros, Búsqueda y Ordenamiento */}
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 border-b border-slate-200/80 pb-4">
        {/* Buscador en tiempo real */}
        <div className="relative flex-1 max-w-md">
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Buscar por materia, tema o título..."
            className="w-full rounded-2xl border border-slate-200 bg-white pl-10 pr-4 py-2.5 text-xs sm:text-sm text-slate-800 shadow-2xs focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all font-medium"
          />
          <IconSearch className="absolute left-3.5 top-3 text-slate-400 w-4 h-4" />
        </div>

        {/* Filtros de Tipo y Orden */}
        <div className="flex items-center gap-2 flex-wrap">
          {/* Tipos */}
          <div className="flex items-center bg-slate-100 p-0.5 rounded-xl border border-slate-200/80 text-xs font-semibold">
            {[
              { id: 'todos', label: 'Todos' },
              { id: 'apunte', label: 'Apuntes' },
              { id: 'parcial_resuelto', label: 'Parciales' },
              { id: 'receta_formulas', label: 'Recetas' },
            ].map((tab) => (
              <button
                key={tab.id}
                type="button"
                onClick={() => setSelectedType(tab.id)}
                className={`px-3 py-1.5 rounded-lg transition-all cursor-pointer ${
                  selectedType === tab.id
                    ? 'bg-white text-indigo-700 shadow-2xs font-bold'
                    : 'text-slate-500 hover:text-slate-800'
                }`}
              >
                {tab.label}
              </button>
            ))}
          </div>

          {/* Selector de Orden */}
          <select
            value={sortBy}
            onChange={(e) => setSortBy(e.target.value as 'top' | 'recent')}
            className="rounded-xl border border-slate-200 bg-white px-3 py-2 text-xs font-bold text-slate-700 shadow-2xs focus:outline-none cursor-pointer"
          >
            <option value="top">Más Votados</option>
            <option value="recent">Más Recientes</option>
          </select>
        </div>
      </div>

      {/* Grilla de Aportes Comunitarios */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
        {filteredItems.map((item) => {
          const badge = getResourceTypeBadge(item.resource_type)
          const isUpvoted = upvotedIds.has(item.id)
          const isOwner = currentUserId && item.user_id === currentUserId

          return (
            <div
              key={item.id}
              className="rounded-2xl border border-slate-200/80 bg-white p-5 shadow-xs hover:shadow-sm hover:border-indigo-300 transition-all flex flex-col justify-between gap-4"
            >
              <div>
                <div className="flex items-center justify-between gap-2 mb-2">
                  <span className="text-[10px] font-bold uppercase tracking-wider text-indigo-700 bg-indigo-50 border border-indigo-100 px-2 py-0.5 rounded-md truncate max-w-[170px]">
                    {item.subject_name}
                  </span>
                  <span
                    className={`text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-md border ${badge.style}`}
                  >
                    {badge.label}
                  </span>
                </div>

                <h3 className="text-sm font-bold text-slate-900 leading-snug">
                  {item.title}
                </h3>

                {item.description && (
                  <p className="mt-1.5 text-xs text-slate-600 leading-relaxed line-clamp-3 font-sans">
                    {item.description}
                  </p>
                )}
              </div>

              {/* Acciones del Aporte */}
              <div className="flex flex-col gap-2 pt-3 border-t border-slate-100">
                <div className="flex items-center justify-between gap-2">
                  {/* Botón de Voto Upvote */}
                  <button
                    type="button"
                    onClick={() => handleToggleUpvote(item.id)}
                    className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold border transition-all cursor-pointer active:scale-95 shadow-2xs ${
                      isUpvoted
                        ? 'bg-emerald-50 text-emerald-800 border-emerald-300'
                        : 'bg-white text-slate-600 border-slate-200 hover:bg-slate-50'
                    }`}
                    title="Votar este aporte"
                  >
                    <IconThumbUp
                      className={`w-3.5 h-3.5 ${
                        isUpvoted ? 'text-emerald-600' : 'text-slate-400'
                      }`}
                    />
                    <span>{item.upvotes_count}</span>
                  </button>

                  <div className="flex items-center gap-1">
                    {/* Ver PDF */}
                    {item.signed_url && (
                      <a
                        href={item.signed_url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="rounded-xl border border-slate-200 bg-white px-2.5 py-1.5 text-xs font-bold text-slate-700 hover:bg-slate-50 transition-colors shadow-2xs"
                        title="Ver PDF en el navegador"
                      >
                        <IconDocument className="w-3.5 h-3.5 text-slate-600" />
                      </a>
                    )}

                    {/* Descargar */}
                    {item.signed_url && (
                      <a
                        href={item.signed_url}
                        download={`${item.title}.pdf`}
                        className="rounded-xl border border-slate-200 bg-white px-2.5 py-1.5 text-xs font-bold text-slate-700 hover:bg-slate-50 transition-colors shadow-2xs"
                        title="Descargar archivo"
                      >
                        <IconDownload className="w-3.5 h-3.5 text-slate-500" />
                      </a>
                    )}

                    {/* Botón Eliminar si es el autor */}
                    {isOwner && (
                      <button
                        type="button"
                        onClick={() => handleDelete(item.id)}
                        className="p-1.5 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition-colors cursor-pointer"
                        title="Eliminar mi aporte"
                      >
                        <IconTrash className="w-3.5 h-3.5" />
                      </button>
                    )}
                  </div>
                </div>

                {/* Importar a mi materia en 1 clic */}
                <button
                  type="button"
                  onClick={() => setImportingItem(item)}
                  className="w-full rounded-xl bg-indigo-50 border border-indigo-200/90 hover:bg-indigo-600 hover:text-white text-indigo-700 px-3 py-2 text-xs font-bold transition-all shadow-2xs flex items-center justify-center gap-1.5 cursor-pointer active:scale-95"
                >
                  <IconSparkles className="w-3.5 h-3.5" />
                  <span>Importar a Mi Materia</span>
                </button>
              </div>
            </div>
          )
        })}

        {filteredItems.length === 0 && (
          <div className="col-span-full rounded-3xl border border-dashed border-slate-300 bg-white p-12 text-center flex flex-col items-center gap-3">
            <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-indigo-50 text-indigo-600">
              <IconUsers className="w-6 h-6" />
            </div>
            <div>
              <p className="text-sm font-bold text-slate-800">
                Aún no hay aportes en esta categoría
              </p>
              <p className="text-xs text-slate-500 mt-0.5">
                Compartí un apunte o parcial para ayudar a tus compañeros de carrera.
              </p>
            </div>
            <button
              type="button"
              onClick={() => setShowUploadModal(true)}
              className="mt-2 rounded-xl bg-indigo-600 px-4 py-2.5 text-xs font-bold text-white hover:bg-indigo-700 transition-all cursor-pointer shadow-xs"
            >
              + Subir Primer Aporte
            </button>
          </div>
        )}
      </div>

      {/* MODAL 1: IMPORTAR APUNTE A MATERIA */}
      {importingItem && (
        <div
          className="fixed inset-0 z-[9999] flex items-center justify-center bg-slate-950/75 backdrop-blur-xs p-4 animate-in fade-in"
          onClick={() => !importingLoading && setImportingItem(null)}
        >
          <div
            className="w-full max-w-md rounded-3xl bg-white p-6 shadow-2xl border border-slate-200 flex flex-col gap-4 animate-in zoom-in-95"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div className="flex items-center gap-2">
                <IconSparkles className="w-5 h-5 text-indigo-600" />
                <h3 className="text-sm font-bold text-slate-900">
                  Importar al Workspace de tu Materia
                </h3>
              </div>
              {!importingLoading && (
                <button
                  type="button"
                  onClick={() => setImportingItem(null)}
                  className="rounded-xl bg-slate-100 p-1.5 text-slate-500 hover:bg-slate-200 text-xs font-bold cursor-pointer"
                >
                  ✕
                </button>
              )}
            </div>

            {importSuccessMsg ? (
              <div className="rounded-2xl bg-emerald-50 border border-emerald-200 p-4 text-center flex flex-col items-center gap-2 animate-in zoom-in-95">
                <div className="flex h-10 w-10 items-center justify-center rounded-full bg-emerald-100 text-emerald-700 font-bold">
                  <IconCheck className="w-5 h-5" />
                </div>
                <p className="text-xs font-bold text-emerald-900 leading-relaxed">
                  {importSuccessMsg}
                </p>
              </div>
            ) : (
              <div className="flex flex-col gap-3 text-xs">
                <p className="text-slate-600 leading-relaxed">
                  El apunte <strong className="text-slate-900">&quot;{importingItem.title}&quot;</strong> se clonará a tu biblioteca y se indexará automáticamente en <strong>pgvector</strong> para que tu Tutor Socrático RAG pueda responderte en base a él.
                </p>

                <div className="flex flex-col gap-1.5 mt-1">
                  <label className="font-bold text-slate-700">
                    Seleccioná a qué materia querés importarlo:
                  </label>
                  {userSubjects.length > 0 ? (
                    <select
                      value={selectedSubjectId}
                      onChange={(e) => setSelectedSubjectId(e.target.value)}
                      disabled={importingLoading}
                      className="rounded-xl border border-slate-200 bg-slate-50 px-3.5 py-2.5 text-xs font-bold text-slate-800 focus:outline-none focus:ring-2 focus:ring-indigo-500/20"
                    >
                      {userSubjects.map((sub) => (
                        <option key={sub.id} value={sub.id}>
                          {sub.name}
                        </option>
                      ))}
                    </select>
                  ) : (
                    <p className="text-xs text-amber-700 italic bg-amber-50 p-2.5 rounded-xl border border-amber-200">
                      Primero debés tener al menos una materia creada en tu cuenta.
                    </p>
                  )}
                </div>

                <div className="flex items-center justify-end gap-2 pt-3 border-t border-slate-100 mt-2">
                  <button
                    type="button"
                    disabled={importingLoading}
                    onClick={() => setImportingItem(null)}
                    className="rounded-xl px-4 py-2 text-xs font-semibold text-slate-600 hover:bg-slate-100 transition-colors cursor-pointer"
                  >
                    Cancelar
                  </button>

                  <button
                    type="button"
                    disabled={importingLoading || userSubjects.length === 0}
                    onClick={handleImportSubmit}
                    className="rounded-xl bg-indigo-600 px-5 py-2 text-xs font-bold text-white shadow-2xs hover:bg-indigo-700 transition-all flex items-center gap-1.5 cursor-pointer disabled:opacity-50"
                  >
                    <IconSparkles className="w-3.5 h-3.5" />
                    {importingLoading ? 'Clonando e indexando RAG...' : 'Confirmar Importación'}
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {/* MODAL 2: SUBIR APORTE COMUNITARIO */}
      {showUploadModal && (
        <div
          className="fixed inset-0 z-[9999] flex items-center justify-center bg-slate-950/75 backdrop-blur-xs p-4 animate-in fade-in"
          onClick={() => !uploading && setShowUploadModal(false)}
        >
          <div
            className="w-full max-w-lg rounded-3xl bg-white p-6 shadow-2xl border border-slate-200 flex flex-col gap-4 animate-in zoom-in-95 max-h-[90vh] overflow-y-auto"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div className="flex items-center gap-2">
                <IconUsers className="w-5 h-5 text-indigo-600" />
                <h3 className="text-sm font-bold text-slate-900">
                  Compartir Aporte con la Comunidad
                </h3>
              </div>
              {!uploading && (
                <button
                  type="button"
                  onClick={() => setShowUploadModal(false)}
                  className="rounded-xl bg-slate-100 p-1.5 text-slate-500 hover:bg-slate-200 text-xs font-bold cursor-pointer"
                >
                  ✕
                </button>
              )}
            </div>

            <form onSubmit={handleUploadSubmit} className="flex flex-col gap-3.5 text-xs">
              {/* Zona Drag & Drop */}
              <div
                onDragOver={(e) => {
                  e.preventDefault()
                  setDragOver(true)
                }}
                onDragLeave={() => setDragOver(false)}
                onDrop={(e) => {
                  e.preventDefault()
                  setDragOver(false)
                  const file = e.dataTransfer.files?.[0]
                  if (file && file.type === 'application/pdf') {
                    setSelectedFile(file)
                  } else {
                    alert('Por favor, arrastrá un archivo PDF.')
                  }
                }}
                className={`border-2 border-dashed rounded-2xl p-5 text-center transition-all flex flex-col items-center justify-center gap-1.5 cursor-pointer ${
                  dragOver
                    ? 'border-indigo-500 bg-indigo-50/50'
                    : selectedFile
                    ? 'border-emerald-400 bg-emerald-50/30'
                    : 'border-slate-200 bg-slate-50/50 hover:bg-slate-50'
                }`}
                onClick={() => document.getElementById('community-file-input')?.click()}
              >
                <input
                  id="community-file-input"
                  type="file"
                  accept="application/pdf"
                  className="hidden"
                  onChange={(e) => setSelectedFile(e.target.files?.[0] || null)}
                />

                <IconDocument className="w-8 h-8 text-indigo-500" />

                {selectedFile ? (
                  <div>
                    <span className="text-xs font-bold text-emerald-800 block truncate max-w-[260px]">
                      {selectedFile.name}
                    </span>
                    <span className="text-[10px] text-emerald-600 font-semibold">
                      {(selectedFile.size / (1024 * 1024)).toFixed(2)} MB • Archivo cargado
                    </span>
                  </div>
                ) : (
                  <div>
                    <span className="text-xs font-bold text-slate-700 block">
                      Arrastrá tu archivo PDF o hacé clic para buscar
                    </span>
                    <span className="text-[10px] text-slate-400 block mt-0.5">
                      Apuntes, parciales resueltos o resúmenes hasta 50MB
                    </span>
                  </div>
                )}
              </div>

              {/* Título del Aporte */}
              <div className="flex flex-col gap-1">
                <label className="font-bold text-slate-700">Título del Aporte:</label>
                <input
                  type="text"
                  name="title"
                  required
                  placeholder="Ej: Resumen Integrador 1er Parcial - Álgebra"
                  className="rounded-xl border border-slate-200 px-3.5 py-2 text-xs bg-slate-50 focus:bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500/20 font-medium"
                />
              </div>

              {/* Nombre de la Materia */}
              <div className="flex flex-col gap-1">
                <label className="font-bold text-slate-700">Materia de Origen:</label>
                <input
                  type="text"
                  name="subject_name"
                  required
                  placeholder="Ej: Análisis Matemático I, Algoritmos..."
                  className="rounded-xl border border-slate-200 px-3.5 py-2 text-xs bg-slate-50 focus:bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500/20 font-medium"
                />
              </div>

              {/* Tipo de Recurso */}
              <div className="flex flex-col gap-1">
                <label className="font-bold text-slate-700">Tipo de Documento:</label>
                <select
                  name="resource_type"
                  className="rounded-xl border border-slate-200 bg-slate-50 px-3.5 py-2 text-xs font-bold text-slate-800 focus:outline-none"
                >
                  <option value="apunte">Apunte Teórico / Práctico</option>
                  <option value="parcial_resuelto">Parcial / Final Resuelto</option>
                  <option value="receta_formulas">Receta de Fórmulas / Cheat Sheet</option>
                  <option value="resumen">Resumen de Cursada</option>
                </select>
              </div>

              {/* Descripción */}
              <div className="flex flex-col gap-1">
                <label className="font-bold text-slate-700">Descripción o Consejos (Opcional):</label>
                <textarea
                  name="description"
                  rows={2}
                  placeholder="Ej: Incluye ejercicios resueltos paso a paso de los finales de 2024 y 2025..."
                  className="rounded-xl border border-slate-200 p-3 text-xs bg-slate-50 focus:bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500/20 font-medium"
                />
              </div>

              <div className="flex items-center justify-end gap-2 pt-3 border-t border-slate-100">
                <button
                  type="button"
                  disabled={uploading}
                  onClick={() => setShowUploadModal(false)}
                  className="rounded-xl px-4 py-2 text-xs font-semibold text-slate-600 hover:bg-slate-100 transition-colors cursor-pointer"
                >
                  Cancelar
                </button>

                <button
                  type="submit"
                  disabled={uploading || !selectedFile}
                  className="rounded-xl bg-indigo-600 px-5 py-2 text-xs font-bold text-white shadow-2xs hover:bg-indigo-700 transition-all flex items-center gap-1.5 cursor-pointer disabled:opacity-50"
                >
                  <IconPlus className="w-3.5 h-3.5" />
                  {uploading ? 'Subiendo aporte...' : 'Publicar en la Comunidad'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}
