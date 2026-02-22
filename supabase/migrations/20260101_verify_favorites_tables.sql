-- ============================================================
-- VERIFY FAVORITES TABLES (2026-01-01)
-- ============================================================
-- Purpose: Verify favorites_routes and favorites_tools exist and are configured correctly
-- Run this in Supabase SQL editor to check table status
-- ============================================================

-- 1. Check if tables exist
SELECT 
  tablename,
  schemaname,
  hasindexes,
  rowsecurity
FROM pg_tables
WHERE schemaname = 'public'
  AND tablename IN ('favorites_routes', 'favorites_tools')
ORDER BY tablename;

-- 2. Check table columns
SELECT 
  table_name,
  column_name,
  data_type,
  is_nullable,
  column_default
FROM information_schema.columns
WHERE table_schema = 'public'
  AND table_name IN ('favorites_routes', 'favorites_tools')
ORDER BY table_name, ordinal_position;

-- 3. Check RLS policies
SELECT 
  schemaname,
  tablename,
  policyname,
  permissive,
  roles,
  cmd,
  qual,
  with_check
FROM pg_policies
WHERE schemaname = 'public'
  AND tablename IN ('favorites_routes', 'favorites_tools')
ORDER BY tablename, policyname;

-- 4. Check constraints
SELECT 
  tc.table_name,
  tc.constraint_name,
  tc.constraint_type,
  pg_get_constraintdef(pgc.oid) as constraint_definition
FROM information_schema.table_constraints tc
JOIN pg_constraint pgc ON pgc.conname = tc.constraint_name
WHERE tc.table_schema = 'public'
  AND tc.table_name IN ('favorites_routes', 'favorites_tools')
ORDER BY tc.table_name, tc.constraint_type, tc.constraint_name;

-- 5. Check indexes
SELECT 
  schemaname,
  tablename,
  indexname,
  indexdef
FROM pg_indexes
WHERE schemaname = 'public'
  AND tablename IN ('favorites_routes', 'favorites_tools')
ORDER BY tablename, indexname;

-- 6. Count rows
SELECT 'favorites_routes' as table_name, count(*) as row_count FROM public.favorites_routes
UNION ALL
SELECT 'favorites_tools' as table_name, count(*) as row_count FROM public.favorites_tools;

-- ============================================================
-- SANITY CHECK QUERIES (run as authenticated user)
-- ============================================================
-- Run these after logging in to test RLS policies:

-- SELECT count(*) FROM public.favorites_routes;
-- SELECT count(*) FROM public.favorites_tools;
-- SELECT * FROM public.favorites_routes WHERE user_id = auth.uid() LIMIT 5;
-- SELECT * FROM public.favorites_tools WHERE user_id = auth.uid() LIMIT 5;

-- Test guest access (if guest_id supported):
-- SELECT * FROM public.favorites_routes WHERE guest_id = 'test-guest-123' LIMIT 5;
-- SELECT * FROM public.favorites_tools WHERE guest_id = 'test-guest-123' LIMIT 5;
