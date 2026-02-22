-- Guides 테이블의 모든 제약 조건 확인
-- Supabase SQL Editor에서 실행

SELECT
  con.conname AS constraint_name,
  con.contype AS constraint_type,
  pg_get_constraintdef(con.oid) AS constraint_definition
FROM pg_constraint con
JOIN pg_class rel ON rel.oid = con.conrelid
JOIN pg_namespace nsp ON nsp.oid = rel.relnamespace
WHERE nsp.nspname = 'public'
  AND rel.relname = 'guides'
ORDER BY con.contype, con.conname;

-- constraint_type 의미:
-- 'c' = CHECK constraint
-- 'f' = FOREIGN KEY
-- 'p' = PRIMARY KEY
-- 'u' = UNIQUE
