import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import FlashcardsView from './FlashcardsView'

export default async function TarjetasPage({
  params,
}: {
  params: Promise<{ subjectId: string }>
}) {
  const { subjectId } = await params
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

  // 1. Obtener temas creados en la materia
  const { data: threads } = await supabase
    .from('chat_threads')
    .select('id, title')
    .eq('subject_id', subjectId)
    .order('created_at', { ascending: false })

  const topics = threads?.map((t) => t.title) || []

  // 2. Obtener tarjetas guardadas
  let flashcards: any[] = []
  try {
    const { data: rawCards } = await supabase
      .from('flashcards')
      .select('id, subject_id, front_text, back_text, source_page, mastered')
      .eq('subject_id', subjectId)
      .order('created_at', { ascending: false })

    flashcards = rawCards || []
  } catch {
    flashcards = []
  }

  return (
    <div className="mx-auto max-w-[96rem] p-4 md:p-6">
      <FlashcardsView
        subjectId={subjectId}
        subjectName={subject?.name || 'Materia'}
        flashcards={flashcards}
        topics={topics}
      />
    </div>
  )
}
