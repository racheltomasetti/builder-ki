# Projects Feature - Implementation Plan

## Overview

This document outlines the implementation plan for adding a **Projects** feature to the Builder KI web platform. Projects will allow users to organize and group their documents and voice notes (captures) into cohesive collections.

---

## Design Decisions

### Document-Project Relationship
- **Architecture**: Many-to-many via junction table `project_documents`
- **Rationale**: Allows documents to belong to multiple projects for maximum flexibility
- **Implementation**: New junction table with foreign keys to both `projects` and `documents`

### Project Detail View
- **Scope**: Dashboard view showing documents + captures + extensible for future features
- **Content**:
  - All documents in the project
  - Related voice notes (captures) that belong to the project
  - Space for future features (insights, conversations, etc.)

### Adding Documents to Projects
- **Primary UX Flow**: Shift+Click multi-select → Enter → Create project
  1. User holds Shift key
  2. Clicks multiple document cards (they become selected/highlighted)
  3. Presses Enter key
  4. Modal appears prompting for project name
  5. User enters name (+ optional description)
  6. Project is created with selected documents

- **Secondary Flow**: Add documents to existing projects from project detail page

### Navigation
- **Tab Order**: `thoughts` → `docs` → `projects`
- **Rationale**: Mirrors the natural progression from raw thoughts → refined documents → organized projects
- **Keyboard Navigation**: Linear arrow key cycling (Left/Right through all three tabs)

### Unassigned Documents
- **Behavior**: Docs tab shows ALL documents regardless of project membership
- **Projects tab**: Shows organized subsets of documents within projects
- **No forced categorization**: Documents can exist without being in any project

---

## Current Database State

### Existing Projects Table Schema
```sql
CREATE TABLE public.projects (
  id UUID NOT NULL DEFAULT extensions.uuid_generate_v4(),
  user_id UUID NOT NULL,
  name TEXT NOT NULL,
  description TEXT NULL,
  created_at TIMESTAMP WITH TIME ZONE NULL DEFAULT NOW(),
  CONSTRAINT projects_pkey PRIMARY KEY (id),
  CONSTRAINT projects_user_id_fkey FOREIGN KEY (user_id)
    REFERENCES auth.users(id) ON DELETE CASCADE
);

CREATE INDEX idx_projects_user_id ON public.projects USING btree (user_id);
```

**Note**: The projects table already exists in Supabase. May want to add `updated_at` and `status` columns in future iterations.

---

## Implementation Phases

### Phase 1: Database Foundation

**Goal**: Set up the database schema for project-document relationships

**Tasks**:
1. Create `project_documents` junction table migration
   - Columns: `id`, `project_id`, `document_id`, `user_id`, `added_at`
   - Foreign keys to both `projects` and `documents` with CASCADE deletes
   - Composite unique constraint on `(project_id, document_id)`
   - RLS policies for user isolation

2. Create indexes for query performance
   - `idx_project_documents_project_id`
   - `idx_project_documents_document_id`
   - `idx_project_documents_user_id`

3. (Optional) Add `updated_at` and `status` columns to existing `projects` table
   - `updated_at TIMESTAMPTZ DEFAULT NOW()`
   - `status TEXT DEFAULT 'active' CHECK (status IN ('active', 'archived'))`
   - Create trigger for auto-updating `updated_at`

**Files to create**:
- `supabase/project-documents-schema.sql`

**Schema**:
```sql
-- Junction table for many-to-many relationship
CREATE TABLE project_documents (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  project_id UUID NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
  document_id UUID NOT NULL REFERENCES documents(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  added_at TIMESTAMPTZ DEFAULT NOW(),

  -- Prevent duplicate entries
  UNIQUE(project_id, document_id)
);

-- Indexes for performance
CREATE INDEX idx_project_documents_project_id ON project_documents(project_id);
CREATE INDEX idx_project_documents_document_id ON project_documents(document_id);
CREATE INDEX idx_project_documents_user_id ON project_documents(user_id);

-- Row Level Security
ALTER TABLE project_documents ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own project_documents"
  ON project_documents FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can add documents to own projects"
  ON project_documents FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can remove documents from own projects"
  ON project_documents FOR DELETE
  USING (auth.uid() = user_id);
```

