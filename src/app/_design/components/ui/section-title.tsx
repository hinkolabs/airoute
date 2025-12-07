"use client";

import { cn } from "@/lib/utils";
import React from "react";
import { useTheme } from "@/app/_design/providers/theme-provider";

type SectionTitleProps = {
  eyebrow?: string;
  title: React.ReactNode;
  description?: React.ReactNode;
  className?: string;
  align?: "left" | "center";
};

export function SectionTitle({
  eyebrow,
  title,
  description,
  className,
  align = "left",
}: SectionTitleProps) {
  const { theme } = useTheme();

  return (
    <div
      className={cn(
        "space-y-2 sm:space-y-3",
        align === "center" && "text-center",
        className
      )}
    >
      {eyebrow && (
        <p
          className={cn(
            "text-[10px] sm:text-xs font-semibold uppercase tracking-[0.18em]",
            theme === "day" ? "text-emerald-600" : "text-emerald-400"
          )}
        >
          {eyebrow}
        </p>
      )}

      <h1
        className={cn(
          "text-3xl sm:text-4xl md:text-5xl font-bold leading-tight tracking-tight",
          theme === "day" ? "text-slate-900" : "text-slate-50"
        )}
      >
        {title}
      </h1>

      {description && (
        <p
          className={cn(
            "text-sm sm:text-base leading-relaxed",
            theme === "day" ? "text-slate-600" : "text-slate-300",
            align === "left" && "max-w-2xl",
            align === "center" && "max-w-2xl mx-auto"
          )}
        >
          {description}
        </p>
      )}
    </div>
  );
}
