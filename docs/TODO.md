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

- [x] implement flexoki color scheme in web and mobile
- [x] add delete functionality to voice card component

### Task 17: Add Search Functionality

- [x] Add search input at top of dashboard
- [x] Implement debounced search (300ms delay)
- [x] Filter captures by transcription text and insights(SQL LIKE query)
- [x] Show "No results" state when search returns empty
- [x] Add "Clear search" button when active

<!-- ### Task 18: Add Date Range Filter -->

- [ ] Add filter buttons: Today | This Week | This Month | All Time
- [ ] Update query based on selected filter
- [ ] Highlight active filter

**CHECKPOINT 8:** Search and filters work correctly

---

<!-- ## PART 4: Agent Chat Interface

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
``` -->

<!-- ### Task 22: Implement Neo4j Querying -->

- [ ] Create function to convert user message to Cypher query
- [ ] Use keyword extraction for relevant concepts
- [ ] Query graph for:
  - Captures mentioning keywords
  - Related insights/decisions/questions
  - Connected concepts
- [ ] Return results with full context

**CHECKPOINT 9:** Agent provides relevant answers from voice corpus

<!--
### Task 23: Implement "Help Me Prompt" Behavior

- [ ] Detect when user asks for prompt formulation
- [ ] Query captures related to the task
- [ ] Use Claude to synthesize requirements from captures
- [ ] Format prompt in markdown code block
- [ ] Add "Copy" button for easy copying

**CHECKPOINT 10:** Agent formulates effective prompts with context -->

---

## UPDATED PART 4: Thought Expansion Document Creation Process

**Strategic Pivot:** Transform Ki from thought capture tool → thinking development platform where ideas evolve from initial spark to refined understanding.

**Design Decisions:**

- **Document Storage:** JSON (Tiptap's native format)
- **Thinking Partner UI:** Slide-out panel from right side
- **Agent Actions:** Suggestions presented for user acceptance
- **Document Titling:** User-determined (starts with placeholder)
- **Documents List:** Separate page `/dashboard/documents` with cross-links

---

### PHASE 1: Core Expansion Infrastructure (Hour 1-2)

#### Task 18: Database Schema for Documents

**File:** `supabase/documents-schema.sql`

- [x] Create new SQL migration file
- [x] Define `documents` table:
  ```sql
  CREATE TABLE documents (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
    capture_id UUID REFERENCES captures(id) ON DELETE SET NULL,
    title TEXT NOT NULL DEFAULT 'Untitled Document',
    content JSONB NOT NULL DEFAULT '{"type":"doc","content":[]}',
    created_at TIMESTAMPTZ DEFAULT now(),
    updated_at TIMESTAMPTZ DEFAULT now()
  );
  ```
- [x] Add RLS policies:
  - `SELECT`: Users can only read their own documents
  - `INSERT`: Users can only create documents for themselves
  - `UPDATE`: Users can only update their own documents
  - `DELETE`: Users can only delete their own documents
- [x] Create index on `user_id` for performance
- [x] Create index on `capture_id` for linking queries
- [x] Create trigger to auto-update `updated_at` on document edits
- [x] Apply migration via Supabase Dashboard SQL Editor

**CHECKPOINT 9:** Documents table exists, RLS working, test with SQL inserts

---

#### Task 19: Add "Expand Thought" Button to VoiceCard

**File:** `web/components/VoiceCard.tsx`

- [x] Add "Expand Thought" button to VoiceCard component footer
- [x] Position button in the bottom right corner (use flexoki accent color)
- [x] Add icon (suggestion: 📄 or expanding arrow icon)
- [x] Implement `handleExpandThought` async function:
  - Call API route `POST /api/documents` with:
    ```json
    {
      "capture_id": capture.id,
      "title": "Untitled Document",
      "content": {
        "type": "doc",
        "content": [
          {
            "type": "paragraph",
            "content": [{"type": "text", "text": "Original transcription..."}]
          },
          {
            "type": "heading",
            "attrs": {"level": 2},
            "content": [{"type": "text", "text": "Insights"}]
          },
          {
            "type": "bulletList",
            "content": [/* insights as list items */]
          }
        ]
      }
    }
    ```
  - On success: Navigate to `/dashboard/documents/[new-document-id]`
  - On error: Show toast/alert with error message
- [x] Style button with flexoki colors:
  ```tsx
  className =
    "px-4 py-2 bg-flexoki-accent text-flexoki-tx rounded-lg bg-opacity-85 hover:bg-opacity-100 transition-colors";
  ```

**CHECKPOINT 10:** Clicking "Expand Thought" creates document and navigates to editor

---

#### Task 20: Create Documents API Routes

**File:** `web/app/api/documents/route.ts`

- [x] Create API route for document operations
- [x] Implement `POST` handler (create document):
  - Use `createServerClient()` for auth
  - Validate user is authenticated
  - Extract `capture_id`, `title`, `content` from request body
  - Auto-populate content with transcription + insights if capture_id provided
  - Insert into `documents` table
  - Return created document with 201 status
- [x] Implement `GET` handler (list all user's documents):
  - Query documents ordered by `updated_at DESC`
  - Include basic pagination (limit 50 for MVP)
  - Return documents array with 200 status
- [x] Add error handling (400 for validation, 401 for auth, 500 for server errors)
- [x] Add TypeScript types for request/response

**File:** `web/app/api/documents/[id]/route.ts`

- [x] Create dynamic route for single document operations
- [x] Implement `GET` handler (retrieve document):
  - Verify user owns document (RLS handles this)
  - Return document with 200 status
  - Return 404 if not found
- [x] Implement `PATCH` handler (update document):
  - Accept partial updates (`title`, `content`)
  - Update `updated_at` timestamp
  - Return updated document
- [x] Implement `DELETE` handler (delete document):
  - Soft delete or hard delete (hard delete for MVP)
  - Return 204 No Content on success
- [x] Add comprehensive error handling

**CHECKPOINT 11:** API routes working (test with curl/Postman before building UI)

---

#### Task 21: Build Document Editor Page

**File:** `web/app/dashboard/documents/[id]/page.tsx`

- [x] Install Tiptap dependencies:
  ```bash
  cd web
  pnpm add @tiptap/react @tiptap/starter-kit @tiptap/extension-placeholder
  ```
- [x] Create dynamic route page component
- [x] Fetch document on page load using server component:
  ```typescript
  const supabase = createServerClient();
  const { data: document } = await supabase
    .from("documents")
    .select("*")
    .eq("id", params.id)
    .single();
  ```
- [x] Pass document to client component `DocumentEditor`
- [x] Handle 404 if document not found
- [x] Add navigation breadcrumb (Dashboard > Documents > [Document Title])

**File:** `web/components/DocumentEditor.tsx`

- [x] Create client component with Tiptap integration
- [x] Initialize Tiptap editor with extensions:
  ```typescript
  const editor = useEditor({
    extensions: [
      StarterKit,
      Placeholder.configure({ placeholder: "Start writing..." }),
    ],
    content: document.content,
    onUpdate: ({ editor }) => {
      // Debounced auto-save
      handleAutoSave(editor.getJSON());
    },
  });
  ```
- [x] Build editor toolbar (bold, italic, headings, lists, etc.)
- [x] Style with flexoki colors (see pattern below)
- [x] Implement debounced auto-save (1000ms delay):
  - Call `PATCH /api/documents/[id]` with updated content
  - Show "Saving..." indicator
  - Show "Saved" confirmation
- [x] Add title input field above editor (editable, auto-saves)
- [x] Add "Back to Documents" button
- [x] Style editor container:
  ```tsx
  <div className="max-w-4xl mx-auto p-6">
    <input
      type="text"
      value={title}
      onChange={handleTitleChange}
      className="text-3xl font-bold bg-transparent border-none text-flexoki-tx focus:outline-none w-full mb-4"
      placeholder="Untitled Document"
    />
    <EditorContent editor={editor} className="prose prose-flexoki" />
  </div>
  ```
- [x] Add custom prose styles for Tiptap in `globals.css`:
  ```css
  .prose-flexoki {
    @apply text-flexoki-tx;
  }
  .prose-flexoki h1,
  .prose-flexoki h2,
  .prose-flexoki h3 {
    @apply text-flexoki-tx font-bold;
  }
  .prose-flexoki a {
    @apply text-flexoki-accent underline;
  }
  /* ... more prose overrides */
  ```

**CHECKPOINT 12:** Document editor loads, displays content, auto-saves changes

---

#### Task 22: Build Documents List Page

**File:** `web/app/dashboard/documents/page.tsx`

- [x] Create server component to fetch all user's documents
- [x] Query Supabase:
  ```typescript
  const { data: documents } = await supabase
    .from("documents")
    .select(
      `
      *,
      captures!inner(id, transcription, created_at)
    `
    )
    .order("updated_at", { ascending: false });
  ```
- [x] Pass documents to client component
- [x] Add page header with "New Document" button (creates blank document)
- [x] Add navigation link in dashboard layout/header

**File:** `web/components/DocumentCard.tsx`

- [x] Create card component (similar pattern to VoiceCard)
- [x] Display:
  - Document title (truncate if long)
  - Preview of content (first 150 characters of plain text)
  - Last updated timestamp (relative: "2 hours ago")
  - Link to source capture (if exists): "From voice note on Jan 15"
  - Word count or character count badge
- [x] Add click handler to navigate to `/dashboard/documents/[id]`
- [x] Add delete button (with confirmation modal, same pattern as VoiceCard)
- [x] Style with flexoki colors:
  ```tsx
  <div className="bg-flexoki-ui rounded-lg shadow-md p-6 hover:bg-flexoki-ui-2 transition-colors cursor-pointer">
    <h3 className="text-xl font-semibold text-flexoki-tx mb-2">{title}</h3>
    <p className="text-flexoki-tx-2 text-sm mb-3">{preview}...</p>
    <div className="flex justify-between items-center">
      <span className="text-flexoki-tx-3 text-xs">{relativeTime}</span>
      {capture && (
        <span className="text-flexoki-accent text-xs">
          📎 Linked to capture
        </span>
      )}
    </div>
  </div>
  ```
- [x] Add empty state when no documents exist:
  ```tsx
  <div className="text-center py-12">
    <p className="text-flexoki-tx-2 mb-4">No documents yet</p>
    <p className="text-flexoki-tx-3 text-sm">
      Expand a voice note to create your first document
    </p>
  </div>
  ```

**CHECKPOINT 13:** Documents list shows all documents, clicking navigates to editor

---

### PHASE 2: Thinking Partner Agent (Hour 3)

#### Task 23: Build Thinking Partner UI Panel

**File:** `web/components/ThinkingPartner.tsx`

- [ ] Create slide-out panel component (slides in from right)
- [ ] Add toggle button in DocumentEditor (fixed position, right side):
  ```tsx
  <button
    onClick={() => setShowAgent(!showAgent)}
    className="fixed right-6 top-1/2 -translate-y-1/2 bg-flexoki-accent text-white p-3 rounded-l-lg shadow-lg hover:bg-opacity-90 transition-all z-40"
  >
    {showAgent ? "→" : "💬"}
  </button>
  ```
- [ ] Build panel structure:

  ```tsx
  <div
    className={`fixed right-0 top-0 h-full w-96 bg-flexoki-ui border-l border-flexoki-ui-3 shadow-2xl transform transition-transform duration-300 ${
      showAgent ? "translate-x-0" : "translate-x-full"
    } z-30`}
  >
    <div className="flex flex-col h-full">
      {/* Header */}
      <div className="border-b border-flexoki-ui-3 p-4">
        <h2 className="text-lg font-semibold text-flexoki-tx">
          Thinking Partner
        </h2>
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        {messages.map((msg) => (
          <MessageBubble key={msg.id} {...msg} />
        ))}
      </div>

      {/* Input */}
      <div className="border-t border-flexoki-ui-3 p-4">
        <textarea
          value={input}
          onChange={(e) => setInput(e.target.value)}
          placeholder="Ask for help, structure suggestions, or connections..."
          className="w-full px-3 py-2 bg-flexoki-ui-2 border border-flexoki-ui-3 rounded-lg text-flexoki-tx placeholder-flexoki-tx-3 focus:outline-none focus:ring-2 focus:ring-flexoki-accent resize-none"
          rows={3}
        />
        <button
          onClick={handleSendMessage}
          className="mt-2 w-full bg-flexoki-accent text-white py-2 rounded-lg hover:bg-opacity-90 transition-colors"
        >
          Send
        </button>
      </div>
    </div>
  </div>
  ```

- [ ] Implement MessageBubble component:
  - User messages: right-aligned, accent background
  - Agent messages: left-aligned, UI-2 background
  - Support markdown rendering in agent messages (use `react-markdown`)
  - Show typing indicator when agent is responding
- [ ] Install markdown dependency: `pnpm add react-markdown`

**CHECKPOINT 14:** Panel slides in/out, messages display correctly

---

#### Task 24: Build Thinking Partner API Route

**File:** `web/app/api/thinking-partner/route.ts`

- [ ] Create API route for agent chat
- [ ] Implement `POST` handler (send message):

  - Accept `{ message: string, documentId: string, documentContent: object }`
  - Use `createServerClient()` to verify auth
  - Fetch linked capture + insights if document has `capture_id`
  - Construct context prompt with:
    - Current document content (convert JSON to plain text)
    - Original transcription (if linked)
    - Extracted insights (if linked)
    - User's message
  - Call Anthropic Claude API with streaming:

    ```typescript
    import Anthropic from "@anthropic-ai/sdk";

    const anthropic = new Anthropic({
      apiKey: process.env.ANTHROPIC_API_KEY,
    });

    const stream = await anthropic.messages.stream({
      model: "claude-3-5-sonnet-20241022",
      max_tokens: 1024,
      messages: [{ role: "user", content: systemPrompt + userMessage }],
    });

    // Return streaming response
    return new Response(stream.toReadableStream(), {
      headers: { "Content-Type": "text/event-stream" },
    });
    ```

- [ ] Add environment variable: `ANTHROPIC_API_KEY` in `.env.local`
- [ ] Install Anthropic SDK: `pnpm add @anthropic-ai/sdk`

**CHECKPOINT 15:** API route receives messages and streams Claude responses

---

#### Task 25: Implement Agent System Prompt

**File:** `web/lib/prompts/thinking-partner.ts`

- [ ] Create system prompt template:

  ```typescript
  export const thinkingPartnerPrompt = (context: {
    documentContent: string;
    transcription?: string;
    insights?: Array<{ type: string; content: string }>;
  }) => `You are a Thinking Partner helping a user develop their ideas in a document editor.
  
  Context:
  ${
    context.transcription
      ? `Original voice note: "${context.transcription}"`
      : ""
  }
  
  ${
    context.insights
      ? `Extracted insights:
