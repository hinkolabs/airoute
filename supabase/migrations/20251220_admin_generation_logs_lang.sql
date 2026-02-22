-- =====================================================
-- Add lang column to admin_guide_generation_logs
-- For tracking which language the guide was generated in
-- =====================================================

-- Add lang column to admin_guide_generation_logs
ALTER TABLE public.admin_guide_generation_logs
ADD COLUMN IF NOT EXISTS lang text NOT NULL DEFAULT 'en'
CHECK (lang IN ('en', 'kr'));

-- Index for lang-based queries
CREATE INDEX IF NOT EXISTS idx_admin_guide_generation_logs_lang 
ON public.admin_guide_generation_logs(lang);







