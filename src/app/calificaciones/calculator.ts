export type GradeStatus =
  | 'en_curso'
  | 'promocionada'
  | 'regular'
  | 'a_recuperatorio'
  | 'libre'
  | 'aprobada_final'

export interface AcademicGradeItem {
  id: string
  subject_name: string
  subject_id?: string | null
  academic_year: number
  year_level: number // 1 = 1° Año, 2 = 2° Año, 3 = 3° Año, etc.
  term: string // '1° Cuatrimestre', '2° Cuatrimestre', 'Anual'
  partial_1_grade: number | null
  partial_2_grade: number | null
  partial_3_grade?: number | null
  recuperatorio_1_grade: number | null
  recuperatorio_2_grade: number | null
  tp_average: number | null
  attendance_percentage: number
  final_exam_grade: number | null
  promotion_min_grade: number
  regular_min_grade: number
  status: GradeStatus
  notes?: string | null
  calculated_average: number | null
  required_p2_promotion: number | null
  required_p2_regular: number | null
}

export interface GradesSummaryData {
  student_name: string
  career_name: string
  university_name: string
  overall_gpa: number
  approved_subjects_count: number
  total_subjects_count: number
  promoted_count: number
  in_progress_count: number
  at_risk_count: number
  current_year_level: number
  grades: AcademicGradeItem[]
}

export function computeGradeCondition(item: Partial<AcademicGradeItem>): {
  status: GradeStatus
  calculated_average: number | null
  required_p2_promotion: number | null
  required_p2_regular: number | null
} {
  const p1 = item.recuperatorio_1_grade ?? item.partial_1_grade ?? null
  const p2 = item.recuperatorio_2_grade ?? item.partial_2_grade ?? null
  const finalGrade = item.final_exam_grade ?? null
  const attendance = item.attendance_percentage ?? 85
  const promoMin = item.promotion_min_grade ?? 7.0
  const regularMin = item.regular_min_grade ?? 4.0

  // Si ya tiene final aprobado
  if (finalGrade !== null && finalGrade >= regularMin) {
    return {
      status: 'aprobada_final',
      calculated_average: finalGrade,
      required_p2_promotion: null,
      required_p2_regular: null,
    }
  }

  // Falta de asistencia
  if (attendance < 75) {
    return {
      status: 'libre',
      calculated_average: p1 !== null && p2 !== null ? Number(((p1 + p2) / 2).toFixed(2)) : p1,
      required_p2_promotion: null,
      required_p2_regular: null,
    }
  }

  // Cálculo de promedio de cursada
  let avg: number | null = null
  if (p1 !== null && p2 !== null) {
    avg = Number(((p1 + p2) / 2).toFixed(2))
  } else if (p1 !== null) {
    avg = p1
  }

  // Si ambos parciales fueron rendidos
  if (p1 !== null && p2 !== null) {
    if (p1 >= promoMin && p2 >= promoMin) {
      return {
        status: 'promocionada',
        calculated_average: avg,
        required_p2_promotion: null,
        required_p2_regular: null,
      }
    }
    if (p1 >= regularMin && p2 >= regularMin) {
      return {
        status: 'regular',
        calculated_average: avg,
        required_p2_promotion: null,
        required_p2_regular: null,
      }
    }
    if (p1 < regularMin && p2 < regularMin) {
      return {
        status: 'libre',
        calculated_average: avg,
        required_p2_promotion: null,
        required_p2_regular: null,
      }
    }
    return {
      status: 'a_recuperatorio',
      calculated_average: avg,
      required_p2_promotion: null,
      required_p2_regular: null,
    }
  }

  // Si solo rindió el 1° Parcial
  if (p1 !== null) {
    // Cuánto necesita en P2 para Promocionar (ambos >= promoMin)
    const reqPromo = Math.max(promoMin, Number((2 * promoMin - p1).toFixed(1)))
    // Cuánto necesita en P2 para Regularizar (ambos >= regularMin)
    const reqReg = Math.max(regularMin, Number((2 * regularMin - p1).toFixed(1)))

    if (p1 < regularMin) {
      return {
        status: 'a_recuperatorio',
        calculated_average: p1,
        required_p2_promotion: null,
        required_p2_regular: reqReg <= 10 ? reqReg : null,
      }
    }

    return {
      status: 'en_curso',
      calculated_average: p1,
      required_p2_promotion: reqPromo <= 10 ? reqPromo : null,
      required_p2_regular: reqReg <= 10 ? reqReg : regularMin,
    }
  }

  // Sin parciales aún
  return {
    status: 'en_curso',
    calculated_average: null,
    required_p2_promotion: promoMin,
    required_p2_regular: regularMin,
  }
}
