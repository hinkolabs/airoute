/**
 * URL/keyword normalization helpers shared by dedupe.ts and the search cache key.
 */

/** Lowercases the host, strips tracking query params/fragments, drops trailing slash. */
export function normalizeCanonicalUrl(rawUrl: string): string {
  try {
    const url = new URL(rawUrl);
    url.hash = "";
    // Drop common tracking/share params that don't change the underlying content.
    const dropParams = ["share_sign", "share_track_info", "utm_source", "utm_medium", "utm_campaign", "xsec_source"];
    for (const p of dropParams) url.searchParams.delete(p);
    url.hostname = url.hostname.toLowerCase();
    let normalized = `${url.origin.toLowerCase()}${url.pathname.replace(/\/+$/, "")}`;
    const remainingParams = url.searchParams.toString();
    if (remainingParams) normalized += `?${remainingParams}`;
    return normalized;
  } catch {
    return rawUrl.trim().toLowerCase();
  }
}

/** Normalizes a Chinese search keyword for use in a cache key (trim + collapse whitespace). */
export function normalizeKeywordForCache(keyword: string): string {
  return keyword.trim().replace(/\s+/g, " ").toLowerCase();
}

/**
 * Some Actor responses omit a stable platform post id. We still need a non-null
 * dedupe key so `shorts_source_items` can have one plain (non-partial) unique
 * index on (session_id, platform, platform_post_id) — partial unique indexes
 * can't be used as a Supabase/PostgREST upsert conflict target. This is only a
 * fallback; a real platform id always wins when the provider supplies one.
 */
export function fallbackPostId(canonicalUrl: string): string {
  return `url:${normalizeCanonicalUrl(canonicalUrl)}`;
}

export function buildSearchCacheKey(params: {
  platform: string;
  keyword: string;
  limitPerKeyword: number;
  providerVersion: string;
}): string {
  const normalizedKeyword = normalizeKeywordForCache(params.keyword);
  return `${params.platform}:${normalizedKeyword}:limit${params.limitPerKeyword}:${params.providerVersion}`;
}
