-- ============================================================
-- FIX: Convert route_tools.tool_id from TEXT to UUID
-- Date: 2025-12-19
-- Purpose: Enable proper FK relationship with tools.id (uuid)
-- ============================================================

-- Disable RLS temporarily
ALTER TABLE public.route_tools DISABLE ROW LEVEL SECURITY;

-- Step 1: Convert tool_id column from TEXT to UUID
ALTER TABLE public.route_tools
ALTER COLUMN tool_id TYPE UUID USING tool_id::uuid;

-- Step 2: Add Foreign Key constraint to tools table
ALTER TABLE public.route_tools
ADD CONSTRAINT fk_route_tools_tool 
FOREIGN KEY (tool_id) 
REFERENCES public.tools(id) 
ON DELETE CASCADE;

-- Step 3: Re-enable RLS
ALTER TABLE public.route_tools ENABLE ROW LEVEL SECURITY;

-- ============================================================
-- Verification
-- ============================================================
-- Check data type
SELECT column_name, data_type
FROM information_schema.columns
WHERE table_schema='public' 
  AND table_name='route_tools' 
  AND column_name='tool_id';

-- Check FK constraint exists
SELECT
  tc.constraint_name,
  tc.table_name,
  kcu.column_name,
  ccu.table_name AS foreign_table_name,
  ccu.column_name AS foreign_column_name
FROM information_schema.table_constraints AS tc
JOIN information_schema.key_column_usage AS kcu
  ON tc.constraint_name = kcu.constraint_name
JOIN information_schema.constraint_column_usage AS ccu
  ON ccu.constraint_name = tc.constraint_name
WHERE tc.table_name='route_tools' 
  AND tc.constraint_type = 'FOREIGN KEY';

-- Test join query
SELECT
  r.slug,
  r.title,
  rt.position,
  rt.step_title,
  t.id as tool_id,
  t.name as tool_name,
  t.slug as tool_slug
FROM routes r
JOIN route_tools rt ON rt.route_id = r.id
JOIN tools t ON t.id = rt.tool_id
WHERE r.slug = 'turn-long-videos-into-shorts'
  AND rt.is_best3 = true
ORDER BY rt.position ASC
LIMIT 3;








