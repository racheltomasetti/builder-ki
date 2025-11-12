# builder-ki MVP Implementation Checklist

**Last Updated**: 2025-11-11
**Status**: Ready for Implementation
**Estimated Timeline**: 8 implementation hours

---

## Phase 1: Mobile Redesign (Hours 1-2)

**Goal**: Transform mobile UI from Daily Log / Capture / MediaUpload ’ Plan / Capture / Track

### Database Setup

- [ ] **Create timer_sessions table**
  - Run migration: `supabase/timer-sessions.sql`
  - Include indexes, RLS policies, triggers
  - Test: Insert sample timer_session, verify cycle info auto-populates
  - **Checkpoint**: Query `timer_sessions` table successfully, RLS working

- [ ] **Create daily_tasks table**
  - Run migration: `supabase/daily-tasks.sql`
  - Include indexes, RLS policies
  - Test: Insert sample task, link to timer_session
  - **Checkpoint**: Query `daily_tasks` table successfully, foreign keys working

- [ ] **Add timer_session_ids to captures table**
  - Run migration: `ALTER TABLE captures ADD COLUMN timer_session_ids UUID[]`
  - Create GIN index: `CREATE INDEX idx_captures_timer_sessions ON captures USING GIN(timer_session_ids)`
  - Test: Insert capture with array of timer IDs
  - **Checkpoint**: Can query captures by timer_session_id using `= ANY(timer_session_ids)`

### Mobile: Plan Tab

- [ ] **Create PlanScreen.tsx**
  - New file: `mobile/screens/PlanScreen.tsx`
  - Import existing components: cycle indicator, voice recording
  - Layout: cycle indicator at top, two main sections (morning/evening)

- [ ] **Time-based button switching logic**
  - Check current hour (before 12pm = morning, after 6pm = evening)
  - Morning: show "Set Intention" + "Plan Your Day" buttons
  - Evening: show "Daily Reflection" button
  - Between 12pm-6pm: show both options or default to morning
  - **Checkpoint**: Open app at different times, verify correct buttons show

- [ ] **Set Intention button (existing functionality)**
  - Use existing voice recording from DailyLogScreen
  - Upload to Supabase with `note_type='intention'`
  - Test: Record intention, verify appears in dashboard with correct note_type
  - **Checkpoint**: Intention voice notes appear in web DAILY journal

- [ ] **Plan Your Day button (NEW)**
  - New voice recording flow
  - Upload to Supabase with temporary `note_type='planning'`
  - Store file_url, wait for processing
  - Show loading state: "Processing your plan..."
  - **Checkpoint**: Planning voice uploads successfully, pending processing

- [ ] **Daily Reflection button (existing functionality)**
  - Use existing voice recording from DailyLogScreen
  - Upload to Supabase with `note_type='reflection'`
  - Test: Record reflection, verify appears in dashboard
  - **Checkpoint**: Reflection voice notes appear in web DAILY journal

### Mobile: Capture Tab

- [ ] **Update CaptureScreen.tsx**
  - Keep existing voice capture (mandala, cycle indicator)
  - Add camera button below voice button

- [ ] **Add camera capture (NEW)**
  - Import expo-image-picker
  - "Take Photo" button ’ launches camera
  - "Record Video" button ’ launches video recorder
  - No library upload option (moved to Track tab)
  - Upload to captures with `type='photo'` or `type='video'`
  - Auto-tag with cycle day/phase
  - **Checkpoint**: Take photo/video, verify uploads with cycle context

- [ ] **Check for active timers during capture**
  - Before uploading capture, query `timer_sessions` where `status='active'`
  - Add active timer IDs to `timer_session_ids` array
  - Test: Start timer, capture voice, verify link
  - **Checkpoint**: Capture linked to timer visible in database

### Mobile: Track Tab

- [ ] **Create TrackScreen.tsx**
  - New file: `mobile/screens/TrackScreen.tsx`
  - Three sections: To-Do List, Active Timers, Media Upload

- [ ] **To-Do List display**
  - Fetch `daily_tasks` for today (`task_date = today`)
  - Group by status: pending, in_progress, completed
  - Scheduled tasks show time + duration
  - Unscheduled tasks show as simple checklist
  - **Checkpoint**: Manual insert task in DB, verify displays in app

