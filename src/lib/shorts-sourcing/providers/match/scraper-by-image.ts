/**
 * Reverse-image-search provider — targets the Apify Store actor
 * `devcake/scraper-by-image` ("Scraper by Image - 1688 / Alibaba / AliExpress").
 *
 * ✅ Verified against a live API response on 2026-08-09 (real run against a real
 * uploaded product screenshot, all three providers). Confirmed:
 * - `provider` only accepts exactly "1688" | "alibaba" | "aliexpress" — passing
 *   "taobao" returns a 400 invalid-input error. Taobao is NOT supported by this actor.
 * - `maxProducts` must be >= 30 (lower values are rejected with a 400).
 * - Field names below match the real dataset item shape for all three providers.
 * - "alibaba" titles can contain raw HTML (e.g. `<img src='...'></img><span> ...`),
 *   so title/description are stripped of tags in normalize().
 * - Many numeric/business fields (rating, sold_count, shop_name, etc.) are only
 *   populated for 1688 and/or alibaba; aliexpress mostly returns null for these —
 *   this is real provider behavior, not a bug, and normalize() treats them as
 *   optional throughout.
 */

import { runApifyActorSyncGetDatasetItems } from "../search/apify-client";
import { ProductMatch, ProductMatchProvider, PRODUCT_MATCH_PROVIDERS } from "../../types";

const DEFAULT_ACTOR_ID = "devcake/scraper-by-image";
const MIN_MAX_PRODUCTS = 30; // actor hard-rejects anything lower
const MAX_MATCHES_PER_PROVIDER = 12; // trimmed for UI/DB, actor itself still runs with MIN_MAX_PRODUCTS

function getImageMatchActorId(): string {
  return process.env.SHORTS_SOURCING_IMAGE_MATCH_ACTOR_ID || DEFAULT_ACTOR_ID;
}

function stripHtml(text: string | null | undefined): string | null {
  if (!text) return null;
  const cleaned = text.replace(/<[^>]*>/g, " ").replace(/\s+/g, " ").trim();
  return cleaned.length > 0 ? cleaned : null;
}

interface ScraperByImageRawItem {
  provider?: string;
  image_rank?: number;
  product_id?: string | number;
  title?: string;
  product_url?: string;
  image_url?: string;
  images?: string[];
  description?: string | null;
  price_min?: number | null;
  price_max?: number | null;
  currency?: string | null;
  currency_code?: string | null;
  shop_name?: string | null;
  shop_url?: string | null;
  rating?: number | null;
  sold_count?: number | null;
  tags?: string[];
}

function normalizeMatchItem(raw: unknown, expectedProvider: ProductMatchProvider): ProductMatch | null {
  const item = raw as ScraperByImageRawItem;
  const title = stripHtml(item?.title);
  if (!item || item.provider !== expectedProvider || !title || !item.product_id || !item.image_url) {
    return null;
  }

  return {
    provider: expectedProvider,
    product_id: String(item.product_id),
    title,
    description: stripHtml(item.description),
    image_url: item.image_url,
    images: Array.isArray(item.images) ? item.images.filter((u): u is string => typeof u === "string") : [],
    product_url: item.product_url ?? "",
    price_min: typeof item.price_min === "number" ? item.price_min : null,
    price_max: typeof item.price_max === "number" ? item.price_max : null,
    currency: item.currency_code ?? item.currency ?? null,
    shop_name: item.shop_name ?? null,
    shop_url: item.shop_url ?? null,
    rating: typeof item.rating === "number" ? item.rating : null,
    sold_count: typeof item.sold_count === "number" ? item.sold_count : null,
    image_rank: typeof item.image_rank === "number" ? item.image_rank : null,
    tags: Array.isArray(item.tags) ? item.tags.filter((t): t is string => typeof t === "string") : [],
    is_selected: false,
  };
}

async function searchOneProvider(imageUrl: string, provider: ProductMatchProvider): Promise<ProductMatch[]> {
  const rawItems = await runApifyActorSyncGetDatasetItems({
    actorId: getImageMatchActorId(),
    input: {
      provider,
      imageUrls: [imageUrl],
      maxProducts: MIN_MAX_PRODUCTS,
    },
  });

  return rawItems
    .map((raw) => {
      try {
        return normalizeMatchItem(raw, provider);
      } catch (err) {
        console.warn(`[scraper-by-image] normalize() threw on one ${provider} item, skipping:`, err);
        return null;
      }
    })
    .filter((x): x is ProductMatch => x !== null)
    .sort((a, b) => (a.image_rank ?? 999) - (b.image_rank ?? 999))
    .slice(0, MAX_MATCHES_PER_PROVIDER);
}

/**
 * Reverse-image-searches the uploaded product screenshot across every provider
 * the actor supports (1688, Alibaba, AliExpress — NOT Taobao, unsupported) and
 * returns normalized candidates, grouped by provider then sorted by that
 * provider's own match rank (best first) within each group. Providers run in
 * parallel; if one provider fails, the others still return results.
 */
export async function searchProductMatches(
  imageUrl: string,
  providers: readonly ProductMatchProvider[] = PRODUCT_MATCH_PROVIDERS
): Promise<ProductMatch[]> {
  const results = await Promise.allSettled(providers.map((provider) => searchOneProvider(imageUrl, provider)));

  const matches: ProductMatch[] = [];
  results.forEach((result, i) => {
    if (result.status === "fulfilled") {
      matches.push(...result.value);
    } else {
      console.error(`[scraper-by-image] provider "${providers[i]}" failed:`, result.reason);
    }
  });

  return matches;
}
