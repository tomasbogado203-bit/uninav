import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import PizarraView from './PizarraView'

export default async function PizarraPage({
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

  // 1. Obtener fotos de pizarra guardadas
  let photos: any[] = []
  try {
    const { data: photosData } = await supabase
      .from('board_photos')
      .select('id, photo_url, class_date, ocr_text, ocr_status, created_at')
      .eq('subject_id', subjectId)
      .order('created_at', { ascending: false })

    if (photosData && photosData.length > 0) {
      photos = await Promise.all(
        photosData.map(async (p) => {
          let signedUrl = null
          if (p.photo_url) {
            const { data: signedData } = await supabase.storage
              .from('apuntes')
              .createSignedUrl(p.photo_url, 3600)
            signedUrl = signedData?.signedUrl || null
          }
          return {
            ...p,
            signed_url: signedUrl,
          }
        })
      )
    }
  } catch {
    photos = []
  }

  // 2. Obtener eventos detectados pendientes (confirmed = false)
  let pendingEvents: any[] = []
  try {
    const { data: eventsData } = await supabase
      .from('detected_events')
      .select(
        'id, suggested_title, suggested_type, suggested_date, confirmed, board_photo_id, board_photos!inner(subject_id)'
      )
      .eq('confirmed', false)
      .eq('board_photos.subject_id', subjectId)

    pendingEvents = eventsData || []
  } catch {
    pendingEvents = []
  }

  return (
    <div className="mx-auto max-w-[96rem] p-4 md:p-6">
      {/* Vista Principal de Pizarra */}
      <PizarraView
        subjectId={subjectId}
        photos={photos}
        pendingEvents={pendingEvents}
      />
    </div>
  )
}
