-- Create plans table as SSOT for Stripe price IDs
-- This table stores the mapping between plan_key and Stripe price IDs

CREATE TABLE IF NOT EXISTS public.plans (
  plan_key TEXT PRIMARY KEY CHECK (plan_key IN ('starter', 'pro')),
  name_kr TEXT NOT NULL,
  name_en TEXT NOT NULL,
  stripe_price_id_monthly TEXT NOT NULL,
  stripe_price_id_yearly TEXT NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Enable RLS (public read-only)
ALTER TABLE public.plans ENABLE ROW LEVEL SECURITY;

-- Policy: Anyone can read plans (needed for checkout)
CREATE POLICY plans_read_policy ON public.plans
  FOR SELECT
  USING (true);

-- Trigger to auto-update updated_at
CREATE OR REPLACE FUNCTION update_plans_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER plans_updated_at_trigger
  BEFORE UPDATE ON public.plans
  FOR EACH ROW
  EXECUTE FUNCTION update_plans_updated_at();

-- Seed initial data
-- NOTE: Replace these with your actual Stripe price IDs from Stripe Dashboard
INSERT INTO public.plans (plan_key, name_kr, name_en, stripe_price_id_monthly, stripe_price_id_yearly)
VALUES
  ('starter', '스타터', 'Starter', 'price_starter_monthly_REPLACE', 'price_starter_yearly_REPLACE'),
  ('pro', '프로', 'Pro', 'price_pro_monthly_REPLACE', 'price_pro_yearly_REPLACE')
ON CONFLICT (plan_key) DO NOTHING;

-- Comment for future updates:
COMMENT ON TABLE public.plans IS 'SSOT for personal plan pricing and Stripe price IDs. Update stripe_price_id columns when prices change in Stripe.';
