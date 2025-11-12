# cycle-ki: Overview & Build Specification

## Vision

**cycle-ki** is a holistic tool designed for women (ages 18-25) to understand and work _with_ their bodies and cycles, rather than against them. By connecting the physical (BODY) and mental (MIND) dimensions of lived experience, cycle-ki empowers women to become the CEOs of their own health.

Women's bodies have been a black box for too long. cycle-ki transforms the menstrual cycle from a mystery into a powerful tool for intuition, flow, guidance, and energy optimization.

### Core Philosophy

**MIND & BODY are inseparable.** The cycle connects:

- **BODY**: Biological rhythms (menstrual cycle), physical activities, sleep, biometrics
- **MIND**: Thoughts, emotions, reflections (captured through voice)
- **FLOW**: Activities and habits tracked over time, contextualized within cycle phases

**The Cycle-as-Sprint Framework**: Each menstrual cycle becomes a personal sprint cycle for incremental growth. Users set intentions at the start of each cycle, plan daily activities aligned with their energy, track their flows, and reflect at cycle's end.

---

## Target User Persona

**Primary User**: Women ages 18-25

This life phase is intentionally chosen because:

1. It's an extremely **transitory period** - navigating coming of age, discovering sexuality/femininity/purpose, career beginnings, identity formation
2. **Lived experience alignment** - building from deep understanding of this persona

These users are:

- Seeking Self-understanding and agency over their health
- Navigating ambiguity and emotional roller coasters
- Open to experimenting with new tools and frameworks
- Interested in holistic wellness (mind + body)
- Comfortable with technology and voice interfaces

---

## System Overview

### Data Flow Architecture

cycle-ki follows the core **Capture → Organize → Distill → Express → Capture** loop, adapted for cycle-centric living:

```
CAPTURE (Mobile)
  ↓
  Daily voice captures (emotions, feelings, experiences)
  Voice-based daily planning (to-dos, time blocks)
  Timer-tracked activities (high-impact habits & flows)
  Oura Ring biometric data (sleep, HRV, temperature, cycle tracking)
  ↓
ORGANIZE (System)
  ↓
  Transcribe voice captures
  Parse daily plans → create to-do list & scheduled blocks
  Associate captures with active timers
  Tag everything with cycle phase/day
  Link Oura data to daily context
  ↓
DISTILL (AI Agents)
  ↓
  Synthesize daily voice captures → daily summary
  Identify patterns across cycle phases
  Generate insights (energy, mood, productivity correlations)
  Create cycle audit at period start (recap previous cycle)
  ↓
EXPRESS (Web Dashboard)
  ↓
  Cycle, monthly, weekly, daily calendar views
  Visual markers: time blocks, voice notes, activities, cycle phases
  Interactive cycle audit experience
  Pattern exploration & visualization tools
  Agent conversations for guidance
  ↓
CAPTURE (Loop continues)
  ↓
  Reflection prompts based on insights
  Intention-setting for next cycle sprint
  Adjusted daily planning based on cycle phase
```

### Privacy-First Architecture

**Core Principle**: User data stays in user's control. No third-party data sharing, no model training on user data.

**Implementation Approach** (Hybrid with User-Controlled API Keys):

1. **Data Storage**:

   - User's data in Supabase (encrypted at rest)
   - Option for self-hosted Supabase for maximum control
   - All sensitive data encrypted client-side before storage

2. **Voice Transcription**:

   - User provides own OpenAI API key for Whisper API
   - OR: Local Whisper model (on-device transcription)
   - User chooses which approach based on privacy preference

3. **LLM Processing** (Summaries, Insights, Agent Conversations):

   - User provides own API keys (OpenAI, Anthropic, etc.)
   - Their data + their keys = their control
   - Clear consent flow explaining data usage

4. **Local Processing**:

   - Cycle calculations (phase, day, predictions) run client-side
   - Pattern detection algorithms run locally when possible
   - No server-side analysis of sensitive health data

