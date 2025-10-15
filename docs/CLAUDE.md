# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

**ki** is an AI-powered thought clarification system that captures scattered thinking (voice notes, photos, videos) and synthesizes them into a queryable knowledge corpus called the "Pensieve". It helps users articulate their ideas clearly to prompt external AI agents (Claude, ChatGPT, Cursor) more effectively.

### Core Architecture

The system consists of three main components:

1. **Mobile App (Expo/React Native)** - iOS-only capture interface for voice, photos, and videos
2. **Web App (Next.js 14)** - Pensieve view, agent chat, and project management
3. **Processing Pipeline (n8n + Neo4j)** - Automated transcription, AI synthesis, and knowledge graph

## Development Commands

### Starting the Development Environment

**Prerequisites:** Docker Desktop running, all containers started

```bash
# Start Docker containers (Neo4j + n8n)
docker-compose up -d

# Web development server (Next.js)
cd web
pnpm dev
# Runs on http://localhost:3000

# Mobile development server (Expo)
cd mobile
npm start
# Use Expo Go app on iOS device to connect
```

### Useful Commands

```bash
# Neo4j Browser
# Open http://localhost:7474
# Credentials: neo4j/builderki123

# n8n Workflows
# Open http://localhost:5678

# Web build and lint
cd web
pnpm build
pnpm lint

# Mobile commands
cd mobile
npm run ios    # Start with iOS simulator
npm run android # Android (not currently supported in MVP)
```

## Tech Stack

- **Web:** Next.js 14 (App Router), TypeScript, Tailwind CSS, Supabase Auth Helpers
- **Mobile:** Expo 54, React Native 0.81, TypeScript
- **Database:** Supabase (PostgreSQL + Auth + Storage)
- **Knowledge Graph:** Neo4j 5.13 with APOC plugin
- **Orchestration:** n8n (workflow automation)
- **AI Services:** OpenAI Whisper API (transcription), Anthropic Claude API (synthesis)

## Architecture & Data Flow

### Capture → Processing → Pensieve Flow

1. **Mobile Capture**: User either (a) captures live (record voice, take photo, record video) OR (b) uploads from device storage → uploads to Supabase Storage → creates record in `captures` table
2. **n8n Webhook**: Triggered on new capture → downloads file → calls Whisper API (for voice/video) → extracts transcription
3. **AI Synthesis**: n8n calls Claude API with transcription/annotation → extracts insights, decisions, questions, concepts
4. **Graph Update**: Creates nodes in Neo4j with relationships → updates `insights` table in Supabase
5. **Web Display**: Pensieve view shows captures with processing status → insights expandable on each card

### Database Schema (Supabase)

The schema in `supabase/pensieve-update.sql` is the **active schema** (replaces the older `supabase-schema.sql`):

- **projects**: Optional containers for organizing captures (many-to-many with captures)
- **captures**: Core table - stores voice/photo/video with transcription, annotation, processing_status
- **project_captures**: Junction table for many-to-many project-capture relationships
- **insights**: Denormalized from Neo4j - stores extracted insights, decisions, questions, concepts

**Key constraint:** Captures do NOT require a project_id (Pensieve-first approach). Projects are optional organizational containers added after capture.

### Neo4j Graph Structure

**Nodes:**
- Capture (id, type, created_at)
- Insight, Decision, Question, Concept (id, content, created_at)
- Project (id, name, created_at)

**Relationships:**
- (Capture)-[:EXTRACTED_FROM]->(Insight/Decision/Question/Concept)
- (Insight)-[:RELATES_TO]->(Insight)
- (Decision)-[:ANSWERS]->(Question)
- (Concept)-[:MENTIONED_IN]->(Capture)

### Agent Chat System

The agent chat (`/dashboard/chat`) queries Neo4j for relevant captures and provides context-aware responses. When users ask "Help me prompt Claude to build X", the agent:

1. Queries Neo4j for relevant captures about X
2. Summarizes user's thinking from transcriptions/annotations
3. Identifies requirements, constraints, decisions
4. Formulates a comprehensive prompt ready to copy/paste

## Code Organization

### Web (`/web`)

- `app/` - Next.js App Router pages
  - `auth/page.tsx` - Authentication UI
  - `dashboard/page.tsx` - Main Pensieve view
  - `dashboard/chat/` - Agent chat interface (when implemented)
