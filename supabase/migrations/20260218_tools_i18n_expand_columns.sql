-- Expand tools_i18n to support translating all visible fields on tool detail page
ALTER TABLE tools_i18n
  ADD COLUMN IF NOT EXISTS task_category TEXT,
  ADD COLUMN IF NOT EXISTS best_for TEXT,
  ADD COLUMN IF NOT EXISTS why_pick TEXT,
  ADD COLUMN IF NOT EXISTS detail_content JSONB;