5. **Oura Integration**:

   - User connects Oura via OAuth (user's own Oura account)
   - Oura MCP server fetches data directly from Oura API
   - Data flows directly to user's Supabase, never stored elsewhere

6. **No Data Leakage**:
   - No third-party analytics (no Google Analytics, Mixpanel, etc.)
   - No error tracking services that send user data
   - Open source codebase for transparency

**Future Enhancement**: Fully local-first mode with on-device LLMs (Llama, Phi) for users who want zero cloud dependency.

---

## Mobile Experience: Capture & Track

### Core Screens

#### 1. Capture Screen (Primary)

**Layout**:

- **Top Logo**: Timer logo (first layer color from mandala settings)
  - Badge shows count of active timers
  - Tap → Opens Timer Management Modal
- **Bottom Logo**: Voice recording logo (second layer color)
  - Tap & hold → Voice capture (existing flow)
  - Works for both emotional captures AND daily planning

**Active Timer Bar** (appears when timers running):

- Horizontal scrollable bar at top of screen
- Shows each active timer with name + live elapsed time
- Tap timer → quick actions (pause, stop)

**Daily To-Do List** (appears at bottom):

- Shows tasks from morning voice planning
- Unchecked tasks (not yet started)
- Tasks with scheduled times show time/duration
- Tap task → starts timer automatically
- Check off task → completes timer, marks done

#### 2. Timer Management Modal

**If No Active Timers**:

- Input field: "What are you working on?" (timer name)
- Optional description field
- "Start Timer" button

**If Active Timers Exist**:

- List of active timers with:
  - Timer name
  - Live elapsed time (updates every second)
  - Stop/Pause buttons
- "+ Start New Timer" button at bottom (allows concurrent timers)

### Key Mobile Features

#### Daily Voice Planning (Morning Routine)

**Flow**:

1. User wakes up, opens app
2. Taps voice logo, says: "Today I want to [list of activities/intentions]"
3. System transcribes and parses:
   - **No time mentioned**: "meditate, work out, call mom" → Added to To-Do List (unscheduled)
   - **Time mentioned**: "9am work out for 30min, 2pm team meeting for 1 hour" → Added to To-Do List + Scheduled Blocks on calendar
4. User sees their to-do list populate on Capture Screen
5. Throughout day, user taps tasks → starts timers → completes activities

**Parsing Logic**:

- Use LLM (with user's API key) to extract tasks, times, durations
- Create structured data: `{task: string, time?: string, duration?: number}`
- Store in database as daily plan entry

#### Emotional Voice Captures (Anytime)

**Flow**:

1. User feels something they want to capture
2. Tap & hold voice logo → records voice note
3. Voice note auto-tagged with:
   - Active timer IDs (if any timers running)
   - Timestamp
   - Cycle day & phase (auto-populated)
4. Transcription happens in background
5. Voice note saved to database

**Context Association**:

- If timer(s) active: voice note linked to those flows
- If no timers: standalone emotional capture
- User can later see which emotions/thoughts occurred during which activities

#### Timer-Tracked Activities

**Flow**:

1. User starts activity (from to-do list tap OR manual timer start)
2. Timer runs, showing elapsed time
3. During activity, user can capture voice notes → auto-linked to timer
4. User completes activity → stops timer
5. Timer session saved with:
   - Start time, end time, duration
   - Associated voice captures
   - Cycle day/phase
   - Oura data for that time period (if available)

**Scheduled vs Actual**:

- If activity was scheduled (e.g., "9am work out"), scheduled block shows on calendar
- When user actually does it (e.g., 10am-10:45am), timer creates actual activity block
- Scheduled block replaced with actual activity block on calendar
- User can see planned vs actual patterns

#### Multiple Concurrent Timers

**Use Case**: User might have "Fasting" timer running all day + "Deep Work" timer for 2 hours

- Both timers run simultaneously
- Voice captures tagged with all active timer IDs
- User can stop/pause each independently

### Mobile Data Capture Summary

**What Gets Captured**:

- Voice transcriptions (emotional, planning)
- Timer sessions (start, end, name, description)
- Daily to-do lists (tasks, times, durations)
- Task completions (checked off items)
- Oura Ring data (synced in background):
  - Sleep stages, duration, quality
  - HRV (heart rate variability)
  - Resting heart rate
  - Body temperature
  - Activity levels
  - Cycle tracking (period logs, predicted phases)

**When It's Captured**:

- Voice: User-initiated (manual captures)
- Timers: User-initiated (start/stop activities)
- Daily plans: User-initiated (morning voice planning)
- Oura: Automatic background sync (daily)

---

## Web Experience: Visualize & Reflect

### Core Pages

#### 1. Dashboard / Calendar View (Primary)

**View Options** (Toggle between):

- **Cycle View**: 28-day circular/spiral visualization
- **Monthly View**: Traditional month calendar
- **Weekly View**: Week timeline with time blocks
- **Daily View**: Single day detailed breakdown

**Visual Elements** (Common across views):

- **Cycle Phase Colors**:
  - Menstrual: blue
  - Follicular: green
  - Ovulation: yellow
  - Luteal: orange
- **Activity Blocks**: Time-blocked activities (actual, from completed timers)
- **Voice Note Markers**: Dots/icons indicating voice captures
  - Inside activity blocks: captured during that flow
  - Outside blocks: standalone emotional captures
- **To-Do Indicators**: Banner at top of day showing unscheduled tasks
- **Oura Data**: Background indicators (sleep quality, HRV, etc.)

#### 2. Cycle View (Primary Visualization)

**Concept**: Circular/spiral layout showing full cycle (28 days) with all data mapped to cycle days

**Layout**:

```
        Day 14 (Ovulation - Blue)
             |
    Day 21  |  Day 7
  (Luteal)  |  (Follicular)
      \     |     /
       \    |    /
        \   |   /
         \  |  /
          \ | /
           \|/
    ------ ● ------ Center: Current Cycle Day
           /|\
          / | \
         /  |  \
        /   |   \
       /    |    \
      /     |     \
  Day 28   |   Day 1
(Luteal)   |   (Menstrual - Red)
```

**Interactive Elements**:

- Click on day → zoom to day view (all activities/captures for that day)
- Click on activity block → expand details (duration, voice notes within, cycle context)
- Click on voice note → open full transcription + journal entry
- Hover → show quick preview

**Data Displayed**:

- Activity blocks sized by duration (longer activities = larger arcs)
- Voice notes as dots/markers within or around activity arcs
- Oura insights as background gradients (e.g., low energy = dimmer, high energy = brighter)
- Pattern indicators (e.g., "You always meditate in follicular phase")

#### 3. Weekly/Monthly Views

**Weekly View**:

- 7 columns (Mon-Sun)
- Time blocks showing activities (actual completed timers)
- Scheduled vs actual comparison (if user scheduled via voice planning)
- Voice notes nested within or alongside time blocks
- Daily summary preview at bottom of each day
- Cycle phase color-coded day headers

**Monthly View**:

- Traditional calendar grid (similar to Google Calendar)
- Each day shows:
  - Cycle day number + phase color
  - Activity blocks (condensed view)
  - Voice note count indicator
  - Oura data summary (sleep, HRV icons)
- Click day → expands to daily view

#### 4. Daily View

**Layout**:

- Timeline (vertical, 24 hours)
- Activity blocks showing actual times
- Voice captures with timestamps
- Oura data panel (sleep from previous night, HRV, temperature)
- Daily summary (AI-generated synthesis)

**Daily Summary**:

- Synthesizes all voice captures from the day
- Extracts key themes, emotions, events
- Links to cycle phase context ("You're in follicular phase - high energy aligned with your productive day")
- User can edit/add to summary

**User Interactions**:

- Click voice note → read full transcription
- Click activity → see duration, voice notes during activity
- Click Oura data → detailed biometric breakdown
- Export day as journal entry

#### 5. Cycle Audit (Interactive Review)

**Triggered**: When user logs period start (new cycle begins)

**Purpose**: Reflect on previous cycle, set intention for new cycle

**Flow**:

1. **Welcome Screen**: "Your cycle has completed. Let's reflect."
2. **Previous Intention Review**: "Last cycle, you focused on [previous goal]. Let's see how it went."
3. **Cycle Walk-Through** (Interactive timeline):
   - Menstrual Phase (Days 1-5): Activities, energy, voice captures
   - Follicular Phase (Days 6-13): Activities, mood, patterns
   - Ovulation Phase (Days 14-16): Peak energy moments
   - Luteal Phase (Days 17-28): Reflections, energy shifts
4. **Pattern Insights**:
   - "You meditated 8 times this cycle, mostly in follicular phase"
   - "Your HRV was highest during ovulation"
   - "You captured the most voice notes during luteal phase"
5. **Cycle Comparison**: Compare this cycle to previous cycles (graphs, trends)
6. **Reflection Prompt**: "What did you learn this cycle?"
   - User can voice record or type reflection
7. **New Intention Setting**: "What do you want to focus on next cycle?"
   - User sets goal/intention for new cycle sprint
8. **Summary Generated**: Cycle audit saved as report (can revisit anytime)

**Visual Design**:

- Immersive, flow-like experience (not just a static report)
- Beautiful cycle wheel showing previous cycle data
- Smooth transitions between phases
- Can skip sections or dive deeper

### Key Web Features

#### Custom Visualization Tools

**Goal**: Allow users to explore their data in different ways to find patterns

**Visualization Types**:

1. **Cycle Overlay**: Overlay multiple cycles to see recurring patterns
2. **Energy Map**: Heatmap showing energy levels across cycle days
3. **Activity Frequency**: Which activities happen in which phases
4. **Mood Tracker**: Extract emotions from voice captures, map to cycle
5. **Oura Correlations**: Compare HRV/sleep/temp to cycle phases
6. **Voice Capture Density**: When do you capture most thoughts?

**Interactions**:

- Filter by date range, activity type, cycle phase
- Zoom in/out, pan across timeline
- Export visualizations as images
- Share insights (optional, user-controlled)

#### Daily Summary Generation

**Process**:

1. At end of day (or when user requests), system gathers:
   - All voice captures from the day
   - All activities/timers from the day
   - Oura data (sleep, HRV, activity)
   - Cycle phase context
2. LLM (using user's API key) synthesizes into narrative summary
3. Summary includes:
   - Key events/activities
   - Emotional themes
   - Energy levels
   - Cycle context ("Day 12 of cycle, follicular phase - high energy aligned with your productive work session")
4. User can edit, expand, or regenerate summary

**Storage**: Summaries stored as daily journal entries (can be exported)

---

## Agent System: Orchestrator + Personalities

### Architecture

**Orchestrator Agent** (Primary Interface):

- User's main conversational entry point
- Understands user's current needs/goals
- Routes to specialist agents (Nutrition, Movement, Mindset)
- Can orchestrate multi-agent flows

**Specialist Agents** (Customizable Personalities):

1. **Nutrition Agent**: Focus on food, energy, cycle-aligned eating
2. **Movement Agent**: Focus on exercise, physical activity, embodiment
3. **Mindset Agent**: Focus on emotions, mental health, reflections

### User Flow: Group Conversation

**All agents participate together in a collaborative conversation**, building off each other's responses. Rather than routing to specific agents, the user engages with the entire "care team" at once.

**Example Flow**:

1. User opens agent chat, says: "I'm feeling really low energy and my period is about to start. I don't know what to do."

2. **Group conversation unfolds**:

   **Mindset Agent** (speaks first): "I hear you. Late luteal phase can feel really tender - your body is preparing for menstruation, and it's completely normal to feel low energy and emotional right now. This is a time for turning inward and being gentle with yourself."

   **Movement Agent** (builds on Mindset): "I agree with Mindset - your body is asking for softness right now. Instead of pushing for an intense workout, what if we focused on gentle movement? A 20-minute walk outside, some restorative yoga, or even just stretching. Your HRV is lower than usual (I can see from your Oura data), so restorative activities will serve you better."

   **Nutrition Agent** (adds practical support): "And let me add - your body needs extra nourishment right now. Focus on iron-rich foods (leafy greens, red meat if you eat it, lentils) and magnesium (dark chocolate, nuts, seeds) to support your body through this phase. Those chocolate cravings you might be feeling? They're real - your body needs magnesium!"

   **Orchestrator** (synthesizes): "So here's what we're all suggesting: honor where you are in your cycle. Go for a gentle walk, nourish your body with iron and magnesium-rich foods, and give yourself permission to rest. Your period will start soon, and you'll feel relief. This is part of your cycle's natural rhythm."

3. User responds: "Okay, that makes sense. What should I do for the rest of the week?"

4. **Agents continue collaborating**, providing a holistic plan that addresses mind, body, and nutrition together.

**Why Group Conversation**:
- **Holistic support**: Mind and body are inseparable - all agents contribute their perspective
- **Natural dialogue**: Feels like talking to a care team, not switching between separate specialists
- **Building off each other**: Agents reference and expand on each other's points
- **Coherent guidance**: Orchestrator synthesizes into actionable plan

### Agent Customization

**User Configuration**:

- User can customize agent prompts (what each agent focuses on)
- Example: User wants Nutrition agent to focus on plant-based eating
- Example: User wants Mindset agent to focus on anxiety management
- Agents remember user preferences and history

**Agent Personas** (Starting Personalities):

**Nutrition Agent**:

- Focus: Cycle-aligned eating, energy optimization, cravings
- Example prompts:
  - "What should I eat during my period?"
  - "Why am I craving chocolate in luteal phase?"
  - "Help me meal plan for this week based on my cycle"
- Context aware: Knows user's cycle phase, energy levels, recent activities

**Movement Agent**:

- Focus: Exercise, physical activity, embodiment practices
- Example prompts:
  - "What workout is best during ovulation?"
  - "I'm tired today. Should I rest or move?"
  - "Help me build a cycle-synced workout plan"
- Context aware: Knows user's Oura activity data, HRV, sleep quality

**Mindset Agent**:

- Focus: Emotions, mental health, reflections, self-compassion
- Example prompts:
  - "I'm feeling really emotional. Is this normal?"
  - "Help me process my feelings about [topic]"
  - "Give me a journaling prompt for today"
- Context aware: Reads user's recent voice captures, detects emotional patterns

### Agent Data Access

**Privacy-Preserving Approach**:

- Agents access user data via user's API keys (user's OpenAI/Anthropic account)
- Conversation history stored in user's Supabase (encrypted)
- User can delete agent conversations anytime
- No agent data used for model training (explicit contract with LLM providers)

---

## Oura Integration

### Oura MCP Server

**Current State**: Barebones MCP server built, needs functions added

**Required Functions**:

1. **Get Daily Readiness**: Overall readiness score, HRV, temperature
2. **Get Sleep Data**: Sleep stages, duration, quality, timing
3. **Get Activity Data**: Steps, calories, activity score
4. **Get Cycle Data**: Period logs, predicted phases, cycle day
5. **Log Period**: Function to log period start in Oura (from Cycle-Ki app)
6. **Get Daily Summary**: Comprehensive daily biometric snapshot

### Data Flow

**Sync Strategy**:

- **Automatic**: Background sync once per day (morning, after Oura processes previous night's sleep)
- **Manual**: User can trigger sync anytime via refresh button
- **Real-time** (Future): Webhook from Oura when new data available

**Data Stored in Supabase**:

- Daily Oura snapshots (readiness, sleep, activity)
- Linked to date (so calendar can show Oura data for each day)
- Cycle tracking data (period start/end dates, predicted phases)

### Bi-Directional Sync (Future Enhancement)

**Goal**: User logs period in cycle-ki → also logs in Oura app

**Implementation**:

- Use Oura API's period logging endpoint
- When user marks period start in cycle-ki, trigger Oura API call
- Keeps both apps in sync (single source of truth)

### Oura Context for Agents

**Agents can access Oura data to provide insights**:

- "Your HRV is low today. Let's focus on restorative activities."
- "You slept 9 hours last night (great!). You're in ovulation phase, perfect time for high-intensity workouts."
- "Your body temperature is elevated. Your period might start soon."

---

## Data Schema

### New Tables

#### 1. `daily_plans`

```sql
CREATE TABLE daily_plans (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,

  plan_date DATE NOT NULL, -- Date this plan is for
  raw_transcription TEXT, -- Original voice planning transcription

  created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
  updated_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,

  UNIQUE(user_id, plan_date) -- One plan per user per day
);

CREATE INDEX idx_daily_plans_user_date ON daily_plans(user_id, plan_date DESC);
```

#### 2. `daily_tasks`

```sql
CREATE TABLE daily_tasks (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  daily_plan_id UUID REFERENCES daily_plans(id) ON DELETE CASCADE,

  task_description TEXT NOT NULL,
  scheduled_time TIME, -- NULL if unscheduled
  estimated_duration INTEGER, -- Duration in minutes, NULL if not specified

  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'in_progress', 'completed')),

  -- Link to actual timer session when task completed
  timer_session_id UUID REFERENCES timer_sessions(id) ON DELETE SET NULL,

  task_date DATE NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
  updated_at TIMESTAMPTZ DEFAULT NOW() NOT NULL
);

CREATE INDEX idx_daily_tasks_user_date ON daily_tasks(user_id, task_date DESC);
CREATE INDEX idx_daily_tasks_status ON daily_tasks(status);
```

#### 3. `daily_summaries`

```sql
CREATE TABLE daily_summaries (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,

  summary_date DATE NOT NULL,
  summary_text TEXT NOT NULL, -- AI-generated daily summary

  -- Context included in summary
  voice_capture_ids UUID[], -- Which captures synthesized
  timer_session_ids UUID[], -- Which activities included
  cycle_day INTEGER,
  cycle_phase TEXT,

  created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
  updated_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,

  UNIQUE(user_id, summary_date)
);

CREATE INDEX idx_daily_summaries_user_date ON daily_summaries(user_id, summary_date DESC);
```

#### 4. `cycle_intentions`

```sql
CREATE TABLE cycle_intentions (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,

  cycle_start_date DATE NOT NULL, -- Day 1 of this cycle
  cycle_end_date DATE, -- NULL if current cycle

  intention_text TEXT NOT NULL, -- User's goal/focus for this cycle
  reflection_text TEXT, -- User's reflection at cycle end

  created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
  updated_at TIMESTAMPTZ DEFAULT NOW() NOT NULL
);

CREATE INDEX idx_cycle_intentions_user ON cycle_intentions(user_id, cycle_start_date DESC);
```

#### 5. `cycle_audits`

```sql
CREATE TABLE cycle_audits (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  cycle_intention_id UUID REFERENCES cycle_intentions(id) ON DELETE CASCADE,

  audit_data JSONB NOT NULL, -- Comprehensive cycle summary data
  -- Structure: {
  --   phases: { menstrual: {...}, follicular: {...}, ovulation: {...}, luteal: {...} },
  --   patterns: { activities: [...], emotions: [...], energy: [...] },
  --   oura_insights: { avg_hrv: X, best_sleep: Y, ... },
  --   comparisons: { vs_previous_cycles: [...] }
  -- }

  created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL
);

CREATE INDEX idx_cycle_audits_user ON cycle_audits(user_id, created_at DESC);
```

#### 6. `oura_daily_data`

```sql
CREATE TABLE oura_daily_data (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,

  data_date DATE NOT NULL,

  -- Readiness
  readiness_score INTEGER,
  hrv INTEGER,
  resting_heart_rate INTEGER,
  body_temperature DECIMAL,

  -- Sleep
  sleep_score INTEGER,
  total_sleep_seconds INTEGER,
  rem_sleep_seconds INTEGER,
  deep_sleep_seconds INTEGER,
  light_sleep_seconds INTEGER,

  -- Activity
  activity_score INTEGER,
  steps INTEGER,
  calories INTEGER,

  -- Cycle (from Oura's cycle tracking)
  cycle_day INTEGER,
  predicted_cycle_phase TEXT,

  raw_data JSONB, -- Store full Oura API response for future use

  synced_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,

  UNIQUE(user_id, data_date)
);

CREATE INDEX idx_oura_daily_data_user_date ON oura_daily_data(user_id, data_date DESC);
```

#### 7. `agent_conversations`

```sql
CREATE TABLE agent_conversations (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,

  agent_type TEXT NOT NULL CHECK (agent_type IN ('orchestrator', 'nutrition', 'movement', 'mindset')),

  messages JSONB NOT NULL, -- Array of {role, content, timestamp}

  created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
  updated_at TIMESTAMPTZ DEFAULT NOW() NOT NULL
);

CREATE INDEX idx_agent_conversations_user ON agent_conversations(user_id, agent_type, updated_at DESC);
```

### Modified Tables (from Timer/Calendar Spec)

#### `timer_sessions`

_No changes needed - already defined in TIMER_CALENDAR_BUILD_SPEC.md_

#### `captures`

_Already has `timer_session_ids` field - no additional changes_

---

## Key User Flows

### Flow 1: Morning Planning Ritual

1. **User wakes up** (e.g., 7:30am)
2. Opens cycle-ki app → **Capture Screen**
3. Sees cycle day/phase indicator ("Day 8, Follicular Phase 🌱")
4. Taps **voice logo**, says:
   - "Today I want to meditate, work out at 9am for 45 minutes, work on my project from 10:30 to 1pm, have lunch, take a walk in the afternoon, and call my mom."
5. **System processes**:
   - Transcribes voice
   - Parses tasks using LLM:
     - "meditate" → To-Do (unscheduled)
     - "work out at 9am for 45 minutes" → To-Do (scheduled 9:00-9:45)
     - "work on my project from 10:30 to 1pm" → To-Do (scheduled 10:30-13:00)
     - "have lunch" → To-Do (unscheduled)
     - "take a walk in the afternoon" → To-Do (unscheduled)
     - "call my mom" → To-Do (unscheduled)
   - Creates `daily_plan` record
   - Creates 6 `daily_tasks` records
6. **User sees**:
   - To-Do List populated on Capture Screen
   - Scheduled tasks show time/duration
   - Unscheduled tasks show as checklist items
7. **Web calendar** (if user checks):
   - Shows scheduled blocks for "work out" (9-9:45) and "work on project" (10:30-13:00)
   - Shows unscheduled tasks as banner at top of day

### Flow 2: Completing Activities with Timers

1. **User starts activity** (e.g., 9:15am, decides to work out now)
2. Taps "work out" task in To-Do List
3. **System**:
   - Starts timer automatically
   - Changes task status to "in_progress"
4. **Timer runs**:
   - Active Timer Bar appears at top showing "Work Out - 05:23" (live elapsed time)
   - User does workout
5. **During workout** (9:30am):
   - User feels inspired, taps voice logo
   - Records: "I'm feeling so good. My body feels strong today. Follicular energy is real!"
   - Voice capture tagged with "Work Out" timer ID
6. **User finishes workout** (9:58am):
   - Taps timer in Active Timer Bar → "Stop Timer"
   - System creates `timer_session`: 9:15am-9:58am (43 minutes)
   - Task marked "completed"
   - Task linked to timer_session_id
7. **Web calendar updates**:
   - Scheduled block (9:00-9:45) replaced with actual activity block (9:15-9:58)
   - Voice note dot appears within activity block
   - User can click voice note to read: "I'm feeling so good..."

### Flow 3: Evening Reflection & Daily Summary

1. **End of day** (e.g., 9pm)
2. User opens web calendar → **Daily View**
3. Sees all activities/captures from the day
4. Clicks "Generate Daily Summary" button
5. **System**:
   - Gathers all voice captures from day
   - Gathers all completed activities/timers
   - Fetches Oura data (sleep from last night, HRV, activity)
   - Sends to LLM (user's API key) with prompt: "Synthesize this day..."
6. **AI generates summary**:
   - "Day 8 of your cycle (Follicular Phase). You started strong with a morning workout where you felt powerful and energized - classic follicular vitality! Your project work session was productive (2.5 hours of deep focus). You captured reflections about feeling connected to your body. Your HRV was 65 (above average), and you slept 8 hours last night. A balanced, intentional day aligned with your cycle's energy."
7. **User reads summary**:
   - Can edit or add to it
   - Can expand to see individual voice captures
   - Summary saved as journal entry
8. **Optional**: User voice records additional reflection about the day

### Flow 4: Cycle Audit & Intention Setting

1. **User logs period start** (Day 1 of new cycle)
   - Opens app, system detects period start (from Oura or manual log)
   - Trigger: "Your cycle has completed! Time to reflect."
2. **Cycle Audit begins** (Web experience):
   - Screen: "Cycle Review - [Previous Cycle Start] to Today"
   - Shows previous intention: "Last cycle, you focused on: Building a morning routine"
3. **Phase Walk-Through**:
   - **Menstrual Phase** (Days 1-5):
     - Shows activities: "You rested more, captured reflections, did gentle yoga"
     - Voice captures: Themes extracted ("You wrote about needing rest, self-compassion")
     - Oura: "Lower HRV, more sleep needed"
   - **Follicular Phase** (Days 6-13):
     - Shows activities: "Peak activity! 8 workouts, 15 hours deep work"
     - Voice captures: "You felt energized, creative, confident"
     - Oura: "Highest HRV of cycle (avg 72)"
   - **Ovulation** (Days 14-16):
     - Shows activities: "Social time, meetings, creative projects"
     - Voice captures: "You felt magnetic, clear communication"
   - **Luteal** (Days 17-28):
     - Shows activities: "Energy decreased, more admin work, walks"
     - Voice captures: "Emotions surfaced, introspection, cravings"
     - Oura: "HRV declined, temperature rose"
4. **Pattern Insights**:
   - "You meditated 12 times this cycle, mostly in menstrual & luteal phases"
   - "Your most productive work happened in follicular phase"
   - "You captured the most voice notes during luteal (emotional processing time)"
5. **Cycle Comparison**:
   - Graph: HRV across this cycle vs previous 3 cycles
   - Graph: Activity levels by phase (comparison)
6. **Reflection Prompt**:
   - "What did you learn this cycle?"
   - User voice records or types: "I learned to honor my luteal phase more. I used to push through, but this cycle I rested and it felt better."
7. **New Intention**:
   - "What do you want to focus on next cycle?"
   - User inputs: "I want to build a consistent meditation practice, especially during luteal phase when I need it most."
   - System saves new `cycle_intention` record
8. **Cycle Audit Complete**:
   - Summary saved, can revisit anytime
   - User begins new cycle with fresh intention

### Flow 5: Agent Conversation (Group Model)

1. **User feels stuck** (e.g., Day 24, Luteal Phase, feeling low energy & emotional)
2. Opens **Agent Chat** (web or mobile)
3. Says: "I'm feeling really low and emotional. My period is coming soon. I don't know what to do with myself today."
4. **Group conversation begins** (all agents analyze context together):
   - Cycle context: Day 24, Luteal Phase (PMS window)
   - Recent captures: Emotional themes detected
   - Oura: HRV down, sleep quality decreased
5. **Agents respond as a care team**:

   **Mindset Agent**: "I hear you. Late luteal phase can feel really tender - your body is preparing for menstruation, and it's completely normal to feel low energy and emotional right now. This is a time for turning inward and being gentle with yourself."

   **Movement Agent**: "I agree with Mindset - your body is asking for softness right now. Instead of pushing for a hard workout, what about gentle movement today? A 20-minute walk outside, or restorative yoga. Your HRV is lower than usual (I can see from your Oura data), so restorative activities will serve you better."

   **Nutrition Agent**: "And let me add - your body needs extra nourishment right now. Focus on iron-rich foods (leafy greens, lentils) and magnesium (dark chocolate, nuts, seeds) to support your body through this phase. Those chocolate cravings? They're real - your body needs magnesium!"

   **Orchestrator**: "So here's what we're all suggesting: honor where you are in your cycle. Go for a gentle walk, do some journaling (try this prompt: 'What am I feeling right now, and what do I need?'), nourish your body with iron and magnesium-rich foods, and be kind to yourself. Your period will start soon, and you'll feel relief. This is part of your cycle's natural rhythm."

6. **User feels seen**:
   - Saves conversation
   - Follows suggestions (captures voice reflection, goes for walk, starts walk timer)
   - Feels supported by the system understanding her cycle

---

## Full Vision (Future Enhancements)

### Advanced Features (Post-MVP)

#### 1. Predictive Insights

- ML model trained on user's own data (local, privacy-preserving)
- Predicts: "You usually feel low energy on Day 23. Plan lighter activities."
- Suggests: "You're most creative during ovulation. Schedule brainstorming sessions then."

#### 2. Habit Tracking & Streaks

- Track habits across cycles (meditation streak, workout frequency)
- Celebrate wins aligned with cycle ("You worked out 4x during follicular phase!")

#### 3. Social Features (Optional, User-Controlled)

- Share cycle insights with close friends (with explicit consent)
- Community challenges ("Let's all rest during menstrual phase together")
- Anonymous data aggregation for research (opt-in only)

#### 4. Expanded Biometric Integrations

- Apple Health sync (heart rate, workouts, nutrition)
- Whoop, Garmin, Fitbit support
- Glucose monitor integration (CGM data → cycle correlations)

#### 5. Advanced Agent Capabilities

- Proactive check-ins ("It's Day 1, how are you feeling?")
- Personalized recommendations based on long-term patterns
- Integration with external tools (calendar apps, task managers)

#### 6. Cycle-Synced Productivity System

- Auto-adjust daily plans based on cycle phase
- "Focus time" blocks during follicular, "Reflection time" during luteal
- Integration with work calendars (suggests meeting times aligned with energy)

#### 7. Nutrition Tracking

- Log meals via voice ("I ate salmon and veggies for lunch")
- Correlate food with energy, mood, cycle phase
- Nutrition agent suggests cycle-aligned meal plans

#### 8. Deeper Oura Integration

- Real-time alerts ("Your HRV dropped - consider resting today")
- Sleep cycle analysis (how cycle affects sleep stages)
- Readiness score integrated into daily planning

#### 9. Export & Sharing

- Export cycle reports as PDFs (for doctors, partners)
- Share specific insights with healthcare providers
- Data portability (user owns all data, can export anytime)

#### 10. Multi-Language Support

- Expand to non-English speakers
- Culturally-sensitive cycle frameworks (different cultures view cycles differently)

---

## MVP Scope (What We Build First)

### Core MVP Features (Must-Have)

#### Phase 1: Foundation

- [ ] **Database Schema**: All tables created and tested
- [ ] **Oura Integration**: MCP server with core functions (readiness, sleep, activity, cycle data)
- [ ] **Authentication**: User signup/login (Supabase auth)
- [ ] **Privacy Setup**: User API key management (OpenAI/Anthropic)

#### Phase 2: Mobile Capture

- [ ] **Voice Capture**: Emotional voice notes (existing flow)
- [ ] **Daily Planning**: Voice-based morning planning with task parsing
- [ ] **To-Do List**: Display parsed tasks (scheduled + unscheduled)
- [ ] **Timer System**: Start/stop timers, track activities
- [ ] **Active Timer Bar**: Show live elapsed time for running timers
- [ ] **Timer-Voice Link**: Auto-tag voice notes with active timer IDs

#### Phase 3: Web Visualization

- [ ] **Calendar Views**: Monthly, Weekly, Daily
- [ ] **Cycle View**: Basic circular visualization (28-day cycle)
- [ ] **Activity Blocks**: Display completed timer sessions as time blocks
- [ ] **Voice Note Display**: Show voice notes within calendar
- [ ] **Cycle Phase Colors**: Color-code days by phase
- [ ] **Daily Summary**: AI-generated daily synthesis

#### Phase 4: Cycle-as-Sprint

- [ ] **Cycle Intentions**: User sets intention at cycle start
- [ ] **Cycle Audit**: Interactive review experience at cycle end
- [ ] **Pattern Insights**: Basic pattern detection (activity frequency, emotional themes)
- [ ] **Oura Context**: Display Oura data in calendar views

#### Phase 5: Agent System

one

- [ ] **Orchestrator Agent**: Main conversational interface
- [ ] **Specialist Agents**: Nutrition, Movement, Mindset (basic versions)
- [ ] **Agent Routing**: Orchestrator directs to right agent
- [ ] **Context Awareness**: Agents have access to cycle phase, recent captures, Oura data

### MVP Success Criteria

**User Can**:

1. Capture voice notes anytime (emotions, thoughts)
2. Plan their day via voice in the morning
3. Track high-impact activities with timers
4. See their day visualized on web calendar
5. View their data through cycle lens (cycle view)
6. Generate daily summaries
7. Complete cycle audit and set new intention at period start
8. Talk to AI agents for guidance (nutrition, movement, mindset)
9. Connect Oura Ring for biometric context
10. Feel confident their data is private and in their control

**System Demonstrates**:

1. Privacy-first architecture (user API keys, encrypted data)
2. Seamless mobile-to-web data flow
3. Cycle phase auto-tagging for all data
4. Pattern insights emerging from user's data
5. Agent conversations that feel contextually aware

---

## Technical Implementation Notes

### Codebase Strategy

**Recommendation**: Fork builder-ki codebase

**Rationale**:

- Start with proven foundation (auth, Supabase, voice capture, mobile UI)
- Modify/extend for cycle-specific features
- Keep cycle-ki separate to avoid cluttering builder-ki
- Allows divergence over time as products evolve

**Fork Process**:

1. Create new repo: `cycle-ki` (forked from `builder-ki`)
2. Remove builder-ki specific features (project management, docs, etc.)
3. Rename app ("Cycle-Ki"), update branding
4. Add cycle-specific tables to database
5. Implement cycle-specific UI (calendar views, cycle audit)
6. Add Oura integration
7. Add agent system

### Key Technical Challenges

#### 1. Voice Parsing for Daily Planning

- **Challenge**: Extract tasks, times, durations from natural language
- **Solution**: Use LLM with structured output (JSON schema)
- **Example Prompt**: "Parse this voice transcription into tasks. For each task, extract: task description, scheduled time (if mentioned), duration (if mentioned). Return as JSON array."

#### 2. Real-Time Timer Updates

- **Challenge**: Show live elapsed time for active timers without constant database queries
- **Solution**: Store start_time, calculate elapsed client-side every second
- **Mobile**: Use interval hook to re-render every second
- **Web**: WebSocket or polling for multi-device sync (future)

#### 3. Cycle Phase Calculation

- **Challenge**: Accurately tag data with cycle phase without manual input every day
- **Solution**:
  - Use Oura cycle tracking data (period logs, predictions)
  - Fall back to manual period logging if no Oura
  - Database trigger auto-populates cycle_day and cycle_phase on insert
  - Use existing `calculate_cycle_info()` function (from builder-ki)

#### 4. Privacy-Preserving AI

- **Challenge**: Generate summaries/insights without exposing data to third parties
- **Solution**:
  - User provides own API keys (they control which LLM service)
  - All API calls made from client-side (data never touches our servers)
  - Conversation history encrypted in Supabase
  - Option for local LLMs (future)

#### 5. Scheduled vs Actual Activity Reconciliation

- **Challenge**: User schedules "9am workout" but actually works out at 10am
- **Solution**:
  - Store both: `daily_tasks` (scheduled) + `timer_sessions` (actual)
  - Link task to timer_session when completed
  - Calendar shows actual, with option to show "planned vs actual" comparison
  - Analytics on adherence to schedule

#### 6. Cycle Audit Data Aggregation

- **Challenge**: Generate comprehensive cycle summary efficiently
- **Solution**:
  - Pre-compute some statistics (daily summary already done)
  - At cycle end, query all data for cycle date range
  - Use LLM to synthesize narrative from structured data
  - Cache cycle audit (stored in `cycle_audits` table)

---

## Design Principles

### 1. Cycle-Centricity

- Everything viewed through the lens of the cycle
- Cycle phase context always visible
- Patterns revealed across cycle phases

### 2. Privacy & Agency

- User owns their data
- User controls which services are used (via API keys)
- No data sharing without explicit consent
- Transparency about data usage

### 3. Holistic Integration (MIND + BODY)

- Never separate emotional/mental from physical
- Voice captures + biometrics + activities = complete picture
- Oura data contextualized with lived experience

### 4. Low Friction Capture

- Voice-first interface (fast, natural)
- Minimal taps to start timer or capture thought
- No complex forms or manual data entry

### 5. Beautiful Visualizations

- Calendar as art (cycle wheel is visually stunning)
- Color-coded cycle phases (intuitive, aesthetic)
- Data exploration feels delightful, not clinical

### 6. Compassionate Intelligence

- Agents never judgmental, always supportive
- Insights framed with empathy ("It's normal to feel this way")
- Celebrates wins, holds space for struggles

### 7. Incremental Growth

- Cycle-as-sprint framework encourages small, consistent improvements
- No pressure for perfection, just intention and reflection
- Progress measured over cycles, not days

---

## Success Metrics

### User Engagement

- Daily active users (DAU)
- Voice captures per user per week
- Timer sessions per user per week
- Calendar views per week
- Agent conversations per week

### Feature Adoption

- % users who complete daily voice planning
- % users who complete cycle audit at period start
- % users who set cycle intentions
- % users who connect Oura Ring
- % users who talk to agents

### User Outcomes (Long-term)

- User-reported: "I understand my cycle better"
- User-reported: "I feel more in control of my health"
- User-reported: "I'm more productive/happier/balanced"
- Retention: % users active after 3 months (3 full cycles)

### Technical Health

- API response times < 200ms
- Voice transcription < 5 seconds
- Calendar load time < 2 seconds
- Zero data breaches or privacy incidents

---

## Open Questions & Decisions Needed

### 1. Platform Priority

- Should we build mobile-first, or mobile + web simultaneously?
- **Recommendation**: Mobile capture first (critical path), web visualization second (can be used on desktop initially)

### 2. Cycle Tracking Method

- Rely solely on Oura, or build manual tracking too?
- **Recommendation**: Support both (Oura preferred, manual fallback)

### 3. Agent Complexity

- Start with simple agents (retrieval-augmented generation) or build sophisticated multi-agent system?
- **Recommendation**: Simple agents for MVP, evolve based on user needs

### 4. Paid vs Free

- Is Cycle-Ki a paid product from start, or freemium?
- **Consideration**: User provides own API keys (cost to them), so app could be free?

### 5. Target Platform (Mobile)

- iOS only, Android only, or both?
- **Recommendation**: Start with iOS (target demographic is iOS-heavy), Android later

### 6. Beta Testing

- Who will be the first users? Friends, online community, waitlist?
- **Recommendation**: Start with close friends in target demo (18-25 women), iterate based on feedback

---

## Next Steps

1. **Review & Align**: Confirm this vision matches your intention
2. **Prioritize**: Finalize MVP scope (what must be in v1?)
3. **Setup**: Fork builder-ki repo, create cycle-ki project
4. **Database**: Implement schema (new tables + modifications)
5. **Oura MCP**: Build out required functions
6. **Mobile**: Implement daily planning + timer system
7. **Web**: Build calendar views + cycle visualization
8. **Agents**: Implement orchestrator + specialist agents
9. **Test**: User testing with beta group
10. **Launch**: Soft launch to target audience

---

**Last Updated**: 2025-11-11
**Document Owner**: Cycle-Ki Team
**Status**: Draft - Awaiting Review & Approval

---

## Appendix: Terminology

- **Cycle Day**: Day number within menstrual cycle (Day 1 = first day of period, typically 28-day cycle)
- **Cycle Phase**: Menstrual (days 1-5), Follicular (6-13), Ovulation (14-16), Luteal (17-28)
- **Timer Session**: A tracked activity with start time, end time, and duration
- **Voice Capture**: A voice note recorded by user (transcribed)
- **Daily Plan**: User's voice-recorded plan for the day (morning ritual)
- **Daily Task**: Individual task extracted from daily plan
- **Daily Summary**: AI-generated synthesis of the day's activities and captures
- **Cycle Intention**: User's goal/focus for the current cycle (cycle sprint)
- **Cycle Audit**: Comprehensive review of previous cycle, presented at cycle end
- **Oura Data**: Biometric data from Oura Ring (sleep, HRV, readiness, activity, cycle tracking)
- **Agent**: AI conversational interface (Orchestrator, Nutrition, Movement, Mindset)