---

### Phase 2: API Routes

**Goal**: Create backend endpoints for project operations

**Tasks**:

#### 1. Create `/api/projects/route.ts`
**Methods**:
- `GET`: Fetch all user's projects with document/capture counts
- `POST`: Create new project with optional initial documents

**GET Response Format**:
```typescript
{
  projects: [
    {
      id: "uuid",
      name: "My Research Project",
      description: "...",
      created_at: "2024-01-15T10:30:00Z",
      document_count: 5,
      capture_count: 3
    }
  ]
}
```

**POST Request Format**:
```typescript
{
  name: "My New Project",
  description: "Optional description",
  documentIds: ["uuid1", "uuid2", "uuid3"]  // optional
}
```

#### 2. Create `/api/projects/[id]/route.ts`
**Methods**:
- `GET`: Fetch single project with all documents + captures
- `PATCH`: Update project (name, description, status)
- `DELETE`: Delete project (removes junction entries, keeps documents intact)

**GET Response Format**:
```typescript
{
  project: {
    id: "uuid",
    name: "My Research Project",
    description: "...",
    created_at: "...",
    documents: [
      {
        id: "uuid",
        title: "Document Title",
        content: {...},
        created_at: "...",
        updated_at: "..."
      }
    ],
    captures: [
      {
        id: "uuid",
        transcription: "Voice note text...",
        created_at: "...",
        // ... other capture fields
      }
    ]
  }
}
```

#### 3. Create `/api/projects/[id]/documents/route.ts`
**Methods**:
- `POST`: Add documents to project (accepts array of document IDs)
- `DELETE`: Remove specific documents from project

**POST Request Format**:
```typescript
{
  documentIds: ["uuid1", "uuid2"]
}
```

**DELETE Request Format**:
```typescript
{
  documentIds: ["uuid1", "uuid2"]
}
```

**Files to create**:
- `web/app/api/projects/route.ts`
- `web/app/api/projects/[id]/route.ts`
- `web/app/api/projects/[id]/documents/route.ts`

**Implementation Pattern** (reference existing `/api/documents/route.ts`):
```typescript
// Example: GET /api/projects
import { createRouteHandlerClient } from "@supabase/auth-helpers-nextjs";
import { cookies } from "next/headers";
import { NextResponse } from "next/server";

export async function GET() {
  const supabase = createRouteHandlerClient({ cookies });

  const { data: { user }, error: userError } = await supabase.auth.getUser();
  if (userError || !user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  // Fetch projects with document counts
  const { data: projects, error } = await supabase
    .from("projects")
    .select(`
      *,
      project_documents(count),
      captures(count)
    `)
    .eq("user_id", user.id)
    .order("created_at", { ascending: false });

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ projects });
}
```

---

### Phase 3: Projects List Page

**Goal**: Create the main projects tab with grid of project cards

**Tasks**:

#### 1. Create `/app/dashboard/projects/page.tsx`
- Server component that fetches all projects
- Passes data to client component
- Similar structure to `/app/dashboard/documents/page.tsx`

**Implementation**:
```typescript
import { createServerComponentClient } from "@supabase/auth-helpers-nextjs";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import ProjectsList from "@/components/ProjectsList";

export default async function ProjectsPage() {
  const supabase = createServerComponentClient({ cookies });

  const { data: { session } } = await supabase.auth.getSession();
  if (!session) {
    redirect("/auth");
  }

  // Fetch projects with counts
  const { data: projects, error } = await supabase
    .from("projects")
    .select(`
      *,
      project_documents(count),
      captures(count)
    `)
    .order("created_at", { ascending: false });

  return (
    <div className="min-h-screen bg-flexoki-base p-8">
      <ProjectsList initialProjects={projects || []} />
    </div>
  );
}
```

#### 2. Create `/components/ProjectsList.tsx`
- Client component with local state management
- Grid layout (3 columns on large screens, 2 on medium, 1 on mobile)
- "New Project" button in header
- Handles project creation and deletion