- [ ] **Task tap ’ start timer**
  - User taps pending task
  - Create `timer_session` with task name, start_time=now(), status='active'
  - Update task status to 'in_progress', link timer_session_id
  - Navigate to or show Active Timer Bar
  - **Checkpoint**: Tap task, timer starts, task status updates

- [ ] **Active Timer Bar component**
  - `mobile/components/ActiveTimerBar.tsx`
  - Shows when any timer has status='active'
  - Displays: timer name, elapsed time (live updating every second)
  - Buttons: Stop, Pause
  - Horizontal scroll if multiple timers
  - **Checkpoint**: Start timer, bar appears with live time updates

- [ ] **Stop timer functionality**
  - User taps Stop button
  - Update timer_session: end_time=now(), status='completed'
  - Update linked task: status='completed'
  - Remove from Active Timer Bar
  - **Checkpoint**: Stop timer, database updates, bar disappears

- [ ] **Pause/Resume timer (optional)**
  - Pause: update status='paused'
  - Resume: update status='active'
  - Track paused duration (future enhancement)
  - **Checkpoint**: Pause/resume works, elapsed time continues correctly

- [ ] **Media Upload section**
  - Move existing MediaUploadScreen functionality here
  - Photo/video upload from device library
  - EXIF date extraction
  - Used for backfilling historical data
  - **Checkpoint**: Upload historical photo, EXIF date extracted

- [ ] **Reflection trigger (after 6pm)**
  - Check current hour
  - If after 6pm, show: "Ready to reflect on the day?"
  - Button: "Reflect" ’ navigates to Plan tab
  - Plan tab automatically shows Daily Reflection button
  - **Checkpoint**: After 6pm, trigger appears and navigates correctly

### Mobile: Navigation Update

- [ ] **Update MainTabsNavigator.tsx**
  - Replace tab names: Plan / Capture / Track
  - Update icons (calendar for Plan, mic for Capture, checkmark for Track)
  - Set initial route to Plan or Capture (decide)
  - **Checkpoint**: Three new tabs visible, navigation works

- [ ] **Remove old screens (post-migration)**
  - Archive or remove DailyLogScreen.tsx (functionality moved to Plan)
  - Archive or remove MediaUploadScreen.tsx (functionality moved to Track)
  - **Checkpoint**: App builds without old screens

---

**PHASE 1 CHECKPOINT**:
- Mobile has 3 new tabs: Plan / Capture / Track
- Can record intention, planning, reflection, general captures
- Can upload photos/videos
- Planning voice uploads but doesn't parse yet (Phase 2)
- Timers start/stop, tasks update
- Database schema ready

---

## Phase 2: Timer Integration (Hour 3)

**Goal**: Full timer system working end-to-end, including task parsing

### Voice Planning Processing

- [ ] **Create planning parser API route**
  - New file: `web/app/api/parse-planning/route.ts`
  - Receives: user_id, transcription, date
  - Calls OpenAI/Anthropic with structured output prompt
  - Returns: array of tasks `[{description, time?, duration?}]`

- [ ] **Planning parser prompt**
  - Extract tasks from transcription
  - Parse times: "9am", "10:30", "2pm" ’ TIME format
  - Parse durations: "45 minutes", "2 hours", "30min" ’ integer minutes
  - Handle unscheduled: "call mom", "take walk" ’ time=NULL
  - Return JSON: `{ tasks: [{ description: string, time?: string, duration?: number }] }`
  - **Checkpoint**: Test prompt with sample transcriptions, verify correct parsing

- [ ] **Webhook or polling for planning voice**
  - Option A: Webhook from Whisper transcription completion
  - Option B: Polling from mobile app after upload
  - When transcription ready, call parser API
  - **Checkpoint**: Upload planning voice, transcription triggers parser

- [ ] **Create daily_tasks from parsed output**
  - For each task in parser output:
    - Insert into `daily_tasks` table
    - Set task_date = today
    - Set scheduled_time, estimated_duration if provided
    - Set status='pending'
  - **Checkpoint**: Planning voice ’ tasks appear in Track tab

- [ ] **Mobile: Refresh Track tab after parsing**
  - Listen for new tasks (polling or real-time subscription)
  - Reload to-do list when tasks created
  - Show loading state: "Creating your plan..."
  - **Checkpoint**: Record planning voice, wait 5-10 sec, tasks appear

