'use client'

import { useState, useEffect } from 'react'
import { createThread, renameThreadAction, deleteThreadAction } from './actions'
import { IconChat, IconTrash, IconSparkles } from '@/components/icons'

interface Thread {
  id: string
  title: string
  created_at?: string
}

interface ThreadManagerProps {
  subjectId: string
  initialThreads: Thread[]
  activeThreadId?: string
  onSelectThread?: (threadId: string) => void
}

export default function ThreadManager({
  subjectId,
  initialThreads,
  activeThreadId,
  onSelectThread,
}: ThreadManagerProps) {
  const [threads, setThreads] = useState<Thread[]>(initialThreads)
  const [selectedId, setSelectedId] = useState<string | undefined>(
    activeThreadId || initialThreads[0]?.id
  )
  const [newTitle, setNewTitle] = useState('')
  const [editingId, setEditingId] = useState<string | null>(null)
  const [editTitle, setEditTitle] = useState('')
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    setThreads(initialThreads)
  }, [initialThreads])

  useEffect(() => {
    if (activeThreadId) {
      setSelectedId(activeThreadId)
    }
  }, [activeThreadId])

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!newTitle.trim() || loading) return

    const title = newTitle.trim()
    setNewTitle('')
    setLoading(true)

    const tempId = Date.now().toString()
    const tempThread: Thread = { id: tempId, title }
    const updated = [tempThread, ...threads]
    setThreads(updated)
    setSelectedId(tempId)
    onSelectThread?.(tempId)

    try {
      const formData = new FormData()
      formData.append('title', title)
      const realId = await createThread(subjectId, formData)
      if (realId) {
        setThreads((prev) =>
          prev.map((t) => (t.id === tempId ? { ...t, id: realId } : t))
        )
        setSelectedId(realId)
        onSelectThread?.(realId)
      }
    } catch {
      // Fallback local completado
    } finally {
      setLoading(false)
    }
  }

  const handleStartRename = (thread: Thread, e: React.MouseEvent) => {
    e.stopPropagation()
    setEditingId(thread.id)
    setEditTitle(thread.title)
  }

  const handleSaveRename = async (threadId: string) => {
    if (!editTitle.trim()) {
      setEditingId(null)
      return
    }

    const updatedTitle = editTitle.trim()
    setEditingId(null)

    setThreads((prev) =>
      prev.map((t) => (t.id === threadId ? { ...t, title: updatedTitle } : t))
    )

    try {
      await renameThreadAction(subjectId, threadId, updatedTitle)
    } catch {
      // Fallback local completado
    }
  }

  const handleDelete = async (threadId: string, e: React.MouseEvent) => {
    e.stopPropagation()
    if (!confirm('¿Seguro que deseas eliminar este tema de conversación?')) return

    const updated = threads.filter((t) => t.id !== threadId)
    setThreads(updated)

    if (selectedId === threadId) {
      const nextActive = updated[0]?.id || 'general'
      setSelectedId(nextActive)
      onSelectThread?.(nextActive)
    }

    try {
      await deleteThreadAction(subjectId, threadId)
    } catch {
      // Fallback local completado
    }
  }

  const handleSelect = (threadId: string) => {
    setSelectedId(threadId)
    onSelectThread?.(threadId)
  }

  return (
    <div className="flex flex-col gap-4">
      {/* Tarjeta de Creación de Tema */}
      <div className="rounded-2xl border border-slate-200/80 bg-white p-4 shadow-xs">
        <div className="flex items-center gap-1.5 mb-2">
          <IconSparkles className="w-3.5 h-3.5 text-indigo-600" />
          <h3 className="text-xs font-bold text-slate-800 uppercase tracking-wider">
            Crear nuevo tema
          </h3>
        </div>

        <form onSubmit={handleCreate} className="flex flex-col gap-2">
          <input
            type="text"
            value={newTitle}
            onChange={(e) => setNewTitle(e.target.value)}
            placeholder="Ej: Unidad 2 - Redes..."
            required
            className="w-full rounded-xl border border-slate-200 px-3 py-2 text-xs bg-slate-50 focus:bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all font-medium text-slate-800"
          />
          <button
            type="submit"
            disabled={loading || !newTitle.trim()}
            className="w-full rounded-xl bg-indigo-600 px-3 py-2 text-xs font-bold text-white shadow-xs hover:bg-indigo-700 disabled:opacity-50 transition-all cursor-pointer"
          >
            + Crear Tema
          </button>
        </form>
      </div>

      {/* Lista de Temas Activos */}
      <div className="flex flex-col gap-1.5 overflow-y-auto max-h-[480px] pr-1">
        <div className="flex items-center justify-between px-1 mb-1">
          <h3 className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">
            Temas activos ({threads.length})
          </h3>
        </div>

        {threads.map((t) => {
          const isSelected = selectedId === t.id
          const isEditing = editingId === t.id

          return (
            <div
              key={t.id}
              onClick={() => handleSelect(t.id)}
              className={`group rounded-xl border p-3 text-xs font-semibold cursor-pointer transition-all flex items-center justify-between gap-2 select-none ${
                isSelected
                  ? 'border-indigo-600 bg-indigo-50/70 text-indigo-900 shadow-2xs'
                  : 'border-slate-200/80 bg-white text-slate-700 hover:bg-slate-50 hover:border-slate-300'
              }`}
            >
              {isEditing ? (
                <div className="flex items-center gap-1.5 w-full" onClick={(e) => e.stopPropagation()}>
                  <input
                    type="text"
                    autoFocus
                    value={editTitle}
                    onChange={(e) => setEditTitle(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter') handleSaveRename(t.id)
                      if (e.key === 'Escape') setEditingId(null)
                    }}
                    className="w-full rounded-lg border border-indigo-500 bg-white px-2 py-1 text-xs text-slate-900 focus:outline-none"
                  />
                  <button
                    type="button"
                    onClick={() => handleSaveRename(t.id)}
                    className="rounded-md bg-indigo-600 text-white font-bold text-[10px] px-2 py-1 hover:bg-indigo-700"
                  >
                    ✓
                  </button>
                </div>
              ) : (
                <>
                  <div className="flex items-center gap-2 truncate">
                    <IconChat className={`w-4 h-4 shrink-0 ${isSelected ? 'text-indigo-600' : 'text-slate-400'}`} />
                    <span className="truncate">{t.title}</span>
                  </div>

                  <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                    <button
                      type="button"
                      onClick={(e) => handleStartRename(t, e)}
                      className="p-1 rounded-md text-slate-400 hover:text-indigo-600 hover:bg-indigo-100/60 transition-colors"
                      title="Renombrar tema"
                    >
                      ✎
                    </button>
                    <button
                      type="button"
                      onClick={(e) => handleDelete(t.id, e)}
                      className="p-1 rounded-md text-slate-400 hover:text-rose-600 hover:bg-rose-100/60 transition-colors"
                      title="Eliminar tema"
                    >
                      <IconTrash className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </>
              )}
            </div>
          )
        })}

        {threads.length === 0 && (
          <p className="text-xs text-slate-400 italic px-1 text-center py-4 bg-slate-50 rounded-xl border border-dashed border-slate-200">
            No hay temas creados aún.
          </p>
        )}
      </div>
    </div>
  )
}
