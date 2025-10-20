  -- Add is_focused column to documents table
  ALTER TABLE documents
  ADD COLUMN is_focused BOOLEAN DEFAULT false NOT NULL;

  -- Create index for better query performance
  CREATE INDEX idx_documents_is_focused ON documents(is_focused) WHERE
  is_focused = true;

  -- Update RLS policies (they should already cover this column, but let's verify)
  -- The existing policies use "auth.uid() = user_id" which will work for this new column
