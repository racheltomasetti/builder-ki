# Phase 1 Roadmap: builder-ki → LIGHTHOUSE Vision

**Goal**: Transform builder-ki into a fully functional Phase 1 system as defined in LIGHTHOUSE.md

**Timeline**: Complete before moving to production project

**Success Criteria**: Dogfooding daily, core loop feels valuable, ready to rebuild properly in production

---

## Current State Assessment

### ✅ What's Working (Keep & Refine)

**Authentication**
- ✅ Supabase Auth (email/password) on web + mobile
- ✅ Session persistence (AsyncStorage on mobile)
- ✅ Protected routes (middleware.ts)
- ✅ Row-level security policies
- **Status**: Complete, production-ready

**Mobile Voice Capture**
- ✅ Single-button interface (blue circle with animation)
- ✅ Recording with duration counter
- ✅ Upload to Supabase Storage (`voice-notes` bucket)
- ✅ Creates capture records in database
- **Status**: Working, aligns with LIGHTHOUSE vision ✨

**Web Dashboard (Pensieve)**
- ✅ Displays all captures chronologically
- ✅ Audio playback for voice notes
- ✅ Search functionality (SQL LIKE)
- ✅ Delete capability
- **Status**: Functional, needs enhancement

**Document System**
- ✅ Rich-text editor (Tiptap)
- ✅ Auto-save functionality
- ✅ Document CRUD operations
- ✅ Link documents to captures
- **Status**: Working well, aligns with "living branches" concept

**Thinking Partner Chat**
- ✅ Streaming AI responses
- ✅ Persistent conversation history per document
- ✅ Context-aware (knows document content)
- **Status**: Good foundation, needs corpus querying

**Infrastructure**
- ✅ Supabase (PostgreSQL + Auth + Storage)
- ✅ Docker setup (Neo4j + n8n)
- ✅ Next.js web app
- ✅ Expo mobile app
- **Status**: Solid foundation

---

### ⚠️ What's Incomplete (Build/Fix)

**Processing Pipeline** ✅ WORKING!
- ✅ Whisper API transcription integrated
- ✅ Claude insight extraction running
- ✅ n8n workflow actively processing
- ✅ Transcriptions appearing in database
- ✅ Insights being populated in Supabase
- ⚠️ No emotion detection yet (Claude prompt needs update)
- **Status**: WORKING - Just needs emotion detection added to prompt

**Neo4j Knowledge Graph** 🟡 IN PROGRESS
- ✅ Schema defined
- ✅ Python script created to populate from Supabase (`scripts/populate_neo4j.py`)
- ⚠️ Graph populated via script (not n8n - n8n Neo4j node has issues)
- ❌ Agent can't query corpus yet (needs Neo4j integration)
- **Status**: Unblocked - Run script to populate, then build agent queries

**Agent Corpus Querying** 🟡 IMPORTANT
- ⚠️ Agent only knows about current document
- ❌ Can't answer "What have I been thinking about X?"
- ❌ Can't reference specific past captures
- ❌ No pattern recognition across captures
- **Status**: Limited - needs Neo4j integration

**Insights Display** 🟡 IMPORTANT
- ⚠️ UI shows expandable insights sections
- ❌ But insights table is empty (pipeline not running)
- ❌ Can't see extracted concepts, questions, decisions, emotions
- **Status**: UI exists, no data

**Mobile UX Polish** 🟢 NICE-TO-HAVE
- ⚠️ Recording UI works but could be smoother
- ⚠️ No visual feedback when upload succeeds/fails
- ⚠️ No indication of processing status after capture
- **Status**: Functional but rough

---

### 🗑️ What's Not Needed (Remove/Ignore for Phase 1)

**Projects Feature**
- Schema exists but no UI
- Not required for Phase 1
- **Action**: Ignore for now, build in Phase 2+

**Photo/Video Capture**
- Removed from mobile UI (good!)
- Schema still supports it
- **Action**: Leave schema, don't build UI

**Focus Mode**
- Working in documents view
- Not critical for Phase 1
- **Action**: Keep as-is, it's nice to have

---

## Phase 1 Gap Analysis

### What LIGHTHOUSE Phase 1 Requires:

