-- ============================================
-- FIX REALTIME DELETIONS (REPLICA IDENTITY FULL)
-- Run this in your Supabase SQL Editor
-- ============================================

DO $$ 
DECLARE
    t text;
BEGIN
    FOR t IN 
        SELECT tablename 
        FROM pg_tables 
        WHERE schemaname = 'public'
    LOOP
        BEGIN
            EXECUTE format('ALTER TABLE public.%I REPLICA IDENTITY FULL;', t);
        EXCEPTION WHEN OTHERS THEN
            RAISE NOTICE 'Could not set replica identity for %', t;
        END;
    END LOOP;
END $$;
