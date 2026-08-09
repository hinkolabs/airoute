/**
 * 1688 reverse-image-search provider — targets the Apify Store actor
 * `devcake/scraper-by-image` ("Scraper by Image - 1688 / Alibaba / AliExpress").
 *
 * ⚠️ Verification status: the field names below were taken from the actor's PUBLIC
 * documentation on Apify Store (checked while planning this feature, 2026-08),
 * which includes a real trimmed example row per provider. This has NOT been
 * verified against a live API response in this environment. Per SSOT rule 0
 * ("외부 API 응답 스키마를 확인하지 않고 필드명을 추측하여 하드코딩하지 않는다"),
 * re-verify the actual dataset item shape with a real run before fully trusting
 * this in production — if the actor's output has drifted from its docs, only
 * this file needs to change. normalize() is defensive: unknown/missing fields
 * fall back to null rather than throwing.
 *
 * Documented output shape (one row per matched product), relevant "1688" subset:
 * {
 *   provider: "1688", image_rank, product_id, title, product_url, image_url,
 *   images: string[], description, price_min, price_max, currency,
 *   shop_name, shop_url, country, rating, sold_count, tags: string[]
 * }
 */

import { runApifyActorSyncGetDatasetItems } from "../search/apify-client";
import { ProductMatch } from "../../types";

const DEFAULT_ACTOR_ID = "devcake/scraper-by-image";

function getImageMatchActorId(): string {
  return process.env.SHORTS_SOURCING_IMAGE_MATCH_ACTOR_ID || DEFAULT_ACTOR_ID;
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

function normalizeMatchItem(raw: unknown): ProductMatch | null {
  const item = raw as ScraperByImageRawItem;
  if (!item || item.provider !== "1688" || !item.title || !item.product_id || !item.image_url) {
    return null;
  }

  return {
    provider: "1688",
    product_id: String(item.product_id),
    title: item.title,
    description: item.description ?? null,
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

/**
 * Reverse-image-searches 1688 for the uploaded product screenshot and returns
 * normalized candidates sorted by the provider's own match rank (best first).
 * Runs synchronously (single image, single provider) — no webhook needed.
 */
export async function searchProductMatchesOn1688(imageUrl: string, maxProducts = 12): Promise<ProductMatch[]> {
  const rawItems = await runApifyActorSyncGetDatasetItems({
    actorId: getImageMatchActorId(),
    input: {
      provider: "1688",
      imageUrls: [imageUrl],
      maxProducts,
    },
  });

  return rawItems
    .map((raw) => {
      try {
        return normalizeMatchItem(raw);
      } catch (err) {
        console.warn("[scraper-by-image] normalize() threw on one item, skipping:", err);
        return null;
      }
    })
    .filter((x): x is ProductMatch => x !== null)
    .sort((a, b) => (a.image_rank ?? 999) - (b.image_rank ?? 999));
}
