/**
 * Central credit cost definitions for all features.
 * All costs are in "P" (points/tokens).
 *
 * Subscription includes: 15 monthly items + 15 content generations (free).
 * Tokens are only consumed for regeneration, extras, and add-on features.
 */

export const CREDIT_COSTS = {
  // Auto-posting (included 15/month free in subscription; credits for extras)
  autoposting_manual_save: 50,   // 즉시 생성 (research + critic×2 + AI image)
  autoposting_item_regen: 50,    // 재생성 (efficient mode + AI image) — now wired
  autoposting_item_topic_swap: 20,
  autoposting_pool_regen: 100,

  // CS Support
  cs_support_generate: 10,

  // Product content
  product_content_generate: 20,

  // Advisory
  verdict_detail: 20,

  // Productivity
  docs_summary: 50,
  ppt_generate: 100,
  shortform: 300,
  meeting_assistant: 500,

  // Shopping shorts sourcing (admin-only for now; keys already wired for future rollout)
  shorts_sourcing_vision_analyze: 10,  // product image -> ProductAnalysis (cached by image hash)
  shorts_sourcing_product_match: 20,   // product image -> reverse-image-search across 1688 + Alibaba + AliExpress (3 actor runs)
  shorts_sourcing_text_keywords: 2,    // typed product title -> search keywords (gpt-4o-mini, no vision call)
  shorts_sourcing_search_job: 5,       // per uncached platform x keyword Apify job
  shorts_sourcing_precise_rank: 15,    // AI 정밀 정렬 (top 20 visual_score pass)
} as const;

export type CreditFeatureKey = keyof typeof CREDIT_COSTS;

export function getCreditCost(key: CreditFeatureKey): number {
  return CREDIT_COSTS[key];
}

/**
 * Subscription plan configuration
 */
export const SUBSCRIPTION_CONFIG = {
  monthly_items_included: 15,
  monthly_contents_included: 15,
  starter_monthly_credits: 300,
} as const;
