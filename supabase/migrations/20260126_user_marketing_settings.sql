-- Create user_marketing_settings table
-- This stores per-user marketing personalization settings
-- Used by: auto-posting, insight-letter, cs-support
-- Merged with workspace_manager_settings (global) and workspace_insight_letter_settings

CREATE TABLE IF NOT EXISTS public.user_marketing_settings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  workspace_id UUID NOT NULL REFERENCES public.workspaces(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  
  -- Personal tone settings
  tone_preset TEXT NOT NULL DEFAULT 'practical',
  tone_example TEXT NOT NULL DEFAULT '',
  personal_keywords TEXT[] NOT NULL DEFAULT '{}',
  exclude_keywords TEXT[] NOT NULL DEFAULT '{}',
  personal_notes TEXT NOT NULL DEFAULT '',
  
  -- Pro plan extension (future)
  tone_profile_json JSONB NULL,
  
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  
  -- Constraints
  CONSTRAINT unique_workspace_user UNIQUE (workspace_id, user_id)
);

-- Indexes for faster lookups
CREATE INDEX IF NOT EXISTS idx_user_marketing_settings_workspace_id
ON public.user_marketing_settings(workspace_id);

CREATE INDEX IF NOT EXISTS idx_user_marketing_settings_user_id
ON public.user_marketing_settings(user_id);

-- Enable RLS
ALTER TABLE public.user_marketing_settings ENABLE ROW LEVEL SECURITY;

-- Policy 1: SELECT - Allow if user is member of workspace
CREATE POLICY "workspace_members_can_read_user_marketing_settings"
ON public.user_marketing_settings
FOR SELECT
USING (
  EXISTS (
    SELECT 1 FROM public.workspace_members
    WHERE workspace_members.workspace_id = user_marketing_settings.workspace_id
      AND workspace_members.user_id = auth.uid()
  )
);

-- Policy 2: INSERT - Allow only if user_id matches auth.uid() and user is member
CREATE POLICY "users_can_insert_own_marketing_settings"
ON public.user_marketing_settings
FOR INSERT
WITH CHECK (
  user_id = auth.uid()
  AND EXISTS (
    SELECT 1 FROM public.workspace_members
    WHERE workspace_members.workspace_id = user_marketing_settings.workspace_id
      AND workspace_members.user_id = auth.uid()
  )
);

-- Policy 3: UPDATE - Allow only if user_id matches auth.uid() and user is member
CREATE POLICY "users_can_update_own_marketing_settings"
ON public.user_marketing_settings
FOR UPDATE
USING (
  user_id = auth.uid()
  AND EXISTS (
    SELECT 1 FROM public.workspace_members
    WHERE workspace_members.workspace_id = user_marketing_settings.workspace_id
      AND workspace_members.user_id = auth.uid()
  )
)
WITH CHECK (
  user_id = auth.uid()
  AND EXISTS (
    SELECT 1 FROM public.workspace_members
    WHERE workspace_members.workspace_id = user_marketing_settings.workspace_id
      AND workspace_members.user_id = auth.uid()
  )
);

-- Policy 4: DELETE - Allow only if user_id matches auth.uid()
CREATE POLICY "users_can_delete_own_marketing_settings"
ON public.user_marketing_settings
FOR DELETE
USING (
  user_id = auth.uid()
);

-- Trigger to auto-update updated_at
CREATE OR REPLACE FUNCTION update_user_marketing_settings_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER user_marketing_settings_updated_at_trigger
  BEFORE UPDATE ON public.user_marketing_settings
  FOR EACH ROW
  EXECUTE FUNCTION update_user_marketing_settings_updated_at();

COMMENT ON TABLE public.user_marketing_settings IS 'Per-user marketing personalization settings for auto-posting, insight-letter, and cs-support';
