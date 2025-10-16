# TODO - Voice-Only MVP Build Plan

## Strategic Pivot: Live Voice Capture Only

We've simplified the MVP to focus exclusively on **live voice capture** for scattered thinking. This decision eliminates complexity, enforces present-focused philosophy, and lets us perfect one capture method before expanding.

---

## PART 1: Mobile Voice Capture (Live Only)

### ✅ COMPLETED

- [x] Implement voice recording functionality
- [x] Fix audio mode initialization and cleanup
- [x] Fix deprecated FileSystem API usage
- [x] Fix Buffer usage in upload function
- [x] Fix Storage bucket RLS policies
- [x] Test live voice recording on iOS device
- [x] Verify files upload to Supabase Storage voice-notes bucket
- [x] Verify capture records created in database

### 🔄 IN PROGRESS

#### Task 1: Simplify Mobile UI (Remove Photo/Video)

- [x] Remove photo and video button components from CaptureScreen
- [x] Remove photo/video related imports (ImagePicker, DocumentPicker for non-audio)
- [x] Remove photo/video capture functions (takePhoto, pickPhoto, recordVideo, pickVideo)
- [x] Remove modal rendering logic (no longer needed)
- [x] Remove screen title

#### Task 2: Redesign Voice Recording UI

- [x] Remove voice button modal (direct tap-to-record)
- [x] Create large centered circle (primary action, UI design is high priority once core heartbeat is working)
- [x] Design recording state UI:
- [x] Add visual feedback during upload (progress indicator)
- [x] Improve success message UX

#### Task 3: Remove Upload Functionality

- [x] Remove `pickVoiceFile` function (no file uploads)
- [x] Remove DocumentPicker import
- [x] Remove all file picker related code
- [x] Simplify upload logic to only handle live recordings

#### Task 4: Polish Recording Experience

- [x] Add recording duration display

**CHECKPOINT 1:** Simplified voice-only mobile UI complete and tested

---

## PART 2: n8n Processing Pipeline (Voice Only)

### Task 5: Webhook Setup

