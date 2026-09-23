-- Migration: 0016_academic_grades_and_libreta.sql
-- Módulo de Libreta Universitaria Digital, Notas de Parciales y Calculadora de Promoción/Regularidad

CREATE TABLE IF NOT EXISTS academic_grades (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  subject_id uuid REFERENCES subjects(id) ON DELETE SET NULL,
  subject_name text NOT NULL,
  academic_year int NOT NULL DEFAULT 2026,
  year_level int NOT NULL DEFAULT 1, -- 1 = 1° Año, 2 = 2° Año, 3 = 3° Año, etc.
  term text NOT NULL DEFAULT '1° Cuatrimestre', -- '1° Cuatrimestre', '2° Cuatrimestre', 'Anual'
  partial_1_grade numeric(4,2),
  partial_2_grade numeric(4,2),
  partial_3_grade numeric(4,2),
  recuperatorio_1_grade numeric(4,2),
  recuperatorio_2_grade numeric(4,2),
  tp_average numeric(4,2),
  attendance_percentage numeric(5,2) DEFAULT 85.0,
  final_exam_grade numeric(4,2),
  promotion_min_grade numeric(4,2) DEFAULT 7.0,
  regular_min_grade numeric(4,2) DEFAULT 4.0,
  status text NOT NULL DEFAULT 'en_curso' CHECK (status IN ('en_curso', 'promocionada', 'regular', 'a_recuperatorio', 'libre', 'aprobada_final')),
  notes text,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_academic_grades_user_id ON academic_grades(user_id);
CREATE INDEX IF NOT EXISTS idx_academic_grades_year_level ON academic_grades(year_level);

-- Habilitar RLS
ALTER TABLE academic_grades ENABLE ROW LEVEL SECURITY;

-- Políticas de RLS
CREATE POLICY "Users can manage their own academic grades"
  ON academic_grades FOR ALL
  USING (auth.uid() = user_id);
