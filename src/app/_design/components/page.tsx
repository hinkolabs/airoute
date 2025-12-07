"use client";

import React from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";
import { PageShell as BasePageShell } from "./ui/page-shell";
import { SectionTitle as BaseSectionTitle } from "./ui/section-title";
import { Chip } from "./ui/chip";
import { Badge } from "./ui/badge";
import { Button } from "./ui/button";
import { Home, FileText, Sparkles, User } from "lucide-react";
import { useTheme, type Theme } from "@/app/_design/providers/theme-provider";

// Re-export for easy use in pages
export const PageShell = BasePageShell;
export const SectionTitle = BaseSectionTitle;

// ============================================================
// SearchBar - Flat, simple, friendly (Theme-aware)
// ============================================================
type SearchBarProps = {
  value: string;
  placeholder?: string;
  onChange: (value: string) => void;
};

export function SearchBar({
  value,
  placeholder = 'e.g. "remove background", "write email"',
  onChange,
}: SearchBarProps) {
  const { theme } = useTheme();

  return (
    <div className="relative">
      <input
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        className={cn(
          "w-full rounded-xl border px-4 py-3 pl-10 text-sm shadow-sm outline-none ring-0 focus:border-emerald-400",
          theme === "day"
            ? "border-slate-300 bg-white text-slate-900 placeholder:text-slate-400"
            : "border-slate-700/70 bg-slate-900/70 text-slate-100 placeholder:text-slate-400"
        )}
      />
      <div
        className={cn(
          "pointer-events-none absolute inset-y-0 left-3 flex items-center",
          theme === "day" ? "text-slate-400" : "text-slate-500"
        )}
      >
        <span className="text-[13px]">⌕</span>
      </div>
    </div>
  );
}

// ============================================================
// CategoryChips - Calm, flat, scrollable
// ============================================================
type CategoryChipsProps = {
  categories: { id: string; label: string }[];
  activeId: string | null;
  onChange: (id: string | null) => void;
};

export function CategoryChips({
  categories,
  activeId,
  onChange,
}: CategoryChipsProps) {
  return (
    <div className="flex gap-2 overflow-x-auto pb-1 pt-1 text-sm">
      <Chip
        active={activeId === null}
        onClick={() => onChange(null)}
        className="px-3 py-1.5"
      >
        All
      </Chip>
      {categories.map((cat) => (
        <Chip
          key={cat.id}
          active={activeId === cat.id}
          onClick={() => onChange(cat.id)}
          className="px-3 py-1.5"
        >
          {cat.label}
        </Chip>
      ))}
    </div>
  );
}

// ============================================================
// ToolCard - Spacious, relaxed typography, with CTAs (Theme-aware)
// ============================================================
export type ToolCardProps = {
  name: string;
  description: string;
  category: string;
  tags?: string[];
  badge?: string;
  href?: string; // external official site
  detailsHref?: string; // internal detail page
  variant?: "default" | "compact";
};

export function ToolCard({
  name,
  description,
  category,
  tags,
  badge,
  href,
  detailsHref,
  variant = "default",
}: ToolCardProps) {
  const { theme } = useTheme();
  const isCompact = variant === "compact";

  return (
    <article
      className={cn(
        "flex flex-col rounded-2xl border shadow-sm transition hover:border-emerald-400/70 hover:shadow-md",
        isCompact ? "p-4 sm:p-5" : "p-5",
        theme === "day"
          ? "border-slate-200 bg-white"
          : "border-slate-800/80 bg-[#0F172A]/90"
      )}
    >
      <div className={cn("flex items-start justify-between gap-3", isCompact ? "mb-2" : "mb-3")}>
        <div className="space-y-1">
          <h3
            className={cn(
              "font-semibold",
              isCompact ? "text-sm sm:text-base" : "text-base",
              theme === "day" ? "text-slate-900" : "text-slate-50"
            )}
          >
            {name}
          </h3>
          <p
            className={cn(
              "leading-relaxed",
              isCompact ? "text-xs line-clamp-2" : "text-xs sm:text-sm",
              theme === "day" ? "text-slate-600" : "text-slate-400"
            )}
          >
            {description}
          </p>
        </div>
        {badge && (
          <Badge variant="accent" className={cn(isCompact ? "text-[9px]" : "text-[10px]")}>
            {badge}
          </Badge>
        )}
      </div>

      <div className={cn("mt-auto space-y-3", isCompact ? "pt-2" : "pt-4")}>
        <div
          className={cn(
            "flex items-center justify-between gap-2 text-xs",
            isCompact && "hidden sm:flex",
            theme === "day" ? "text-slate-500" : "text-slate-400"
          )}
        >
          <span
            className={cn(
              "rounded-full px-2 py-1 text-[11px]",
              theme === "day"
                ? "bg-slate-100 text-slate-700"
                : "bg-slate-900/60 text-slate-200"
            )}
          >
            {category}
          </span>
          {tags && tags.length > 0 && (
            <div className="flex flex-wrap justify-end gap-1">
              {tags.slice(0, 3).map((tag) => (
                <span
                  key={tag}
                  className={cn(
                    "rounded-full px-2 py-0.5 text-[10px]",
                    theme === "day"
                      ? "bg-slate-100 text-slate-500"
                      : "bg-slate-900/40 text-slate-400"
                  )}
                >
                  #{tag}
                </span>
              ))}
            </div>
          )}
        </div>

        {(href || detailsHref) && (
          <div className={cn("flex flex-wrap items-center gap-2", isCompact && "mt-2")}>
            {href && (
              <Link href={href} target="_blank" rel="noreferrer">
                <Button
                  variant="primary"
                  className={cn(
                    "font-semibold",
                    isCompact ? "h-7 px-2.5 text-xs" : "h-8 px-3 text-xs"
                  )}
                >
                  Visit
                </Button>
              </Link>
            )}
            {detailsHref && (
              <Link
                href={detailsHref}
                className={cn(
                  "underline-offset-2 hover:underline",
                  isCompact ? "text-[11px]" : "text-xs",
                  theme === "day"
                    ? "text-slate-600 hover:text-emerald-600"
                    : "text-slate-300 hover:text-emerald-300"
                )}
              >
                Details
              </Link>
            )}
          </div>
        )}
      </div>
    </article>
  );
}

