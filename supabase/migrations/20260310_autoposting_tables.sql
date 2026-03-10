-- Auto-posting pipeline tables
-- monthly_item_pools: 월간 아이템풀 (workspace당 1개/월)
-- monthly_items: 개별 아이템 (15개/풀)
-- posting_slots: 발송 스케줄 (2일 1회)
-- posting_runs: 실제 발송 기록

CREATE TABLE IF NOT EXISTS public.monthly_item_pools (
  id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  workspace_id  UUID NOT NULL REFERENCES public.workspaces(id) ON DELETE CASCADE,
  year_month    TEXT NOT NULL,           -- '2026-03'
  status        TEXT NOT NULL DEFAULT 'draft'
                CHECK (status IN ('draft', 'ready', 'active', 'archived')),
  item_count    INT NOT NULL DEFAULT 0,
  created_at    TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at    TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE(workspace_id, year_month)
);

CREATE TABLE IF NOT EXISTS public.monthly_items (
  id                    UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  pool_id               UUID NOT NULL REFERENCES public.monthly_item_pools(id) ON DELETE CASCADE,
  workspace_id          UUID NOT NULL REFERENCES public.workspaces(id) ON DELETE CASCADE,
  position              INT NOT NULL,
  topic                 TEXT NOT NULL,
  target_audience       TEXT,
  angle                 TEXT,
  cta                   TEXT,
  main_keyword          TEXT,
  secondary_keywords    TEXT[],
  image_search_keyword  TEXT,
  status                TEXT NOT NULL DEFAULT 'pending'
                        CHECK (status IN ('pending', 'generating', 'ready', 'used', 'failed')),
  blog_content          TEXT,
  sns_content           TEXT,
  image_urls            TEXT[],
  generated_at          TIMESTAMPTZ,
  created_at            TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.posting_slots (
  id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  workspace_id  UUID NOT NULL REFERENCES public.workspaces(id) ON DELETE CASCADE,
  item_id       UUID NOT NULL REFERENCES public.monthly_items(id) ON DELETE CASCADE,
  scheduled_at  TIMESTAMPTZ NOT NULL,
  channel       TEXT NOT NULL DEFAULT 'email',
  status        TEXT NOT NULL DEFAULT 'scheduled'
                CHECK (status IN ('scheduled', 'sending', 'sent', 'failed', 'skipped')),
  created_at    TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.posting_runs (
  id               UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  slot_id          UUID NOT NULL REFERENCES public.posting_slots(id) ON DELETE CASCADE,
  workspace_id     UUID NOT NULL REFERENCES public.workspaces(id) ON DELETE CASCADE,
  user_id          UUID REFERENCES auth.users(id),
  channel          TEXT NOT NULL DEFAULT 'email',
  recipient_email  TEXT,
  sent_at          TIMESTAMPTZ,
  status           TEXT NOT NULL DEFAULT 'pending'
                   CHECK (status IN ('pending', 'sent', 'delivered', 'bounced', 'failed')),
  error_message    TEXT,
  metadata         JSONB NOT NULL DEFAULT '{}',
  created_at       TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Indexes
CREATE INDEX IF NOT EXISTS idx_monthly_item_pools_workspace ON public.monthly_item_pools(workspace_id);
CREATE INDEX IF NOT EXISTS idx_monthly_items_pool ON public.monthly_items(pool_id);
CREATE INDEX IF NOT EXISTS idx_monthly_items_workspace ON public.monthly_items(workspace_id);
CREATE INDEX IF NOT EXISTS idx_posting_slots_workspace_time ON public.posting_slots(workspace_id, scheduled_at);
CREATE INDEX IF NOT EXISTS idx_posting_runs_slot ON public.posting_runs(slot_id);
CREATE INDEX IF NOT EXISTS idx_posting_runs_workspace ON public.posting_runs(workspace_id, created_at DESC);

-- RLS
ALTER TABLE public.monthly_item_pools ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.monthly_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.posting_slots ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.posting_runs ENABLE ROW LEVEL SECURITY;

CREATE POLICY "ws_member_read_pools" ON public.monthly_item_pools
  FOR SELECT USING (
    workspace_id IN (
      SELECT workspace_id FROM public.workspace_members WHERE user_id = auth.uid()
    )
  );

CREATE POLICY "ws_member_read_items" ON public.monthly_items
  FOR SELECT USING (
    workspace_id IN (
      SELECT workspace_id FROM public.workspace_members WHERE user_id = auth.uid()
    )
  );

CREATE POLICY "ws_member_read_slots" ON public.posting_slots
  FOR SELECT USING (
    workspace_id IN (
      SELECT workspace_id FROM public.workspace_members WHERE user_id = auth.uid()
    )
  );

CREATE POLICY "ws_member_read_runs" ON public.posting_runs
  FOR SELECT USING (
    workspace_id IN (
      SELECT workspace_id FROM public.workspace_members WHERE user_id = auth.uid()
    )
  );
