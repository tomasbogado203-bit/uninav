'use client'

import { useState, useRef, useEffect, useCallback } from 'react'
import {
  IconPencil,
  IconHighlighter,
  IconEraser,
  IconUndo,
  IconRedo,
  IconZoomIn,
  IconZoomOut,
  IconDownload,
  IconSparkles,
  IconTrash,
  IconCheck,
  IconClose,
  IconCamera,
  IconChevronDown,
} from '@/components/icons'
import { saveAnnotatedBoardAction } from './actions'

interface BoardCanvasAnnotatorProps {
  subjectId: string
  subjectName?: string
  initialImageUrl?: string | null
  onClose?: () => void
}

type ToolType = 'pen' | 'highlighter' | 'eraser'
type BackgroundType = 'blackboard' | 'grid' | 'white' | 'custom'

interface Point {
  x: number
  y: number
}

interface Stroke {
  tool: ToolType
  color: string
  size: number
  points: Point[]
}

const COLOR_PALETTE = [
  { name: 'Negro', value: '#0f172a' },
  { name: 'Gris Grafito', value: '#64748b' },
  { name: 'Blanco Tiza', value: '#ffffff' },
  { name: 'Rojo Alerta', value: '#e11d48' },
  { name: 'Amarillo Flúor', value: '#f59e0b' },
  { name: 'Verde Esmeralda', value: '#10b981' },
  { name: 'Azul Índigo', value: '#6366f1' },
  { name: 'Celeste Cian', value: '#0284c7' },
  { name: 'Púrpura', value: '#8b5cf6' },
  { name: 'Naranja', value: '#f97316' },
]

const STROKE_SIZES = [
  { label: 'Fino', size: 2, dotSize: 'h-1.5 w-1.5' },
  { label: 'Normal', size: 4, dotSize: 'h-2.5 w-2.5' },
  { label: 'Medio', size: 8, dotSize: 'h-3.5 w-3.5' },
  { label: 'Grueso', size: 16, dotSize: 'h-5 w-5' },
]

