-- ============================================
-- DAILY TASKS TABLE
-- Tasks parsed from planning voice captures
-- Part of Cycle-Centric System (Phase 1)
-- ============================================

CREATE TABLE IF NOT EXISTS daily_tasks (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,

  task_description TEXT NOT NULL CHECK (length(trim(task_description)) > 0),
  scheduled_time TIME, -- User's local time, NULL if unscheduled
  estimated_duration INTEGER, -- minutes

  priority TEXT CHECK (priority IN ('low', 'medium', 'high', NULL)),

  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'in_progress', 'completed')),

  -- Link to timer session when task is started
  timer_session_id UUID REFERENCES timer_sessions(id) ON DELETE SET NULL,

  -- Link back to the planning capture that created this task
  source_capture_id UUID REFERENCES captures(id) ON DELETE SET NULL,

  -- Date this task is for
  task_date DATE NOT NULL,

  -- Track when task was actually completed
  completed_at TIMESTAMPTZ,

  created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
  updated_at TIMESTAMPTZ DEFAULT NOW() NOT NULL
);

-- ============================================
-- INDEXES
-- ============================================

CREATE INDEX IF NOT EXISTS idx_daily_tasks_user_id ON daily_tasks(user_id);
CREATE INDEX IF NOT EXISTS idx_daily_tasks_task_date ON daily_tasks(task_date DESC);
CREATE INDEX IF NOT EXISTS idx_daily_tasks_user_date ON daily_tasks(user_id, task_date DESC);
CREATE INDEX IF NOT EXISTS idx_daily_tasks_status ON daily_tasks(status);
CREATE INDEX IF NOT EXISTS idx_daily_tasks_timer_session ON daily_tasks(timer_session_id);
CREATE INDEX IF NOT EXISTS idx_daily_tasks_source_capture ON daily_tasks(source_capture_id);

-- Composite index for querying today's tasks
CREATE INDEX IF NOT EXISTS idx_daily_tasks_user_date_status ON daily_tasks(user_id, task_date, status);

-- Partial index for finding incomplete tasks efficiently
CREATE INDEX IF NOT EXISTS idx_daily_tasks_user_incomplete 
  ON daily_tasks(user_id, task_date) 
  WHERE status IN ('pending', 'in_progress');

-- ============================================
-- AUTO-UPDATE TRIGGERS
-- ============================================

-- Update updated_at timestamp
CREATE OR REPLACE FUNCTION update_daily_tasks_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trigger_update_daily_tasks_updated_at ON daily_tasks;
CREATE TRIGGER trigger_update_daily_tasks_updated_at
  BEFORE UPDATE ON daily_tasks
  FOR EACH ROW
  EXECUTE FUNCTION update_daily_tasks_updated_at();

-- Auto-populate completed_at when status changes to completed
CREATE OR REPLACE FUNCTION auto_set_task_completed_at()
RETURNS TRIGGER AS $$
BEGIN
  -- If status is being changed to 'completed' and completed_at is not already set
  IF NEW.status = 'completed' AND OLD.status != 'completed' AND NEW.completed_at IS NULL THEN
    NEW.completed_at = NOW();
  END IF;
  
  -- If status is being changed from 'completed' to something else, clear completed_at
  IF NEW.status != 'completed' AND OLD.status = 'completed' THEN
    NEW.completed_at = NULL;
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trigger_auto_set_task_completed_at ON daily_tasks;
CREATE TRIGGER trigger_auto_set_task_completed_at
  BEFORE UPDATE ON daily_tasks
  FOR EACH ROW
  EXECUTE FUNCTION auto_set_task_completed_at();

-- ============================================
-- ROW LEVEL SECURITY (RLS)
-- ============================================

ALTER TABLE daily_tasks ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users can view their own tasks" ON daily_tasks;
CREATE POLICY "Users can view their own tasks"
  ON daily_tasks FOR SELECT
  USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can create their own tasks" ON daily_tasks;
CREATE POLICY "Users can create their own tasks"
  ON daily_tasks FOR INSERT
  WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can update their own tasks" ON daily_tasks;
CREATE POLICY "Users can update their own tasks"
  ON daily_tasks FOR UPDATE
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can delete their own tasks" ON daily_tasks;
CREATE POLICY "Users can delete their own tasks"
  ON daily_tasks FOR DELETE
  USING (auth.uid() = user_id);

-- ============================================
-- GRANT PERMISSIONS
-- ============================================

GRANT SELECT, INSERT, UPDATE, DELETE ON daily_tasks TO authenticated;

-- ============================================
-- DAILY TASKS TABLE COMPLETE
-- ============================================