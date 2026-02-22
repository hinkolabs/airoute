-- ============================================================
-- Migration: 20260121_coupons_system.sql
-- Description: Coupon system (credits & subscription coupons)
-- ============================================================

-- 1) Coupons master table
CREATE TABLE IF NOT EXISTS public.coupons (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  code TEXT NOT NULL UNIQUE,
  kind TEXT NOT NULL CHECK (kind IN ('credits', 'subscription')),
  credits_amount INTEGER NULL,                      -- kind=credits
  plan_key TEXT NULL,                               -- kind=subscription
  months INTEGER NULL,                              -- kind=subscription (ex: 1)
  max_redemptions INTEGER NOT NULL DEFAULT 1,
  redeemed_count INTEGER NOT NULL DEFAULT 0,
  expires_at TIMESTAMPTZ NULL,
  is_active BOOLEAN NOT NULL DEFAULT TRUE,
  created_by UUID NULL,                             -- auth user id (system_admin)
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 2) Coupon redemptions log (privacy-critical table)
CREATE TABLE IF NOT EXISTS public.coupon_redemptions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  coupon_id UUID NOT NULL REFERENCES public.coupons(id) ON DELETE CASCADE,
  code TEXT NOT NULL,
  workspace_id UUID NOT NULL REFERENCES public.workspaces(id) ON DELETE CASCADE,
  redeemed_by UUID NOT NULL,                         -- auth user id
  redeemed_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  metadata JSONB NOT NULL DEFAULT '{}'::JSONB
);

-- Indexes for performance
CREATE INDEX IF NOT EXISTS coupon_redemptions_workspace_id_idx ON public.coupon_redemptions(workspace_id);
CREATE INDEX IF NOT EXISTS coupon_redemptions_redeemed_by_idx ON public.coupon_redemptions(redeemed_by);
CREATE INDEX IF NOT EXISTS coupon_redemptions_coupon_id_idx ON public.coupon_redemptions(coupon_id);
CREATE INDEX IF NOT EXISTS coupons_code_idx ON public.coupons(code);

-- RLS policies
ALTER TABLE public.coupons ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.coupon_redemptions ENABLE ROW LEVEL SECURITY;

-- Coupons: Only system_admins can read/write
CREATE POLICY coupons_system_admin_all ON public.coupons
  FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM public.system_admins
      WHERE system_admins.user_id = auth.uid()
    )
  );

-- Coupon redemptions: Users can only see their own redemptions
CREATE POLICY coupon_redemptions_read_own ON public.coupon_redemptions
  FOR SELECT
  USING (redeemed_by = auth.uid());

-- Coupon redemptions: System admins can see all
CREATE POLICY coupon_redemptions_system_admin_read ON public.coupon_redemptions
  FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.system_admins
      WHERE system_admins.user_id = auth.uid()
    )
  );
