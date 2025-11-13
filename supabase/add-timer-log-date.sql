-- Add log_date field to timer_sessions table
-- This ensures timer sessions appear on the correct day in DailyView,
-- accounting for timezone differences between UTC storage and local display

-- Add the log_date column
ALTER TABLE timer_sessions
ADD COLUMN IF NOT EXISTS log_date DATE;

-- Create index for performance (since DailyView will query by log_date)
CREATE INDEX IF NOT EXISTS idx_timer_sessions_log_date
ON timer_sessions(user_id, log_date);

-- Backfill existing timer_sessions with log_date based on start_time
-- Note: This converts start_time to DATE, which uses UTC timezone
-- This is not perfect for users in non-UTC timezones, but it's a starting point
UPDATE timer_sessions
SET log_date = start_time::DATE
WHERE log_date IS NULL;

-- Create trigger function to auto-populate log_date for new/updated timer sessions
-- This acts as a fallback in case the client doesn't set log_date explicitly
CREATE OR REPLACE FUNCTION auto_populate_timer_log_date()
RETURNS TRIGGER AS $$
BEGIN
  -- If log_date is not provided and start_time exists, calculate it
  IF NEW.log_date IS NULL AND NEW.start_time IS NOT NULL THEN
    -- Convert TIMESTAMPTZ to DATE
    -- Note: This uses UTC timezone. For better timezone support,
    -- you would need to add a timezone field to user_settings and use:
    -- NEW.log_date := (NEW.start_time AT TIME ZONE user_timezone)::DATE;
    NEW.log_date := NEW.start_time::DATE;
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger to run before INSERT or UPDATE
DROP TRIGGER IF EXISTS trigger_auto_populate_timer_log_date ON timer_sessions;
CREATE TRIGGER trigger_auto_populate_timer_log_date
  BEFORE INSERT OR UPDATE ON timer_sessions
  FOR EACH ROW
  EXECUTE FUNCTION auto_populate_timer_log_date();

-- Add comment explaining the log_date field
COMMENT ON COLUMN timer_sessions.log_date IS
'The calendar date for this timer session, used for daily view grouping. Should be set based on the user''s local timezone.';
