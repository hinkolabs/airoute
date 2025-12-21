-- ============================================================
-- DEBUG: Check Route Tools Data and Tool Existence
-- ============================================================

-- 1. Check what tools are being referenced in route_tools
SELECT 
  r.slug as route_slug,
  r.title as route_title,
  rt.position,
  rt.tool_id,
  t.id as tool_exists_id,
  t.slug as tool_slug,
  t.name as tool_name,
  t.is_active
FROM routes r
JOIN route_tools rt ON rt.route_id = r.id
LEFT JOIN tools t ON t.id = rt.tool_id
WHERE r.slug = 'turn-long-videos-into-shorts'
  AND rt.is_best3 = true
ORDER BY rt.position ASC;

-- 2. Check if specific tools exist by slug
SELECT 
  id,
  slug,
  name,
  is_active
FROM tools
WHERE slug IN ('opus-clip', 'filmora', 'chatgpt')
ORDER BY slug;

-- 3. Check all active tools with their slugs
SELECT 
  id,
  slug,
  name,
  is_active
FROM tools
WHERE is_active = true
ORDER BY slug
LIMIT 20;





