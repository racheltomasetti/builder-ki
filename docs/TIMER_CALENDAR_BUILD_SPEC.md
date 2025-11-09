# Timer & Calendar Feature - Build Specification

## Vision

Create a holistic "extended mind" tool that connects the physical (BODY) and mental (MIND) dimensions of human experience. Users capture their lived experience through timer sessions that track flows, habits, and activities, with voice notes providing rich context within those flows. The web calendar visualizes this data in cycle-centric ways, revealing patterns and connections between mind and body.

**Core Philosophy**: MIND & BODY are inseparable. The calendar ties together:

- **BODY**: Biological cycles (menstrual cycle tracking), physical activities, habits
- **MIND**: Thoughts (voice captures), documents, agent interactions
- **FLOW**: Timer sessions that contextualize everything else

---

## User Flows

### Mobile: Timer Capture Flow

<!-- 1. User opens app to CaptureScreen
start flow button
2. User taps **TOP logo** (timer logo) → Modal appears
3. User names the timer (e.g., "Deep Work", "Morning Run", "Fasting")
4. Timer starts, shows elapsed time on screen
5. During timer session, user can capture voice notes → voice notes auto-tagged with active timer(s)
6. User stops timer when flow/activity ends
7. Timer session saved to database with start_time, end_time, duration -->

### Mobile: Voice + Timer Integration

- If timer(s) running when voice note captured → voice note tagged with all active timer session IDs
- If no timers running → voice note captured normally (existing flow)
- User can see which voice notes were captured during which timer sessions

### Web: Calendar Exploration Flow

1. User navigates to Calendar/Dashboard page
2. **Primary View**: Cycle-centric visualization (28-day wheel/circle)
   - Shows timer sessions mapped to cycle phases
   - Shows voice notes within timer blocks
   - Color-coded by cycle phase (menstrual, follicular, ovulation, luteal)
3. **Secondary View**: Week timeline view
   - Shows timer sessions as time blocks
   - Voice notes nested within timer blocks
   - Can switch between weeks
4. User clicks on timer session → sees details (duration, voice notes captured during, cycle phase)
5. User clicks on voice note → opens full transcription/journal entry

---

## Database Schema

### New Table: `timer_sessions`

```sql
CREATE TABLE timer_sessions (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,

  -- Timer metadata
  name TEXT NOT NULL,
  description TEXT,

  -- Timing (store start_time, calculate duration on-the-fly)
  start_time TIMESTAMPTZ NOT NULL,
  end_time TIMESTAMPTZ, -- NULL if timer still running

  -- Status
  status TEXT NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'paused', 'completed')),

  -- Future: Category/tagging (MIND, BODY, BOTH)
  -- category TEXT CHECK (category IN ('mind', 'body', 'both')),

  -- Cycle context (auto-populated via trigger, similar to captures)
  cycle_day INTEGER,
  cycle_phase TEXT CHECK (cycle_phase IN ('menstrual', 'follicular', 'ovulation', 'luteal', NULL)),

  created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
  updated_at TIMESTAMPTZ DEFAULT NOW() NOT NULL
);

-- Indexes
CREATE INDEX idx_timer_sessions_user_id ON timer_sessions(user_id);
CREATE INDEX idx_timer_sessions_start_time ON timer_sessions(start_time DESC);
CREATE INDEX idx_timer_sessions_user_start ON timer_sessions(user_id, start_time DESC);
CREATE INDEX idx_timer_sessions_status ON timer_sessions(status);
CREATE INDEX idx_timer_sessions_cycle_phase ON timer_sessions(cycle_phase);

-- Auto-update updated_at trigger
CREATE OR REPLACE FUNCTION update_timer_sessions_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_update_timer_sessions_updated_at
  BEFORE UPDATE ON timer_sessions
  FOR EACH ROW
  EXECUTE FUNCTION update_timer_sessions_updated_at();

-- Auto-populate cycle info trigger (similar to captures)
CREATE OR REPLACE FUNCTION auto_populate_timer_cycle_info()
RETURNS TRIGGER AS $$
DECLARE
  v_cycle_day INTEGER;
  v_cycle_phase TEXT;
  v_date DATE;
BEGIN
  -- Use start_time date for cycle calculation
  v_date := DATE(NEW.start_time);

  SELECT cd, cp INTO v_cycle_day, v_cycle_phase
  FROM calculate_cycle_info(NEW.user_id, v_date) AS (cd INTEGER, cp TEXT);

  NEW.cycle_day := v_cycle_day;
  NEW.cycle_phase := v_cycle_phase;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_auto_populate_timer_cycle_info
  BEFORE INSERT OR UPDATE ON timer_sessions
  FOR EACH ROW
  EXECUTE FUNCTION auto_populate_timer_cycle_info();

-- RLS Policies
ALTER TABLE timer_sessions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their own timer sessions"
  ON timer_sessions FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can create their own timer sessions"
  ON timer_sessions FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own timer sessions"
  ON timer_sessions FOR UPDATE
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete their own timer sessions"
  ON timer_sessions FOR DELETE
  USING (auth.uid() = user_id);

GRANT SELECT, INSERT, UPDATE, DELETE ON timer_sessions TO authenticated;
```

