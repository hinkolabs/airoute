-- Create event_logs table for tracking user events
-- No PII stored (no IP, user agent, fingerprint)
-- User ID is optional (null for anonymous users)

CREATE TABLE IF NOT EXISTS public.event_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  event_type TEXT NOT NULL CHECK (event_type IN ('route_outbound_click', 'tool_click', 'route_click', 'guide_view', 'save_action')),
  target_type TEXT NOT NULL CHECK (target_type IN ('route', 'tool', 'guide')),
  target_slug TEXT NOT NULL,
  source TEXT NOT NULL,
  user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  anonymous_id UUID NOT NULL,
  metadata JSONB DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- Index for fast queries
CREATE INDEX IF NOT EXISTS idx_event_logs_created_at ON public.event_logs(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_event_logs_event_type ON public.event_logs(event_type);
CREATE INDEX IF NOT EXISTS idx_event_logs_target ON public.event_logs(target_type, target_slug);
CREATE INDEX IF NOT EXISTS idx_event_logs_user_id ON public.event_logs(user_id) WHERE user_id IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_event_logs_anonymous_id ON public.event_logs(anonymous_id);

-- RLS: Allow insert from authenticated and anonymous users via API endpoint
-- The API endpoint will validate and insert properly
ALTER TABLE public.event_logs ENABLE ROW LEVEL SECURITY;

-- Policy: Allow service role (API) to insert
CREATE POLICY "event_logs_api_insert" ON public.event_logs
  FOR INSERT
  TO anon, authenticated
  WITH CHECK (true);

-- Policy: Only authenticated users can view their own logs (for future analytics)
CREATE POLICY "event_logs_user_read" ON public.event_logs
  FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

-- Policy: Service role can read all (for admin/analytics)
-- Note: This is handled by Supabase service role automatically

COMMENT ON TABLE public.event_logs IS 'User event logs for analytics. No PII collected.';
COMMENT ON COLUMN public.event_logs.event_type IS 'Type of event: route_outbound_click, tool_click, route_click, guide_view, save_action';
COMMENT ON COLUMN public.event_logs.target_type IS 'Type of target: route, tool, guide';
COMMENT ON COLUMN public.event_logs.target_slug IS 'Slug/ID of the target entity';
COMMENT ON COLUMN public.event_logs.source IS 'Source context (placement) of the event';
COMMENT ON COLUMN public.event_logs.user_id IS 'User ID if logged in, null for anonymous';
COMMENT ON COLUMN public.event_logs.anonymous_id IS 'Anonymous tracking ID stored in localStorage';
COMMENT ON COLUMN public.event_logs.metadata IS 'Additional event metadata (partner_name, link_url, etc.)';


