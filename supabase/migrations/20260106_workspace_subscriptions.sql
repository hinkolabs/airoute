-- Create workspace_subscriptions table for personal billing
CREATE TABLE IF NOT EXISTS public.workspace_subscriptions (
  workspace_id UUID PRIMARY KEY REFERENCES public.workspaces(id) ON DELETE CASCADE,
  plan_key TEXT NOT NULL CHECK (plan_key IN ('starter', 'pro')),
  billing_cycle TEXT NOT NULL CHECK (billing_cycle IN ('monthly', 'yearly')),
  status TEXT NOT NULL CHECK (status IN ('active', 'cancelled', 'past_due')) DEFAULT 'active',
  seat_count INTEGER NOT NULL DEFAULT 1,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Index for faster lookups
CREATE INDEX IF NOT EXISTS idx_workspace_subscriptions_status ON public.workspace_subscriptions(status);

-- RLS Policies
ALTER TABLE public.workspace_subscriptions ENABLE ROW LEVEL SECURITY;

-- Policy: Users can read subscriptions for workspaces they are members of
CREATE POLICY workspace_subscriptions_read_policy ON public.workspace_subscriptions
  FOR SELECT
  USING (
    workspace_id IN (
      SELECT workspace_id 
      FROM public.workspace_members 
      WHERE user_id = auth.uid()
    )
  );

-- Policy: Users can insert/update subscriptions for workspaces they are members of
CREATE POLICY workspace_subscriptions_write_policy ON public.workspace_subscriptions
  FOR ALL
  USING (
    workspace_id IN (
      SELECT workspace_id 
      FROM public.workspace_members 
      WHERE user_id = auth.uid()
    )
  );

-- Trigger to auto-update updated_at
CREATE OR REPLACE FUNCTION update_workspace_subscriptions_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER workspace_subscriptions_updated_at_trigger
  BEFORE UPDATE ON public.workspace_subscriptions
  FOR EACH ROW
  EXECUTE FUNCTION update_workspace_subscriptions_updated_at();