**UI Structure**:
```
┌────────────────────────────────────────────┐
│ Projects                    [New Project]  │
│                                            │
│ ┌──────┐ ┌──────┐ ┌──────┐                │
│ │Proj 1│ │Proj 2│ │Proj 3│                │
│ └──────┘ └──────┘ └──────┘                │
│ ┌──────┐ ┌──────┐                         │
│ │Proj 4│ │Proj 5│                         │
│ └──────┘ └──────┘                         │
└────────────────────────────────────────────┘
```

#### 3. Create `/components/ProjectCard.tsx`
- Displays project metadata
- Shows document count and capture count
- Shows relative time (e.g., "2 hours ago")
- Hover effects (scale up, border highlight)
- Click to navigate to project detail
- Delete button with confirmation modal

**Card Layout**:
```
┌─────────────────────────────────────┐
│ My Research Project          [×]    │
│                                     │
│ Building a knowledge management...  │
│                                     │
│ 5 docs • 3 captures • 2 hours ago  │
└─────────────────────────────────────┘
```

**Styling** (follow DocumentCard patterns):
- Background: `bg-flexoki-ui-2`
- Border: `border border-flexoki-ui-3`
- Hover: `hover:scale-[1.02] hover:border-flexoki-accent`
- Text: `text-flexoki-tx` (title), `text-flexoki-tx-2` (description), `text-flexoki-tx-3` (metadata)

**Files to create**:
- `web/app/dashboard/projects/page.tsx`
- `web/components/ProjectsList.tsx`
- `web/components/ProjectCard.tsx`

---

### Phase 4: Project Detail/Dashboard Page

**Goal**: Show all content within a specific project

**Tasks**:

#### 1. Create `/app/dashboard/projects/[id]/page.tsx`
- Server component fetches project data with documents and captures
- Handles 404 if project doesn't exist
- Verifies user ownership

**Implementation**:
```typescript
import { createServerComponentClient } from "@supabase/auth-helpers-nextjs";
import { cookies } from "next/headers";
import { redirect, notFound } from "next/navigation";
import ProjectDashboard from "@/components/ProjectDashboard";

export default async function ProjectDetailPage({
  params
}: {
  params: { id: string }
}) {
  const supabase = createServerComponentClient({ cookies });

  const { data: { session } } = await supabase.auth.getSession();
  if (!session) {
    redirect("/auth");
  }

  // Fetch project with all related data
  const { data: project, error } = await supabase
    .from("projects")
    .select(`
      *,
      project_documents(
        documents(*)
      ),
      captures(*)
    `)
    .eq("id", params.id)
    .single();

  if (error || !project) {
    notFound();
  }

  return <ProjectDashboard project={project} />;
}
```

#### 2. Create `/components/ProjectDashboard.tsx`
- Header with project name and description
- Inline editing for name/description
- "Add Documents" button
- Section for documents (reuse DocumentCard component)
- Section for captures/voice notes (reuse VoiceCard component)
- Back button to projects list
- Delete project button

**Dashboard Layout**:
```
┌────────────────────────────────────────────┐
│ ← Back to Projects                         │
│                                            │
│ My Research Project            [Add Docs]  │
│ Building a knowledge management system     │
│                                            │
│ Documents (5)                              │
│ ┌────┐ ┌────┐ ┌────┐                      │
│ │Doc1│ │Doc2│ │Doc3│ ...                  │
│ └────┘ └────┘ └────┘                      │
│                                            │
│ Voice Notes (3)                            │
│ ┌─────┐ ┌─────┐                           │
│ │Note1│ │Note2│ ...                       │
│ └─────┘ └─────┘                           │
│                                            │
│ [Delete Project]                           │
└────────────────────────────────────────────┘
```

#### 3. Create `/components/AddDocumentsModal.tsx`
- Modal overlay with document selection
- Shows all user's documents not already in the project
- Checkbox selection for multiple documents
- Search/filter capability
- Submit adds selected documents to project via API

**Modal Layout**:
```
┌────────────────────────────────────────────┐
│ Add Documents to Project              [×]  │
│                                            │
│ Search: [_____________]                    │
│                                            │
│ ☐ Document Title 1                         │
│   150 words • 2 hours ago                  │
│                                            │
│ ☐ Document Title 2                         │
│   320 words • 1 day ago                    │
│                                            │
│              [Cancel] [Add Selected (2)]   │
└────────────────────────────────────────────┘
```

