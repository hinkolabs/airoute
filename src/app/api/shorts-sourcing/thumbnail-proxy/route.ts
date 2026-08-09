import { NextRequest, NextResponse } from "next/server";
import { requireUser, isErrorResponse } from "@/lib/shorts-sourcing/api-guard";

export const dynamic = "force-dynamic";

/**
 * Douyin/Xiaohongshu CDN thumbnails reject direct hotlinking from other origins
 * (missing/incorrect Referer -> 403), so <img src="{raw cdn url}"> renders as a
 * broken/empty box in the admin UI. This route fetches the image server-side with
 * a platform-appropriate Referer + desktop User-Agent and streams it back
 * same-origin, admin-gated like every other shorts-sourcing route.
 */

const PLATFORM_REFERER: Record<string, string> = {
  douyin: "https://www.douyin.com/",
  xiaohongshu: "https://www.xiaohongshu.com/",
};

const DESKTOP_UA =
  "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36";

// Basic SSRF guard: block loopback/private/link-local hosts. thumbnail_url values
// come from our own scraper's stored data, but this endpoint still accepts a
// client-supplied `url` param, so we don't trust it blindly.
const PRIVATE_HOST_PATTERN =
  /^(localhost|127\.|0\.0\.0\.0|10\.|169\.254\.|192\.168\.|172\.(1[6-9]|2\d|3[0-1])\.|\[?::1\]?$|\[?fe80:|\[?fc[0-9a-f]{2}:|\[?fd[0-9a-f]{2}:)/i;

export async function GET(request: NextRequest) {
  const ctx = await requireUser();
  if (isErrorResponse(ctx)) return ctx;

  const targetUrl = request.nextUrl.searchParams.get("url");
  const platform = request.nextUrl.searchParams.get("platform") ?? "";

  if (!targetUrl) {
    return NextResponse.json({ error: "url is required" }, { status: 400 });
  }

  let parsed: URL;
  try {
    parsed = new URL(targetUrl);
  } catch {
    return NextResponse.json({ error: "invalid_url" }, { status: 400 });
  }

  if (parsed.protocol !== "https:" && parsed.protocol !== "http:") {
    return NextResponse.json({ error: "invalid_protocol" }, { status: 400 });
  }
  if (PRIVATE_HOST_PATTERN.test(parsed.hostname)) {
    return NextResponse.json({ error: "host_not_allowed" }, { status: 400 });
  }

  try {
    const upstream = await fetch(parsed.toString(), {
      headers: {
        Referer: PLATFORM_REFERER[platform] ?? `${parsed.protocol}//${parsed.hostname}/`,
        "User-Agent": DESKTOP_UA,
      },
      cache: "no-store",
    });

    if (!upstream.ok || !upstream.body) {
      return NextResponse.json({ error: "upstream_error", upstream_status: upstream.status }, { status: 502 });
    }

    const contentType = upstream.headers.get("content-type") ?? "image/jpeg";
    return new NextResponse(upstream.body, {
      status: 200,
      headers: {
        "Content-Type": contentType,
        // Signed CDN URLs expire, but rarely within an hour — safe to cache briefly.
        "Cache-Control": "private, max-age=3600",
      },
    });
  } catch (err) {
    console.error("[shorts-sourcing/thumbnail-proxy] fetch failed:", err);
    return NextResponse.json({ error: "proxy_failed" }, { status: 502 });
  }
}
