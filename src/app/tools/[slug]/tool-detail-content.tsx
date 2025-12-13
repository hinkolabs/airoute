"use client";

import Link from "next/link";
import {
  ExternalLink,
  Sparkles,
  Target,
  Briefcase,
  Tag,
  ArrowLeft,
  Layers,
} from "lucide-react";
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
  const categoryLabel = categoryLabelFromId(tool.category_id);
  const mainDescription =
    tool.desc_en ??
    tool.description ??
    "We are preparing a detailed description for this tool.";
  const displayTags = filterDisplayTags(tool.tags);
  const visitUrl = tool.affiliate_url ?? tool.url;

  return (
    <div className="min-h-screen bg-slate-950 px-4 pb-24 pt-3">
      <div className="mx-auto max-w-4xl px-4 py-10">
        {/* Back link */}
        <div className="pb-6">
          <Link
            href="/"
            className="inline-flex items-center gap-1.5 text-sm text-slate-400 transition hover:text-emerald-300"
          >
            <ArrowLeft className="h-4 w-4" />
            Back to all tools
          </Link>
        </div>

        {/* Header: Tool Name + Badge */}
        <header className="mb-8 text-center md:text-left">
          <div className="flex flex-col items-center gap-3 md:flex-row md:items-start md:justify-between">
            <h1 className="text-3xl font-bold md:text-4xl">{tool.name}</h1>
            {tool.badge && (
              <span className="inline-flex items-center gap-1.5 rounded-full border border-emerald-500/50 bg-emerald-500/10 px-3 py-1.5 text-xs font-semibold uppercase tracking-wide text-emerald-400">
                <Sparkles className="h-3.5 w-3.5" />
                {tool.badge}
              </span>
            )}
          </div>
        </header>

        {/* Description Section */}
        <section className="mb-8 rounded-2xl border border-white/10 bg-slate-900/50 p-6">
          <p className="text-base leading-relaxed text-slate-300 md:text-lg">
            {mainDescription}
          </p>
        </section>

        {/* Button Row */}
        <section className="mb-10 flex flex-col gap-3 sm:flex-row sm:items-center">
          {visitUrl && (
            <Link
              href={visitUrl}
              target="_blank"
              rel="noreferrer"
              className="inline-flex items-center justify-center gap-2 rounded-xl bg-emerald-500 px-6 py-3 text-sm font-semibold text-slate-900 transition hover:bg-emerald-400"
            >
              <ExternalLink className="h-4 w-4" />
              Visit official site
            </Link>
          )}
          <CopyLinkButton />
        </section>

        {/* Meta Block */}
        <section className="mb-10 space-y-4">
          {tool.task_category && (
            <MetaCard
              icon={<Layers className="h-4 w-4" />}
              label="Task Category"
              value={tool.task_category}
            />
          )}

          {tool.category_id && (
            <MetaCard
              icon={<Briefcase className="h-4 w-4" />}
              label="Category"
              value={categoryLabel}
            />
          )}

          {tool.best_for && (
            <MetaCard
              icon={<Sparkles className="h-4 w-4" />}
              label="Best for"
              value={tool.best_for}
            />
          )}

          {tool.why_pick && (
            <MetaCard
              icon={<Target className="h-4 w-4" />}
              label="Why we picked it"
              value={tool.why_pick}
            />
          )}

          {tool.related_gear && (
            <MetaCard
              icon={<Briefcase className="h-4 w-4" />}
              label="Related gear"
              value={tool.related_gear}
            />
          )}

          {/* Tags */}
          {displayTags.length > 0 && <TagsCard tags={displayTags} />}
        </section>

        {/* Divider */}
        <hr className="mb-10 border-white/10" />

        {/* More Tools Placeholder */}
        <section>
          <h2 className="mb-4 text-lg font-semibold">
            More tools you may like
          </h2>
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {[1, 2, 3].map((i) => (
              <div
                key={i}
                className="flex h-32 items-center justify-center rounded-2xl border border-dashed border-white/10 bg-slate-900/30 text-sm text-slate-500"
              >
                Coming soon...
              </div>
            ))}
          </div>
        </section>
      </div>
    </div>
  );
}

// ============================================================
// MetaCard Component
// ============================================================
function MetaCard({
  icon,
  label,
  value,
}: {
  icon: React.ReactNode;
  label: string;
  value: string;
}) {
  return (
    <div className="rounded-2xl border border-white/10 bg-slate-900/50 p-5">
      <div className="mb-2 flex items-center gap-2 text-emerald-400">
        {icon}
        <h3 className="text-xs font-semibold uppercase tracking-wider">
          {label}
        </h3>
      </div>
      <p className="text-sm leading-relaxed text-slate-300">
        {value}
      </p>
    </div>
  );
}

// ============================================================
// TagsCard Component
// ============================================================
function TagsCard({ tags }: { tags: string[] }) {
  return (
    <div className="rounded-2xl border border-white/10 bg-slate-900/50 p-5">
      <div className="mb-3 flex items-center gap-2 text-emerald-400">
        <Tag className="h-4 w-4" />
        <h3 className="text-xs font-semibold uppercase tracking-wider">Tags</h3>
      </div>
      <div className="flex flex-wrap gap-2">
        {tags.map((tag) => (
          <span
            key={tag}
            className="rounded-full bg-slate-800 px-3 py-1 text-xs text-slate-300"
          >
            #{tag}
          </span>
        ))}
      </div>
    </div>
  );
}