### Timer API Functions

- [ ] **Create timer API functions**
  - New file: `mobile/lib/timerApi.ts`
  - Functions: startTimer(), stopTimer(), pauseTimer(), resumeTimer(), getActiveTimers()
  - All functions interact with `timer_sessions` table
  - **Checkpoint**: Call each function manually, verify database updates

- [ ] **startTimer(userId, name, description?)**
  - Insert into timer_sessions: user_id, name, start_time=now(), status='active'
  - Cycle info auto-populated by trigger
  - Return created timer object
  - **Checkpoint**: Start timer, verify cycle_day/cycle_phase populated

- [ ] **stopTimer(timerId)**
  - Update timer_sessions: end_time=now(), status='completed'
  - **Checkpoint**: Stop timer, end_time set

- [ ] **pauseTimer(timerId) / resumeTimer(timerId)**
  - Update status='paused' or status='active'
  - **Checkpoint**: Pause/resume updates status

- [ ] **getActiveTimers(userId)**
  - Query timer_sessions where user_id=userId, status='active'
  - Order by start_time DESC
  - **Checkpoint**: Returns array of active timers

### Timer State Management

- [ ] **Create useTimers hook**
  - New file: `mobile/hooks/useTimers.ts`
  - State: activeTimers, loading
  - Load active timers on mount
  - Interval: update elapsed times every second (client-side calculation)
  - Refetch function for manual refresh
  - **Checkpoint**: Hook returns live timer data, elapsed time updates

- [ ] **Integrate useTimers in TrackScreen**
  - Import useTimers hook
  - Display active timers in Active Timer Bar
  - Start timer ’ adds to activeTimers state
  - Stop timer ’ removes from activeTimers state
  - **Checkpoint**: Timer state syncs with database

### Multiple Concurrent Timers

- [ ] **Support multiple timers running simultaneously**
  - Active Timer Bar shows all active timers (horizontal scroll)
  - Each timer has independent Stop/Pause buttons
  - Each timer updates elapsed time independently
  - **Checkpoint**: Start 2+ timers, all show and update independently

### Link Captures to Timers

- [ ] **Update voice/photo/video capture flow**
  - Before uploading capture, call `getActiveTimers()`
  - Extract timer IDs: `const timerIds = activeTimers.map(t => t.id)`
  - Include in capture record: `timer_session_ids: timerIds`
  - **Checkpoint**: Capture during active timer, timer_session_ids populated

### Timer Persistence

- [ ] **Handle app close/reopen**
  - Active timers persist in database (status='active')
  - On app reopen, fetch active timers via getActiveTimers()
  - Resume displaying Active Timer Bar if timers exist
  - Elapsed time calculates from start_time
  - **Checkpoint**: Start timer, close app, reopen, timer still active

---

**PHASE 2 CHECKPOINT**:
- Voice planning parses into tasks
- Tasks appear in Track tab
- Timers start/stop/pause/resume
- Multiple concurrent timers work
- Captures link to active timers
- Timers persist across app restarts

---

## Phase 3: Web Calendar Views (Hours 4-5)

**Goal**: Build CYCLE journal with calendar visualizations

### Calendar Page Structure

- [ ] **Create /cycle route**
  - New file: `web/app/cycle/page.tsx`
  - Main calendar view with view mode toggle
  - Sidebar for cycle agents (placeholder for Phase 4)

- [ ] **View mode toggle component**
  - Buttons: Cycle / Monthly / Weekly / Daily
  - State: current view mode
  - **Checkpoint**: Toggle between views, UI updates

### Fetch Timer Sessions & Captures

- [ ] **Create calendar API function**
  - New file: `web/lib/calendarApi.ts`
  - Function: `getCalendarData(userId, startDate, endDate)`
  - Fetches: timer_sessions, captures, daily_tasks for date range
  - Returns combined data structure
  - **Checkpoint**: API call returns data for date range

- [ ] **Data structure for calendar**
  ```typescript
  {
    date: string,
    cycleDay: number,
    cyclePhase: string,
    timerSessions: TimerSession[],
    captures: Capture[],
    tasks: Task[]
  }
  ```
  - Group data by date
  - **Checkpoint**: Data grouped correctly by date

