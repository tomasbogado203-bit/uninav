import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import CommunityView, { CommunityItem, UserSubject } from './CommunityView'

const SAMPLE_COMMUNITY_ITEMS: CommunityItem[] = [
  {
    id: 'c1',
    user_id: 'u_sample1',
    subject_name: 'Álgebra y Geometría Analítica',
    title: 'Receta de Fórmulas: Matrices, Determinantes y Espacios Vectoriales',
    description:
      'Resumen de 4 páginas con todas las propiedades de determinantes, autovalores, transformaciones lineales y trucos para no equivocarse en el cálculo.',
    resource_type: 'receta_formulas',
    file_url: '',
    upvotes_count: 38,
    downloads_count: 142,
    created_at: new Date(Date.now() - 1000 * 60 * 60 * 24 * 3).toISOString(),
  },
  {
    id: 'c2',
    user_id: 'u_sample2',
    subject_name: 'Análisis Matemático I',
    title: 'Primer Parcial 2025 Resuelto Paso a Paso (Tema A y B)',
    description:
      'Examen oficial del 1er cuatrimestre con límites indeterminados por LHopital, derivadas por definición y optimización de funciones.',
    resource_type: 'parcial_resuelto',
    file_url: '',
    upvotes_count: 45,
    downloads_count: 210,
    created_at: new Date(Date.now() - 1000 * 60 * 60 * 24 * 5).toISOString(),
  },
  {
    id: 'c3',
    user_id: 'u_sample3',
    subject_name: 'Algoritmos y Estructuras de Datos',
    title: 'Apunte Teórico Completo: Complejidad Asintótica Big-O y Punteros',
    description:
      'Guía conceptual con diagramas de memoria dinámica, listas enlazadas, árboles binarios y análisis de complejidad Big-O.',
    resource_type: 'apunte',
    file_url: '',
    upvotes_count: 29,
    downloads_count: 98,
    created_at: new Date(Date.now() - 1000 * 60 * 60 * 24 * 7).toISOString(),
  },
  {
    id: 'c4',
    user_id: 'u_sample4',
    subject_name: 'Física I / Mecánica Clásica',
    title: 'Resumen Integrador: Dinámica del Cuerpo Rígido y Leyes de Newton',
    description:
      'Hojas de fórmulas limpias de cinemática, trabajo y energía, choque elástico y momentos de inercia.',
    resource_type: 'resumen',
    file_url: '',
    upvotes_count: 22,
    downloads_count: 85,
    created_at: new Date(Date.now() - 1000 * 60 * 60 * 24 * 9).toISOString(),
  },
]

export default async function ComunidadPage() {
  const supabase = await createClient()

  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) redirect('/login')

  const { data: profile } = await supabase
    .from('profiles')
    .select('full_name, career_id, careers(name)')
    .eq('id', user.id)
    .single()

  const careerName = (profile?.careers as unknown as { name: string } | null)?.name || 'Universidad'

  // 1. Obtener materias del usuario para la función "Importar a mi materia"
  const { data: rawSubjects } = await supabase
    .from('subjects')
    .select('id, name')
    .eq('user_id', user.id)
    .order('name', { ascending: true })

  const userSubjects: UserSubject[] = rawSubjects || []

  // 2. Obtener aportes de la comunidad
  let contributions: CommunityItem[] = []
  try {
    const { data: contribsData } = await supabase
      .from('community_contributions')
      .select('*')
      .order('upvotes_count', { ascending: false })

    if (contribsData && contribsData.length > 0) {
      contributions = await Promise.all(
        contribsData.map(async (item) => {
          let signedUrl = null
          if (item.file_url) {
            const { data: signedData } = await supabase.storage
              .from('apuntes')
              .createSignedUrl(item.file_url, 3600)
            signedUrl = signedData?.signedUrl || null
          }

          return {
            id: item.id,
            user_id: item.user_id,
            subject_name: item.subject_name,
            title: item.title,
            description: item.description,
            resource_type: item.resource_type,
            file_url: item.file_url,
            signed_url: signedUrl,
            upvotes_count: item.upvotes_count || 0,
            downloads_count: item.downloads_count || 0,
            created_at: item.created_at,
          }
        })
      )
    } else {
      contributions = SAMPLE_COMMUNITY_ITEMS
    }
  } catch {
    contributions = SAMPLE_COMMUNITY_ITEMS
  }

  // 3. Obtener IDs de aportes ya votados por el usuario
  let userUpvotedIds: string[] = []
  try {
    const { data: votes } = await supabase
      .from('community_upvotes')
      .select('contribution_id')
      .eq('user_id', user.id)

    userUpvotedIds = (votes || []).map((v) => v.contribution_id)
  } catch {
    userUpvotedIds = []
  }

  return (
    <CommunityView
      careerName={careerName}
      contributions={contributions}
      userSubjects={userSubjects}
      userUpvotedIds={userUpvotedIds}
      currentUserId={user.id}
    />
  )
}
