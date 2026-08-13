'use server'

import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'

export async function completeOnboarding(formData: FormData) {
  const supabase = await createClient()

  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) redirect('/login')

  const careerId = formData.get('career_id') as string
  const fullName = formData.get('full_name') as string

  const { data: career } = await supabase
    .from('careers')
    .select('university')
    .eq('id', careerId)
    .single()

  const { error } = await supabase
    .from('profiles')
    .update({
      career_id: careerId,
      full_name: fullName,
      university: career?.university ?? null,
    })
    .eq('id', user.id)

  if (error) {
    throw new Error(error.message)
  }

  redirect('/')
}
