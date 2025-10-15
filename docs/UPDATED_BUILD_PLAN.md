# UPDATED BUILD PLAN - Voice-Only MVP

## Strategic Pivot: Live Voice Capture Only

### Why Voice-Only?

**Philosophical Alignment:**
- **Present-focused**: Start capturing NOW, not retrofitting the past
- **Intentionality**: Live capture = conscious choice to capture a thought in the moment
- **Simplicity**: Zero friction = one tap and you're capturing
- **Authenticity**: Raw, unedited thoughts captured as they happen
- **Thinking is verbal**: Most scattered thinking happens as internal dialogue
- **Fastest input**: Speak 3-4x faster than typing

**Technical Benefits:**
- One capture method to perfect
- One upload pipeline to optimize
- One processing workflow (Whisper → Claude → Neo4j)
- Eliminates file picker complexity and edge cases
- Cleaner UX: No modals, no choices, just ACTION

**User Behavior Reality:**
- Walking → voice works perfectly
- Showering → voice is easiest (can't take photos)
- Driving → voice is the ONLY safe option
- Lying in bed → voice is most convenient
- Working → quick voice note vs stopping to take photo

### Core Experience

**The Moment We're Designing For:**
> "I'm walking to the coffee shop and just realized something important about my project. I pull out my phone, tap one button, speak my thought, done. It's captured, transcribed, synthesized, and queryable forever."

---

## Build Priority (Updated)

### ✅ COMPLETED (Phase 1: Foundation)

1. ✅ Docker setup (Neo4j + n8n)
2. ✅ Supabase schema applied with RLS policies
3. ✅ Supabase Storage buckets configured (voice-notes)
4. ✅ Environment variables configured
5. ✅ Next.js project set up
6. ✅ Expo project set up
7. ✅ Authentication working end-to-end (web + mobile)
8. ✅ **Mobile live voice recording working** (Record → Upload → DB)

### 🔄 IN PROGRESS (Phase 2: Voice-Only MVP)

#### Mobile Capture (Voice Only)
9. Simplify CaptureScreen UI - remove photo/video buttons
10. Remove upload/file picker functionality
11. Implement direct tap-to-record UX (no modal)
12. Polish recording UI (visual feedback, waveform/pulse animation)
13. Test end-to-end: Capture → Upload → Verify in Supabase

**CHECKPOINT 1:** Live voice recording works flawlessly on iOS device

#### Processing Pipeline (Voice Only)
14. Create n8n workflow with webhook trigger for new voice captures
15. Configure Supabase Database Webhook to call n8n on new capture insert
16. Add n8n nodes to download voice file from Supabase Storage
17. Add n8n node to call OpenAI Whisper API for transcription
18. Update capture record with transcription and status updates
19. Add n8n node to call Claude API with transcription
20. Parse Claude response for insights, decisions, questions, concepts (JSON)
21. Create nodes in Neo4j graph with relationships
22. Insert insights into Supabase insights table
23. Mark processing_status='complete'

**CHECKPOINT 2:** Voice note → transcribed in DB (< 60 seconds)

**CHECKPOINT 3:** Neo4j graph populated with insights after capture

#### Web Pensieve Display (Voice Only)
24. Create API route/server component to fetch all voice captures
25. Build VoiceCard component with audio player
26. Display transcription text
27. Display extracted insights (expandable)
28. Display processing status badge
29. Add search bar (SQL LIKE across transcriptions)
30. Add date range filter

**CHECKPOINT 4:** Dashboard displays voice captures with transcriptions and insights

#### Agent Chat Interface
31. Create `/dashboard/chat` route
32. Build chat UI (message history, input, send button)
33. Implement streaming responses
34. Agent system prompt with Neo4j query capabilities
35. Agent can query Pensieve and reference captures
36. Agent can formulate prompts based on captured thinking

**CHECKPOINT 5:** Agent provides relevant answers from voice corpus

**CHECKPOINT 6:** Agent formulates effective prompts for external AI

#### Polish & Test
37. End-to-end testing (capture → process → query → prompt)
38. Performance optimization
39. Bug fixes
40. Update documentation

**CHECKPOINT 7 (FINAL):** Full flow works seamlessly, ready for daily dogfooding

---

## MOVED TO PHASE 2 (Post-MVP)

### Camera Capture (Photo & Video)
- ❌ Photo capture (Take Photo with live camera)
- ❌ Photo upload from library
- ❌ Photo annotation workflow
- ❌ Video recording (live camera)
- ❌ Video upload from library
- ❌ Video transcription pipeline
- ❌ Mixed media Pensieve view
- ❌ Supabase Storage buckets: photos, videos

**Rationale:** Voice is the 80% use case for scattered thinking. Photos/videos can be described verbally. Add visual capture only if users demand it after using voice-only MVP.

### Upload from Device Storage
- ❌ Voice file picker (upload existing recordings)
- ❌ DocumentPicker integration
- ❌ File format validation for uploads

**Rationale:** Live capture enforces present-focused philosophy. "Start capturing now" not "organize the past." Upload feature adds complexity without serving core use case.

### Projects (Optional Feature)
- ❌ Create projects
- ❌ Add captures to projects
- ❌ Project-filtered Pensieve view
- ❌ Agent project context awareness

**Rationale:** Pensieve-first approach means all captures visible in one feed. Projects add organizational overhead. Add only if corpus grows large (100+ captures) and users need it.

---

## Simplified Mobile UX

### Before (Multi-Modal + Upload Options):
```
Screen: Quick Capture
┌─────────────────────┐
│  🎤 Voice Note      │ → Modal → "Record Now" OR "Upload Recording"
│  📷 Photo           │ → Modal → "Take Photo" OR "Upload Photo"
│  🎥 Video           │ → Modal → "Record Video" OR "Upload Video"
└─────────────────────┘
```

### After (Voice-Only Live Capture):
```
Screen: Capture Thought
┌─────────────────────┐
│                     │
│   [Big Mic Icon]    │ ← Tap to start recording
│                     │
│  "Tap to capture    │
│   your thinking"    │
│                     │
└─────────────────────┘

When Recording:
┌─────────────────────┐
│   [Pulsing Red Dot] │
│                     │
│   "Recording..."    │
│   [Waveform Viz]    │
│                     │
│  [Stop Recording]   │ ← Tap to stop
└─────────────────────┘
```

**Zero modals. Zero decisions. Just capture.**

---

## Updated Success Criteria

**MVP is complete when:**

1. ✅ Can capture voice notes on mobile (live recording only)
2. ✅ Processing completes in < 60 seconds
3. ✅ Can view all voice captures + transcriptions on web
4. ✅ Can search Pensieve (text search across transcriptions)
5. ✅ Can chat with agent
6. ✅ Agent provides relevant answers from voice corpus
7. ✅ Agent can formulate prompts based on voice captures
8. ✅ Can copy prompts and use in external AI (Claude/ChatGPT/Cursor)
9. ✅ No critical bugs in happy path
10. ✅ Ready for daily dogfooding (30+ consecutive days of use)

**Definition of Success:**
- **Daily use**: 10+ voice captures per day for 30 days
- **Processing speed**: Voice → transcription + insights in < 60 seconds
- **Query effectiveness**: Agent finds relevant context in < 30 seconds
- **Prompt quality**: Prompts created with Ki produce better AI responses 80%+ of the time

---

## Core Heartbeat (Simplified)

```
Mobile → Tap Mic → Record Thought → Stop →
Automatic Upload (Supabase Storage) →
n8n Processing (Whisper transcription + Claude synthesis) →
Pensieve View (see transcriptions + insights) →
Agent Chat (query corpus for context) →
"Help me prompt Claude to build X" →
Agent formulates clear, context-rich prompt →
Copy prompt → Use in Claude/ChatGPT/Cursor →
Get better results →
[LOOP: Capture new thinking, refine ideas, repeat]
```

**This is the MVP. Voice-only. Live capture only. Zero friction.**

---

## Next Steps

1. ✅ Strategic decision made: Voice-only MVP
2. 🔄 Update mobile UI to remove photo/video buttons
3. 🔄 Simplify capture flow (remove modal, direct tap-to-record)
4. 🔄 Update TODO.md with revised task list
5. ⏳ Build n8n processing pipeline
6. ⏳ Build web Pensieve display (voice cards only)
7. ⏳ Build agent chat interface
8. ⏳ End-to-end testing
9. ⏳ Ship MVP and start dogfooding

**LET'S BUILD THIS. 🎤**
