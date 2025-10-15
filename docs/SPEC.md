# ki - AI-Powered Thought Clarification System

## 1. Overview & Objectives

### What:

ki is an AI-powered thought clarification system that captures scattered thinking (voice notes, photos with annotations), synthesizes it into a queryable knowledge corpus (the Pensieve), and helps you articulate your ideas clearly so you can prompt external AI agents (Claude, ChatGPT, Cursor) effectively.

### Why:

#### The Core Problem:

AI assistants are incredibly powerful, but they're only as good as your ability to explain what you want. Most people struggle to articulate their thinking clearly because:

- Ideas come in fragments (walking, showering, random moments)
- Thinking is scattered across mediums (voice memos, videos, notebook sketches, random texts)
- When it's time to prompt an AI, you can't remember or articulate what you actually meant
- You end up with vague prompts that produce mediocre results

#### The Deeper Issue:

Even when you DO capture your thinking, it sits in isolated silos:

- Voice memos you never revisit
- Videos you recorded once and forgot
- Photos of notebooks you can't search
- Notes in different apps, impossible to synthesize
- No way to query "what have I been thinking about X?"

**Result:** You prompt AI agents without full context, get generic responses, waste time clarifying.

#### What This Solves:

ki transforms scattered thinking into prompt-ready clarity:

- **Frictionless capture:** Voice, video, photos, no friction, captured instantly
- **Automatic synthesis:** AI extracts insights, decisions, questions, themes
- **Queryable corpus:** Ask "what have I said about X?" and get instant context
- **Prompt formulation:** Agent helps you articulate your thinking into clear, effective prompts
- **Universal application:** Works for building software, writing, research, design—anything that benefits from clear thinking

**The result:** You prompt Claude/ChatGPT/Cursor with clarity and context, they understand you perfectly, you get better outputs faster.

### Success Metrics:

#### Speed Metrics:

- **Idea-to-Clarity Time:** Time from "I have scattered thoughts" to "I can clearly articulate this" drops by 60%

  - Before: Hours/days trying to remember and organize thinking
  - After: < 10 minutes querying Pensieve and formulating prompt
  - Measured by: Self-reported weekly tracking

- **Processing Speed:** Voice/video note → transcribed + insights visible in < 60 seconds

  - Proves real-time synthesis works seamlessly
  - Tracked automatically via timestamps

- **Context Retrieval:** Finding relevant past thinking goes from 10+ minutes to < 30 seconds
  - Before: Searching scattered notes, trying to remember
  - After: Ask agent, get instant summary with references
  - Measured by: Agent query response time

#### Usage Metrics:

- **Daily Engagement:** Tool actively used for 30+ consecutive days

  - Active use = capturing, querying, or formulating prompts
  - Proves genuine value, not novelty that gets abandoned

- **Capture Velocity:** 10+ captures per day maintained for 30 days
  - Proves capture is truly frictionless
  - Mix of voice, video, and photos

#### Output Quality Metrics:

- **Prompt Effectiveness:** Prompts created with this tool work better with external AI

  - Self-reported: "Did prompts created from your Pensieve get better AI responses than usual?"
  - Target: 80%+ say yes
  - Measured weekly

- **Clarity Improvement:** Ability to articulate ideas improves over time

  - Week 1: "Rate your ability to explain ideas clearly (1-10)"
  - Week 4: "Rate it now"
  - Target: +3 points improvement

- **Knowledge Utilization:** Captured thinking is actively queried/referenced at least 5x per week
  - Proves knowledge isn't just stored—it's USED
  - Tracked via agent query logs

#### Subjective Value Metrics:

- **Thought Articulation:** Feel more clear about own thinking

  - Weekly: "Do you understand your own ideas better this week? (1-10)"
  - Target: 8+/10 average

- **Tool Dependence:** Can't imagine working without it
  - Monthly: "Would you be frustrated if this tool disappeared?"
  - Target: 80%+ say "Yes, it's essential"

