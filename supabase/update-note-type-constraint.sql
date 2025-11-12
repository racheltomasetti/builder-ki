-- ============================================
-- UPDATE NOTE TYPE CONSTRAINT
-- Add 'planning' as valid note_type for captures
-- Part of Cycle-Centric System (Phase 1)
-- ============================================

-- Drop existing constraint
ALTER TABLE captures
DROP CONSTRAINT IF EXISTS captures_note_type_check;

-- Add updated constraint with 'planning' included
ALTER TABLE captures
ADD CONSTRAINT captures_note_type_check
CHECK (note_type IN ('intention', 'daily', 'reflection', 'planning', 'general'));

-- ============================================
-- OPTIONAL: ADD INDEX FOR NOTE TYPE FILTERING
-- ============================================

-- Index for filtering captures by type
CREATE INDEX IF NOT EXISTS idx_captures_note_type ON captures(note_type);

-- Composite index for common query: user's captures of specific type
CREATE INDEX IF NOT EXISTS idx_captures_user_note_type ON captures(user_id, note_type);

-- ============================================
-- NOTE TYPE CONSTRAINT UPDATED
-- ============================================

-- Valid note_types:
-- - 'intention': Morning intention voice (Plan view)
-- - 'planning': Daily planning voice that gets parsed into tasks (Plan view)
-- - 'daily': General captures throughout the day (Capture tab)
-- - 'reflection': Evening reflection voice (Plan view)
-- - 'general': Legacy/default type