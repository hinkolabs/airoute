"use client";

import { useState, useEffect, useMemo } from "react";
import { getToolLogoUrl, getToolInitial } from "@/lib/getToolLogoUrl";

type ToolForLogo = {
  image?: string | null;
  website_url?: string | null;
  websiteUrl?: string | null;
  url?: string | null;
  name?: string | null;
  slug?: string | null;
};

type ToolLogoProps = {
  tool: ToolForLogo | null | undefined;
  size?: number;
  className?: string;
};

function extractDomainSafe(url?: string | null) {
  if (!url) return null;
  try {
    const u = new URL(url);
    return u.hostname.replace(/^www\./, "");
  } catch {
    return null;
  }
}

/**
 * ToolLogo - Automatic logo loading with fallback (SSR-safe)
 * 
 * Priority:
 * 1. tool.image (manual)
 * 2. logo.dev based on tool.website_url domain
 * 3. Clearbit logo API
 * 4. Google favicon
 * 5. Placeholder (first letter)
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
  const [isMounted, setIsMounted] = useState(false);
  const [idx, setIdx] = useState(0);
  const [imageError, setImageError] = useState(false);

  // SSR safety: only render after client mount
  useEffect(() => {
    setIsMounted(true);
  }, []);

  const toolName = tool?.name ?? tool?.slug ?? "tool";
  const websiteUrl = tool?.website_url ?? tool?.websiteUrl ?? tool?.url ?? null;
  const domain = extractDomainSafe(websiteUrl);

  // Safe getters that never throw
  const primary = useMemo(() => getToolLogoUrl(tool), [tool]);
  const initial = useMemo(() => getToolInitial(tool), [tool]);

  // Build fallback candidates
  const candidates = useMemo(() => {
    const list: string[] = [];
    if (domain) {
      list.push(`https://www.google.com/s2/favicons?domain=${domain}&sz=128`);
    }
    return list;
  }, [domain]);

  // Reset on tool change
  useEffect(() => {
    setIdx(0);
    setImageError(false);
  }, [tool?.slug, tool?.name, websiteUrl, primary]);

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

  const src = candidates[idx] || null;

  // Show placeholder if no candidates or all failed
  const showPlaceholder = !src || imageError;

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
      src={src}
      alt={`${toolName} logo`}
      loading="lazy"
      referrerPolicy="no-referrer"
      onError={(e) => {
        // Try next candidate before giving up
        if (idx < candidates.length - 1) {
          setIdx((v) => v + 1);
          return;
        }
        setImageError(true);
      }}
      className={`rounded-lg bg-slate-800/50 object-contain ${className}`}
      style={boxStyle}
    />
  );
}
