-- ============================================
-- TIMER SESSIONS TABLE
-- Tracks activities/tasks with start/end times
-- Part of Cycle-Centric System (Phase 1)
-- ============================================

CREATE TABLE IF NOT EXISTS timer_sessions (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,

  name TEXT NOT NULL,
  description TEXT,

  start_time TIMESTAMPTZ NOT NULL,
  end_time TIMESTAMPTZ, -- NULL if still running

  status TEXT NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'paused', 'completed')),

  -- Cycle context (auto-populated by trigger)
  cycle_day INTEGER,
  cycle_phase TEXT CHECK (cycle_phase IN ('menstrual', 'follicular', 'ovulation', 'luteal', NULL)),

  created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
  updated_at TIMESTAMPTZ DEFAULT NOW() NOT NULL
);

-- ============================================
-- INDEXES
-- ============================================

CREATE INDEX IF NOT EXISTS idx_timer_sessions_user_id ON timer_sessions(user_id);
CREATE INDEX IF NOT EXISTS idx_timer_sessions_start_time ON timer_sessions(start_time DESC);
CREATE INDEX IF NOT EXISTS idx_timer_sessions_user_start ON timer_sessions(user_id, start_time DESC);
CREATE INDEX IF NOT EXISTS idx_timer_sessions_status ON timer_sessions(status);
CREATE INDEX IF NOT EXISTS idx_timer_sessions_cycle_day ON timer_sessions(cycle_day);
CREATE INDEX IF NOT EXISTS idx_timer_sessions_cycle_phase ON timer_sessions(cycle_phase);

-- Index for querying timers by date range (for calendar views)
CREATE INDEX IF NOT EXISTS idx_timer_sessions_user_date_range ON timer_sessions(user_id, start_time, end_time);

-- ============================================
-- AUTO-UPDATE TRIGGERS
-- ============================================

-- Update updated_at timestamp
CREATE OR REPLACE FUNCTION update_timer_sessions_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trigger_update_timer_sessions_updated_at ON timer_sessions;
CREATE TRIGGER trigger_update_timer_sessions_updated_at
  BEFORE UPDATE ON timer_sessions
  FOR EACH ROW
  EXECUTE FUNCTION update_timer_sessions_updated_at();

-- Auto-populate cycle info based on start_time
CREATE OR REPLACE FUNCTION auto_populate_timer_cycle_info()
RETURNS TRIGGER AS $$
DECLARE
  v_cycle_day INTEGER;
  v_cycle_phase TEXT;
BEGIN
  -- Calculate cycle info based on start_time date
  IF NEW.start_time IS NOT NULL THEN
    SELECT cd, cp INTO v_cycle_day, v_cycle_phase
    FROM calculate_cycle_info(NEW.user_id, NEW.start_time::DATE) AS (cd INTEGER, cp TEXT);

    NEW.cycle_day := v_cycle_day;
    NEW.cycle_phase := v_cycle_phase;
  END IF;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trigger_auto_populate_timer_cycle_info ON timer_sessions;
CREATE TRIGGER trigger_auto_populate_timer_cycle_info
  BEFORE INSERT OR UPDATE ON timer_sessions
  FOR EACH ROW
  EXECUTE FUNCTION auto_populate_timer_cycle_info();

-- ============================================
-- ROW LEVEL SECURITY (RLS)
-- ============================================

ALTER TABLE timer_sessions ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users can view their own timer sessions" ON timer_sessions;
CREATE POLICY "Users can view their own timer sessions"
  ON timer_sessions FOR SELECT
  USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can create their own timer sessions" ON timer_sessions;
CREATE POLICY "Users can create their own timer sessions"
  ON timer_sessions FOR INSERT
  WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can update their own timer sessions" ON timer_sessions;
CREATE POLICY "Users can update their own timer sessions"
  ON timer_sessions FOR UPDATE
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can delete their own timer sessions" ON timer_sessions;
CREATE POLICY "Users can delete their own timer sessions"
  ON timer_sessions FOR DELETE
  USING (auth.uid() = user_id);

-- ============================================
-- GRANT PERMISSIONS
-- ============================================

GRANT SELECT, INSERT, UPDATE, DELETE ON timer_sessions TO authenticated;

-- ============================================
-- TIMER SESSIONS TABLE COMPLETE
-- ============================================
