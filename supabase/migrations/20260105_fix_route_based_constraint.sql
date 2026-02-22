-- =====================================================
-- Fix guides route_based constraint issue
-- Remove or update CHECK constraints that block translation
-- =====================================================

-- 1) Find and drop any CHECK constraints related to route_based
DO $$
DECLARE
  constraint_rec RECORD;
BEGIN
  FOR constraint_rec IN 
    SELECT 
      con.conname,
      pg_get_constraintdef(con.oid) AS definition
    FROM pg_constraint con
    JOIN pg_class rel ON rel.oid = con.conrelid
    JOIN pg_namespace nsp ON nsp.oid = rel.relnamespace
    WHERE nsp.nspname = 'public'
      AND rel.relname = 'guides'
      AND con.contype = 'c'
      AND (
        pg_get_constraintdef(con.oid) LIKE '%route_based%'
        OR pg_get_constraintdef(con.oid) LIKE '%route_slug%'
      )
  LOOP
    RAISE NOTICE 'Dropping constraint: % - Definition: %', constraint_rec.conname, constraint_rec.definition;
    EXECUTE format('ALTER TABLE public.guides DROP CONSTRAINT IF EXISTS %I', constraint_rec.conname);
  END LOOP;
  
  IF NOT FOUND THEN
    RAISE NOTICE 'No route_based related constraints found';
  END IF;
END $$;

-- 2) Explicitly try to drop common constraint names (safety net)
ALTER TABLE public.guides DROP CONSTRAINT IF EXISTS guides_route_based_check;
ALTER TABLE public.guides DROP CONSTRAINT IF EXISTS guides_guide_type_route_check;
ALTER TABLE public.guides DROP CONSTRAINT IF EXISTS guide_type_route_based_check;

-- 3) Verify remaining CHECK constraints
DO $$
DECLARE
  constraint_rec RECORD;
  constraint_count INTEGER := 0;
BEGIN
  RAISE NOTICE '=== Remaining CHECK constraints on guides table ===';
  FOR constraint_rec IN 
    SELECT 
      con.conname,
      pg_get_constraintdef(con.oid) AS definition
    FROM pg_constraint con
    JOIN pg_class rel ON rel.oid = con.conrelid
    JOIN pg_namespace nsp ON nsp.oid = rel.relnamespace
    WHERE nsp.nspname = 'public'
      AND rel.relname = 'guides'
      AND con.contype = 'c'
    ORDER BY con.conname
  LOOP
    RAISE NOTICE 'Constraint: % - %', constraint_rec.conname, constraint_rec.definition;
    constraint_count := constraint_count + 1;
  END LOOP;
  
  RAISE NOTICE 'Total CHECK constraints: %', constraint_count;
END $$;

-- 4) Verification message
DO $$
BEGIN
  RAISE NOTICE '=== Guide constraint cleanup completed ===';
  RAISE NOTICE 'You should now be able to insert guides without route_based constraint errors';
END $$;
