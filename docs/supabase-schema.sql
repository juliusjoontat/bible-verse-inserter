-- ============================================================================
-- Bible Extension - Supabase Database Schema
-- ============================================================================
-- Run this SQL in your Supabase SQL Editor to create the necessary tables
-- and indexes for the Bible Extension
-- ============================================================================

-- ============================================================================
-- Create Verses Table
-- ============================================================================
CREATE TABLE IF NOT EXISTS verses (
  id BIGINT PRIMARY KEY GENERATED ALWAYS AS IDENTITY,
  
  -- Translation identifier (e.g., 'ESV', 'NIV', 'NASB', 'KJV')
  translation TEXT NOT NULL,
  
  -- Book information
  book_number INT NOT NULL,                    -- 1-66 (Genesis-Revelation)
  book_name TEXT NOT NULL,                     -- Full book name for reference
  
  -- Chapter and verse numbers
  chapter INT NOT NULL,
  verse_number INT NOT NULL,
  
  -- Verse text content
  text TEXT NOT NULL,
  
  -- Timestamps
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

-- ============================================================================
-- Create Indexes for Fast Queries
-- ============================================================================
-- Primary lookup index - used for most verse searches
CREATE INDEX IF NOT EXISTS idx_verses_lookup 
ON verses(translation, book_number, chapter, verse_number);

-- Translation index - for filtering by translation
CREATE INDEX IF NOT EXISTS idx_verses_translation 
ON verses(translation);

-- Book index - for filtering by book
CREATE INDEX IF NOT EXISTS idx_verses_book 
ON verses(book_number);

-- Chapter index - for filtering by chapter
CREATE INDEX IF NOT EXISTS idx_verses_chapter 
ON verses(chapter);

-- Combined chapter lookup
CREATE INDEX IF NOT EXISTS idx_verses_chapter_lookup 
ON verses(translation, book_number, chapter);

-- Text search index (optional - for keyword searches)
CREATE INDEX IF NOT EXISTS idx_verses_text 
ON verses USING GIN(to_tsvector('english', text));

-- ============================================================================
-- Enable Row Level Security (RLS)
-- ============================================================================
ALTER TABLE verses ENABLE ROW LEVEL SECURITY;

-- ============================================================================
-- Create RLS Policies
-- ============================================================================

-- Allow public read access (anyone can read verses)
CREATE POLICY "Allow public read"
ON verses
FOR SELECT
USING (true);

-- Allow authenticated users to insert (for future admin features)
CREATE POLICY "Allow authenticated insert"
ON verses
FOR INSERT
WITH CHECK (auth.role() = 'authenticated');

-- Allow authenticated users to update
CREATE POLICY "Allow authenticated update"
ON verses
FOR UPDATE
USING (auth.role() = 'authenticated')
WITH CHECK (auth.role() = 'authenticated');

-- ============================================================================
-- Create Materialized View for Statistics (Optional)
-- ============================================================================
CREATE MATERIALIZED VIEW IF NOT EXISTS verse_statistics AS
SELECT
  translation,
  COUNT(*) as total_verses,
  COUNT(DISTINCT book_number) as total_books,
  COUNT(DISTINCT chapter) as total_chapters,
  MIN(book_number) as first_book,
  MAX(book_number) as last_book
FROM verses
GROUP BY translation;

-- Index on the materialized view
CREATE INDEX IF NOT EXISTS idx_verse_statistics_translation 
ON verse_statistics(translation);

-- ============================================================================
-- Create Function to Refresh Statistics
-- ============================================================================
CREATE OR REPLACE FUNCTION refresh_verse_statistics()
RETURNS void
LANGUAGE SQL
AS $$
  REFRESH MATERIALIZED VIEW CONCURRENTLY verse_statistics;
$$;

-- ============================================================================
-- Create Storage Buckets (Optional - for future icon/image storage)
-- ============================================================================
-- INSERT INTO storage.buckets (id, name, public)
-- VALUES ('extension-assets', 'extension-assets', true)
-- ON CONFLICT DO NOTHING;

-- ============================================================================
-- Add Comments for Documentation
-- ============================================================================
COMMENT ON TABLE verses IS 'Stores Bible verses from various translations';
COMMENT ON COLUMN verses.id IS 'Unique identifier for each verse record';
COMMENT ON COLUMN verses.translation IS 'Bible translation code (e.g., ESV, NIV, NASB)';
COMMENT ON COLUMN verses.book_number IS 'Book number (1-66, Genesis to Revelation)';
COMMENT ON COLUMN verses.book_name IS 'Full book name for easy reference';
COMMENT ON COLUMN verses.chapter IS 'Chapter number within the book';
COMMENT ON COLUMN verses.verse_number IS 'Verse number within the chapter';
COMMENT ON COLUMN verses.text IS 'The actual verse text';

COMMENT ON INDEX idx_verses_lookup IS 'Primary index for verse lookups by translation, book, chapter, and verse';
COMMENT ON INDEX idx_verses_translation IS 'Index for filtering verses by translation';
COMMENT ON INDEX idx_verses_book IS 'Index for filtering verses by book';
COMMENT ON INDEX idx_verses_chapter IS 'Index for filtering verses by chapter';
COMMENT ON INDEX idx_verses_text IS 'Text search index for keyword searches';

COMMENT ON MATERIALIZED VIEW verse_statistics IS 'Statistics about verses in each translation';

-- ============================================================================
-- Data Validation Triggers (Optional)
-- ============================================================================
CREATE OR REPLACE FUNCTION validate_verse_numbers()
RETURNS TRIGGER
LANGUAGE plpgsql
AS $$
BEGIN
  -- Validate book number is 1-66
  IF NEW.book_number < 1 OR NEW.book_number > 66 THEN
    RAISE EXCEPTION 'Book number must be between 1 and 66';
  END IF;
  
  -- Validate chapter is positive
  IF NEW.chapter < 1 THEN
    RAISE EXCEPTION 'Chapter must be positive';
  END IF;
  
  -- Validate verse number is positive
  IF NEW.verse_number < 1 THEN
    RAISE EXCEPTION 'Verse number must be positive';
  END IF;
  
  -- Update timestamp
  NEW.updated_at = NOW();
  
  RETURN NEW;
END;
$$;

-- Create trigger for validation
CREATE TRIGGER verse_validation_trigger
BEFORE INSERT OR UPDATE ON verses
FOR EACH ROW
EXECUTE FUNCTION validate_verse_numbers();

-- ============================================================================
-- Performance Optimization
-- ============================================================================

-- Enable query optimization
ALTER TABLE verses SET (fillfactor = 70);

-- Analyze table for query planner
ANALYZE verses;

-- ============================================================================
-- Summary
-- ============================================================================
-- This schema provides:
-- ✓ Fast verse lookups by translation, book, chapter, and verse
-- ✓ Full-text search capabilities
-- ✓ Row-level security for fine-grained access control
-- ✓ Data validation and integrity checks
-- ✓ Statistics for monitoring and administration
-- ✓ Proper indexing for performance at scale
-- 
-- The extension can now efficiently store and retrieve Bible verses!
-- ============================================================================