### Modify Existing Table: `captures`

Add timer session associations to voice captures:

```sql
-- Add timer session relationships
ALTER TABLE captures
ADD COLUMN IF NOT EXISTS timer_session_ids UUID[];

-- Index for querying captures by timer sessions
CREATE INDEX IF NOT EXISTS idx_captures_timer_sessions ON captures USING GIN(timer_session_ids);
```

**Rationale**: Using array of timer session IDs allows a voice note to be associated with multiple concurrent timers (e.g., "Fasting" + "Deep Work" running simultaneously).

---

## Data Relationships

### Timer → Voice Notes (One-to-Many)

- One timer session can have many voice notes captured during it
- Voice notes stored in `captures` table with `timer_session_ids` array
- Query: "Get all voice notes for timer session X"
  ```sql
  SELECT * FROM captures
  WHERE user_id = $1
    AND $2 = ANY(timer_session_ids)
  ORDER BY created_at;
  ```

### Voice Note → Timers (Many-to-Many)

- One voice note can be associated with multiple concurrent timer sessions
- Stored as array in `timer_session_ids` column
- Query: "Get all timers for voice note X"
  ```sql
  SELECT ts.* FROM timer_sessions ts
  WHERE ts.id = ANY(
    SELECT unnest(timer_session_ids)
    FROM captures
    WHERE id = $1
  );
  ```

### Timer → Cycle Phase (Enriched Context)

- Timer sessions auto-tagged with `cycle_day` and `cycle_phase` via trigger
- Enables filtering/grouping timers by cycle phase for insights
- Query: "Get all timer sessions during ovulation phase"
  ```sql
  SELECT * FROM timer_sessions
  WHERE user_id = $1
    AND cycle_phase = 'ovulation'
  ORDER BY start_time DESC;
  ```

---

## API Layer / Data Access Functions

### Mobile Timer Functions