**Files to create**:
- `web/app/dashboard/projects/[id]/page.tsx`
- `web/components/ProjectDashboard.tsx`
- `web/components/AddDocumentsModal.tsx`

---

### Phase 5: Multi-Select on Documents Page

**Goal**: Implement Shift+Click selection and project creation flow

**Tasks**:

#### 1. Modify `/components/DocumentsList.tsx`
- Add state for selected documents: `useState<string[]>([])`
- Add state for shift key: `useState<boolean>(false)`
- Add keyboard listeners for:
  - Shift key down/up (set shift state)
  - Enter key (open create project modal if documents selected)
- Add visual feedback showing count of selected documents
- Add "Create Project" button (alternative to Enter key)
- Add "Clear Selection" functionality

**State Management**:
```typescript
const [selectedDocuments, setSelectedDocuments] = useState<string[]>([]);
const [isShiftPressed, setIsShiftPressed] = useState(false);
const [showCreateModal, setShowCreateModal] = useState(false);

// Keyboard listeners
useEffect(() => {
  const handleKeyDown = (e: KeyboardEvent) => {
    if (e.key === "Shift") setIsShiftPressed(true);
    if (e.key === "Enter" && selectedDocuments.length > 0) {
      setShowCreateModal(true);
    }
    if (e.key === "Escape") {
      setSelectedDocuments([]);
    }
  };

  const handleKeyUp = (e: KeyboardEvent) => {
    if (e.key === "Shift") setIsShiftPressed(false);
  };

  window.addEventListener("keydown", handleKeyDown);
  window.addEventListener("keyup", handleKeyUp);

  return () => {
    window.removeEventListener("keydown", handleKeyDown);
    window.removeEventListener("keyup", handleKeyUp);
  };
}, [selectedDocuments]);
```

**UI Feedback**:
```typescript
{selectedDocuments.length > 0 && (
  <div className="fixed bottom-8 right-8 bg-flexoki-ui-2 border border-flexoki-accent rounded-lg p-4">
    <p className="text-flexoki-tx mb-2">
      {selectedDocuments.length} document{selectedDocuments.length > 1 ? 's' : ''} selected
    </p>
    <div className="flex gap-2">
      <button
        onClick={() => setSelectedDocuments([])}
        className="text-flexoki-tx-2 hover:text-flexoki-tx"
      >
        Clear
      </button>
      <button
        onClick={() => setShowCreateModal(true)}
        className="bg-flexoki-accent text-flexoki-base px-4 py-2 rounded"
      >
        Create Project (Enter)
      </button>
    </div>
  </div>
)}
```

#### 2. Modify `/components/DocumentCard.tsx`
- Add `selected` prop and `onSelect` callback
- Add visual state for selection (border, background, checkmark)
- Handle click behavior:
  - Shift held + click = toggle selection
  - Normal click = navigate to document (unchanged)

**Props Addition**:
```typescript
interface DocumentCardProps {
  document: Document;
  onDelete: (id: string) => void;
  selected?: boolean;
  onSelect?: (id: string) => void;
}
```

**Click Handler**:
```typescript
const handleCardClick = (e: React.MouseEvent) => {
  if (e.shiftKey && onSelect) {
    e.preventDefault();
    onSelect(document.id);
  } else {
    // Navigate to document (existing behavior)
    window.location.href = `/dashboard/documents/${document.id}`;
  }
};
```

**Visual Feedback**:
```typescript
<div
  onClick={handleCardClick}
  className={`
    relative cursor-pointer rounded-lg p-6
    transition-all duration-200
    ${selected
      ? 'bg-flexoki-ui-2 border-2 border-flexoki-accent scale-[1.02]'
      : 'bg-flexoki-ui-2 border border-flexoki-ui-3 hover:scale-[1.02] hover:border-flexoki-accent'
    }
  `}
>
  {selected && (
    <div className="absolute top-2 right-2 bg-flexoki-accent text-flexoki-base rounded-full w-6 h-6 flex items-center justify-center">
      ✓
    </div>
  )}
  {/* Rest of card content */}
</div>
```