**MUST HAVE (Blocking):**
1. ✅ Mobile single-button voice capture → **DONE**
2. 🔴 Whisper transcription working → **BROKEN**
3. 🔴 Claude insight extraction working → **BROKEN**
4. 🔴 Emotion detection from voice/text → **NOT BUILT**
5. 🔴 Insights visible in Pensieve → **BLOCKED BY #2-4**
6. 🟡 Agent can query full corpus → **NEEDS NEO4J**
7. ✅ Document creation from captures → **DONE**
8. ✅ Basic search → **DONE**

**NICE TO HAVE (Non-blocking):**
- ⚠️ Better mobile UX polish
- ⚠️ Processing status indicators
- ⚠️ Better error handling

---

## Phase 1 Completion Checklist

### 🔴 CRITICAL PATH (Must complete to dogfood)

#### 1. Fix Processing Pipeline
**Goal**: Captures automatically transcribe and synthesize

- [ ] **Set up n8n workflow for voice processing**
  - [ ] Create webhook endpoint that triggers on new capture
  - [ ] Download audio file from Supabase Storage
  - [ ] Call OpenAI Whisper API with audio file
  - [ ] Store transcription in `captures.transcription`
  - [ ] Update `processing_status` to 'transcribing' → 'synthesizing' → 'complete'
  - [ ] Handle errors gracefully (mark as 'failed')

- [ ] **Implement Claude synthesis**
  - [ ] Design synthesis prompt (extract emotions, concepts, questions, decisions, insights)
  - [ ] Send transcription to Claude API
  - [ ] Parse Claude's structured response (JSON or markdown)
  - [ ] Insert extracted insights into `insights` table
  - [ ] Link insights to capture via `capture_id`

- [ ] **Add emotion detection**
  - [ ] In Claude prompt: analyze text for emotion phrases ("I feel...", "I'm so...")
  - [ ] In Claude prompt: infer emotions from context
  - [ ] (Future: voice tone analysis via specialized API)
  - [ ] Store detected emotions as insights with `type='emotion'`

- [ ] **Test end-to-end**
  - [ ] Capture voice on mobile
  - [ ] Verify webhook triggers n8n
  - [ ] Verify transcription appears in database
  - [ ] Verify insights appear in database
  - [ ] Verify status updates correctly

**Success Metric**: Capture a voice note → see transcription + insights on web within 60 seconds

---

#### 2. Populate Neo4j Knowledge Graph
**Goal**: Insights stored in graph for agent querying

- [ ] **Design Neo4j schema** (from LIGHTHOUSE.md)
  - [ ] Capture nodes (id, type, created_at)
  - [ ] Insight nodes (id, content, type)
  - [ ] Concept nodes (id, name)
  - [ ] Emotion nodes (id, emotion_type, intensity)
  - [ ] Relationships: EXTRACTED_FROM, RELATES_TO, MENTIONS

- [ ] **Populate graph from synthesis**
  - [ ] In n8n workflow: after Claude synthesis, connect to Neo4j
  - [ ] Create Capture node
  - [ ] Create Insight/Concept/Emotion nodes
  - [ ] Create relationships between nodes
  - [ ] Store Neo4j node IDs in Supabase for cross-referencing

- [ ] **Backfill existing captures** (if any)
  - [ ] Script to process any existing captures without insights
  - [ ] Run once to populate graph with historical data

**Success Metric**: Open Neo4j Browser → see captures and insights as connected nodes

---

#### 3. Enable Agent Corpus Querying
**Goal**: Agent can answer "What have I been thinking about X?"

- [ ] **Build Neo4j query functions**
  - [ ] Function: `searchCapturesByKeyword(keyword)` → returns relevant captures
  - [ ] Function: `getRelatedConcepts(captureId)` → returns connected concepts
  - [ ] Function: `findEmotionalPatterns(userId)` → returns emotion trends
  - [ ] Function: `getRecentCaptures(userId, limit)` → returns recent thinking

- [ ] **Integrate queries into agent**
  - [ ] Update Thinking Partner system prompt to include:
    - "You have access to the user's full capture corpus"
    - "When asked about past thinking, query the knowledge graph"
    - "Reference specific captures by ID when relevant"
  - [ ] Add tool/function for agent to call Neo4j queries
  - [ ] Format query results for agent consumption

- [ ] **Update agent API route**
  - [ ] `/api/thinking-partner`: accept queries that need corpus access
  - [ ] Detect when query requires historical context
  - [ ] Execute Neo4j queries before sending to Claude
  - [ ] Include query results in context for Claude

