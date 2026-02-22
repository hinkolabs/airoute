-- event_logs 테이블에서 autoposting 이벤트 조회
-- 테스트 후 이 쿼리로 이벤트가 실제로 기록되었는지 확인

SELECT 
  id,
  event_type,
  target_type,
  target_slug,
  source,
  user_id,
  metadata,
  created_at
FROM event_logs
WHERE 
  event_type IN ('autoposting_success', 'autoposting_fail')
  AND target_type = 'autoposting'
ORDER BY created_at DESC
LIMIT 20;

-- 카운트 확인
SELECT 
  event_type,
  COUNT(*) as count
FROM event_logs
WHERE 
  event_type IN ('autoposting_success', 'autoposting_fail')
GROUP BY event_type;
