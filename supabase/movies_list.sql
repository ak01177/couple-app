-- ============================================
-- MOVIES WATCH LIST TABLE
-- ============================================
CREATE TABLE IF NOT EXISTS movies_list (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  title TEXT NOT NULL,
  type TEXT NOT NULL CHECK (type IN ('movie', 'show')),
  is_watched BOOLEAN NOT NULL DEFAULT FALSE,
  added_by UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  couple_id UUID NOT NULL REFERENCES couples(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_movies_couple ON movies_list(couple_id, created_at DESC);

-- RLS
ALTER TABLE movies_list ENABLE ROW LEVEL SECURITY;
ALTER TABLE movies_list REPLICA IDENTITY FULL;

-- Grants
GRANT SELECT, INSERT, UPDATE, DELETE ON TABLE movies_list TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON TABLE movies_list TO anon;
GRANT SELECT, INSERT, UPDATE, DELETE ON TABLE movies_list TO service_role;

DROP POLICY IF EXISTS "Couple members can read movies" ON movies_list;
CREATE POLICY "Couple members can read movies" ON movies_list
  FOR SELECT USING (
    couple_id = (SELECT couple_id FROM profiles WHERE id = auth.uid())
  );

DROP POLICY IF EXISTS "Couple members can insert movies" ON movies_list;
CREATE POLICY "Couple members can insert movies" ON movies_list
  FOR INSERT WITH CHECK (
    couple_id = (SELECT couple_id FROM profiles WHERE id = auth.uid())
  );

DROP POLICY IF EXISTS "Couple members can update movies" ON movies_list;
CREATE POLICY "Couple members can update movies" ON movies_list
  FOR UPDATE USING (
    couple_id = (SELECT couple_id FROM profiles WHERE id = auth.uid())
  );

DROP POLICY IF EXISTS "Couple members can delete movies" ON movies_list;
CREATE POLICY "Couple members can delete movies" ON movies_list
  FOR DELETE USING (
    couple_id = (SELECT couple_id FROM profiles WHERE id = auth.uid())
  );

-- Realtime
ALTER PUBLICATION supabase_realtime ADD TABLE movies_list;
