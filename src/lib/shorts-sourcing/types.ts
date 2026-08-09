/**
 * Shopping Shorts Sourcing — shared domain types.
 * Mirrors the Pydantic models from the original ONEPICK SSOT, translated to
 * TypeScript interfaces used across lib/, api/, and ui/.
 */

export const SHORTS_PLATFORMS = ["douyin", "xiaohongshu"] as const;
export type ShortsPlatform = (typeof SHORTS_PLATFORMS)[number];

export const SHORTS_VISION_PROMPT_VERSION = "v1";

/** Structured result of analyzing a product screenshot with a vision model. */
export interface ProductAnalysis {
  product_name_ko: string;
  category_ko: string | null;
  brand: string | null;
  model_name: string | null;
  attributes: string[];
  chinese_product_name: string;
  chinese_keywords: string[];
  chinese_hashtags: string[];
  confidence: number;
}

/** A single search keyword tied to a sourcing session (AI-generated or user-added). */
export interface SourcingKeyword {
  id: string;
  session_id: string;
  keyword: string;
  is_ai_generated: boolean;
  is_selected: boolean;
}

/** Common normalized shape for a Douyin/Xiaohongshu candidate video, regardless of provider. */
export interface SourceItem {
  id?: string;
  session_id?: string;
  workspace_id?: string;
  platform: ShortsPlatform;
  platform_post_id: string | null;
  canonical_url: string;
  title: string | null;
  author_name: string | null;
  thumbnail_url: string | null;
  preview_media_url: string | null;
  media_url: string | null;
  duration_seconds: number | null;
  like_count: number | null;
  comment_count: number | null;
  share_count: number | null;
  published_at: string | null; // ISO string
  matched_keywords: string[];
  text_score: number | null;
  visual_score: number | null;
  engagement_score: number | null;
  recency_score: number | null;
  final_score: number | null;
}

export type SourcingJobStatus = "pending" | "running" | "succeeded" | "failed";

export interface SourcingJob {
  id: string;
  session_id: string;
  platform: ShortsPlatform;
  keyword: string;
  status: SourcingJobStatus;
  error_message: string | null;
  result_count: number | null;
}

export type FavoriteUsageStatus = "unreviewed" | "approved" | "rejected";

export interface ShortsFavorite {
  id: string;
  source_item_id: string;
  note: string | null;
  usage_status: FavoriteUsageStatus;
  created_at: string;
  source_item: SourceItem;
}

/** Filters applied to a single provider search call. Kept generic on purpose —
 *  concrete providers decide which of these they actually support. */
export interface SearchFilters {
  limitPerKeyword: number;
}

export const SHORTS_SEARCH_LIMITS = {
  maxKeywordsPerSession: 5,
  defaultResultsPerKeyword: 20,
  maxResultsPerKeyword: 20,
  maxResultsPerPlatform: 100,
  cacheTtlHours: 24,
  preciseRankTopN: 20,
} as const;
