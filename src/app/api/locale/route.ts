import { NextRequest, NextResponse } from "next/server";

const LOCALE_COOKIE = "airoute-locale";
const VALID_LOCALES = ["en", "kr"] as const;

/**
 * GET /api/locale?set=kr  → sets cookie & redirects to /kr
 * GET /api/locale?set=en  → sets cookie & redirects to /
 */
export async function GET(req: NextRequest) {
  const locale = req.nextUrl.searchParams.get("set");

  if (!locale || !VALID_LOCALES.includes(locale as any)) {
    return NextResponse.json({ error: "Invalid locale. Use ?set=en or ?set=kr" }, { status: 400 });
  }

  const dest = locale === "kr" ? "/kr" : "/";
  const url = req.nextUrl.clone();
  url.pathname = dest;
  url.searchParams.delete("set");

  const response = NextResponse.redirect(url);
  response.cookies.set(LOCALE_COOKIE, locale, {
    path: "/",
    maxAge: 60 * 60 * 24 * 365,
    sameSite: "lax",
  });

  return response;
}
