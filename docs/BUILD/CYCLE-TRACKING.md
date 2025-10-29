# 🌙 MENSTRUAL CYCLE TRACKING - BUILD PLAN

## OVERVIEW

Add menstrual cycle tracking to KI so users can:

- Log their period in the mobile app via a modal
- See their cycle day in a circular indicator (top-left header on mobile)
- View cycle day/phase alongside captures in the web dashboard
- Track cycle patterns over time

---

## 🎯 PHASE-BY-PHASE BUILD PLAN

### PHASE 1: Database Schema (20-30 min) [x]

**Goal:** Add cycle tracking tables and update captures to include cycle metadata

**Tasks:**

1. Create migration: `supabase/cycle-tracking.sql`
2. Run on Supabase

**Schema:**

```sql
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
```

**After this phase:**

- Database can store cycle period data
- Captures automatically get cycle_day and cycle_phase populated
- Helper function available to calculate cycle info for any date

---

### PHASE 2: Mobile - Cycle Indicator & Modal

**Goal:** Add cycle day indicator to header with modal for logging periods

**Tasks:**

#### 2A: Create Cycle Indicator Component (30 min) [x]

Create: `mobile/components/CycleIndicator.tsx`

**Features:**

- Circular badge showing cycle day
- Positioned in header (top-left)
- Changes color based on phase:
  - Menstrual: Red (#E74C3C)
  - Follicular: Orange (#F39C12)
  - Ovulation: Green (#27AE60)
  - Luteal: Purple (#9B59B6)
- Tappable to open cycle modal
- Shows "?" if no cycle data

**Component Structure:**

```tsx
import { View, Text, TouchableOpacity, StyleSheet } from "react-native";

interface CycleIndicatorProps {
  cycleDay: number | null;
  cyclePhase: string | null;
  onPress: () => void;
}

export default function CycleIndicator({
  cycleDay,
  cyclePhase,
  onPress,
}: CycleIndicatorProps) {
  // Returns circle with cycle day, colored by phase
  // If no data, show "?" in gray
}
```

#### 2B: Create Cycle Modal Component [x]

Create: `mobile/components/CycleModal.tsx`

**Features:**

- Modal overlay (semi-transparent background)
- Card with cycle tracking interface
- Options:
  1. **"Start Period"** - Logs new period starting today
  2. **"End Period"** - Ends current ongoing period
  3. **"View History"** - Shows last 3-4 periods with dates
  4. **Close button (X)**
- Date picker for backdating if needed
- Simple, clean UI matching app aesthetic

**UI Layout:**

```
┌─────────────────────────────────┐
│          Cycle Tracking         │
├─────────────────────────────────┤
│                                 │
│  Current Status:                │
│  Day 11 - Follicular Phase      │
│  (or "No cycle data yet")       │
│                                 │
│  [📅 Start Period]              │
│                                 │
│  [🩸 End Current Period]        │
│  (only if period is ongoing)    │
│                                 │
│  ──────────────────────────     │
│                                 │
│  Recent Periods:                │
│  • Sep 24 - Oct 18 (25 days)     │
│  • Aug 29 - Sep 23 (26 days)     │
│  • Aug 07 - Aug 28 (22 days)     │
│                                 │
│            [Close]              │
└─────────────────────────────────┘
```

#### 2C: Integrate Indicator into App [x]

Update: `mobile/screens/DailyLogScreen.tsx` (and other main screens)

- Add `CycleIndicator` to top-left of header
- Manage modal open/close state
- Fetch current cycle info on mount
- Refresh cycle info after modal actions

#### 2D: Add Cycle API Hooks [x]

Create: `mobile/lib/cycleApi.ts`

Functions needed:

- `getCurrentCycleInfo(userId: string)` - Get current cycle day/phase
- `startPeriod(userId: string, date: string)` - Log period start
- `endPeriod(userId: string, periodId: string, date: string)` - Log period end
- `getRecentPeriods(userId: string, limit: number)` - Get period history
- `calculateCycleDay(userId: string, date: string)` - Calculate cycle info for a date

**After this phase:**

- Mobile app shows cycle indicator in header
- Users can tap to open modal
- Users can log period start/end
- Cycle day updates automatically

---

### PHASE 3: Web - Display Cycle Info on Captures

**Goal:** Show cycle day and phase alongside captures in web dashboard

**Tasks:**

#### 3A: Update Capture Display Components

Update: `web/components/DailyView.tsx`

- Add cycle day/phase display to each capture card
- Format: "Day 12 • Follicular" (with colored dot)
- Use same color scheme as mobile:
  - Menstrual: Blue
  - Follicular: Green
  - Ovulation: Yellow
  - Luteal: Orange
- Show below or next to timestamp

**Capture Card Update:**

```tsx
<div className="capture-metadata">
  <span className="timestamp">
    {formatDate(capture.created_at)} • {formatTime(capture.created_at)}
  </span>
  {capture.cycle_day && (
    <span className="cycle-info">
      <span className={`cycle-dot ${capture.cycle_phase}`} />
      Day {capture.cycle_day} • {formatPhase(capture.cycle_phase)}
    </span>
  )}
</div>
```

#### 3B: Update Feed View

Update: `web/app/dashboard/page.tsx` (stream of thoughts view)

- Add cycle metadata to capture cards in feed
- Ensure it displays cleanly in both views (feed & daily)

#### 3C: Add Cycle Styling

Update: `web/styles/globals.css` or component styles

- Add phase color classes
- Add cycle dot styles
- Ensure responsive design

**After this phase:**

- Web dashboard shows cycle info on captures
- Cycle data visible in both feed and daily views
- Clean, color-coded display

---

### PHASE 4: Cycle Data Backfill & Testing

**Goal:** Backfill historical cycle data and test the system

**Tasks:**

#### 4A: Create Backfill Script

Create: `scripts/backfill-cycle-data.sql`

- SQL script to insert historical period data
- Based on average 28-day cycle
- Builder has a list of historical dates that can be provided to populate the profile.

**Example:**

```sql
-- Backfill Rachel's cycle data (example)
-- Assuming 28-day cycle, 5-day periods

INSERT INTO cycle_periods (user_id, start_date, end_date)
VALUES
  ('USER_UUID', '2024-10-15', '2024-10-19'),
  ('USER_UUID', '2024-09-17', '2024-09-21'),
  ('USER_UUID', '2024-08-20', '2024-08-24'),
  ('USER_UUID', '2024-07-23', '2024-07-27')
ON CONFLICT DO NOTHING;

-- Update existing captures with cycle info
UPDATE captures
SET
  cycle_day = (SELECT cd FROM calculate_cycle_info(user_id, log_date) AS (cd INTEGER, cp TEXT)),
  cycle_phase = (SELECT cp FROM calculate_cycle_info(user_id, log_date) AS (cd INTEGER, cp TEXT))
WHERE user_id = 'USER_UUID'
  AND log_date IS NOT NULL;
```

#### 4B: Test Cycle Calculations

- Verify cycle day calculations are accurate
- Test period logging (start/end)
- Test cycle phase transitions
- Verify colors display correctly on mobile and web

**After this phase:**

- Historical cycle data populated
- System tested and verified
- Ready for daily use

---

## ✅ SUCCESS CRITERIA

After implementation:

- [x] Cycle indicator appears in mobile app header (all main screens)
- [x] Tapping indicator opens cycle modal
- [x] Users can log period start/end in modal
- [x] Modal shows recent period history
- [x] Cycle day and phase display correctly
- [x] Captures on web show cycle metadata (day + phase)
- [x] Cycle info is color-coded consistently across mobile/web
- [ ] Historical cycle data backfilled
- [x] New captures automatically get cycle info populated

---

## 🎨 DESIGN SPECS

### Colors (for cycle phases)

```tsx
const CYCLE_COLORS = {
  menstrual: "#205EA6", // Blue - inner winter & reflection
  follicular: "#66800B", // Green - inner spring & growth
  ovulation: "#AD8301", // Yellow - inner summer & energy
  luteal: "#BC5215", // Orange - inner autumn & focus
  unknown: "#95A5A6", // Gray
};
```

### Cycle Phase Labels

```tsx
const PHASE_LABELS = {
  menstrual: "Menstrual",
  follicular: "Follicular",
  ovulation: "Ovulation",
  luteal: "Luteal",
};
```

### Mobile Indicator Size

- Circle diameter: 36px
- Font size: 14px (bold)
- Position: Top-left header, 12px from edge

### Web Cycle Display

- Dot size: 8px diameter
- Font size: 13px
- Position: Below timestamp, left-aligned
- Spacing: 4px between elements

---

## 📝 NOTES

- **Cycle Length:** Starting with 28-day average cycle. Can add user customization later.
- **Phase Definitions:** Using standard medical definitions for phase boundaries.
- **Privacy:** All cycle data is user-scoped with RLS policies.
- **Extensibility:** Schema supports optional fields (flow_intensity, notes) for future enhancements.
- **Accuracy:** Cycle calculations are estimates based on last period start. More accurate with more data.

---

## 🚀 FUTURE ENHANCEMENTS (Post-MVP)

- Custom cycle length per user
- Symptom tracking (mood, energy, pain levels)
- Predictions for next period
- Cycle analytics dashboard
- Export cycle data
- Sync with Oura
- Ovulation predictions
- Fertile window tracking

---

## 🔗 DEPENDENCIES

- Existing daily_logs table (already implemented)
- Captures table with log_date (already implemented)
- Mobile navigation structure (already implemented)
- Web DailyView component (already implemented)

---

## 📚 REFERENCE

### Menstrual Cycle Phases (~28-day cycle)

1. **Menstrual Phase** (Days 1-5)

   - Period bleeding
   - Lowest hormone levels
   - Energy typically lower

2. **Follicular Phase** (Days 6-13)

   - Post-period, pre-ovulation
   - Rising estrogen
   - Energy building

3. **Ovulation Phase** (Days 14-15)

   - Peak fertility
   - Highest estrogen
   - Peak energy and mood

4. **Luteal Phase** (Days 16-28)
   - Post-ovulation, pre-period
   - Rising progesterone
   - PMS symptoms may appear

---

Ready to build! 🎉
