/**
 * Dedupe logic per SSOT section 15:
 * 1) same platform + platform_post_id -> definitely the same video
 * 2) else same platform + normalized canonical URL -> treat as same video
 * 3) different platforms are never auto-merged, even if they look similar
 *
 * When two rows collapse into one, matched_keywords are unioned and the row with
 * more populated metadata fields wins as the "primary" representative.
 */

import { SourceItem } from "./types";
import { normalizeCanonicalUrl } from "./normalize";

function fieldRichness(item: SourceItem): number {
  const fields: (keyof SourceItem)[] = [
    "title", "author_name", "thumbnail_url", "preview_media_url", "media_url",
    "duration_seconds", "like_count", "comment_count", "share_count", "published_at",
  ];
  return fields.reduce((count, key) => (item[key] !== null && item[key] !== undefined ? count + 1 : count), 0);
}

export function dedupeSourceItems(items: SourceItem[]): SourceItem[] {
  const byKey = new Map<string, SourceItem>();

  for (const item of items) {
    const key = item.platform_post_id
      ? `id:${item.platform}:${item.platform_post_id}`
      : `url:${item.platform}:${normalizeCanonicalUrl(item.canonical_url)}`;

    const existing = byKey.get(key);
    if (!existing) {
      byKey.set(key, { ...item, matched_keywords: [...item.matched_keywords] });
      continue;
    }

    const mergedKeywords = Array.from(new Set([...existing.matched_keywords, ...item.matched_keywords]));
    const richer = fieldRichness(item) > fieldRichness(existing) ? item : existing;

    byKey.set(key, { ...richer, matched_keywords: mergedKeywords });
  }

  return Array.from(byKey.values());
}
