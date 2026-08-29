'use client'

import { useState } from 'react'
import { SubjectCheatSheetData } from '@/app/materias/[subjectId]/actions'
import {
  IconSparkles,
  IconPrinter,
  IconDownload,
  IconClipboard,
  IconCheck,
  IconLightbulb,
  IconBook,
} from '@/components/icons'

interface SubjectCheatSheetModalProps {
  data: SubjectCheatSheetData
  onClose: () => void
}

export default function SubjectCheatSheetModal({
  data,
  onClose,
}: SubjectCheatSheetModalProps) {
  const [copied, setCopied] = useState(false)
  const [revealedAnswers, setRevealedAnswers] = useState<Record<number, boolean>>({})

  const toggleReveal = (idx: number) => {
    setRevealedAnswers((prev) => ({
      ...prev,
      [idx]: !prev[idx],
    }))
  }

  const handlePrint = () => {
    window.print()
  }

  const buildMarkdown = (): string => {
    const todayStr = new Date().toLocaleDateString('es-AR', {
      day: 'numeric',
      month: 'long',
      year: 'numeric',
    })

    let md = `# 📋 Ficha de Fórmulas y Resumen de Repaso: ${data.subject_name}\n`
    md += `*Generado por UniNav AI • ${todayStr}*\n\n`
    md += `---\n\n`

    md += `## 💡 Síntesis Conceptual de la Cursada\n${data.overview}\n\n`

    if (data.core_concepts.length > 0) {
      md += `## 📌 Conceptos Teóricos Indispensables\n`
      data.core_concepts.forEach((c, i) => {
        md += `### ${i + 1}. ${c.term}${c.citation_page ? ` [Pág. ${c.citation_page}]` : ''}\n`
        md += `${c.definition}\n\n`
      })
    }

    if (data.formulas_and_algorithms.length > 0) {
      md += `## 📐 Fórmulas Matemáticas & Algoritmos Clave\n`
      data.formulas_and_algorithms.forEach((f, i) => {
        md += `### ${i + 1}. ${f.name}\n`
        md += `**Fórmula / Notación:** \`${f.formula}\`\n`
        md += `**Qué calcula:** ${f.description}\n`
        md += `**Cuándo aplicar en el parcial:** ${f.when_to_use}\n\n`
      })
    }

    if (data.exam_traps.length > 0) {
      md += `## ⚠️ Trampas y Errores Frecuentes en Exámenes\n`
      data.exam_traps.forEach((t, i) => {
        md += `### ${i + 1}. Error Común: ${t.trap}\n`
        md += `*Por qué ocurre:* ${t.explanation}\n`
        md += `*Consejo para el parcial:* ${t.advice}\n\n`
      })
    }

    if (data.self_check_questions.length > 0) {
      md += `## 💡 Autoevaluación Rápida antes de Rendir\n`
      data.self_check_questions.forEach((q, i) => {
        md += `**P${i + 1}: ${q.question}**\n`
        md += `*Respuesta Clave:* ${q.key_answer}\n\n`
      })
    }

    md += `---\n*UniNav — Plataforma Universitaria Socrática*`
    return md
  }

  const handleCopy = () => {
    const md = buildMarkdown()
    navigator.clipboard.writeText(md)
    setCopied(true)
    setTimeout(() => setCopied(false), 2500)
  }

  const handleDownload = () => {
    const md = buildMarkdown()
    const blob = new Blob([md], { type: 'text/markdown;charset=utf-8' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `Ficha_Repaso_${data.subject_name.replace(/\s+/g, '_')}.md`
    a.click()
    URL.revokeObjectURL(url)
  }

  return (
    <div
      className="fixed inset-0 z-[9999] flex items-center justify-center bg-slate-900/80 backdrop-blur-xs p-3 sm:p-6 animate-in fade-in"
      onClick={onClose}
    >
      <div
        className="w-full max-w-4xl max-h-[92vh] rounded-3xl bg-white p-5 sm:p-8 shadow-2xl border border-slate-200 flex flex-col gap-5 animate-in zoom-in-95 overflow-hidden print:p-0 print:border-none print:shadow-none print:max-h-none print:overflow-visible print:w-full print:rounded-none"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header con Acciones */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 border-b border-slate-100 pb-4 shrink-0 print:border-b-2 print:border-slate-800">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-indigo-600 text-white shadow-xs shrink-0 print:hidden">
              <IconSparkles className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="text-[10px] font-black uppercase tracking-wider text-indigo-700 bg-indigo-50 border border-indigo-200 px-2 py-0.5 rounded-full">
                  Ficha de Examen
                </span>
                <span className="text-xs font-semibold text-slate-400">
                  {new Date().toLocaleDateString('es-AR', {
                    day: 'numeric',
                    month: 'short',
                    year: 'numeric',
                  })}
                </span>
              </div>
              <h2 className="text-lg sm:text-xl font-black text-slate-900 leading-tight">
                Ficha de Fórmulas y Resumen: {data.subject_name}
              </h2>
            </div>
          </div>

          {/* Botones de Acción (Se ocultan al imprimir) */}
          <div className="flex items-center gap-2 shrink-0 print:hidden">
            <button
              type="button"
              onClick={handlePrint}
              className="rounded-xl border border-indigo-200 bg-indigo-50/80 px-3 py-2 text-xs font-bold text-indigo-700 hover:bg-indigo-100 transition-colors flex items-center gap-1.5 cursor-pointer shadow-2xs"
              title="Imprimir o guardar como PDF"
            >
              <IconPrinter className="w-3.5 h-3.5 text-indigo-600" />
              <span>Imprimir / PDF</span>
            </button>

            <button
              type="button"
              onClick={handleDownload}
              className="rounded-xl border border-slate-200 bg-white px-3 py-2 text-xs font-bold text-slate-700 hover:bg-slate-50 transition-colors flex items-center gap-1.5 cursor-pointer shadow-2xs"
              title="Descargar archivo Markdown"
            >
              <IconDownload className="w-3.5 h-3.5 text-slate-500" />
              <span className="hidden sm:inline">Descargar .md</span>
            </button>

            <button
              type="button"
              onClick={handleCopy}
              className="rounded-xl bg-slate-900 px-3 py-2 text-xs font-bold text-white hover:bg-slate-800 transition-colors flex items-center gap-1.5 cursor-pointer shadow-2xs"
              title="Copiar contenido"
            >
              <IconClipboard className="w-3.5 h-3.5 text-slate-300" />
              <span>{copied ? '¡Copiado! ✓' : 'Copiar'}</span>
            </button>

            <button
              type="button"
              onClick={onClose}
              className="rounded-xl bg-slate-100 p-2 text-slate-500 hover:bg-slate-200 hover:text-slate-900 transition-colors text-xs font-bold cursor-pointer ml-1"
              title="Cerrar ficha"
            >
              ✕
            </button>
          </div>
        </div>

        {/* Cuerpo Scrolleable de la Ficha */}
        <div className="flex-1 overflow-y-auto min-h-0 pr-1 flex flex-col gap-6 font-sans print:overflow-visible print:pr-0">
          {/* 1. Síntesis General */}
          <div className="rounded-2xl bg-indigo-50/60 border border-indigo-100/90 p-4 sm:p-5 flex flex-col gap-2">
            <div className="flex items-center gap-2 text-indigo-900 font-bold text-xs uppercase tracking-wider">
              <IconLightbulb className="w-4 h-4 text-indigo-600" />
              <span>Síntesis Conceptual de la Cursada</span>
            </div>
            <p className="text-xs sm:text-sm text-slate-800 leading-relaxed font-medium">
              {data.overview}
            </p>
          </div>

          {/* 2. Conceptos Teóricos Indispensables */}
          {data.core_concepts.length > 0 && (
            <div className="flex flex-col gap-3">
              <div className="flex items-center gap-2 border-b border-slate-100 pb-1.5">
                <IconBook className="w-4 h-4 text-indigo-600" />
                <h3 className="text-sm font-bold text-slate-900 uppercase tracking-wide">
                  📌 Conceptos Teóricos Indispensables
                </h3>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                {data.core_concepts.map((concept, idx) => (
                  <div
                    key={idx}
                    className="rounded-2xl border border-slate-200/80 bg-white p-3.5 flex flex-col gap-1.5 shadow-2xs"
                  >
                    <div className="flex items-center justify-between gap-2">
                      <span className="font-bold text-xs sm:text-sm text-slate-900">
                        {concept.term}
                      </span>
                      {concept.citation_page && (
                        <span className="text-[10px] font-bold text-indigo-700 bg-indigo-50 border border-indigo-200 px-2 py-0.5 rounded-full font-mono shrink-0">
                          Pág. {concept.citation_page}
                        </span>
                      )}
                    </div>
                    <p className="text-xs text-slate-600 leading-relaxed font-normal">
                      {concept.definition}
                    </p>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* 3. Fórmulas Matemáticas & Algoritmos Clave */}
          {data.formulas_and_algorithms.length > 0 && (
            <div className="flex flex-col gap-3">
              <div className="flex items-center gap-2 border-b border-slate-100 pb-1.5">
                <span className="text-base font-black text-indigo-600 font-mono">∑</span>
                <h3 className="text-sm font-bold text-slate-900 uppercase tracking-wide">
                  📐 Fórmulas Matemáticas & Algoritmos Clave
                </h3>
              </div>

              <div className="grid grid-cols-1 gap-3">
                {data.formulas_and_algorithms.map((item, idx) => (
                  <div
                    key={idx}
                    className="rounded-2xl border border-slate-200 bg-slate-50/70 p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3"
                  >
                    <div className="flex-1 flex flex-col gap-1">
                      <span className="text-xs font-bold text-slate-900">{item.name}</span>
                      <p className="text-xs text-slate-600">{item.description}</p>
                      <div className="inline-flex items-center gap-1 text-[11px] font-semibold text-indigo-700 mt-1">
                        <span className="text-slate-400 font-bold uppercase text-[9px]">Cuándo usar:</span>
                        <span>{item.when_to_use}</span>
                      </div>
                    </div>

                    <div className="bg-slate-950 text-indigo-300 font-mono text-xs sm:text-sm px-4 py-2.5 rounded-xl border border-slate-800 shadow-inner flex items-center justify-center text-center shrink-0 min-w-[200px]">
                      {item.formula}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* 4. Trampas Comunes en los Parciales */}
          {data.exam_traps.length > 0 && (
            <div className="flex flex-col gap-3">
              <div className="flex items-center gap-2 border-b border-slate-100 pb-1.5">
                <span className="text-amber-500 font-bold text-sm">⚠️</span>
                <h3 className="text-sm font-bold text-slate-900 uppercase tracking-wide">
                  Trampas y Errores Típicos de Parcial
                </h3>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                {data.exam_traps.map((trap, idx) => (
                  <div
                    key={idx}
                    className="rounded-2xl border border-amber-200/80 bg-amber-50/50 p-4 flex flex-col justify-between gap-2.5"
                  >
                    <div className="flex flex-col gap-1.5">
                      <span className="font-bold text-xs text-amber-950 leading-tight">
                        {trap.trap}
                      </span>
                      <p className="text-[11px] text-amber-900 leading-relaxed">
                        {trap.explanation}
                      </p>
                    </div>

                    <div className="rounded-xl bg-amber-100/90 border border-amber-300/80 p-2 text-[10px] font-bold text-amber-950 flex items-start gap-1">
                      <span className="shrink-0 text-amber-700">💡 Tip:</span>
                      <span>{trap.advice}</span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* 5. Autochequeo Rápido */}
          {data.self_check_questions.length > 0 && (
            <div className="flex flex-col gap-3">
              <div className="flex items-center gap-2 border-b border-slate-100 pb-1.5">
                <span className="text-emerald-600 font-bold text-sm">✓</span>
                <h3 className="text-sm font-bold text-slate-900 uppercase tracking-wide">
                  Autoevaluación Rápida antes de Rendir
                </h3>
              </div>

              <div className="flex flex-col gap-2">
                {data.self_check_questions.map((q, idx) => (
                  <div
                    key={idx}
                    className="rounded-2xl border border-slate-200 bg-white p-3.5 flex flex-col gap-2 shadow-2xs"
                  >
                    <div className="flex items-center justify-between gap-2">
                      <span className="font-bold text-xs text-slate-900">
                        {idx + 1}. {q.question}
                      </span>
                      <button
                        type="button"
                        onClick={() => toggleReveal(idx)}
                        className="text-[10px] font-bold text-indigo-600 hover:text-indigo-800 transition-colors px-2 py-1 bg-indigo-50 rounded-lg shrink-0 cursor-pointer print:hidden"
                      >
                        {revealedAnswers[idx] ? 'Ocultar' : 'Ver Respuesta'}
                      </button>
                    </div>

                    {(revealedAnswers[idx] || false) && (
                      <div className="rounded-xl bg-slate-50 border border-slate-200/80 p-2.5 text-xs text-emerald-800 font-medium animate-in fade-in">
                        <span className="font-bold text-emerald-950 block text-[10px] uppercase tracking-wider mb-0.5">
                          Respuesta Clave:
                        </span>
                        {q.key_answer}
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Footer del Modal */}
        <div className="flex items-center justify-between pt-3 border-t border-slate-100 shrink-0 print:hidden">
          <span className="text-[11px] text-slate-500 font-medium flex items-center gap-1">
            <IconCheck className="w-3.5 h-3.5 text-emerald-600" />
            Generado a partir de los apuntes oficiales de {data.subject_name}
          </span>

          <button
            type="button"
            onClick={onClose}
            className="rounded-xl bg-indigo-600 px-5 py-2 text-xs font-bold text-white shadow-2xs hover:bg-indigo-700 transition-colors cursor-pointer"
          >
            Listo para estudiar
          </button>
        </div>
      </div>
    </div>
  )
}
