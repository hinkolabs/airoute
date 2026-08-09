/**
 * Douyin SearchProvider — targets the Apify Store actor `zen-studio/douyin-search-scraper`.
 *
 * ⚠️ Verification status: the input/output field names below were taken from the
 * actor's PUBLIC documentation on Apify Store (checked while planning this feature,
 * 2026-08). This has NOT been verified against a live API response in this
 * environment (no Apify token available here). Per SSOT rule 0 ("외부 API 응답
 * 스키마를 확인하지 않고 필드명을 추측하여 하드코딩하지 않는다"), re-verify the
 * actual dataset item shape with a real run before relying on this in production —
 * if Apify's actor output has drifted from its docs, only this file needs to change.
 *
 * Documented output shape (one row per video), relevant subset:
 * {
 *   id, url, shareUrl, text, itemTitle, previewTitle, createTime (unix seconds),
 *   authorMeta: { name, ... },
 *   videoMeta: { duration (ms), cover, originCover, playUrl, downloadUrl, ... },
 *   statistics: { diggCount, commentCount, shareCount, ... },
 *   searchKeyword
 * }
 */

import { SearchProvider, getRequiredActorId } from "./base";
import { SourceItem } from "../../types";
import { fallbackPostId } from "../../normalize";

type DouyinAuthorMeta = { name?: string | null };
type DouyinVideoMeta = {
  duration?: number | null; // milliseconds
  cover?: string | null;
  originCover?: string | null;
  dynamicCover?: string | null;
  playUrl?: string | null;
  downloadUrl?: string | null;
};
type DouyinStatistics = {
  diggCount?: number | null;
  commentCount?: number | null;
  shareCount?: number | null;
};

interface DouyinRawItem {
  id?: string;
  url?: string;
  shareUrl?: string;
  text?: string;
  itemTitle?: string;
  previewTitle?: string;
  createTime?: number;
  authorMeta?: DouyinAuthorMeta;
  videoMeta?: DouyinVideoMeta;
  statistics?: DouyinStatistics;
}

export const douyinApifyProvider: SearchProvider = {
  platform: "douyin",
  get actorId() {
    return getRequiredActorId("DOUYIN_ACTOR_ID");
  },
  providerVersion: "zen-studio-douyin-search-scraper-v1",

  buildRunInput(keyword, limitPerKeyword) {
    return {
      keywords: [keyword],
      maxResultsPerQuery: limitPerKeyword,
      sort: "general",
      publishTime: "unlimited",
      duration: "unlimited",
      shouldDownloadVideos: false,
      shouldDownloadCovers: false,
    };
  },

  normalize(raw, keyword) {
    const item = raw as DouyinRawItem;
    const canonicalUrl = item.url || item.shareUrl;
    if (!canonicalUrl) return null;

    const durationMs = item.videoMeta?.duration;

    const result: SourceItem = {
      platform: "douyin",
      platform_post_id: item.id ?? fallbackPostId(canonicalUrl),
      canonical_url: canonicalUrl,
      title: item.text || item.itemTitle || item.previewTitle || null,
      author_name: item.authorMeta?.name ?? null,
      thumbnail_url: item.videoMeta?.cover || item.videoMeta?.originCover || item.videoMeta?.dynamicCover || null,
      preview_media_url: item.videoMeta?.playUrl ?? null,
      media_url: item.videoMeta?.downloadUrl ?? item.videoMeta?.playUrl ?? null,
      duration_seconds: typeof durationMs === "number" ? Math.round(durationMs / 1000) : null,
      like_count: item.statistics?.diggCount ?? null,
      comment_count: item.statistics?.commentCount ?? null,
      share_count: item.statistics?.shareCount ?? null,
      published_at: item.createTime ? new Date(item.createTime * 1000).toISOString() : null,
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
