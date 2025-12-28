-- =====================================================
-- Guides Lang + Taxonomy Migration
-- - Add lang column (en/kr) for i18n support
-- - Add taxonomy column for categorization and dedupe
-- - Update guides_public view
-- =====================================================

-- 1) Add lang column (default 'en', allowed: 'en', 'kr')
ALTER TABLE public.guides
ADD COLUMN IF NOT EXISTS lang text NOT NULL DEFAULT 'en'
CHECK (lang IN ('en', 'kr'));

-- 2) Add taxonomy column (nullable, for categorization)
ALTER TABLE public.guides
ADD COLUMN IF NOT EXISTS taxonomy text;

-- 3) Add indexes for performance
CREATE INDEX IF NOT EXISTS guides_lang_created_at_idx 
ON public.guides(lang, created_at DESC);

CREATE INDEX IF NOT EXISTS guides_taxonomy_idx 
ON public.guides(taxonomy);

-- 4) Update guides_public view to expose lang column
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
  published_at,
  lang
FROM public.guides
WHERE status = 'approved';

-- 5) Ensure view permissions
GRANT SELECT ON public.guides_public TO anon;
GRANT SELECT ON public.guides_public TO authenticated;






