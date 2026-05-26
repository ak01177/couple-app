-- ============================================
-- AS — Couple App Database Schema
-- Run this in Supabase SQL Editor
-- ============================================

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- ============================================
-- 1. COUPLES TABLE
-- ============================================
CREATE TABLE IF NOT EXISTS couples (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name TEXT,
  start_date TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ============================================
-- 2. PROFILES TABLE (extends Supabase auth.users)
-- ============================================
CREATE TABLE IF NOT EXISTS profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  username TEXT UNIQUE NOT NULL,
  display_name TEXT NOT NULL,
  avatar_url TEXT,
  couple_id UUID REFERENCES couples(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ============================================
-- 3. MESSAGES TABLE
-- ============================================
DO $$ BEGIN
    CREATE TYPE message_type AS ENUM ('text', 'image', 'video', 'voice', 'gif', 'sticker', 'snap');
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

CREATE TABLE IF NOT EXISTS messages (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  content TEXT,
  type message_type NOT NULL DEFAULT 'text',
  media_url TEXT,
  reply_to_id UUID REFERENCES messages(id) ON DELETE SET NULL,
  is_pinned BOOLEAN NOT NULL DEFAULT FALSE,
  sender_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  couple_id UUID NOT NULL REFERENCES couples(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  read_at TIMESTAMPTZ
);

-- Indexes for efficient chat loading
CREATE INDEX IF NOT EXISTS idx_messages_couple_created ON messages(couple_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_messages_sender ON messages(sender_id);

-- ============================================
-- 4. REACTIONS TABLE
-- ============================================
CREATE TABLE IF NOT EXISTS reactions (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  emoji TEXT NOT NULL,
  message_id UUID NOT NULL REFERENCES messages(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE(message_id, user_id, emoji)
);

CREATE INDEX IF NOT EXISTS idx_reactions_message ON reactions(message_id);

-- ============================================
-- 5. MEMORIES TABLE
-- ============================================
CREATE TABLE IF NOT EXISTS memories (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  title TEXT,
  description TEXT,
  media_url TEXT,
  date TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  couple_id UUID NOT NULL REFERENCES couples(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_memories_couple ON memories(couple_id, date DESC);

-- ============================================
-- 6. SHARED NOTES TABLE
-- ============================================
CREATE TABLE IF NOT EXISTS shared_notes (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  content TEXT NOT NULL DEFAULT '',
  couple_id UUID NOT NULL REFERENCES couples(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ============================================
-- 7. MOOD STATUS TABLE
-- ============================================
CREATE TABLE IF NOT EXISTS mood_statuses (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  mood TEXT NOT NULL,
  user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_mood_user ON mood_statuses(user_id, created_at DESC);

-- ============================================
-- 8. AUTO-UPDATE TIMESTAMPS
-- ============================================
CREATE OR REPLACE FUNCTION update_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trigger_profiles_updated_at ON profiles;
CREATE TRIGGER trigger_profiles_updated_at
  BEFORE UPDATE ON profiles
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

DROP TRIGGER IF EXISTS trigger_shared_notes_updated_at ON shared_notes;
CREATE TRIGGER trigger_shared_notes_updated_at
  BEFORE UPDATE ON shared_notes
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

-- ============================================
-- 9. AUTO-CREATE PROFILE ON SIGNUP (ROBUST)
-- ============================================
-- Safely drop old triggers/functions to ensure fresh slate
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
DROP FUNCTION IF EXISTS handle_new_user();

CREATE OR REPLACE FUNCTION handle_new_user()
RETURNS TRIGGER AS $$
DECLARE
  base_username TEXT;
  final_username TEXT;
  counter INTEGER := 1;
BEGIN
  -- Safely extract base username
  base_username := COALESCE(
    NULLIF(TRIM(NEW.raw_user_meta_data->>'username'), ''),
    NULLIF(TRIM(split_part(COALESCE(NEW.email, ''), '@', 1)), ''),
    'user'
  );

  final_username := base_username;

  -- Resolve duplicate usernames
  WHILE EXISTS (SELECT 1 FROM public.profiles WHERE username = final_username) LOOP
    final_username := base_username || counter::TEXT;
    counter := counter + 1;
  END LOOP;

  INSERT INTO public.profiles (id, username, display_name)
  VALUES (
    NEW.id,
    final_username,
    COALESCE(
      NULLIF(TRIM(NEW.raw_user_meta_data->>'display_name'), ''),
      NULLIF(TRIM(split_part(COALESCE(NEW.email, ''), '@', 1)), ''),
      'User'
    )
  )
  ON CONFLICT (id) DO UPDATE
  SET 
    username = EXCLUDED.username,
    display_name = EXCLUDED.display_name,
    updated_at = NOW();

  RETURN NEW;

EXCEPTION WHEN OTHERS THEN
  -- Log error but don't block user creation
  RAISE WARNING 'handle_new_user failed for %: %', NEW.id, SQLERRM;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

ALTER FUNCTION handle_new_user() OWNER TO postgres;

CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION handle_new_user();

-- ============================================
-- 10. GRANTS & PERMISSIONS
-- ============================================
-- Ensure correct baseline privileges so that the API has access
GRANT SELECT, INSERT, UPDATE, DELETE ON ALL TABLES IN SCHEMA public TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON ALL TABLES IN SCHEMA public TO anon;
GRANT SELECT, INSERT, UPDATE, DELETE ON ALL TABLES IN SCHEMA public TO service_role;

-- ============================================
-- 11. ROW LEVEL SECURITY (RLS)
-- ============================================

-- Enable RLS on all tables
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE couples ENABLE ROW LEVEL SECURITY;
ALTER TABLE messages ENABLE ROW LEVEL SECURITY;
ALTER TABLE reactions ENABLE ROW LEVEL SECURITY;
ALTER TABLE memories ENABLE ROW LEVEL SECURITY;
ALTER TABLE shared_notes ENABLE ROW LEVEL SECURITY;
ALTER TABLE mood_statuses ENABLE ROW LEVEL SECURITY;

-- Drop any potentially recursive/broken profile policies
DROP POLICY IF EXISTS "Users can read own profile" ON profiles;
DROP POLICY IF EXISTS "Users can read partner profile" ON profiles;
DROP POLICY IF EXISTS "Users can read profiles" ON profiles;
DROP POLICY IF EXISTS "Users can update own profile" ON profiles;

-- PROFILES: Safe Policies
CREATE POLICY "Users can read profiles"
  ON profiles FOR SELECT
  USING (true);

CREATE POLICY "Users can update own profile"
  ON profiles FOR UPDATE
  USING (auth.uid() = id);

-- COUPLES: Members can read/update their couple
DROP POLICY IF EXISTS "Couple members can read" ON couples;
CREATE POLICY "Couple members can read"
  ON couples FOR SELECT
  USING (
    id = (SELECT couple_id FROM profiles WHERE id = auth.uid())
  );

DROP POLICY IF EXISTS "Couple members can update" ON couples;
CREATE POLICY "Couple members can update"
  ON couples FOR UPDATE
  USING (
    id = (SELECT couple_id FROM profiles WHERE id = auth.uid())
  );

-- MESSAGES: Only couple members can read/write
DROP POLICY IF EXISTS "Couple members can read messages" ON messages;
CREATE POLICY "Couple members can read messages"
  ON messages FOR SELECT
  USING (
    couple_id = (SELECT couple_id FROM profiles WHERE id = auth.uid())
  );

DROP POLICY IF EXISTS "Users can insert own messages" ON messages;
CREATE POLICY "Users can insert own messages"
  ON messages FOR INSERT
  WITH CHECK (
    sender_id = auth.uid() AND
    couple_id = (SELECT couple_id FROM profiles WHERE id = auth.uid())
  );

DROP POLICY IF EXISTS "Users can update own messages" ON messages;
DROP POLICY IF EXISTS "Couple members can update messages" ON messages;
CREATE POLICY "Couple members can update messages"
  ON messages FOR UPDATE
  USING (
    couple_id = (SELECT couple_id FROM profiles WHERE id = auth.uid())
  );

DROP POLICY IF EXISTS "Users can delete own messages" ON messages;
CREATE POLICY "Users can delete own messages"
  ON messages FOR DELETE
  USING (sender_id = auth.uid());

-- REACTIONS: Couple members can read, users can insert/delete own
DROP POLICY IF EXISTS "Couple members can read reactions" ON reactions;
CREATE POLICY "Couple members can read reactions"
  ON reactions FOR SELECT
  USING (
    message_id IN (
      SELECT id FROM messages
      WHERE couple_id = (SELECT couple_id FROM profiles WHERE id = auth.uid())
    )
  );

DROP POLICY IF EXISTS "Users can insert own reactions" ON reactions;
CREATE POLICY "Users can insert own reactions"
  ON reactions FOR INSERT
  WITH CHECK (user_id = auth.uid());

DROP POLICY IF EXISTS "Users can delete own reactions" ON reactions;
CREATE POLICY "Users can delete own reactions"
  ON reactions FOR DELETE
  USING (user_id = auth.uid());

-- MEMORIES: Couple members can CRUD
DROP POLICY IF EXISTS "Couple members can read memories" ON memories;
CREATE POLICY "Couple members can read memories"
  ON memories FOR SELECT
  USING (
    couple_id = (SELECT couple_id FROM profiles WHERE id = auth.uid())
  );

DROP POLICY IF EXISTS "Couple members can insert memories" ON memories;
CREATE POLICY "Couple members can insert memories"
  ON memories FOR INSERT
  WITH CHECK (
    couple_id = (SELECT couple_id FROM profiles WHERE id = auth.uid())
  );

DROP POLICY IF EXISTS "Couple members can update memories" ON memories;
CREATE POLICY "Couple members can update memories"
  ON memories FOR UPDATE
  USING (
    couple_id = (SELECT couple_id FROM profiles WHERE id = auth.uid())
  );

DROP POLICY IF EXISTS "Couple members can delete memories" ON memories;
CREATE POLICY "Couple members can delete memories"
  ON memories FOR DELETE
  USING (
    couple_id = (SELECT couple_id FROM profiles WHERE id = auth.uid())
  );

-- SHARED NOTES: Couple members can read/write
DROP POLICY IF EXISTS "Couple members can read notes" ON shared_notes;
CREATE POLICY "Couple members can read notes"
  ON shared_notes FOR SELECT
  USING (
    couple_id = (SELECT couple_id FROM profiles WHERE id = auth.uid())
  );

DROP POLICY IF EXISTS "Couple members can insert notes" ON shared_notes;
CREATE POLICY "Couple members can insert notes"
  ON shared_notes FOR INSERT
  WITH CHECK (
    couple_id = (SELECT couple_id FROM profiles WHERE id = auth.uid())
  );

DROP POLICY IF EXISTS "Couple members can update notes" ON shared_notes;
CREATE POLICY "Couple members can update notes"
  ON shared_notes FOR UPDATE
  USING (
    couple_id = (SELECT couple_id FROM profiles WHERE id = auth.uid())
  );

-- MOOD STATUSES: Couple members can read, users can insert own
DROP POLICY IF EXISTS "Couple members can read moods" ON mood_statuses;
CREATE POLICY "Couple members can read moods"
  ON mood_statuses FOR SELECT
  USING (
    user_id IN (
      SELECT id FROM profiles
      WHERE couple_id = (SELECT couple_id FROM profiles WHERE id = auth.uid())
    )
  );

DROP POLICY IF EXISTS "Users can insert own mood" ON mood_statuses;
CREATE POLICY "Users can insert own mood"
  ON mood_statuses FOR INSERT
  WITH CHECK (user_id = auth.uid());

-- ============================================
-- 12. ENABLE REALTIME
-- ============================================
-- Note: Realtime subscriptions are enabled through the Supabase Dashboard -> Database -> Replication.
-- Ensure messages, reactions, mood_statuses, and shared_notes are toggled there.

-- ============================================
-- 13. STORAGE BUCKET + POLICIES
-- ============================================
-- Run supabase/storage_policies.sql after creating the couple-media bucket.

-- ============================================
-- 14. CALENDAR EVENTS TABLE MIGRATION
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