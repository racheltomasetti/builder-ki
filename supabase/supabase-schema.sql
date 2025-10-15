-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Projects table
CREATE TABLE projects (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    name TEXT NOT NULL,
    description TEXT,
    status TEXT DEFAULT 'active' CHECK (status IN ('active', 'archived')),
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Captures table
CREATE TABLE captures (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    project_id UUID NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    type TEXT NOT NULL CHECK (type IN ('voice', 'photo')),
    file_url TEXT NOT NULL,
    transcription TEXT,
    tags TEXT[],
    processing_status TEXT DEFAULT 'pending' CHECK (processing_status IN ('pending', 'transcribing', 'synthesizing', 'complete', 'failed')),
    created_at TIMESTAMPTZ DEFAULT NOW(),
    processed_at TIMESTAMPTZ
);

-- Annotations table
CREATE TABLE annotations (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    capture_id UUID NOT NULL REFERENCES captures(id) ON DELETE CASCADE,
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    content TEXT NOT NULL,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Conversations table
CREATE TABLE conversations (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    project_id UUID NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    messages JSONB DEFAULT '[]'::jsonb,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Spec documents table
CREATE TABLE spec_documents (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    project_id UUID NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    content TEXT NOT NULL,
    version INTEGER DEFAULT 1,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Insights table (synced from Neo4j for quick display)
CREATE TABLE insights (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    project_id UUID NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
    capture_id UUID REFERENCES captures(id) ON DELETE CASCADE,
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    type TEXT NOT NULL CHECK (type IN ('insight', 'decision', 'question', 'concept')),
    content TEXT NOT NULL,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Indexes for performance
CREATE INDEX idx_projects_user_id ON projects(user_id);
CREATE INDEX idx_captures_project_id ON captures(project_id);
CREATE INDEX idx_captures_user_id ON captures(user_id);
CREATE INDEX idx_captures_created_at ON captures(created_at DESC);
CREATE INDEX idx_captures_processing_status ON captures(processing_status);
CREATE INDEX idx_annotations_capture_id ON annotations(capture_id);
CREATE INDEX idx_conversations_project_id ON conversations(project_id);
CREATE INDEX idx_spec_documents_project_id ON spec_documents(project_id);
CREATE INDEX idx_insights_project_id ON insights(project_id);
CREATE INDEX idx_insights_capture_id ON insights(capture_id);
CREATE INDEX idx_insights_user_id ON insights(user_id);

-- Row Level Security (RLS)
ALTER TABLE projects ENABLE ROW LEVEL SECURITY;
ALTER TABLE captures ENABLE ROW LEVEL SECURITY;
ALTER TABLE annotations ENABLE ROW LEVEL SECURITY;
ALTER TABLE conversations ENABLE ROW LEVEL SECURITY;
ALTER TABLE spec_documents ENABLE ROW LEVEL SECURITY;
ALTER TABLE insights ENABLE ROW LEVEL SECURITY;

-- RLS Policies (users can only access their own data)
CREATE POLICY "Users can view own projects" ON projects
    FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can create own projects" ON projects
    FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own projects" ON projects
    FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users can delete own projects" ON projects
    FOR DELETE USING (auth.uid() = user_id);

CREATE POLICY "Users can view own captures" ON captures
    FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can create own captures" ON captures
    FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own captures" ON captures
    FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users can view own annotations" ON annotations
    FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can create own annotations" ON annotations
    FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own annotations" ON annotations
    FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users can view own conversations" ON conversations
    FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can create own conversations" ON conversations
    FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own conversations" ON conversations
    FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users can view own spec_documents" ON spec_documents
    FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can create own spec_documents" ON spec_documents
    FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can view own insights" ON insights
    FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can create own insights" ON insights
    FOR INSERT WITH CHECK (auth.uid() = user_id);