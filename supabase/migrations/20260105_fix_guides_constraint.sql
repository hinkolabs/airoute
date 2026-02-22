-- =====================================================
-- Fix guides constraint issue
-- guide_type_link_check 제약 조건 제거
-- =====================================================

-- 1) 모든 guide 관련 CHECK 제약 조건 찾기 및 제거
DO $$
DECLARE
  constraint_rec RECORD;
BEGIN
  FOR constraint_rec IN 
    SELECT conname 
    FROM pg_constraint 
    WHERE conrelid = 'public.guides'::regclass 
    AND contype = 'c'
    AND conname LIKE '%guide_type%'
  LOOP
    EXECUTE format('ALTER TABLE public.guides DROP CONSTRAINT IF EXISTS %I', constraint_rec.conname);
    RAISE NOTICE 'Dropped constraint: %', constraint_rec.conname;
  END LOOP;
END $$;

-- 2) 명시적으로 알려진 제약 조건들 제거 (이중 안전장치)
ALTER TABLE public.guides DROP CONSTRAINT IF EXISTS guides_guide_type_link_check;
ALTER TABLE public.guides DROP CONSTRAINT IF EXISTS guide_type_link_check;

-- 3) 기존 데이터 정리 (필요시)
-- UPDATE public.guides
-- SET guide_type = 'general'
-- WHERE guide_type IS NULL OR guide_type = '';

-- 4) 확인 메시지
DO $$
BEGIN
  RAISE NOTICE 'Guide constraints cleanup completed';
END $$;
