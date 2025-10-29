-- ============================================
-- DAILY LOGS & MEDIA MIGRATION
-- Story Teller MVP - Phase 1
-- ============================================

-- ============================================
-- 1. ALTER CAPTURES TABLE
-- Add fields for daily log association
-- ============================================

ALTER TABLE captures
ADD COLUMN IF NOT EXISTS note_type TEXT DEFAULT 'general',
ADD COLUMN IF NOT EXISTS log_date DATE;

-- Add constraint for note_type
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint
    WHERE conname = 'captures_note_type_check'
  ) THEN
    ALTER TABLE captures
    ADD CONSTRAINT captures_note_type_check
    CHECK (note_type IN ('intention', 'daily', 'reflection', 'general'));
  END IF;
END $$;

-- Create index on log_date for faster queries
CREATE INDEX IF NOT EXISTS idx_captures_log_date ON captures(log_date);
CREATE INDEX IF NOT EXISTS idx_captures_note_type ON captures(note_type);

-- ============================================
-- 2. DAILY LOGS TABLE
-- One record per user per day
-- ============================================

CREATE TABLE IF NOT EXISTS daily_logs (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  date DATE NOT NULL,
  notes_text TEXT, -- For backfilled journal content
  created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
  updated_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
  UNIQUE(user_id, date)
);

-- Indexes
CREATE INDEX IF NOT EXISTS idx_daily_logs_user_id ON daily_logs(user_id);
CREATE INDEX IF NOT EXISTS idx_daily_logs_date ON daily_logs(date DESC);
CREATE INDEX IF NOT EXISTS idx_daily_logs_user_date ON daily_logs(user_id, date DESC);

-- Auto-update updated_at trigger
CREATE OR REPLACE FUNCTION update_daily_logs_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trigger_update_daily_logs_updated_at ON daily_logs;
CREATE TRIGGER trigger_update_daily_logs_updated_at
  BEFORE UPDATE ON daily_logs
  FOR EACH ROW
  EXECUTE FUNCTION update_daily_logs_updated_at();

-- RLS
ALTER TABLE daily_logs ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users can view their own daily logs" ON daily_logs;
CREATE POLICY "Users can view their own daily logs"
  ON daily_logs FOR SELECT
  USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can create their own daily logs" ON daily_logs;
CREATE POLICY "Users can create their own daily logs"
  ON daily_logs FOR INSERT
  WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can update their own daily logs" ON daily_logs;
CREATE POLICY "Users can update their own daily logs"
  ON daily_logs FOR UPDATE
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can delete their own daily logs" ON daily_logs;
CREATE POLICY "Users can delete their own daily logs"
  ON daily_logs FOR DELETE
  USING (auth.uid() = user_id);

-- ============================================
-- 3. MEDIA ITEMS TABLE
-- Photos and videos with EXIF dates
-- ============================================

CREATE TABLE IF NOT EXISTS media_items (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  file_url TEXT NOT NULL,
  file_type TEXT NOT NULL CHECK (file_type IN ('image', 'video')),
  original_date DATE,
  log_date DATE,
  caption TEXT,
  tags TEXT[],
  metadata JSONB DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL
);

-- Indexes
CREATE INDEX IF NOT EXISTS idx_media_items_user_id ON media_items(user_id);
CREATE INDEX IF NOT EXISTS idx_media_items_original_date ON media_items(original_date DESC);
CREATE INDEX IF NOT EXISTS idx_media_items_log_date ON media_items(log_date);
CREATE INDEX IF NOT EXISTS idx_media_items_user_original_date ON media_items(user_id, original_date DESC);
CREATE INDEX IF NOT EXISTS idx_media_items_tags ON media_items USING GIN(tags);
CREATE INDEX IF NOT EXISTS idx_media_items_metadata ON media_items USING GIN(metadata);

-- RLS
ALTER TABLE media_items ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users can view their own media" ON media_items;
CREATE POLICY "Users can view their own media"
  ON media_items FOR SELECT
  USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can create their own media" ON media_items;
CREATE POLICY "Users can create their own media"
  ON media_items FOR INSERT
  WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can update their own media" ON media_items;
CREATE POLICY "Users can update their own media"
  ON media_items FOR UPDATE
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can delete their own media" ON media_items;
CREATE POLICY "Users can delete their own media"
  ON media_items FOR DELETE
  USING (auth.uid() = user_id);

-- ============================================
-- 4. VIDEO STORIES TABLE
-- Generated scripts for story videos
-- ============================================

CREATE TABLE IF NOT EXISTS video_stories (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  title TEXT NOT NULL,
  date_range_start DATE,
  date_range_end DATE,
  script_text TEXT NOT NULL,
  script_metadata JSONB DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
  updated_at TIMESTAMPTZ DEFAULT NOW() NOT NULL
);

-- Indexes
CREATE INDEX IF NOT EXISTS idx_video_stories_user_id ON video_stories(user_id);
CREATE INDEX IF NOT EXISTS idx_video_stories_created_at ON video_stories(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_video_stories_user_created ON video_stories(user_id, created_at DESC);

-- Auto-update updated_at trigger
CREATE OR REPLACE FUNCTION update_video_stories_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trigger_update_video_stories_updated_at ON video_stories;
CREATE TRIGGER trigger_update_video_stories_updated_at
  BEFORE UPDATE ON video_stories
  FOR EACH ROW
  EXECUTE FUNCTION update_video_stories_updated_at();

-- RLS
ALTER TABLE video_stories ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users can view their own stories" ON video_stories;
CREATE POLICY "Users can view their own stories"
  ON video_stories FOR SELECT
  USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can create their own stories" ON video_stories;
CREATE POLICY "Users can create their own stories"
  ON video_stories FOR INSERT
  WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can update their own stories" ON video_stories;
CREATE POLICY "Users can update their own stories"
  ON video_stories FOR UPDATE
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can delete their own stories" ON video_stories;
CREATE POLICY "Users can delete their own stories"
  ON video_stories FOR DELETE
  USING (auth.uid() = user_id);

-- ============================================
-- 5. GRANT PERMISSIONS
-- ============================================

GRANT SELECT, INSERT, UPDATE, DELETE ON daily_logs TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON media_items TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON video_stories TO authenticated;

-- ============================================
-- MIGRATION COMPLETE
-- ============================================

-- Next steps:
-- 1. Run this migration in Supabase SQL Editor ✓
-- 2. Create 'media-items' storage bucket via Dashboard
-- 3. Add storage policies via Dashboard (see below)
-- 4. Start backfilling daily_logs!