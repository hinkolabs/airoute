-- ============================================================
-- Add guest_id support to favorites tables
-- Date: 2025-12-19
-- Purpose: Allow anonymous guests to save favorites to DB
-- ============================================================

-- Step 1: Add guest_id columns
ALTER TABLE public.favorites_tools
  ADD COLUMN IF NOT EXISTS guest_id TEXT;

ALTER TABLE public.favorites_routes
  ADD COLUMN IF NOT EXISTS guest_id TEXT;

-- Step 2: Make user_id nullable (either user_id OR guest_id must exist)
ALTER TABLE public.favorites_tools
  ALTER COLUMN user_id DROP NOT NULL;

ALTER TABLE public.favorites_routes
  ALTER COLUMN user_id DROP NOT NULL;

-- Step 3: Add CHECK constraints (must have either user_id OR guest_id, not both)
ALTER TABLE public.favorites_tools
  ADD CONSTRAINT check_favorites_tools_identity 
  CHECK (
    (user_id IS NOT NULL AND guest_id IS NULL) OR 
    (user_id IS NULL AND guest_id IS NOT NULL)
  );

ALTER TABLE public.favorites_routes
  ADD CONSTRAINT check_favorites_routes_identity 
  CHECK (
    (user_id IS NOT NULL AND guest_id IS NULL) OR 
    (user_id IS NULL AND guest_id IS NOT NULL)
  );

-- Step 4: Drop old unique constraints and create new composite ones
ALTER TABLE public.favorites_tools
  DROP CONSTRAINT IF EXISTS favorites_tools_user_id_tool_slug_key;

ALTER TABLE public.favorites_tools
  ADD CONSTRAINT favorites_tools_unique_user_tool
  UNIQUE NULLS NOT DISTINCT (user_id, tool_slug);

ALTER TABLE public.favorites_tools
  ADD CONSTRAINT favorites_tools_unique_guest_tool
  UNIQUE NULLS NOT DISTINCT (guest_id, tool_slug);

ALTER TABLE public.favorites_routes
  DROP CONSTRAINT IF EXISTS favorites_routes_user_id_route_slug_key;

ALTER TABLE public.favorites_routes
  ADD CONSTRAINT favorites_routes_unique_user_route
  UNIQUE NULLS NOT DISTINCT (user_id, route_slug);

ALTER TABLE public.favorites_routes
  ADD CONSTRAINT favorites_routes_unique_guest_route
  UNIQUE NULLS NOT DISTINCT (guest_id, route_slug);

-- Step 5: Create indexes for guest_id
CREATE INDEX IF NOT EXISTS idx_favorites_tools_guest_id 
  ON public.favorites_tools(guest_id) 
  WHERE guest_id IS NOT NULL;

CREATE INDEX IF NOT EXISTS idx_favorites_routes_guest_id 
  ON public.favorites_routes(guest_id) 
  WHERE guest_id IS NOT NULL;

-- Step 6: Update RLS policies to allow guest access
-- Drop old policies
DROP POLICY IF EXISTS "Users can view their own favorite tools" ON public.favorites_tools;
DROP POLICY IF EXISTS "Users can insert their own favorite tools" ON public.favorites_tools;
DROP POLICY IF EXISTS "Users can delete their own favorite tools" ON public.favorites_tools;
DROP POLICY IF EXISTS "Users can view their own favorite routes" ON public.favorites_routes;
DROP POLICY IF EXISTS "Users can insert their own favorite routes" ON public.favorites_routes;
DROP POLICY IF EXISTS "Users can delete their own favorite routes" ON public.favorites_routes;

-- New policies for favorites_tools
CREATE POLICY "Users and guests can view their own favorite tools"
  ON public.favorites_tools
  FOR SELECT
  USING (
    auth.uid() = user_id OR
    guest_id IS NOT NULL
  );

CREATE POLICY "Users and guests can insert their own favorite tools"
  ON public.favorites_tools
  FOR INSERT
  WITH CHECK (
    (auth.uid() = user_id AND guest_id IS NULL) OR
    (user_id IS NULL AND guest_id IS NOT NULL)
  );

CREATE POLICY "Users and guests can delete their own favorite tools"
  ON public.favorites_tools
  FOR DELETE
  USING (
    auth.uid() = user_id OR
    guest_id IS NOT NULL
  );

-- New policies for favorites_routes
CREATE POLICY "Users and guests can view their own favorite routes"
  ON public.favorites_routes
  FOR SELECT
  USING (
    auth.uid() = user_id OR
    guest_id IS NOT NULL
  );

CREATE POLICY "Users and guests can insert their own favorite routes"
  ON public.favorites_routes
  FOR INSERT
  WITH CHECK (
    (auth.uid() = user_id AND guest_id IS NULL) OR
    (user_id IS NULL AND guest_id IS NOT NULL)
  );

CREATE POLICY "Users and guests can delete their own favorite routes"
  ON public.favorites_routes
  FOR DELETE
  USING (
    auth.uid() = user_id OR
    guest_id IS NOT NULL
  );

-- ============================================================
-- Verification queries
-- ============================================================
-- Check schema
SELECT column_name, data_type, is_nullable
FROM information_schema.columns
WHERE table_name IN ('favorites_tools', 'favorites_routes')
  AND column_name IN ('user_id', 'guest_id')
ORDER BY table_name, column_name;

-- Check constraints
SELECT conname, pg_get_constraintdef(oid)
FROM pg_constraint
WHERE conrelid IN ('public.favorites_tools'::regclass, 'public.favorites_routes'::regclass)
  AND contype IN ('c', 'u')
ORDER BY conrelid::text, conname;








