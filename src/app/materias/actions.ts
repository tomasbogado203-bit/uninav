'use server'

import { createClient } from '@/lib/supabase/server'
import { revalidatePath } from 'next/cache'
import { redirect } from 'next/navigation'

export async function createSubject(formData: FormData) {
  const supabase = await createClient()

  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) redirect('/login')

  const name = formData.get('name') as string

  if (!name || name.trim() === '') {
    throw new Error('El nombre de la materia es requerido')
  }

  const { error } = await supabase.from('subjects').insert({
    user_id: user.id,
    name: name.trim(),
  })

  if (error) {
    throw new Error(error.message)
  }

  revalidatePath('/materias')
}

export async function deleteSubject(subjectId: string) {
  const supabase = await createClient()

  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) redirect('/login')

  // 1. Obtener documentos asociados a la materia para limpiar archivos en Storage
  const { data: documents } = await supabase
    .from('documents')
    .select('file_url')
    .eq('subject_id', subjectId)
    .eq('user_id', user.id)

  if (documents && documents.length > 0) {
    const filePaths = documents.map((d) => d.file_url).filter(Boolean)
    if (filePaths.length > 0) {
      await supabase.storage.from('apuntes').remove(filePaths)
    }
  }

  // 2. Eliminar registro de la materia (ON DELETE CASCADE elimina sub-recursos)
  const { error } = await supabase
    .from('subjects')
    .delete()
    .eq('id', subjectId)
    .eq('user_id', user.id)

  if (error) {
    throw new Error(error.message)
  }

  revalidatePath('/materias')
}
