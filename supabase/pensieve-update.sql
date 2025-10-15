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