import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import IoTCompanionView from './IoTCompanionView'

export default async function IoTPage() {
  const supabase = await createClient()

  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) redirect('/login')

  return <IoTCompanionView />
}