```typescript
// lib/timerApi.ts

import { supabase } from "./supabase";

export interface TimerSession {
  id: string;
  user_id: string;
  name: string;
  description?: string;
  start_time: string;
  end_time?: string;
  status: "active" | "paused" | "completed";
  cycle_day?: number;
  cycle_phase?: string;
  created_at: string;
  updated_at: string;
}

// Start a new timer
export async function startTimer(
  userId: string,
  name: string,
  description?: string
): Promise<TimerSession> {
  const { data, error } = await supabase
    .from("timer_sessions")
    .insert({
      user_id: userId,
      name,
      description,
      start_time: new Date().toISOString(),
      status: "active",
    })
    .select()
    .single();

  if (error) throw error;
  return data;
}

// Stop a timer
export async function stopTimer(timerId: string): Promise<TimerSession> {
  const { data, error } = await supabase
    .from("timer_sessions")
    .update({
      end_time: new Date().toISOString(),
      status: "completed",
    })
    .eq("id", timerId)
    .select()
    .single();

  if (error) throw error;
  return data;
}

// Get all active timers for user
export async function getActiveTimers(userId: string): Promise<TimerSession[]> {
  const { data, error } = await supabase
    .from("timer_sessions")
    .select("*")
    .eq("user_id", userId)
    .eq("status", "active")
    .order("start_time", { ascending: false });

  if (error) throw error;
  return data || [];
}

// Pause a timer
export async function pauseTimer(timerId: string): Promise<TimerSession> {
  const { data, error } = await supabase
    .from("timer_sessions")
    .update({ status: "paused" })
    .eq("id", timerId)
    .select()
    .single();

  if (error) throw error;
  return data;
}

// Resume a paused timer
export async function resumeTimer(timerId: string): Promise<TimerSession> {
  const { data, error } = await supabase
    .from("timer_sessions")
    .update({ status: "active" })
    .eq("id", timerId)
    .select()
    .single();

  if (error) throw error;
  return data;
}

// Calculate elapsed time (handles running, paused, completed timers)
export function calculateElapsedTime(timer: TimerSession): number {
  const start = new Date(timer.start_time).getTime();
  const end = timer.end_time ? new Date(timer.end_time).getTime() : Date.now();
  return Math.floor((end - start) / 1000); // Return seconds
}

// Format elapsed time as HH:MM:SS
export function formatElapsedTime(seconds: number): string {
  const hours = Math.floor(seconds / 3600);
  const minutes = Math.floor((seconds % 3600) / 60);
  const secs = seconds % 60;

  if (hours > 0) {
    return `${hours.toString().padStart(2, "0")}:${minutes
      .toString()
      .padStart(2, "0")}:${secs.toString().padStart(2, "0")}`;
  }
  return `${minutes.toString().padStart(2, "0")}:${secs
    .toString()
    .padStart(2, "0")}`;
}
```

### Voice Capture Integration

Update `uploadVoiceCapture` function in `CaptureScreen.tsx`:

```typescript
// Get active timers before upload
const activeTimers = await getActiveTimers(user.id);
const timerSessionIds = activeTimers.map((t) => t.id);

// Include timer_session_ids in capture record
const captureRecord = {
  user_id: user.id,
  type: "voice",
  file_url: publicUrl,
  processing_status: "pending",
  note_type: "daily",
  log_date: captureDate,
  timer_session_ids: timerSessionIds, // Associate with active timers
};
```

### Web Calendar Functions

```typescript
// web/lib/calendarApi.ts

import { createClientComponentClient } from "@supabase/auth-helpers-nextjs";

export interface CalendarTimerSession extends TimerSession {
  voice_notes?: VoiceCapture[];
  duration_seconds?: number;
}

export interface VoiceCapture {
  id: string;
  transcription?: string;
  created_at: string;
  file_url: string;
  timer_session_ids?: string[];
}

// Get timer sessions for a date range with associated voice notes
export async function getTimerSessionsWithVoiceNotes(
  userId: string,
  startDate: string,
  endDate: string
): Promise<CalendarTimerSession[]> {
  const supabase = createClientComponentClient();

  // Get timer sessions in date range
  const { data: sessions, error: sessionsError } = await supabase
    .from("timer_sessions")
    .select("*")
    .eq("user_id", userId)
    .gte("start_time", startDate)
    .lte("start_time", endDate)
    .order("start_time", { ascending: true });

  if (sessionsError) throw sessionsError;

  // For each timer session, get associated voice notes
  const sessionsWithNotes = await Promise.all(
    (sessions || []).map(async (session) => {
      const { data: captures } = await supabase
        .from("captures")
        .select("id, transcription, created_at, file_url, timer_session_ids")
        .eq("user_id", userId)
        .contains("timer_session_ids", [session.id])
        .order("created_at", { ascending: true });

      // Calculate duration
      const start = new Date(session.start_time).getTime();
      const end = session.end_time
        ? new Date(session.end_time).getTime()
        : Date.now();
      const duration_seconds = Math.floor((end - start) / 1000);

      return {
        ...session,
        voice_notes: captures || [],
        duration_seconds,
      };
    })
  );

  return sessionsWithNotes;
}

// Get timer sessions grouped by cycle phase
export async function getTimerSessionsByCyclePhase(
  userId: string,
  startDate: string,
  endDate: string
): Promise<Record<string, CalendarTimerSession[]>> {
  const sessions = await getTimerSessionsWithVoiceNotes(
    userId,
    startDate,
    endDate
  );

  const grouped: Record<string, CalendarTimerSession[]> = {
    menstrual: [],
    follicular: [],
    ovulation: [],
    luteal: [],
  };

  sessions.forEach((session) => {
    if (session.cycle_phase) {
      grouped[session.cycle_phase].push(session);
    }
  });

  return grouped;
}

// Get timer sessions for a specific week
export async function getWeekTimerSessions(
  userId: string,
  weekStartDate: string
): Promise<CalendarTimerSession[]> {
  const weekStart = new Date(weekStartDate);
  const weekEnd = new Date(weekStart);
  weekEnd.setDate(weekEnd.getDate() + 7);

  return getTimerSessionsWithVoiceNotes(
    userId,
    weekStart.toISOString(),
    weekEnd.toISOString()
  );
}
```

