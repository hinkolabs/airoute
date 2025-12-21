-- ============================================================
-- AIROUTE ROUTES SYSTEM
-- Created: 2025-12-18
-- Purpose: Route > Guide > Tool hierarchy (Route as primary asset)
-- ============================================================

-- Step 1: Verify tools.id type (must be uuid for FK)
-- Run this first to check:
-- SELECT column_name, data_type
-- FROM information_schema.columns
-- WHERE table_schema='public' AND table_name='tools' AND column_name='id';

-- ============================================================
-- Table: routes
-- Master data for Routes (workflow/task sequences)
-- ============================================================
CREATE TABLE IF NOT EXISTS public.routes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  slug TEXT UNIQUE NOT NULL,
  title TEXT NOT NULL,
  description TEXT,
  icon TEXT,
  featured BOOLEAN NOT NULL DEFAULT false,
  tags TEXT[],
  guide_bullets TEXT[],
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- ============================================================
-- Table: route_tools
-- Route ↔ Tool mapping with ordering and Best3 flags
-- ============================================================
CREATE TABLE IF NOT EXISTS public.route_tools (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  route_id UUID NOT NULL REFERENCES public.routes(id) ON DELETE CASCADE,
  tool_id TEXT NOT NULL, -- FK to tools.id (check if uuid or text)
  position INT NOT NULL DEFAULT 999,
  is_best3 BOOLEAN NOT NULL DEFAULT false,
  step_title TEXT,
  step_why TEXT,
  step_cta_label TEXT,
  step_prompt_example TEXT,
  created_at TIMESTAMPTZ DEFAULT now(),
  UNIQUE(route_id, tool_id)
);

-- ============================================================
-- Indexes for performance
-- ============================================================
CREATE INDEX IF NOT EXISTS idx_routes_slug ON public.routes(slug);
CREATE INDEX IF NOT EXISTS idx_routes_featured ON public.routes(featured);
CREATE INDEX IF NOT EXISTS idx_route_tools_route ON public.route_tools(route_id);
CREATE INDEX IF NOT EXISTS idx_route_tools_best3 ON public.route_tools(route_id, is_best3, position);
CREATE INDEX IF NOT EXISTS idx_route_tools_tool ON public.route_tools(tool_id);

-- ============================================================
-- Enable Row Level Security (public read, admin write)
-- ============================================================
-- NOTE (RLS):
-- routes / route_tools are publicly readable (anon SELECT allowed).
-- This is intentional for Airoute MVP to enable:
-- - Fast public browsing without authentication
-- - Server-side rendering with anon key
-- - No 404 errors for unauthenticated users
-- Do NOT remove these public read policies or all routes will 404.
-- ============================================================
ALTER TABLE public.routes ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.route_tools ENABLE ROW LEVEL SECURITY;

-- Public read access for routes (all users can browse)
CREATE POLICY "Anyone can view routes"
  ON public.routes
  FOR SELECT
  USING (true);

-- Public read access for route_tools
CREATE POLICY "Anyone can view route_tools"
  ON public.route_tools
  FOR SELECT
  USING (true);

-- Admin write policies (adjust auth.uid() condition as needed)
-- For now, allowing all authenticated users to insert/update for seeding
CREATE POLICY "Authenticated users can insert routes"
  ON public.routes
  FOR INSERT
  WITH CHECK (auth.role() = 'authenticated');

CREATE POLICY "Authenticated users can update routes"
  ON public.routes
  FOR UPDATE
  USING (auth.role() = 'authenticated');

CREATE POLICY "Authenticated users can insert route_tools"
  ON public.route_tools
  FOR INSERT
  WITH CHECK (auth.role() = 'authenticated');

CREATE POLICY "Authenticated users can update route_tools"
  ON public.route_tools
  FOR UPDATE
  USING (auth.role() = 'authenticated');

-- ============================================================
-- IMPORTANT NOTES
-- ============================================================
-- 1. If tools.id is UUID, change route_tools.tool_id to UUID and add FK:
--    ALTER TABLE public.route_tools
--    ALTER COLUMN tool_id TYPE UUID USING tool_id::uuid;
--    ALTER TABLE public.route_tools
--    ADD CONSTRAINT fk_route_tools_tool FOREIGN KEY (tool_id) REFERENCES public.tools(id) ON DELETE CASCADE;
--
-- 2. After creating tables, seed data from src/lib/routes.ts using seed script
--
-- 3. Standard Best3 query example:
--    SELECT
--      r.slug as route_slug,
--      t.id, t.name, t.website_url, t.image, t.affiliate_url,
--      rt.position, rt.is_best3, rt.step_title, rt.step_why
--    FROM routes r
--    JOIN route_tools rt ON rt.route_id = r.id
--    JOIN tools t ON t.id = rt.tool_id
--    WHERE r.slug = :route_slug AND rt.is_best3 = true
--    ORDER BY rt.position ASC
--    LIMIT 3;

