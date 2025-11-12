# builder-ki: Extended Mind for MIND + BODY

## Vision

**builder-ki** is a digital space for synthesizing knowledge of your mind AND body. It's an extended mind tool that helps you understand your thinking, explore your curiosities, and recognize patterns in how your biological rhythms influence your mental and physical states.

### Core Philosophy

**MIND & BODY are inseparable.**

We've been taught to separate mental and physical - but they're fundamentally intertwined. builder-ki recognizes this by connecting:

- **MIND**: Thoughts, ideas, curiosities captured through voice and media
- **BODY**: Biological rhythms (menstrual cycle), physical activities, biometric data
- **FLOW**: Daily rhythms, habits, and patterns that emerge when you pay attention

### Target User

**Primary focus**: Women 18+ navigating life's transitory periods

This isn't just a tool for a specific age group - it's for anyone who wants to understand themselves holistically. The initial focus on women is intentional:

- Women's health has been a black box for too long
- The menstrual cycle is a powerful tool for intuition, flow, and energy - but it takes deep exploration to recognize this
- This is built from lived experience: navigating coming of age, discovering purpose, understanding how body and mind influence each other

### The Differentiation

This isn't another productivity app. This isn't another period tracker. This is:

**A tool for becoming the CEO of your own health by understanding how your mind and body work together.**

<!-- with health being of mind, body, spirit -->

The cycle-centric layer transforms scattered self-tracking into a coherent system where you can see patterns, plan with your energy (not against it), and understand yourself through biological time.

---

## System Architecture

### Two Complementary Layers

**Layer 1: Extended Mind (Thought Expansion)**

- Deep exploration of ideas and curiosities
- Rich text documents for expanding on voice captures
- Thinking partner AI for developing thoughts
- **Purpose**: Go deep on what matters to you

**Layer 2: Daily Flow (Cycle-Centric Tracking)**

- Time-based daily log of captures (voice, photos, videos)
- Calendar views showing patterns across cycle phases
- Timer tracking for activities and habits
- Daily planning and reflection rituals
- **Purpose**: Track the flow of your days, see patterns emerge

These layers work together:

- Capture anything (voice, photo, video) � appears in daily flow
- Expand on captures � create documents for deep exploration
- Calendar shows when you were thinking about what
- Cycle lens reveals how biological rhythms influence your mental patterns

### Data Flow

```
CAPTURE (Mobile)
  �
  Voice (intention, planning, capture, reflection)
  Photos & Videos (daily journal context)
  �
ORGANIZE (System)
  �
  Transcribe voice
  Parse planning voice � daily tasks
  Tag with cycle day/phase
  Store with timestamps
  �
EXPRESS (Web)
  �
  Daily Log: stream view of captures
  Documents: thought expansion
  Calendar: cycle-centric visualization
  Thinking Partner: per-document AI
  Cycle Agents: sidebar guidance (nutrition, movement, mindset)
  �
DISTILL (Pattern Recognition)
  �
  What activities happen in which cycle phases?
  When do you capture the most thoughts?
  How does cycle phase correlate with energy/mood/productivity?
```

---

## Current Foundation (What We Have)

### Mobile App (Expo/React Native)

**Three Tabs:**

1. **Daily Log**: Morning intention + evening reflection voice captures
2. **Capture**: General voice recording with mandala visualization + cycle indicator
3. **Media Upload**: Photo/video upload with EXIF date detection

**Key Features:**

- Voice recording with live duration tracking
- Mandala customization (colors, layers)
- Cycle indicator showing current day/phase
- Photo/video upload from device or camera
- EXIF date extraction for historical media

### Web App (Next.js 14)

**Three Main Views:**

1. **Dashboard (`/`)**:

   - Feed or daily view of all captures
   - Filters: note type, cycle phase, cycle day, favorites, date range
   - Search across transcriptions
   - Voice playback with transcriptions
   - Photo/video display

2. **Documents (`/documents`)**:

   - Rich text editor (Tiptap) for thought expansion
   - Created from voice captures or from scratch
   - Thinking partner AI chat per document
   - Persistent conversation history

