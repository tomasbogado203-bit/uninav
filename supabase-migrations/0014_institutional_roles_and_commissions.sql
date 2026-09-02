-- Migration: 0014_institutional_roles_and_commissions.sql
-- Módulo Institucional: Roles (Estudiante, Profesor, Administrador/Decanato),
-- Comisiones de Cátedra, Sincronización RAG y Telemetría de Dudas (Mapa de Calor).

-- 1. Ampliar profiles con rol institucional
DO $$ 
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'profiles' AND column_name = 'role'
  ) THEN
    ALTER TABLE profiles ADD COLUMN role text DEFAULT 'student' CHECK (role IN ('student', 'professor', 'admin', 'dean'));
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'profiles' AND column_name = 'institutional_code'
  ) THEN
    ALTER TABLE profiles ADD COLUMN institutional_code text;
  END IF;
END $$;

-- 2. Tabla de Comisiones de Cátedra
CREATE TABLE IF NOT EXISTS commissions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  professor_id uuid NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  subject_name text NOT NULL,
  name text NOT NULL, -- Ej: "Comisión 104 - Turno Noche"
  join_code text UNIQUE NOT NULL, -- Código de 6 letras para que los alumnos se unan (ej: "AN104N")
  academic_term text NOT NULL DEFAULT '1° Cuatrimestre 2026',
  description text,
  is_active boolean DEFAULT true,
  created_at timestamptz DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_commissions_professor_id ON commissions(professor_id);
CREATE INDEX IF NOT EXISTS idx_commissions_join_code ON commissions(join_code);

-- 3. Tabla de Inscripciones de Estudiantes a Comisiones
CREATE TABLE IF NOT EXISTS commission_students (
  commission_id uuid NOT NULL REFERENCES commissions(id) ON DELETE CASCADE,
  student_id uuid NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  joined_at timestamptz DEFAULT now(),
  PRIMARY KEY (commission_id, student_id)
);

CREATE INDEX IF NOT EXISTS idx_commission_students_student ON commission_students(student_id);

-- 4. Tabla de Bibliografía Oficial Centralizada de la Cátedra
CREATE TABLE IF NOT EXISTS commission_documents (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  commission_id uuid NOT NULL REFERENCES commissions(id) ON DELETE CASCADE,
  title text NOT NULL,
  file_url text NOT NULL,
  document_type text NOT NULL DEFAULT 'apunte' CHECK (document_type IN ('apunte', 'guia_tp', 'examen_modelo')),
  created_at timestamptz DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_commission_documents_commission ON commission_documents(commission_id);

-- 5. Tabla de Telemetría Anónima de Dudas (Mapa de Calor de la Cátedra)
CREATE TABLE IF NOT EXISTS class_confusion_telemetry (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  commission_id uuid NOT NULL REFERENCES commissions(id) ON DELETE CASCADE,
  topic_tag text NOT NULL, -- Ej: "Integrales Impropias", "Fracciones Simples"
  student_count int DEFAULT 1,
  severity text DEFAULT 'alta' CHECK (severity IN ('baja', 'media', 'alta')),
  last_queried_at timestamptz DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_confusion_telemetry_commission ON class_confusion_telemetry(commission_id);

-- 6. Habilitar RLS en todas las nuevas tablas
ALTER TABLE commissions ENABLE ROW LEVEL SECURITY;
ALTER TABLE commission_students ENABLE ROW LEVEL SECURITY;
ALTER TABLE commission_documents ENABLE ROW LEVEL SECURITY;
ALTER TABLE class_confusion_telemetry ENABLE ROW LEVEL SECURITY;

-- Políticas de RLS: commissions
CREATE POLICY "Professors can manage their own commissions"
  ON commissions FOR ALL
  USING (professor_id = auth.uid());

CREATE POLICY "Students can view active commissions by code or enrollment"
  ON commissions FOR SELECT
  USING (
    is_active = true AND (
      EXISTS (
        SELECT 1 FROM commission_students 
        WHERE commission_students.commission_id = commissions.id 
          AND commission_students.student_id = auth.uid()
      )
      OR professor_id = auth.uid()
      OR auth.uid() IS NOT NULL
    )
  );

-- Políticas de RLS: commission_students
CREATE POLICY "Students can manage their own commission enrollments"
  ON commission_students FOR ALL
  USING (student_id = auth.uid());

CREATE POLICY "Professors can view enrolled students in their commissions"
  ON commission_students FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM commissions 
      WHERE commissions.id = commission_students.commission_id 
        AND commissions.professor_id = auth.uid()
    )
  );

-- Políticas de RLS: commission_documents
CREATE POLICY "Professors can manage documents in their commissions"
  ON commission_documents FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM commissions 
      WHERE commissions.id = commission_documents.commission_id 
        AND commissions.professor_id = auth.uid()
    )
  );

CREATE POLICY "Enrolled students can view cátedra documents"
  ON commission_documents FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM commission_students 
      WHERE commission_students.commission_id = commission_documents.commission_id 
        AND commission_students.student_id = auth.uid()
    )
    OR EXISTS (
      SELECT 1 FROM commissions 
      WHERE commissions.id = commission_documents.commission_id 
        AND commissions.professor_id = auth.uid()
    )
  );

-- Políticas de RLS: class_confusion_telemetry
CREATE POLICY "Professors and deans can view commission telemetry"
  ON class_confusion_telemetry FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM commissions 
      WHERE commissions.id = class_confusion_telemetry.commission_id 
        AND commissions.professor_id = auth.uid()
    )
    OR EXISTS (
      SELECT 1 FROM profiles 
      WHERE profiles.id = auth.uid() 
        AND profiles.role IN ('admin', 'dean')
    )
  );

CREATE POLICY "Authenticated users can insert telemetry"
  ON class_confusion_telemetry FOR INSERT
  WITH CHECK (auth.uid() IS NOT NULL);
