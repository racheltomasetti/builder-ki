-- Fix RLS policy for captures table to allow INSERT operations
-- Drop the existing policy
DROP POLICY IF EXISTS "Users can manage own captures" ON captures;

-- Create separate policies for different operations
CREATE POLICY "Users can view own captures" ON captures
    FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own captures" ON captures
    FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own captures" ON captures
    FOR UPDATE USING (auth.uid() = user_id)
    WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete own captures" ON captures
    FOR DELETE USING (auth.uid() = user_id);
