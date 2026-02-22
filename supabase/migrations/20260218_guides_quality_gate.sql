-- Migration: guides quality gate columns
-- Adds quality_score and auto_publish_eligible to guides table

ALTER TABLE guides
  ADD COLUMN IF NOT EXISTS quality_score integer,
  ADD COLUMN IF NOT EXISTS auto_publish_eligible boolean NOT NULL DEFAULT false;

-- Index for cron auto-publish query performance
CREATE INDEX IF NOT EXISTS idx_guides_auto_publish
  ON guides (lang, status, auto_publish_eligible)
  WHERE status = 'review' AND auto_publish_eligible = true;

COMMENT ON COLUMN guides.quality_score IS 'Content quality score 0-100. Breakdown: +20 content>3000chars, +20 CTA present, +20 primary_intent present, +20 route/tool slug present, +20 H2 structure >= 2';
COMMENT ON COLUMN guides.auto_publish_eligible IS 'true when quality_score >= 80. Cron will auto-publish these (max 2/day per lang).';
