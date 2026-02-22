"use client";

import Link from "next/link";
import Image from "next/image";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { useEffect, useRef, useState, type MouseEvent } from "react";
import { useAuth, markExplicitSignOut, clearSupabaseAuthStorage } from "@/app/_providers/auth-provider";
import { useTheme } from "@/app/_design/providers/theme-provider";
import { Sun, Moon, Globe } from "lucide-react";
import { useDemoMode } from "@/app/_providers/demo-mode-provider";

const __DEV__ = process.env.NODE_ENV !== 'production';

// ============================================================
// OpenArt Style Header - Conversion Focused
// Structure: [Logo Image + Text + Sign up Button]
// ============================================================
export default function Header() {
  const pathname = usePathname();
  const router = useRouter();
  const searchParams = useSearchParams();
  const { user, signOut, loading, authStatus } = useAuth();
  const { theme, toggleTheme } = useTheme();
  const demoMode = useDemoMode();
  const [mounted, setMounted] = useState(false);
  const hasLoggedRenderRef = useRef(false);
  const isSigningOutRef = useRef(false);
  
  // Hide global header in Workspace area
  if (pathname.startsWith("/kr/workspace") || pathname.startsWith("/workspace")) {
    return null;
  }
  
  // Log only once to avoid console spam
  useEffect(() => {
    if (!hasLoggedRenderRef.current) {
      if (__DEV__) console.log('[Header] Initial render - user:', user?.id ?? 'null');
      hasLoggedRenderRef.current = true;
    }
  }, [user?.id]);

  useEffect(() => {
    setMounted(true);
  }, []);

  // Language toggle handler with query string preservation
  const isKrMode = pathname.startsWith("/kr");

  const getLocalizedPath = (path: string) => {
    if (isKrMode) {
      return path === "/" ? "/kr" : `/kr${path}`;
    }
    return path;
  };

  // Show back button on detail pages (not on home page)
  const isRootPath = pathname === "/" || pathname === "/kr";
  const showBackButton = !isRootPath;

  const handleBack = () => {
    if (window.history.length > 1) {
      router.back();
    } else {
      router.push(getLocalizedPath("/"));
    }
  };

  const handleLanguageToggle = () => {
    let newPath: string;
    let newLocale: "en" | "kr";
    
    if (isKrMode) {
      newLocale = "en";
      newPath = pathname.replace(/^\/kr/, "") || "/";
      newPath = newPath.replace(/(-kr)(\/|$)/g, "$2");
    } else {
      newLocale = "kr";
      const basePath = pathname === "/" ? "/kr" : `/kr${pathname}`;
      if (pathname.match(/^\/(guides|routes)\/[^\/]+$/)) {
        newPath = basePath + "-kr";
      } else {
        newPath = basePath;
      }
    }
    
    // Persist choice so middleware geo-redirect respects it
    document.cookie = `airoute-locale=${newLocale};path=/;max-age=${60 * 60 * 24 * 365};samesite=lax`;

    const queryString = searchParams.toString();
    if (queryString) {
      newPath = `${newPath}?${queryString}`;
    }
    
    router.push(newPath);
  };

  const navItems: { href: string; label: string; exact?: boolean }[] = [
    { href: getLocalizedPath("/"), label: isKrMode ? "홈" : "Home", exact: true },
    { href: getLocalizedPath("/routes"), label: isKrMode ? "루트" : "Routes" },
    { href: getLocalizedPath("/guides"), label: isKrMode ? "가이드" : "Guides" },
    ...(demoMode ? [] : [{ href: getLocalizedPath("/workspace"), label: isKrMode ? "워크스페이스" : "Workspace" }]),
  ];

  const loginLabel = isKrMode ? "로그인" : "Log in";
  const signUpLabel = isKrMode ? "무료로 시작하기" : "Sign up";
  const signUpHref = isKrMode ? "/kr/start" : getLocalizedPath("/signup");
  const logoutLabel = isKrMode ? "로그아웃" : "Log out";
  const authReady = !loading && authStatus !== "loading";
  const showAuthActions = mounted && authReady;
  
  const handleLogout = async (event: MouseEvent<HTMLButtonElement>) => {
    event.preventDefault();
    event.stopPropagation();

    if (isSigningOutRef.current) {
      if (__DEV__) console.log('[Header] Sign out already in progress, ignoring click');
      return;
    }

    isSigningOutRef.current = true;
    markExplicitSignOut();

    try {
      if (__DEV__) console.log('[Header] Calling signOut...');
      await signOut();
      if (__DEV__) console.log('[Header] signOut completed');
    } catch (err) {
      console.error('[Header] Sign out failed:', err);
    } finally {
      clearSupabaseAuthStorage();
      if (typeof window !== "undefined") {
        const redirectTarget = isKrMode ? "/kr/login" : "/login";
        window.location.href = redirectTarget;
      }
      setTimeout(() => {
        isSigningOutRef.current = false;
      }, 1000);
    }
  };

  return (
    <header className="sticky top-0 z-30 h-16 border-b border-border bg-background/90 backdrop-blur transition-all">
      <div className="mx-auto flex h-full max-w-5xl items-center justify-between px-4 md:px-6">
        {/* Left: Back Button or Logo */}
        {showBackButton ? (
          <button
            onClick={handleBack}
            className="flex items-center gap-2 text-sm font-medium text-muted-foreground transition hover:text-foreground md:hidden"
          >
            <span>←</span>
            <span>{isKrMode ? "뒤로" : "Back"}</span>
          </button>
        ) : null}

        {/* Logo (always visible on desktop) */}
        <Link href={getLocalizedPath("/")} className="flex items-center gap-2 shrink-0 min-w-[120px]">
          {/* Logo Symbol */}
          <div className="relative h-8 w-8 shrink-0 md:h-10 md:w-10">
            <Image 
              src="/logo/airoute-symbol.png" 
              alt="Airoute Symbol" 
              fill
              className="object-contain"
              priority
              unoptimized
            />
          </div>
          {/* Logo Text - Theme adaptive */}
          <span className="whitespace-nowrap text-base font-semibold tracking-tight md:text-lg">
            <span className="text-foreground">AI</span>
            <span className="text-primary">ROUTE</span>
          </span>
        </Link>

        {/* Center: Desktop Navigation Menu */}
        <nav className="hidden md:flex items-center gap-6">
          {navItems.map((item) => {
            const isActive = item.exact ? pathname === item.href : pathname.startsWith(item.href);
            return (
              <Link
                key={item.href}
                href={item.href}
                className={`text-sm font-medium transition ${
                  isActive ? "text-primary" : "text-muted-foreground hover:text-foreground"
                }`}
              >
                {item.label}
              </Link>
            );
          })}
        </nav>

        {/* Right: Language Toggle + Theme Toggle + Sign Up CTA or User Menu */}
        <div className="flex items-center gap-2">
          {/* Language Toggle */}
          <button
            onClick={handleLanguageToggle}
            className="flex h-9 items-center gap-1.5 rounded-lg border border-border bg-card px-2.5 transition hover:bg-muted"
            aria-label="Toggle language"
            title={isKrMode ? "Global로 전환" : "KR로 전환"}
          >
            <Globe className="h-3.5 w-3.5 text-muted-foreground" />
            <span className="text-xs font-medium text-foreground">
              {isKrMode ? "KR" : "Global"}
            </span>
          </button>

          {/* Theme Toggle Button */}
          <button
            onClick={toggleTheme}
            className="flex h-9 w-9 items-center justify-center rounded-lg border border-border bg-card transition hover:bg-muted"
            aria-label="Toggle theme"
          >
            {mounted ? (
              theme === "day" ? (
                <Moon className="h-4 w-4 text-muted-foreground" />
              ) : (
                <Sun className="h-4 w-4 text-muted-foreground" />
              )
            ) : (
              <span className="h-4 w-4" aria-hidden />
            )}
          </button>

          {!demoMode && (
            showAuthActions ? (
              user ? (
                <button
                  type="button"
                  onClick={handleLogout}
                  disabled={isSigningOutRef.current}
                  className="rounded-full border border-border bg-transparent px-3 py-1.5 text-xs font-medium text-foreground transition hover:border-destructive hover:text-destructive cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
                  style={{ pointerEvents: "auto" }}
                >
                  {logoutLabel}
                </button>
              ) : (
                <>
                  <button
                    onClick={() => router.push(getLocalizedPath("/login"))}
                    className="rounded-full border border-border bg-transparent px-3 py-1.5 text-xs font-medium text-foreground transition hover:border-primary hover:text-primary"
                  >
                    {loginLabel}
                  </button>
                  <button
                    onClick={() => router.push(signUpHref)}
                    className="rounded-full border border-border bg-transparent px-3 py-1.5 text-xs font-medium text-foreground transition hover:border-primary hover:text-primary"
                  >
                    {signUpLabel}
                  </button>
                </>
              )
            ) : (
              <div className="flex items-center gap-2">
                <span className="block h-9 w-24 rounded-full bg-border/30" aria-hidden />
                <span className="block h-9 w-24 rounded-full bg-border/30" aria-hidden />
              </div>
            )
          )}
        </div>
      </div>
    </header>
  );
}
