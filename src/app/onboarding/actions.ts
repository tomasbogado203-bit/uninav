'use server'

import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import { cookies } from 'next/headers'

const VALID_TEACHER_CODES = [
  'DOCENTE-INCADE-2026',
  'DOCENTE2026',
  'CATEDRA2026',
  'INCADE2026',
  'PROF-INCADE-2026',
]
const VALID_DEAN_CODES = ['RECTOR-INCADE-2026', 'DECANO2026', 'AUTORIDAD2026']

export async function completeOnboarding(formData: FormData) {
  const supabase = await createClient()

  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) redirect('/login')

  const careerId = formData.get('career_id') as string
  const fullName = formData.get('full_name') as string
  const rawCode = (formData.get('institutional_code') as string || '').trim().toUpperCase()

  let assignedRole: 'student' | 'professor' | 'dean' = 'student'
  if (VALID_DEAN_CODES.includes(rawCode)) {
    assignedRole = 'dean'
  } else if (
    VALID_TEACHER_CODES.includes(rawCode) ||
    rawCode.startsWith('DOCENTE') ||
    rawCode.startsWith('PROF')
  ) {
    assignedRole = 'professor'
  }

  const { data: career } = await supabase
    .from('careers')
    .select('university')
    .eq('id', careerId)
    .single()

  try {
    const { error } = await supabase
      .from('profiles')
      .update({
        career_id: careerId,
        full_name: fullName,
        university: career?.university ?? null,
        role: assignedRole,
        institutional_code: rawCode || null,
      })
      .eq('id', user.id)

    if (error) {
      await supabase
        .from('profiles')
        .update({
          career_id: careerId,
          full_name: fullName,
          university: career?.university ?? null,
        })
        .eq('id', user.id)
    }
  } catch {
    // Fallback if schema doesn't yet have role
  }

  // Guardar en cookie de sesión si es profesor o decanato para acceso instantáneo
  if (assignedRole !== 'student') {
    const cookieStore = await cookies()
    cookieStore.set('uninav_demo_role', assignedRole, {
      path: '/',
      maxAge: 60 * 60 * 24 * 30, // 30 días
    })
  }

  if (assignedRole === 'professor') {
    redirect('/catedra')
  } else if (assignedRole === 'dean') {
    redirect('/institucional')
  } else {
    redirect('/')
  }
}

