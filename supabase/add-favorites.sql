-- ============================================
-- ADD FAVORITES FEATURE TO CAPTURES
-- ============================================

-- Add is_favorited column to captures table
ALTER TABLE captures
ADD COLUMN IF NOT EXISTS is_favorited BOOLEAN DEFAULT FALSE NOT NULL;

-- Create index for favorited queries
CREATE INDEX IF NOT EXISTS idx_captures_is_favorited ON captures(is_favorited);

-- Create index for combined user_id and is_favorited (for efficient filtering)
CREATE INDEX IF NOT EXISTS idx_captures_user_favorited ON captures(user_id, is_favorited) WHERE is_favorited = TRUE;
