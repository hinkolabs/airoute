-- RLS 상태 확인 (Supabase SQL Editor에서 실행)
-- guides, admin_guide_publish_logs 테이블의 RLS 활성화 여부 확인

SELECT 
  c.relname AS table_name, 
  c.relrowsecurity AS rls_enabled
FROM pg_class c
JOIN pg_namespace n ON n.oid = c.relnamespace
WHERE n.nspname = 'public' 
  AND c.relname IN ('guides', 'admin_guide_publish_logs');

-- 결과 해석:
-- rls_enabled = true: RLS가 켜져 있음 (service_role 키 필요)
-- rls_enabled = false: RLS가 꺼져 있음 (anon 키로도 INSERT 가능)

-- 참고: service_role 키는 RLS를 무시하고 모든 작업 가능




