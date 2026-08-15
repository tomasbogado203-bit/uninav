import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import RecursosView from './RecursosView'

const DEFAULT_GLOSSARY_TERMS = [
  {
    id: 'g1',
    term: 'Correlatividades',
    definition:
      'Materias que es obligatorio haber aprobado o regularizado previamente para poder cursar o rendir una materia de un cuatrimestre posterior.',
  },
  {
    id: 'g2',
    term: 'Promoción',
    definition:
      'Régimen de aprobación directa de una materia sin necesidad de rendir examen final. Se obtiene alcanzando una nota alta (habitualmente 7 o más) en los exámenes parciales y trabajos prácticos.',
  },
  {
    id: 'g3',
    term: 'Regularidad',
    definition:
      'Condición en la que queda el alumno tras aprobar los exámenes parciales de la cursada. Otorga el derecho a presentarse a rendir el Examen Final dentro de un plazo determinado (usualmente 2 a 3 años).',
  },
  {
    id: 'g4',
    term: 'Examen Final',
    definition:
      'Evaluación integradora e individual de toda la materia que debe rendirse ante un tribunal docente tras haber obtenido la condición de alumno regular.',
  },
  {
    id: 'g5',
    term: 'Cátedra',
    definition:
      'Equipo docente a cargo del dictado de una materia, encabezado por un Profesor Titular y acompañado por adjuntos y jefes de trabajos prácticos (JTP).',
  },
  {
    id: 'g6',
    term: 'Régimen de Cursada',
    definition:
      'Conjunto de reglas específicas de una materia sobre asistencias requeridas, fechas de parciales, recuperatorios y condiciones de aprobación.',
  },
  {
    id: 'g7',
    term: 'Recursar',
    definition:
      'Volver a cursar una materia desde cero en un cuatrimestre posterior por no haber alcanzado la condición de regular ni promovido.',
  },
  {
    id: 'g8',
    term: 'Trabajo Práctico (TP)',
    definition:
      'Instancia de aplicación práctica, laboratorio o informe en equipo requerido para evaluar los conocimientos aplicados de la asignatura.',
  },
  {
    id: 'g9',
    term: 'Mesa de Examen',
    definition:
      'Período o fecha específica fijada por la facultad en las llamadas "fechas de finales" (Febrero/Marzo, Julio/Agosto, Diciembre) para rendir examen final.',
  },
  {
    id: 'g10',
    term: 'Cuatrimestre',
    definition:
      'Período académico de dictado de clases que dura aproximadamente 16 semanas (1er cuatrimestre: Marzo-Julio; 2do cuatrimestre: Agosto-Diciembre).',
  },
  {
    id: 'g11',
    term: 'Recuperatorio',
    definition:
      'Instancia de evaluación alternativa para recuperar un examen parcial desaprobado o al que se estuvo ausente por causa justificada.',
  },
  {
    id: 'g12',
    term: 'SIU Guaraní',
    definition:
      'Sistema de gestión académica utilizado por la mayoría de las universidades nacionales argentinas para inscribirse a materias, exámenes finales y consultar la historia académica.',
  },
  {
    id: 'g13',
    term: 'Libre (Alumno Libre)',
    definition:
      'Condición del estudiante que desaprobó los parciales o no cumplió con la asistencia requerida. En algunas materias permite rendir un examen libre (escrito + oral integrador).',
  },
  {
    id: 'g14',
    term: 'Plan de Estudios',
    definition:
      'Estructura curricular oficial de la carrera que detalla las asignaturas por año/cuatrimestre, su carga horaria y el régimen de correlatividades.',
  },
  {
    id: 'g15',
    term: 'Créditos / Carga Horaria',
    definition:
      'Cantidad de horas reloj semanales o totales asignadas a una materia en el plan de estudios para computar la dedicación requerida.',
  },
]

export default async function RecursosPage() {
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

  const userCareerName = (profile?.careers as unknown as { name: string } | null)?.name

  const { data: resourcesData } = await supabase
    .from('career_resources')
    .select('*')
    .order('display_order', { ascending: true })

  const { data: glossaryData } = await supabase
    .from('glossary_terms')
    .select('*')
    .order('term', { ascending: true })

  const combinedGlossary =
    glossaryData && glossaryData.length > 0 ? glossaryData : DEFAULT_GLOSSARY_TERMS

  return (
    <RecursosView
      userCareerName={userCareerName}
      resources={resourcesData || []}
      glossary={combinedGlossary}
    />
  )
}
