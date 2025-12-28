import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

export function middleware(req: NextRequest) {
  const { pathname } = req.nextUrl;
  
  // Only protect /admin routes (except /admin/login)
  if (!pathname.startsWith("/admin") || pathname === "/admin/login") {
    return NextResponse.next();
  }

  const adminKey = process.env.ADMIN_KEY;
  // dev 편의: 미설정 시 통과 (원하면 막아도 됨)
  if (!adminKey) return NextResponse.next();

  const cookieKey = req.cookies.get("airoute_admin")?.value;
  if (cookieKey === adminKey) return NextResponse.next();

  // Redirect to login page
  const url = req.nextUrl.clone();
  url.pathname = "/admin/login";
  return NextResponse.redirect(url);
}

export const config = {
  matcher: ["/admin/:path*"],
};






