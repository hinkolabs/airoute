-- ============================================================
-- AIROUTE FAVORITES SYSTEM
-- Created: 2025-12-16
-- ============================================================

-- Table: favorites_tools
-- Stores user-favorited AI tools
CREATE TABLE IF NOT EXISTS public.favorites_tools (
  id BIGSERIAL PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  tool_slug TEXT NOT NULL,
  created_at TIMESTAMPTZ DEFAULT now(),
  UNIQUE(user_id, tool_slug)
);

-- Table: favorites_routes
-- Stores user-favorited routes (best routes)
CREATE TABLE IF NOT EXISTS public.favorites_routes (
  id BIGSERIAL PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  route_slug TEXT NOT NULL,
  created_at TIMESTAMPTZ DEFAULT now(),
  UNIQUE(user_id, route_slug)
);

-- Enable Row Level Security
ALTER TABLE public.favorites_tools ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.favorites_routes ENABLE ROW LEVEL SECURITY;

-- RLS Policies for favorites_tools
CREATE POLICY "Users can view their own favorite tools"
  ON public.favorites_tools
  FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own favorite tools"
  ON public.favorites_tools
  FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete their own favorite tools"
  ON public.favorites_tools
  FOR DELETE
  USING (auth.uid() = user_id);

-- RLS Policies for favorites_routes
CREATE POLICY "Users can view their own favorite routes"
  ON public.favorites_routes
  FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own favorite routes"
  ON public.favorites_routes
  FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete their own favorite routes"
  ON public.favorites_routes
  FOR DELETE
  USING (auth.uid() = user_id);

-- Indexes for better performance
CREATE INDEX IF NOT EXISTS idx_favorites_tools_user_id ON public.favorites_tools(user_id);
CREATE INDEX IF NOT EXISTS idx_favorites_tools_created_at ON public.favorites_tools(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_favorites_routes_user_id ON public.favorites_routes(user_id);
CREATE INDEX IF NOT EXISTS idx_favorites_routes_created_at ON public.favorites_routes(created_at DESC);