// ============================================================
// EmptyState - Friendly empty message (Theme-aware)
// ============================================================
type EmptyStateProps = {
  message?: React.ReactNode;
};

export function EmptyState({ message }: EmptyStateProps) {
  const { theme } = useTheme();

  return (
    <div
      className={cn(
        "flex min-h-[140px] items-center justify-center rounded-2xl border border-dashed px-4 text-center text-sm",
        theme === "day"
          ? "border-slate-300 bg-slate-100/50 text-slate-500"
          : "border-slate-700/70 bg-slate-900/30 text-slate-400"
      )}
    >
      {message || (
        <>
          No tools match your filters yet.
          <br className="hidden sm:block" />
          Try removing the category filter or using a broader search term.
        </>
      )}
    </div>
  );
}

// ============================================================
// Navigation - Theme color helpers
// ============================================================

/**
 * Determine current mode based on pathname.
 * Simple mode: pathname starts with "/simple"
 * Explore mode: everything else (default)
 */
function useCurrentMode(pathname: string): "explore" | "simple" {
  return pathname.startsWith("/simple") ? "simple" : "explore";
}

// ============================================================
// Mobile Navigation Items
// ============================================================
type MobileNavItem = {
  label: string;
  href: string;
  icon: React.ComponentType<{ className?: string }>;
};

const MOBILE_NAV_ITEMS: MobileNavItem[] = [
  { label: "Home", href: "/", icon: Home },
  { label: "Guides", href: "/guides", icon: FileText },
  { label: "Studio", href: "/studio", icon: Sparkles },
  { label: "My", href: "/my", icon: User },
];

// Desktop nav links (after mode toggle)
type NavLink = {
  label: string;
  href: string;
};

const DESKTOP_NAV_LINKS: NavLink[] = [
  { label: "Guides", href: "/guides" },
  { label: "Tools", href: "/tools" },
];

// ============================================================
// ModeSwitch - Reusable Normal/Simple mode toggle (same style for web & mobile)
// ============================================================
type ModeSwitchProps = {
  className?: string;
};

export function ModeSwitch({ className }: ModeSwitchProps) {
  const pathname = usePathname();
  const { theme } = useTheme();
  const mode = useCurrentMode(pathname);
  const isExploreMode = mode === "explore";

  const isNormalActive = pathname === "/" || (isExploreMode && pathname !== "/simple");
  const isSimpleActive = pathname === "/simple";

  return (
    <div
      className={cn(
        "inline-flex gap-1 rounded-full border px-1 py-1 transition-colors",
        theme === "day"
          ? "border-slate-200 bg-white/80"
          : isExploreMode
            ? "border-emerald-500/50 bg-emerald-500/10"
            : "border-amber-400/50 bg-amber-400/10",
        className
      )}
    >
      <Link
        href="/"
        className={cn(
          "rounded-full px-3 py-1.5 text-xs font-medium border transition-colors",
          isNormalActive
            ? theme === "day"
              ? "bg-emerald-500 text-white border-emerald-500 shadow-sm"
              : "bg-emerald-400/20 text-emerald-200 border-emerald-400/40"
            : theme === "day"
              ? "bg-white text-slate-600 border-transparent hover:text-slate-900"
              : "bg-transparent text-slate-300 border-transparent hover:text-slate-100"
        )}
      >
        Normal
      </Link>
      <Link
        href="/simple"
        className={cn(
          "rounded-full px-3 py-1.5 text-xs font-medium border transition-colors",
          isSimpleActive
            ? theme === "day"
              ? "bg-amber-400 text-slate-900 border-amber-400 shadow-sm"
              : "bg-amber-300/20 text-amber-100 border-amber-300/40"
            : theme === "day"
              ? "bg-white text-slate-600 border-transparent hover:text-slate-900"
              : "bg-transparent text-slate-300 border-transparent hover:text-slate-100"
        )}
      >
        Simple
      </Link>
    </div>
  );
}

