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
import { Home, FileText, Sparkles, User, Star } from "lucide-react";
import { useTheme, type Theme } from "@/app/_design/providers/theme-provider";
import AffiliateLinkButton from "@/components/AffiliateLinkButton";
import { ToolLogo } from "@/components/tool-logo";

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
          "w-full rounded-xl border px-4 py-3 pl-10 text-sm shadow-sm outline-none ring-0 focus:border-primary",
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
  id: string; // tool id
  slug: string; // tool slug
  name: string;
  description: string;
  category: string;
  tags?: string[];
  badge?: string;
  href?: string; // external official site
  detailsHref?: string; // internal detail page
  variant?: "default" | "compact";
  isFavorited?: boolean; // for favorite toggle
  onFavoriteToggle?: () => void; // favorite toggle handler
  locale?: "en" | "kr";
  // For logo rendering
  image?: string | null;
  website_url?: string | null;
};

// Helper: Generate "Key use" text from category/tags
function getKeyUseText(category: string, tags?: string[], locale?: "en" | "kr"): string {
  const prefix = locale === "kr" ? "추천 용도:" : "Best for:";
  const fallback = locale === "kr" ? `${prefix} AI 워크플로우` : `${prefix} AI workflows`;

  if (category && category !== "Other") {
    return `${prefix} ${category}`;
  }
  
  if (tags && tags.length > 0) {
    const readableTags = tags.slice(0, 2).map(tag => {
      const cleaned = tag.replace(/^#/, '');
      return cleaned.charAt(0).toUpperCase() + cleaned.slice(1);
    });
    return `${prefix} ${readableTags.join(', ')}`;
  }
  
  return fallback;
}

export function ToolCard({
  id,
  slug,
  name,
  description,
  category,
  tags,
  badge,
  href,
  detailsHref,
  variant = "default",
  isFavorited = false,
  onFavoriteToggle,
  locale,
  image,
  website_url,
}: ToolCardProps) {
  const { theme } = useTheme();
  const isCompact = variant === "compact";
  const keyUse = getKeyUseText(category, tags, locale);
  const visitLabel = locale === "kr" ? "방문" : "Visit";
  const detailsLabel = locale === "kr" ? "상세 보기" : "Details";
  
  // Improve empty description text
  const displayDescription = (description === "No description available." || description === "설명 준비 중")
    ? (locale === "kr" ? "설명 준비 중입니다." : "Short summary coming soon.")
    : description;

  return (
    <article
      className={cn(
        "relative flex flex-col rounded-2xl border shadow-sm transition-all duration-200",
        "hover:-translate-y-0.5 hover:shadow-md",
        isCompact ? "p-4 sm:p-5" : "p-5",
        theme === "day"
          ? "border-slate-200 bg-white hover:border-primary/70"
          : "border-slate-800/80 bg-slate-950/35 hover:border-slate-700 hover:bg-slate-900/40"
      )}
    >
      {/* Favorite Star Button (top-right) */}
      {onFavoriteToggle && (
        <button
          onClick={(e) => {
            e.stopPropagation();
            onFavoriteToggle();
          }}
          className={cn(
            "absolute right-2 top-2 flex h-8 w-8 items-center justify-center rounded-full transition-colors",
            theme === "day"
              ? "hover:bg-slate-100"
              : "hover:bg-slate-800/50"
          )}
          aria-label={isFavorited ? "Unsave tool" : "Save tool"}
        >
          <Star
            className={cn(
              "h-4 w-4 transition-all",
              isFavorited
                ? "fill-primary stroke-primary"
                : theme === "day"
                ? "stroke-slate-400"
                : "stroke-slate-500"
            )}
          />
        </button>
      )}

      {/* Header: Logo + Name + Badge */}
      <div className={cn("flex items-start gap-3", isCompact ? "mb-2" : "mb-3", onFavoriteToggle && "pr-8")}>
        {/* Tool Logo */}
        <div className="shrink-0">
          <ToolLogo
            tool={{ image, website_url, name, slug }}
            size={40}
          />
        </div>
        
        <div className="flex-1 space-y-1.5 min-w-0">
          <h3
            className={cn(
              "font-semibold truncate",
              isCompact ? "text-sm sm:text-base" : "text-base",
              theme === "day" ? "text-slate-900" : "text-slate-50"
            )}
          >
            {name}
          </h3>
          
          {/* Key use line */}
          <p
            className={cn(
              "text-xs font-medium",
              theme === "day" ? "text-slate-700" : "text-slate-200"
            )}
          >
            {keyUse}
          </p>
        </div>
        {badge && (
          <Badge variant="accent" className={cn(isCompact ? "text-[9px]" : "text-[10px]")}>
            {badge}
          </Badge>
        )}
      </div>

      {/* Description */}
      <p
        className={cn(
          "mb-3 flex-1 leading-relaxed line-clamp-2",
          isCompact ? "text-xs" : "text-xs sm:text-sm",
          theme === "day" ? "text-slate-600" : "text-slate-400"
        )}
      >
        {displayDescription}
      </p>

      {/* Tags */}
      <div className={cn("mb-4", isCompact && "hidden sm:block")}>
        {tags && tags.length > 0 && (
          <div className="flex flex-wrap gap-1">
            {tags.slice(0, 3).map((tag) => (
              <span
                key={tag}
                className={cn(
                  "rounded-full px-2 py-0.5 text-[10px]",
                  theme === "day"
                    ? "bg-slate-100 text-slate-500"
                    : "bg-slate-900/40 text-slate-500"
                )}
              >
                #{tag}
              </span>
            ))}
          </div>
        )}
      </div>

      {/* Action buttons - Always show both */}
      <div className={cn("mt-auto flex gap-2")}>
        {/* Visit button - disabled if no href */}
        {href ? (
          <AffiliateLinkButton
            href={href}
            partnerName={name}
            placement="tool_card"
            toolSlug={slug}
            variant="ghost"
            size={isCompact ? "sm" : "md"}
            className={cn(
              "flex-1 font-semibold !bg-primary !text-primary-foreground hover:!bg-primary-hover active:!bg-primary-hover",
              isCompact ? "h-8 text-xs" : "h-9 text-sm"
            )}
          >
            {visitLabel}
          </AffiliateLinkButton>
        ) : (
          <Button
            variant="ghost"
            disabled
            className={cn(
              "flex-1 cursor-not-allowed font-semibold !bg-primary/50 !text-primary-foreground/70 opacity-50",
              isCompact ? "h-8 text-xs" : "h-9 text-sm"
            )}
          >
            {visitLabel}
          </Button>
        )}

        {/* Details button - always enabled if detailsHref exists */}
        {detailsHref && (
          <Link href={detailsHref} className="flex-1">
            <Button
              variant="secondary"
              className={cn(
                "w-full font-medium",
                isCompact ? "h-8 text-xs" : "h-9 text-sm"
              )}
            >
              {detailsLabel}
            </Button>
          </Link>
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
  { label: "Workspace", href: "/workspace", icon: User },
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
            ? "border-primary/50 bg-primary/10"
            : "border-primary/50 bg-primary/10",
        className
      )}
    >
      <Link
        href="/"
        className={cn(
          "rounded-full px-3 py-1.5 text-xs font-medium border transition-colors",
          isNormalActive
            ? theme === "day"
              ? "bg-primary text-primary-foreground border-primary shadow-sm"
              : "bg-primary/20 text-primary border-primary/40"
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
              ? "bg-primary text-primary-foreground border-primary shadow-sm"
              : "bg-primary/20 text-primary border-primary/40"
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
                ? "text-primary"
                : theme === "day"
                ? "text-slate-600 hover:text-slate-900"
                : "text-slate-300 hover:text-slate-100"
            )}
          >
            {item.label}
          </Link>
        );
      })}

      {/* Workspace button (replaces My) */}
      <Link
        href="/workspace"
        className={cn(
          "ml-1 rounded-full border px-3 py-1 text-xs font-semibold transition",
          pathname === "/workspace"
            ? "border-primary text-primary"
            : theme === "day"
            ? "border-slate-400 text-slate-700 hover:border-primary hover:text-primary"
            : "border-slate-600 text-slate-100 hover:border-primary hover:text-primary"
        )}
      >
        Workspace
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
          const activeTextColor = "text-primary";
          const activeIndicatorColor = "bg-primary";

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
