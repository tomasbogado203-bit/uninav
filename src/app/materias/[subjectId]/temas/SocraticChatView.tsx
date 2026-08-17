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
}

interface SocraticChatViewProps {
  subjectId: string
  threadId?: string
  threadTitle?: string
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
  }

  const [messages, setMessages] = useState<Message[]>([defaultWelcome])
  const [input, setInput] = useState('')
  const [loading, setLoading] = useState(false)
  const [generatingDiagramId, setGeneratingDiagramId] = useState<string | null>(null)

  const [activeCitationModal, setActiveCitationModal] = useState<{
    page_number: number | null
    content: string
    document_title?: string
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

      // Enriquecer la consulta con el tema si está definido
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

    if (foundCitation && foundCitation.content) {
      setActiveCitationModal({
        page_number: foundCitation.page_number || pageNum,
        content: foundCitation.content,
        document_title: 'Bibliografía oficial',
      })
      return
    }

    setActiveCitationModal({
      page_number: pageNum,
      content: 'Cargando fragmento de la bibliografía...',
      loading: true,
    })

    try {
      const res = await getCitationContentAction(subjectId, pageNum)
      setActiveCitationModal({
        page_number: res.page_number,
        content: res.content,
        document_title: res.document_title,
        loading: false,
      })
    } catch {
      setActiveCitationModal({
        page_number: pageNum,
        content: 'No se pudo cargar el fragmento original.',
        loading: false,
      })
    }
  }

  return (
    <div className="flex flex-col h-[650px] border border-slate-200/80 rounded-2xl bg-white shadow-sm overflow-hidden relative">
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
        {messages.map((m) => (
          <div
            key={m.id}
            className={`flex flex-col max-w-[88%] ${
              m.role === 'user' ? 'self-end items-end' : 'self-start items-start'
            }`}
          >
            <div
              className={`rounded-2xl p-4 text-xs sm:text-sm leading-relaxed shadow-sm ${
                m.role === 'user'
                  ? 'bg-indigo-600 text-white rounded-tr-xs'
                  : 'bg-white text-slate-800 rounded-tl-xs border border-slate-200/80'
              }`}
            >
              {m.role === 'model' && (
                <div className="text-[10px] font-bold text-indigo-600 uppercase mb-1 tracking-wider flex items-center gap-1">
                  <IconSparkles className="w-3 h-3" />
                  UniNav AI (Tutor Socrático)
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
              <div className="w-full">
                <MermaidDiagram chart={m.mermaid_code} />
              </div>
            )}

            {/* Botón para generar diagrama */}
            {m.role === 'model' && !m.id.startsWith('welcome') && (
              <button
                type="button"
                disabled={generatingDiagramId === m.id}
                onClick={() => handleGenerateDiagram(m.id)}
                className="mt-1 text-[11px] text-indigo-600 hover:text-indigo-800 flex items-center gap-1.5 font-semibold hover:underline px-1 transition-colors disabled:opacity-50"
              >
                <IconChart className="w-3.5 h-3.5" />
                {generatingDiagramId === m.id
                  ? 'Generando esquema con IA...'
                  : m.mermaid_code
                  ? 'Regenerar diagrama Mermaid'
                  : 'Generar diagrama Mermaid'}
              </button>
            )}
          </div>
        ))}

        {/* Starter Prompts al iniciar conversación */}
        {messages.length === 1 && !loading && (
          <div className="my-2 flex flex-col gap-2 p-3.5 rounded-2xl bg-indigo-50/80 border border-indigo-100 animate-in fade-in">
            <span className="text-[11px] font-bold text-indigo-900 uppercase tracking-wider flex items-center gap-1.5">
              <IconLightbulb className="w-4 h-4 text-indigo-600" />
              Sugerencias de estudio para {threadTitle || 'este tema'}:
            </span>
            <div className="flex flex-wrap gap-2">
              {[
                `💡 Conceptos clave de ${threadTitle || 'este tema'}`,
                `❓ ¿Qué preguntas de examen surgen de este apunte?`,
                `📐 Armá una guía de estudio estructurada`,
              ].map((promptText, i) => (
                <button
                  key={i}
                  type="button"
                  onClick={() => handleSend(undefined, promptText)}
                  className="text-xs font-semibold text-indigo-800 bg-white hover:bg-indigo-600 hover:text-white border border-indigo-200 px-3.5 py-2 rounded-xl transition-all shadow-2xs cursor-pointer text-left active:scale-95"
                >
                  {promptText}
                </button>
              ))}
            </div>
          </div>
        )}

        {loading && (
          <div className="self-start bg-white text-slate-600 rounded-2xl p-4 text-xs border border-slate-200/80 shadow-sm animate-pulse flex items-center gap-2.5 font-medium">
            <span className="h-2.5 w-2.5 rounded-full bg-indigo-600 animate-ping"></span>
            Consultando bibliografía oficial y razonando socráticamente...
          </div>
        )}

        <div ref={chatEndRef} />
      </div>

      {/* Formulario de Entrada */}
      <form onSubmit={(e) => handleSend(e)} className="p-3.5 border-t border-slate-200/80 bg-white flex gap-2">
        <input
          type="text"
          value={input}
          onChange={(e) => setInput(e.target.value)}
          placeholder={`Escribí tu duda sobre ${threadTitle || 'el tema'}...`}
          disabled={loading}
          className="flex-1 rounded-xl border border-slate-200 px-4 py-2.5 text-xs sm:text-sm bg-slate-50 focus:bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all font-medium text-slate-900"
        />
        <button
          type="submit"
          disabled={loading || !input.trim()}
          className="rounded-xl bg-indigo-600 px-5 py-2.5 text-xs sm:text-sm font-semibold text-white shadow-sm hover:bg-indigo-700 disabled:opacity-50 transition-all shrink-0 cursor-pointer"
        >
          Enviar
        </button>
      </form>

      {/* Modal Desplegable de Cita Bibliográfica (z-[9999] Fixed Fullscreen Modal) */}
      {activeCitationModal && (
        <div
          className="fixed inset-0 z-[9999] flex items-center justify-center bg-slate-900/70 backdrop-blur-xs p-4 animate-in fade-in"
          onClick={() => setActiveCitationModal(null)}
        >
          <div
            className="w-full max-w-lg rounded-3xl bg-white p-6 shadow-2xl border border-slate-200 flex flex-col gap-4 animate-in zoom-in-95"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div className="flex items-center gap-2">
                <IconBook className="w-5 h-5 text-indigo-600" />
                <div>
                  <h3 className="text-sm font-bold text-slate-900 leading-tight">
                    Fragmento Bibliográfico Original
                  </h3>
                  <span className="text-[10px] font-semibold text-indigo-600">
                    {activeCitationModal.document_title || 'Bibliografía oficial'} • Página {activeCitationModal.page_number}
                  </span>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setActiveCitationModal(null)}
                className="rounded-xl bg-slate-100 p-1.5 text-slate-500 hover:bg-slate-200 hover:text-slate-900 transition-colors text-xs font-bold cursor-pointer"
              >
                ✕
              </button>
            </div>

            <div className="rounded-2xl bg-indigo-50/60 border border-indigo-100 p-4 text-xs text-slate-800 leading-relaxed max-h-72 overflow-y-auto font-sans shadow-inner">
              {activeCitationModal.loading ? (
                <div className="flex items-center gap-2 text-indigo-600 font-medium animate-pulse py-4 justify-center">
                  <span className="h-2 w-2 rounded-full bg-indigo-600 animate-ping"></span>
                  Cargando fragmento original de la bibliografía...
                </div>
              ) : (
                <p className="whitespace-pre-wrap">{activeCitationModal.content}</p>
              )}
            </div>

            <div className="flex items-center justify-between pt-2 border-t border-slate-100">
              <span className="text-[11px] text-emerald-700 font-bold flex items-center gap-1">
                ✓ Verificado en los apuntes de la materia
              </span>
              <button
                type="button"
                onClick={() => {
                  navigator.clipboard.writeText(activeCitationModal.content)
                  alert('¡Fragmento copiado al portapapeles!')
                }}
                className="rounded-xl bg-indigo-600 px-4 py-2 text-xs font-bold text-white shadow-2xs hover:bg-indigo-700 transition-colors cursor-pointer"
              >
                Copiar texto
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
