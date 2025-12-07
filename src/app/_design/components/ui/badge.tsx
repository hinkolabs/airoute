"use client";

import { cn } from "@/lib/utils";
import React from "react";

type BadgeVariant = "default" | "accent" | "outline";

type BadgeProps = {
  children: React.ReactNode;
  className?: string;
  variant?: BadgeVariant;
};

const variantStyles: Record<BadgeVariant, string> = {
  default: "bg-slate-800/60 text-slate-300",
  accent: "bg-emerald-500/10 text-emerald-300 border border-emerald-400/60",
  outline: "border border-slate-700 text-slate-400 bg-transparent",
};

export function Badge({
  children,
  className,
  variant = "default",
}: BadgeProps) {
  return (
    <span
      className={cn(
        "inline-flex items-center rounded-full px-2.5 py-0.5",
        "text-[10px] font-semibold tracking-wide uppercase",
        variantStyles[variant],
        className
      )}
    >
      {children}
    </span>
  );
}
