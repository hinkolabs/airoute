// Curated trending tool slugs (must exist in Supabase tools table)
export const TRENDING_TOOL_SLUGS = [
  "midjourney",
  "chatgpt",
  "runway",
  "elevenlabs",
  "claude",
  "suno",
] as const;

export type TrendingToolSlug = (typeof TRENDING_TOOL_SLUGS)[number];


