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
    <div className="mx-auto max-w-[96rem] p-6 md:p-8">
      <FlashcardsView
        subjectId={subjectId}
        subjectName={subject?.name || 'Materia'}
        flashcards={flashcards}
      />
    </div>
  )
}
