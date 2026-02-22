"use client";

import { useState } from "react";
import { Copy, Check } from "lucide-react";

export function CopyLinkButton() {
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
      className="inline-flex items-center justify-center gap-2 rounded-xl border border-border bg-card px-6 py-3 text-sm font-medium text-foreground transition hover:border-primary hover:text-primary"
    >
      {copied ? (
        <>
          <Check className="h-4 w-4 text-primary" />
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