${context.insights.map((i) => `- ${i.type}: ${i.content}`).join("\n")}`
      : ""
  }
  
  Current document content:
  ${context.documentContent}
  
  Your role:
  1. Ask clarifying questions to help the user think deeper
  2. Suggest document structure or outlines when helpful
  3. Identify connections to their original insights
  4. Challenge assumptions constructively
  5. When suggesting text, format it in markdown code blocks for easy copying
  
  Guidelines:
  - Be conversational but concise (2-3 paragraphs max)
  - Reference specific insights naturally ("You mentioned [insight]...")
  - Don't insert content automatically - always present suggestions for review
  - Focus on helping them develop THEIR thinking, not doing the thinking for them
  
  User's request:
  `;
  ```

- [ ] Export helper function to construct full prompt

**CHECKPOINT 16:** System prompt includes document context and insights

---

#### Task 26: Connect UI to API with Streaming

**File:** `web/components/ThinkingPartner.tsx`

- [ ] Implement `handleSendMessage` function:

  ```typescript
  const handleSendMessage = async () => {
    if (!input.trim()) return;

    // Add user message to UI
    const userMessage = { id: Date.now(), role: "user", content: input };
    setMessages((prev) => [...prev, userMessage]);
    setInput("");

    // Show typing indicator
    setIsTyping(true);

    try {
      const response = await fetch("/api/thinking-partner", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          message: input,
          documentId: document.id,
          documentContent: editor.getJSON(),
        }),
      });

      const reader = response.body.getReader();
      const decoder = new TextDecoder();
      let agentMessage = { id: Date.now() + 1, role: "agent", content: "" };
      setMessages((prev) => [...prev, agentMessage]);

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;

        const chunk = decoder.decode(value);
        agentMessage.content += chunk;
        setMessages((prev) =>
          prev.map((m) =>
            m.id === agentMessage.id
              ? { ...m, content: agentMessage.content }
              : m
          )
        );
      }
    } catch (error) {
      console.error("Agent error:", error);
      // Show error message in chat
    } finally {
      setIsTyping(false);
    }
  };
  ```

- [ ] Add keyboard shortcut (Enter to send, Shift+Enter for new line)
- [ ] Add scroll-to-bottom on new messages
- [ ] Add copy button to agent messages (for suggested text)

**CHECKPOINT 17:** User can chat with agent, sees streaming responses

---

### PHASE 3: Polish & Enhancement (Hour 4)

#### Task 27: Add Cross-Linking Between Captures and Documents

**File:** `web/components/VoiceCard.tsx`

- [ ] Query for documents linked to this capture:
  ```typescript
  const { data: linkedDocs } = await supabase
    .from("documents")
    .select("id, title, updated_at")
    .eq("capture_id", capture.id);
  ```
- [ ] Display linked documents section (if any exist):
  ```tsx
  {
    linkedDocs.length > 0 && (
      <div className="mt-4 border-t border-flexoki-ui-3 pt-4">
        <h4 className="text-sm font-semibold text-flexoki-tx-2 mb-2">
          Expanded Documents ({linkedDocs.length})
        </h4>
        {linkedDocs.map((doc) => (
          <a
            key={doc.id}
            href={`/dashboard/documents/${doc.id}`}
            className="block text-sm text-flexoki-accent hover:underline mb-1"
          >
            📄 {doc.title}
          </a>
        ))}
      </div>
    );
  }
  ```

**File:** `web/components/DocumentEditor.tsx`

- [ ] Show link to source capture (if exists):
  ```tsx
  {
    document.capture_id && (
      <div className="mb-4 flex items-center gap-2 text-sm text-flexoki-tx-2">
        <span>📎 Expanded from voice note</span>
        <a
          href={`/dashboard#capture-${document.capture_id}`}
          className="text-flexoki-accent hover:underline"
        >
          View original
        </a>
      </div>
    );
  }
  ```

**CHECKPOINT 18:** Cross-links working in both directions

---

#### Task 28: Add Search Across Documents

**File:** `web/app/dashboard/documents/page.tsx`

- [ ] Add search input at top of documents list (same pattern as captures search)
- [ ] Implement debounced search (300ms delay)
- [ ] Filter documents by:
  - Title contains search term
  - Content contains search term (convert JSON to plain text for searching)
- [ ] Show "No results" state when search returns empty
- [ ] Add "Clear search" button when active
- [ ] Use same flexoki styling as captures search

**CHECKPOINT 19:** Search filters documents correctly

---

#### Task 29: Add Navigation Links to Dashboard

**File:** `web/app/dashboard/layout.tsx` (create if doesn't exist)

- [ ] Create dashboard layout with navigation:
  ```tsx
  export default function DashboardLayout({ children }) {
    return (
      <div className="min-h-screen bg-flexoki-bg">
        <nav className="bg-flexoki-ui border-b border-flexoki-ui-3">
          <div className="max-w-7xl mx-auto px-4 py-4 flex justify-between items-center">
            <div className="flex gap-6">
              <a
                href="/dashboard"
                className="text-flexoki-tx hover:text-flexoki-accent transition-colors"
              >
                Pensieve
              </a>
              <a
                href="/dashboard/documents"
                className="text-flexoki-tx hover:text-flexoki-accent transition-colors"
              >
                Documents
              </a>
            </div>
            <button
              onClick={handleSignOut}
              className="text-flexoki-tx-2 hover:text-flexoki-tx transition-colors"
            >
              Sign Out
            </button>
          </div>
        </nav>
        <main>{children}</main>
      </div>
    )
  ```
- [ ] Highlight active route
- [ ] Make responsive for mobile

**CHECKPOINT 20:** Navigation working, active states correct

---

#### Task 30: Add Agent Capabilities (Suggestions)

**File:** `web/lib/prompts/thinking-partner.ts`

- [ ] Extend system prompt with structured suggestions format:

  ```
  When providing suggestions for document content, use this format:

  **Suggestion:** [Brief description]
  ```

  [Suggested text in markdown]

  ```

  This allows the user to easily copy and insert your suggestions.
  ```

- [ ] Add capabilities to agent:
  - **Ask clarifying questions:** "What do you mean by [concept]?"
  - **Suggest structure:** "Consider organizing this as: 1. Background, 2. Key Insight, 3. Next Steps"
  - **Find connections:** "This relates to your earlier insight about [insight]"
  - **Challenge assumptions:** "You mentioned [X], but also said [Y] - how do these connect?"

**File:** `web/components/ThinkingPartner.tsx`

- [ ] Add "Insert" button next to code blocks in agent messages:
  ````tsx
  {
    msg.role === "agent" && msg.content.includes("```") && (
      <button
        onClick={() => handleInsertSuggestion(extractCodeBlock(msg.content))}
        className="mt-2 px-3 py-1 bg-flexoki-accent-2 text-flexoki-tx text-sm rounded hover:bg-opacity-90 transition-colors"
      >
        Insert into document
      </button>
    );
  }
  ````
