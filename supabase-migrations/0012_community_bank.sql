-- Migration 0012: Banco Comunitario de la Carrera (Community Knowledge Hub)

-- 1. TABLA community_contributions
CREATE TABLE IF NOT EXISTS community_contributions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES profiles(id) ON DELETE CASCADE NOT NULL,
  career_id uuid REFERENCES careers(id) ON DELETE CASCADE NOT NULL,
  subject_name text NOT NULL,
  title text NOT NULL,
  description text,
  resource_type text NOT NULL CHECK (resource_type IN ('apunte', 'parcial_resuelto', 'receta_formulas', 'resumen')),
  file_url text NOT NULL,
  upvotes_count int DEFAULT 0,
  downloads_count int DEFAULT 0,
  created_at timestamptz DEFAULT now()
);

-- 2. TABLA community_upvotes (para evitar votos duplicados por usuario)
CREATE TABLE IF NOT EXISTS community_upvotes (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  contribution_id uuid REFERENCES community_contributions(id) ON DELETE CASCADE NOT NULL,
  user_id uuid REFERENCES profiles(id) ON DELETE CASCADE NOT NULL,
  created_at timestamptz DEFAULT now(),
  UNIQUE(contribution_id, user_id)
);

-- 3. RLS Policies
ALTER TABLE community_contributions ENABLE ROW LEVEL SECURITY;
ALTER TABLE community_upvotes ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Anyone authenticated can view community contributions" ON community_contributions;
CREATE POLICY "Anyone authenticated can view community contributions" ON community_contributions
  FOR SELECT USING (auth.uid() IS NOT NULL);

DROP POLICY IF EXISTS "Users can create their own contributions" ON community_contributions;
CREATE POLICY "Users can create their own contributions" ON community_contributions
  FOR INSERT WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can update contributions" ON community_contributions;
CREATE POLICY "Users can update contributions" ON community_contributions
  FOR UPDATE USING (auth.uid() IS NOT NULL);

DROP POLICY IF EXISTS "Users can delete their own contributions" ON community_contributions;
CREATE POLICY "Users can delete their own contributions" ON community_contributions
  FOR DELETE USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can manage their upvotes" ON community_upvotes;
CREATE POLICY "Users can manage their upvotes" ON community_upvotes
  FOR ALL USING (auth.uid() = user_id);
