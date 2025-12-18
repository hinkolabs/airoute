"use client";

import { useState, useEffect, useMemo } from "react";
import { getToolLogoUrl, getToolInitial } from "@/lib/getToolLogoUrl";

type ToolForLogo = {
  image?: string | null;
  website_url?: string | null;
  websiteUrl?: string | null;
  name?: string | null;
  slug?: string | null;
};

type ToolLogoProps = {
  tool: ToolForLogo | null | undefined;
  size?: number;
  className?: string;
};

/**
 * ToolLogo - Automatic logo loading with fallback (SSR-safe)
 * 
 * Priority:
 * 1. tool.image (manual)
 * 2. logo.dev based on tool.website_url domain
 * 3. On error or missing data, shows placeholder (first letter)
 * 
 * SSR Safety:
 * - Returns null during SSR (typeof window === 'undefined')
 * - All URL parsing is in try/catch
 * - Never throws
 * 
 * Usage:
 * <ToolLogo tool={tool} size={40} />
 */
export function ToolLogo({
  tool,
  size = 40,
  className = "",
}: ToolLogoProps) {
  const [imageError, setImageError] = useState(false);
  const [isMounted, setIsMounted] = useState(false);

  // SSR safety: only render after client mount
  useEffect(() => {
    setIsMounted(true);
  }, []);

  // Safe getters that never throw
  const logoUrl = useMemo(() => getToolLogoUrl(tool), [tool]);
  const initial = useMemo(() => getToolInitial(tool), [tool]);
  const toolName = tool?.name ?? tool?.slug ?? "tool";

  const boxStyle = {
    width: size,
    height: size,
    minWidth: size,
    minHeight: size,
  } as const;

  // SSR: return placeholder skeleton to avoid hydration mismatch
  if (!isMounted) {
    return (
      <div
        className={`flex items-center justify-center rounded-lg bg-slate-800/50 ${className}`}
        style={boxStyle}
        aria-label={`${toolName} logo`}
      />
    );
  }

  // Show placeholder if no logoUrl or image failed
  const showPlaceholder = !logoUrl || imageError;

  if (showPlaceholder) {
    // Fallback: First letter placeholder
    return (
      <div
        className={`flex items-center justify-center rounded-lg bg-emerald-500/20 font-semibold text-emerald-300 ${className}`}
        style={{
          ...boxStyle,
          fontSize: Math.round(size * 0.4),
        }}
        aria-label={`${toolName} logo`}
      >
        {initial}
      </div>
    );
  }

  // Try rendering image
  return (
    // eslint-disable-next-line @next/next/no-img-element
    <img
      src={logoUrl}
      alt={`${toolName} logo`}
      loading="lazy"
      referrerPolicy="no-referrer"
      onError={() => setImageError(true)}
      className={`rounded-lg bg-slate-800/50 object-contain ${className}`}
      style={boxStyle}
    />
  );
}