### Daily View (Timeline)

- [ ] **Create DailyTimeline component**
  - New file: `web/components/calendar/DailyTimeline.tsx`
  - 24-hour vertical timeline
  - Props: date, timerSessions, captures

- [ ] **Render activity blocks**
  - For each timer_session with end_time:
    - Calculate position: start_time hour/minute
    - Calculate height: duration (end_time - start_time)
    - Display as colored block with timer name
  - **Checkpoint**: Activity blocks appear at correct times with correct heights

- [ ] **Render voice note markers**
  - For each capture (voice):
    - Calculate position: created_at hour/minute
    - Display as dot/icon
    - If timer_session_ids exists, nest inside activity block
    - If no timer, display standalone
  - **Checkpoint**: Voice notes appear at correct times, linked to activities

- [ ] **Render photos/videos inline**
  - For each capture (photo/video):
    - Display thumbnail at created_at time
    - Click to expand
  - **Checkpoint**: Media displays inline in timeline

- [ ] **Cycle phase indicator**
  - Header shows: "Day X, [Phase]"
  - Background subtle color based on phase
  - **Checkpoint**: Cycle context visible

- [ ] **Click interactions**
  - Click activity block ’ expand details (duration, voice notes within)
  - Click voice note ’ read full transcription
  - Click photo ’ open modal
  - **Checkpoint**: All interactions work

### Weekly View

- [ ] **Create WeeklyView component**
  - New file: `web/components/calendar/WeeklyView.tsx`
  - 7 columns (Mon-Sun)
  - Each column is mini daily timeline

- [ ] **Render week grid**
  - Fetch data for 7 days
  - For each day: show activity blocks (condensed), voice note count
  - Click day ’ zoom to daily view
  - **Checkpoint**: Week displays with 7 days of data

- [ ] **Scheduled vs actual comparison**
  - If task has scheduled_time but timer started at different time:
    - Show scheduled block (light/dashed)
    - Show actual block (solid)
  - **Checkpoint**: Can see planned vs actual activities

### Monthly View

- [ ] **Create MonthlyView component**
  - New file: `web/components/calendar/MonthlyView.tsx`
  - Traditional calendar grid (5-6 weeks)

- [ ] **Render month grid**
  - Each day cell shows:
    - Date number
    - Cycle day number (if applicable)
    - Phase color (background)
    - Activity count
    - Voice note count
  - Click day ’ zoom to daily view
  - **Checkpoint**: Month displays with all days, cycle colors visible

### Cycle View (Circular)

- [ ] **Create CycleView component**
  - New file: `web/components/calendar/CycleView.tsx`
  - SVG circular layout (28 segments)
  - Uses polar coordinates

- [ ] **Render cycle wheel**
  - 28 day segments in circle
  - Each segment colored by phase
  - Center shows: current cycle day
  - **Checkpoint**: Circular calendar renders with phase colors

- [ ] **Map activity blocks to cycle days**
  - For each timer_session: calculate polar position based on cycle_day
  - Render as arc, sized by duration
  - **Checkpoint**: Activity blocks appear on correct cycle days

- [ ] **Map voice notes to cycle days**
  - For each capture: calculate polar position based on cycle_day
  - Render as dot/marker
  - **Checkpoint**: Voice notes appear on correct cycle days

- [ ] **Click interaction**
  - Click cycle day ’ zoom to daily view for that date
  - **Checkpoint**: Clicking day navigates to daily view

### Calendar Navigation

- [ ] **Add date navigation**
  - Previous/Next buttons
  - Date picker
  - "Today" button
  - **Checkpoint**: Can navigate between dates/weeks/months

### Web: Update DAILY journal

- [ ] **Add activity blocks to dashboard feed**
  - In existing `/dashboard` page
  - For each day in feed, fetch timer_sessions
  - Display activity blocks inline with captures
  - **Checkpoint**: DAILY journal shows activities + captures

---

**PHASE 3 CHECKPOINT**:
- `/cycle` route exists with all 4 views
- Daily view shows timeline with activities, voices, media
- Weekly view shows 7 days with activities
- Monthly view shows calendar grid with cycle colors
- Cycle view shows circular calendar with data mapped to cycle days
- All views clickable and interactive
- DAILY journal enhanced with activity blocks

---