- [x] Open n8n dashboard (http://localhost:5678)
- [x] Create new workflow: "Voice Capture Processing"
- [x] Add Webhook trigger node
  - Set to POST method
  - Note webhook URL for Supabase configuration

### Task 6: Configure Supabase Database Webhook

- [x] Go to Supabase Dashboard → Database → Webhooks
- [x] Create new webhook:
  - Name: "New Voice Capture Trigger"
  - Table: `captures`
  - Events: `INSERT`
  - Type: `HTTP Request`
  - HTTP Method: `POST`
  - URL: n8n webhook URL from Task 5
  - HTTP Headers: `Content-Type: application/json`
- [x] Test: Create capture manually, verify n8n receives webhook

**CHECKPOINT 2:** Webhook triggers when new capture inserted

### Task 7: Download Voice File from HTTP Request Node

- [x] Add "HTTP Request" node in n8n
- [x] Configure to download file from webhook payload
- [x] Output file as binary data for next step

### Task 8: Whisper Transcription

- [x] Add "HTTP Request" node for OpenAI Whisper API
  - Method: POST
  - URL: `https://api.openai.com/v1/audio/transcriptions`
  - Authentication: Bearer token (OpenAI API key)
  - Body: Form-data with audio file
  - Model: `whisper-1`
- [x] Extract transcription text from response
- [x] Add error handling (retry logic)

### Task 9: Update Capture with Transcription

- [x] Add "Supabase" node to update captures table
- [x] Set fields:
  - `transcription`: Text from Whisper response
  - `processing_status`: 'synthesizing'
- [x] WHERE: `id` = capture ID from webhook payload

**CHECKPOINT 3:** Voice captures show transcription in database

### Task 10: Claude AI Synthesis

- [x] Add "HTTP Request" node for Anthropic Claude API
  - Method: POST
  - URL: `https://api.anthropic.com/v1/messages`
  - Authentication: x-api-key header (Anthropic API key)
  - Model: `claude-3-5-sonnet-20241022`
- [x] Construct prompt:

  ```
  Analyze this voice note transcription and extract:
  1. Key insights (realizations, observations)
  2. Decisions made or considered
  3. Questions raised or unanswered
  4. Important concepts or themes mentioned

  Transcription: {{transcription}}

  Return as JSON:
  {
    "insights": ["insight 1", "insight 2", ...],
    "decisions": ["decision 1", ...],
    "questions": ["question 1", ...],
    "concepts": ["concept 1", ...]
  }
  ```

- [x] Parse JSON response from Claude

**CHECKPOINT 4:** Claude returns structured insights JSON

<!-- ### Task 11: Create Neo4j Graph Nodes -->

- [ ] Add "Neo4j" node to create Capture node
  - Label: `Capture`
  - Properties: `{id: capture_id, type: 'voice', created_at: timestamp}`
- [ ] Loop through insights array:
  - Create `Insight` nodes
  - Create relationship: `(Capture)-[:EXTRACTED_FROM]->(Insight)`
- [ ] Loop through decisions array:
  - Create `Decision` nodes
  - Create relationship: `(Capture)-[:EXTRACTED_FROM]->(Decision)`
- [ ] Loop through questions array:
  - Create `Question` nodes
  - Create relationship: `(Capture)-[:EXTRACTED_FROM]->(Question)`
- [ ] Loop through concepts array:
  - Create `Concept` nodes
  - Create relationship: `(Capture)-[:EXTRACTED_FROM]->(Concept)`

**CHECKPOINT 5:** Neo4j Browser shows graph data after capture
KEY DECISION MADE SO THAT WE GET MVP WORKING --> IMPLEMENT KNOWLEDGE GRAPHS IN PHASE 2

### Task 12: Insert Insights into Supabase

- [x] Add "Supabase" node to bulk insert into `insights` table
- [x] Map each insight/decision/question/concept to:
  ```json
  {
    "capture_id": capture_id,
    "type": "insight" | "decision" | "question" | "concept",
    "content": text_content
  }
  ```
- [x] Execute batch insert

### Task 13: Mark Processing Complete

- [x] Add final "Supabase" node to update captures table
- [x] Set fields:
  - `processing_status`: 'complete'
  - `processed_at`: Current timestamp
- [x] WHERE: `id` = capture ID

**CHECKPOINT 6:** Full pipeline works end-to-end (< 60 seconds)

---

## PART 3: Web Pensieve Display (Voice Only)

### Task 14: Fetch Voice Captures

- [x] Create server component or API route: `/app/dashboard/page.tsx`
- [x] Query Supabase:
  ```typescript
  const { data: captures } = await supabase
    .from("captures")
    .select("*, insights(*)")
    .eq("type", "voice")
    .order("created_at", { ascending: false });
  ```
- [x] Pass captures to client component

### Task 15: Build VoiceCard Component

- [x] Create `components/VoiceCard.tsx`
- [x] Display:
  - Audio player (HTML5 `<audio>` with controls)
  - Timestamp (formatted: "2 hours ago", "Jan 15, 2025")
  - Processing status badge
  - Transcription text (collapsible if long)
  - Insights section (expandable)
- [x] Style with Tailwind CSS

### Task 16: Display Insights

- [x] Group insights by type (insight, decision, question, concept)
- [x] Visual hierarchy:
  - 💡 Insights
  - ✅ Decisions
  - ❓ Questions
  - 🏷️ Concepts
- [x] Show count badges (e.g., "5 insights")

**CHECKPOINT 7:** Dashboard displays voice captures beautifully

### Task 17: Add Search Functionality

- [ ] Add search input at top of dashboard
- [ ] Implement debounced search (300ms delay)
- [ ] Filter captures by transcription text (SQL LIKE query)
- [ ] Show "No results" state when search returns empty
- [ ] Add "Clear search" button when active

### Task 18: Add Date Range Filter

- [ ] Add filter buttons: Today | This Week | This Month | All Time
- [ ] Update query based on selected filter
- [ ] Highlight active filter

**CHECKPOINT 8:** Search and filters work correctly

---

## PART 4: Agent Chat Interface

### Task 19: Create Chat Route

- [ ] Create `/app/dashboard/chat/page.tsx`
- [ ] Build chat UI:
  - Message list (scrollable, auto-scroll to bottom)
  - Input textarea (auto-resize)
  - Send button
  - Loading state during streaming
- [ ] Style to feel conversational

### Task 20: Build Chat API Route

- [ ] Create `/app/api/chat/route.ts`
- [ ] Accept POST with message body
- [ ] Query Neo4j for relevant captures based on message
- [ ] Construct context from query results
- [ ] Call Claude API with streaming enabled
- [ ] Return streaming response

### Task 21: Implement Agent System Prompt

```
You are Ki's Pensieve Agent. You help users query their captured thinking (voice notes) and formulate clear prompts for external AI assistants.

You have access to:
- User's voice note transcriptions
- Extracted insights, decisions, questions, and concepts
- Knowledge graph showing relationships between ideas

When user asks about a topic:
1. Query the knowledge graph for relevant captures
2. Summarize what they've said about it
3. Reference specific captures by ID naturally
4. Identify patterns in their thinking

When user asks "Help me prompt [AI] to [do something]":
1. Query captures related to the task
2. Extract requirements, constraints, preferences
3. Formulate a comprehensive, context-rich prompt
4. Present it in a code block ready to copy

Be conversational but concise. Reference specific captures naturally (e.g., "In capture #47, you mentioned...").
```

### Task 22: Implement Neo4j Querying

- [ ] Create function to convert user message to Cypher query
- [ ] Use keyword extraction for relevant concepts
- [ ] Query graph for:
  - Captures mentioning keywords
  - Related insights/decisions/questions
  - Connected concepts
- [ ] Return results with full context

**CHECKPOINT 9:** Agent provides relevant answers from voice corpus

### Task 23: Implement "Help Me Prompt" Behavior

- [ ] Detect when user asks for prompt formulation
- [ ] Query captures related to the task
- [ ] Use Claude to synthesize requirements from captures
- [ ] Format prompt in markdown code block
- [ ] Add "Copy" button for easy copying

**CHECKPOINT 10:** Agent formulates effective prompts with context

---

## PART 5: Polish & Ship

### Task 24: End-to-End Testing

- [ ] Test full flow 10+ times:
  1. Open mobile app
  2. Record voice note (various lengths: 10s, 30s, 2min)
  3. Verify upload succeeds
  4. Wait for processing
  5. Check transcription in dashboard
  6. Verify insights appear
  7. Query agent about captured topic
  8. Ask agent to formulate prompt
  9. Test prompt with external Claude
- [ ] Document any bugs found

### Task 25: Performance Optimization

- [ ] Measure processing time (should be < 60s)
- [ ] Optimize Whisper API calls (use appropriate model)
- [ ] Optimize Neo4j queries (add indexes if needed)
- [ ] Optimize web dashboard loading (lazy load insights)

### Task 26: Bug Fixes

- [ ] Fix any issues from testing
- [ ] Handle edge cases:
  - Very short recordings (< 2 seconds)
  - Very long recordings (> 5 minutes)
  - Background noise / unclear audio
  - Network interruptions

### Task 27: Documentation

- [ ] Update CLAUDE.md with voice-only focus
- [ ] Update README with setup instructions
- [ ] Document n8n workflow configuration
- [ ] Add troubleshooting guide

**CHECKPOINT 11 (FINAL):** MVP ready for daily dogfooding

---

## Definition of Done

**The MVP is complete when:**

1. ✅ Can record voice notes on mobile (tap mic, speak, stop, upload)
2. ✅ Processing completes in < 60 seconds (record to insights visible)
3. ✅ Can view all voice captures + transcriptions on web dashboard
4. ✅ Can search across transcriptions
5. ✅ Can chat with agent and get relevant answers
6. ✅ Agent can formulate context-rich prompts
7. ✅ Can copy prompts and use successfully with Claude/ChatGPT/Cursor
8. ✅ No critical bugs in happy path
9. ✅ Documentation complete
10. ✅ Ready to use daily for 30+ consecutive days

**Success Metrics:**

- 10+ voice captures per day
- Processing speed < 60 seconds average
- Agent queries return relevant context in < 30 seconds
- Prompts created with Ki produce better AI responses 80%+ of time

---

## MOVED TO PHASE 2 (Future)

### Camera Capture

- Photo capture (live camera)
- Photo annotation workflow
- Video recording
- Mixed media Pensieve

### Upload from Storage

- Upload existing voice recordings
- File format validation
- Batch upload

### Projects

- Create projects
- Organize captures into projects
- Project-filtered views
- Agent project awareness

### Advanced Features

- Semantic search
- Auto-clustering of captures
- Theme detection
- Persistent agent chat history
- Multi-user support

---

**CURRENT FOCUS: Complete Tasks 1-4 (Simplify Mobile UI)**

Let's ship the voice-only MVP and prove the core value proposition! 🎤
