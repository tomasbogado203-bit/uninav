import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'

export default async function GlobalCalendarioRedirect() {
  const supabase = await createClient()

  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) redirect('/login')

  // Obtener la primera materia del usuario para mostrar el calendario con el sidebar unificado
  const { data: subjects } = await supabase
    .from('subjects')
    .select('id')
    .eq('user_id', user.id)
    .order('name', { ascending: true })
    .limit(1)

  if (subjects && subjects.length > 0) {
    redirect(`/materias/${subjects[0].id}/calendario`)
  } else {
    redirect('/materias')
  }
}
