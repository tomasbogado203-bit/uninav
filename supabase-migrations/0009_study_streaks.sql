-- Migration 0009: Tabla de Racha de Estudio (study_streaks)
CREATE TABLE IF NOT EXISTS study_streaks (
  user_id uuid PRIMARY KEY REFERENCES profiles(id) ON DELETE CASCADE,
  current_streak int NOT NULL DEFAULT 1,
  longest_streak int NOT NULL DEFAULT 1,
  last_activity_date date NOT NULL DEFAULT CURRENT_DATE,
  updated_at timestamptz DEFAULT now()
);

-- Habilitar RLS
ALTER TABLE study_streaks ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users can read own study_streak" ON study_streaks;
CREATE POLICY "Users can read own study_streak" ON study_streaks
  FOR SELECT USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can update own study_streak" ON study_streaks;
CREATE POLICY "Users can update own study_streak" ON study_streaks
  FOR ALL USING (auth.uid() = user_id);