#### 3. Create `/components/CreateProjectModal.tsx`
- Modal overlay (blocks interaction with rest of page)
- Form with name input (required) and description textarea (optional)
- Shows count of documents being added
- Handles form submission:
  - Creates project via API
  - Adds documents to project
  - Redirects to new project detail page
- Loading state during creation
- Error handling

**Modal Implementation**:
```typescript
interface CreateProjectModalProps {
  isOpen: boolean;
  onClose: () => void;
  documentIds: string[];
  onSuccess?: (projectId: string) => void;
}

export default function CreateProjectModal({
  isOpen,
  onClose,
  documentIds,
  onSuccess
}: CreateProjectModalProps) {
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError("");

    try {
      const response = await fetch("/api/projects", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name,
          description,
          documentIds
        })
      });

      if (!response.ok) throw new Error("Failed to create project");

      const { project } = await response.json();

      if (onSuccess) {
        onSuccess(project.id);
      } else {
        window.location.href = `/dashboard/projects/${project.id}`;
      }
    } catch (err) {
      setError("Failed to create project. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
      <div className="bg-flexoki-ui-2 border border-flexoki-ui-3 rounded-lg p-6 w-full max-w-md">
        <h2 className="text-xl font-semibold text-flexoki-tx mb-4">
          Create New Project
        </h2>

        <p className="text-flexoki-tx-2 text-sm mb-4">
          Adding {documentIds.length} document{documentIds.length > 1 ? 's' : ''}
        </p>

        <form onSubmit={handleSubmit}>
          <div className="mb-4">
            <label className="block text-flexoki-tx text-sm mb-2">
              Project Name *
            </label>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="w-full bg-flexoki-base border border-flexoki-ui-3 rounded px-3 py-2 text-flexoki-tx"
              placeholder="My Research Project"
              required
              autoFocus
            />
          </div>

          <div className="mb-4">
            <label className="block text-flexoki-tx text-sm mb-2">
              Description (optional)
            </label>
            <textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              className="w-full bg-flexoki-base border border-flexoki-ui-3 rounded px-3 py-2 text-flexoki-tx h-24"
              placeholder="Brief description of this project..."
            />
          </div>

          {error && (
            <p className="text-red-500 text-sm mb-4">{error}</p>
          )}

          <div className="flex gap-3 justify-end">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-flexoki-tx-2 hover:text-flexoki-tx"
              disabled={loading}
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-4 py-2 bg-flexoki-accent text-flexoki-base rounded hover:opacity-90 disabled:opacity-50"
              disabled={loading || !name.trim()}
            >
              {loading ? "Creating..." : "Create Project"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
```

**Files to modify**:
- `web/components/DocumentsList.tsx`
- `web/components/DocumentCard.tsx`

**Files to create**:
- `web/components/CreateProjectModal.tsx`

**Interaction Flow**:
1. User holds Shift key
2. Clicks Document A → Document A gets selected (blue border + checkmark)
3. Still holding Shift, clicks Document B → Both A and B selected
4. Clicks Document A again while holding Shift → A deselected
5. Presses Enter OR clicks "Create Project" button
6. CreateProjectModal appears
7. User types "My New Project" and optional description
8. Submits form
9. Loading state shown
10. On success, redirected to `/dashboard/projects/{new-project-id}`

---

### Phase 6: Navigation Integration

**Goal**: Add Projects tab to top navigation with keyboard support

**Tasks**:

#### 1. Modify `/components/TopNavigation.tsx`
- Add third navigation link for "projects"
- Update `isActive()` logic to handle `/dashboard/projects` route
- Update arrow key navigation for three tabs:
  - Left arrow: cycles backwards (projects → docs → thoughts → projects)
  - Right arrow: cycles forward (thoughts → docs → projects → thoughts)
- Maintain existing keyboard shortcuts (D/L for theme)

