-- =====================================================
-- STEP 2: guides_guide_type_link_check 제약 조건 강제 제거
-- =====================================================
-- Supabase SQL Editor에 복사해서 실행하세요

-- 제약 조건 강제 제거 (오류 무시)
ALTER TABLE public.guides DROP CONSTRAINT IF EXISTS guides_guide_type_link_check CASCADE;

-- 확인 메시지
SELECT 'Constraint removed successfully!' AS status;

-- 제거 확인 (이 쿼리 결과가 비어있어야 함)
SELECT conname 
FROM pg_constraint 
WHERE conrelid = 'public.guides'::regclass 
  AND contype = 'c' 
  AND conname = 'guides_guide_type_link_check';