- `lib/supabase/` - Supabase client initialization
  - `client.ts` - Client component client
  - `server.ts` - Server component client
- `middleware.ts` - Protected route authentication

### Mobile (`/mobile`)

- `App.tsx` - Root component with auth check
- `screens/`
  - `AuthScreen.tsx` - Login/signup UI
  - `CaptureScreen.tsx` - Main capture interface (voice/photo/video)
- `lib/supabase.ts` - Supabase client with AsyncStorage persistence

### Infrastructure

- `docker-compose.yml` - Neo4j (ports 7474, 7687) + n8n (port 5678)
- `supabase/` - Database schema files
- `workflows/` - Empty directory for n8n workflow exports (future)

## Important Design Decisions

### Pensieve-First Philosophy

Captures are **NOT** required to belong to a project. The Pensieve (`/dashboard`) shows ALL captures in reverse chronological order. Projects are optional organizational containers that users can add captures to via many-to-many relationships.

### Processing Status Flow

`captures.processing_status` follows this sequence:
- `pending` → capture created, waiting for processing
- `transcribing` → Whisper API processing (voice/video only)
- `synthesizing` → Claude API extracting insights
- `complete` → all processing done, insights visible
- `failed` → error occurred in pipeline

### Mobile Capture UI Pattern

The mobile capture interface provides dual options for each media type:
- **Voice**: "Record Now" (live recording with expo-av) OR "Upload Recording" (file picker for .m4a, .mp3, .wav, .aac)
- **Photo**: "Take Photo" (live camera with expo-image-picker) OR "Upload Photo" (library picker for .jpg, .jpeg, .png, .heic)
- **Video**: "Record Video" (live recording with expo-image-picker) OR "Upload Video" (file picker for .mp4, .mov, .m4v)

Each button opens a modal/picker showing both options, allowing users to capture in-the-moment or upload pre-existing media.

### Photo Annotation Requirement

Photos uploaded from mobile initially have `processing_status='pending'` but do **NOT** trigger synthesis until the user adds a text annotation via the web interface. Once annotation is saved, the n8n workflow proceeds with Claude synthesis.

### Environment Variables

**Web (.env.local):**
- `NEXT_PUBLIC_SUPABASE_URL`
- `NEXT_PUBLIC_SUPABASE_ANON_KEY`
- `NEO4J_URI`, `NEO4J_USER`, `NEO4J_PASSWORD`

**Mobile (.env):**
- `EXPO_PUBLIC_SUPABASE_URL`
- `EXPO_PUBLIC_SUPABASE_ANON_KEY`

**Docker n8n:** Needs access to OpenAI API key (Whisper), Anthropic API key (Claude), Supabase keys, Neo4j credentials (configured in n8n UI)

## Development Workflow

### Adding New Features

1. **Capture types:** Update `captures.type` enum in schema, add UI in mobile `CaptureScreen.tsx`, add n8n workflow
2. **New insights:** Modify Claude synthesis prompt in n8n workflow, update Neo4j node/relationship creation
3. **Agent capabilities:** Extend Neo4j query logic in agent chat API route (when implemented)

### Testing Locally

1. Ensure Docker containers are running: `docker ps` should show `builder-ki-neo4j` and `builder-ki-n8n`
2. Start web dev server: `cd web && pnpm dev`
3. Start mobile dev server: `cd mobile && npm start`
4. Use Expo Go on iOS device to test capture flow
5. Check Neo4j Browser (localhost:7474) to verify graph updates
6. Check n8n (localhost:5678) to debug workflow execution

### Common Issues

- **Neo4j connection errors:** Verify Docker container is running and credentials match in n8n
- **Supabase auth errors:** Check RLS policies are enabled and user is authenticated
- **File upload failures:** Verify Supabase Storage buckets exist: `voice-notes`, `photos`, `videos`
- **Processing stuck:** Check n8n workflow logs for API errors (Whisper/Claude rate limits or invalid keys)

## MVP Scope (Phase 1 Complete)

**Completed:**
- Docker setup (Neo4j + n8n)
- Supabase schema applied with RLS policies
- Authentication working on web + mobile
- Environment variables configured

**In Progress (Phase 2+):**
- Mobile capture UI implementation
- n8n processing workflows
- Pensieve web UI with capture cards
- Agent chat interface
- Project management features

Refer to `SPEC.md` for complete feature requirements and out-of-scope items.
