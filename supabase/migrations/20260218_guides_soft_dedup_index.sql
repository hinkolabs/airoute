-- Soft Dedup Index: covers (lang, guide_type, primary_intent) for non-rejected guides
-- Used by the Soft Dedup Layer in guide generation endpoints
-- Query pattern: WHERE lang=$1 AND guide_type=$2 AND primary_intent=$3 AND status != 'rejected'

create index if not exists idx_guides_soft_dedup
  on guides (lang, guide_type, primary_intent)
  where status != 'rejected';
