-- ============================================
-- CALENDAR EVENTS TABLE MIGRATION
-- Run this in your Supabase SQL Editor
-- ============================================

CREATE TABLE IF NOT EXISTS calendar_events (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  title TEXT NOT NULL,
  type TEXT NOT NULL, -- e.g., 'exam', 'date', 'anniversary', 'trip', 'other'
  start_date TIMESTAMPTZ NOT NULL,
  end_date TIMESTAMPTZ NOT NULL,
  user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  couple_id UUID NOT NULL REFERENCES couples(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_calendar_events_couple ON calendar_events(couple_id, start_date ASC);

-- Enable RLS
ALTER TABLE calendar_events ENABLE ROW LEVEL SECURITY;

-- Grants
GRANT SELECT, INSERT, UPDATE, DELETE ON TABLE calendar_events TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON TABLE calendar_events TO anon;
GRANT SELECT, INSERT, UPDATE, DELETE ON TABLE calendar_events TO service_role;

-- Policy: Only couple members can read/write their events
DROP POLICY IF EXISTS "Couple members can read events" ON calendar_events;
CREATE POLICY "Couple members can read events"
  ON calendar_events FOR SELECT
  USING (couple_id = (SELECT couple_id FROM profiles WHERE id = auth.uid()));

DROP POLICY IF EXISTS "Users can insert events" ON calendar_events;
CREATE POLICY "Users can insert events"
  ON calendar_events FOR INSERT
  WITH CHECK (
    auth.uid() = user_id AND
    couple_id = (SELECT couple_id FROM profiles WHERE id = auth.uid())
  );

DROP POLICY IF EXISTS "Users can delete own events" ON calendar_events;
CREATE POLICY "Users can delete own events"
  ON calendar_events FOR DELETE
  USING (user_id = auth.uid());
