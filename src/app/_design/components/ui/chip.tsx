"use client";

import { cn } from "@/lib/utils";
import React from "react";
import { useTheme } from "@/app/_design/providers/theme-provider";

type ChipProps = {
  active?: boolean;
  children: React.ReactNode;
  onClick?: () => void;
  className?: string;
  leadingIcon?: React.ReactNode;
};

export function Chip({
  active = false,
  children,
  onClick,
  className,
  leadingIcon,
}: ChipProps) {
  const { theme } = useTheme();

  return (
    <button
      type="button"
      onClick={onClick}
      className={cn(
        "inline-flex items-center gap-1.5 whitespace-nowrap",
        "rounded-full border px-3 py-1.5 text-sm font-medium",
        "transition-colors duration-150",
        "focus:outline-none focus-visible:ring-2 focus-visible:ring-emerald-500 focus-visible:ring-offset-2",
        theme === "day"
          ? "focus-visible:ring-offset-slate-50"
          : "focus-visible:ring-offset-slate-950",
        // Default state (theme-aware)
        theme === "day"
          ? "border-slate-300 bg-white text-slate-600 hover:border-slate-400 hover:bg-slate-50"
          : "border-slate-700 bg-slate-900/40 text-slate-300 hover:border-slate-500 hover:bg-slate-800/50",
        // Active state (theme-aware)
        active &&
          (theme === "day"
            ? "border-emerald-500 bg-emerald-500/10 text-emerald-700 hover:border-emerald-500 hover:bg-emerald-500/15"
            : "border-emerald-400 bg-emerald-500/10 text-emerald-300 hover:border-emerald-400 hover:bg-emerald-500/15"),
        className
      )}
    >
      {leadingIcon && <span className="flex-shrink-0">{leadingIcon}</span>}
      {children}
    </button>
  );
}
