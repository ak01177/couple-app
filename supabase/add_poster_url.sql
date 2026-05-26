-- Add poster_url column to movies_list
ALTER TABLE movies_list ADD COLUMN IF NOT EXISTS poster_url TEXT;
