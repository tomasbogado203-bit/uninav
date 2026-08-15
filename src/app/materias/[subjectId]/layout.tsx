import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import SubjectSidebar from './SubjectSidebar'
import { getOrUpdateStudyStreak } from '@/lib/supabase/streak'

export default async function SubjectLayout({
  children,
  params,
}: {
  children: React.ReactNode
  params: Promise<{ subjectId: string }>
}) {
  const { subjectId } = await params
  const supabase = await createClient()

  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) redirect('/login')

  const { data: profile } = await supabase
    .from('profiles')
    .select('full_name, university, careers(name)')
    .eq('id', user.id)
    .single()

  const careerName = (profile?.careers as unknown as { name: string } | null)?.name
  const streakInfo = await getOrUpdateStudyStreak(user.id)

  const { data: subject } = await supabase
    .from('subjects')
    .select('name')
    .eq('id', subjectId)
    .single()

  let chatThreads: { id: string; title: string }[] = []
  try {
    const { data: threadsData } = await supabase
      .from('chat_threads')
      .select('id, title')
      .eq('subject_id', subjectId)
      .order('created_at', { ascending: false })

    chatThreads = threadsData || []
  } catch {
    chatThreads = []
  }

  return (
    <div className="flex min-h-screen bg-slate-50 text-slate-900 font-sans antialiased">
      {/* Sidebar Fijo Estilo Gemini con Logo y Perfil del Alumno */}
      <SubjectSidebar
        subjectId={subjectId}
        subjectName={subject?.name || 'Materia'}
        chatThreads={chatThreads}
        userName={profile?.full_name || 'Estudiante'}
        careerName={careerName}
        streakDays={streakInfo.current_streak}
      />

      {/* Contenido Principal con Ancho Fijo y Cero Saltos */}
      <main className="flex-1 overflow-y-auto min-h-screen">
        {children}
      </main>
    </div>
  )
}
