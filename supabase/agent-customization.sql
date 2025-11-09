-- Agent Customization Feature
-- Adds support for customizable thinking partner prompts
-- Users can set a global default prompt and override per-document

-- 1. Create user_settings table for global defaults
CREATE TABLE IF NOT EXISTS user_settings (
  user_id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  default_agent_prompt TEXT, -- NULL means use system default
  created_at TIMESTAMPTZ DEFAULT now() NOT NULL,
  updated_at TIMESTAMPTZ DEFAULT now() NOT NULL
);

-- Create trigger to auto-update updated_at timestamp
CREATE OR REPLACE FUNCTION update_user_settings_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_update_user_settings_updated_at
  BEFORE UPDATE ON user_settings
  FOR EACH ROW
  EXECUTE FUNCTION update_user_settings_updated_at();

-- Enable Row Level Security
ALTER TABLE user_settings ENABLE ROW LEVEL SECURITY;

-- RLS Policies: Users can only access their own settings
CREATE POLICY "Users can view their own settings"
  ON user_settings
  FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own settings"
  ON user_settings
  FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own settings"
  ON user_settings
  FOR UPDATE
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);
-- DROP POLICY IF EXISTS "Users can delete their own settings" ON user_settings;
CREATE POLICY "Users can delete their own settings"
  ON user_settings
  FOR DELETE
  USING (auth.uid() = user_id);
-- Grant permissions to authenticated users
GRANT SELECT, INSERT, UPDATE, DELETE ON user_settings TO authenticated;

-- 2. Add custom_agent_prompt column to documents table
-- NULL means use user's global default (or system default if that's also NULL)
ALTER TABLE documents
ADD COLUMN IF NOT EXISTS custom_agent_prompt TEXT;

-- Add constraint for custom_agent_prompt length
ALTER TABLE documents
ADD CONSTRAINT check_custom_agent_prompt_length
  CHECK (custom_agent_prompt IS NULL OR length(custom_agent_prompt) <= 10000);

-- Add constraint for default_agent_prompt length
ALTER TABLE user_settings
ADD CONSTRAINT check_default_agent_prompt_length
  CHECK (default_agent_prompt IS NULL OR length(default_agent_prompt) <= 10000);

-- Create index for documents with custom prompts
CREATE INDEX IF NOT EXISTS idx_documents_custom_prompt
  ON documents(custom_agent_prompt)
  WHERE custom_agent_prompt IS NOT NULL;

-- Add comment for documentation
COMMENT ON COLUMN documents.custom_agent_prompt IS
  'Document-specific agent prompt override. NULL uses user default or system default.';

COMMENT ON TABLE user_settings IS
  'User-level settings including global default agent prompt customization.';

  
