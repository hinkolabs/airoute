import { NextResponse } from "next/server";
import { getDemoMode } from "@/lib/flags";

/**
 * Diagnostic endpoint: runtime DEMO_MODE check
 * GET /api/debug/demo
 *
 * Returns DEMO_MODE flag and relevant env info.
 * No secrets or tokens are exposed.
 */
export async function GET(request: Request) {
  const cookieHeader = request.headers.get("cookie");
  const demoMode = await getDemoMode();

  return NextResponse.json({
    DEMO_MODE: demoMode,
    DEMO_MODE_SOURCE: "db",
    NEXT_PUBLIC_DEMO_MODE: process.env.NEXT_PUBLIC_DEMO_MODE,
    NODE_ENV: process.env.NODE_ENV,
    VERCEL_ENV: process.env.VERCEL_ENV ?? undefined,
    hasCookie: cookieHeader !== null && cookieHeader.length > 0,
    url: request.url,
  });
}
