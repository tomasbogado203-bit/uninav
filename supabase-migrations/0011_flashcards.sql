-- Migration: 0011_flashcards.sql
-- Módulo de Tarjetas Didácticas (Flashcards) estilo NotebookLM

CREATE TABLE IF NOT EXISTS flashcards (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  subject_id uuid NOT NULL REFERENCES subjects(id) ON DELETE CASCADE,
  front_text text NOT NULL,
  back_text text NOT NULL,
  source_page int,
  mastered boolean DEFAULT false,
  created_at timestamp with time zone DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Habilitar RLS
ALTER TABLE flashcards ENABLE ROW LEVEL SECURITY;

-- Política de RLS
CREATE POLICY "Users can manage their flashcards via subject"
  ON flashcards FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM subjects
      WHERE subjects.id = flashcards.subject_id
      AND subjects.user_id = auth.uid()
    )
  );