---

## Mobile Implementation

### UI Architecture

**CaptureScreen Changes**:

- Replace single KI logo with **two stacked logos**
- **Top Logo**: Timer logo (first layer color from mandala settings)
  - Shows active timer count badge if timers running
  - Taps → Opens timer management modal/sheet
- **Bottom Logo**: Voice recording logo (second layer color)
  - Existing voice capture functionality
  - No changes to recording flow

### New Components

#### 1. `mobile/components/TimerLogo.tsx`

```typescript
// Simplified KI logo for timer (uses first layer color)
// Shows badge with count if active timers exist
// Props: size, color, activeTimerCount, onPress
```

#### 2. `mobile/components/TimerStartModal.tsx`

```typescript
// Modal that appears when user taps timer logo
// If no active timers:
//   - Input field for timer name
//   - Optional description field
//   - "Start Timer" button
// If active timers exist:
//   - List of active timers with elapsed time
//   - Stop/Pause buttons for each
//   - "+ Start New Timer" button at bottom
```

#### 3. `mobile/components/ActiveTimerBar.tsx`

```typescript
// Horizontal bar showing active timers with live elapsed time
// Appears at top of screen when timer(s) running
// Shows: Timer name + elapsed time (updates every second)
// Multiple timers → scrollable horizontal list
```

### State Management

```typescript
// mobile/hooks/useTimers.ts

import { useState, useEffect, useRef } from "react";
import {
  getActiveTimers,
  calculateElapsedTime,
  TimerSession,
} from "../lib/timerApi";

export function useTimers(userId: string | null) {
  const [activeTimers, setActiveTimers] = useState<TimerSession[]>([]);
  const [loading, setLoading] = useState(true);
  const intervalRef = useRef<NodeJS.Timeout | null>(null);

  // Load active timers on mount
  useEffect(() => {
    if (!userId) return;

    const loadTimers = async () => {
      try {
        const timers = await getActiveTimers(userId);
        setActiveTimers(timers);
      } catch (error) {
        console.error("Error loading timers:", error);
      } finally {
        setLoading(false);
      }
    };

    loadTimers();
  }, [userId]);

  // Update elapsed times every second for active timers
  useEffect(() => {
    if (activeTimers.length > 0) {
      intervalRef.current = setInterval(() => {
        // Force re-render to update elapsed times
        setActiveTimers((timers) => [...timers]);
      }, 1000);
    } else {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
        intervalRef.current = null;
      }
    }

    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
      }
    };
  }, [activeTimers.length]);

  return {
    activeTimers,
    loading,
    refetchTimers: async () => {
      if (userId) {
        const timers = await getActiveTimers(userId);
        setActiveTimers(timers);
      }
    },
  };
}
```

### Updated CaptureScreen Flow

1. Load active timers on screen focus
2. Show two logos:
   - Top: Timer logo (badge if timers active)
   - Bottom: Voice logo (existing functionality)
3. If timers active → show `ActiveTimerBar` at top with live elapsed times
4. When user taps timer logo → open `TimerStartModal`
5. When user captures voice note → auto-associate with active timer IDs
6. When user stops timer → update database, refresh active timers

---

## Web Implementation

### Route Structure

```
web/app/dashboard/calendar/
  - page.tsx                 # Main calendar page
  - components/
    - CycleCalendarView.tsx  # Primary: 28-day cycle wheel
    - WeekView.tsx           # Secondary: Week timeline
    - TimerSessionCard.tsx   # Display timer session details
    - VoiceNoteCard.tsx      # Display voice note within timer
```

