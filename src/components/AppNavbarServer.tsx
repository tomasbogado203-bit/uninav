import { createClient } from '@/lib/supabase/server'
import { cookies } from 'next/headers'
import GlobalNavbar from './GlobalNavbar'

export default async function AppNavbarServer() {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) return null

  const cookieStore = await cookies()
  const cookieRole = cookieStore.get('uninav_demo_role')?.value as
    | 'student'
    | 'professor'
    | 'dean'
    | 'admin'
    | undefined

  const { data: profile } = await supabase
    .from('profiles')
    .select('full_name, university, role')
    .eq('id', user.id)
    .single()

  const resolvedRole =
    cookieRole && ['student', 'professor', 'dean', 'admin'].includes(cookieRole)
      ? cookieRole
      : (profile?.role as 'student' | 'professor' | 'dean' | 'admin') || 'student'

  return (
    <GlobalNavbar
      userRole={resolvedRole}
      userName={profile?.full_name || 'Usuario'}
      universityName={profile?.university || 'Universidad'}
    />
  )
}
