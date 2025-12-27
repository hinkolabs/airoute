"use client";

import Link from "next/link";
import Image from "next/image";
import { usePathname, useRouter } from "next/navigation";
import { useCallback } from "react";

// ============================================================
// OpenArt Style Header - Conversion Focused
// Structure: [Logo Image + Text + Sign up Button]
// ============================================================
export default function Header() {
  const pathname = usePathname();
  const router = useRouter();

  // Show back button on detail pages (not on home page)
  const showBackButton = pathname !== "/";

  const handleBack = () => {
    if (window.history.length > 1) {
      router.back();
    } else {
      router.push("/");
    }
  };

  return (
    <header className="sticky top-0 z-30 h-16 border-b border-gray-800 bg-background/90 backdrop-blur transition-all">
      <div className="mx-auto flex h-full max-w-5xl items-center justify-between px-4 md:px-6">
        {/* Left: Back Button or Logo */}
        {showBackButton ? (
          <button
            onClick={handleBack}
            className="flex items-center gap-2 text-sm font-medium text-slate-300 transition hover:text-white md:hidden"
          >
            <span>←</span>
            <span>Back</span>
          </button>
        ) : null}

        {/* Logo (always visible on desktop) */}
        <Link href="/" className="flex items-center gap-2 shrink-0 min-w-[120px]">
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
          {/* Logo Text with Neon Gradient */}
          <span className="whitespace-nowrap text-base font-semibold tracking-tight md:text-lg">
            <span className="text-white">AI</span>
            <span className="text-emerald-400">ROUTE</span>
          </span>
        </Link>

        {/* Center: Desktop Navigation Menu */}
        <nav className="hidden md:flex items-center gap-6">
          <Link
            href="/"
            className={`text-sm font-medium transition ${
              pathname === "/" ? "text-emerald-400" : "text-slate-300 hover:text-white"
            }`}
          >
            Home
          </Link>
          <Link
            href="/routes"
            className={`text-sm font-medium transition ${
              pathname.startsWith("/routes") ? "text-emerald-400" : "text-slate-300 hover:text-white"
            }`}
          >
            Routes
          </Link>
          <Link
            href="/guides"
            className={`text-sm font-medium transition ${
              pathname.startsWith("/guides") ? "text-emerald-400" : "text-slate-300 hover:text-white"
            }`}
          >
            Guides
          </Link>
          <Link
            href="/studio"
            className={`text-sm font-medium transition ${
              pathname === "/studio" ? "text-emerald-400" : "text-slate-300 hover:text-white"
            }`}
          >
            Studio
          </Link>
          <Link
            href="/my?comingSoon=1"
            className={`text-sm font-medium transition ${
              pathname.startsWith("/my") ? "text-emerald-400" : "text-slate-300 hover:text-white"
            }`}
          >
            My
          </Link>
        </nav>

        {/* Right: Sign Up CTA */}
        <div className="flex items-center gap-4">
          <button
            onClick={() => router.push("/auth/coming-soon")}
            className="rounded-full border border-slate-700 bg-transparent px-3 py-1.5 text-xs font-medium text-slate-100 transition hover:border-emerald-400 hover:text-emerald-300"
          >
            Sign up
          </button>
        </div>
      </div>
    </header>
  );
}