- [ ] Implement `handleInsertSuggestion`:
  - Get current cursor position in editor
  - Insert suggested text at cursor
  - Show confirmation toast
  - Keep agent panel open

**CHECKPOINT 21:** Agent provides structured suggestions, user can insert them

---

#### Task 31: Add Auto-Save Indicators

**File:** `web/components/DocumentEditor.tsx`

- [ ] Add save status indicator:
  ```tsx
  <div className="flex items-center gap-2 text-sm text-flexoki-tx-3">
    {saveStatus === "saving" && (
      <>
        <span className="animate-pulse">●</span>
        <span>Saving...</span>
      </>
    )}
    {saveStatus === "saved" && (
      <>
        <span className="text-green-500">✓</span>
        <span>Saved</span>
      </>
    )}
    {saveStatus === "error" && (
      <>
        <span className="text-red-500">✗</span>
        <span>Error saving</span>
      </>
    )}
  </div>
  ```
- [ ] Update save status based on API responses
- [ ] Show last saved timestamp
- [ ] Add retry logic on save errors

**CHECKPOINT 22:** Save status visible and accurate

---

#### Task 32: Add Analytics and Tracking

**File:** `web/app/dashboard/documents/page.tsx`

- [ ] Add stats cards at top of documents list:
  ```tsx
  <div className="grid grid-cols-3 gap-4 mb-6">
    <StatCard label="Total Documents" value={documents.length} />
    <StatCard label="Words Written" value={totalWordCount} />
    <StatCard label="Expanded This Week" value={expandedThisWeek} />
  </div>
  ```
