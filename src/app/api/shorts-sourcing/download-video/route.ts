import { NextRequest, NextResponse } from "next/server";
import { requireUser, isErrorResponse } from "@/lib/shorts-sourcing/api-guard";

export const dynamic = "force-dynamic";
export const maxDuration = 60;

/**
 * Streams a Douyin/Xiaohongshu video CDN url back through our own origin with
 * `Content-Disposition: attachment` so the admin gets a real file download
 * instead of the video just opening/playing in a new tab. Mirrors
 * thumbnail-proxy's Referer/SSRF handling (same hotlink-protection problem),
 * minus the HEIC transcoding step, which doesn't apply to video.
 *
 * media_url is a signed CDN url stored at search time — it can expire before
 * the admin clicks download later. If upstream rejects it, we surface a 502
 * JSON error rather than a broken file.
 */

const PLATFORM_REFERER: Record<string, string> = {
  douyin: "https://www.douyin.com/",
  xiaohongshu: "https://www.xiaohongshu.com/",
};

const DESKTOP_UA =
  "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36";

// Same SSRF guard as thumbnail-proxy: this endpoint accepts a client-supplied
// `url` param, so we don't trust it blindly even though it normally comes from
// our own stored media_url values.
const PRIVATE_HOST_PATTERN =
  /^(localhost|127\.|0\.0\.0\.0|10\.|169\.254\.|192\.168\.|172\.(1[6-9]|2\d|3[0-1])\.|\[?::1\]?$|\[?fe80:|\[?fc[0-9a-f]{2}:|\[?fd[0-9a-f]{2}:)/i;

function sanitizeFilename(name: string | null): string {
  if (!name) return "video.mp4";
  const cleaned = name.replace(/[\r\n"]/g, "").replace(/[^\w.\-]+/g, "_").slice(0, 100);
  return cleaned.endsWith(".mp4") ? cleaned : `${cleaned}.mp4`;
}

export async function GET(request: NextRequest) {
  const ctx = await requireUser();
  if (isErrorResponse(ctx)) return ctx;

  const targetUrl = request.nextUrl.searchParams.get("url");
  const platform = request.nextUrl.searchParams.get("platform") ?? "";
  const filename = sanitizeFilename(request.nextUrl.searchParams.get("filename"));

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
      return NextResponse.json(
        { error: "upstream_error", upstream_status: upstream.status, message: "다운로드 링크가 만료되었거나 접근할 수 없습니다." },
        { status: 502 }
      );
    }

    const contentType = upstream.headers.get("content-type") ?? "video/mp4";
    const contentLength = upstream.headers.get("content-length");

    return new NextResponse(upstream.body, {
      status: 200,
      headers: {
        "Content-Type": contentType,
        "Content-Disposition": `attachment; filename="${filename}"`,
        ...(contentLength ? { "Content-Length": contentLength } : {}),
        "Cache-Control": "private, no-store",
      },
    });
  } catch (err) {
    console.error("[shorts-sourcing/download-video] fetch failed:", err);
    return NextResponse.json({ error: "proxy_failed", message: "영상 다운로드에 실패했습니다." }, { status: 502 });
  }
}
