-- =====================================================
-- STEP 1: 현재 guides 테이블의 모든 제약 조건 확인
-- =====================================================
-- Supabase SQL Editor에 복사해서 실행하세요

SELECT 
  conname AS constraint_name,
  pg_get_constraintdef(oid) AS definition
FROM pg_constraint
WHERE conrelid = 'public.guides'::regclass
  AND contype = 'c'
ORDER BY conname;

-- 위 쿼리를 먼저 실행해서 결과를 확인한 후,
-- 아래 STEP 2를 실행하세요
