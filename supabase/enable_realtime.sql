-- ============================================
-- ENABLE REALTIME FOR ALL TABLES
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
            EXECUTE format('ALTER PUBLICATION supabase_realtime ADD TABLE public.%I;', t);
        EXCEPTION WHEN OTHERS THEN
            -- Ignore if it's already in the publication
            RAISE NOTICE 'Table % already in publication or cannot be added.', t;
        END;
    END LOOP;
END $$;