## Phase 4: Cycle Agents (Hour 6)

**Goal**: AI guidance sidebar in CYCLE journal

### Agent Sidebar UI

- [ ] **Create AgentSidebar component**
  - New file: `web/components/calendar/AgentSidebar.tsx`
  - Collapsible sidebar on right side of calendar
  - Chat interface: message list + input

- [ ] **Agent conversation UI**
  - Message bubbles for user and agents
  - Agent messages labeled: "Nutrition", "Movement", "Mindset", "Orchestrator"
  - Input field with send button
  - **Checkpoint**: UI renders, can type and send messages

### Agent API Route

- [ ] **Create agent chat API**
  - New file: `web/app/api/cycle-agents/chat/route.ts`
  - Receives: userId, message, conversation history
  - Fetches user context: cycle day/phase, recent captures, oura data (if available)

- [ ] **Agent system prompts**
  - Create 4 agent prompts:
    - Nutrition: cycle-aligned eating, cravings, energy
    - Movement: exercise, activity, embodiment
    - Mindset: emotions, mental health, reflections
    - Orchestrator: synthesizes all three
  - Each agent has specific personality and focus
  - **Checkpoint**: Prompts defined, agents respond in character

- [ ] **Group conversation logic**
  - On user message:
    - Mindset agent responds first
    - Movement agent responds second, references Mindset
    - Nutrition agent responds third, builds on both
    - Orchestrator synthesizes final guidance
  - All responses in single API call
  - **Checkpoint**: One user message ’ four agent responses

### Context Awareness

- [ ] **Fetch cycle context**
  - Get user's current cycle_day and cycle_phase
  - Include in agent prompt context
  - **Checkpoint**: Agents aware of cycle phase in responses

- [ ] **Fetch recent captures**
  - Get last 7 days of voice captures
  - Summarize emotional themes
  - Include in agent prompt context
  - **Checkpoint**: Agents reference recent emotional patterns

- [ ] **Fetch activity patterns**
  - Get timer_sessions from current cycle
  - Summarize: which activities in which phases
  - Include in agent prompt context
  - **Checkpoint**: Agents reference activity patterns

- [ ] **Fetch Oura data (if available)**
  - Get recent HRV, sleep, readiness scores
  - Include in agent prompt context
  - **Checkpoint**: Agents reference biometric data when available

### Streaming Responses

- [ ] **Implement streaming**
  - Use Anthropic/OpenAI streaming API
  - Stream each agent's response sequentially
  - Display in UI as typing
  - **Checkpoint**: Agent responses stream in real-time

### Conversation Persistence

- [ ] **Save conversation to database**
  - After each exchange, insert into `agent_conversations`
  - agent_type='cycle_group'
  - messages as JSONB array
  - **Checkpoint**: Conversations persist, reload shows history

- [ ] **Load conversation history**
  - On sidebar open, fetch latest conversation
  - Display in UI
  - Include in context for next message
  - **Checkpoint**: Previous messages show on sidebar open

---

**PHASE 4 CHECKPOINT**:
- Agent sidebar appears in /cycle
- Can chat with group of agents
- Agents respond with context (cycle, captures, activities)
- Group conversation model works (all 4 agents contribute)
- Responses stream in real-time
- Conversations persist across sessions

---

## Phase 5: Oura Integration (Hour 7)

**Goal**: Sync biometric data from Oura Ring

### Oura MCP Server Setup

- [ ] **Create Oura MCP server directory**
  - New directory: `oura-mcp/`
  - Initialize MCP server boilerplate

- [ ] **Implement OAuth flow**
  - Oura OAuth 2.0 setup
  - Redirect URI, client ID, client secret
  - Store access token encrypted in database or env
  - **Checkpoint**: Can authenticate with Oura, receive access token

- [ ] **Implement MCP functions**
  - `getDailyReadiness(date)`: readiness score, HRV, temperature
  - `getSleepData(date)`: sleep stages, duration, quality
  - `getActivityData(date)`: steps, calories, activity score
  - `getCycleData()`: period logs, predicted phases, cycle day
  - `getDailySummary(date)`: comprehensive snapshot
  - **Checkpoint**: Each function returns data from Oura API

### Database: oura_daily_data

