-- Migration 0013: Módulo IoT y Sesiones de Estudio Pomodoro

-- 1. TABLA study_sessions (registro de bloques completados)
CREATE TABLE IF NOT EXISTS study_sessions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES profiles(id) ON DELETE CASCADE NOT NULL,
  subject_id uuid REFERENCES subjects(id) ON DELETE SET NULL,
  duration_minutes int NOT NULL,
  session_type text NOT NULL CHECK (session_type IN ('study', 'break')),
  completed_at timestamptz DEFAULT now()
);

-- 2. TABLA study_lamp_states (estado en tiempo real para ESP32 / IoT)
CREATE TABLE IF NOT EXISTS study_lamp_states (
  user_id uuid PRIMARY KEY REFERENCES profiles(id) ON DELETE CASCADE,
  state text NOT NULL DEFAULT 'idle' CHECK (state IN ('idle', 'study', 'warning', 'break')),
  color_hex text NOT NULL DEFAULT '#6366F1',
  r int NOT NULL DEFAULT 99,
  g int NOT NULL DEFAULT 102,
  b int NOT NULL DEFAULT 241,
  time_remaining_seconds int NOT NULL DEFAULT 0,
  is_active boolean NOT NULL DEFAULT false,
  updated_at timestamptz DEFAULT now()
);

-- 3. Habilitar RLS
ALTER TABLE study_sessions ENABLE ROW LEVEL SECURITY;
ALTER TABLE study_lamp_states ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users can manage their study sessions" ON study_sessions;
CREATE POLICY "Users can manage their study sessions" ON study_sessions
  FOR ALL USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can view and update their lamp state" ON study_lamp_states;
CREATE POLICY "Users can view and update their lamp state" ON study_lamp_states
  FOR ALL USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Public read for ESP32 by user_id" ON study_lamp_states;
CREATE POLICY "Public read for ESP32 by user_id" ON study_lamp_states
  FOR SELECT USING (true);