3. **Media Library (`/media`)**:
   - Grid view of all photos/videos
   - Smart sorting (EXIF date for backfilled, upload date for live captures)
   - Caption and tagging
   - Date filtering

### Database (Supabase)

**Existing Tables:**

- `captures`: voice/photo/video with transcription, cycle_day, cycle_phase, note_type, log_date
- `documents`: rich text docs with JSONB content
- `conversations` + `messages`: thinking partner chat history
- `daily_logs`: one record per user per day
- `media_items`: photos/videos with metadata, EXIF dates, tags
- `cycle_periods`: tracks menstrual periods (start_date, end_date)
- `insights`: extracted insights from captures (not actively used yet)
- `projects`: schema exists but not implemented in UI

**Cycle Tracking:**

- `calculate_cycle_info()` function calculates cycle day & phase
- Auto-populate trigger on captures
- Phases: menstrual (1-5), follicular (6-13), ovulation (14-15), luteal (16-28)

### What's NOT Implemented Yet

- L Timer tracking
- L Daily planning/task parsing
- L Calendar views
- L Cycle agents
- L Oura integration

---

## Evolution: Cycle-Centric Layer (What We're Building)

### Mobile Redesign: Three New Tabs

**1. Plan Tab**

**Morning (before 12pm):**

- **Set Intention** button (existing functionality)

  - Voice capture with note_type='intention'
  - Prompts: "What do I want to focus on today?"

- **Plan Your Day** button (NEW)
  - Voice capture specifically for daily planning
  - System parses voice to extract tasks, times, durations
  - Creates structured to-do list & scheduled time blocks
  - Example: "9am workout for 45min, 10:30 to 1pm project work, call mom in afternoon"
  - Parsing logic uses LLM with structured output

**Evening (after 6pm):**

- **Daily Reflection** button (existing functionality, replaces intention)
  - Voice capture with note_type='reflection'
  - Prompts: "How was today? What did I learn?"

**2. Capture Tab**

- **Voice Capture** (existing)

  - General voice recording with mandala
  - note_type='daily' (general journaling)
  - Auto-tagged with cycle day/phase