export default function BoardCanvasAnnotator({
  subjectId,
  subjectName = 'Materia',
  initialImageUrl,
  onClose,
}: BoardCanvasAnnotatorProps) {
  const canvasRef = useRef<HTMLCanvasElement | null>(null)
  const containerRef = useRef<HTMLDivElement | null>(null)

  // Estados de herramienta
  const [currentTool, setCurrentTool] = useState<ToolType>('pen')
  const [selectedColor, setSelectedColor] = useState<string>('#6366f1')
  const [selectedSize, setSelectedSize] = useState<number>(4)
  const [backgroundType, setBackgroundType] = useState<BackgroundType>(
    initialImageUrl ? 'custom' : 'grid'
  )
  const [backgroundImage, setBackgroundImage] = useState<HTMLImageElement | null>(null)
  const [zoomLevel, setZoomLevel] = useState<number>(1)
  const [boardTitle, setBoardTitle] = useState<string>('Apunte de Pizarra')

  // Historial de trazos para Undo / Redo
  const [strokes, setStrokes] = useState<Stroke[]>([])
  const [redoStack, setRedoStack] = useState<Stroke[]>([])
  const isDrawingRef = useRef(false)
  const currentStrokeRef = useRef<Stroke | null>(null)

  // Guardado
  const [savingToCloud, setSavingToCloud] = useState(false)
  const [saveSuccess, setSaveSuccess] = useState(false)
  const [showExportMenu, setShowExportMenu] = useState(false)

  // Cargar imagen de fondo inicial si existe
  useEffect(() => {
    if (initialImageUrl) {
      const img = new Image()
      img.crossOrigin = 'anonymous'
      img.src = initialImageUrl
      img.onload = () => {
        setBackgroundImage(img)
        setBackgroundType('custom')
      }
    }
  }, [initialImageUrl])

  // Ajustar tamaño del Canvas con soporte High-DPI (Retina)
  const updateCanvasDimensions = useCallback(() => {
    const canvas = canvasRef.current
    const container = containerRef.current
    if (!canvas || !container) return

    const dpr = window.devicePixelRatio || 1
    const width = container.clientWidth || 900
    const height = Math.max(540, Math.min(800, window.innerHeight - 260))

    canvas.width = width * dpr
    canvas.height = height * dpr
    canvas.style.width = `${width}px`
    canvas.style.height = `${height}px`

    redrawCanvas()
  }, [])

  useEffect(() => {
    updateCanvasDimensions()
    window.addEventListener('resize', updateCanvasDimensions)
    return () => window.removeEventListener('resize', updateCanvasDimensions)
  }, [updateCanvasDimensions])

  // Función principal de redibujado completo
  const redrawCanvas = useCallback(() => {
    const canvas = canvasRef.current
    if (!canvas) return
    const ctx = canvas.getContext('2d')
    if (!ctx) return

    const dpr = window.devicePixelRatio || 1
    const width = canvas.width / dpr
    const height = canvas.height / dpr

    ctx.save()
    ctx.scale(dpr, dpr)
    ctx.clearRect(0, 0, width, height)

    // 1. Dibujar Fondo
    if (backgroundType === 'blackboard') {
      // Pizarra oscura
      ctx.fillStyle = '#0f172a'
      ctx.fillRect(0, 0, width, height)
      // Cuadrícula sutil de tiza
      ctx.strokeStyle = '#1e293b'
      ctx.lineWidth = 1
      const gridSize = 30
      ctx.beginPath()
      for (let x = 0; x < width; x += gridSize) {
        ctx.moveTo(x, 0)
        ctx.lineTo(x, height)
      }
      for (let y = 0; y < height; y += gridSize) {
        ctx.moveTo(0, y)
        ctx.lineTo(width, y)
      }
      ctx.stroke()
    } else if (backgroundType === 'grid') {
      // Papel cuadriculado matemático
      ctx.fillStyle = '#f8fafc'
      ctx.fillRect(0, 0, width, height)
      ctx.strokeStyle = '#e2e8f0'
      ctx.lineWidth = 1
      const gridSize = 24
      ctx.beginPath()
      for (let x = 0; x < width; x += gridSize) {
        ctx.moveTo(x, 0)
        ctx.lineTo(x, height)
      }
      for (let y = 0; y < height; y += gridSize) {
        ctx.moveTo(0, y)
        ctx.lineTo(width, y)
      }
      ctx.stroke()
    } else if (backgroundType === 'white') {
      // Hoja blanca lisa
      ctx.fillStyle = '#ffffff'
      ctx.fillRect(0, 0, width, height)
    } else if (backgroundType === 'custom' && backgroundImage) {
      // Imagen de pizarra o documento cargado
      ctx.fillStyle = '#0f172a'
      ctx.fillRect(0, 0, width, height)

      // Escalar imagen manteniendo aspect ratio
      const imgRatio = backgroundImage.width / backgroundImage.height
      const canvasRatio = width / height
      let drawW = width
      let drawH = height
      let drawX = 0
      let drawY = 0

      if (imgRatio > canvasRatio) {
        drawH = width / imgRatio
        drawY = (height - drawH) / 2
      } else {
        drawW = height * imgRatio
        drawX = (width - drawW) / 2
      }

      ctx.drawImage(backgroundImage, drawX, drawY, drawW, drawH)
    }

    // 2. Dibujar todos los trazos almacenados
    const allStrokes = currentStrokeRef.current
      ? [...strokes, currentStrokeRef.current]
      : strokes

    allStrokes.forEach((stroke) => {
      if (stroke.points.length === 0) return

      ctx.save()
      ctx.lineCap = 'round'
      ctx.lineJoin = 'round'

      if (stroke.tool === 'highlighter') {
        ctx.globalAlpha = 0.35
        ctx.strokeStyle = stroke.color
        ctx.lineWidth = stroke.size * 2.5
      } else if (stroke.tool === 'eraser') {
        ctx.globalCompositeOperation =
          backgroundType === 'custom' ? 'destination-out' : 'source-over'
        ctx.strokeStyle =
          backgroundType === 'blackboard'
            ? '#0f172a'
            : backgroundType === 'grid'
            ? '#f8fafc'
            : '#ffffff'
        ctx.lineWidth = stroke.size * 3
      } else {
        ctx.globalAlpha = 1.0
        ctx.strokeStyle = stroke.color
        ctx.lineWidth = stroke.size
      }

      ctx.beginPath()
      if (stroke.points.length === 1) {
        ctx.arc(stroke.points[0].x, stroke.points[0].y, stroke.size / 2, 0, Math.PI * 2)
        ctx.fillStyle = stroke.color
        ctx.fill()
      } else {
        ctx.moveTo(stroke.points[0].x, stroke.points[0].y)
        for (let i = 1; i < stroke.points.length - 1; i++) {
          const midX = (stroke.points[i].x + stroke.points[i + 1].x) / 2
          const midY = (stroke.points[i].y + stroke.points[i + 1].y) / 2
          ctx.quadraticCurveTo(stroke.points[i].x, stroke.points[i].y, midX, midY)
        }
        const lastPoint = stroke.points[stroke.points.length - 1]
        ctx.lineTo(lastPoint.x, lastPoint.y)
        ctx.stroke()
      }
      ctx.restore()
    })

    ctx.restore()
  }, [backgroundType, backgroundImage, strokes])

  useEffect(() => {
    redrawCanvas()
  }, [redrawCanvas])

  // Obtener coordenadas relativas al Canvas
  const getCanvasPoint = (e: React.PointerEvent<HTMLCanvasElement>): Point => {
    const canvas = canvasRef.current
    if (!canvas) return { x: 0, y: 0 }
    const rect = canvas.getBoundingClientRect()
    return {
      x: (e.clientX - rect.left) / zoomLevel,
      y: (e.clientY - rect.top) / zoomLevel,
    }
  }

  // Manejo de eventos de puntero (Mouse, Touch y Lápiz óptico)
  const handlePointerDown = (e: React.PointerEvent<HTMLCanvasElement>) => {
    e.currentTarget.setPointerCapture(e.pointerId)
    isDrawingRef.current = true
    const point = getCanvasPoint(e)

    // Si el fondo es oscuro y el color es negro, cambiar a blanco automáticamente
    const effectiveColor =
      backgroundType === 'blackboard' && selectedColor === '#0f172a'
        ? '#ffffff'
        : selectedColor

    currentStrokeRef.current = {
      tool: currentTool,
      color: effectiveColor,
      size: selectedSize,
      points: [point],
    }

    redrawCanvas()
  }

  const handlePointerMove = (e: React.PointerEvent<HTMLCanvasElement>) => {
    if (!isDrawingRef.current || !currentStrokeRef.current) return
    const point = getCanvasPoint(e)
    currentStrokeRef.current.points.push(point)
    redrawCanvas()
  }

  const handlePointerUp = (e: React.PointerEvent<HTMLCanvasElement>) => {
    if (!isDrawingRef.current || !currentStrokeRef.current) return
    isDrawingRef.current = false
    try {
      e.currentTarget.releasePointerCapture(e.pointerId)
    } catch {}

    const completedStroke = currentStrokeRef.current
    currentStrokeRef.current = null

    setStrokes((prev) => [...prev, completedStroke])
    setRedoStack([]) // Limpiar pila de rehacer al crear un nuevo trazo
  }

  // Operaciones de Deshacer / Rehacer
  const handleUndo = () => {
    if (strokes.length === 0) return
    const last = strokes[strokes.length - 1]
    setStrokes((prev) => prev.slice(0, -1))
    setRedoStack((prev) => [last, ...prev])
  }

  const handleRedo = () => {
    if (redoStack.length === 0) return
    const next = redoStack[0]
    setRedoStack((prev) => prev.slice(1))
    setStrokes((prev) => [...prev, next])
  }

  const handleClear = () => {
    if (!confirm('¿Deseas limpiar todos los trazos y anotaciones de la pizarra?')) return
    setStrokes([])
    setRedoStack([])
    currentStrokeRef.current = null
    redrawCanvas()
  }

  // Cargar imagen personalizada local desde archivo
  const handleLoadCustomImage = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return
    const reader = new FileReader()
    reader.onload = (event) => {
      const img = new Image()
      img.src = event.target?.result as string
      img.onload = () => {
        setBackgroundImage(img)
        setBackgroundType('custom')
        setBoardTitle(file.name.replace(/\.[^/.]+$/, ''))
      }
    }
    reader.readAsDataURL(file)
  }

  // Exportar imagen con anotaciones a PNG
  const handleDownloadImage = () => {
    const canvas = canvasRef.current
    if (!canvas) return
    const dataUrl = canvas.toDataURL('image/png')
    const link = document.createElement('a')
    link.download = `${boardTitle.replace(/[^a-zA-Z0-9_-]/g, '_')}_Anotada.png`
    link.href = dataUrl
    link.click()
    setShowExportMenu(false)
  }

  // Guardar en la galería de la materia en Supabase
  const handleSaveToCloud = async () => {
    const canvas = canvasRef.current
    if (!canvas) return
    setSavingToCloud(true)
    setShowExportMenu(false)

    try {
      const dataUrl = canvas.toDataURL('image/png')
      await saveAnnotatedBoardAction(subjectId, dataUrl, boardTitle)
      setSaveSuccess(true)
      setTimeout(() => setSaveSuccess(false), 3000)
    } catch (err) {
      alert(err instanceof Error ? err.message : 'Error al guardar la pizarra en la nube.')
    } finally {
      setSavingToCloud(false)
    }
  }

  return (
    <div className="flex flex-col rounded-3xl border border-slate-200/90 bg-white shadow-md overflow-hidden select-none animate-in fade-in">
      {/* ─────────────────────────────────────────────────────────────
          1. BARRA SUPERIOR DE CONTROL (ESTILO GOOGLE CHROME ANNOTATOR)
      ───────────────────────────────────────────────────────────── */}
      <div className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-200/80 bg-slate-900 px-4 sm:px-6 py-3 text-white">
        {/* Herramientas de Dibujo (Pluma, Resaltador, Goma) */}
        <div className="flex items-center gap-1.5 bg-slate-800/90 p-1 rounded-2xl border border-slate-700/80">
          <button
            type="button"
            onClick={() => setCurrentTool('pen')}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
              currentTool === 'pen'
                ? 'bg-indigo-600 text-white shadow-xs'
                : 'text-slate-300 hover:text-white hover:bg-slate-700/60'
            }`}
            title="Pluma para escritura y trazo libre"
          >
            <IconPencil className="w-3.5 h-3.5" />
            <span>Pluma</span>
          </button>

          <button
            type="button"
            onClick={() => setCurrentTool('highlighter')}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
              currentTool === 'highlighter'
                ? 'bg-amber-500 text-slate-950 shadow-xs'
                : 'text-slate-300 hover:text-white hover:bg-slate-700/60'
            }`}
            title="Resaltador semitransparente flúor"
          >
            <IconHighlighter className="w-3.5 h-3.5" />
            <span>Resaltador</span>
          </button>

          <button
            type="button"
            onClick={() => setCurrentTool('eraser')}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
              currentTool === 'eraser'
                ? 'bg-rose-500 text-white shadow-xs'
                : 'text-slate-300 hover:text-white hover:bg-slate-700/60'
            }`}
            title="Goma de borrar trazos"
          >
            <IconEraser className="w-3.5 h-3.5" />
            <span>Borrar</span>
          </button>
        </div>

        {/* Selector de Grosor de Trazo */}
        <div className="flex items-center gap-1 bg-slate-800/90 px-2 py-1 rounded-2xl border border-slate-700/80">
          <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mr-1 hidden sm:inline">
            Grosor:
          </span>
          {STROKE_SIZES.map((s) => (
            <button
              key={s.size}
              type="button"
              onClick={() => setSelectedSize(s.size)}
              className={`flex h-7 w-7 items-center justify-center rounded-xl transition-all cursor-pointer ${
                selectedSize === s.size
                  ? 'bg-indigo-600 text-white ring-2 ring-indigo-400/50'
                  : 'text-slate-400 hover:text-white hover:bg-slate-700'
              }`}
              title={`Grosor ${s.label} (${s.size}px)`}
            >
              <span
                className={`rounded-full bg-current ${s.dotSize}`}
                style={{ width: `${Math.min(16, s.size * 1.4)}px`, height: `${Math.min(16, s.size * 1.4)}px` }}
              />
            </button>
          ))}
        </div>

        {/* Deshacer / Rehacer / Limpiar */}
        <div className="flex items-center gap-1">
          <button
            type="button"
            disabled={strokes.length === 0}
            onClick={handleUndo}
            className="p-2 rounded-xl bg-slate-800 text-slate-300 hover:text-white hover:bg-slate-700 disabled:opacity-40 transition-colors cursor-pointer"
            title="Deshacer (Ctrl + Z)"
          >
            <IconUndo className="w-3.5 h-3.5" />
          </button>

          <button
            type="button"
            disabled={redoStack.length === 0}
            onClick={handleRedo}
            className="p-2 rounded-xl bg-slate-800 text-slate-300 hover:text-white hover:bg-slate-700 disabled:opacity-40 transition-colors cursor-pointer"
            title="Rehacer (Ctrl + Y)"
          >
            <IconRedo className="w-3.5 h-3.5" />
          </button>

          <button
            type="button"
            disabled={strokes.length === 0}
            onClick={handleClear}
            className="p-2 rounded-xl bg-slate-800 text-slate-400 hover:text-rose-400 hover:bg-rose-950/50 disabled:opacity-40 transition-colors cursor-pointer"
            title="Limpiar pizarra completa"
          >
            <IconTrash className="w-3.5 h-3.5" />
          </button>
        </div>

        {/* Menú de Exportación y Guardado */}
        <div className="relative flex items-center gap-2">
          {saveSuccess && (
            <span className="text-xs font-bold text-emerald-400 flex items-center gap-1 animate-in fade-in">
              <IconCheck className="w-4 h-4" />
              <span>¡Guardado!</span>
            </span>
          )}

          <div className="relative">
            <button
              type="button"
              disabled={savingToCloud}
              onClick={() => setShowExportMenu(!showExportMenu)}
              className="flex items-center gap-2 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white px-4 py-2 text-xs font-bold shadow-xs transition-all cursor-pointer"
            >
              {savingToCloud ? (
                <>
                  <span className="h-3.5 w-3.5 rounded-full border-2 border-white border-t-transparent animate-spin" />
                  <span>Guardando...</span>
                </>
              ) : (
                <>
                  <IconDownload className="w-3.5 h-3.5" />
                  <span>Guardar / Exportar</span>
                  <IconChevronDown className="w-3 h-3 text-indigo-200" />
                </>
              )}
            </button>

            {/* Dropdown de Opciones de Guardado */}
            {showExportMenu && (
              <div
                className="absolute right-0 top-full mt-2 w-64 rounded-2xl border border-slate-700 bg-slate-900/98 backdrop-blur-md p-2 text-white shadow-2xl z-50 animate-in zoom-in-95 flex flex-col gap-1 text-xs"
                onClick={(e) => e.stopPropagation()}
              >
                <button
                  type="button"
                  onClick={handleDownloadImage}
                  className="flex items-center gap-2.5 rounded-xl px-3 py-2.5 font-bold hover:bg-slate-800 text-left transition-colors cursor-pointer"
                >
                  <IconDownload className="w-4 h-4 text-indigo-400 shrink-0" />
                  <div className="flex flex-col">
                    <span>Descargar con mis cambios</span>
                    <span className="text-[10px] text-slate-400 font-normal">
                      Guarda archivo PNG en tu computadora
                    </span>
                  </div>
                </button>

                <button
                  type="button"
                  onClick={handleSaveToCloud}
                  className="flex items-center gap-2.5 rounded-xl px-3 py-2.5 font-bold hover:bg-slate-800 text-left transition-colors cursor-pointer border-t border-slate-800"
                >
                  <IconSparkles className="w-4 h-4 text-emerald-400 shrink-0" />
                  <div className="flex flex-col">
                    <span>Guardar en Galería de la Materia</span>
                    <span className="text-[10px] text-slate-400 font-normal">
                      Sube a la biblioteca de {subjectName}
                    </span>
                  </div>
                </button>
              </div>
            )}
          </div>

          {onClose && (
            <button
              type="button"
              onClick={onClose}
              className="p-2 rounded-xl bg-slate-800 text-slate-400 hover:text-white hover:bg-slate-700 transition-colors cursor-pointer"
              title="Cerrar lienzo"
            >
              <IconClose className="w-4 h-4" />
            </button>
          )}
        </div>
      </div>

      {/* ─────────────────────────────────────────────────────────────
          2. BARRA DE PALETA CROMÁTICA & FONDOS DE PIZARRA
      ───────────────────────────────────────────────────────────── */}
      <div className="flex flex-wrap items-center justify-between gap-4 border-b border-slate-200/80 bg-slate-50 px-4 sm:px-6 py-2.5 text-xs text-slate-700">
        {/* Paleta de Círculos de Color (Estilo Chrome PDF) */}
        <div className="flex items-center gap-2 flex-wrap">
          <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider mr-1">
            Color:
          </span>
          <div className="flex items-center gap-1.5 flex-wrap">
            {COLOR_PALETTE.map((c) => {
              const isSelected = selectedColor === c.value
              return (
                <button
                  key={c.value}
                  type="button"
                  onClick={() => setSelectedColor(c.value)}
                  style={{ backgroundColor: c.value }}
                  className={`h-6 w-6 rounded-full border transition-all cursor-pointer shadow-2xs ${
                    isSelected
                      ? 'ring-2 ring-indigo-600 ring-offset-2 scale-110 border-slate-400'
                      : 'border-slate-300 hover:scale-105'
                  }`}
                  title={c.name}
                />
              )
            })}
          </div>
        </div>

        {/* Selector de Fondos de Pizarra */}
        <div className="flex items-center gap-1.5 flex-wrap">
          <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider mr-1">
            Fondo:
          </span>

          <button
            type="button"
            onClick={() => setBackgroundType('grid')}
            className={`px-3 py-1 rounded-xl text-xs font-semibold transition-all cursor-pointer border ${
              backgroundType === 'grid'
                ? 'bg-indigo-600 text-white border-indigo-600 shadow-2xs font-bold'
                : 'bg-white text-slate-700 border-slate-200 hover:bg-slate-100'
            }`}
          >
            Cuadriculada
          </button>

          <button
            type="button"
            onClick={() => setBackgroundType('blackboard')}
            className={`px-3 py-1 rounded-xl text-xs font-semibold transition-all cursor-pointer border ${
              backgroundType === 'blackboard'
                ? 'bg-slate-900 text-white border-slate-900 shadow-2xs font-bold'
                : 'bg-white text-slate-700 border-slate-200 hover:bg-slate-100'
            }`}
          >
            Pizarrón Oscuro
          </button>

          <button
            type="button"
            onClick={() => setBackgroundType('white')}
            className={`px-3 py-1 rounded-xl text-xs font-semibold transition-all cursor-pointer border ${
              backgroundType === 'white'
                ? 'bg-indigo-600 text-white border-indigo-600 shadow-2xs font-bold'
                : 'bg-white text-slate-700 border-slate-200 hover:bg-slate-100'
            }`}
          >
            Hoja Blanca
          </button>

          {/* Botón para cargar cualquier foto o documento para anotar */}
          <label className="px-3 py-1 rounded-xl text-xs font-semibold bg-white text-indigo-700 border border-indigo-200 hover:bg-indigo-50 transition-all cursor-pointer flex items-center gap-1 shadow-2xs">
            <IconCamera className="w-3.5 h-3.5 text-indigo-600" />
            <span>Cargar Foto / PDF</span>
            <input
              type="file"
              accept="image/*,application/pdf"
              className="hidden"
              onChange={handleLoadCustomImage}
            />
          </label>
        </div>
      </div>

      {/* ─────────────────────────────────────────────────────────────
          3. ÁREA DE LIENZO DE DIBUJO Y ANOTACIONES EN VIVO
      ───────────────────────────────────────────────────────────── */}
      <div
        ref={containerRef}
        className="relative flex-1 w-full bg-slate-950 flex items-center justify-center p-2 sm:p-4 overflow-hidden min-h-[480px] max-h-[700px]"
      >
        <div
          style={{ transform: `scale(${zoomLevel})`, transformOrigin: 'center center' }}
          className="transition-transform duration-150 flex items-center justify-center shadow-2xl rounded-2xl overflow-hidden"
        >
          <canvas
            ref={canvasRef}
            onPointerDown={handlePointerDown}
            onPointerMove={handlePointerMove}
            onPointerUp={handlePointerUp}
            onPointerCancel={handlePointerUp}
            className="touch-none cursor-crosshair rounded-2xl block"
          />
        </div>

        {/* Controles Flotantes de Zoom */}
        <div className="absolute bottom-4 right-4 flex items-center gap-1 bg-slate-900/90 backdrop-blur-md px-2.5 py-1.5 rounded-2xl border border-slate-700 text-white text-xs shadow-xl">
          <button
            type="button"
            onClick={() => setZoomLevel((z) => Math.max(0.6, Number((z - 0.15).toFixed(2))))}
            className="p-1 hover:bg-slate-800 rounded-lg transition-colors cursor-pointer"
            title="Reducir zoom"
          >
            <IconZoomOut className="w-3.5 h-3.5" />
          </button>
          <span className="font-mono text-[11px] font-bold px-1 min-w-[42px] text-center">
            {Math.round(zoomLevel * 100)}%
          </span>
          <button
            type="button"
            onClick={() => setZoomLevel((z) => Math.min(2.5, Number((z + 0.15).toFixed(2))))}
            className="p-1 hover:bg-slate-800 rounded-lg transition-colors cursor-pointer"
            title="Aumentar zoom"
          >
            <IconZoomIn className="w-3.5 h-3.5" />
          </button>
          <button
            type="button"
            onClick={() => setZoomLevel(1)}
            className="text-[10px] font-bold text-slate-400 hover:text-indigo-300 ml-1 px-1 transition-colors cursor-pointer"
            title="Restablecer al 100%"
          >
            100%
          </button>
        </div>

        {/* Indicador de Ayuda para el Estudiante */}
        <div className="absolute bottom-4 left-4 hidden sm:flex items-center gap-2 bg-slate-900/80 backdrop-blur-md px-3 py-1.5 rounded-2xl border border-slate-700 text-slate-300 text-[11px] shadow-lg">
          <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
          <span>Lienzo Activo • Anotá fórmulas, firmá y resaltá a mano alzada</span>
        </div>
      </div>
    </div>
  )
}
