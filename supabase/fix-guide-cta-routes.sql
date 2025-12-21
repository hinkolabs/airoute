-- =====================================================
-- Fix Guide CTA Routes Mismatch
-- =====================================================
-- Problem: guides.cta_route_slug contains text (not slug)
-- Solution: 
--   1. Create missing routes based on slugified cta_route_slug
--   2. Update guides.cta_route_slug to match routes.slug
-- =====================================================

-- Step 1: Create missing routes
-- Extract unique slugified route slugs from guides that don't exist in routes
INSERT INTO public.routes (slug, title, description, featured, created_at)
SELECT DISTINCT
  -- Slugify: lowercase, trim, replace spaces with hyphens, remove special chars
  lower(
    regexp_replace(
      regexp_replace(trim(g.cta_route_slug), '\s+', '-', 'g'),
      '[^a-z0-9-]', '', 'g'
    )
  ) AS route_slug,
  g.cta_route_slug AS title, -- Use original text as title
  'Auto-generated route from guide CTA' AS description,
  false AS featured,
  now() AS created_at
FROM public.guides g
WHERE 
  g.cta_type = 'route'
  AND g.cta_route_slug IS NOT NULL 
  AND trim(g.cta_route_slug) != ''
  -- Only create if slug doesn't exist in routes
  AND NOT EXISTS (
    SELECT 1 FROM public.routes r
    WHERE r.slug = lower(
      regexp_replace(
        regexp_replace(trim(g.cta_route_slug), '\s+', '-', 'g'),
        '[^a-z0-9-]', '', 'g'
      )
    )
  );

-- Step 2: Update guides.cta_route_slug to match slugified version
UPDATE public.guides
SET cta_route_slug = lower(
  regexp_replace(
    regexp_replace(trim(cta_route_slug), '\s+', '-', 'g'),
    '[^a-z0-9-]', '', 'g'
  )
)
WHERE 
  cta_type = 'route'
  AND cta_route_slug IS NOT NULL
  AND trim(cta_route_slug) != ''
  -- Only update if not already slugified (contains spaces or uppercase)
  AND (
    cta_route_slug != lower(
      regexp_replace(
        regexp_replace(trim(cta_route_slug), '\s+', '-', 'g'),
        '[^a-z0-9-]', '', 'g'
      )
    )
  );

-- =====================================================
-- Verification Query
-- =====================================================
-- Run this after the above queries to verify no mismatches remain

SELECT 
  g.id,
  g.slug AS guide_slug,
  g.title AS guide_title,
  g.cta_route_slug,
  CASE 
    WHEN r.slug IS NOT NULL THEN '✅ Route exists'
    ELSE '❌ Route missing'
  END AS status
FROM public.guides g
LEFT JOIN public.routes r ON r.slug = g.cta_route_slug
WHERE 
  g.cta_type = 'route'
  AND g.cta_route_slug IS NOT NULL
  AND trim(g.cta_route_slug) != ''
ORDER BY status, g.created_at DESC;

-- Expected result: All rows should show "✅ Route exists"