## 2. Scope

### In Scope: Explicit list of features/capabilities included in this build

#### 1. Authentication

- ✅ Supabase Auth (email/password)
- ✅ Sign up / Log in
- ✅ Session persistence
- ✅ Protected routes

#### 2. Mobile Capture (iOS Only - Expo Go)

- ✅ **Quick Capture (no project selection)**

  - One screen with three buttons (🎤 Voice | 📷 Photo | 🎥 Video)
  - Each button opens modal with two options:
    - **Voice:** "Record Now" (live recording) OR "Upload Recording" (from device storage: m4a, mp3, wav, aac)
    - **Photo:** "Take Photo" (live camera) OR "Upload Photo" (from library: jpg, jpeg, png, heic)
    - **Video:** "Record Video" (live recording) OR "Upload Video" (from storage: mp4, mov, m4v)
  - Visual upload progress
  - No preview, no editing, zero friction

- ✅ **Automatic Processing**
  - Upload to Supabase Storage (buckets: voice-notes, photos, videos)
  - Create record in captures table (no project_id)
  - n8n workflow triggers immediately
  - Status updates: pending → transcribing → synthesizing → complete

#### 3. Processing Pipeline (n8n + AI)

- ✅ **Voice Notes:**

  - Whisper API transcription
  - Claude extracts: insights, decisions, questions, concepts
  - Update Neo4j graph
  - Update Supabase insights table
  - Mark complete

- ✅ **Videos:**

  - Whisper API transcribes audio track from video
  - Claude extracts: insights, decisions, questions, concepts (same as voice)
  - Video file stored in Supabase Storage
  - Update Neo4j graph
  - Update Supabase insights table
  - Mark complete

- ✅ **Photos:**
  - Photo uploaded immediately to storage
  - Requires annotation on web to trigger synthesis
  - User must add text annotation via web interface
  - Once annotation saved → triggers n8n workflow
  - Claude analyzes annotation (same extraction as voice)
  - Update Neo4j graph + Supabase
  - Mark complete
  - **Note:** Photos without annotation just sit in Pensieve, not synthesized (no OCR in MVP)

#### 4. Pensieve View (Web - PRIMARY)

- ✅ **Route:** /dashboard (default landing after login)
- ✅ **Display:** ALL captures, reverse chronological
- ✅ **Filters:** All | Voice | Photo | Video | Date range
- ✅ **Search bar:** Text search across transcriptions/annotations (SQL LIKE query)

- ✅ **Voice Note Cards:**

  - Audio player (HTML5 <audio>)
  - Transcription text
  - Extracted insights below (expandable)
  - Processing status badge (pending/transcribing/synthesizing/complete/failed)
  - Timestamp (created_at)

- ✅ **Photo Cards:**

  - Image thumbnail (click for full-size modal)
  - Annotation text field (editable if not yet annotated, read-only after synthesis)
  - "Save Annotation" button (triggers synthesis workflow)
  - Extracted insights below (if annotated)
  - Processing status badge
  - Timestamp

- ✅ **Video Cards:**
  - Video player (HTML5 <video>)
  - Transcription text (from audio track)
  - Extracted insights below
  - Processing status badge
  - Timestamp

#### 5. Agent Chat (Web)

- ✅ **Route:** /dashboard/chat (dedicated page)
- ✅ **Interface:**

  - Full-screen chat interface
  - Message history (session-based, clears on page reload)
  - Text input + send button
  - Streaming responses (real-time typing effect)

- ✅ **Agent Capabilities:**

  - Query entire Pensieve: "What have I said about authentication?"
  - Query within project context (if project selected): "What's in this project?"
  - Summarize related captures
  - Reference specific captures by ID: "In capture #47, you mentioned..."
  - Help formulate prompts: "Help me prompt Claude to build an auth system"

