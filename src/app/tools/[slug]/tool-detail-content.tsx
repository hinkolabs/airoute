"use client";

import { useEffect } from "react";
import Link from "next/link";
import { ExternalLink, Sparkles, Tag, ArrowLeft } from "lucide-react";
import { CopyLinkButton } from "./copy-link-button";
import type { ToolRecord } from "@/lib/tools";

// ============================================================
// Helpers
// ============================================================
function categoryLabelFromId(categoryId: string | null): string {
  if (!categoryId) return "Other";
  const map: Record<string, string> = {
    chat: "Chat & Text",
    image: "Image & Design",
    video: "Video & Editing",
    music: "Music & Audio",
  };
  return map[categoryId] ?? "Other";
}

function filterDisplayTags(tags: string[] | null | undefined): string[] {
  if (!tags) return [];
  return tags.filter((tag) => /[A-Za-z0-9]/.test(tag));
}

// ============================================================
// Not Found Content
// ============================================================
export function ToolNotFoundContent() {
  // Scroll to top when component mounts
  useEffect(() => {
    window.scrollTo(0, 0);
  }, []);

  return (
    <div className="min-h-screen bg-slate-950 px-4 py-20 text-slate-50">
      <div className="mx-auto flex max-w-4xl flex-col items-center justify-center text-center">
        <div className="mb-4 text-6xl">🔍</div>
        <h1 className="mb-2 text-2xl font-bold">Tool Not Found</h1>
        <p className="mb-6 text-slate-400">
          This tool does not exist or has been removed.
        </p>
        <Link
          href="/"
          className="inline-flex items-center gap-2 rounded-xl bg-emerald-500 px-5 py-2.5 text-sm font-semibold text-slate-900 transition hover:bg-emerald-400"
        >
          <ArrowLeft className="h-4 w-4" />
          Back to home
        </Link>
      </div>
    </div>
  );
}

// ============================================================
// Tool Detail Content
// ============================================================
type ToolDetailContentProps = {
  tool: ToolRecord;
};

export function ToolDetailContent({ tool }: ToolDetailContentProps) {
  const mainDescription =
    tool.desc_en ??
    tool.description ??
    "Premium AI tool for your creative workflow.";
  const displayTags = filterDisplayTags(tool.tags);
  const visitUrl = tool.affiliate_url ?? tool.url;

  // Scroll to top when component mounts
  useEffect(() => {
    window.scrollTo(0, 0);
  }, []);

  return (
    <div className="min-h-screen bg-slate-950 px-4 pb-8 pt-6">
      <div className="mx-auto max-w-5xl">
        {/* Tool Name */}
        <header className="mb-6">
          <h1 className="text-2xl font-bold text-slate-50 lg:text-3xl">{tool.name}</h1>
        </header>

        {/* Description */}
        <section className="mb-6 rounded-2xl border border-slate-800/70 bg-slate-900/70 p-5">
          <p className="text-sm leading-relaxed text-slate-300 lg:text-base">
            {mainDescription}
          </p>
        </section>

        {/* Buttons */}
        <section className="mb-8 flex flex-col gap-3 sm:flex-row">
          {visitUrl && (
            <Link
              href={visitUrl}
              target="_blank"
              rel="noopener noreferrer sponsored"
              className="inline-flex items-center justify-center gap-2 rounded-xl bg-emerald-500 px-5 py-2.5 text-sm font-semibold text-slate-950 transition hover:bg-emerald-400"
            >
              <ExternalLink className="h-4 w-4" />
              Visit official site
            </Link>
          )}
          <CopyLinkButton />
        </section>

        {/* Info Cards */}
        <section className="mb-8 space-y-3">
          {tool.task_category && (
            <InfoCard label="TASK CATEGORY" value={tool.task_category} />
          )}
          {tool.best_for && (
            <InfoCard label="BEST FOR" value={tool.best_for} />
          )}
          {tool.why_pick && (
            <InfoCard label="WHY WE PICKED IT" value={tool.why_pick} />
          )}
          {displayTags.length > 0 && (
            <div className="rounded-2xl border border-slate-800/70 bg-slate-900/70 p-4">
              <div className="mb-2 flex items-center gap-2 text-emerald-400">
                <Tag className="h-4 w-4" />
                <h3 className="text-xs font-semibold uppercase tracking-wider">TAGS</h3>
              </div>
              <div className="flex flex-wrap gap-2">
                {displayTags.map((tag) => (
                  <span
                    key={tag}
                    className="rounded-full bg-slate-800 px-2.5 py-1 text-xs text-slate-300"
                  >
                    #{tag}
                  </span>
                ))}
              </div>
            </div>
          )}
        </section>
      </div>
    </div>
  );
}

// ============================================================
// InfoCard Component
// ============================================================
function InfoCard({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-2xl border border-slate-800/70 bg-slate-900/70 p-4">
      <h3 className="mb-2 text-xs font-semibold uppercase tracking-wider text-emerald-400">
        {label}
      </h3>
      <p className="text-sm leading-relaxed text-slate-300">{value}</p>
    </div>
  );
}


