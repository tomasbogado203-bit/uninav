'use client'

import { useEffect, useRef, useState } from 'react'

interface MermaidDiagramProps {
  chart: string
}

export default function MermaidDiagram({ chart }: MermaidDiagramProps) {
  const containerRef = useRef<HTMLDivElement>(null)
  const [svgContent, setSvgContent] = useState<string>('')
  const [error, setError] = useState<string | null>(null)
  const [showCode, setShowCode] = useState(false)
  const [copied, setCopied] = useState(false)

  useEffect(() => {
    let isMounted = true

    async function renderChart() {
      if (!chart || !chart.trim()) return

      try {
        setError(null)
        // Carga dinámica de Mermaid client-side
        const mermaid = (await import('mermaid')).default

        mermaid.initialize({
          startOnLoad: false,
          theme: 'neutral',
          securityLevel: 'loose',
          fontFamily: 'ui-sans-serif, system-ui, sans-serif',
        })

        const id = `mermaid-svg-${Math.random().toString(36).substring(2, 9)}`
        const { svg } = await mermaid.render(id, chart.trim())

        if (isMounted) {
          setSvgContent(svg)
        }
      } catch (err) {
        if (isMounted) {
          console.error('Error renderizando Mermaid SVG:', err)
          setError(
            err instanceof Error
              ? err.message
              : 'Error al renderizar el diagrama Mermaid.'
          )
        }
      }
    }

    renderChart()

    return () => {
      isMounted = false
    }
  }, [chart])

  const handleCopyCode = () => {
    navigator.clipboard.writeText(chart)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  return (
    <div className="my-3 rounded-2xl border border-indigo-200/80 bg-white p-4 shadow-sm flex flex-col gap-3">
      {/* Encabezado del Diagrama */}
      <div className="flex items-center justify-between border-b border-slate-100 pb-2.5">
        <div className="flex items-center gap-2">
          <span className="flex h-6 w-6 items-center justify-center rounded-lg bg-indigo-100 text-indigo-700 font-bold text-xs">
            📊
          </span>
          <span className="text-xs font-bold text-slate-800 tracking-tight">
            Esquema Conceptual (Mermaid.js)
          </span>
        </div>

        <div className="flex items-center gap-1.5">
          <button
            type="button"
            onClick={() => setShowCode(!showCode)}
            className="rounded-lg border border-slate-200 bg-slate-50 px-2.5 py-1 text-[10px] font-semibold text-slate-600 hover:bg-slate-100 transition-colors"
          >
            {showCode ? 'Ver gráfico' : 'Ver código'}
          </button>
          <button
            type="button"
            onClick={handleCopyCode}
            className="rounded-lg bg-indigo-50 border border-indigo-100 px-2.5 py-1 text-[10px] font-semibold text-indigo-700 hover:bg-indigo-100 transition-colors"
          >
            {copied ? '✓ Copiado' : 'Copiar Mermaid'}
          </button>
        </div>
      </div>

      {/* Renderizado SVG o Vista de Código */}
      {showCode ? (
        <pre className="p-3 bg-slate-900 text-slate-200 rounded-xl text-[11px] font-mono overflow-x-auto whitespace-pre">
          {chart}
        </pre>
      ) : error ? (
        <div className="rounded-xl bg-amber-50 border border-amber-200 p-3 text-xs text-amber-900 flex flex-col gap-2">
          <span className="font-bold">⚠️ No se pudo renderizar la vista gráfica.</span>
          <p className="text-[11px] text-amber-800">
            Podés copiar la sintaxis Mermaid e inspeccionarla en el editor oficial.
          </p>
          <pre className="p-2 bg-white/80 border border-amber-200 rounded-lg text-[10px] font-mono overflow-x-auto text-slate-800">
            {chart}
          </pre>
        </div>
      ) : svgContent ? (
        <div
          ref={containerRef}
          className="flex items-center justify-center overflow-x-auto p-2 bg-slate-50/50 rounded-xl border border-slate-100 [&_svg]:max-w-full [&_svg]:h-auto"
          dangerouslySetInnerHTML={{ __html: svgContent }}
        />
      ) : (
        <div className="flex items-center justify-center py-6 text-xs text-slate-400 animate-pulse">
          ⏳ Renderizando diagrama vectorial Mermaid...
        </div>
      )}
    </div>
  )
}
