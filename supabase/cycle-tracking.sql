-- ============================================
-- MENSTRUAL CYCLE TRACKING TABLES
-- ============================================

-- Cycle periods table (tracks each menstrual period)
CREATE TABLE IF NOT EXISTS cycle_periods (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  start_date DATE NOT NULL,
  end_date DATE, -- Null if currently ongoing
  flow_intensity TEXT, -- 'light', 'medium', 'heavy' (optional)
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
  updated_at TIMESTAMPTZ DEFAULT NOW() NOT NULL
);

-- Indexes
CREATE INDEX IF NOT EXISTS idx_cycle_periods_user_id ON cycle_periods(user_id);
CREATE INDEX IF NOT EXISTS idx_cycle_periods_start_date ON cycle_periods(start_date DESC);
CREATE INDEX IF NOT EXISTS idx_cycle_periods_user_start ON cycle_periods(user_id, start_date DESC);

-- Auto-update updated_at trigger
CREATE OR REPLACE FUNCTION update_cycle_periods_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trigger_update_cycle_periods_updated_at ON cycle_periods;
CREATE TRIGGER trigger_update_cycle_periods_updated_at
  BEFORE UPDATE ON cycle_periods
  FOR EACH ROW
  EXECUTE FUNCTION update_cycle_periods_updated_at();

-- RLS
ALTER TABLE cycle_periods ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users can view their own cycle periods" ON cycle_periods;
CREATE POLICY "Users can view their own cycle periods"
  ON cycle_periods FOR SELECT
  USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can create their own cycle periods" ON cycle_periods;
CREATE POLICY "Users can create their own cycle periods"
  ON cycle_periods FOR INSERT
  WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can update their own cycle periods" ON cycle_periods;
CREATE POLICY "Users can update their own cycle periods"
  ON cycle_periods FOR UPDATE
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can delete their own cycle periods" ON cycle_periods;
CREATE POLICY "Users can delete their own cycle periods"
  ON cycle_periods FOR DELETE
  USING (auth.uid() = user_id);

-- ============================================
-- ADD CYCLE METADATA TO CAPTURES
-- ============================================

ALTER TABLE captures
ADD COLUMN IF NOT EXISTS cycle_day INTEGER,
ADD COLUMN IF NOT EXISTS cycle_phase TEXT;

-- Add constraint for cycle_phase
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint
    WHERE conname = 'captures_cycle_phase_check'
  ) THEN
    ALTER TABLE captures
    ADD CONSTRAINT captures_cycle_phase_check
    CHECK (cycle_phase IN ('menstrual', 'follicular', 'ovulation', 'luteal', NULL));
  END IF;
END $$;

-- Create indexes for cycle queries
CREATE INDEX IF NOT EXISTS idx_captures_cycle_day ON captures(cycle_day);
CREATE INDEX IF NOT EXISTS idx_captures_cycle_phase ON captures(cycle_phase);

-- ============================================
-- GRANT PERMISSIONS
-- ============================================

GRANT SELECT, INSERT, UPDATE, DELETE ON cycle_periods TO authenticated;

-- ============================================
-- HELPER FUNCTION: Calculate Cycle Day and Phase
-- ============================================

-- This function calculates cycle day and phase based on a date
-- Average cycle length: 28 days (can be customized per user later)
-- Phases:
--   Menstrual: Days 1-5
--   Follicular: Days 6-13
--   Ovulation: Days 14-15
--   Luteal: Days 16-28

CREATE OR REPLACE FUNCTION calculate_cycle_info(
  p_user_id UUID,
  p_date DATE,
  OUT cycle_day INTEGER,
  OUT cycle_phase TEXT
) AS $$
DECLARE
  v_last_period_start DATE;
  v_days_since_start INTEGER;
BEGIN
  -- Find the most recent period start date on or before p_date
  SELECT start_date INTO v_last_period_start
  FROM cycle_periods
  WHERE user_id = p_user_id
    AND start_date <= p_date
  ORDER BY start_date DESC
  LIMIT 1;

  IF v_last_period_start IS NULL THEN
    -- No cycle data available
    cycle_day := NULL;
    cycle_phase := NULL;
    RETURN;
  END IF;

  -- Calculate days since period started
  v_days_since_start := p_date - v_last_period_start;

  -- Calculate cycle day (assuming 28-day cycle)
  cycle_day := (v_days_since_start % 28) + 1;

  -- Determine phase based on cycle day
  CASE
    WHEN cycle_day BETWEEN 1 AND 5 THEN
      cycle_phase := 'menstrual';
    WHEN cycle_day BETWEEN 6 AND 13 THEN
      cycle_phase := 'follicular';
    WHEN cycle_day BETWEEN 14 AND 15 THEN
      cycle_phase := 'ovulation';
    ELSE
      cycle_phase := 'luteal';
  END CASE;
END;
$$ LANGUAGE plpgsql;

-- ============================================
-- TRIGGER: Auto-populate cycle info on captures
-- ============================================

CREATE OR REPLACE FUNCTION auto_populate_cycle_info()
RETURNS TRIGGER AS $$
DECLARE
  v_cycle_day INTEGER;
  v_cycle_phase TEXT;
BEGIN
  -- Only calculate if log_date is set
  IF NEW.log_date IS NOT NULL THEN
    SELECT cd, cp INTO v_cycle_day, v_cycle_phase
    FROM calculate_cycle_info(NEW.user_id, NEW.log_date) AS (cd INTEGER, cp TEXT);

    NEW.cycle_day := v_cycle_day;
    NEW.cycle_phase := v_cycle_phase;
  END IF;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trigger_auto_populate_cycle_info ON captures;
CREATE TRIGGER trigger_auto_populate_cycle_info
  BEFORE INSERT OR UPDATE ON captures
  FOR EACH ROW
  EXECUTE FUNCTION auto_populate_cycle_info();