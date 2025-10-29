-- ============================================
-- FIX: Auto-populate cycle info trigger
-- ============================================
-- The issue: The trigger was calling calculate_cycle_info with a column
-- definition list, but since the function uses OUT parameters, this is
-- redundant and causes a SQL error.

CREATE OR REPLACE FUNCTION auto_populate_cycle_info()
RETURNS TRIGGER AS $$
DECLARE
  v_cycle_day INTEGER;
  v_cycle_phase TEXT;
BEGIN
  -- Only calculate if log_date is set
  IF NEW.log_date IS NOT NULL THEN
    -- Call the function without column definition list (it has OUT parameters)
    SELECT * INTO v_cycle_day, v_cycle_phase
    FROM calculate_cycle_info(NEW.user_id, NEW.log_date);

    NEW.cycle_day := v_cycle_day;
    NEW.cycle_phase := v_cycle_phase;
  END IF;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Recreate the trigger
DROP TRIGGER IF EXISTS trigger_auto_populate_cycle_info ON captures;
CREATE TRIGGER trigger_auto_populate_cycle_info
  BEFORE INSERT OR UPDATE ON captures
  FOR EACH ROW
  EXECUTE FUNCTION auto_populate_cycle_info();
