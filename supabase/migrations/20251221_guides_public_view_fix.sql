-- =====================================================
-- Fix guides_public view to include all needed columns
-- - Add status column (for filtering)
-- - Add taxonomy column (for categorization)
-- =====================================================

-- Update guides_public view to include status and taxonomy
CREATE OR REPLACE VIEW public.guides_public AS
SELECT
  id,
  slug,
  title,
  excerpt,
  content,
  created_at,
  status,
  lang,
  taxonomy,
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

-- Ensure view permissions
GRANT SELECT ON public.guides_public TO anon;
GRANT SELECT ON public.guides_public TO authenticated;

