import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { createServerClient } from '@supabase/ssr';

const LOCALE_COOKIE = "airoute-locale";

export async function middleware(req: NextRequest) {
  const { pathname } = req.nextUrl;

  // --- Geo-based locale redirect (root "/" only) ---
  if (pathname === "/") {
    const localeOverride = req.cookies.get(LOCALE_COOKIE)?.value;

    if (localeOverride === "en") {
      // User explicitly chose global – skip redirect
    } else if (localeOverride === "kr") {
      const url = req.nextUrl.clone();
      url.pathname = "/kr";
      return NextResponse.redirect(url);
    } else {
      // No cookie → detect country via Vercel header
      const country = req.headers.get("x-vercel-ip-country") ?? "";
      if (country === "KR") {
        const url = req.nextUrl.clone();
        url.pathname = "/kr";
        return NextResponse.redirect(url);
      }
    }
  }

  // Create response object
  let response = NextResponse.next({
    request: {
      headers: req.headers,
    },
  });

  // Initialize Supabase client for session management
  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return req.cookies.getAll().map(({ name, value }) => ({ name, value }));
        },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value, options }) => {
            req.cookies.set(name, value);
            response.cookies.set(name, value, options);
          });
        },
      },
    }
  );

  // Refresh session if it exists (critical for OAuth)
  const { data: { session } } = await supabase.auth.getSession();
  
  if (process.env.NODE_ENV !== 'production' && pathname.startsWith('/workspace')) {
    console.log('[Middleware] /workspace access:', { 
      hasSession: !!session, 
      userId: session?.user?.id ?? null 
    });
  }
  
  response.headers.set("x-pathname", pathname);

  return response;
}

export const config = {
  matcher: ['/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)'],
};