### Primary View: Cycle Calendar

**CycleCalendarView.tsx** - 28-day circular/wheel visualization:

```typescript
// Conceptual structure
interface CycleCalendarViewProps {
  userId: string;
  currentDate: Date;
}

// Components:
// 1. Outer ring: 28 day markers (day 1-28 of cycle)
// 2. Middle rings: Timer sessions mapped to days, sized by duration
// 3. Inner rings: Voice notes within timer sessions
// 4. Center: Current cycle day + phase indicator
// 5. Color coding: Cycle phases (menstrual=red, follicular=green, ovulation=blue, luteal=yellow)

// Interaction:
// - Click on day → zoom to day view (show all timer sessions for that day)
// - Click on timer session → expand to show voice notes + details
// - Click on voice note → navigate to journal entry
```

Visual concept:

```
        Day 14 (Ovulation)
             |
    Day 21  |  Day 7
  (Luteal)  |  (Follicular)
      \     |     /
       \    |    /
        \   |   /
         \  |  /
          \ | /
           \|/
    ------ ● ------ (Current: Day 12)
           /|\
          / | \
         /  |  \
        /   |   \
       /    |    \
      /     |     \
  Day 28   |   Day 1
(Luteal)   |   (Menstrual)
```

Implementation notes:

- Use SVG for circular layout
- Calculate positions using polar coordinates
- Timer sessions = arcs/blocks along the ring
- Voice notes = dots/markers within timer arcs

### Secondary View: Week Timeline

**WeekView.tsx** - Traditional calendar week view:

```typescript
// Conceptual structure
interface WeekViewProps {
  userId: string;
  weekStart: Date;
}

// Layout:
// - 7 columns (Mon-Sun)
// - Each column shows timer sessions as vertical blocks
// - Block height = duration of timer session
// - Voice notes shown as dots/items within blocks
// - Click block → expand to show details

// Visual:
// Mon   Tue   Wed   Thu   Fri   Sat   Sun
//  |     |     |     |     |     |     |
//  |     |   [Timer]|     |     |     |
//  |     |   |Deep| |     |   [Timer] |
//  |   [Timer]Work| |     |   |Run|  |
//  |   |Meditate  | |     |   • •   |
//  |   •    |     | |     |     |     |
```

Implementation notes:

- Similar to Google Calendar week view
- Timer sessions = time blocks
- Voice notes = nested items with dot indicators
- Responsive: collapse to day view on mobile

### Data Loading Strategy

**Phase 1**: On-demand loading (user clicks refresh)

- User navigates to calendar page
- Click "Refresh" button → fetch latest timer sessions
- No real-time subscriptions yet

**Future Phase**: Real-time subscriptions

- Listen to `timer_sessions` table changes
- Auto-update UI when new timers created/stopped
- Real-time elapsed time updates for active timers

---

## Implementation Phases

### Phase 1: Database & Backend (Week 1)

**Goal**: Set up data infrastructure

- [ ] Create `timer_sessions` table migration
- [ ] Add `timer_session_ids` column to `captures` table
- [ ] Create cycle info trigger for timer sessions
- [ ] Test database schema with sample data
- [ ] Create TypeScript types for timer sessions

**Deliverables**:

- `supabase/timer-sessions.sql` migration file
- Database successfully migrated in Supabase dashboard
- Types defined in shared types file

---

### Phase 2: Mobile Timer Capture (Week 2-3)

**Goal**: Users can start/stop timers and associate voice notes

**Week 2: Timer UI & State**

- [ ] Create `TimerLogo` component
- [ ] Create `TimerStartModal` component
- [ ] Create `ActiveTimerBar` component
- [ ] Implement `useTimers` hook for state management
- [ ] Update `CaptureScreen` with two-logo layout

**Week 3: Timer Integration**

- [ ] Implement timer API functions (start, stop, pause, resume)
- [ ] Integrate timer association with voice capture
- [ ] Test multiple concurrent timers
- [ ] Test timer persistence (close/reopen app)
- [ ] Handle edge cases (app crash, network issues)

**Deliverables**:

- Users can start/stop named timers on mobile
- Voice notes auto-tagged with active timer IDs
- Active timers show live elapsed time
- Timer sessions stored in database

