-- =====================================================
-- Guides Admin System Migration
-- - Add status/published_at columns to guides
-- - Create guides_public view (approved only)
-- - Create admin_guide_publish_logs table
-- =====================================================

-- 1) Add status column (default 'draft')
ALTER TABLE public.guides
ADD COLUMN IF NOT EXISTS status text DEFAULT 'draft'
CHECK (status IN ('draft', 'review', 'approved', 'rejected'));

-- 2) Add published_at column
ALTER TABLE public.guides
ADD COLUMN IF NOT EXISTS published_at timestamptz;

-- 3) Update existing guides to 'approved' status (so they remain visible)
UPDATE public.guides
SET status = 'approved', published_at = COALESCE(created_at, now())
WHERE status IS NULL OR status = 'draft';

-- 4) Create guides_public view (only approved guides)
CREATE OR REPLACE VIEW public.guides_public AS
SELECT
  id,
  slug,
  title,
  excerpt,
  content,
  created_at,
  cta_type,
  cta_route_slug,
  cta_tool_slug,
  cta_partner,
  guide_type,
  primary_intent,
  primary_route,
  generation_version,
  published_at
FROM public.guides
WHERE status = 'approved';

-- 5) Create admin publish logs table
CREATE TABLE IF NOT EXISTS public.admin_guide_publish_logs (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  guide_id uuid REFERENCES public.guides(id) ON DELETE CASCADE,
  publish_mode text NOT NULL CHECK (publish_mode IN ('auto', 'manual')),
  published_at timestamptz DEFAULT now(),
  published_by text, -- admin key or user identifier
  note text
);

-- 6) Grant SELECT on guides_public view to anon (for public access)
GRANT SELECT ON public.guides_public TO anon;
GRANT SELECT ON public.guides_public TO authenticated;

-- 7) Create index for faster status filtering
CREATE INDEX IF NOT EXISTS idx_guides_status ON public.guides(status);
CREATE INDEX IF NOT EXISTS idx_guides_published_at ON public.guides(published_at);

-- 8) Index for publish logs (KST daily count query)
CREATE INDEX IF NOT EXISTS idx_admin_guide_publish_logs_mode_date 
ON public.admin_guide_publish_logs(publish_mode, published_at);







