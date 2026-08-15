'use client'

import { useState } from 'react'
import {
  uploadBoardPhotoAction,
  confirmDetectedEventAction,
  deleteBoardPhotoAction,
  analyzePhotoOnDemandAction,
} from './actions'

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
  const [uploadMode, setUploadMode] = useState<'normal' | 'ocr'>('normal')
  const [confirmingId, setConfirmingId] = useState<string | null>(null)
  const [analyzingPhotoId, setAnalyzingPhotoId] = useState<string | null>(null)
  const [expandedOcrId, setExpandedOcrId] = useState<string | null>(null)

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

  return (
    <div className="flex flex-col gap-6">
      {/* SECCIÓN 1: PROPUESTAS DE EVENTOS DETECTADOS POR IA (REGLA 7) */}
      {pendingEvents.length > 0 && (
        <div className="rounded-3xl border border-amber-300 bg-amber-50/90 p-5 text-amber-950 shadow-sm flex flex-col gap-3">
          <div className="flex items-center gap-2.5">
            <span className="flex h-8 w-8 items-center justify-center rounded-xl bg-amber-500 text-white font-bold text-base shrink-0">
              🤖
            </span>
            <div>
              <h3 className="text-xs sm:text-sm font-bold">
                Eventos Detectados en Pizarrón por IA (Pendientes de Confirmación)
              </h3>
              <p className="text-[11px] text-amber-800 mt-0.5">
                Regla de Seguridad: La IA únicamente propone las fechas anotadas en la pizarra. Hacé clic en "Confirmar y Agendar" para añadirlo a tu calendario con su plan de estudio.
              </p>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3 mt-1">
            {pendingEvents.map((evt) => (
              <div
                key={evt.id}
                className="rounded-2xl border border-amber-300/80 bg-white p-3.5 shadow-2xs flex flex-col justify-between gap-3"
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
                  <p className="text-xs text-slate-600">
                    📅 Fecha anotada:{' '}
                    <span className="font-bold text-slate-900">
                      {evt.suggested_date || 'Sin fecha precisa'}
                    </span>
                  </p>
                </div>

                <button
                  type="button"
                  disabled={confirmingId === evt.id}
                  onClick={() => handleConfirmEvent(evt)}
                  className="w-full rounded-xl bg-amber-500 px-3 py-2 text-xs font-bold text-white shadow-2xs hover:bg-amber-600 transition-all disabled:opacity-50"
                >
                  {confirmingId === evt.id
                    ? 'Agendando...'
                    : '✓ Confirmar y Agendar en Calendario'}
                </button>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* SECCIÓN 2: FORMULARIO DE SUBIDA DE FOTO DE PIZARRA */}
      <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
        <div className="mb-4">
          <h2 className="text-sm font-bold text-slate-900">
            📷 Subir foto de pizarrón de clase
          </h2>
          <p className="text-xs text-slate-500 mt-0.5">
            Podés guardar la foto directamente en tu galería o pedirle a la IA Gemini Vision que transcriba los apuntes manuscritos y busque fechas de examen.
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
              className="w-full sm:w-auto rounded-xl border border-slate-200 px-3 py-2 text-xs bg-slate-50 focus:bg-white text-slate-700 focus:outline-none"
              title="Fecha de la clase"
            />
          </div>

          <div className="flex flex-wrap items-center justify-end gap-2 pt-1 border-t border-slate-100">
            <button
              type="submit"
              onClick={() => setUploadMode('normal')}
              disabled={uploading}
              className="rounded-xl border border-slate-300 bg-white px-4 py-2.5 text-xs font-semibold text-slate-700 hover:bg-slate-50 transition-all disabled:opacity-50"
            >
              {uploading && uploadMode === 'normal'
                ? 'Guardando...'
                : '📷 Solo Guardar Foto (Sin OCR)'}
            </button>

            <button
              type="submit"
              onClick={() => setUploadMode('ocr')}
              disabled={uploading}
              className="rounded-xl bg-indigo-600 px-5 py-2.5 text-xs font-semibold text-white shadow-xs hover:bg-indigo-700 transition-all disabled:opacity-50"
            >
              {uploading && uploadMode === 'ocr'
                ? 'Procesando con Gemini Vision...'
                : '🤖 Subir y Analizar con IA'}
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
                className="rounded-3xl border border-slate-200 bg-white overflow-hidden shadow-sm flex flex-col"
              >
                {/* Encabezado con imagen o vista previa */}
                <div className="relative bg-slate-900 flex items-center justify-center min-h-[180px] max-h-[260px] overflow-hidden">
                  {photo.signed_url ? (
                    <img
                      src={photo.signed_url}
                      alt="Foto de Pizarra"
                      className="w-full h-full object-cover max-h-[260px]"
                    />
                  ) : (
                    <span className="text-4xl text-slate-500">📷</span>
                  )}

                  <button
                    type="button"
                    onClick={() => handleDeletePhoto(photo.id, photo.photo_url)}
                    className="absolute top-3 right-3 rounded-full bg-slate-900/80 p-1.5 text-xs text-white hover:bg-rose-600 transition-colors"
                    title="Eliminar foto"
                  >
                    🗑️
                  </button>
                </div>

                {/* Contenido Transcrito OCR */}
                <div className="p-4 flex flex-col gap-3">
                  <div className="flex items-center justify-between text-xs text-slate-500">
                    <span>📅 Clase del {photo.class_date}</span>
                    {hasValidOcr ? (
                      <span className="bg-emerald-50 text-emerald-700 border border-emerald-200 font-semibold px-2 py-0.5 rounded-full text-[10px]">
                        🤖 Transcrito con IA
                      </span>
                    ) : (
                      <span className="bg-slate-100 text-slate-600 border border-slate-200 font-semibold px-2 py-0.5 rounded-full text-[10px]">
                        🖼️ Foto guardada
                      </span>
                    )}
                  </div>

                  {/* Transcripción desplegable o botón de análisis a demanda */}
                  {hasValidOcr ? (
                    <div className="rounded-2xl bg-slate-50 border border-slate-200/80 p-3 text-xs text-slate-800">
                      <div className="flex items-center justify-between mb-1">
                        <span className="font-bold text-slate-900">
                          📝 Transcripción de apuntes:
                        </span>
                        <button
                          type="button"
                          onClick={() =>
                            setExpandedOcrId(
                              expandedOcrId === photo.id ? null : photo.id
                            )
                          }
                          className="text-[10px] font-semibold text-indigo-600 hover:text-indigo-800"
                        >
                          {expandedOcrId === photo.id ? 'Ver menos' : 'Ver completo'}
                        </button>
                      </div>

                      <p
                        className={`whitespace-pre-wrap leading-relaxed text-[11px] text-slate-700 ${
                          expandedOcrId === photo.id ? '' : 'line-clamp-3'
                        }`}
                      >
                        {photo.ocr_text}
                      </p>
                    </div>
                  ) : (
                    <button
                      type="button"
                      disabled={analyzingPhotoId === photo.id}
                      onClick={() => handleAnalyzeOnDemand(photo.id, photo.photo_url)}
                      className="w-full rounded-2xl border border-dashed border-indigo-200 bg-indigo-50/50 p-2.5 text-xs font-semibold text-indigo-700 hover:bg-indigo-100/70 transition-all flex items-center justify-center gap-1.5 disabled:opacity-50"
                    >
                      <span>🤖</span>
                      {analyzingPhotoId === photo.id
                        ? 'Analizando con Gemini Vision...'
                        : 'Analizar apuntes manuscritos con IA'}
                    </button>
                  )}
                </div>
              </div>
            )
          })}

          {photos.length === 0 && (
            <div className="col-span-full rounded-3xl border border-dashed border-slate-300 bg-white p-8 text-center">
              <p className="text-sm font-medium text-slate-600">No hay fotos de pizarrón subidas aún.</p>
              <p className="mt-1 text-xs text-slate-400">
                Subí una foto del pizarrón para guardarla o que la IA transcriba apuntes manuscritos y fechas.
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
