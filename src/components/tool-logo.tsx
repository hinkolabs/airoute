"use client";

import { useState, useMemo } from "react";
import { getToolLogoUrl, getToolInitial } from "@/lib/getToolLogoUrl";

type ToolForLogo = {
  image?: string | null;
  website_url?: string | null;
  websiteUrl?: string | null;
  name?: string | null;
  slug?: string | null;
};

type ToolLogoProps = {
  tool: ToolForLogo;
  size?: number;
  className?: string;
};

/**
 * ToolLogo - Automatic logo loading with fallback
 * 
 * Priority:
 * 1. tool.image (manual)
 * 2. logo.dev based on tool.website_url domain
 * 3. On error or missing data, shows placeholder (first letter)
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

  const logoUrl = useMemo(() => getToolLogoUrl(tool), [tool]);
  const initial = useMemo(() => getToolInitial(tool), [tool]);

  // Show placeholder if no logoUrl or image failed
  const showPlaceholder = !logoUrl || imageError;

  const boxStyle = {
    width: size,
    height: size,
    minWidth: size,
    minHeight: size,
  } as const;

  if (showPlaceholder) {
    // Fallback: First letter placeholder
    return (
      <div
        className={`flex items-center justify-center rounded-lg bg-emerald-500/20 font-semibold text-emerald-300 ${className}`}
        style={{
          ...boxStyle,
          fontSize: Math.round(size * 0.4),
        }}
        aria-label={`${tool.name ?? tool.slug ?? "tool"} logo`}
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
      alt={`${tool.name ?? tool.slug ?? "tool"} logo`}
      loading="lazy"
      referrerPolicy="no-referrer"
      onError={() => setImageError(true)}
      className={`rounded-lg bg-slate-800/50 object-contain ${className}`}
      style={boxStyle}
    />
  );
}
