'use client'

import { useState, useEffect, useRef } from 'react'
import { askSocraticTutor, generateDiagramAction, getCitationContentAction } from './actions'
import MermaidDiagram from '@/components/MermaidDiagram'
import {
  IconSparkles,
  IconTrash,
  IconBook,
  IconChart,
  IconLightbulb,
  IconClipboard,
  IconDownload,
  IconPrinter,
  IconDocument,
  IconExternalLink,
  IconCheck,
} from '@/components/icons'


interface Citation {
  document_id: string
  page_number: number | null
  content: string
}

interface Message {
  id: string
  role: 'user' | 'model'
  content: string
  citations?: Citation[]
  mermaid_code?: string | null
  follow_ups?: string[]
}

interface SocraticChatViewProps {
  subjectId: string
  threadId?: string
  threadTitle?: string
}

function cleanConversationalChatter(text: string): string {
  let cleaned = text
    .replace(/^([¡!]?Hola[!.]?|[¡!]?Buenas[!.]?|[¡!]?Buenos días[!.]?|[¡!]?Buenas tardes[!.]?|Estimado estudiante[,:]?|Vamos a revisar los conceptos clave que presenta el material respecto a.*?:\s*)/gim, '')
    .replace(/(\n*(¿?En qué tema te gustaría que empecemos a trabajar hoy\??|¿?Contame qué duda tenés.*?|¿?Qué punto querés revisar\??|¡?Contame con qué querés arrancar!?|¿?Te gustaría que profundicemos en algún punto específico\??).*)$/gim, '')
    .trim()

  return cleaned || text
}

function buildStudySummaryMarkdown(threadTitle: string, messages: Message[]): string {
  const actualMessages = messages.filter((m) => !m.id.startsWith('welcome'))
  const dateStr = new Date().toLocaleDateString('es-AR', {
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  })

  let md = `# 📋 Ficha Resumen de Estudio: ${threadTitle || 'Tema General'}\n`
  md += `*Generado con UniNav AI • ${dateStr}*\n\n`
  md += `---\n\n`

  md += `## 💡 Conceptos Clave y Desarrollo Académico\n\n`

  let conceptCount = 1
  actualMessages.forEach((msg) => {
    if (msg.role === 'model') {
      const cleanContent = cleanConversationalChatter(msg.content)
      md += `### ${conceptCount}. Síntesis del Contenido\n${cleanContent}\n\n`

      if (msg.citations && msg.citations.length > 0) {
        md += `**Citas Bibliográficas:** `
        md += msg.citations.map((c) => `[Pág. ${c.page_number ?? 'N/A'}]`).join(', ') + `\n\n`
      }

      if (msg.mermaid_code) {
        md += `\`\`\`mermaid\n${msg.mermaid_code}\n\`\`\`\n\n`
      }

      conceptCount += 1
    }
  })

  md += `---\n`
  md += `*UniNav — Plataforma de Acompañamiento Académico Universitario*\n`
  return md
}

function renderTextWithHighlights(
  text: string,
  isUserMessage: boolean = false,
  onCitationClick?: (pageTagStr: string) => void
) {
  const regex = /(\*\*.*?\*\*|\[Pág\.\s*[^\]]+\])/g
  const parts = text.split(regex)

  return parts.map((part, i) => {
    if (part.startsWith('**') && part.endsWith('**')) {
      const boldText = part.slice(2, -2)
      return (
        <strong
          key={i}
          className={`font-black tracking-tight px-1.5 py-0.5 rounded-md border shadow-2xs mx-0.5 ${
            isUserMessage
              ? 'bg-indigo-700 text-white border-indigo-500'
              : 'bg-indigo-100/90 text-indigo-950 border-indigo-300'
          }`}
        >
          {boldText}
        </strong>
      )
    }

    if (part.startsWith('[Pág.') && part.endsWith(']')) {
      return (
        <button
          key={i}
          type="button"
          onClick={(e) => {
            e.preventDefault()
            e.stopPropagation()
            onCitationClick?.(part)
          }}
          className={`inline-flex items-center text-[10px] font-bold px-1.5 py-0.5 rounded-md mx-0.5 font-mono shadow-2xs cursor-pointer hover:scale-105 active:scale-95 transition-all ${
            isUserMessage
              ? 'bg-indigo-800 text-indigo-200 border border-indigo-500 hover:bg-indigo-900'
              : 'bg-indigo-50 text-indigo-700 border border-indigo-200/90 hover:bg-indigo-100 hover:text-indigo-900'
          }`}
          title="Ver fragmento bibliográfico original"
        >
          {part}
        </button>
      )
    }

    return part
  })
}