- [ ] **Test agent queries**
  - [ ] Ask: "What have I been thinking about lately?"
  - [ ] Ask: "When did I last mention [X]?"
  - [ ] Ask: "How have I been feeling this week?"
  - [ ] Verify agent references specific captures with IDs

**Success Metric**: Agent provides relevant answers citing specific past captures

---

### 🟡 IMPORTANT (Needed for good UX)

#### 4. Enhance Pensieve Display
**Goal**: Show insights beautifully on each capture

- [ ] **Update VoiceCard component**
  - [ ] Display transcription (already done)
  - [ ] Show extracted insights grouped by type:
    - Emotions (with intensity indicators)
    - Concepts (as tags or chips)
    - Questions (formatted as list)
    - Decisions (highlighted)
  - [ ] Make insights expandable/collapsible
  - [ ] Show processing status badge (pending/transcribing/synthesizing/complete/failed)

- [ ] **Add loading states**
  - [ ] Show skeleton loader while capture is processing
  - [ ] Animate when insights appear
  - [ ] Handle failed state gracefully (retry button?)

**Success Metric**: Captures look insightful and informative, not just raw audio

---

#### 5. Improve Mobile Capture UX
**Goal**: Capture feels magical

- [ ] **Visual feedback**
  - [ ] Success animation after upload completes
  - [ ] Clear indication that processing has started
  - [ ] (Optional) Push notification when processing completes

- [ ] **Error handling**
  - [ ] Show error if upload fails
  - [ ] Allow retry without re-recording
  - [ ] Offline mode: store locally, sync when online

- [ ] **Polish animations**
  - [ ] Smooth transitions between idle → recording → uploading
  - [ ] Haptic feedback on tap (iOS)
  - [ ] Subtle sound effects (optional, user preference)

**Success Metric**: Capture feels instant, delightful, zero friction

---

### 🟢 NICE TO HAVE (Can defer)

#### 6. Additional Features

- [ ] **Export functionality**
  - [ ] Export all captures as JSON
  - [ ] Export transcriptions as text/markdown

- [ ] **Advanced search**
  - [ ] Filter by date range
  - [ ] Filter by detected emotion
  - [ ] Filter by concepts/tags

- [ ] **Analytics view**
  - [ ] Word count over time
  - [ ] Capture frequency
  - [ ] Emotional trends

**Success Metric**: Not required for Phase 1, punt to Phase 2

---

## Technical Implementation Plan

### Priority Order (What to build first)

**Week 1: Get the Pipeline Working**
1. Set up n8n workflow for Whisper transcription
2. Test Whisper API integration
3. Store transcriptions in database
4. Verify transcriptions appear on web

**Week 2: Add AI Synthesis**
5. Design Claude synthesis prompt
6. Implement Claude API call in n8n
7. Parse and store insights
8. Display insights in Pensieve

**Week 3: Build Knowledge Graph**
9. Set up Neo4j schema
10. Populate graph from synthesis
11. Test graph queries in Neo4j Browser

**Week 4: Agent Integration**
12. Build Neo4j query functions
13. Integrate queries into agent
14. Test agent corpus querying

**Week 5: Polish & Dogfood**
15. Enhance Pensieve display
16. Improve mobile UX
17. Fix bugs discovered during use
18. Dogfood for 1-2 weeks

---

## Key Technical Decisions

### n8n Workflow Architecture

```
Trigger: Supabase Webhook (new capture inserted)
   ↓
Download Audio File (from Supabase Storage)
   ↓
Call Whisper API (transcription)
   ↓
Update Supabase (store transcription, status='synthesizing')
   ↓
Call Claude API (synthesis with custom prompt)
   ↓
Parse Claude Response (extract insights JSON)
   ↓
Insert Insights (Supabase insights table)
   ↓
Populate Neo4j Graph (create nodes + relationships)
   ↓
Update Supabase (status='complete')
   ↓
(Optional) Send Notification
```

### Claude Synthesis Prompt (Draft)

