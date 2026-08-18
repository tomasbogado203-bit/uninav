import { createClient } from '@/lib/supabase/server'
import SubjectProgressPanel, { SubjectMetrics } from '@/components/SubjectProgressPanel'
import DocumentsWorkspace, { DocumentItem } from './DocumentsWorkspace'

export default async function SubjectPage({
  params,
}: {
  params: Promise<{ subjectId: string }>
}) {
  const { subjectId } = await params
  const supabase = await createClient()

  const { data: subject } = await supabase
    .from('subjects')
    .select('name, color')
    .eq('id', subjectId)
    .single()

  // 1. Apuntes y Chunks
  const { data: documentsData } = await supabase
    .from('documents')
    .select('id, title, file_url, document_type, created_at, document_chunks(count)')
    .eq('subject_id', subjectId)
    .order('created_at', { ascending: false })

  let totalChunks = 0
  const formattedDocs: DocumentItem[] = []

  if (documentsData) {
    for (const d of documentsData) {
      const count = (d.document_chunks as unknown as { count: number }[])?.[0]?.count ?? 0
      totalChunks += count

      let signedUrl: string | null = null
      if (d.file_url) {
        try {
          const { data: signedData } = await supabase.storage
            .from('apuntes')
            .createSignedUrl(d.file_url, 60 * 60) // 1 hora de validez
          signedUrl = signedData?.signedUrl || null
        } catch {
          signedUrl = null
        }
      }

      formattedDocs.push({
        id: d.id,
        title: d.title,
        document_type: d.document_type as 'apunte' | 'examen_viejo',
        file_url: d.file_url,
        signed_url: signedUrl,
        created_at: d.created_at,
        chunk_count: count,
      })
    }
  }

  // 2. Chat Threads (Tutor Socrático)
  const { count: threadsCount } = await supabase
    .from('chat_threads')
    .select('*', { count: 'exact', head: true })
    .eq('subject_id', subjectId)

  // 3. Quiz Attempts & Average Score
  let quizAttemptsCount = 0
  let averageScore = 0
  try {
    const { data: quizzes } = await supabase
      .from('quizzes')
      .select('id, quiz_attempts(score)')
      .eq('subject_id', subjectId)

    let totalScore = 0
    quizzes?.forEach((q) => {
      const attempts = (q.quiz_attempts as unknown as { score: number }[]) || []
      quizAttemptsCount += attempts.length
      attempts.forEach((a) => (totalScore += a.score))
    })

    if (quizAttemptsCount > 0) {
      averageScore = Math.round(totalScore / quizAttemptsCount)
    }
  } catch {
    // Ignorar errores en la consulta de quizes
  }

  // 4. Fotos de Pizarra
  let photosCount = 0
  try {
    const { count } = await supabase
      .from('board_photos')
      .select('*', { count: 'exact', head: true })
      .eq('subject_id', subjectId)

    photosCount = count || 0
  } catch {
    photosCount = 0
  }

  // 5. Próximo Examen Agendado
  const todayStr = new Date().toISOString().split('T')[0]
  let nextEvent: any = null
  try {
    const { data: upcomingEvents } = await supabase
      .from('academic_events')
      .select('title, event_type, event_date')
      .eq('subject_id', subjectId)
      .gte('event_date', todayStr)
      .order('event_date', { ascending: true })
      .limit(1)

    nextEvent = upcomingEvents?.[0] || null
  } catch {
    nextEvent = null
  }

  const metrics: SubjectMetrics = {
    documentsCount: formattedDocs.length,
    chunksCount: totalChunks,
    threadsCount: threadsCount ?? 0,
    quizAttemptsCount,
    averageScore,
    photosCount,
    nextEventTitle: nextEvent?.title,
    nextEventDate: nextEvent?.event_date,
    nextEventType: nextEvent?.event_type,
  }

  return (
    <div className="mx-auto max-w-[96rem] p-4 md:p-6 flex flex-col gap-6">
      {/* Panel de Diagnóstico "Dónde estoy parado" */}
      <SubjectProgressPanel
        subjectName={subject?.name || 'Materia'}
        metrics={metrics}
      />

      {/* Gestor Moderno de Apuntes e Indexación RAG */}
      <DocumentsWorkspace
        subjectId={subjectId}
        subjectName={subject?.name || 'Materia'}
        documents={formattedDocs}
      />
    </div>
  )
}
