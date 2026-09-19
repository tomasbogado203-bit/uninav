'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import ThreadManager from './ThreadManager'
import SocraticChatView from './SocraticChatView'

interface Thread {
  id: string
  title: string
  created_at?: string
}

interface TemasWorkspaceProps {
  subjectId: string
  subjectName: string
  initialThreads: Thread[]
  initialThreadId?: string
}

export default function TemasWorkspace({
  subjectId,
  subjectName,
  initialThreads,
  initialThreadId,
}: TemasWorkspaceProps) {
  const router = useRouter()

  const [threads, setThreads] = useState<Thread[]>(initialThreads)
  const [activeThreadId, setActiveThreadId] = useState<string>(
    initialThreadId || initialThreads[0]?.id || 'general'
  )

  useEffect(() => {
    setThreads(initialThreads)
  }, [initialThreads])

  useEffect(() => {
    if (initialThreadId) {
      setActiveThreadId(initialThreadId)
    }
  }, [initialThreadId])

  const activeThread =
    threads.find((t) => t.id === activeThreadId) || {
      id: activeThreadId,
      title: threads.length > 0 ? threads[0].title : 'General',
    }

  const handleSelectThread = (threadId: string) => {
    setActiveThreadId(threadId)
    router.replace(`/materias/${subjectId}/temas?threadId=${threadId}`, { scroll: false })
  }

  return (
    <div className="grid grid-cols-1 lg:grid-cols-12 gap-5 h-full w-full flex-1 min-w-0 items-stretch">
      {/* Sidebar interna de gestor de temas */}
      <div className="lg:col-span-4 xl:col-span-3 flex flex-col h-full min-h-0 overflow-hidden border-b lg:border-b-0 lg:border-r border-slate-200/80 pr-0 lg:pr-4 pb-4 lg:pb-0">
        <ThreadManager
          subjectId={subjectId}
          initialThreads={threads}
          activeThreadId={activeThread.id}
          onSelectThread={handleSelectThread}
        />
      </div>

      {/* Panel del Chat Socrático vinculado al Tema Activo */}
      <div className="lg:col-span-8 xl:col-span-9 flex flex-col h-full min-h-0 min-w-0">
        <SocraticChatView
          key={activeThread.id}
          subjectId={subjectId}
          threadId={activeThread.id}
          threadTitle={activeThread.title}
        />
      </div>
    </div>
  )
}