**Navigation Links**:
```typescript
<div className="flex items-center gap-6">
  <a
    href="/dashboard"
    className={`text-sm font-medium transition-colors ${
      isActive("/dashboard") && !pathname.includes("/documents") && !pathname.includes("/projects")
        ? "text-flexoki-accent"
        : "text-flexoki-tx hover:text-flexoki-accent"
    }`}
  >
    thoughts
  </a>
  <a
    href="/dashboard/documents"
    className={`text-sm font-medium transition-colors ${
      isActive("/dashboard/documents")
        ? "text-flexoki-accent"
        : "text-flexoki-tx hover:text-flexoki-accent"
    }`}
  >
    docs
  </a>
  <a
    href="/dashboard/projects"
    className={`text-sm font-medium transition-colors ${
      isActive("/dashboard/projects")
        ? "text-flexoki-accent"
        : "text-flexoki-tx hover:text-flexoki-accent"
    }`}
  >
    projects
  </a>
</div>
```

**Arrow Key Navigation Logic**:
```typescript
useEffect(() => {
  const handleKeyPress = (e: KeyboardEvent) => {
    const pathname = window.location.pathname;

    // Left arrow - cycle backwards
    if (e.key === "ArrowLeft") {
      e.preventDefault();
      if (pathname.includes("/projects")) {
        router.push("/dashboard/documents");
      } else if (pathname.includes("/documents")) {
        router.push("/dashboard");
      } else {
        router.push("/dashboard/projects");
      }
    }

    // Right arrow - cycle forward
    if (e.key === "ArrowRight") {
      e.preventDefault();
      if (pathname.includes("/projects")) {
        router.push("/dashboard");
      } else if (pathname.includes("/documents")) {
        router.push("/dashboard/projects");
      } else {
        router.push("/dashboard/documents");
      }
    }

    // D key - Dark theme
    if (e.key === "d" || e.key === "D") {
      if (theme !== "dark") toggleTheme();
    }

    // L key - Light theme
    if (e.key === "l" || e.key === "L") {
      if (theme !== "light") toggleTheme();
    }
  };

  window.addEventListener("keydown", handleKeyPress);
  return () => window.removeEventListener("keydown", handleKeyPress);
}, [router, theme, toggleTheme]);
```

**Files to modify**:
- `web/components/TopNavigation.tsx`

**Navigation Flow**:
```
thoughts (/) ←→ docs (/documents) ←→ projects (/projects)
     ↑                                          ↓
     └──────────────────────────────────────────┘
```

---

### Phase 7: Polish & Edge Cases

**Goal**: Handle edge cases, improve UX, and add finishing touches

**Tasks**:

#### 1. Empty States
- **No projects yet**:
  ```
  ┌────────────────────────────────────────┐
  │                                        │
  │          📁 No Projects Yet            │
  │                                        │
  │   Create your first project to start   │
  │   organizing your documents            │
  │                                        │
  │          [Create Project]              │
  │                                        │
  └────────────────────────────────────────┘
  ```

- **Project with no documents**:
  ```
  ┌────────────────────────────────────────┐
  │ My Empty Project                       │
  │                                        │
  │ Documents (0)                          │
  │                                        │
  │   📄 No documents yet                  │
  │   [Add Documents]                      │
  │                                        │
  └────────────────────────────────────────┘
  ```

- **No documents available to add**:
  ```
  All your documents are already in this project!
  Create new documents to add more.
  ```

#### 2. Loading States
- Skeleton loaders for project cards while fetching
- Loading spinner during project creation
- Optimistic UI updates (show immediately, revert on error)
- Loading state in AddDocumentsModal while fetching available docs

**Skeleton Loader**:
```typescript
<div className="animate-pulse bg-flexoki-ui-2 border border-flexoki-ui-3 rounded-lg p-6">
  <div className="h-6 bg-flexoki-ui-3 rounded w-3/4 mb-4"></div>
  <div className="h-4 bg-flexoki-ui-3 rounded w-full mb-2"></div>
  <div className="h-4 bg-flexoki-ui-3 rounded w-5/6"></div>
</div>
```

#### 3. Error Handling
- Toast/notification system for errors
  - "Failed to create project"
  - "Failed to add documents"
  - "Failed to load project"
- Network error recovery (retry mechanism)
- 404 page for non-existent projects
- Validation errors (e.g., empty project name)

