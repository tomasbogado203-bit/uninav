'use client'

import { useState, useEffect } from 'react'
import { askSocraticTutor } from './actions'

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
}

const DEFAULT_WELCOME: Message = {
  id: 'welcome',
  role: 'model',
  content:
    '¡Hola! Soy **UniNav AI**, tu tutor socrático. Hacé tu consulta sobre la materia y te guiaré analizando los apuntes cargados.',
}

export default function SocraticChatView({ subjectId }: { subjectId: string }) {
  const [messages, setMessages] = useState<Message[]>([DEFAULT_WELCOME])
  const [input, setInput] = useState('')
  const [loading, setLoading] = useState(false)
  const [diagramMessage, setDiagramMessage] = useState<string | null>(null)

  // Cargar historial persistido de localStorage al cargar la página
  useEffect(() => {
    try {
      const saved = localStorage.getItem(`uninav_chat_${subjectId}`)
      if (saved) {
        const parsed = JSON.parse(saved)
        if (Array.isArray(parsed) && parsed.length > 0) {
          setMessages(parsed)
        }
      }
    } catch {
      // Ignorar errores en entornos sin localStorage
    }
  }, [subjectId])

  // Helper para actualizar estado y sincronizar con localStorage
  const updateMessages = (newMessages: Message[]) => {
    setMessages(newMessages)
    try {
      localStorage.setItem(`uninav_chat_${subjectId}`, JSON.stringify(newMessages))
    } catch {
      // Ignorar cuotas de disco o errores de localStorage
    }
  }

  const handleSend = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!input.trim() || loading) return

    const userText = input.trim()
    setInput('')

    const userMsg: Message = {
      id: Date.now().toString(),
      role: 'user',
      content: userText,
    }

    const updatedWithUser = [...messages, userMsg]
    updateMessages(updatedWithUser)
    setLoading(true)

    try {
      const historyForApi = updatedWithUser
        .filter((m) => m.id !== 'welcome')
        .map((m) => ({ role: m.role, content: m.content }))

      const res = await askSocraticTutor(subjectId, userText, historyForApi)

      const modelMsg: Message = {
        id: (Date.now() + 1).toString(),
        role: 'model',
        content: res.response,
        citations: res.citations,
      }

      updateMessages([...updatedWithUser, modelMsg])
    } catch (err) {
      const errorMsg: Message = {
        id: (Date.now() + 1).toString(),
        role: 'model',
        content:
          err instanceof Error
            ? `⚠️ Error: ${err.message}`
            : '⚠️ Ocurrió un error al procesar tu consulta.',
      }
      updateMessages([...updatedWithUser, errorMsg])
    } finally {
      setLoading(false)
    }
  }

  const handleClearChat = () => {
    updateMessages([DEFAULT_WELCOME])
  }

  const handleGenerateDiagram = (msgContent: string) => {
    setDiagramMessage(
      `Generador Mermaid listo (Módulo D). Contexto enviado: "${msgContent.slice(0, 80)}..."`
    )
    setTimeout(() => setDiagramMessage(null), 4000)
  }

  return (
    <div className="flex flex-col h-[600px] border border-slate-200/80 rounded-2xl bg-white shadow-sm overflow-hidden">
      {/* Header del Chat */}
      <div className="border-b border-slate-200/80 px-5 py-3.5 bg-slate-50/80 flex items-center justify-between">
        <div className="flex items-center gap-2.5">
          <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-indigo-100 text-indigo-700 font-bold text-xs">
            ✨
          </div>
          <div>
            <h2 className="text-xs font-bold text-slate-800 tracking-tight">Tutor Socrático RAG</h2>
            <p className="text-[11px] text-slate-500">
              Consultas basadas exclusivamente en la bibliografía de tu materia.
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          {messages.length > 1 && (
            <button
              type="button"
              onClick={handleClearChat}
              className="text-[11px] font-medium text-slate-400 hover:text-rose-600 transition-colors px-2 py-1 rounded-md hover:bg-rose-50"
              title="Borrar conversación actual"
            >
              🗑️ Limpiar chat
            </button>
          )}
          <span className="text-[11px] bg-emerald-50 text-emerald-700 border border-emerald-200/60 px-2.5 py-0.5 rounded-full font-semibold">
            ● Activo
          </span>
        </div>
      </div>

      {/* Notificación de Diagrama */}
      {diagramMessage && (
        <div className="bg-indigo-50/90 text-indigo-900 px-4 py-2 text-xs border-b border-indigo-100 flex items-center gap-2">
          <span>📊</span> {diagramMessage}
        </div>
      )}

      {/* Lista de Mensajes */}
      <div className="flex-1 p-5 overflow-y-auto flex flex-col gap-4 bg-slate-50/40">
        {messages.map((m) => (
          <div
            key={m.id}
            className={`flex flex-col max-w-[85%] ${
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
                  ✨ UniNav AI (Tutor Socrático)
                </div>
              )}
              <div className="whitespace-pre-wrap">{m.content}</div>

              {/* Citas de la bibliografía */}
              {m.citations && m.citations.length > 0 && (
                <div className="mt-3 pt-2.5 border-t border-slate-100 text-xs text-slate-600">
                  <span className="font-semibold text-slate-700 block mb-1 text-[11px]">
                    📚 Citas bibliográficas utilizadas:
                  </span>
                  <ul className="flex flex-wrap gap-1.5">
                    {m.citations.map((c, i) => (
                      <li
                        key={i}
                        className="bg-indigo-50 border border-indigo-100 text-indigo-700 rounded-lg px-2 py-0.5 text-[11px] font-medium"
                        title={c.content.slice(0, 150)}
                      >
                        Pág. {c.page_number ?? 'N/A'}
                      </li>
                    ))}
                  </ul>
                </div>
              )}
            </div>

            {/* Botón para generar diagrama (Regla 6: manual, debajo del mensaje) */}
            {m.role === 'model' && m.id !== 'welcome' && (
              <button
                type="button"
                onClick={() => handleGenerateDiagram(m.content)}
                className="mt-1 text-[11px] text-slate-400 hover:text-indigo-600 flex items-center gap-1 hover:underline px-1 font-medium transition-colors"
              >
                📊 Generar diagrama Mermaid
              </button>
            )}
          </div>
        ))}

        {loading && (
          <div className="self-start bg-white text-slate-500 rounded-2xl p-4 text-xs border border-slate-200/80 shadow-sm animate-pulse flex items-center gap-2">
            <span className="h-2 w-2 rounded-full bg-indigo-500 animate-ping"></span>
            Consultando apuntes y analizando socráticamente...
          </div>
        )}
      </div>

      {/* Formulario de Entrada */}
      <form onSubmit={handleSend} className="p-3.5 border-t border-slate-200/80 bg-white flex gap-2">
        <input
          type="text"
          value={input}
          onChange={(e) => setInput(e.target.value)}
          placeholder="Escribí tu duda o pregunta sobre el tema..."
          disabled={loading}
          className="flex-1 rounded-xl border border-slate-200 px-4 py-2.5 text-xs sm:text-sm bg-slate-50 focus:bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all"
        />
        <button
          type="submit"
          disabled={loading || !input.trim()}
          className="rounded-xl bg-indigo-600 px-5 py-2.5 text-xs sm:text-sm font-semibold text-white shadow-sm hover:bg-indigo-700 disabled:opacity-50 transition-all shrink-0"
        >
          Enviar
        </button>
      </form>
    </div>
  )
}
