-- 1) Route 관련 테이블 전수 탐색 (이름이 다를 가능성)
select table_name
from information_schema.tables
where table_schema='public'
  and (
    table_name ilike '%route%' or
    table_name ilike '%best%' or
    table_name ilike '%top%' or
    table_name ilike '%pick%' or
    table_name ilike '%collection%' or
    table_name ilike '%bundle%' or
    table_name ilike '%category%'
  )
order by table_name;

-- 2) 전체 public 테이블 목록
select table_name
from information_schema.tables
where table_schema='public'
order by table_name;

-- 3) tools.id 타입 확인 (FK 문제 방지)
select column_name, data_type
from information_schema.columns
where table_schema='public' and table_name='tools' and column_name='id';








