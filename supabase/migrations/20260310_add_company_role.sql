-- Add company_role column to workspace_manager_settings
-- Represents the role/title of the person managing CS (e.g., '대표', '담당자', '고객센터')

ALTER TABLE public.workspace_manager_settings
  ADD COLUMN IF NOT EXISTS company_role TEXT;

COMMENT ON COLUMN public.workspace_manager_settings.company_role IS 'Role/title of the CS manager (e.g. 대표, 담당자, 고객센터)';
