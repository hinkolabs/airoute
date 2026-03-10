-- =====================================================
-- guides_public view: published 상태 포함
-- 기존: status = 'approved' 만 표시
-- 변경: status IN ('approved', 'published') 모두 표시
--
-- 배경:
-- - 관리자 수동 승인: status = 'approved'
-- - 크론 자동 발행: status = 'published'
-- - AI Creator 즉시 발행: status = 'published'
-- =====================================================

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
  route_slug,
  generation_version,
  published_at,
  quality_score,
  auto_publish_eligible
FROM public.guides
WHERE status IN ('approved', 'published');

GRANT SELECT ON public.guides_public TO anon;
GRANT SELECT ON public.guides_public TO authenticated;

DO $$
BEGIN
  RAISE NOTICE 'guides_public view updated: now includes both approved and published status';
END $$;
