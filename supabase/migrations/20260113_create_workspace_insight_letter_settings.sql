-- Create workspace_insight_letter_settings table
CREATE TABLE IF NOT EXISTS public.workspace_insight_letter_settings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  workspace_id UUID NOT NULL UNIQUE REFERENCES public.workspaces(id) ON DELETE CASCADE,
  industry TEXT NOT NULL DEFAULT '',
  audience TEXT NOT NULL DEFAULT '',
  region TEXT NOT NULL DEFAULT '',
  offerings TEXT[] NOT NULL DEFAULT '{}',
  price_tier TEXT NOT NULL DEFAULT '',
  primary_channels TEXT[] NOT NULL DEFAULT '{}',
  role TEXT NOT NULL DEFAULT '',
  quarterly_goal TEXT NOT NULL DEFAULT '',
  weekly_kpi TEXT NOT NULL DEFAULT '',
  forbidden_claims TEXT[] NOT NULL DEFAULT '{}',
  seed_keywords TEXT[] NOT NULL DEFAULT '{}',
  competitor_urls TEXT[] NOT NULL DEFAULT '{}',
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Index for faster lookups
CREATE INDEX IF NOT EXISTS idx_workspace_insight_letter_settings_workspace ON public.workspace_insight_letter_settings(workspace_id);

-- RLS Policies
ALTER TABLE public.workspace_insight_letter_settings ENABLE ROW LEVEL SECURITY;

-- Policy: Member read - users can read settings for workspaces they are members of
CREATE POLICY workspace_insight_letter_settings_read_policy ON public.workspace_insight_letter_settings
  FOR SELECT
  USING (
    workspace_id IN (
      SELECT workspace_id 
      FROM public.workspace_members 
      WHERE user_id = auth.uid()
    )
  );

-- Policy: Admin write - users can insert/update settings for workspaces they are admin/owner of
CREATE POLICY workspace_insight_letter_settings_write_policy ON public.workspace_insight_letter_settings
  FOR ALL
  USING (
    workspace_id IN (
      SELECT workspace_id 
      FROM public.workspace_members 
      WHERE user_id = auth.uid()
        AND role IN ('owner', 'admin')
    )
  );

-- Trigger to auto-update updated_at
CREATE OR REPLACE FUNCTION update_workspace_insight_letter_settings_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER workspace_insight_letter_settings_updated_at_trigger
  BEFORE UPDATE ON public.workspace_insight_letter_settings
  FOR EACH ROW
  EXECUTE FUNCTION update_workspace_insight_letter_settings_updated_at();