- [ ] Calculate metrics from documents data
- [ ] Style with flexoki colors

**CHECKPOINT 23:** Analytics visible and updating

---

### PHASE 4: Testing & Deployment

#### Task 33: End-to-End Testing

- [ ] Test full expansion flow:
  1. View voice capture with transcription + insights
  2. Click "Expand Thought"
  3. Verify document created with auto-populated content
  4. Edit document title
  5. Edit document content in Tiptap editor
  6. Verify auto-save working
  7. Open thinking partner panel
  8. Ask agent for help
  9. Verify agent has context (transcription + insights)
  10. Accept agent suggestion and insert into document
  11. Return to documents list
  12. Verify document appears with preview
  13. Search for document
  14. Return to original capture
  15. Verify link to expanded document appears
- [ ] Test edge cases:
  - Create document from capture with no insights
  - Create blank document (no linked capture)
  - Edit very long document (performance)
  - Open multiple documents in tabs (concurrent editing)
  - Delete document and verify cascade behavior
- [ ] Test responsiveness (mobile browser)
- [ ] Document any bugs found

#### Task 34: Performance Optimization

- [ ] Measure document editor load time (should be < 1s)
- [ ] Optimize Tiptap rendering for large documents
- [ ] Implement lazy loading for documents list (pagination if > 50 docs)
- [ ] Optimize auto-save debouncing (balance between data loss and API calls)
- [ ] Add loading skeletons for better perceived performance
- [ ] Minimize bundle size (check Tiptap extensions tree-shaking)

