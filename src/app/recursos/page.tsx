import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import RecursosView, { CareerResource } from './RecursosView'

const DEFAULT_CAREER_RESOURCES: CareerResource[] = [
  {
    id: 'cr1',
    tool_name: 'Overleaf & LaTeX',
    category: 'software',
    tag: '100% Gratis',
    description:
      'Editor online colaborativo en tiempo real para redactar informes, fórmulas matemáticas, tesis y trabajos prácticos con formato profesional estándar IEEE / APA.',
    quickstart_url: 'https://es.overleaf.com/learn',
    download_url: 'https://www.overleaf.com/',
    display_order: 1,
  },
  {
    id: 'cr2',
    tool_name: 'Visual Studio Code',
    category: 'software',
    tag: 'Open Source',
    description:
      'El editor de código estándar en la industria. Imprescindible para carreras de programación, informática, ciencia de datos e ingeniería.',
    quickstart_url: 'https://code.visualstudio.com/docs',
    download_url: 'https://code.visualstudio.com/',
    display_order: 2,
  },
  {
    id: 'cr3',
    tool_name: 'GeoGebra Suite',
    category: 'software',
    tag: '100% Gratis',
    description:
      'Calculadora gráfica interactiva 2D y 3D, álgebra lineal, cálculo diferencial y geometría dinámica. Clave para Matemática 1, Análisis Matemático y Álgebra.',
    quickstart_url: 'https://www.geogebra.org/learn',
    download_url: 'https://www.geogebra.org/download',
    display_order: 3,
  },
  {
    id: 'cr4',
    tool_name: 'Zotero',
    category: 'software',
    tag: 'Open Source',
    description:
      'Asistente personal de investigación y gestor de citas bibliográficas gratuito. Recolecta fuentes, genera citas en formato APA/IEEE con 1 clic en Word o Google Docs.',
    quickstart_url: 'https://www.zotero.org/support/quick_start_guide',
    download_url: 'https://www.zotero.org/download/',
    display_order: 4,
  },
  {
    id: 'cr5',
    tool_name: 'Obsidian',
    category: 'software',
    tag: '100% Gratis',
    description:
      'Base de conocimiento personal basada en archivos Markdown locales y mapas mentales interconectados. Ideal para toma de apuntes estructurados por materia.',
    quickstart_url: 'https://help.obsidian.md/',
    download_url: 'https://obsidian.md/download',
    display_order: 5,
  },
  {
    id: 'cr6',
    tool_name: 'GitHub Student Developer Pack',
    category: 'plantilla',
    tag: 'Plan Estudiantil',
    description:
      'Paquete gratuito con beneficios valorados en miles de dólares para estudiantes (GitHub Copilot gratis, Canva Pro, dominios gratis y créditos cloud).',
    quickstart_url: 'https://education.github.com/pack',
    download_url: 'https://education.github.com/pack',
    display_order: 6,
  },
  {
    id: 'cr7',
    tool_name: 'Anki Flashcards',
    category: 'software',
    tag: 'Open Source',
    description:
      'Software de repetición espaciada (SRS) y tarjetas didácticas para memorizar definiciones, teoremas, fórmulas y anatomía con retención a largo plazo.',
    quickstart_url: 'https://docs.ankiweb.net/',
    download_url: 'https://apps.ankiweb.net/',
    display_order: 7,
  },
  {
    id: 'cr8',
    tool_name: 'Desmos Graphing Calculator',
    category: 'software',
    tag: 'Web Gratis',
    description:
      'Graficadora online ultra rápida para graficar funciones, derivadas, integrales y tablas de valores de manera visual y didáctica.',
    quickstart_url: 'https://www.desmos.com/calculator',
    download_url: 'https://www.desmos.com/calculator',
    display_order: 8,
  },
  {
    id: 'cr9',
    tool_name: 'Draw.io / Diagrams.net',
    category: 'plantilla',
    tag: 'Open Source',
    description:
      'Herramienta gratuita para diagramas de flujo, arquitectura de software, diagramas UML, circuitos y mapas conceptuales.',
    quickstart_url: 'https://www.drawio.com/doc/',
    download_url: 'https://app.diagrams.net/',
    display_order: 9,
  },
]

const DEFAULT_GLOSSARY_TERMS = [
  {
    id: 'g1',
    term: 'Correlatividades',
    definition:
      'Materias que es obligatorio haber aprobado o regularizado previamente para poder cursar o rendir una materia de un cuatrimestre posterior.',
  },
  {
    id: 'g2',
    term: 'Promoción Directa',
    definition:
      'Régimen de aprobación de una materia sin necesidad de rendir examen final. Se obtiene alcanzando una nota alta (habitualmente 7 o más) en los exámenes parciales y trabajos prácticos.',
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
      'Equipo docente a cargo del dictado de una materia, encabezado por un Profesor Titular y acompañado por profesores adjuntos y jefes de trabajos prácticos (JTP).',
  },
  {
    id: 'g6',
    term: 'Régimen de Cursada',
    definition:
      'Conjunto de reglas específicas de una materia sobre porcentaje de asistencias requeridas, fechas de parciales, recuperatorios y condiciones de aprobación.',
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
      'Período o fecha específica fijada por la facultad en los turnos de exámenes finales (Febrero/Marzo, Julio/Agosto, Diciembre) para rendir examen final.',
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
      'Sistema de gestión académica utilizado por la mayoría de las universidades nacionales argentinas para inscribirse a materias, exámenes finales y consultar la historia académica oficial.',
  },
  {
    id: 'g13',
    term: 'Libre (Condición Libre)',
    definition:
      'Condición del estudiante que desaprobó los parciales o no cumplió con la asistencia requerida. En algunas materias permite rendir un examen libre (escrito eliminatorio + oral integrador).',
  },
  {
    id: 'g14',
    term: 'Plan de Estudios',
    definition:
      'Estructura curricular oficial de la carrera que detalla las asignaturas por año/cuatrimestre, su carga horaria y el régimen de correlatividades obligatorias.',
  },
  {
    id: 'g15',
    term: 'Créditos / Carga Horaria',
    definition:
      'Cantidad de horas reloj semanales o totales asignadas a una materia en el plan de estudios para computar la dedicación requerida.',
  },
]

export default async function RecursosPage({
  searchParams,
}: {
  searchParams?: Promise<{ tab?: string }>
}) {
  const resolvedParams = searchParams ? await searchParams : {}
  const initialTab = resolvedParams.tab === 'glosario' ? 'glosario' : 'herramientas'

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

  let combinedResources = DEFAULT_CAREER_RESOURCES
  try {
    const { data: resourcesData } = await supabase
      .from('career_resources')
      .select('*')
      .order('display_order', { ascending: true })

    if (resourcesData && resourcesData.length > 0) {
      combinedResources = resourcesData
    }
  } catch {
    combinedResources = DEFAULT_CAREER_RESOURCES
  }

  let combinedGlossary = DEFAULT_GLOSSARY_TERMS
  try {
    const { data: glossaryData } = await supabase
      .from('glossary_terms')
      .select('*')
      .order('term', { ascending: true })

    if (glossaryData && glossaryData.length > 0) {
      combinedGlossary = glossaryData
    }
  } catch {
    combinedGlossary = DEFAULT_GLOSSARY_TERMS
  }

  return (
    <RecursosView
      userCareerName={userCareerName}
      resources={combinedResources}
      glossary={combinedGlossary}
      initialTab={initialTab}
    />
  )
}
