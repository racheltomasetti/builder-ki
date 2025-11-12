-- ============================================
-- ALTER CAPTURES TABLE
-- Add timer_session_ids to link captures to active timers
-- Part of Cycle-Centric System (Phase 1)
-- ============================================

-- Add timer_session_ids array column
-- This supports many-to-many: one capture can be during multiple concurrent timers
ALTER TABLE captures
ADD COLUMN IF NOT EXISTS timer_session_ids UUID[] DEFAULT '{}';

-- ============================================
-- INDEXES
-- ============================================

-- GIN index for querying captures by timer session
-- Allows queries like: WHERE timer_session_id = ANY(timer_session_ids)
CREATE INDEX IF NOT EXISTS idx_captures_timer_sessions ON captures USING GIN(timer_session_ids);

-- ============================================
-- VALIDATION TRIGGERS
-- ============================================

-- Validate that all timer_session_ids exist and belong to the user
CREATE OR REPLACE FUNCTION validate_timer_session_ids()
RETURNS TRIGGER AS $$
DECLARE
  v_timer_id UUID;
  v_count INTEGER;
BEGIN
  -- If timer_session_ids is not null and not empty
  IF NEW.timer_session_ids IS NOT NULL AND array_length(NEW.timer_session_ids, 1) > 0 THEN
    -- Check each timer_session_id
    FOREACH v_timer_id IN ARRAY NEW.timer_session_ids
    LOOP
      -- Verify timer exists and belongs to the same user
      SELECT COUNT(*) INTO v_count
      FROM timer_sessions
      WHERE id = v_timer_id AND user_id = NEW.user_id;
      
      IF v_count = 0 THEN
        RAISE EXCEPTION 'Invalid timer_session_id: % does not exist or does not belong to user', v_timer_id;
      END IF;
    END LOOP;
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trigger_validate_timer_session_ids ON captures;
CREATE TRIGGER trigger_validate_timer_session_ids
  BEFORE INSERT OR UPDATE ON captures
  FOR EACH ROW
  EXECUTE FUNCTION validate_timer_session_ids();

-- ============================================
-- CLEANUP TRIGGERS
-- ============================================

-- Remove deleted timer_session_id from all captures
CREATE OR REPLACE FUNCTION cleanup_deleted_timer_from_captures()
RETURNS TRIGGER AS $$
BEGIN
  -- Remove the deleted timer_id from all captures that reference it
  UPDATE captures
  SET timer_session_ids = array_remove(timer_session_ids, OLD.id)
  WHERE OLD.id = ANY(timer_session_ids);
  
  RETURN OLD;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trigger_cleanup_deleted_timer_from_captures ON timer_sessions;
CREATE TRIGGER trigger_cleanup_deleted_timer_from_captures
  AFTER DELETE ON timer_sessions
  FOR EACH ROW
  EXECUTE FUNCTION cleanup_deleted_timer_from_captures();

-- ============================================
-- ALTER CAPTURES TABLE COMPLETE
-- ============================================

-- Usage examples:
--
-- 1. Find all captures during a specific timer:
--    SELECT * FROM captures WHERE 'timer-uuid' = ANY(timer_session_ids);
--
-- 2. Find captures during any active timer:
--    SELECT c.* FROM captures c
--    WHERE EXISTS (
--      SELECT 1 FROM timer_sessions t
--      WHERE t.id = ANY(c.timer_session_ids) AND t.status = 'active'
--    );
--
-- 3. Insert capture with active timers:
--    INSERT INTO captures (user_id, type, file_url, timer_session_ids, ...)
--    VALUES (user_id, 'voice', 'url', ARRAY['timer-id-1', 'timer-id-2']::UUID[], ...);
--
-- 4. Get all timer sessions associated with a capture:
--    SELECT t.* FROM timer_sessions t
--    WHERE t.id = ANY((SELECT timer_session_ids FROM captures WHERE id = 'capture-uuid'));
--
-- 5. Remove a specific timer from a capture:
--    UPDATE captures 
--    SET timer_session_ids = array_remove(timer_session_ids, 'timer-uuid')
--    WHERE id = 'capture-uuid';
--
-- 6. Add a timer to an existing capture:
--    UPDATE captures 
--    SET timer_session_ids = array_append(timer_session_ids, 'new-timer-uuid')
--    WHERE id = 'capture-uuid';