- **Camera Capture** (NEW - moved from MediaUpload tab)
  - Take photo or video immediately
  - No upload from library (that's in Track for backfilling)
  - Adds context to daily journal

**Purpose**: Daily journaling - capture ideas, moments, feelings, anything

**3. Track Tab**

**To-Do List** (displays tasks from planning):

- Checkbox list of tasks from morning planning
- Scheduled tasks show time/duration
- Unscheduled tasks shown as simple checklist
- **Tap task � starts timer automatically**

**Active Timer Bar** (when timer running):

- Shows timer name + live elapsed time
- Stop/Pause buttons
- Multiple concurrent timers supported

**Task Completion Flow**:

1. User taps task from list � timer starts
2. Timer runs (user does activity)
3. User stops timer � creates timer_session record
4. Task marked complete
5. Calendar updated with actual activity block

**Media Upload Section**:

- Upload photos/videos from device library (backfilling historical data)
- EXIF date extraction

**Reflection Trigger** (appears after 6pm):

- "Ready to reflect on the day?" prompt
- Button navigates back to Plan tab � shows Daily Reflection button

### Web Evolution: Three Journals

**Concept**: builder-ki web is a collection of three digital journals, each serving a distinct purpose in understanding yourself holistically.

---

#### **Journal 1: DAILY** (route: `/dashboard`)

**Purpose**: Stream of consciousness journal - brings awareness to thoughts, feelings, and experiences throughout each day.

**Current functionality (enhancing, not replacing)**:

- Feed or daily view of all captures
- Voice transcriptions with playback
- Photos/videos displayed inline
- Timeline showing flow of captures through the day
- Filters: note type, cycle phase, cycle day, favorites, date range
- Search across transcriptions

**Enhancements**:

- Improved timeline visualization (more visual, less list-like)
- Photos/videos displayed larger, more prominently in flow
- Activity blocks from timers shown in timeline
- Cycle phase indicator for each day
- Smoother scrolling experience across multiple days
- Quick actions: favorite, expand, open in CREATE journal

**Visual Design**:

- Clean, minimal, focused on content
- Cycle phase colors subtly in background or day headers
- Chronological flow (most recent first, or by selected date)
- Emphasis on the stream: "What was I thinking/doing/experiencing today?"

**Purpose Statement**: "This is your daily awareness journal. See the flow of your days, the thoughts you're thinking, the moments you're capturing. Bring consciousness to your lived experience."

---

#### **Journal 2: CYCLE** (route: `/cycle`)

**Purpose**: Pattern recognition journal - explore your data across time, visualize biological rhythms, set cycle intentions, discover insights.

**Primary View: Calendar + Visualizations**

**View Modes:**

1. **Cycle View** (circular/28-day wheel) - PRIMARY

   - Shows full cycle with data mapped to cycle days
   - Color-coded by phase (menstrual, follicular, ovulation, luteal)
   - Activity blocks sized by duration
   - Voice note markers within or outside activity blocks
   - Click day � zoom to daily view

2. **Monthly View** (traditional calendar grid)

   - Each day shows cycle day number + phase color
   - Activity blocks (condensed)
   - Voice note count
   - Click day � daily view

3. **Weekly View** (timeline with time blocks)

   - 7 columns (Mon-Sun)
   - Time blocks for activities (actual from timers)
   - Voice notes nested within blocks
   - Scheduled vs actual comparison
   - Daily summary previews

4. **Daily View** (detailed single day)
   - Timeline (24 hours vertical)
   - Activity blocks at actual times
   - Voice captures with timestamps
   - Photos/videos inline in timeline
   - Daily summary (AI-generated, optional)

**Visual Elements:**

- **Cycle Phase Colors**: menstrual (blue), follicular (green), ovulation (yellow), luteal (orange)
- **Activity Blocks**: time-blocked activities from completed timers
- **Voice Note Markers**: dots/icons indicating captures
- **To-Do Indicators**: banner showing unscheduled tasks
- **Photos/Videos**: inline in timeline for daily view

**Cycle Agents (Sidebar in Calendar)**

**Group conversation model** - all agents collaborate:

- **Nutrition Agent**: cycle-aligned eating, cravings, energy optimization
- **Movement Agent**: exercise, activity, embodiment practices
- **Mindset Agent**: emotions, mental health, reflections, self-compassion
- **Orchestrator**: synthesizes guidance from all agents

**Agent Context Awareness:**

- Current cycle day/phase
- Recent voice captures (emotional patterns)
- Oura data (HRV, sleep, temperature)
- Activity patterns from timers

**Example Conversation:**

User: "I'm feeling really low energy and my period is about to start."

**Mindset**: "Late luteal phase can feel tender. It's normal to feel low energy right now. This is a time for turning inward."

**Movement**: "Your body is asking for softness. A 20-minute walk or restorative yoga. Your HRV is lower than usual, so restorative activities will serve you better."

**Nutrition**: "Your body needs extra nourishment. Focus on iron-rich foods and magnesium. Those chocolate cravings? Real - your body needs magnesium."

**Orchestrator**: "Go for a gentle walk, nourish with iron and magnesium-rich foods, give yourself permission to rest. Your period will start soon. This is part of your cycle's rhythm."

**Additional Visualizations** (exploration views):

- **Cycle Overlay**: overlay multiple cycles to see recurring patterns
- **Energy Map**: heatmap showing energy levels across cycle days
- **Activity Frequency**: which activities happen in which phases
- **Voice Capture Density**: when do you capture most thoughts?
- **Oura Correlations**: compare HRV/sleep/temp to cycle phases

**Cycle Intentions & Goals** (future enhancement):

- Set intention at cycle start
- Track progress throughout cycle
- Review at cycle end (cycle audit)
- Compare cycles over time

**Purpose Statement**: "This is your cycle journal. Explore patterns, plan with your energy, understand how your biological rhythms influence everything. Your cycle is a tool, not a mystery."

---

#### **Journal 3: CREATE** (route: `/create`, currently `/documents`)

**Purpose**: Thought expansion journal - synthesize ideas, explore curiosities, develop thinking with AI support.

**Current functionality (keeping, rebranding)**:

- Rich text editor (Tiptap) for long-form writing
- Create documents from voice captures or from scratch
- Thinking partner AI chat per document
- Persistent conversation history per document
- Document list sorted by most recently updated

**No changes needed** - this works beautifully as-is. Just:

- Rename route from `/documents` to `/create`
- Update navigation label from "Documents" to "CREATE"
- Refine positioning: "This is where you go deep on ideas"

**Visual Design**:

- Clean, distraction-free writing environment
- Editor front and center
- Thinking partner accessible but not intrusive
- Focus on depth, not timeline

**Purpose Statement**: "This is your create space. Expand on ideas, synthesize thinking, go deep on curiosities. Transform fleeting thoughts into developed understanding."

---

**Navigation Structure** (Web):

```
┌─────────────────────────────────────┐
│  builder-ki                         │
│  ─────────────────────────────────  │
│  [ DAILY ]  [ CYCLE ]  [ CREATE ]   │
└─────────────────────────────────────┘
```

**Three journals, three purposes:**

1. **DAILY**: awareness of the present (what am I thinking/feeling/doing today?)
2. **CYCLE**: patterns across time (how do my rhythms influence me?)
3. **CREATE**: depth on ideas (what do I want to understand deeply?)

### Oura Integration (Starting from Scratch)

**Oura MCP Server** (needs to be built):

Required functions:

1. `getDailyReadiness()`: readiness score, HRV, temperature
2. `getSleepData()`: sleep stages, duration, quality
3. `getActivityData()`: steps, calories, activity score
4. `getCycleData()`: period logs, predicted phases, cycle day
5. `logPeriod()`: log period start in Oura from builder-ki
6. `getDailySummary()`: comprehensive daily snapshot

**Data Flow:**

- Automatic background sync once per day
- Manual sync via refresh button
- Data stored in `oura_daily_data` table (needs to be created)
- Linked to dates for calendar display

**Bi-Directional Sync** (future):

- User logs period in builder-ki � also logs in Oura app

---

## Database Changes Needed

### New Tables

**1. timer_sessions**

```sql
CREATE TABLE timer_sessions (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,

  name TEXT NOT NULL,
  description TEXT,

  start_time TIMESTAMPTZ NOT NULL,
  end_time TIMESTAMPTZ, -- NULL if still running

  status TEXT NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'paused', 'completed')),

  cycle_day INTEGER,
  cycle_phase TEXT CHECK (cycle_phase IN ('menstrual', 'follicular', 'ovulation', 'luteal', NULL)),

  created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
  updated_at TIMESTAMPTZ DEFAULT NOW() NOT NULL
);
```

**2. daily_tasks**

```sql
CREATE TABLE daily_tasks (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,

  task_description TEXT NOT NULL,
  scheduled_time TIME, -- NULL if unscheduled
  estimated_duration INTEGER, -- minutes

  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'in_progress', 'completed')),

  timer_session_id UUID REFERENCES timer_sessions(id) ON DELETE SET NULL,

  task_date DATE NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
  updated_at TIMESTAMPTZ DEFAULT NOW() NOT NULL
);
```

**3. oura_daily_data**

```sql
CREATE TABLE oura_daily_data (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,

  data_date DATE NOT NULL,

  readiness_score INTEGER,
  hrv INTEGER,
  resting_heart_rate INTEGER,
  body_temperature DECIMAL,

  sleep_score INTEGER,
  total_sleep_seconds INTEGER,
  rem_sleep_seconds INTEGER,
  deep_sleep_seconds INTEGER,
  light_sleep_seconds INTEGER,

  activity_score INTEGER,
  steps INTEGER,
  calories INTEGER,

  cycle_day INTEGER,
  predicted_cycle_phase TEXT,

  raw_data JSONB,

  synced_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
  UNIQUE(user_id, data_date)
);
```

**4. agent_conversations** (for cycle agents, separate from thinking partner)

```sql
CREATE TABLE agent_conversations (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,

  agent_type TEXT NOT NULL CHECK (agent_type IN ('cycle_group')),

  messages JSONB NOT NULL,

  created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
  updated_at TIMESTAMPTZ DEFAULT NOW() NOT NULL
);
```

### Modifications to Existing Tables

**captures table:**

- Add `timer_session_ids UUID[]` (many-to-many: one capture can be during multiple concurrent timers)
- Index: `CREATE INDEX idx_captures_timer_sessions ON captures USING GIN(timer_session_ids);`

---

## Key User Flows

### Flow 1: Morning Planning Ritual

1. User wakes up (7:30am)
2. Opens builder-ki app � **Plan tab**
3. Sees cycle indicator ("Day 8, Follicular Phase <1")
4. Taps **Set Intention** � voice records intention for the day
5. Taps **Plan Your Day** � voice records: "Today I want to meditate, workout at 9am for 45 minutes, work on project from 10:30 to 1pm, have lunch, take a walk, and call my mom"
6. System transcribes and parses:
   - "meditate" � unscheduled task
   - "workout at 9am for 45 minutes" � scheduled task (9:00-9:45)
   - "work on project from 10:30 to 1pm" � scheduled task (10:30-13:00)
   - "have lunch" � unscheduled task
   - "take a walk" � unscheduled task
   - "call my mom" � unscheduled task
7. User switches to **Track tab** � sees to-do list populated
8. Scheduled tasks show times, unscheduled show as checklist

### Flow 2: Completing Activities with Timers

1. User at 9:15am decides to workout
2. Opens **Track tab**, taps "workout" task
3. Timer starts automatically (task status � 'in_progress')
4. Active Timer Bar appears showing "Workout - 05:23" (live elapsed time)
5. At 9:30am, user feels inspired � switches to **Capture tab**
6. Voice records: "I'm feeling so strong today. Follicular energy is real!"
7. Voice capture auto-tagged with timer_session_id for "Workout"
8. User finishes workout at 9:58am
9. Opens Track tab, taps Stop Timer
10. System creates timer_session (9:15am-9:58am, 43 minutes)
11. Task marked completed
12. Web calendar updates: scheduled block (9:00-9:45) replaced with actual activity block (9:15-9:58)
13. Voice note dot appears within activity block

### Flow 3: Daily Journaling Throughout Day

1. User at lunch takes photo of meal � **Capture tab** � camera
2. Photo saved with timestamp, cycle day/phase auto-tagged
3. User at 3pm has realization � **Capture tab** � voice capture: "Just realized why I've been avoiding that project..."
4. Voice transcribed, stored with cycle context
5. User at 5pm scrolls social media, sees inspiring quote � screenshots � uploads via **Track tab** media upload
6. All captures appear in web dashboard daily log view, inline timeline

### Flow 4: Evening Reflection

1. End of day (9pm)
2. User opens **Track tab**
3. Sees "Ready to reflect on the day?" prompt
4. Taps button � navigates to **Plan tab**
5. Plan tab now shows **Daily Reflection** button (replaced Set Intention since it's evening)
6. User taps � voice records reflection on the day
7. Reflection saved with note_type='reflection', cycle context
8. Web dashboard shows full day: intention (morning) � captures � activities � reflection (evening)

### Flow 5: Web Calendar Pattern Recognition

1. User opens web � Calendar view
2. Cycle View shows: "You're on Day 12, Follicular Phase"
3. User zooms out to see full cycle
4. Notices pattern: "Most workouts happen in follicular phase (days 6-13)"
5. Clicks cycle phase filter � sees all follicular captures
6. Opens cycle agents sidebar
7. Asks: "Why do I have so much energy during follicular phase?"
8. Agents collaborate to explain hormonal patterns
9. User plans next cycle based on this insight

### Flow 6: Cycle Agent Guidance

1. User on Day 24 (luteal phase), feeling low energy
2. Opens web calendar, cycle agents sidebar
3. Says: "I'm feeling really low and emotional. My period is coming soon."
4. Group conversation:
   - Mindset: "Late luteal phase feels tender. It's normal..."
   - Movement: "Your body needs softness. Gentle walk or restorative yoga..."
   - Nutrition: "Focus on iron and magnesium. Chocolate cravings are real..."
   - Orchestrator: "Go for gentle walk, nourish your body, rest. This is part of your rhythm."
5. User feels seen, follows guidance
6. Captures voice reflection thanking her cycle for teaching her to honor rest

---

## Technical Implementation Notes

### Voice Processing Pipeline

Currently single pathway. Needs to handle multiple types:

**1. Intention Voice** (Plan tab, morning)

- Transcribe with Whisper API
- Store in captures with note_type='intention'
- No task parsing

**2. Planning Voice** (Plan tab, morning)

- Transcribe with Whisper API
- Parse with LLM (structured output):
  ```typescript
  {
    tasks: [{ description: string, time: string, duration: number }];
  }
  ```
- Create daily_tasks records
- Store original transcription in captures with note_type='daily'

**3. Capture Voice** (Capture tab, anytime)

- Transcribe with Whisper API
- Store in captures with note_type='daily'
- Check for active timers � add timer_session_ids

**4. Reflection Voice** (Plan tab, evening)

- Transcribe with Whisper API
- Store in captures with note_type='reflection'
- No task parsing

### Timer Implementation

**Mobile (React Native):**

- useTimers hook with local state
- Interval updates every second for live display
- Store start_time, calculate elapsed client-side
- Persist to database on start/stop

**Web (Next.js):**

- Fetch timer_sessions for date range
- Calculate duration: end_time - start_time
- Display as blocks on calendar
- Real-time sync (future): WebSocket or polling

### Calendar Rendering

**Cycle View (SVG):**

- Polar coordinates for circular layout
- 28 segments (one per cycle day)
- Activity blocks as arcs, sized by duration
- Voice notes as dots
- Interactive (click � zoom to day)

**Monthly/Weekly Views:**

- Grid layout (CSS Grid)
- Activity blocks as positioned divs
- Time-based vertical positioning for weekly

### Oura Integration

**MCP Server Setup:**

- OAuth flow for user authentication
- Personal access token storage (encrypted)
- Daily cron job for automatic sync
- Manual sync API endpoint

**Data Sync:**

- Fetch previous day's data each morning
- Store in oura_daily_data table
- Link to cycle info (match dates)
- Make available to agents via context

---

## MVP Scope

### Phase 1: Mobile Redesign (hours 1-2)

**Goal**: New mobile UI with planning, capture, tracking

- [ ] Redesign tabs: Plan / Capture / Track
- [ ] Plan tab: intention + planning buttons (time-based switching)
- [ ] Planning voice parsing (LLM integration)
- [ ] Track tab: to-do list display
- [ ] Track tab: timer start/stop from tasks
- [ ] Track tab: active timer bar
- [ ] Track tab: reflection trigger (evening)
- [ ] Capture tab: voice + camera (move from MediaUpload)
- [ ] Database: timer_sessions table
- [ ] Database: daily_tasks table

### Phase 2: Timer Integration (hour 3)

**Goal**: Full timer system working end-to-end

- [ ] Timer API functions (start, stop, pause, resume)
- [ ] Link captures to timer sessions
- [ ] Cycle info auto-populated on timer sessions
- [ ] Multiple concurrent timers support
- [ ] Timer persistence (close/reopen app)

### Phase 3: Web Calendar Views (hours 4-5)

**Goal**: Visualize data in calendar

- [ ] Calendar page structure
- [ ] Daily view (timeline with activity blocks)
- [ ] Weekly view (7-day grid)
- [ ] Monthly view (traditional calendar)
- [ ] Cycle view (circular, basic version)
- [ ] Fetch timer sessions + captures for date ranges
- [ ] Display photos/videos inline in daily view
- [ ] Click interactions (day � daily view, activity � details)

### Phase 4: Cycle Agents (hour 6)

**Goal**: AI guidance in calendar sidebar

- [ ] Agent sidebar UI in calendar
- [ ] Group conversation interface
- [ ] Orchestrator + 3 specialist agents (nutrition, movement, mindset)
- [ ] Agent context: cycle day/phase, recent captures
- [ ] Streaming responses
- [ ] Conversation persistence

### Phase 5: Oura Integration (hour 7)

**Goal**: Biometric data in system

- [ ] Oura MCP server functions
- [ ] OAuth setup
- [ ] Daily sync workflow
- [ ] oura_daily_data table
- [ ] Display Oura data in calendar views
- [ ] Make Oura data available to agents

### Phase 6: Polish & Testing (hour 8)

- [ ] Enhanced daily log view (web)
- [ ] Scheduled vs actual activity comparison
- [ ] Pattern insights (basic)
- [ ] Bug fixes
- [ ] Performance optimization
- [ ] End-to-end testing

### Out of Scope for MVP

- Daily summaries (AI-generated end-of-day synthesis)
- Cycle audits (interactive review at cycle end)
- Cycle intentions (goal-setting per cycle)
- Projects UI
- Neo4j knowledge graph
- n8n workflows
- Export functionality
- Multi-device sync optimization
- Cycle prediction ML

---

## Success Criteria

**MVP is complete when:**

1.  Can set morning intention via voice (Plan tab)
2.  Can plan day via voice � tasks appear in Track tab
3.  Can start timers from tasks
4.  Can capture voice/photos/videos throughout day (Capture tab)
5.  Can reflect in evening (Plan tab)
6.  Web calendar shows daily/weekly/monthly/cycle views
7.  Activity blocks display correctly with actual times
8.  Voice notes visible in calendar views
9.  Photos/videos display inline in daily timeline
10.  Cycle agents provide contextual guidance
11.  Oura data syncs and displays in calendar
12.  Cycle phase colors throughout UI
13.  No critical bugs in happy path
14.  Can use daily for 7 days straight without issues

---

## Design Principles

### 1. Cycle-Centricity

- Everything viewed through biological rhythm lens
- Cycle context always visible
- Patterns emerge naturally from visualizations

### 2. Low Friction Capture

- Voice-first interface
- Minimal taps
- No complex forms

### 3. Holistic Integration (MIND + BODY)

- Never separate mental from physical
- Voice captures + biometrics + activities = complete picture
- Oura data contextualized with lived experience

### 4. Two-Layer Architecture

- Documents for deep thinking
- Calendar for daily flow
- Complementary, not competing

### 5. Privacy & Agency

- User owns data (Supabase, can be self-hosted)
- User controls API keys (future: LLM processing with own keys)
- Transparent about data usage

### 6. Beautiful Visualizations

- Calendar as art
- Color-coded phases intuitive and aesthetic
- Data exploration delightful, not clinical

### 7. Compassionate Intelligence

- Agents supportive, never judgmental
- Insights framed with empathy
- Celebrates wins, holds space for struggles

---

## Target User Success Story

**Sarah, 24, navigating career transitions:**

**Morning (Day 7, Follicular):**

- Opens Plan tab, sets intention: "Today I want to make progress on my portfolio"
- Plans day: "9am workout, 10am coffee and portfolio work for 3 hours, lunch, afternoon walk, evening call with friend"
- Sees to-do list populate in Track tab

**Throughout Day:**

- 9:15am: Starts workout timer from Track tab
- 9:35am: Mid-workout, captures voice: "Feeling so energized, ideas flowing for portfolio design"
- 10:30am: Starts "portfolio work" timer
- 11am: Takes screenshot of inspiring design
- 12pm: Captures voice reflection on design direction
- 1:15pm: Stops work timer (worked 2h 45min)
- Evening: Reflects on productive day in Plan tab

**End of Week:**

- Opens web calendar, sees all 7 days visualized
- Notices: "I worked on portfolio every day this week, mostly during follicular phase"
- Cycle view shows concentration of productive work in days 6-13
- Opens cycle agents sidebar: "Why was I so productive this week?"
- Agents explain: "Follicular phase = high energy, creativity, focus. Perfect time for deep work."
- Sarah plans next cycle: "I'll block deep work sessions during follicular, admin during luteal"

**After 3 Cycles:**

- Sarah knows her patterns intimately
- Plans work around energy, not against it
- Feels in control of her health and productivity
- Uses documents to expand on ideas that emerged during high-energy phases
- Cycle is no longer a mystery - it's a tool

---

**Last Updated**: 2025-11-11
**Status**: Ready for Implementation
**Next Step**: Create detailed implementation roadmap with checkpoints
