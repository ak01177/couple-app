-- ============================================
-- COUPLE SONGS TABLE
-- ============================================
CREATE TABLE IF NOT EXISTS couple_songs (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  title TEXT NOT NULL,
  artist TEXT NOT NULL,
  album_art_url TEXT,
  link_url TEXT,
  added_by UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  couple_id UUID NOT NULL REFERENCES couples(id) ON DELETE CASCADE,
  is_featured BOOLEAN NOT NULL DEFAULT FALSE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_songs_couple ON couple_songs(couple_id, created_at DESC);

-- RLS
ALTER TABLE couple_songs ENABLE ROW LEVEL SECURITY;

-- Grants
GRANT SELECT, INSERT, UPDATE, DELETE ON TABLE couple_songs TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON TABLE couple_songs TO anon;
GRANT SELECT, INSERT, UPDATE, DELETE ON TABLE couple_songs TO service_role;

DROP POLICY IF EXISTS "Couple members can read songs" ON couple_songs;
CREATE POLICY "Couple members can read songs" ON couple_songs
  FOR SELECT USING (
    couple_id IN (
      SELECT couple_id FROM profiles WHERE id = auth.uid()
    )
  );

DROP POLICY IF EXISTS "Couple members can insert songs" ON couple_songs;
CREATE POLICY "Couple members can insert songs" ON couple_songs
  FOR INSERT WITH CHECK (
    couple_id IN (
      SELECT couple_id FROM profiles WHERE id = auth.uid()
    )
  );

DROP POLICY IF EXISTS "Song owner can update" ON couple_songs;
CREATE POLICY "Song owner can update" ON couple_songs
  FOR UPDATE USING (added_by = auth.uid());

DROP POLICY IF EXISTS "Song owner can delete" ON couple_songs;
CREATE POLICY "Song owner can delete" ON couple_songs
  FOR DELETE USING (added_by = auth.uid());

-- Realtime
-- (Handled automatically by Supabase for some projects, skipping ALTER PUBLICATION to prevent errors)
