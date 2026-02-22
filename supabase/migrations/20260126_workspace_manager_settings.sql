-- Create workspace_manager_settings table
-- This stores manager settings for marketing features (auto-posting, insights, cs-support)
-- One row per workspace, upserted by managers/owners

CREATE TABLE IF NOT EXISTS public.workspace_manager_settings (
  workspace_id UUID PRIMARY KEY REFERENCES public.workspaces(id) ON DELETE CASCADE,
  brand_name TEXT,
  logo_url TEXT,
  company_profile TEXT,
  attachments JSONB DEFAULT '[]'::jsonb,
  updated_by UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- RLS policies
ALTER TABLE public.workspace_manager_settings ENABLE ROW LEVEL SECURITY;

-- Policy: Allow workspace members to read their workspace's settings
CREATE POLICY "workspace_members_can_read_manager_settings"
ON public.workspace_manager_settings
FOR SELECT
USING (
  EXISTS (
    SELECT 1 FROM public.workspace_members
    WHERE workspace_members.workspace_id = workspace_manager_settings.workspace_id
      AND workspace_members.user_id = auth.uid()
  )
);

-- Policy: Allow owners/admins to insert/update manager settings
CREATE POLICY "workspace_owners_can_upsert_manager_settings"
ON public.workspace_manager_settings
FOR ALL
USING (
  EXISTS (
    SELECT 1 FROM public.workspace_members wm
    JOIN public.workspaces ws ON wm.workspace_id = ws.id
    WHERE wm.workspace_id = workspace_manager_settings.workspace_id
      AND wm.user_id = auth.uid()
      AND (
        wm.role IN ('owner', 'admin')
        OR ws.type = 'personal'
      )
  )
)
WITH CHECK (
  EXISTS (
    SELECT 1 FROM public.workspace_members wm
    JOIN public.workspaces ws ON wm.workspace_id = ws.id
    WHERE wm.workspace_id = workspace_manager_settings.workspace_id
      AND wm.user_id = auth.uid()
      AND (
        wm.role IN ('owner', 'admin')
        OR ws.type = 'personal'
      )
  )
);

-- Index for faster lookups
CREATE INDEX IF NOT EXISTS idx_workspace_manager_settings_workspace_id
ON public.workspace_manager_settings(workspace_id);

COMMENT ON TABLE public.workspace_manager_settings IS 'Manager settings for marketing features (shared across auto-posting, insights, cs-support)';
