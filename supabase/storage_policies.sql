-- ============================================
-- AS — Storage bucket + RLS policies
-- Run this in Supabase SQL Editor (re-run safe)
-- ============================================

INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES ('couple-media', 'couple-media', false, 52428800, NULL)
ON CONFLICT (id) DO UPDATE SET public = false;

-- Allow authenticated users to resolve the private bucket
DROP POLICY IF EXISTS "Authenticated can read couple-media bucket" ON storage.buckets;
CREATE POLICY "Authenticated can read couple-media bucket"
  ON storage.buckets FOR SELECT
  TO authenticated
  USING (id = 'couple-media');

-- Helper: first path segment must match the user's couple_id
DROP POLICY IF EXISTS "Couple members can read media" ON storage.objects;
CREATE POLICY "Couple members can read media"
  ON storage.objects FOR SELECT
  TO authenticated
  USING (
    bucket_id = 'couple-media'
    AND EXISTS (
      SELECT 1
      FROM profiles p
      WHERE p.id = auth.uid()
        AND p.couple_id IS NOT NULL
        AND (
          split_part(name, '/', 1) = p.couple_id::text
          OR name LIKE p.couple_id::text || '/%'
        )
    )
  );

DROP POLICY IF EXISTS "Couple members can upload media" ON storage.objects;
CREATE POLICY "Couple members can upload media"
  ON storage.objects FOR INSERT
  TO authenticated
  WITH CHECK (
    bucket_id = 'couple-media'
    AND EXISTS (
      SELECT 1
      FROM profiles p
      WHERE p.id = auth.uid()
        AND p.couple_id IS NOT NULL
        AND (
          split_part(name, '/', 1) = p.couple_id::text
          OR name LIKE p.couple_id::text || '/%'
        )
    )
  );

DROP POLICY IF EXISTS "Couple members can update media" ON storage.objects;
CREATE POLICY "Couple members can update media"
  ON storage.objects FOR UPDATE
  TO authenticated
  USING (
    bucket_id = 'couple-media'
    AND EXISTS (
      SELECT 1
      FROM profiles p
      WHERE p.id = auth.uid()
        AND p.couple_id IS NOT NULL
        AND (
          split_part(name, '/', 1) = p.couple_id::text
          OR name LIKE p.couple_id::text || '/%'
        )
    )
  );

DROP POLICY IF EXISTS "Couple members can delete media" ON storage.objects;
CREATE POLICY "Couple members can delete media"
  ON storage.objects FOR DELETE
  TO authenticated
  USING (
    bucket_id = 'couple-media'
    AND EXISTS (
      SELECT 1
      FROM profiles p
      WHERE p.id = auth.uid()
        AND p.couple_id IS NOT NULL
        AND (
          split_part(name, '/', 1) = p.couple_id::text
          OR name LIKE p.couple_id::text || '/%'
        )
    )
  );
