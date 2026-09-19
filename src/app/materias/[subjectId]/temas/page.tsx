import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import TemasWorkspace from './TemasWorkspace'

export default async function TemasPage({
  params,
  searchParams,
}: {
  params: Promise<{ subjectId: string }>
  searchParams: Promise<{ threadId?: string }>
}) {
  const { subjectId } = await params
  const { threadId } = await searchParams
  const supabase = await createClient()

  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) redirect('/login')

  const { data: subject } = await supabase
    .from('subjects')
    .select('name')
    .eq('id', subjectId)
    .single()

  const { data: threads } = await supabase
    .from('chat_threads')
    .select('id, title, created_at')
    .eq('subject_id', subjectId)
    .order('created_at', { ascending: false })

  return (
    <div className="w-full h-[calc(100vh-4rem)] p-3 sm:p-5 flex flex-col min-w-0">
      <TemasWorkspace
        subjectId={subjectId}
        subjectName={subject?.name || 'Materia'}
        initialThreads={threads || []}
        initialThreadId={threadId}
      />
    </div>
  )
}
