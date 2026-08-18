'use client'

import { useState } from 'react'
import Link from 'next/link'
import {
  uploadBoardPhotoAction,
  confirmDetectedEventAction,
  deleteBoardPhotoAction,
  analyzePhotoOnDemandAction,
} from './actions'
import {
  IconCamera,
  IconSparkles,
  IconTrash,
  IconClipboard,
  IconChat,
  IconCalendar,
} from '@/components/icons'

interface DetectedEvent {
  id: string
  suggested_title: string
  suggested_type: 'parcial' | 'entrega_tp' | 'final'
  suggested_date?: string | null
  confirmed: boolean
  board_photo_id: string
}

interface BoardPhoto {
  id: string
  photo_url: string
  class_date: string
  ocr_text?: string | null
  ocr_status: string
  created_at: string
  detected_events?: DetectedEvent[]
  signed_url?: string | null
}

interface PizarraViewProps {
  subjectId: string
  photos: BoardPhoto[]
  pendingEvents: (DetectedEvent & { photo_url?: string })[]
}

export default function PizarraView({
  subjectId,
  photos,
  pendingEvents,
}: PizarraViewProps) {
  const [uploading, setUploading] = useState(false)
  const [uploadMode, setUploadMode] = useState<'normal' | 'ocr'>('ocr')
  const [confirmingId, setConfirmingId] = useState<string | null>(null)
  const [analyzingPhotoId, setAnalyzingPhotoId] = useState<string | null>(null)
  const [expandedOcrId, setExpandedOcrId] = useState<string | null>(null)
  const [copiedPhotoId, setCopiedPhotoId] = useState<string | null>(null)

  // Estado para modal de zoom / lightbox de la imagen
  const [activeZoomPhoto, setActiveZoomPhoto] = useState<BoardPhoto | null>(null)

  const handleUpload = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    setUploading(true)
    const formData = new FormData(e.currentTarget)
    formData.set('skip_ocr', uploadMode === 'normal' ? 'true' : 'false')

    try {
      await uploadBoardPhotoAction(subjectId, formData)
      window.location.reload()
    } catch (err) {
      alert(err instanceof Error ? err.message : 'Error al guardar la foto de pizarra.')
      setUploading(false)
    }
  }

  const handleAnalyzeOnDemand = async (photoId: string, photoUrl: string) => {
    setAnalyzingPhotoId(photoId)
    try {
      await analyzePhotoOnDemandAction(subjectId, photoId, photoUrl)
      window.location.reload()
    } catch (err) {
      alert(err instanceof Error ? err.message : 'Error en el análisis Gemini Vision.')
      setAnalyzingPhotoId(null)
    }
  }

  const handleConfirmEvent = async (
    evt: DetectedEvent & { photo_url?: string }
  ) => {
    setConfirmingId(evt.id)
    try {
      await confirmDetectedEventAction(
        subjectId,
        evt.id,
        evt.suggested_title || 'Evaluación en Pizarra',
        evt.suggested_type || 'parcial',
        evt.suggested_date || new Date().toISOString().split('T')[0]
      )
      window.location.reload()
    } catch (err) {
      alert(err instanceof Error ? err.message : 'Error al agendar evento.')
      setConfirmingId(null)
    }
  }

  const handleDeletePhoto = async (photoId: string, photoUrl: string) => {
    if (!confirm('¿Borrar esta foto de pizarra y su transcripción?')) return
    try {
      await deleteBoardPhotoAction(subjectId, photoId, photoUrl)
      window.location.reload()
    } catch (err) {
      alert(err instanceof Error ? err.message : 'Error al borrar foto.')
    }
  }

  const handleCopyTranscription = (photoId: string, text: string) => {
    navigator.clipboard.writeText(text)
    setCopiedPhotoId(photoId)
    setTimeout(() => setCopiedPhotoId(null), 2000)
  }

  return (
    <div className="flex flex-col gap-6">
      {/* SECCIÓN 1: PROPUESTAS DE EVENTOS DETECTADOS POR IA (REGLA 7) */}
      {pendingEvents.length > 0 && (
        <div className="rounded-2xl border border-amber-300 bg-amber-50/90 p-5 text-amber-950 shadow-xs flex flex-col gap-3">
          <div className="flex items-center gap-2.5">
            <span className="flex h-8 w-8 items-center justify-center rounded-xl bg-amber-500 text-white font-bold text-base shrink-0 shadow-2xs">
              <IconSparkles className="w-4 h-4" />
            </span>
            <div>
              <h3 className="text-xs sm:text-sm font-bold">
                Evaluaciones Detectadas en Pizarrón por IA (Pendientes de Confirmación)
              </h3>
              <p className="text-[11px] text-amber-800 mt-0.5">
                La IA detectó las siguientes fechas de examen en tus fotos. Hacé clic en "Confirmar y Agendar" para sumarlas automáticamente a tu calendario de estudio.
              </p>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3 mt-1">
            {pendingEvents.map((evt) => (
              <div
                key={evt.id}
                className="rounded-2xl border border-amber-300/80 bg-white p-4 shadow-2xs flex flex-col justify-between gap-3"
              >
                <div>
                  <div className="flex items-center justify-between gap-2 mb-1">
                    <span className="text-xs font-bold text-slate-900 truncate">
                      {evt.suggested_title}
                    </span>
                    <span className="text-[9px] font-bold text-amber-800 bg-amber-100 border border-amber-200 px-2 py-0.5 rounded-full uppercase">
                      {evt.suggested_type}
                    </span>
                  </div>
                  <p className="text-xs text-slate-600 flex items-center gap-1.5 mt-1">
                    <IconCalendar className="w-3.5 h-3.5 text-amber-600" />
                    <span>Fecha anotada:</span>
                    <span className="font-bold text-slate-900">
                      {evt.suggested_date || 'Sin fecha precisa'}
                    </span>
                  </p>
                </div>

                <button
                  type="button"
                  disabled={confirmingId === evt.id}
                  onClick={() => handleConfirmEvent(evt)}
                  className="w-full rounded-xl bg-amber-500 px-3 py-2 text-xs font-bold text-white shadow-2xs hover:bg-amber-600 transition-all disabled:opacity-50 flex items-center justify-center gap-1.5 cursor-pointer"
                >
                  <IconCalendar className="w-3.5 h-3.5" />
                  {confirmingId === evt.id
                    ? 'Agendando...'
                    : 'Confirmar y Agendar en Calendario'}
                </button>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* SECCIÓN 2: FORMULARIO DE SUBIDA DE FOTO DE PIZARRA */}
      <div className="rounded-2xl border border-slate-200/80 bg-white p-5 shadow-xs">
        <div className="mb-4">
          <h2 className="text-sm font-bold text-slate-900 flex items-center gap-2">
            <IconCamera className="w-4 h-4 text-indigo-600" />
            Subir Foto de Pizarrón o Apuntes
          </h2>
          <p className="text-xs text-slate-500 mt-0.5">
            Podés guardar la foto directamente en tu galería o pedirle a Gemini Vision que transcriba fórmulas, ecuaciones manuscritas y detecte fechas de examen.
          </p>
        </div>

        <form onSubmit={handleUpload} className="flex flex-col gap-3">
          <div className="flex flex-col sm:flex-row gap-3 items-center">
            <input
              type="file"
              name="file"
              accept="image/jpeg,image/png,image/webp"
              required
              className="w-full sm:flex-1 text-xs text-slate-500 file:mr-3 file:py-2 file:px-4 file:rounded-xl file:border-0 file:text-xs file:font-semibold file:bg-indigo-50 file:text-indigo-700 hover:file:bg-indigo-100 cursor-pointer"
            />

            <input
              type="date"
              name="class_date"
              defaultValue={new Date().toISOString().split('T')[0]}
              className="w-full sm:w-auto rounded-xl border border-slate-200 px-3 py-2 text-xs bg-slate-50 focus:bg-white text-slate-700 focus:outline-none font-medium"
              title="Fecha de la clase"
            />
          </div>

          <div className="flex flex-wrap items-center justify-end gap-2 pt-2 border-t border-slate-100">
            <button
              type="submit"
              onClick={() => setUploadMode('normal')}
              disabled={uploading}
              className="rounded-xl border border-slate-200 bg-white px-4 py-2 text-xs font-semibold text-slate-700 hover:bg-slate-50 transition-all disabled:opacity-50 cursor-pointer shadow-2xs"
            >
              {uploading && uploadMode === 'normal'
                ? 'Guardando...'
                : '📷 Solo Guardar Foto (Sin OCR)'}
            </button>

            <button
              type="submit"
              onClick={() => setUploadMode('ocr')}
              disabled={uploading}
              className="rounded-xl bg-indigo-600 px-5 py-2 text-xs font-semibold text-white shadow-xs hover:bg-indigo-700 transition-all disabled:opacity-50 flex items-center gap-1.5 cursor-pointer"
            >
              <IconSparkles className="w-3.5 h-3.5" />
              {uploading && uploadMode === 'ocr'
                ? 'Procesando con Gemini Vision...'
                : 'Analizar y Transcribir con IA'}
            </button>
          </div>
        </form>
      </div>

      {/* SECCIÓN 3: GALERÍA DE FOTOS DE PIZARRÓN Y TRANSCRIPCIONES */}
      <div className="flex flex-col gap-4">
        <h2 className="text-xs font-bold uppercase tracking-wider text-slate-500">
          Galería de Pizarras Guardadas ({photos.length})
        </h2>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 items-start">
          {photos.map((photo) => {
            const hasValidOcr =
              photo.ocr_text &&
              !photo.ocr_text.includes('Error procesando OCR') &&
              !photo.ocr_text.includes('No se detectó texto')

            return (
              <div
                key={photo.id}
                className="rounded-2xl border border-slate-200/80 bg-white overflow-hidden shadow-xs flex flex-col"
              >
                {/* Encabezado con imagen interactiva (hacé clic para zoom) */}
                <div
                  onClick={() => setActiveZoomPhoto(photo)}
                  className="relative bg-slate-900 flex items-center justify-center min-h-[190px] max-h-[260px] overflow-hidden cursor-pointer group"
                  title="Hacé clic para ver la imagen ampliada"
                >
                  {photo.signed_url ? (
                    <img
                      src={photo.signed_url}
                      alt="Foto de Pizarra"
                      className="w-full h-full object-cover max-h-[260px] group-hover:scale-105 transition-transform duration-300"
                    />
                  ) : (
                    <span className="text-4xl text-slate-500">📷</span>
                  )}

                  <div className="absolute inset-0 bg-black/30 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                    <span className="bg-white/90 text-slate-900 px-3 py-1.5 rounded-xl text-xs font-bold shadow-md">
                      🔍 Ver Ampliada
                    </span>
                  </div>

                  <button
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation()
                      handleDeletePhoto(photo.id, photo.photo_url)
                    }}
                    className="absolute top-3 right-3 rounded-full bg-slate-900/80 p-1.5 text-xs text-white hover:bg-rose-600 transition-colors cursor-pointer"
                    title="Eliminar foto"
                  >
                    <IconTrash className="w-3.5 h-3.5" />
                  </button>
                </div>

                {/* Contenido Transcrito OCR */}
                <div className="p-4 flex flex-col gap-3">
                  <div className="flex items-center justify-between text-xs text-slate-500">
                    <span className="font-semibold">📅 Clase del {photo.class_date}</span>
                    {hasValidOcr ? (
                      <span className="bg-emerald-50 text-emerald-700 border border-emerald-200/80 font-bold px-2 py-0.5 rounded-full text-[10px]">
                        🤖 Transcrito con IA
                      </span>
                    ) : (
                      <span className="bg-slate-100 text-slate-600 border border-slate-200 font-medium px-2 py-0.5 rounded-full text-[10px]">
                        🖼️ Foto guardada
                      </span>
                    )}
                  </div>

                  {/* Transcripción desplegable o botón de análisis a demanda */}
                  {hasValidOcr ? (
                    <div className="rounded-xl bg-slate-50 border border-slate-200/80 p-3.5 text-xs text-slate-800 flex flex-col gap-2">
                      <div className="flex items-center justify-between">
                        <span className="font-bold text-slate-900 flex items-center gap-1.5">
                          <IconClipboard className="w-3.5 h-3.5 text-indigo-600" />
                          Transcripción de apuntes:
                        </span>

                        <div className="flex items-center gap-2">
                          <button
                            type="button"
                            onClick={() => handleCopyTranscription(photo.id, photo.ocr_text || '')}
                            className="text-[10px] font-bold text-indigo-600 hover:text-indigo-800 transition-colors cursor-pointer"
                          >
                            {copiedPhotoId === photo.id ? '¡Copiado! ✓' : 'Copiar'}
                          </button>
                          <span className="text-slate-300">•</span>
                          <button
                            type="button"
                            onClick={() =>
                              setExpandedOcrId(
                                expandedOcrId === photo.id ? null : photo.id
                              )
                            }
                            className="text-[10px] font-bold text-slate-600 hover:text-slate-900 transition-colors cursor-pointer"
                          >
                            {expandedOcrId === photo.id ? 'Ver menos' : 'Ver todo'}
                          </button>
                        </div>
                      </div>

                      <p
                        className={`whitespace-pre-wrap leading-relaxed text-[11px] text-slate-700 font-sans select-text ${
                          expandedOcrId === photo.id ? '' : 'line-clamp-4'
                        }`}
                      >
                        {photo.ocr_text}
                      </p>

                      {/* Botón para consultar con el Tutor Socrático sobre esta pizarra */}
                      <div className="pt-2 border-t border-slate-200/60 flex items-center justify-between">
                        <Link
                          href={`/materias/${subjectId}/temas`}
                          className="text-[11px] font-bold text-indigo-600 hover:text-indigo-800 flex items-center gap-1 hover:underline"
                        >
                          <IconChat className="w-3.5 h-3.5" />
                          Consultar al Tutor sobre este tema
                        </Link>
                      </div>
                    </div>
                  ) : (
                    <button
                      type="button"
                      disabled={analyzingPhotoId === photo.id}
                      onClick={() => handleAnalyzeOnDemand(photo.id, photo.photo_url)}
                      className="w-full rounded-xl border border-dashed border-indigo-200 bg-indigo-50/50 p-2.5 text-xs font-bold text-indigo-700 hover:bg-indigo-100/70 transition-all flex items-center justify-center gap-1.5 disabled:opacity-50 cursor-pointer"
                    >
                      <IconSparkles className="w-3.5 h-3.5" />
                      {analyzingPhotoId === photo.id
                        ? 'Analizando con Gemini Vision...'
                        : 'Transcribir apuntes manuscritos con IA'}
                    </button>
                  )}
                </div>
              </div>
            )
          })}

          {photos.length === 0 && (
            <div className="col-span-full rounded-2xl border border-dashed border-slate-300 bg-white p-8 text-center">
              <p className="text-sm font-medium text-slate-600">No hay fotos de pizarrón subidas aún.</p>
              <p className="mt-1 text-xs text-slate-400">
                Subí una foto del pizarrón de clase para transcribir fórmulas, ejercicios y detectar fechas de examen.
              </p>
            </div>
          )}
        </div>
      </div>

      {/* MODAL DE ZOOM / LIGHTBOX DE LA IMAGEN */}
      {activeZoomPhoto && (
        <div
          className="fixed inset-0 z-[9999] flex items-center justify-center bg-slate-950/80 backdrop-blur-xs p-4 animate-in fade-in"
          onClick={() => setActiveZoomPhoto(null)}
        >
          <div
            className="w-full max-w-5xl rounded-3xl bg-white p-6 shadow-2xl border border-slate-200 flex flex-col md:flex-row gap-6 animate-in zoom-in-95 max-h-[90vh] overflow-y-auto"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Foto Ampliada */}
            <div className="md:w-1/2 flex flex-col gap-2">
              <div className="flex items-center justify-between pb-2 border-b border-slate-100">
                <span className="text-xs font-bold text-slate-800">
                  📷 Foto de Pizarra • {activeZoomPhoto.class_date}
                </span>
              </div>
              <div className="rounded-2xl overflow-hidden bg-slate-900 flex items-center justify-center">
                {activeZoomPhoto.signed_url && (
                  <img
                    src={activeZoomPhoto.signed_url}
                    alt="Pizarra ampliada"
                    className="w-full h-auto object-contain max-h-[70vh]"
                  />
                )}
              </div>
            </div>

            {/* Transcripción Lateral */}
            <div className="md:w-1/2 flex flex-col justify-between gap-4">
              <div className="flex flex-col gap-3">
                <div className="flex items-center justify-between pb-2 border-b border-slate-100">
                  <span className="text-xs font-bold text-indigo-700 uppercase tracking-wider flex items-center gap-1.5">
                    <IconSparkles className="w-4 h-4" />
                    Transcripción IA de Apuntes
                  </span>
                  <button
                    type="button"
                    onClick={() => setActiveZoomPhoto(null)}
                    className="rounded-xl bg-slate-100 p-1.5 text-slate-500 hover:bg-slate-200 text-xs font-bold cursor-pointer"
                  >
                    ✕
                  </button>
                </div>

                <div className="rounded-2xl bg-slate-50 border border-slate-200/80 p-4 text-xs leading-relaxed max-h-[55vh] overflow-y-auto font-sans select-text text-slate-800 whitespace-pre-wrap">
                  {activeZoomPhoto.ocr_text || 'No hay transcripción disponible para esta imagen.'}
                </div>
              </div>

              <div className="flex items-center justify-between pt-3 border-t border-slate-100 gap-2">
                <button
                  type="button"
                  onClick={() => handleCopyTranscription(activeZoomPhoto.id, activeZoomPhoto.ocr_text || '')}
                  className="rounded-xl border border-indigo-200 bg-indigo-50 px-4 py-2 text-xs font-bold text-indigo-700 hover:bg-indigo-100 transition-colors flex items-center gap-1.5 cursor-pointer shadow-2xs"
                >
                  <IconClipboard className="w-3.5 h-3.5" />
                  {copiedPhotoId === activeZoomPhoto.id ? '¡Copiado! ✓' : 'Copiar Texto'}
                </button>

                <button
                  type="button"
                  onClick={() => setActiveZoomPhoto(null)}
                  className="rounded-xl bg-slate-900 px-4 py-2 text-xs font-bold text-white hover:bg-slate-800 transition-colors cursor-pointer"
                >
                  Cerrar
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
