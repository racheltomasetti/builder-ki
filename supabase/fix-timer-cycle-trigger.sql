-- ============================================
-- FIX TIMER CYCLE TRIGGER
-- Remove redundant column definition list
-- ============================================

-- Drop and recreate the trigger function with correct syntax
CREATE OR REPLACE FUNCTION auto_populate_timer_cycle_info()
RETURNS TRIGGER AS $$
DECLARE
  v_cycle_day INTEGER;
  v_cycle_phase TEXT;
BEGIN
  -- Calculate cycle info based on start_time date
  IF NEW.start_time IS NOT NULL THEN
    -- Call function without column definition list (function has OUT parameters)
    SELECT cycle_day, cycle_phase INTO v_cycle_day, v_cycle_phase
    FROM calculate_cycle_info(NEW.user_id, NEW.start_time::DATE);

    NEW.cycle_day := v_cycle_day;
    NEW.cycle_phase := v_cycle_phase;
  END IF;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger should already exist, but recreate just in case
DROP TRIGGER IF EXISTS trigger_auto_populate_timer_cycle_info ON timer_sessions;
CREATE TRIGGER trigger_auto_populate_timer_cycle_info
  BEFORE INSERT OR UPDATE ON timer_sessions
  FOR EACH ROW
  EXECUTE FUNCTION auto_populate_timer_cycle_info();
