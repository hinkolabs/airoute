-- Debug: Check the specific guide that's failing translation
-- Run this in Supabase SQL Editor

-- 1) Check the EN guide data
SELECT 
  id,
  slug,
  title,
  lang,
  status,
  guide_type,
  primary_route,
  cta_type,
  cta_route_slug,
  cta_tool_slug
FROM public.guides
WHERE slug LIKE '%commercial-images-midjourney%'
ORDER BY created_at DESC;

-- 2) Check all CHECK constraints on guides table
SELECT
  con.conname AS constraint_name,
  pg_get_constraintdef(con.oid) AS constraint_definition
FROM pg_constraint con
JOIN pg_class rel ON rel.oid = con.conrelid
JOIN pg_namespace nsp ON nsp.oid = rel.relnamespace
WHERE nsp.nspname = 'public'
  AND rel.relname = 'guides'
  AND con.contype = 'c'
ORDER BY con.conname;

-- 3) Check if there's a constraint related to route_based
SELECT
  con.conname AS constraint_name,
  pg_get_constraintdef(con.oid) AS constraint_definition
FROM pg_constraint con
JOIN pg_class rel ON rel.oid = con.conrelid
JOIN pg_namespace nsp ON nsp.oid = rel.relnamespace
WHERE nsp.nspname = 'public'
  AND rel.relname = 'guides'
  AND con.contype = 'c'
  AND (
    pg_get_constraintdef(con.oid) LIKE '%route_based%'
    OR pg_get_constraintdef(con.oid) LIKE '%route_slug%'
  );
