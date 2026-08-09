/**
 * Xiaohongshu (RedNote) SearchProvider — targets the Apify Store actor
 * `ethereal_wool/xiaohongshu-rednote-scraper`.
 *
 * ⚠️ Verification status: same caveat as douyin-apify.ts — field names below come
 * from the actor's PUBLIC documentation (checked 2026-08), not a live API call.
 * Re-verify against a real dataset item before production use.
 *
 * Documented output shape (one row per note), relevant subset:
 * {
 *   noteId, url, title, description, likedCount, collectedCount, commentsCount,
 *   sharedCount, videoDuration ("m:ss" string), coverUrl, imageUrls: string[],
 *   author: { nickname }, timestamp (unix seconds)
 * }
 *
 * Note: this actor's documented output does not include a direct playable video
 * URL field (only coverUrl / imageUrls), so preview_media_url / media_url stay
 * null for Xiaohongshu items — per SSOT section 19, canonical_url ("원본 보기")
 * remains the reliable link regardless.
 */

import { SearchProvider, getRequiredActorId } from "./base";
import { SourceItem } from "../../types";
import { fallbackPostId } from "../../normalize";

interface XhsAuthor {
  nickname?: string | null;
}

interface XhsRawItem {
  noteId?: string;
  url?: string;
  title?: string;
  description?: string;
  likedCount?: number | null;
  collectedCount?: number | null;
  commentsCount?: number | null;
  sharedCount?: number | null;
  videoDuration?: string | null; // "m:ss"
  coverUrl?: string | null;
  imageUrls?: string[];
  author?: XhsAuthor;
  timestamp?: number;
}

/** Parses a Xiaohongshu-style "m:ss" or "h:mm:ss" duration string into seconds. */
function parseDurationToSeconds(duration: string | null | undefined): number | null {
  if (!duration) return null;
  const parts = duration.split(":").map((p) => Number(p.trim()));
  if (parts.some((p) => Number.isNaN(p))) return null;
  return parts.reduce((acc, p) => acc * 60 + p, 0);
}

export const xiaohongshuApifyProvider: SearchProvider = {
  platform: "xiaohongshu",
  get actorId() {
    return getRequiredActorId("XIAOHONGSHU_ACTOR_ID");
  },
  providerVersion: "ethereal-wool-xhs-rednote-scraper-v1",

  buildRunInput(keyword, limitPerKeyword) {
    return {
      searchKeywords: [keyword],
      maxItems: limitPerKeyword,
      sortType: "general",
      noteType: "不限",
      includeComments: false,
    };
  },

  normalize(raw, keyword) {
    const item = raw as XhsRawItem;
    if (!item.url) return null;

    const result: SourceItem = {
      platform: "xiaohongshu",
      platform_post_id: item.noteId ?? fallbackPostId(item.url),
      canonical_url: item.url,
      title: item.title || item.description?.slice(0, 80) || null,
      author_name: item.author?.nickname ?? null,
      thumbnail_url: item.coverUrl || item.imageUrls?.[0] || null,
      preview_media_url: null,
      media_url: null,
      duration_seconds: parseDurationToSeconds(item.videoDuration),
      like_count: item.likedCount ?? null,
      comment_count: item.commentsCount ?? null,
      share_count: item.sharedCount ?? null,
      published_at: item.timestamp ? new Date(item.timestamp * 1000).toISOString() : null,
      matched_keywords: [keyword],
      text_score: null,
      visual_score: null,
      engagement_score: null,
      recency_score: null,
      final_score: null,
    };

    return result;
  },
};