- [ ] **Create oura_daily_data table**
  - Run migration: `supabase/oura-daily-data.sql`
  - Columns: readiness_score, hrv, temperature, sleep scores, activity, cycle data
  - RLS policies
  - **Checkpoint**: Table exists, can insert sample data

### Daily Sync Workflow

- [ ] **Create sync API route**
  - New file: `web/app/api/oura/sync/route.ts`
  - Fetches previous day's data from Oura MCP
  - Inserts into `oura_daily_data` table

- [ ] **Manual sync button**
  - In calendar UI, "Sync Oura" button
  - Calls sync API route
  - Shows loading state
  - **Checkpoint**: Click sync, data appears in database

- [ ] **Automatic daily sync (future/optional)**
  - Cron job or scheduled function
  - Runs daily at 6am (after Oura processes previous night's sleep)
  - **Checkpoint**: Sync runs automatically

### Display Oura Data

- [ ] **Add Oura panel to Daily View**
  - Shows: readiness score, HRV, sleep quality, steps
  - Visual indicators: colors, icons
  - **Checkpoint**: Oura data visible in daily timeline

- [ ] **Add Oura indicators to Monthly/Weekly View**
  - Small icons or colors indicating sleep/HRV
  - Hover to see details
  - **Checkpoint**: Oura context visible in other views

### Oura Data for Agents

- [ ] **Include Oura in agent context**
  - When fetching context for agents, include recent Oura data
  - Agents can reference: "Your HRV is lower than usual..."
  - **Checkpoint**: Agents mention Oura data in responses

---

**PHASE 5 CHECKPOINT**:
- Oura OAuth working
- Can fetch data from Oura API
- oura_daily_data table populates
- Manual sync button works
- Oura data displays in calendar views
- Agents have access to Oura context

---

## Phase 6: Polish & Testing (Hour 8)

**Goal**: Bug fixes, performance, end-to-end testing

### Enhanced DAILY Journal

- [ ] **Improve timeline visualization**
  - Better spacing, visual hierarchy
  - Larger photos/videos
  - Smooth scrolling
  - **Checkpoint**: DAILY journal feels polished

- [ ] **Quick actions**
  - Favorite button on captures
  - "Expand in CREATE" button ’ opens in documents
  - **Checkpoint**: Actions work smoothly

### Scheduled vs Actual Comparison

- [ ] **Visual comparison in weekly view**
  - Scheduled tasks show as dashed/light blocks
  - Actual timers show as solid blocks
  - Legend explains difference
  - **Checkpoint**: Can see adherence to schedule

### Pattern Insights (Basic)

- [ ] **Simple pattern detection**
  - "You worked out 8 times this cycle, mostly in follicular phase"
  - "Most voice captures during luteal phase"
  - Display in cycle view or sidebar
  - **Checkpoint**: Basic insights visible

### Bug Fixes

- [ ] **Test mobile flows end-to-end**
  - Morning planning ’ tasks appear ’ start timer ’ capture during timer ’ stop timer ’ evening reflection
  - Fix any bugs found
  - **Checkpoint**: Full day flow works without errors

- [ ] **Test web calendar end-to-end**
  - Navigate between views ’ click day ’ see daily timeline ’ interact with activities
  - Fix any bugs found
  - **Checkpoint**: Calendar navigation smooth, no crashes

- [ ] **Test timer persistence**
  - Start timer ’ close app ’ reopen ’ timer still active
  - Fix any issues with timer state
  - **Checkpoint**: Timers persist correctly

- [ ] **Test voice processing**
  - Record intention ’ appears in DAILY
  - Record planning ’ tasks appear in Track
  - Record capture ’ linked to timer
  - Fix any processing delays or failures
  - **Checkpoint**: All voice types process correctly

### Performance Optimization

- [ ] **Optimize calendar data fetching**
  - Paginate or limit date ranges
  - Cache fetched data
  - **Checkpoint**: Calendar loads in <2 seconds

- [ ] **Optimize timer updates**
  - Debounce state updates
  - Minimize re-renders
  - **Checkpoint**: Active Timer Bar updates smoothly without lag

- [ ] **Optimize image loading**
  - Lazy load images in timeline
  - Compress before upload
  - **Checkpoint**: Images load quickly, no jank

### End-to-End Testing

- [ ] **7-day test**
  - Use app daily for 7 days
  - Morning: set intention, plan day
  - Throughout day: capture moments, start/stop timers
  - Evening: reflect
  - Web: view calendar, explore patterns, chat with agents
  - **Checkpoint**: No critical bugs, app usable daily

- [ ] **Edge case testing**
  - No cycle data (first-time user)
  - No tasks planned (empty Track tab)
  - No active timers (no Active Timer Bar)
  - No Oura connected (graceful degradation)
  - **Checkpoint**: App handles edge cases gracefully

### Final Touches

- [ ] **Update navigation labels**
  - Web: DAILY / CYCLE / CREATE
  - Mobile: Plan / Capture / Track
  - **Checkpoint**: All labels updated

- [ ] **Rename /documents to /create**
  - Update route
  - Update all links/navigation
  - **Checkpoint**: /create route works

- [ ] **Cycle phase colors consistent**
  - Verify colors match across mobile + web
  - Menstrual: blue, Follicular: green, Ovulation: yellow, Luteal: orange
  - **Checkpoint**: Colors consistent everywhere

---

**PHASE 6 CHECKPOINT**:
- All bugs fixed
- Performance optimized
- 7-day test passed
- Edge cases handled
- UI polished
- Ready for daily use

---

## MVP Complete: Success Criteria

Verify all 14 criteria:

1.  Can set morning intention via voice (Plan tab)
2.  Can plan day via voice ’ tasks appear in Track tab
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

## Post-MVP: Future Enhancements (Out of Scope)

These are intentionally deferred:

- Daily summaries (AI-generated synthesis at day end)
- Cycle audits (interactive review at cycle end)
- Cycle intentions (goal-setting per cycle)
- Projects UI (organize captures by topic)
- Export functionality
- Advanced visualizations (cycle overlay, energy map, etc.)
- Neo4j knowledge graph
- n8n workflows
- Multi-device real-time sync
- Cycle prediction ML

---

## Technical Notes for Build Team

### Key Dependencies

**Mobile**:
- expo-av (voice recording)
- expo-image-picker (camera/video)
- expo-file-system (file handling)
- react-navigation (tabs/stack)
- @supabase/supabase-js

**Web**:
- next.js 14 (app router)
- @supabase/auth-helpers-nextjs
- tiptap (rich text editor, already in CREATE)
- react (for components)
- tailwindcss (styling)

**Backend**:
- Supabase (database, auth, storage)
- OpenAI or Anthropic API (voice transcription + LLM parsing + agents)
- Oura API (biometric data)

### Database Migrations Order

1. `timer-sessions.sql`
2. `daily-tasks.sql`
3. `alter-captures-add-timer-ids.sql`
4. `oura-daily-data.sql`

### Environment Variables Needed

```
# Supabase
NEXT_PUBLIC_SUPABASE_URL=
NEXT_PUBLIC_SUPABASE_ANON_KEY=
SUPABASE_SERVICE_ROLE_KEY=

# Mobile
EXPO_PUBLIC_SUPABASE_URL=
EXPO_PUBLIC_SUPABASE_ANON_KEY=

# AI APIs
OPENAI_API_KEY=  # for Whisper transcription
ANTHROPIC_API_KEY=  # for agents and parsing

# Oura
OURA_CLIENT_ID=
OURA_CLIENT_SECRET=
OURA_REDIRECT_URI=
```

### Testing Strategy

- **Unit tests**: Not required for MVP
- **Integration tests**: Manual testing at each checkpoint
- **E2E tests**: 7-day dogfooding
- **User acceptance**: Use yourself as primary user

### Deployment Notes

- **Mobile**: Test via Expo Go (no App Store deployment for MVP)
- **Web**: Deploy to Vercel or similar (Next.js optimized)
- **Database**: Supabase cloud (already configured)
- **Storage**: Supabase storage buckets (voice-notes, photos, videos, media-items)

### Common Pitfalls to Avoid

- **Timer elapsed time**: Calculate client-side every second, don't query DB
- **Cycle phase colors**: Use constants file, keep consistent
- **Voice processing**: Handle async properly, show loading states
- **RLS policies**: Test thoroughly, verify users only see own data
- **Timezone handling**: Use TIMESTAMPTZ, convert to user's local time for display

---

**Ready to build!** Work through each phase sequentially, verify checkpoints before moving to next phase.