---

### Phase 3: Web Calendar Display (Week 4-5)

**Goal**: Users can view timer sessions and voice notes in calendar

**Week 4: Calendar API & Basic UI**

- [ ] Create calendar API functions (`calendarApi.ts`)
- [ ] Create basic calendar page route
- [ ] Implement cycle-centric view (simplified version)
- [ ] Fetch and display timer sessions for current cycle
- [ ] Show cycle phase colors

**Week 5: Enhanced Visualization**

- [ ] Add voice notes within timer session display
- [ ] Implement click interactions (expand timer → see voice notes)
- [ ] Create `TimerSessionCard` component
- [ ] Create `VoiceNoteCard` component
- [ ] Add navigation between cycle days

**Deliverables**:

- Cycle calendar view showing timer sessions
- Voice notes visible within timer contexts
- Basic click interactions working
- Cycle phase color coding functional

---

### Phase 4: Week View & Polish (Week 6)

**Goal**: Add secondary view and refine UX

- [ ] Implement week timeline view
- [ ] Add view toggle (Cycle ↔ Week)
- [ ] Refine visual design (colors, spacing, typography)
- [ ] Add loading states and error handling
- [ ] Implement refresh functionality
- [ ] Test with real user data

**Deliverables**:

- Week view fully functional
- Smooth view switching
- Polished, production-ready UI

---

### Phase 5: Future Enhancements (Backlog)

- Real-time data sync (Supabase subscriptions)
- Timer categories/tags (MIND, BODY, BOTH)
- Timer templates/presets
- Analytics & insights (total time per activity, patterns)
- Parent-child timer relationships
- Oura ring integration (sleep, HRV, activity data)
- Document/chat activity tracking
- Advanced cycle visualizations (correlation insights)

---

## Technical Considerations

### Timer Accuracy

- Store `start_time` as TIMESTAMPTZ for precision
- Calculate elapsed time on-the-fly: `now() - start_time`
- Handle timezone conversions properly
- Account for paused timers (future enhancement)

### Performance

- Index `timer_session_ids` array with GIN index for fast lookups
- Paginate calendar data (load one cycle/week at a time)
- Cache timer sessions on mobile to reduce DB calls
- Debounce real-time updates (when implemented)

### Edge Cases

- **App crash during timer**: Timer keeps running (based on start_time)
- **Multiple devices**: Last write wins (Supabase handles conflicts)
- **Network offline**: Queue timer actions, sync when online (future)
- **Timer runs for days**: UI handles large durations (show days:hours:mins)
- **Timezone changes**: Use UTC timestamps, convert to local for display

### Security

- RLS policies ensure users only see their own timers
- Validate timer ownership before stop/pause/delete operations
- Prevent timer session ID spoofing in voice capture

---

## Success Metrics

### Phase 1-2 (Mobile Capture)

- Users can create and name timers
- Timers persist across app restarts
- Voice notes correctly associated with active timers
- No crashes or data loss

### Phase 3-4 (Web Display)

- Calendar loads within 2 seconds
- Timer sessions display with correct durations
- Voice notes appear within correct timer contexts
- Cycle phase colors accurate
- Smooth interactions (no lag on click)

### Future Metrics

- User retention (daily active users using timer feature)
- Average timer sessions per user per week
- Correlation between timer usage and voice capture frequency
- User-reported insights from calendar visualization

---

## Open Questions for Future Iteration

1. **Timer categories**: Should we add MIND/BODY tagging now or later?
2. **Pause functionality**: Do we need pause/resume for MVP, or just start/stop?
3. **Timer editing**: Can users edit timer name/description after creation?
4. **Timer deletion**: Should users be able to delete past timer sessions?
5. **Notifications**: Should app notify when timer reaches certain duration?
6. **Timer sounds**: Should timer play sound on start/stop?
7. **Oura integration**: When to implement? What data to show in calendar?
8. **Sharing**: Should users be able to share calendar views with others?

---

## Next Steps

1. Review this spec and confirm approach
2. Create Phase 1 database migration
3. Begin mobile implementation (Phase 2)
4. Iterate and refine based on user testing

---

**Last Updated**: 2025-11-07
**Document Owner**: builder ki Team
**Status**: Ready for Implementation