function FormattedChatMessage({
  content,
  isUserMessage = false,
  onCitationClick,
}: {
  content: string
  isUserMessage?: boolean
  onCitationClick?: (pageTagStr: string) => void
}) {
  const lines = content.split('\n')

  return (
    <div className="flex flex-col gap-2 leading-relaxed">
      {lines.map((line, idx) => {
        if (!line.trim()) return <div key={idx} className="h-0.5" />

        const isBullet =
          line.trim().startsWith('* ') ||
          line.trim().startsWith('- ') ||
          /^\d+\.\s/.test(line.trim())

        let cleanLine = line
        if (line.trim().startsWith('* ') || line.trim().startsWith('- ')) {
          cleanLine = line.trim().substring(2)
        }

        return (
          <div
            key={idx}
            className={
              isBullet
                ? isUserMessage
                  ? 'flex items-start gap-2 pl-2 border-l-2 border-indigo-300 my-0.5'
                  : 'flex items-start gap-2 pl-2.5 border-l-2 border-indigo-500 my-0.5 bg-indigo-50/40 py-0.5 rounded-r-lg'
                : ''
            }
          >
            {isBullet && (
              <span
                className={`font-bold text-xs shrink-0 mt-0.5 ${
                  isUserMessage ? 'text-indigo-200' : 'text-indigo-600'
                }`}
              >
                •
              </span>
            )}
            <div className="flex-1">
              {renderTextWithHighlights(cleanLine, isUserMessage, onCitationClick)}
            </div>
          </div>
        )
      })}
    </div>
  )
}