// ============================================================
// DesktopNav - Desktop-only top navigation (md and above) (Theme-aware)
// ============================================================
export function DesktopNav() {
  const pathname = usePathname();
  const { theme } = useTheme();
  const mode = useCurrentMode(pathname);
  const isExploreMode = mode === "explore";

  return (
    <nav className="hidden items-center gap-4 md:flex">
      {/* Normal / Simple Mode Toggle Switch */}
      <ModeSwitch />

      {/* Reports / Tools Links */}
      {DESKTOP_NAV_LINKS.map((item) => {
        const isActive = pathname === item.href;
        return (
          <Link
            key={item.href}
            href={item.href}
            className={cn(
              "rounded-full px-3 py-1 text-xs font-medium transition",
              isActive
                ? isExploreMode
                  ? theme === "day"
                    ? "text-emerald-600"
                    : "text-emerald-400"
                  : theme === "day"
                  ? "text-amber-600"
                  : "text-amber-300"
                : theme === "day"
                ? "text-slate-600 hover:text-slate-900"
                : "text-slate-300 hover:text-slate-100"
            )}
          >
            {item.label}
          </Link>
        );
      })}

      {/* My button (replaces Login) */}
      <Link
        href="/my"
        className={cn(
          "ml-1 rounded-full border px-3 py-1 text-xs font-semibold transition",
          pathname === "/my"
            ? isExploreMode
              ? theme === "day"
                ? "border-emerald-500 text-emerald-600"
                : "border-emerald-400 text-emerald-300"
              : theme === "day"
              ? "border-amber-500 text-amber-600"
              : "border-amber-400 text-amber-300"
            : theme === "day"
            ? "border-slate-400 text-slate-700 hover:border-emerald-500 hover:text-emerald-600"
            : "border-slate-600 text-slate-100 hover:border-emerald-400 hover:text-emerald-300"
        )}
      >
        My
      </Link>
    </nav>
  );
}

// ============================================================
// MobileBottomNav - Mobile-only bottom tab navigation (Theme-aware)
// ============================================================
export function MobileBottomNav() {
  const pathname = usePathname();
  const { theme } = useTheme();
  const mode = useCurrentMode(pathname);
  const isExploreMode = mode === "explore";

  return (
    <nav
      className={cn(
        "fixed inset-x-0 bottom-0 z-40 border-t backdrop-blur sm:hidden",
        theme === "day"
          ? "border-slate-200/80 bg-white"
          : "border-slate-800 bg-[#020617]/95"
      )}
    >
      <div className="mx-auto flex max-w-7xl items-center justify-around px-4 py-2">
        {MOBILE_NAV_ITEMS.map((item) => {
          const isActive = pathname === item.href;
          const Icon = item.icon;

          // Determine active color based on current mode
          // All tabs use emerald (Normal mode) or amber (Simple mode) based on current route
          const activeTextColor = isExploreMode
            ? theme === "day" ? "text-emerald-600" : "text-emerald-400"
            : theme === "day" ? "text-amber-600" : "text-amber-300";
          const activeIndicatorColor = isExploreMode
            ? theme === "day" ? "bg-emerald-600" : "bg-emerald-400"
            : theme === "day" ? "bg-amber-600" : "bg-amber-300";

          return (
            <Link
              key={item.href}
              href={item.href}
              className={cn(
                "relative flex flex-1 flex-col items-center gap-1 rounded-lg px-2 py-1.5 transition-colors",
                isActive
                  ? cn(
                      activeTextColor,
                      theme === "day" ? "bg-slate-100" : "bg-slate-900/60"
                    )
                  : theme === "day"
                  ? "text-slate-500 hover:bg-slate-100 hover:text-slate-700"
                  : "text-slate-400 hover:bg-slate-900/40 hover:text-slate-200"
              )}
            >
              {/* Active indicator bar */}
              {isActive && (
                <div
                  className={cn(
                    "absolute -top-0.5 left-1/2 h-0.5 w-6 -translate-x-1/2 rounded-full",
                    activeIndicatorColor
                  )}
                />
              )}
              <Icon className="h-5 w-5" />
              <span className="text-[10px] font-medium">{item.label}</span>
            </Link>
          );
        })}
      </div>
    </nav>
  );
}
