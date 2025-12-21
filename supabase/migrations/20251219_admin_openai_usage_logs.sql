-- =====================================================
-- Admin OpenAI Usage Logs Table
-- Track OpenAI API calls for cost monitoring
-- =====================================================

CREATE TABLE IF NOT EXISTS public.admin_openai_usage_logs (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  guide_id bigint REFERENCES public.guides(id) ON DELETE SET NULL,
  action text NOT NULL DEFAULT 'generate_openai',
  lang text NOT NULL DEFAULT 'en',
  model text,
  prompt_tokens integer,
  completion_tokens integer,
  total_tokens integer,
  created_at timestamptz DEFAULT now()
);

-- Index for daily count query (KST)
CREATE INDEX IF NOT EXISTS idx_admin_openai_usage_logs_created_at 
ON public.admin_openai_usage_logs(created_at);

-- Grant permissions (service_role will bypass RLS anyway)
GRANT SELECT, INSERT ON public.admin_openai_usage_logs TO authenticated;



