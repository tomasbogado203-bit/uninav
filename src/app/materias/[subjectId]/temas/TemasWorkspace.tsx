'use client'

import { useState, useEffect } from 'react'
import { useSearchParams, useRouter } from 'next/navigation'
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
}

export default function TemasWorkspace({
  subjectId,
  subjectName,
  initialThreads,
}: TemasWorkspaceProps) {
  const searchParams = useSearchParams()
  const router = useRouter()
  const paramThreadId = searchParams.get('threadId')

  const [threads, setThreads] = useState<Thread[]>(initialThreads)
  const [activeThreadId, setActiveThreadId] = useState<string>(
    paramThreadId || initialThreads[0]?.id || 'general'
  )

  useEffect(() => {
    setThreads(initialThreads)
  }, [initialThreads])

  useEffect(() => {
    if (paramThreadId) {
      setActiveThreadId(paramThreadId)
    }
  }, [paramThreadId])

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
    <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
      {/* Sidebar interna de gestor de temas */}
      <div className="md:col-span-1 border-r border-slate-200/80 pr-4">
        <ThreadManager
          subjectId={subjectId}
          initialThreads={threads}
          activeThreadId={activeThread.id}
          onSelectThread={handleSelectThread}
        />
      </div>

      {/* Panel del Chat Socrático vinculado al Tema Activo */}
      <div className="md:col-span-3">
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