#### 4. Optimistic Updates
- When creating project: show in list immediately
- When deleting project: remove from list immediately
- When adding documents: update count immediately
- Revert changes if API call fails

**Pattern**:
```typescript
const handleDelete = async (projectId: string) => {
  // Optimistic update
  const previousProjects = projects;
  setProjects(prev => prev.filter(p => p.id !== projectId));

  try {
    const response = await fetch(`/api/projects/${projectId}`, {
      method: "DELETE"
    });

    if (!response.ok) throw new Error("Delete failed");
  } catch (error) {
    // Revert on error
    setProjects(previousProjects);
    showErrorToast("Failed to delete project");
  }
};
```

#### 5. Additional Features
- **Search/Filter on projects page**
  - Search by project name
  - Debounced input (300ms)
  - Similar to captures search on thoughts page

- **Project status management** (if status column added)
  - "Archive Project" button in project dashboard
  - Toggle to show/hide archived projects on list page
  - Visual indicator for archived projects

- **Inline editing**
  - Click project name to edit (in project dashboard)
  - Click description to edit
  - Auto-save on blur

- **Remove documents from project**
  - "Remove from Project" button on document cards in project view
  - Confirmation modal
  - Only removes from project, doesn't delete document

#### 6. Accessibility
- Proper ARIA labels for buttons and links
- Keyboard navigation for modals (Tab, Escape to close)
- Focus management (auto-focus on modal inputs)
- Screen reader announcements for selection count

#### 7. Responsive Design
- Mobile: Single column grid for projects
- Tablet: Two column grid
- Desktop: Three column grid
- Touch-friendly tap targets (minimum 44x44px)
- Mobile-friendly modals (full screen on small devices)

**Files to modify**:
- All component files (add error boundaries, loading states, empty states)
- Create utility components:
  - `web/components/EmptyState.tsx`
  - `web/components/SkeletonLoader.tsx`
  - `web/components/Toast.tsx` (or use existing notification system)

---

## TypeScript Types

Create `web/types/project.ts`:

```typescript
export type Project = {
  id: string;
  user_id: string;
  name: string;
  description: string | null;
  created_at: string;
};

export type ProjectWithCounts = Project & {
  document_count: number;
  capture_count: number;
};

export type ProjectWithContent = Project & {
  documents: Document[];
  captures: Capture[];
};

export type ProjectDocument = {
  id: string;
  project_id: string;
  document_id: string;
  user_id: string;
  added_at: string;
};
```

---

## File Structure Summary

### New Files
```
web/
├── app/
│   ├── api/
│   │   └── projects/
│   │       ├── route.ts                    # GET all, POST create
│   │       └── [id]/
│   │           ├── route.ts                # GET one, PATCH, DELETE
│   │           └── documents/
│   │               └── route.ts            # POST add, DELETE remove
│   └── dashboard/
│       └── projects/
│           ├── page.tsx                    # Projects list page
│           └── [id]/
│               └── page.tsx                # Project detail/dashboard
│
├── components/
│   ├── ProjectsList.tsx                    # Grid of projects
│   ├── ProjectCard.tsx                     # Individual project card
│   ├── ProjectDashboard.tsx                # Project detail view
│   ├── CreateProjectModal.tsx              # Create from selected docs
│   ├── AddDocumentsModal.tsx               # Add docs to existing project
│   ├── EmptyState.tsx                      # Reusable empty state
│   ├── SkeletonLoader.tsx                  # Reusable loading skeleton
│   └── Toast.tsx                           # Error/success notifications
│
├── types/
│   └── project.ts                          # TypeScript types
│
supabase/
└── project-documents-schema.sql            # Junction table migration
```

### Modified Files
```
web/
├── components/
│   ├── TopNavigation.tsx                   # Add projects tab
│   ├── DocumentsList.tsx                   # Add multi-select
│   └── DocumentCard.tsx                    # Add selection state
```

---

## Success Criteria

When implementation is complete, users should be able to:

