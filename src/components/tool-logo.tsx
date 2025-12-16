"use client";

import { useState } from "react";

type ToolLogoProps = {
  src?: string | null;
  name: string;
  websiteUrl?: string | null;
  size?: number;
  className?: string;
};

/**
 * ToolLogo - Automatic logo loading with fallback
 * 
 * Priority:
 * 1. Renders src (from getToolLogoUrl)
 * 2. On error, shows placeholder (first letter of name)
 * 
 * Usage:
 * <ToolLogo src={getToolLogoUrl(tool)} name={tool.name} />
 */
export function ToolLogo({
  src,
  name,
  size = 40,
  className = "",
}: ToolLogoProps) {
  const [imageError, setImageError] = useState(false);

  // Show placeholder if no src or image failed
  const showPlaceholder = !src || imageError;

  if (showPlaceholder) {
    // Fallback: First letter placeholder
    const initial = name.charAt(0).toUpperCase();
    return (
      <div
        className={`flex items-center justify-center rounded-lg bg-emerald-500/20 font-semibold text-emerald-300 ${className}`}
        style={{
          width: size,
          height: size,
          fontSize: Math.round(size * 0.4),
        }}
      >
        {initial}
      </div>
    );
  }

  // Try rendering image
  return (
    <img
      src={src}
      alt={`${name} logo`}
      onError={() => setImageError(true)}
      className={`rounded-lg bg-slate-800/50 object-contain ${className}`}
      style={{
        width: size,
        height: size,
      }}
    />
  );
}

