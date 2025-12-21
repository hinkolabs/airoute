-- ============================================================
-- Add manual_order column to routes table
-- For custom sorting of featured routes on home page
-- ============================================================

ALTER TABLE public.routes 
ADD COLUMN IF NOT EXISTS manual_order INT DEFAULT 999;

-- Create index for performance
CREATE INDEX IF NOT EXISTS idx_routes_manual_order ON public.routes(manual_order);

-- Update existing featured routes to have explicit order (optional)
-- Example: Set order for first 2 featured routes
-- UPDATE public.routes SET manual_order = 1 WHERE slug = 'turn-long-videos-into-shorts';
-- UPDATE public.routes SET manual_order = 2 WHERE slug = 'polish-shorts-and-reels';

-- Verification
SELECT slug, title, featured, manual_order, created_at 
FROM public.routes 
WHERE featured = true 
ORDER BY manual_order ASC NULLS LAST, created_at DESC;





