"use client";

import { useState } from "react";
import { Copy, Check } from "lucide-react";
import { useTheme } from "@/app/_design/providers/theme-provider";
import { cn } from "@/lib/utils";

export function CopyLinkButton() {
  const { theme } = useTheme();
  const [copied, setCopied] = useState(false);

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(window.location.href);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (err) {
      console.error("Failed to copy:", err);
    }
  };

  return (
    <button
      type="button"
      onClick={handleCopy}
      className={cn(
        "inline-flex items-center justify-center gap-2 rounded-xl border px-6 py-3 text-sm font-medium transition",
        theme === "day"
          ? "border-slate-300 bg-white text-slate-700 hover:border-slate-400 hover:text-slate-900"
          : "border-slate-700 bg-slate-900/60 text-slate-200 hover:border-slate-600 hover:text-slate-100"
      )}
    >
      {copied ? (
        <>
          <Check className={cn(
            "h-4 w-4",
            theme === "day" ? "text-emerald-600" : "text-emerald-400"
          )} />
          Copied!
        </>
      ) : (
        <>
          <Copy className="h-4 w-4" />
          Copy tool link
        </>
      )}
    </button>
  );
}