- ✅ **Agent Behavior:**
  - Queries Neo4j for relevant knowledge
  - Loads session conversation history
  - Provides context-aware responses
  - Suggests clear, actionable prompts when asked
  - References specific captures naturally

#### 6. "Help Me Prompt" Flow

**Not a separate feature/button—natural agent conversation behavior**

- ✅ **User asks:** "Help me prompt Claude to [do something]"
- ✅ **Agent automatically:**
  - Queries Pensieve for relevant captures (voice, video, photo annotations)
  - Summarizes user's thinking on the topic
  - Identifies key requirements, constraints, decisions from captures
  - Formulates a clear, context-rich prompt
  - Presents formatted prompt in code block, ready to copy
- ✅ **User:** Copies prompt → pastes into Claude/ChatGPT/Cursor
- ✅ **Result:** Better AI responses because prompt has full context from captures

EXAMPLE:
User: "Help me prompt Claude to build an authentication system"

Agent: "Based on your 5 captures about authentication, here's what you've been thinking:

- You want simplicity over complexity (Capture #3, #7)
- Magic links considered but rejected for power users (Capture #12)
- Security is important, specifically mentioned password hashing (Capture #7)
- Tech stack: Next.js + Supabase (Capture #3)

Here's a prompt based on your thinking:

---

I need to implement authentication for a Next.js app using Supabase with these requirements:

1. Email/password login (primary method)
2. Keep it simple - avoid over-engineering
3. Security is critical: proper password hashing, session management
4. Consider power users who prefer traditional login (no magic links)

Please provide:

- Database schema for users/auth tables
- API routes for signup/login/logout
- Security best practices
- Implementation steps

## Tech stack: Next.js 14, Supabase, TypeScript

Copy this prompt and use it with Claude/Cursor."

```

#### 7. Projects (Optional, Lightweight)

**Projects are optional containers for focused work**

- ✅ **Create Projects:**
  - User can create named projects: "Auth System", "Blog Post on AI", etc.
  - Projects have: name, description, created_at
  - Stored in `projects` table

- ✅ **Add Captures to Projects:**
  - From Pensieve view: Select multiple captures → "Add to Project X"
  - Many-to-many relationship via `project_captures` table
  - One capture can belong to multiple projects

- ✅ **Project View:**
  - Route: `/dashboard/projects/[projectId]`
  - Filtered Pensieve showing only captures assigned to this project
  - Same card types as main Pensieve (voice, video, photo)
  - Can add more captures from Pensieve

- ✅ **Agent + Projects:**
  - When in project view, agent knows project context
  - Agent queries prioritize captures within the project
  - But can still reference full Pensieve if needed

- ✅ **Why Keep Projects:**
  - Helps focus when corpus gets large (100+ captures)
  - Optional means Pensieve-first users can ignore entirely
  - Sets foundation for Phase 2 cross-project learning

#### 8. Infrastructure

- ✅ Docker Compose: Neo4j + n8n (local)
- ✅ Supabase (cloud, already configured)
- ✅ Next.js dev server (localhost:3000)
- ✅ Expo dev server (mobile via Expo Go)
- ✅ Local deployment only (no production hosting)

---

### OUT OF SCOPE (Phase 2 - NOT TODAY):

#### Capture Features:
- ❌ Android support (iOS only)
- ❌ Offline capture with sync queue
- ❌ Capture editing after upload
- ❌ Capture deletion
- ❌ OCR for photos (manual annotation required)
- ❌ Screen recording
- ❌ Import from other tools (Notion, Evernote, etc.)
- ❌ Text-only capture (no text box, use voice instead)

#### Pensieve Features:
- ❌ Semantic search (just basic SQL LIKE search in MVP)
- ❌ Advanced filters (tags, custom queries, saved searches)
- ❌ Bulk operations (delete multiple, archive, batch edit)
- ❌ Export corpus (JSON, CSV, backup)
- ❌ Capture analytics (graphs, trends, statistics)
- ❌ Capture preview on mobile before upload

#### Synthesis Features:
- ❌ "Find Related Captures" button
- ❌ Auto-clustering of similar captures
- ❌ Theme detection and elevation
- ❌ Creating Principles/Philosophies from captures
- ❌ Pull request system for themes
- ❌ Temporal decay / relevance ranking

#### Agent Features:
- ❌ Persistent conversation history (across sessions)
- ❌ Multiple conversation threads
- ❌ Proactive suggestions ("You should add this to Project X")
- ❌ Voice interaction with agent
- ❌ Agent generates diagrams/visualizations
- ❌ Agent auto-suggests project assignments
- ❌ Agent can generate code (just prompts)

#### Project Features:
- ❌ Agent auto-adds captures to projects
- ❌ Project templates
- ❌ Project relationships (builds on, references)
- ❌ Cross-project insights and learning
- ❌ Shared projects (collaboration, multi-user)
- ❌ Project export/archiving

#### Mobile Features:
- ❌ View Pensieve on mobile
- ❌ Chat with agent on mobile
- ❌ Edit annotations on mobile
- ❌ Push notifications (processing complete)
- ❌ Capture editing on mobile

#### Visualization Features:
- ❌ Mind map generation from knowledge graph
- ❌ Data flow diagrams
- ❌ System architecture diagrams
- ❌ Interactive graph explorer (visual Neo4j browser)
- ❌ Timeline view of captures
- ❌ Relationship visualization

#### Export/Integration:
- ❌ Direct Cursor integration (auto-export to `.claude/spec.md`)
- ❌ GitHub repository linking
- ❌ Public building journey visualization
- ❌ Oura Ring integration
- ❌ Calendar integration
- ❌ Slack/Discord integration

---

### ASSUMPTIONS:

#### User Assumptions:
1. Single user (you) for MVP—no multi-user scenarios
2. Has iOS device with Expo Go app installed
3. Comfortable with terminal (starting Docker, running npm/pnpm commands)
4. Has reliable internet connection (no offline support)
5. Regularly uses AI assistants (Claude, ChatGPT, Cursor) and understands prompting

#### Technical Assumptions:
1. Docker Desktop installed and running on Windows
2. Node.js v20+ installed
3. pnpm available for package management
4. Supabase cloud account active with project configured
5. Valid API keys available:
   - OpenAI (Whisper transcription)
   - Anthropic (Claude for synthesis and agent)
6. Localhost development only (not configuring for production)
7. Ports available: 3000 (Next.js), 5678 (n8n), 7474 (Neo4j Browser), 7687 (Neo4j Bolt)

#### Data Assumptions:
1. Voice notes < 10MB (Whisper API limit)
2. Videos < 50MB (reasonable mobile recording)
3. Photos < 5MB (reasonable mobile camera quality)
4. English language for transcription and synthesis
5. Reasonable capture volume (< 100 captures per day—no rate limiting needed)
6. No sensitive PII in captures (local deployment, but good practice anyway)

#### Workflow Assumptions:
1. n8n workflows execute reliably (trust n8n's retry logic)
2. API services are available (OpenAI, Anthropic, Supabase—no elaborate fallbacks)
3. User manually verifies processing worked (no automated health checks)
4. User manages Docker containers (start/stop/restart as needed)
5. Processing failures are rare (handle basic errors, not every edge case)

---

### CONSTRAINTS:

#### Timeline Constraints:
- **MVP must ship TODAY**
- Sacrifice polish for functionality
- Defer all "nice to have" features to Phase 2
- Focus exclusively on core heartbeat working
- No perfectionism—good enough is good enough

#### Technical Constraints:
- Local deployment only (no cloud infrastructure, no DNS, no SSL)
- n8n handles orchestration (avoid building custom Express/FastAPI backend)
- Minimal UI polish (Tailwind defaults, no custom design)
- Happy path focus (basic error handling, not exhaustive)
- No automated testing (manual QA only)
- Windows development environment (some tools may need workarounds)

#### Resource Constraints:
- Single developer (you)
- API costs must stay under $50 during testing phase:
  - Whisper: ~$0.006 per minute of audio
  - Claude: ~$3 per million input tokens, ~$15 per million output tokens
  - Target: ~500 captures @ 1-2 min each = ~$5-10 total
- No design resources (using Tailwind only, no Figma, no designer)
- No external QA (dogfooding only, you test everything)

#### Scope Constraints:
- Projects are optional/lightweight (not required for core loop)
- iOS only (no Android, no web-based mobile capture)
- English only (no internationalization, no multi-language)
- Desktop web UI only (no mobile web responsiveness)
- No editing after capture (immutable captures)
- No deletion of captures (can't remove once created)
- Session-based agent chat (not persistent across page reloads)
- Manual annotation required for photos (no OCR)

---

### CORE HEARTBEAT (The North Star):
```

Mobile → Quick Capture (voice/photo/video) →
Automatic Upload (Supabase Storage) →
n8n Processing (transcribe + AI synthesis) →
Pensieve View (see all captures + insights) →
Agent Chat (query corpus for context) →
"Help me prompt Claude to build X" →
Agent formulates clear, context-rich prompt →
Copy prompt → Use in Claude/ChatGPT/Cursor →
Get better results →
[LOOP: Capture new thinking, refine ideas, repeat]

## 3. Core User Flows

### Flow 1: Mobile Capture

**Goal:** Capture thinking instantly with zero friction

**Steps:**

1. Open Ki mobile app → Login (first time only)
2. Main screen shows three buttons: 🎤 Voice Note | 📷 Photo | 🎥 Video
3. User taps one → Modal appears with two options:
   - **Live Capture:** "Record Now" / "Take Photo" / "Record Video"
   - **Upload:** "Upload Recording" / "Upload Photo" / "Upload Video"
4. User selects option → Captures/selects file → Auto-uploads to Supabase Storage
5. Success message: "Captured! Processing in ~30 seconds"
6. n8n workflow triggered immediately

**Success Criteria:**

- ✅ Capture to upload < 5 seconds
- ✅ File in Supabase Storage
- ✅ Record in `captures` table with `processing_status='pending'`
- ✅ n8n webhook triggered

---

### Flow 2: Processing Pipeline

**Goal:** Automatic transcription and insight extraction

**Steps:**

1. n8n receives webhook on new capture
2. If voice/video: Download file → Whisper transcription → Update DB with transcription
3. Call Claude API with transcription (or photo annotation)
4. Claude returns: insights, decisions, questions, concepts (JSON)
5. Create nodes in Neo4j graph with relationships
6. Insert insights into Supabase `insights` table
7. Mark `processing_status='complete'`

**Success Criteria:**

- ✅ Processing completes in < 60 seconds
- ✅ Transcription accurate
- ✅ Insights relevant and useful
- ✅ Neo4j graph updated
- ✅ Status visible in web UI

---

### Flow 3: Pensieve View

**Goal:** See all captures with insights in clean, scannable interface

**Steps:**

1. User opens `/dashboard`
2. All captures displayed as cards, newest first
3. Voice/video cards: Play audio/video, read transcription, expand to see insights
4. Photo cards: View image, see/edit annotation, see insights (if annotated)
5. Search bar filters captures by text match
6. Status badges show: Pending | Processing | Complete | Failed

**Success Criteria:**

- ✅ All captures visible
- ✅ Audio/video plays correctly
- ✅ Transcription readable
- ✅ Insights make sense
- ✅ Search works (< 500ms)
- ✅ Photos can be annotated (triggers processing)

---

### Flow 4: Agent Query

**Goal:** Query entire knowledge corpus for context

**Steps:**

1. User navigates to `/dashboard/chat`
2. Types question: "What have I said about authentication?"
3. Agent queries Neo4j graph for relevant captures
4. Agent streams response with:
   - Summary of user's thinking
   - References to specific captures (by ID)
   - Key insights, decisions, questions
   - Related concepts
5. User asks follow-up questions → Agent maintains context

**Success Criteria:**

- ✅ Agent finds relevant captures
- ✅ Agent references captures by ID
- ✅ Responses are accurate and contextual
- ✅ Streaming works smoothly
- ✅ Conversation feels natural

---

### Flow 5: Help Me Prompt

**Goal:** Formulate clear, context-rich prompts for external AI

**Steps:**

1. User in agent chat asks: "Help me prompt Claude to build an auth system"
2. Agent queries Pensieve for all captures about auth
3. Agent analyzes: requirements, decisions, constraints, tech stack
4. Agent formulates comprehensive prompt with:
   - Context from captures
   - Specific requirements
   - Constraints
   - Tech stack
   - Clear ask
5. Agent presents prompt in code block
6. User clicks copy → Pastes in Claude/ChatGPT/Cursor
7. External AI understands perfectly, produces better output

**Success Criteria:**

- ✅ Agent includes specific details from captures
- ✅ Prompt is comprehensive (not vague)
- ✅ Prompt is formatted cleanly (easy to copy)
- ✅ External AI produces better results than without Ki's context
- ✅ User feels "this is magic"

## 4. Data Model

### Supabase Tables:

```sql
-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Projects table (optional containers)
CREATE TABLE projects (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    name TEXT NOT NULL,
    description TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Captures table (Pensieve - no required project_id)
CREATE TABLE captures (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    type TEXT NOT NULL CHECK (type IN ('voice', 'photo', 'video')),
    file_url TEXT NOT NULL,
    transcription TEXT,
    annotation TEXT,
    processing_status TEXT DEFAULT 'pending' CHECK (processing_status IN ('pending', 'transcribing', 'synthesizing', 'complete', 'failed')),
    created_at TIMESTAMPTZ DEFAULT NOW(),
    processed_at TIMESTAMPTZ
);

-- Project-Capture relationships (many-to-many, optional)
CREATE TABLE project_captures (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    project_id UUID NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
    capture_id UUID NOT NULL REFERENCES captures(id) ON DELETE CASCADE,
    added_at TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE(project_id, capture_id)
);

-- Insights table (denormalized from Neo4j)
CREATE TABLE insights (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    capture_id UUID NOT NULL REFERENCES captures(id) ON DELETE CASCADE,
    type TEXT NOT NULL CHECK (type IN ('insight', 'decision', 'question', 'concept')),
    content TEXT NOT NULL,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Indexes
CREATE INDEX idx_projects_user_id ON projects(user_id);
CREATE INDEX idx_captures_user_id ON captures(user_id);
CREATE INDEX idx_captures_created_at ON captures(created_at DESC);
CREATE INDEX idx_captures_processing_status ON captures(processing_status);
CREATE INDEX idx_project_captures_project ON project_captures(project_id);
CREATE INDEX idx_project_captures_capture ON project_captures(capture_id);
CREATE INDEX idx_insights_capture_id ON insights(capture_id);

-- RLS
ALTER TABLE projects ENABLE ROW LEVEL SECURITY;
ALTER TABLE captures ENABLE ROW LEVEL SECURITY;
ALTER TABLE project_captures ENABLE ROW LEVEL SECURITY;
ALTER TABLE insights ENABLE ROW LEVEL SECURITY;

-- RLS Policies
CREATE POLICY "Users can manage own projects" ON projects
    FOR ALL USING (auth.uid() = user_id);

CREATE POLICY "Users can manage own captures" ON captures
    FOR ALL USING (auth.uid() = user_id);

CREATE POLICY "Users can manage own project_captures" ON project_captures
    FOR ALL USING (
        EXISTS (
            SELECT 1 FROM projects
            WHERE projects.id = project_captures.project_id
            AND projects.user_id = auth.uid()
        )
    );

CREATE POLICY "Users can view own insights" ON insights
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM captures
            WHERE captures.id = insights.capture_id
            AND captures.user_id = auth.uid()
        )
    );

CREATE POLICY "Users can create insights" ON insights
    FOR INSERT WITH CHECK (
        EXISTS (
            SELECT 1 FROM captures
            WHERE captures.id = insights.capture_id
            AND captures.user_id = auth.uid()
        )
    );

```

### Neo4j Graph:

**Nodes:**

- Capture (id, type, created_at)
- Insight (id, content, created_at)
- Decision (id, content, created_at)
- Question (id, content, created_at)
- Concept (id, name, created_at)
- Project (id, name, created_at)

**Relationships:**

- (Capture)-[:EXTRACTED_FROM]->(Insight)
- (Capture)-[:EXTRACTED_FROM]->(Decision)
- (Capture)-[:EXTRACTED_FROM]->(Question)
- (Capture)-[:EXTRACTED_FROM]->(Concept)
- (Insight)-[:RELATES_TO]->(Insight)
- (Decision)-[:ANSWERS]->(Question)
- (Concept)-[:MENTIONED_IN]->(Capture)

---

## 5. Tech Stack

### Frontend:

- **Web:** Next.js 14 (App Router), TypeScript, Tailwind CSS
- **Mobile:** Expo (React Native), TypeScript

### Backend:

- **Database:** Supabase (PostgreSQL + Auth + Storage)
- **Knowledge Graph:** Neo4j (Docker, local)
- **Orchestration:** n8n (Docker, local)

### AI/ML:

- **Transcription:** OpenAI Whisper API
- **Synthesis:** Anthropic Claude API

### Infrastructure:

- **Local Development:** Docker Compose (Neo4j + n8n)
- **Deployment:** Localhost only (MVP)

---

## 6. Build Priority

### ✅ COMPLETED (Phase 1: Foundation)

1. ✅ Docker setup (Neo4j + n8n)
2. ✅ Supabase schema applied
3. ✅ Environment variables configured
4. ✅ Next.js project set up
5. ✅ Expo project set up
6. ✅ Authentication working end-to-end (web +
   mobile)

### Phase 2: Capture System

7. Mobile capture UI (voice/photo/video)
8. Upload to Supabase Storage
9. Create capture records

### Phase 3: Processing

10. n8n workflow: Voice/video → Whisper → Claude → Neo4j
11. n8n workflow: Photo annotation → Claude → Neo4j
12. Status updates visible in real-time

### Phase 4: Web UI

13. Pensieve view (capture feed)
14. Photo annotation interface
15. Search functionality
16. Agent chat interface

### Phase 5: Agent Intelligence

17. Agent system prompt
18. Neo4j query integration
19. Streaming responses
20. "Help me prompt" behavior

### Phase 6: Polish & Test

21. Projects (optional feature)
22. End-to-end testing
23. Bug fixes
24. Performance optimization

---

## 7. Definition of Done

**MVP is complete when:**

1. ✅ Can capture voice/photo/video on mobile
2. ✅ Processing completes in < 60 seconds
3. ✅ Can view all captures + insights on web
4. ✅ Can search Pensieve
5. ✅ Can chat with agent
6. ✅ Agent provides relevant answers from corpus
7. ✅ Agent can formulate prompts based on captures
8. ✅ Can copy prompts and use in external AI
9. ✅ Projects work (optional feature)
10. ✅ No critical bugs in happy path

**Deployment complete when:**

- Running locally on your machine
- Docker containers stable
- Can demo full flow end-to-end
- Ready for daily dogfooding

---

**LET'S BUILD THIS. 🚀**
