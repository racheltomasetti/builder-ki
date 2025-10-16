# Claude Code Brief: Implementing Thought Expansion Feature

## Context: Strategic Pivot

We are building a thought capture and exploration app with a working voice capture MVP. We've identified a critical missing piece and are pivoting to implement thought expansion functionality as the core value proposition.

Current State (What's Working)
✅ Mobile Voice Capture

- React Native app with live voice recording
- Files upload to Supabase Storage
- Records created in captures table
  ✅ Processing Pipeline
- n8n workflow triggered by database webhooks
- Whisper transcription → Claude insight extraction
- Results stored in insights table linked to captures
  ✅ Web Dashboard
- Next.js app displaying voice captures
- VoiceCard components showing transcription + insights
- Search functionality across captures
- Basic audio playback

### The Strategic Insight

Problem Identified: Voice notes capture scattered thoughts well, but there's no pathway from "raw thought" to "developed understanding." Users end up with a pile of notes but no way to evolve ideas.

**Solution Vision**: Create seamless flow from voice note → expanded document → collaborative thinking partner.

## What We're Building: Thought Expansion System

### Core User Flow

1. User sees VoiceCard with transcription + insights
2. Clicks "Expand Thought" button
3. New document created, auto-populated with:

- Original transcription as starting point
- Extracted insights as exploration prompts
- user can add title

4. Rich text editor for developing the idea (leaning towards implementing Tiptap)
5. Thinking partner agent available on-demand for collaboration

### Key Components Needed

Database:

- documents table linked to captures
- Schema for title, content, metadata
  Frontend:
- "Expand Thought" button in VoiceCard component
- Document editor page with rich text editing (Tiptap recommended)
- Documents list view for browsing expanded thoughts
- Thinking partner chat interface (summoned when needed, like Cursor's agent terminal)
  Backend:
- API routes for document CRUD operations
- Auto-title generation using Claude
- Document-aware thinking partner agent
- Search across both voice notes and documents
  Agent Capabilities:
- Ask clarifying questions about ideas
- Suggest document structure/outlines
- Find connections to other captures
- Challenge assumptions constructively
- Insert suggestions directly into documents
  Technical Implementation Priorities
  Phase 1: Core Expansion (Hour 1-2)

1. Database schema for documents
2. VoiceCard "Expand Thought" integration
3. Document editor with auto-population
4. Basic document management
   Phase 2: Thinking Partner (Hour 3)
5. Agent chat interface in document editor
6. Document-aware agent with contextual prompts
7. Agent action capabilities (questions, structure, connections)
   Phase 3: Polish (Hour 4)
8. Documents list view and navigation
9. Cross-document search and linking
10. Auto-save, templates, analytics

### Current Tech Stack

Mobile: React Native + Expo
Web: Next.js 14 (App Router)
Database: Supabase (PostgreSQL)
Processing: n8n workflows
AI: OpenAI Whisper, Anthropic Claude
Styling: Tailwind CSS
###Success Metrics

- User expands 3+ voice notes into documents daily
- Documents average 200+ words (showing real exploration)
- Users return to edit documents multiple times
- Clear progression from scattered thoughts to developed ideas

---

Please help me create a structured implementation plan that:

- Analyzes current codebase to understand existing architecture
- Prioritizes tasks based on dependencies and user value
- Provides specific implementation steps for each component
- Identifies potential technical challenges and solutions
  \*\* Focus on building this incrementally so I can test and validate the core expansion flow quickly, then enhance with the thinking partner features.

The goal is to transform this from a thought capture tool into a thinking development platform where ideas evolve from initial spark to refined understanding.
