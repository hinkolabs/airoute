"use client";

import Link from "next/link";
import { Sun, Moon } from "lucide-react";
import { useTheme } from "@/app/_design/providers/theme-provider";
import { DesktopNav, ModeSwitch } from "./page";
import { cn } from "@/lib/utils";

export function HeaderClient() {
  const { theme, toggleTheme } = useTheme();

  return (
    <header
      className={cn(
        "sticky top-0 z-30 border-b backdrop-blur transition-colors",
        theme === "day"
          ? "border-slate-200 bg-white/90 shadow-sm"
          : "border-slate-800/70 bg-[#020617]/90"
      )}
    >
      <div className="mx-auto flex max-w-7xl items-center justify-between px-4 py-2 sm:py-3">
        {/* Logo */}
        <Link href="/" className="flex items-center gap-2">
          <div className="inline-flex items-center rounded-xl px-2 py-1">
            <img
              src="/logo/airoute-logo.png"
              alt="AIROUTE logo"
              className={cn(
                "h-6 w-auto sm:h-7",
                theme === "day" ? "brightness-0" : "brightness-100"
              )}
            />
          </div>
        </Link>

        {/* Right side: Nav + Theme Toggle */}
        <div className="flex items-center gap-3">
          {/* Mobile Mode Toggle (visible on mobile only, top-right, scaled down) */}
          <div className="flex sm:hidden scale-90 origin-right pr-1">
            <ModeSwitch />
          </div>

          {/* Desktop Navigation (hidden on mobile) */}
          <DesktopNav />

          {/* Theme Toggle Button (Desktop only) */}
          <button
            onClick={toggleTheme}
            className={cn(
              "hidden items-center gap-1.5 rounded-full border px-3 py-1.5 text-xs font-medium transition md:inline-flex",
              theme === "day"
                ? "border-slate-300 bg-white/80 text-slate-700 shadow-sm hover:bg-slate-100"
                : "border-slate-700 bg-slate-900/60 text-slate-300 hover:bg-slate-800"
            )}
          >
            {theme === "day" ? (
              <>
                <Sun className="h-3.5 w-3.5" />
                <span>Day</span>
              </>
            ) : (
              <>
                <Moon className="h-3.5 w-3.5" />
                <span>Night</span>
              </>
            )}
          </button>
        </div>
      </div>
    </header>
  );
}

