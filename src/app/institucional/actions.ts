'use server'

import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'

export interface SubjectRiskItem {
  subject_name: string
  enrolled_students: number
  rag_engagement_rate: number
  simulated_pass_rate: number
  risk_level: 'ALTO' | 'MEDIO' | 'BAJO'
  drop_off_week: string
  bottleneck_concept: string
  risk_factors: string[]
}

export interface CareerRetentionItem {
  career: string
  students: number
  retention_rate: number
  drop_risk: 'BAJO' | 'MEDIO' | 'ALTO'
}

export interface HistoricalRetentionYear {
  year: string
  rate: number
  system: string
  status: string
}

export interface FacultyAnalyticsData {
  faculty_name: string
  academic_period: string
  total_students: number
  retention_rate_projected: number
  total_study_hours_iot: number
  critical_subjects_count: number
  subjects_risk: SubjectRiskItem[]
  career_breakdown: CareerRetentionItem[]
  historical_retention: HistoricalRetentionYear[]
  budget_efficiency: {
    students_retained_count: number
    estimated_savings_ars: number
    cost_per_student_regular: number
  }
  study_habits: {
    avg_daily_focus_hours: number
    peak_study_hours: string
    iot_active_percentage: number
  }
}

export async function getFacultyAnalyticsAction(): Promise<FacultyAnalyticsData> {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) redirect('/login')

  const { data: profile } = await supabase
    .from('profiles')
    .select('university')
    .eq('id', user.id)
    .single()

  const facultyName = profile?.university || 'Facultad de Ciencias Exactas e Ingeniería'

  const { count: studentCount } = await supabase
    .from('profiles')
    .select('*', { count: 'exact', head: true })

  const totalStudents = Math.max(studentCount || 0, 1840)

  const subjectsRisk: SubjectRiskItem[] = [
    {
      subject_name: 'Análisis Matemático I',
      enrolled_students: 540,
      rag_engagement_rate: 91,
      simulated_pass_rate: 54,
      risk_level: 'ALTO',
      drop_off_week: 'Semana 6 (Post-Primer Parcial de Integrales)',
      bottleneck_concept: 'Integrales por Fracciones Simples y Bolzano',
      risk_factors: ['74% con dudas en fracciones complejas', '42% rezago en guías de TP'],
    },
    {
      subject_name: 'Álgebra y Geometría Analítica',
      enrolled_students: 480,
      rag_engagement_rate: 82,
      simulated_pass_rate: 64,
      risk_level: 'MEDIO',
      drop_off_week: 'Semana 8 (Espacios Vectoriales)',
      bottleneck_concept: 'Transformaciones Lineales y Autovalores',
      risk_factors: ['Dificultad de abstracción en espacios vectoriales'],
    },
    {
      subject_name: 'Física I (Mecánica Clásica)',
      enrolled_students: 390,
      rag_engagement_rate: 76,
      simulated_pass_rate: 58,
      risk_level: 'ALTO',
      drop_off_week: 'Semana 7 (Dinámica de Rotación)',
      bottleneck_concept: 'Momento de Inercia y Torque',
      risk_factors: ['Rezago en laboratorios prácticos y cálculo vectorial previo'],
    },
    {
      subject_name: 'Algoritmos y Programación I',
      enrolled_students: 620,
      rag_engagement_rate: 95,
      simulated_pass_rate: 84,
      risk_level: 'BAJO',
      drop_off_week: 'Semana 11 (Recursividad y Punteros)',
      bottleneck_concept: 'Manejo Dinámico de Memoria',
      risk_factors: ['Alta adhesión a simulacros y resolución socrática'],
    },
    {
      subject_name: 'Química General e Inorgánica',
      enrolled_students: 310,
      rag_engagement_rate: 68,
      simulated_pass_rate: 73,
      risk_level: 'BAJO',
      drop_off_week: 'Semana 9 (Equilibrio Químico)',
      bottleneck_concept: 'Estequiometría y Termodinámica básica',
      risk_factors: ['Curva de rendimiento estable'],
    },
  ]

  const careerBreakdown: CareerRetentionItem[] = [
    {
      career: 'Ingeniería en Sistemas de Información',
      students: 680,
      retention_rate: 88.5,
      drop_risk: 'BAJO',
    },
    {
      career: 'Licenciatura en Ciencias de la Computación',
      students: 510,
      retention_rate: 86.2,
      drop_risk: 'BAJO',
    },
    {
      career: 'Ingeniería Electrónica',
      students: 360,
      retention_rate: 78.4,
      drop_risk: 'MEDIO',
    },
    {
      career: 'Ingeniería Mecánica',
      students: 290,
      retention_rate: 74.0,
      drop_risk: 'MEDIO',
    },
  ]

  const historicalRetention: HistoricalRetentionYear[] = [
    {
      year: '2024',
      rate: 51.2,
      system: 'Sin Acompañamiento Digital (Tradicional)',
      status: '48.8% Deserción en 1er Año',
    },
    {
      year: '2025',
      rate: 59.4,
      system: 'Aulas Moodle Estáticas',
      status: '40.6% Deserción en 1er Año',
    },
    {
      year: '2026 (Actual)',
      rate: 85.8,
      system: 'UniNav: Tutor Socrático RAG + Hardware IoT',
      status: '▲ +26.4% Retención Universitaria',
    },
  ]

  return {
    faculty_name: facultyName,
    academic_period: '1° Cuatrimestre 2026',
    total_students: totalStudents,
    retention_rate_projected: 85.8,
    total_study_hours_iot: 9420,
    critical_subjects_count: subjectsRisk.filter((s) => s.risk_level === 'ALTO').length,
    subjects_risk: subjectsRisk,
    career_breakdown: careerBreakdown,
    historical_retention: historicalRetention,
    budget_efficiency: {
      students_retained_count: 148,
      estimated_savings_ars: 25500000,
      cost_per_student_regular: 172300,
    },
    study_habits: {
      avg_daily_focus_hours: 2.8,
      peak_study_hours: '19:30 a 23:45 hs (Turno Noche y Pre-Examen)',
      iot_active_percentage: 72,
    },
  }
}