export default function SocraticChatView({
  subjectId,
  threadId = 'general',
  threadTitle = 'General',
}: SocraticChatViewProps) {
  const storageKey = `uninav_chat_${subjectId}_${threadId}`

  const defaultWelcome: Message = {
    id: `welcome_${threadId}`,
    role: 'model',
    content:
      threadTitle && threadTitle !== 'General'
        ? `¡Hola! Soy UniNav AI, tu tutor socrático para el tema **${threadTitle}**. Hacé tu consulta y te guiaré analizando los apuntes cargados.`
        : '¡Hola! Soy UniNav AI, tu tutor socrático. Hacé tu consulta sobre la materia y te guiaré analizando los apuntes cargados.',
    follow_ups: [
      `💡 Conceptos clave de ${threadTitle || 'este tema'}`,
      `❓ ¿Qué preguntas de examen surgen de este apunte?`,
      `📐 Armá una guía de estudio estructurada`,
    ],
  }

  const [messages, setMessages] = useState<Message[]>([defaultWelcome])
  const [input, setInput] = useState('')
  const [loading, setLoading] = useState(false)
  const [generatingDiagramId, setGeneratingDiagramId] = useState<string | null>(null)
  const [showSummaryModal, setShowSummaryModal] = useState(false)
  const [summaryViewMode, setSummaryViewMode] = useState<'preview' | 'raw'>('preview')
  const [copiedSummary, setCopiedSummary] = useState(false)

  // Estado de voz (Speech-to-Text)
  const [isListening, setIsListening] = useState(false)
  const recognitionRef = useRef<any>(null)

  // Estado de síntesis de voz (Text-to-Speech)
  const [speakingMsgId, setSpeakingMsgId] = useState<string | null>(null)

  const [activeCitationModal, setActiveCitationModal] = useState<{
    page_number: number | null
    content: string
    document_title?: string
    pdf_url?: string | null
    view_mode?: 'text' | 'pdf'
    loading?: boolean
  } | null>(null)


  const chatEndRef = useRef<HTMLDivElement>(null)

  const scrollToBottom = (behavior: ScrollBehavior = 'smooth') => {
    chatEndRef.current?.scrollIntoView({ behavior })
  }

  useEffect(() => {
    try {
      const saved = localStorage.getItem(storageKey)
      if (saved) {
        const parsed = JSON.parse(saved)
        if (Array.isArray(parsed) && parsed.length > 0) {
          setMessages(parsed)
          return
        }
      }
      setMessages([defaultWelcome])
    } catch {
      setMessages([defaultWelcome])
    }
  }, [storageKey, threadId])

  useEffect(() => {
    scrollToBottom('auto')
  }, [messages.length, loading])

  const saveMessagesToStorage = (newMessages: Message[]) => {
    setMessages(newMessages)
    try {
      localStorage.setItem(storageKey, JSON.stringify(newMessages))
    } catch {
      // Ignorar errores
    }
  }

  const handleSend = async (e?: React.FormEvent, customText?: string) => {
    if (e) e.preventDefault()
    const textToSend = customText || input
    if (!textToSend.trim() || loading) return

    setInput('')

    const userMsg: Message = {
      id: Date.now().toString(),
      role: 'user',
      content: textToSend.trim(),
    }

    const updatedWithUser = [...messages, userMsg]
    saveMessagesToStorage(updatedWithUser)
    setLoading(true)

    try {
      const historyForApi = updatedWithUser
        .filter((m) => !m.id.startsWith('welcome'))
        .map((m) => ({ role: m.role, content: m.content }))

      const contextualQuery =
        threadTitle && threadTitle !== 'General'
          ? `[Tema: ${threadTitle}] ${textToSend.trim()}`
          : textToSend.trim()

      const res = await askSocraticTutor(subjectId, contextualQuery, historyForApi)

      const modelMsg: Message = {
        id: (Date.now() + 1).toString(),
        role: 'model',
        content: res.response,
        citations: res.citations,
        follow_ups: res.follow_ups,
      }

      saveMessagesToStorage([...updatedWithUser, modelMsg])
    } catch (err) {
      const errorMsg: Message = {
        id: (Date.now() + 1).toString(),
        role: 'model',
        content:
          err instanceof Error
            ? `⚠️ Error: ${err.message}`
            : '⚠️ Ocurrió un error al procesar tu consulta.',
      }
      saveMessagesToStorage([...updatedWithUser, errorMsg])
    } finally {
      setLoading(false)
    }
  }

  const handleClearChat = () => {
    localStorage.removeItem(storageKey)
    setMessages([defaultWelcome])
  }

  const handleToggleVoice = () => {
    if (isListening) {
      recognitionRef.current?.stop()
      setIsListening(false)
      return
    }

    const SpeechRecognition =
      (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition

    if (!SpeechRecognition) {
      alert('Tu navegador no soporta entrada de voz directa. Te sugerimos usar Chrome o Edge.')
      return
    }

    try {
      const recognition = new SpeechRecognition()
      recognition.lang = 'es-AR'
      recognition.continuous = false
      recognition.interimResults = false

      recognition.onstart = () => setIsListening(true)
      recognition.onresult = (event: any) => {
        const transcript = event.results[0][0].transcript
        if (transcript) {
          setInput((prev) => (prev ? `${prev} ${transcript}` : transcript))
        }
        setIsListening(false)
      }
      recognition.onerror = () => setIsListening(false)
      recognition.onend = () => setIsListening(false)

      recognitionRef.current = recognition
      recognition.start()
    } catch {
      setIsListening(false)
    }
  }

  const handleSpeak = (msgId: string, text: string) => {
    if (!window.speechSynthesis) return

    if (speakingMsgId === msgId) {
      window.speechSynthesis.cancel()
      setSpeakingMsgId(null)
      return
    }

    window.speechSynthesis.cancel()
    const cleanText = text.replace(/\[Pág\.\s*[^\]]+\]/g, '').replace(/\*\*/g, '').trim()
    const utterance = new SpeechSynthesisUtterance(cleanText)
    utterance.lang = 'es-AR'
    utterance.rate = 1.05
    utterance.onend = () => setSpeakingMsgId(null)
    utterance.onerror = () => setSpeakingMsgId(null)

    setSpeakingMsgId(msgId)
    window.speechSynthesis.speak(utterance)
  }

  const handleGenerateDiagram = async (targetMsgId: string) => {
    setGeneratingDiagramId(targetMsgId)

    try {
      const targetIndex = messages.findIndex((m) => m.id === targetMsgId)
      if (targetIndex === -1) return

      const startIdx = Math.max(0, targetIndex - 3)
      const turns = messages
        .slice(startIdx, targetIndex + 1)
        .filter((m) => !m.id.startsWith('welcome'))
        .map((m) => ({ role: m.role, content: m.content }))

      if (turns.length === 0) {
        const targetMsg = messages[targetIndex]
        if (targetMsg) {
          turns.push({ role: 'model', content: targetMsg.content })
        }
      }

      const code = await generateDiagramAction(turns)

      const newMessages = messages.map((m) =>
        m.id === targetMsgId ? { ...m, mermaid_code: code } : m
      )

      saveMessagesToStorage(newMessages)
    } catch (err) {
      alert(err instanceof Error ? err.message : 'Error al generar diagrama Mermaid.')
    } finally {
      setGeneratingDiagramId(null)
    }
  }

  const handleOpenCitationModal = async (messageCitations?: Citation[], pageTagStr?: string) => {
    const match = pageTagStr?.match(/\d+/)
    const pageNum = match ? parseInt(match[0], 10) : 1

    const foundCitation = messageCitations?.find((c) => c.page_number === pageNum) || messageCitations?.[0]

    setActiveCitationModal({
      page_number: foundCitation?.page_number || pageNum,
      content: foundCitation?.content || 'Cargando fragmento original de la bibliografía...',
      document_title: 'Bibliografía oficial',
      pdf_url: null,
      view_mode: 'text',
      loading: true,
    })

    try {
      const res = await getCitationContentAction(subjectId, pageNum, foundCitation?.document_id)
      setActiveCitationModal({
        page_number: res.page_number,
        content: res.content,
        document_title: res.document_title,
        pdf_url: res.pdf_url,
        view_mode: 'text',
        loading: false,
      })
    } catch {
      setActiveCitationModal((prev) =>
        prev
          ? { ...prev, loading: false }
          : {
              page_number: pageNum,
              content: 'No se pudo cargar el fragmento original.',
              loading: false,
            }
      )
    }
  }


  const handleCopySummary = () => {
    const md = buildStudySummaryMarkdown(threadTitle, messages)
    navigator.clipboard.writeText(md)
    setCopiedSummary(true)
    setTimeout(() => setCopiedSummary(false), 2500)
  }

  const handleDownloadSummary = () => {
    const md = buildStudySummaryMarkdown(threadTitle, messages)
    const blob = new Blob([md], { type: 'text/markdown;charset=utf-8;' })
    const url = URL.createObjectURL(blob)
    const link = document.createElement('a')
    const safeTitle = (threadTitle || 'Tema').replace(/[^a-zA-Z0-9_-]/g, '_')
    link.href = url
    link.download = `Ficha_Resumen_${safeTitle}.md`
    link.click()
    URL.revokeObjectURL(url)
  }

  const hasConversations = messages.filter((m) => !m.id.startsWith('welcome')).length > 0

  return (
    <div className="flex flex-col h-[670px] border border-slate-200/80 rounded-2xl bg-white shadow-xs overflow-hidden relative">
      {/* Header del Chat */}
      <div className="border-b border-slate-200/80 px-5 py-3.5 bg-slate-50/80 flex items-center justify-between">
        <div className="flex items-center gap-2.5 truncate">
          <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-indigo-100 text-indigo-700 font-bold text-xs shrink-0">
            <IconSparkles className="w-4 h-4" />
          </div>
          <div className="truncate">
            <div className="flex items-center gap-2 truncate">
              <h2 className="text-xs font-bold text-slate-800 tracking-tight">Tutor Socrático RAG</h2>
              {threadTitle && threadTitle !== 'General' && (
                <span className="text-[10px] bg-indigo-100 text-indigo-800 font-bold px-2 py-0.5 rounded-full border border-indigo-200 truncate">
                  {threadTitle}
                </span>
              )}
            </div>
            <p className="text-[11px] text-slate-500 truncate">
              Respuestas fundamentadas exclusivamente en la bibliografía de tu materia.
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2 shrink-0">
          {/* Botón de Exportar Ficha Resumen */}
          {hasConversations && (
            <button
              type="button"
              onClick={() => setShowSummaryModal(true)}
              className="text-[11px] font-semibold text-indigo-700 bg-indigo-50 hover:bg-indigo-100 border border-indigo-200 transition-colors px-2.5 py-1 rounded-lg flex items-center gap-1.5 cursor-pointer active:scale-95 shadow-2xs"
              title="Exportar ficha resumen de estudio de este tema"
            >
              <IconClipboard className="w-3.5 h-3.5" />
              Ficha Resumen
            </button>
          )}

          {messages.length > 1 && (
            <button
              type="button"
              onClick={handleClearChat}
              className="text-[11px] font-medium text-slate-500 hover:text-rose-600 transition-colors px-2 py-1 rounded-md hover:bg-rose-50 flex items-center gap-1 cursor-pointer"
              title="Borrar conversación y reiniciar este tema"
            >
              <IconTrash className="w-3.5 h-3.5" />
              Limpiar tema
            </button>
          )}

          <span className="text-[11px] bg-emerald-50 text-emerald-700 border border-emerald-200/60 px-2.5 py-0.5 rounded-full font-semibold">
            ● Activo
          </span>
        </div>
      </div>

      {/* Lista de Mensajes con Autoscroll */}
      <div className="flex-1 p-5 overflow-y-auto flex flex-col gap-4 bg-slate-50/40">
        {messages.map((m, mIdx) => (
          <div
            key={m.id}
            className={`flex flex-col max-w-[88%] ${
              m.role === 'user' ? 'self-end items-end' : 'self-start items-start'
            }`}
          >
            <div
              className={`rounded-2xl p-4 text-xs sm:text-sm leading-relaxed shadow-xs ${
                m.role === 'user'
                  ? 'bg-indigo-600 text-white rounded-tr-xs'
                  : 'bg-white text-slate-800 rounded-tl-xs border border-slate-200/80'
              }`}
            >
              {m.role === 'model' && (
                <div className="flex items-center justify-between border-b border-slate-100 pb-1 mb-2">
                  <div className="text-[10px] font-bold text-indigo-600 uppercase tracking-wider flex items-center gap-1">
                    <IconSparkles className="w-3 h-3" />
                    UniNav AI (Tutor Socrático)
                  </div>

                  {/* Botón de Audio Text-to-Speech */}
                  <button
                    type="button"
                    onClick={() => handleSpeak(m.id, m.content)}
                    className={`text-[10px] font-bold px-2 py-0.5 rounded-md flex items-center gap-1 transition-all cursor-pointer ${
                      speakingMsgId === m.id
                        ? 'bg-indigo-600 text-white animate-pulse'
                        : 'bg-slate-100 text-slate-600 hover:bg-indigo-50 hover:text-indigo-700'
                    }`}
                    title={speakingMsgId === m.id ? 'Detener lectura' : 'Escuchar explicación en audio'}
                  >
                    <span>{speakingMsgId === m.id ? '⏹ Detener' : '🔊 Escuchar'}</span>
                  </button>
                </div>
              )}

              <FormattedChatMessage
                content={m.content}
                isUserMessage={m.role === 'user'}
                onCitationClick={(pageTagStr) => handleOpenCitationModal(m.citations, pageTagStr)}
              />

              {/* Citas de la bibliografía */}
              {m.citations && m.citations.length > 0 && (
                <div className="mt-3 pt-2.5 border-t border-slate-100 text-xs text-slate-600">
                  <span className="font-semibold text-slate-700 mb-1 text-[11px] flex items-center gap-1">
                    <IconBook className="w-3.5 h-3.5 text-indigo-600" />
                    Citas bibliográficas utilizadas (hacé clic para desplegar):
                  </span>
                  <ul className="flex flex-wrap gap-1.5 mt-1">
                    {m.citations.map((c, i) => (
                      <li key={i}>
                        <button
                          type="button"
                          onClick={(e) => {
                            e.preventDefault()
                            e.stopPropagation()
                            handleOpenCitationModal(m.citations, `[Pág. ${c.page_number || 1}]`)
                          }}
                          className="bg-indigo-50 border border-indigo-100 text-indigo-700 hover:bg-indigo-100 hover:text-indigo-900 rounded-lg px-2 py-0.5 text-[11px] font-medium transition-colors flex items-center gap-1 cursor-pointer active:scale-95"
                        >
                          Pág. {c.page_number ?? 'N/A'}
                        </button>
                      </li>
                    ))}
                  </ul>
                </div>
              )}
            </div>

            {/* Componente de Diagrama Mermaid Renderizado */}
            {m.mermaid_code && (
              <div className="w-full mt-2">
                <MermaidDiagram chart={m.mermaid_code} />
              </div>
            )}

            {/* Botón para generar diagrama */}
            {m.role === 'model' && !m.id.startsWith('welcome') && (
              <button
                type="button"
                disabled={generatingDiagramId === m.id}
                onClick={() => handleGenerateDiagram(m.id)}
                className="mt-1 text-[11px] text-indigo-600 hover:text-indigo-800 flex items-center gap-1.5 font-semibold hover:underline px-1 transition-colors disabled:opacity-50 cursor-pointer"
              >
                <IconChart className="w-3.5 h-3.5" />
                {generatingDiagramId === m.id
                  ? 'Generando esquema con IA...'
                  : m.mermaid_code
                  ? 'Regenerar diagrama Mermaid'
                  : 'Generar diagrama Mermaid'}
              </button>
            )}

            {/* Píldoras de Repregunta Dinámica (Smart Follow-Up Chips) */}
            {m.role === 'model' && m.follow_ups && m.follow_ups.length > 0 && mIdx === messages.length - 1 && !loading && (
              <div className="mt-2.5 flex flex-wrap gap-1.5 animate-in fade-in">
                {m.follow_ups.map((followUp, fIdx) => (
                  <button
                    key={fIdx}
                    type="button"
                    onClick={() => handleSend(undefined, followUp)}
                    className="text-[11px] font-semibold text-indigo-700 bg-indigo-50/90 hover:bg-indigo-600 hover:text-white border border-indigo-200 px-3 py-1.5 rounded-xl transition-all shadow-2xs text-left cursor-pointer active:scale-95 flex items-center gap-1"
                  >
                    <span>💡</span>
                    <span>{followUp}</span>
                  </button>
                ))}
              </div>
            )}
          </div>
        ))}

        {loading && (
          <div className="self-start bg-white text-slate-600 rounded-2xl p-4 text-xs border border-slate-200/80 shadow-xs animate-pulse flex items-center gap-2.5 font-medium">
            <span className="h-2.5 w-2.5 rounded-full bg-indigo-600 animate-ping"></span>
            Consultando bibliografía oficial y razonando socráticamente...
          </div>
        )}

        <div ref={chatEndRef} />
      </div>

      {/* Formulario de Entrada con Micrófono Speech-to-Text */}
      <form onSubmit={(e) => handleSend(e)} className="p-3.5 border-t border-slate-200/80 bg-white flex gap-2 items-center">
        {/* Botón Micrófono */}
        <button
          type="button"
          onClick={handleToggleVoice}
          className={`p-2.5 rounded-xl border transition-all cursor-pointer shrink-0 shadow-2xs ${
            isListening
              ? 'bg-rose-500 text-white border-rose-600 animate-pulse'
              : 'bg-slate-50 text-slate-600 border-slate-200 hover:bg-indigo-50 hover:text-indigo-700 hover:border-indigo-200'
          }`}
          title={isListening ? 'Escuchando tu voz... (tocá para parar)' : 'Hablar por micrófono (dictado por voz)'}
        >
          <span className="text-sm">🎤</span>
        </button>

        <input
          type="text"
          value={input}
          onChange={(e) => setInput(e.target.value)}
          placeholder={
            isListening
              ? '🎙️ Escuchando tu consulta en voz alta...'
              : `Escribí o dictá tu duda sobre ${threadTitle || 'el tema'}...`
          }
          disabled={loading}
          className="flex-1 rounded-xl border border-slate-200 px-4 py-2.5 text-xs sm:text-sm bg-slate-50 focus:bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all font-medium text-slate-900"
        />

        <button
          type="submit"
          disabled={loading || !input.trim()}
          className="rounded-xl bg-indigo-600 px-5 py-2.5 text-xs sm:text-sm font-semibold text-white shadow-xs hover:bg-indigo-700 disabled:opacity-50 transition-all shrink-0 cursor-pointer"
        >
          Enviar
        </button>
      </form>

      {/* Modal Desplegable de Ficha Resumen de Estudio */}
      {showSummaryModal && (
        <div
          className="fixed inset-0 z-[9999] flex items-center justify-center bg-slate-900/70 backdrop-blur-xs p-4 animate-in fade-in"
          onClick={() => setShowSummaryModal(false)}
        >
          <div
            className="w-full max-w-2xl rounded-3xl bg-white p-6 shadow-2xl border border-slate-200 flex flex-col gap-4 animate-in zoom-in-95 max-h-[90vh]"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Header del Modal */}
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div className="flex items-center gap-2.5">
                <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-indigo-100 text-indigo-700 font-bold">
                  <IconClipboard className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-sm font-bold text-slate-900 leading-tight">
                    Ficha Resumen de Estudio
                  </h3>
                  <span className="text-[11px] font-semibold text-indigo-600">
                    Tema: {threadTitle || 'General'}
                  </span>
                </div>
              </div>

              {/* Selector de Vistas y Botón Cerrar */}
              <div className="flex items-center gap-2">
                <div className="flex items-center bg-slate-100 p-0.5 rounded-xl border border-slate-200/80 text-[11px] font-semibold">
                  <button
                    type="button"
                    onClick={() => setSummaryViewMode('preview')}
                    className={`px-2.5 py-1 rounded-lg transition-all cursor-pointer ${
                      summaryViewMode === 'preview'
                        ? 'bg-white text-indigo-700 shadow-2xs font-bold'
                        : 'text-slate-500 hover:text-slate-800'
                    }`}
                  >
                    Lectura
                  </button>
                  <button
                    type="button"
                    onClick={() => setSummaryViewMode('raw')}
                    className={`px-2.5 py-1 rounded-lg transition-all cursor-pointer ${
                      summaryViewMode === 'raw'
                        ? 'bg-white text-indigo-700 shadow-2xs font-bold'
                        : 'text-slate-500 hover:text-slate-800'
                    }`}
                  >
                    Markdown
                  </button>
                </div>

                <button
                  type="button"
                  onClick={() => setShowSummaryModal(false)}
                  className="rounded-xl bg-slate-100 p-1.5 text-slate-500 hover:bg-slate-200 hover:text-slate-900 transition-colors text-xs font-bold cursor-pointer"
                >
                  ✕
                </button>
              </div>
            </div>

            {/* Vista Previa del Resumen (con selección de texto natural libre) */}
            <div className="rounded-2xl bg-slate-50 border border-slate-200 p-5 text-xs text-slate-800 leading-relaxed overflow-y-auto max-h-96 shadow-inner select-text">
              {summaryViewMode === 'preview' ? (
                <div className="flex flex-col gap-4">
                  <div className="border-b border-slate-200/80 pb-2">
                    <span className="text-[10px] font-bold text-indigo-600 uppercase tracking-wider block">
                      UniNav AI • Ficha Académica
                    </span>
                    <h2 className="text-base font-bold text-slate-900">
                      {threadTitle || 'Tema General'}
                    </h2>
                  </div>

                  {messages
                    .filter((m) => !m.id.startsWith('welcome') && m.role === 'model')
                    .map((msg, idx) => {
                      const cleanText = cleanConversationalChatter(msg.content)
                      return (
                        <div
                          key={msg.id || idx}
                          className="bg-white rounded-xl p-4 border border-slate-200/80 shadow-2xs flex flex-col gap-2"
                        >
                          <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">
                            Punto Clave #{idx + 1}
                          </span>
                          <FormattedChatMessage content={cleanText} />

                          {msg.citations && msg.citations.length > 0 && (
                            <div className="mt-2 pt-2 border-t border-slate-100 flex items-center gap-1.5 text-[11px] text-indigo-700 font-semibold flex-wrap">
                              <IconBook className="w-3.5 h-3.5 text-indigo-600" />
                              <span>Citas:</span>
                              {msg.citations.map((c, i) => (
                                <span
                                  key={i}
                                  className="bg-indigo-50 border border-indigo-200/70 px-1.5 py-0.5 rounded text-[10px]"
                                >
                                  Pág. {c.page_number ?? 'N/A'}
                                </span>
                              ))}
                            </div>
                          )}
                        </div>
                      )
                    })}
                </div>
              ) : (
                <pre className="font-mono text-[11px] whitespace-pre-wrap select-text text-slate-700">
                  {buildStudySummaryMarkdown(threadTitle, messages)}
                </pre>
              )}
            </div>

            {/* Botones de Acción */}
            <div className="flex items-center justify-between pt-3 border-t border-slate-100 gap-2 flex-wrap">
              <button
                type="button"
                onClick={() => window.print()}
                className="rounded-xl border border-slate-200 bg-white px-3.5 py-2 text-xs font-bold text-slate-700 hover:bg-slate-50 hover:text-slate-900 transition-colors flex items-center gap-1.5 cursor-pointer shadow-2xs"
              >
                <IconPrinter className="w-3.5 h-3.5 text-slate-500" />
                Imprimir / PDF
              </button>

              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={handleDownloadSummary}
                  className="rounded-xl border border-indigo-200 bg-indigo-50/70 px-3.5 py-2 text-xs font-bold text-indigo-700 hover:bg-indigo-100 transition-colors flex items-center gap-1.5 cursor-pointer shadow-2xs"
                >
                  <IconDownload className="w-3.5 h-3.5 text-indigo-600" />
                  Descargar (.md)
                </button>

                <button
                  type="button"
                  onClick={handleCopySummary}
                  className="rounded-xl bg-indigo-600 px-4 py-2 text-xs font-bold text-white shadow-2xs hover:bg-indigo-700 transition-colors flex items-center gap-1.5 cursor-pointer"
                >
                  <IconClipboard className="w-3.5 h-3.5" />
                  {copiedSummary ? '¡Ficha copiada! ✓' : 'Copiar Ficha Completa'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Modal Desplegable de Cita Bibliográfica y Visor PDF */}
      {activeCitationModal && (
        <div
          className="fixed inset-0 z-[9999] flex items-center justify-center bg-slate-900/75 backdrop-blur-xs p-3 sm:p-4 animate-in fade-in"
          onClick={() => setActiveCitationModal(null)}
        >
          <div
            className="w-full max-w-2xl sm:max-w-3xl max-h-[90vh] rounded-3xl bg-white p-5 sm:p-6 shadow-2xl border border-slate-200 flex flex-col gap-4 animate-in zoom-in-95 overflow-hidden"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Header del Modal */}
            <div className="flex items-center justify-between border-b border-slate-100 pb-3 shrink-0">
              <div className="flex items-center gap-2.5 min-w-0 flex-1">
                <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-indigo-100 text-indigo-700 shrink-0">
                  <IconBook className="w-5 h-5" />
                </div>
                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-2">
                    <h3 className="text-sm sm:text-base font-bold text-slate-900 leading-tight truncate">
                      {activeCitationModal.document_title || 'Bibliografía oficial'}
                    </h3>
                    <span className="shrink-0 text-[10px] font-black text-indigo-700 bg-indigo-100/90 border border-indigo-200 px-2 py-0.5 rounded-full font-mono">
                      Página {activeCitationModal.page_number ?? 1}
                    </span>
                  </div>
                  <span className="text-[11px] text-slate-500 block truncate">
                    Cita oficial indexada en la base de conocimientos de la cátedra
                  </span>
                </div>
              </div>

              <button
                type="button"
                onClick={() => setActiveCitationModal(null)}
                className="rounded-xl bg-slate-100 p-2 text-slate-500 hover:bg-slate-200 hover:text-slate-900 transition-colors text-xs font-bold cursor-pointer shrink-0 ml-2"
                title="Cerrar visor"
              >
                ✕
              </button>
            </div>

            {/* Pestañas de Vista (Texto vs PDF Integrado) */}
            {activeCitationModal.pdf_url && (
              <div className="flex items-center justify-between gap-2 border-b border-slate-100 pb-2.5 shrink-0">
                <div className="flex items-center gap-1.5 bg-slate-100 p-1 rounded-xl">
                  <button
                    type="button"
                    onClick={() =>
                      setActiveCitationModal((prev) => (prev ? { ...prev, view_mode: 'text' } : null))
                    }
                    className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                      activeCitationModal.view_mode !== 'pdf'
                        ? 'bg-white text-indigo-700 shadow-2xs'
                        : 'text-slate-600 hover:text-slate-900'
                    }`}
                  >
                    📝 Fragmento Textual
                  </button>
                  <button
                    type="button"
                    onClick={() =>
                      setActiveCitationModal((prev) => (prev ? { ...prev, view_mode: 'pdf' } : null))
                    }
                    className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                      activeCitationModal.view_mode === 'pdf'
                        ? 'bg-white text-indigo-700 shadow-2xs'
                        : 'text-slate-600 hover:text-slate-900'
                    }`}
                  >
                    📄 Visor PDF Oficial (Pág. {activeCitationModal.page_number ?? 1})
                  </button>
                </div>

                <a
                  href={`${activeCitationModal.pdf_url}#page=${activeCitationModal.page_number ?? 1}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-1 text-[11px] font-bold text-indigo-600 hover:text-indigo-800 transition-colors px-2 py-1 rounded-lg hover:bg-indigo-50"
                  title="Abrir PDF en pestaña separada"
                >
                  <span>Abrir en nueva pestaña</span>
                  <IconExternalLink className="w-3.5 h-3.5" />
                </a>
              </div>
            )}

            {/* Contenido Principal según el Modo */}
            <div className="flex-1 overflow-y-auto min-h-0">
              {activeCitationModal.loading ? (
                <div className="flex flex-col items-center justify-center gap-2 text-indigo-600 font-medium animate-pulse py-12">
                  <span className="h-3 w-3 rounded-full bg-indigo-600 animate-ping"></span>
                  <span className="text-xs font-bold">Cargando apunte original...</span>
                </div>
              ) : activeCitationModal.view_mode === 'pdf' && activeCitationModal.pdf_url ? (
                <div className="relative w-full h-[420px] sm:h-[480px] rounded-2xl border border-slate-200 overflow-hidden bg-slate-950 shadow-inner">
                  <iframe
                    src={`${activeCitationModal.pdf_url}#page=${activeCitationModal.page_number ?? 1}&toolbar=1`}
                    className="w-full h-full border-0"
                    title={`Página ${activeCitationModal.page_number} de ${activeCitationModal.document_title}`}
                  />
                </div>
              ) : (
                <div className="flex flex-col gap-3">
                  <div className="rounded-2xl bg-indigo-50/70 border border-indigo-100 p-4 sm:p-5 text-xs sm:text-sm text-slate-800 leading-relaxed font-sans shadow-inner max-h-[380px] overflow-y-auto">
                    <p className="whitespace-pre-wrap selection:bg-indigo-200">
                      {activeCitationModal.content}
                    </p>
                  </div>

                  {activeCitationModal.pdf_url && (
                    <div className="flex items-center justify-between rounded-xl bg-slate-50 border border-slate-200/80 p-3">
                      <div className="flex items-center gap-2">
                        <IconDocument className="w-4 h-4 text-indigo-600" />
                        <span className="text-xs text-slate-600 font-medium">
                          Podés ver la página completa en el visor interactivo de PDF
                        </span>
                      </div>
                      <button
                        type="button"
                        onClick={() =>
                          setActiveCitationModal((prev) => (prev ? { ...prev, view_mode: 'pdf' } : null))
                        }
                        className="text-xs font-bold text-indigo-600 hover:text-indigo-800 transition-colors cursor-pointer bg-white px-3 py-1.5 rounded-lg border border-indigo-200 shadow-2xs hover:bg-indigo-50"
                      >
                        Ver página {activeCitationModal.page_number ?? 1} en PDF ➔
                      </button>
                    </div>
                  )}
                </div>
              )}
            </div>

            {/* Footer del Modal */}
            <div className="flex items-center justify-between pt-3 border-t border-slate-100 shrink-0">
              <span className="text-[11px] text-emerald-700 font-bold flex items-center gap-1.5 bg-emerald-50 border border-emerald-200 px-2.5 py-1 rounded-full">
                <IconCheck className="w-3.5 h-3.5 text-emerald-600" />
                Fuente verificada por RAG socrático
              </span>

              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => {
                    navigator.clipboard.writeText(activeCitationModal.content)
                    alert('¡Fragmento copiado al portapapeles!')
                  }}
                  className="rounded-xl border border-slate-200 bg-white hover:bg-slate-50 px-3.5 py-2 text-xs font-bold text-slate-700 shadow-2xs transition-colors flex items-center gap-1.5 cursor-pointer"
                >
                  <IconClipboard className="w-3.5 h-3.5 text-slate-500" />
                  Copiar texto
                </button>

                <button
                  type="button"
                  onClick={() => setActiveCitationModal(null)}
                  className="rounded-xl bg-indigo-600 px-4 py-2 text-xs font-bold text-white shadow-2xs hover:bg-indigo-700 transition-colors cursor-pointer"
                >
                  Entendido
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

