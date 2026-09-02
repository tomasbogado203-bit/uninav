import { createClient } from '@/lib/supabase/server'
import { cookies } from 'next/headers'
import { getOrUpdateStudyStreak } from '@/lib/supabase/streak'
import UnifiedAppSidebar, { SubjectItem } from './UnifiedAppSidebar'

interface AppShellServerProps {
  children: React.ReactNode
}

export default async function AppShellServer({ children }: AppShellServerProps) {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    return <>{children}</>
  }

  const cookieStore = await cookies()
  const cookieRole = cookieStore.get('uninav_demo_role')?.value as
    | 'student'
    | 'professor'
    | 'dean'
    | 'admin'
    | undefined

  const { data: profile } = await supabase
    .from('profiles')
    .select('full_name, university, role, careers(name)')
    .eq('id', user.id)
    .single()

  const careerName = (profile?.careers as unknown as { name: string } | null)?.name
  const resolvedRole =
    cookieRole && ['student', 'professor', 'dean', 'admin'].includes(cookieRole)
      ? cookieRole
      : (profile?.role as 'student' | 'professor' | 'dean' | 'admin') || 'student'

  const streakInfo = await getOrUpdateStudyStreak(user.id)

  let subjects: SubjectItem[] = []
  try {
    const { data: subjectsData } = await supabase
      .from('subjects')
      .select('id, name, color')
      .eq('user_id', user.id)
      .order('created_at', { ascending: true })

    subjects = subjectsData || []
  } catch {
    subjects = []
  }

  const defaultUserName =
    resolvedRole === 'dean'
      ? 'Decano / Autoridad'
      : resolvedRole === 'professor'
      ? 'Profesor de Cátedra'
      : 'Estudiante'

  return (
    <div className="flex min-h-screen bg-slate-50 text-slate-900 font-sans antialiased">
      <UnifiedAppSidebar
        userName={profile?.full_name || defaultUserName}
        careerName={careerName}
        universityName={profile?.university || 'Universidad'}
        userRole={resolvedRole}
        streakDays={streakInfo.current_streak}
        subjects={subjects}
      />
      <main className="flex-1 overflow-y-auto overflow-x-hidden min-h-screen min-w-0 w-full">
        {children}
      </main>
    </div>
  )

}
