'use client'

import { useState } from 'react'
import Link from 'next/link'
import {
  uploadDocument,
  deleteDocument,
  generateDocumentSummaryAction,
  generateSubjectCheatSheetAction,
  SubjectCheatSheetData,
} from './actions'
import SubjectCheatSheetModal from '@/components/SubjectCheatSheetModal'
import {
  IconDocument,
  IconSparkles,
  IconTrash,
  IconDownload,
  IconBook,
  IconChat,
  IconQuiz,
  IconClipboard,
  IconCheck,
} from '@/components/icons'


export interface DocumentItem {
  id: string
  title: string
  document_type: 'apunte' | 'examen_viejo'
  file_url: string
  signed_url?: string | null
  created_at: string
  chunk_count: number
}

interface DocumentsWorkspaceProps {
  subjectId: string
  subjectName: string
  documents: DocumentItem[]
}

interface SummaryData {
  title: string
  summary: string
  key_takeaways: string[]
  exam_topics: string[]
}

export default function DocumentsWorkspace({
  subjectId,
  subjectName,
  documents = [],
}: DocumentsWorkspaceProps) {
  const [uploading, setUploading] = useState(false)
  const [dragOver, setDragOver] = useState(false)
  const [selectedFile, setSelectedFile] = useState<File | null>(null)
  const [customTitle, setCustomTitle] = useState('')

  // Estado de resumen IA
  const [summarizingDocId, setSummarizingDocId] = useState<string | null>(null)
  const [activeSummaryModal, setActiveSummaryModal] = useState<SummaryData | null>(null)
  const [copiedSummary, setCopiedSummary] = useState(false)

  // Estado de Ficha de Repaso Maestra (Cheat Sheet)
  const [generatingCheatSheet, setGeneratingCheatSheet] = useState(false)
  const [activeCheatSheetData, setActiveCheatSheetData] = useState<SubjectCheatSheetData | null>(null)

  const handleGenerateCheatSheet = async () => {
    setGeneratingCheatSheet(true)
    try {
      const res = await generateSubjectCheatSheetAction(subjectId)
      if (!res.success) {
        alert(res.error || 'Ocurrió un error al generar la ficha de repaso.')
        return
      }
      if (res.data) {
        setActiveCheatSheetData(res.data)
      }
    } catch (err) {
      alert(err instanceof Error ? err.message : 'Error al procesar la ficha de repaso.')
    } finally {
      setGeneratingCheatSheet(false)
    }
  }



  const handleFileChange = (file: File | null) => {
    if (!file) return
    setSelectedFile(file)
    if (!customTitle) {
      setCustomTitle(file.name.replace(/\.pdf$/i, ''))
    }
  }

  const handleUploadSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    if (!selectedFile) return
    setUploading(true)

    const formData = new FormData(e.currentTarget)
    formData.set('file', selectedFile)
    if (customTitle) formData.set('title', customTitle)

    try {
      await uploadDocument(subjectId, formData)
      window.location.reload()
    } catch (err) {
      alert(err instanceof Error ? err.message : 'Error al subir el archivo.')
      setUploading(false)
    }
  }

  const handleDelete = async (docId: string) => {
    if (!confirm('¿Eliminar este apunte y todos sus fragmentos indexados?')) return
    try {
      await deleteDocument(subjectId, docId)
      window.location.reload()
    } catch (err) {
      alert(err instanceof Error ? err.message : 'Error al eliminar el documento.')
    }
  }

  const handleOpenSummary = async (doc: DocumentItem) => {
    setSummarizingDocId(doc.id)
    try {
      const summary = await generateDocumentSummaryAction(subjectId, doc.id)
      setActiveSummaryModal(summary)
    } catch (err) {
      alert(err instanceof Error ? err.message : 'Error al generar resumen.')
    } finally {
      setSummarizingDocId(null)
    }
  }

  const handleCopySummary = () => {
    if (!activeSummaryModal) return
    const text = `# Resumen: ${activeSummaryModal.title}\n\n${activeSummaryModal.summary}\n\n## Puntos Clave:\n${activeSummaryModal.key_takeaways.map((t) => `- ${t}`).join('\n')}\n\n## Preguntas Típicas de Examen:\n${activeSummaryModal.exam_topics.map((t) => `- ${t}`).join('\n')}`
    navigator.clipboard.writeText(text)
    setCopiedSummary(true)
    setTimeout(() => setCopiedSummary(false), 2000)
  }

  return (
    <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
      {/* Columna Izquierda: Lista de Apuntes e Indexación RAG (7 Cols) */}
      <div className="lg:col-span-7 flex flex-col gap-4">
        {/* Banner Destacado: Ficha de Fórmulas y Resumen de Repaso Pre-Parcial */}
        {documents.length > 0 && (
          <div className="rounded-3xl border border-indigo-200/90 bg-gradient-to-br from-indigo-50/90 via-purple-50/40 to-white p-4 sm:p-5 shadow-xs flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div className="flex items-start gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-indigo-600 text-white shadow-xs shrink-0">
                <IconSparkles className="w-5 h-5" />
              </div>
              <div className="flex flex-col">
                <div className="flex items-center gap-2">
                  <span className="text-[10px] font-black uppercase tracking-wider text-indigo-700 bg-indigo-100/90 border border-indigo-200 px-2 py-0.5 rounded-full">
                    Herramienta Pre-Parcial
                  </span>
                  <span className="text-xs text-slate-400 font-medium">1 Clic</span>
                </div>
                <h3 className="text-sm sm:text-base font-bold text-slate-900 leading-tight mt-0.5">
                  Ficha de Fórmulas y Resumen de Repaso
                </h3>
                <p className="text-xs text-slate-600 leading-relaxed mt-0.5">
                  Generá una hoja de fórmulas, trampas típicas y síntesis lista para imprimir en A4 antes de rendir.
                </p>
              </div>
            </div>

            <button
              type="button"
              disabled={generatingCheatSheet}
              onClick={handleGenerateCheatSheet}
              className="rounded-2xl bg-indigo-600 hover:bg-indigo-700 text-white px-4 py-2.5 text-xs font-bold shadow-xs hover:shadow-md transition-all flex items-center justify-center gap-2 shrink-0 cursor-pointer disabled:opacity-50"
            >
              {generatingCheatSheet ? (
                <>
                  <span className="h-3.5 w-3.5 rounded-full border-2 border-white border-t-transparent animate-spin" />
                  <span>Sintetizando...</span>
                </>
              ) : (
                <>
                  <IconSparkles className="w-4 h-4" />
                  <span>Generar Ficha con IA</span>
                </>
              )}
            </button>
          </div>
        )}

        <div className="flex items-center justify-between">
          <h2 className="text-xs font-bold uppercase tracking-wider text-slate-500">
            Apuntes en Biblioteca ({documents.length})
          </h2>
          <span className="text-[11px] text-indigo-600 font-semibold">
            {documents.reduce((acc, d) => acc + d.chunk_count, 0)} fragmentos indexados
          </span>
        </div>


        <div className="flex flex-col gap-3">
          {documents.map((doc) => (
            <div
              key={doc.id}
              className="rounded-2xl border border-slate-200/80 bg-white p-5 shadow-xs flex flex-col gap-3.5 hover:border-slate-300 transition-all"
            >
              {/* Header de la tarjeta */}
              <div className="flex items-start justify-between gap-3">
                <div className="flex items-start gap-3">
                  <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-indigo-50 text-indigo-700 font-bold shrink-0 mt-0.5 shadow-2xs">
                    <IconDocument className="w-5 h-5" />
                  </div>
                  <div>
                    <div className="flex items-center gap-2 flex-wrap">
                      <h3 className="font-bold text-slate-900 text-sm">{doc.title}</h3>
                      {doc.document_type === 'examen_viejo' ? (
                        <span className="rounded-full bg-amber-50 px-2 py-0.5 text-[10px] font-bold text-amber-800 border border-amber-200/70">
                          Examen anterior
                        </span>
                      ) : (
                        <span className="rounded-full bg-indigo-50 px-2 py-0.5 text-[10px] font-bold text-indigo-700 border border-indigo-100">
                          Apunte oficial
                        </span>
                      )}
                    </div>
                    <p className="mt-1 text-xs text-slate-500 flex items-center gap-2">
                      {doc.chunk_count > 0 ? (
                        <span className="text-emerald-700 font-semibold flex items-center gap-1">
                          <IconCheck className="w-3.5 h-3.5 text-emerald-600" />
                          <span>{doc.chunk_count} fragmentos indexados en pgvector</span>
                        </span>
                      ) : (
                        <span className="text-amber-700 font-medium">
                          Procesando fragmentos...
                        </span>
                      )}
                    </p>
                  </div>
                </div>

                <button
                  type="button"
                  onClick={() => handleDelete(doc.id)}
                  className="rounded-lg p-1.5 text-slate-400 hover:text-rose-600 hover:bg-rose-50 transition-colors cursor-pointer"
                  title="Eliminar apunte"
                >
                  <IconTrash className="w-4 h-4" />
                </button>
              </div>

              {/* Botones de Acción sobre el Documento */}
              <div className="flex flex-wrap items-center justify-between pt-3 border-t border-slate-100 gap-2">
                <div className="flex items-center gap-1.5 flex-wrap">
                  {/* Ver PDF */}
                  {doc.signed_url && (
                    <a
                      href={doc.signed_url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="rounded-xl border border-slate-200 bg-white px-3 py-1.5 text-xs font-bold text-slate-700 hover:bg-slate-50 hover:text-slate-900 transition-colors flex items-center gap-1.5 cursor-pointer shadow-2xs"
                    >
                      <IconDocument className="w-3.5 h-3.5 text-slate-500" />
                      <span>Ver PDF</span>
                    </a>
                  )}

                  {/* Descargar PDF */}
                  {doc.signed_url && (
                    <a
                      href={doc.signed_url}
                      download={`${doc.title}.pdf`}
                      className="rounded-xl border border-slate-200 bg-white px-3 py-1.5 text-xs font-bold text-slate-700 hover:bg-slate-50 hover:text-slate-900 transition-colors flex items-center gap-1.5 cursor-pointer shadow-2xs"
                    >
                      <IconDownload className="w-3.5 h-3.5 text-slate-500" />
                      <span>Descargar</span>
                    </a>
                  )}

                  {/* Resumen Ejecutivo con IA */}
                  <button
                    type="button"
                    disabled={summarizingDocId === doc.id}
                    onClick={() => handleOpenSummary(doc)}
                    className="rounded-xl border border-indigo-200 bg-indigo-50/80 px-3 py-1.5 text-xs font-bold text-indigo-700 hover:bg-indigo-100 transition-colors flex items-center gap-1.5 cursor-pointer shadow-2xs disabled:opacity-50"
                  >
                    <IconSparkles className="w-3.5 h-3.5 text-indigo-600" />
                    {summarizingDocId === doc.id ? 'Generando...' : 'Resumen IA'}
                  </button>
                </div>

                {/* Accesos Rápidos de Estudio */}
                <div className="flex items-center gap-1.5">
                  <Link
                    href={`/materias/${subjectId}/temas`}
                    className="p-1.5 rounded-lg bg-slate-50 hover:bg-indigo-50 text-slate-500 hover:text-indigo-700 transition-colors text-xs"
                    title="Chatear con el Tutor sobre este apunte"
                  >
                    <IconChat className="w-4 h-4" />
                  </Link>
                  <Link
                    href={`/materias/${subjectId}/tarjetas`}
                    className="p-1.5 rounded-lg bg-slate-50 hover:bg-indigo-50 text-slate-500 hover:text-indigo-700 transition-colors text-xs"
                    title="Crear tarjetas didácticas de este apunte"
                  >
                    <IconBook className="w-4 h-4" />
                  </Link>
                  <Link
                    href={`/materias/${subjectId}/simulador`}
                    className="p-1.5 rounded-lg bg-slate-50 hover:bg-indigo-50 text-slate-500 hover:text-indigo-700 transition-colors text-xs"
                    title="Generar examen simulado de este apunte"
                  >
                    <IconQuiz className="w-4 h-4" />
                  </Link>
                </div>
              </div>
            </div>
          ))}

          {documents.length === 0 && (
            <div className="rounded-2xl border border-dashed border-slate-300 bg-white p-10 text-center flex flex-col items-center gap-3">
              <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-indigo-50 text-indigo-600">
                <IconDocument className="w-6 h-6" />
              </div>
              <div>
                <p className="text-sm font-bold text-slate-800">Todavía no subiste apuntes para esta materia</p>
                <p className="text-xs text-slate-500 mt-0.5">
                  Cargá tu primer apunte PDF en el panel derecho para activar el tutor socrático y las evaluaciones.
                </p>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Columna Derecha: Formulario de Subida & Drag and Drop (5 Cols) */}
      <div className="lg:col-span-5 sticky top-6">
        <div className="rounded-2xl border border-slate-200/80 bg-white p-5 shadow-xs flex flex-col gap-4">
          <div>
            <h3 className="text-sm font-bold text-slate-900 flex items-center gap-2">
              <IconDocument className="w-4 h-4 text-indigo-600" />
              Subir Apunte PDF
            </h3>
            <p className="text-xs text-slate-500 mt-0.5">
              Cargá la bibliografía oficial para indexar automáticamente fragmentos vectoriales y temas de estudio.
            </p>
          </div>

          <form onSubmit={handleUploadSubmit} className="flex flex-col gap-3.5">
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
                  handleFileChange(file)
                } else {
                  alert('Por favor, arrastrá un archivo en formato PDF.')
                }
              }}
              className={`border-2 border-dashed rounded-2xl p-6 text-center transition-all flex flex-col items-center justify-center gap-2 cursor-pointer ${
                dragOver
                  ? 'border-indigo-500 bg-indigo-50/50'
                  : selectedFile
                  ? 'border-emerald-400 bg-emerald-50/30'
                  : 'border-slate-200 bg-slate-50/50 hover:bg-slate-50'
              }`}
              onClick={() => document.getElementById('pdf-upload-input')?.click()}
            >
              <input
                id="pdf-upload-input"
                type="file"
                name="file"
                accept="application/pdf"
                className="hidden"
                onChange={(e) => handleFileChange(e.target.files?.[0] || null)}
              />

              <IconDocument className="w-8 h-8 text-indigo-500" />

              {selectedFile ? (
                <div>
                  <span className="text-xs font-bold text-emerald-800 block truncate max-w-[240px]">
                    {selectedFile.name}
                  </span>
                  <span className="text-[10px] text-emerald-600 font-semibold">
                    {(selectedFile.size / (1024 * 1024)).toFixed(2)} MB • Listo para indexar
                  </span>
                </div>
              ) : (
                <div>
                  <span className="text-xs font-bold text-slate-700 block">
                    Arrastrá tu PDF acá o hacé clic para buscar
                  </span>
                  <span className="text-[10px] text-slate-400 block mt-0.5">
                    Formatos soportados: PDF hasta 50MB
                  </span>
                </div>
              )}
            </div>

            <div>
              <label className="block text-[11px] font-bold text-slate-700 mb-1">
                Título del Apunte (Opcional):
              </label>
              <input
                type="text"
                name="title"
                value={customTitle}
                onChange={(e) => setCustomTitle(e.target.value)}
                placeholder="Ej: Unidad 1 - Algoritmos y Estructuras"
                className="w-full rounded-xl border border-slate-200 px-3.5 py-2 text-xs bg-slate-50 focus:bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500/20 font-medium text-slate-800"
              />
            </div>

            <label className="flex items-start gap-2 text-xs text-slate-600 mt-1 cursor-pointer select-none">
              <input
                type="checkbox"
                name="document_type"
                value="examen_viejo"
                className="mt-0.5 rounded border-slate-300 text-indigo-600 focus:ring-indigo-500 h-4 w-4"
              />
              <span className="leading-tight">
                Es un examen anterior (se usará solo para formato de estilo en el simulador, sin mezclar contenido).
              </span>
            </label>

            <button
              type="submit"
              disabled={uploading || !selectedFile}
              className="mt-1 w-full rounded-xl bg-indigo-600 px-4 py-3 text-xs font-bold text-white shadow-xs hover:bg-indigo-700 disabled:opacity-50 transition-all flex items-center justify-center gap-2 cursor-pointer"
            >
              <IconSparkles className="w-4 h-4" />
              {uploading ? 'Extrayendo texto e indexando RAG...' : 'Subir e Indexar Apunte'}
            </button>
          </form>
        </div>
      </div>

      {/* MODAL DE RESUMEN EJECUTIVO CON IA */}
      {activeSummaryModal && (
        <div
          className="fixed inset-0 z-[9999] flex items-center justify-center bg-slate-950/75 backdrop-blur-xs p-4 animate-in fade-in"
          onClick={() => setActiveSummaryModal(null)}
        >
          <div
            className="w-full max-w-2xl rounded-3xl bg-white p-6 sm:p-8 shadow-2xl border border-slate-200 flex flex-col gap-5 animate-in zoom-in-95 max-h-[90vh] overflow-y-auto"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Header del Modal */}
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div className="flex items-center gap-2.5">
                <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-indigo-100 text-indigo-700 font-bold">
                  <IconSparkles className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-sm font-bold text-slate-900 leading-tight">
                    Resumen Ejecutivo IA
                  </h3>
                  <span className="text-[11px] font-semibold text-indigo-600">
                    {activeSummaryModal.title}
                  </span>
                </div>
              </div>

              <button
                type="button"
                onClick={() => setActiveSummaryModal(null)}
                className="rounded-xl bg-slate-100 p-1.5 text-slate-500 hover:bg-slate-200 text-xs font-bold cursor-pointer"
              >
                ✕
              </button>
            </div>

            {/* Contenido del Resumen */}
            <div className="flex flex-col gap-4 text-xs leading-relaxed text-slate-800 select-text">
              {/* Síntesis */}
              <div className="rounded-2xl bg-indigo-50/60 border border-indigo-100 p-4">
                <span className="font-bold text-indigo-950 uppercase tracking-wider text-[10px] block mb-1">
                  Síntesis Conceptual:
                </span>
                <p className="leading-relaxed text-slate-800">{activeSummaryModal.summary}</p>
              </div>

              {/* Conclusiones Clave */}
              {activeSummaryModal.key_takeaways.length > 0 && (
                <div className="rounded-2xl bg-slate-50 border border-slate-200/80 p-4">
                  <span className="font-bold text-slate-900 uppercase tracking-wider text-[10px] block mb-2">
                    Puntos Centrales que Debés Saber:
                  </span>
                  <ul className="flex flex-col gap-1.5">
                    {activeSummaryModal.key_takeaways.map((takeaway, tIdx) => (
                      <li key={tIdx} className="flex items-start gap-2">
                        <span className="text-indigo-600 font-bold">•</span>
                        <span>{takeaway}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              )}

              {/* Temas Típicos de Examen */}
              {activeSummaryModal.exam_topics.length > 0 && (
                <div className="rounded-2xl bg-amber-50/70 border border-amber-200/80 p-4">
                  <span className="font-bold text-amber-950 uppercase tracking-wider text-[10px] block mb-2">
                    Preguntas Frecuentes en Parciales:
                  </span>
                  <ul className="flex flex-col gap-1.5">
                    {activeSummaryModal.exam_topics.map((topic, topIdx) => (
                      <li key={topIdx} className="flex items-start gap-2 text-amber-950">
                        <IconCheck className="w-3.5 h-3.5 text-amber-600 shrink-0 mt-0.5" />
                        <span>{topic}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              )}
            </div>

            {/* Footer con Copiar y Cerrar */}
            <div className="flex items-center justify-between pt-3 border-t border-slate-100 gap-2">
              <button
                type="button"
                onClick={handleCopySummary}
                className="rounded-xl border border-indigo-200 bg-indigo-50 px-4 py-2 text-xs font-bold text-indigo-700 hover:bg-indigo-100 transition-colors flex items-center gap-1.5 cursor-pointer shadow-2xs"
              >
                <IconClipboard className="w-3.5 h-3.5" />
                {copiedSummary ? '¡Copiado!' : 'Copiar Resumen'}
              </button>

              <button
                type="button"
                onClick={() => setActiveSummaryModal(null)}
                className="rounded-xl bg-slate-900 px-4 py-2 text-xs font-bold text-white hover:bg-slate-800 transition-colors cursor-pointer"
              >
                Cerrar
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Modal Desplegable de Ficha de Fórmulas y Resumen de Repaso Pre-Parcial */}
      {activeCheatSheetData && (
        <SubjectCheatSheetModal
          data={activeCheatSheetData}
          onClose={() => setActiveCheatSheetData(null)}
        />
      )}
    </div>
  )
}