```
You are analyzing a voice capture to extract structured insights.

TRANSCRIPTION:
{transcription}

TASK:
Extract the following from the transcription:

1. EMOTIONS: What emotions is the person feeling? Look for:
   - Explicit emotion words ("I feel anxious", "I'm excited")
   - Implicit emotional context (tone of language, situation described)
   - Intensity (1-10 scale)

2. CONCEPTS: What key ideas or themes are mentioned?
   - Main topics discussed
   - Important entities (people, places, projects)
   - Recurring themes

3. QUESTIONS: What questions is the person asking or wondering about?
   - Explicit questions ("Should I...?")
   - Implicit curiosities ("I wonder if...")

4. DECISIONS: What choices have been made or are being considered?
   - Firm decisions ("I've decided to...")
   - Options being weighed ("I'm thinking about...")

5. INSIGHTS: What realizations or "aha moments" are expressed?
   - New understanding
   - Connections made
   - Lessons learned

RESPONSE FORMAT (JSON):
{
  "emotions": [
    {"emotion": "anxiety", "intensity": 7, "context": "about the project deadline"},
    {"emotion": "excitement", "intensity": 5, "context": "about the new idea"}
  ],
  "concepts": ["project management", "deadline pressure", "new feature idea"],
  "questions": [
    "Should I prioritize speed or quality?",
    "What if I can't finish on time?"
  ],
  "decisions": [
    "I'm going to focus on the MVP first"
  ],
  "insights": [
    "Perfectionism is slowing me down",
    "Breaking things into smaller steps reduces anxiety"
  ]
}
```

### Neo4j Query Examples

```cypher
// Find captures by keyword
MATCH (c:Capture)-[:MENTIONS]->(concept:Concept)
WHERE concept.name CONTAINS $keyword
RETURN c
ORDER BY c.created_at DESC
LIMIT 10

// Find captures with specific emotion
MATCH (c:Capture)-[:EXTRACTED_FROM]->(e:Emotion)
WHERE e.emotion_type = $emotion
RETURN c, e.intensity
ORDER BY c.created_at DESC

// Find related concepts
MATCH (c:Capture)-[:MENTIONS]->(concept:Concept)
WHERE c.id = $captureId
MATCH (concept)<-[:MENTIONS]-(related:Capture)
WHERE related.id <> $captureId
RETURN DISTINCT related
LIMIT 5
```

---

## Testing Strategy

### Manual Testing Checklist

**Mobile Capture Flow:**
1. Open app → Tap capture button
2. Record 30-second voice note
3. Verify upload succeeds
4. Check Supabase Storage: file exists
5. Check Supabase DB: capture record exists

**Processing Pipeline:**
6. Trigger n8n webhook manually
7. Verify transcription appears in database
8. Verify insights appear in database
9. Verify Neo4j nodes created
10. Verify processing_status = 'complete'

**Web Display:**
11. Open Pensieve view
12. See capture with transcription
13. See extracted insights (expandable)
14. Play audio file

**Agent Querying:**
15. Open agent chat
16. Ask "What have I been thinking about?"
17. Verify agent references specific captures
18. Ask follow-up questions

**Error Handling:**
19. Try uploading invalid audio file
20. Verify error state shows
21. Try capture with no internet
22. Verify offline handling

---

## Definition of "Phase 1 Complete"

Phase 1 is complete when:

✅ **Core Loop Works:**
- Capture voice on mobile → transcription + insights visible on web in < 60 seconds
- Agent can query full corpus and reference specific captures
- Document creation from captures works smoothly

✅ **Dogfooding Successfully:**
- You use it daily for 2+ weeks
- You capture 30+ times (mix of thoughts, emotions, observations)
- You reference past captures via agent regularly
- You create at least 3 documents from captures

✅ **Quality Threshold:**
- Transcription accuracy >95%
- AI-detected emotions feel accurate (spot check 10 captures)
- Extracted insights are relevant and useful
- No critical bugs in happy path

✅ **Ready to Rebuild:**
- You understand what works and what doesn't
- You have clear ideas for improvements
- You're confident in the vision
- You're excited to build it properly in production

---

## Next Steps

1. **Review this roadmap** - Does this align with your vision?
2. **Prioritize tasks** - Which critical path item should we tackle first?
3. **Set up n8n workflow** - Start with Whisper transcription
4. **Iterate rapidly** - Build → test → fix → repeat

**The goal is not perfection. The goal is a working system that proves the vision has legs.**

Once Phase 1 is complete here, we rebuild it properly in the production project with LIGHTHOUSE.md as the spec.

---

**Ready to start building?** Let me know which piece you want to tackle first! 🚀