#### Task 35: Bug Fixes & Edge Cases

- [ ] Handle network errors gracefully (offline editing)
- [ ] Handle concurrent edits (last-write-wins for MVP)
- [ ] Handle very long titles (truncate in UI, allow full in DB)
- [ ] Handle empty documents (show placeholder state)
- [ ] Handle deleted captures (orphaned documents)
- [ ] Handle RLS policy failures (clear error messages)

#### Task 36: Documentation Updates

- [ ] Update `CLAUDE.md` with thought expansion architecture
- [ ] Update `README.md` with new features
- [ ] Document Tiptap extensions and customization
- [ ] Document thinking partner system prompt
- [ ] Add screenshots/GIFs of expansion flow
- [ ] Document API routes in OpenAPI format (optional)

**CHECKPOINT 24 (FINAL):** Thought expansion feature complete and production-ready

---

## Success Metrics for Thought Expansion

**Feature is successful when:**

1. ✅ Users can expand 3+ voice notes into documents daily
2. ✅ Documents average 200+ words (showing real exploration)
3. ✅ Users return to edit documents multiple times
4. ✅ Clear progression from scattered thoughts → developed ideas
5. ✅ Thinking partner used in 50%+ of documents
6. ✅ Agent suggestions accepted 60%+ of the time
7. ✅ Auto-save prevents data loss (0 reports of lost work)
8. ✅ Document editor loads in < 1 second
9. ✅ Users navigate fluidly between captures and documents

**Quantitative Goals:**

- 10+ documents created per week
- Average document length: 250+ words
- 5+ agent interactions per document
- 70%+ retention (users return to edit documents)

---

## Future Enhancements (Phase 5)

### Advanced Agent Capabilities

- [ ] Multi-turn conversation history (persistent chat per document)
- [ ] Agent can query other captures for connections
- [ ] Agent can suggest related documents to link
- [ ] Agent can analyze writing patterns and suggest improvements

### Collaborative Features

- [ ] Share documents with other users (read-only or edit)
- [ ] Commenting system on documents
- [ ] Version history with rollback
- [ ] Conflict resolution for concurrent edits

### Export & Integration

- [ ] Export document as Markdown
- [ ] Export document as PDF
- [ ] Share document via public link
- [ ] Integrate with external tools (Notion, Obsidian, etc.)

### Advanced Editing

- [ ] Templates for common document types
- [ ] Custom Tiptap extensions (callouts, diagrams, etc.)
- [ ] Rich media embedding (images, videos, audio clips)
- [ ] Code syntax highlighting
- [ ] LaTeX math support

---

Let's build the thinking development platform! 🚀

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

Let's ship the voice-only MVP and prove the core value proposition! 🎤
