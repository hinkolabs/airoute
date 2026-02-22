-- ============================================================
-- ROUTES I18N SYSTEM
-- Created: 2026-01-04
-- Purpose: Multi-language support for routes (KR, JP, etc.)
-- ============================================================

-- ============================================================
-- Table: routes_i18n
-- Translations for routes (non-EN languages only)
-- EN is the default in routes table
-- ============================================================
CREATE TABLE IF NOT EXISTS public.routes_i18n (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  route_id UUID NOT NULL REFERENCES public.routes(id) ON DELETE CASCADE,
  locale TEXT NOT NULL CHECK (locale IN ('kr', 'ja', 'zh', 'es', 'fr', 'de')),
  title TEXT NOT NULL,
  description TEXT,
  guide_bullets TEXT[],
  
  -- Translation metadata
  translation_status TEXT DEFAULT 'draft' CHECK (translation_status IN ('draft', 'reviewed', 'published')),
  translated_by TEXT, -- Admin user ID or 'openai'
  translation_model TEXT, -- 'gpt-4o-mini', 'manual', etc.
  translation_version TEXT, -- 'v1', 'v2', etc.
  
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now(),
  
  -- Prevent duplicate translations
  UNIQUE(route_id, locale)
);

-- ============================================================
-- Table: route_tools_i18n
-- Translations for route workflow steps
-- ============================================================
CREATE TABLE IF NOT EXISTS public.route_tools_i18n (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  route_tool_id UUID NOT NULL REFERENCES public.route_tools(id) ON DELETE CASCADE,
  locale TEXT NOT NULL CHECK (locale IN ('kr', 'ja', 'zh', 'es', 'fr', 'de')),
  step_title TEXT,
  step_why TEXT,
  step_cta_label TEXT,
  step_prompt_example TEXT,
  step_input_type TEXT, -- 'settings', 'action', 'prompt'
  
  -- Translation metadata
  translation_status TEXT DEFAULT 'draft' CHECK (translation_status IN ('draft', 'reviewed', 'published')),
  translated_by TEXT,
  translation_model TEXT,
  translation_version TEXT,
  
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now(),
  
  -- Prevent duplicate translations
  UNIQUE(route_tool_id, locale)
);

-- ============================================================
-- Table: tools_i18n
-- Translations for tool names (for completeness)
-- ============================================================
CREATE TABLE IF NOT EXISTS public.tools_i18n (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tool_id TEXT NOT NULL, -- FK to tools.id
  locale TEXT NOT NULL CHECK (locale IN ('kr', 'ja', 'zh', 'es', 'fr', 'de')),
  name TEXT NOT NULL,
  description TEXT,
  
  translation_status TEXT DEFAULT 'draft' CHECK (translation_status IN ('draft', 'reviewed', 'published')),
  translated_by TEXT,
  translation_model TEXT,
  
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now(),
  
  UNIQUE(tool_id, locale)
);

-- ============================================================
-- Indexes for JOIN performance
-- Critical for /kr page speed
-- ============================================================
CREATE INDEX IF NOT EXISTS idx_routes_i18n_route_locale 
  ON public.routes_i18n(route_id, locale);

CREATE INDEX IF NOT EXISTS idx_routes_i18n_locale 
  ON public.routes_i18n(locale);

CREATE INDEX IF NOT EXISTS idx_route_tools_i18n_route_tool_locale 
  ON public.route_tools_i18n(route_tool_id, locale);

CREATE INDEX IF NOT EXISTS idx_route_tools_i18n_locale 
  ON public.route_tools_i18n(locale);

CREATE INDEX IF NOT EXISTS idx_tools_i18n_tool_locale 
  ON public.tools_i18n(tool_id, locale);

-- ============================================================
-- Row Level Security (public read)
-- ============================================================
ALTER TABLE public.routes_i18n ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.route_tools_i18n ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.tools_i18n ENABLE ROW LEVEL SECURITY;

-- Public read access (translations visible to all)
CREATE POLICY "Anyone can view routes_i18n"
  ON public.routes_i18n
  FOR SELECT
  USING (true);

CREATE POLICY "Anyone can view route_tools_i18n"
  ON public.route_tools_i18n
  FOR SELECT
  USING (true);

CREATE POLICY "Anyone can view tools_i18n"
  ON public.tools_i18n
  FOR SELECT
  USING (true);

-- Admin write policies
CREATE POLICY "Authenticated users can insert routes_i18n"
  ON public.routes_i18n
  FOR INSERT
  WITH CHECK (auth.role() = 'authenticated');

CREATE POLICY "Authenticated users can update routes_i18n"
  ON public.routes_i18n
  FOR UPDATE
  USING (auth.role() = 'authenticated');

CREATE POLICY "Authenticated users can delete routes_i18n"
  ON public.routes_i18n
  FOR DELETE
  USING (auth.role() = 'authenticated');

CREATE POLICY "Authenticated users can insert route_tools_i18n"
  ON public.route_tools_i18n
  FOR INSERT
  WITH CHECK (auth.role() = 'authenticated');

CREATE POLICY "Authenticated users can update route_tools_i18n"
  ON public.route_tools_i18n
  FOR UPDATE
  USING (auth.role() = 'authenticated');

CREATE POLICY "Authenticated users can delete route_tools_i18n"
  ON public.route_tools_i18n
  FOR DELETE
  USING (auth.role() = 'authenticated');

CREATE POLICY "Authenticated users can insert tools_i18n"
  ON public.tools_i18n
  FOR INSERT
  WITH CHECK (auth.role() = 'authenticated');

CREATE POLICY "Authenticated users can update tools_i18n"
  ON public.tools_i18n
  FOR UPDATE
  USING (auth.role() = 'authenticated');

-- ============================================================
-- Updated_at trigger
-- ============================================================
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_routes_i18n_updated_at
  BEFORE UPDATE ON public.routes_i18n
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_route_tools_i18n_updated_at
  BEFORE UPDATE ON public.route_tools_i18n
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_tools_i18n_updated_at
  BEFORE UPDATE ON public.tools_i18n
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

-- ============================================================
-- USAGE NOTES
-- ============================================================
-- 1. EN is default in base tables (routes, route_tools, tools)
-- 2. Only non-EN translations go into i18n tables
-- 3. Use UPSERT for translations to handle updates safely:
--    INSERT INTO routes_i18n (...) VALUES (...)
--    ON CONFLICT (route_id, locale) DO UPDATE SET ...
--
-- 4. Query pattern for /kr pages:
--    SELECT r.*, ri.title, ri.description, ri.guide_bullets
--    FROM routes r
--    LEFT JOIN routes_i18n ri ON ri.route_id = r.id AND ri.locale = 'kr'
--    WHERE r.slug = :slug
--    -- Coalesce in code: ri.title ?? r.title
--
-- 5. Translation workflow:
--    draft -> reviewed -> published
--    (draft = OpenAI raw, reviewed = human checked, published = live)
