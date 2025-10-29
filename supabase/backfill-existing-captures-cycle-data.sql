-- ============================================
-- BACKFILL: Update existing captures with cycle info
-- ============================================
-- This script updates all existing captures that have a log_date
-- but no cycle_day/cycle_phase data

-- First, let's see how many captures need updating
SELECT COUNT(*) as captures_needing_update
FROM captures
WHERE log_date IS NOT NULL
  AND cycle_day IS NULL;

-- Update all captures with cycle info
-- This will call the trigger for each row
-- We use a dummy update (setting cycle_day to itself) to trigger the trigger
UPDATE captures
SET cycle_day = cycle_day
WHERE log_date IS NOT NULL
  AND cycle_day IS NULL;

-- Verify the update
SELECT COUNT(*) as captures_with_cycle_data
FROM captures
WHERE cycle_day IS NOT NULL;

-- Show some examples
SELECT
  id,
  log_date,
  cycle_day,
  cycle_phase,
  created_at
FROM captures
WHERE cycle_day IS NOT NULL
ORDER BY log_date DESC
LIMIT 10;
