-- =====================================================
-- Admin Guide Generation Logs Table
-- 자동 생성 기록 (하루 2개 제한 체크용)
-- =====================================================

CREATE TABLE IF NOT EXISTS public.admin_guide_generation_logs (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  guide_id bigint REFERENCES public.guides(id) ON DELETE SET NULL,
  recipe_key text NOT NULL,
  mode text NOT NULL DEFAULT 'auto' CHECK (mode IN ('auto', 'manual')),
  generated_at timestamptz DEFAULT now(),
  note text
);

-- Index for daily count query (KST)
CREATE INDEX IF NOT EXISTS idx_admin_guide_generation_logs_mode_date 
ON public.admin_guide_generation_logs(mode, generated_at);

-- Grant permissions
GRANT SELECT, INSERT ON public.admin_guide_generation_logs TO authenticated;







