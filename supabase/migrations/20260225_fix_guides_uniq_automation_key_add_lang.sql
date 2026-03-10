-- =====================================================
-- Fix guides_uniq_automation_key: lang 컬럼 추가
-- 문제: lang 없이 제약이 걸려 있어 EN + KR 가이드를
--       동일 route/intent로 생성할 때 중복 오류 발생
-- 해결: lang 포함하여 재생성 → EN/KR 각각 고유 키
-- =====================================================

-- 1) 기존 제약/인덱스 제거
ALTER TABLE public.guides DROP CONSTRAINT IF EXISTS guides_uniq_automation_key;
DROP INDEX IF EXISTS guides_uniq_automation_key;

-- 2) lang 포함한 새 유니크 인덱스 생성
--    같은 route/intent라도 lang(en/kr)이 다르면 공존 가능
CREATE UNIQUE INDEX guides_uniq_automation_key
ON public.guides (
  lang,
  guide_type,
  COALESCE(primary_intent,    ''),
  COALESCE(primary_route,     ''),
  COALESCE(cta_type,          ''),
  COALESCE(cta_route_slug,    ''),
  COALESCE(cta_tool_slug,     '')
);

-- 3) 확인
DO $$
BEGIN
  RAISE NOTICE 'guides_uniq_automation_key recreated with lang column';
END $$;