✅ Navigate to Projects tab via UI click or arrow keys
✅ See all their projects in a responsive grid layout
✅ Create new projects by shift-selecting documents + pressing Enter
✅ Create empty projects from the projects page
✅ Click into a project to see its dashboard
✅ View all documents and voice notes within a project
✅ Add more documents to existing projects
✅ Remove documents from projects (without deleting them)
✅ Delete entire projects (keeps documents intact)
✅ Have documents appear in multiple projects simultaneously
✅ See metadata (document count, capture count, creation date)
✅ Experience smooth keyboard-first navigation throughout
✅ Edit project name and description inline
✅ See appropriate empty states when no content exists
✅ Get clear error messages when operations fail

---

## Implementation Order (Recommended)

1. **Phase 1 - Database** → Foundation must be solid
2. **Phase 2 - API Routes** → Test with Postman/curl before UI
3. **Phase 3 - Projects List** → See projects working end-to-end
4. **Phase 6 - Navigation** → Make it accessible early for testing
5. **Phase 4 - Project Detail** → Full dashboard experience
6. **Phase 5 - Multi-Select** → The signature UX feature
7. **Phase 7 - Polish** → Edge cases and refinement

---

## Testing Checklist

### Database
- [ ] Junction table created with proper constraints
- [ ] Foreign keys cascade correctly
- [ ] RLS policies prevent cross-user access
- [ ] Indexes exist for performance

### API Routes
- [ ] Can create project without documents
- [ ] Can create project with initial documents
- [ ] Can fetch all projects with counts
- [ ] Can fetch single project with full data
- [ ] Can update project name/description
- [ ] Can delete project (keeps documents)
- [ ] Can add documents to project
- [ ] Can remove documents from project
- [ ] All routes verify user authentication
- [ ] Error responses are meaningful

### UI Components
- [ ] Projects list displays correctly
- [ ] Project cards show accurate counts
- [ ] Can navigate to project detail
- [ ] Project dashboard shows all content
- [ ] Can select multiple documents with Shift+Click
- [ ] Enter key opens create modal
- [ ] Create modal validates input
- [ ] Navigation tabs work with clicks
- [ ] Arrow keys navigate between tabs
- [ ] Empty states display appropriately
- [ ] Loading states show during async operations
- [ ] Error messages appear on failures

### Keyboard Navigation
- [ ] Left arrow cycles: projects → docs → thoughts
- [ ] Right arrow cycles: thoughts → docs → projects
- [ ] Shift key enables multi-select mode
- [ ] Enter key creates project from selection
- [ ] Escape key clears selection
- [ ] Tab key navigates modal inputs
- [ ] Escape key closes modals

### Edge Cases
- [ ] Creating project with 0 documents
- [ ] Creating project with 1 document
- [ ] Creating project with 10+ documents
- [ ] Document in multiple projects displays correctly
- [ ] Deleting last document from project
- [ ] Deleting project with many documents
- [ ] Network errors handled gracefully
- [ ] Very long project names/descriptions
- [ ] Special characters in project names
- [ ] User with 0 projects
- [ ] User with 100+ projects

### Mobile/Responsive
- [ ] Projects grid responsive (1/2/3 columns)
- [ ] Modals usable on mobile
- [ ] Touch targets adequate size
- [ ] Shift-select alternative for touch devices
- [ ] Navigation works on mobile

---

## Future Enhancements (Post-MVP)

- **Drag-and-drop** documents to reorder within project
- **Project templates** for common use cases
- **Project sharing** with other users (collaboration)
- **Project export** (ZIP download of all documents)
- **Project insights** dashboard with analytics
- **Nested projects** or project hierarchies
- **Tags/labels** for projects
- **Color coding** for projects
- **Kanban view** for project documents
- **Timeline view** of project activity
- **Project goals** and milestones
- **Integration with conversations** and insights features

---

## Notes

- The projects table already exists in Supabase (confirmed)
- Current schema is minimal (no `updated_at` or `status` columns)
- Can add those columns later without breaking changes
- Many-to-many relationship provides maximum flexibility
- Shift-select UX is consistent with OS file managers
- Keyboard-first design aligns with existing app philosophy
- All components follow existing Flexoki color scheme
- Pattern established by Documents feature is our template

---

**Last Updated**: 2025-10-18
**Status**: Planning Complete - Ready for Implementation
