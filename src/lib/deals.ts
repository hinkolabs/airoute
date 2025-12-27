// Curated tool slugs with special offers (must exist in Supabase tools table)
export const DEAL_TOOL_SLUGS = [
  "chatgpt",
  "midjourney",
  "runway",
  "elevenlabs",
] as const;

export type DealToolSlug = (typeof DEAL_TOOL_SLUGS)[number];

// Deal metadata (for display purposes)
// Note: All offer texts are legally safe and do not claim specific discounts
export const DEAL_METADATA: Record<
  string,
  { tag: string; offerText: string }
> = {
  chatgpt: {
    tag: "Popular",
    offerText: "Free plan available",
  },
  midjourney: {
    tag: "Premium",
    offerText: "Subscription required",
  },
  runway: {
    tag: "Video AI",
    offerText: "Promotions may be available",
  },
  elevenlabs: {
    tag: "Free tier",
    offerText: "Free tier available",
  },
};








