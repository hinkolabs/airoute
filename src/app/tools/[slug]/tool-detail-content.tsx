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
import { PageShell } from "@/app/_design/components/page";
import { useTheme } from "@/app/_design/providers/theme-provider";
import { cn } from "@/lib/utils";
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
  const { theme } = useTheme();

  return (
    <PageShell>
      <div className="mx-auto flex min-h-[60vh] max-w-4xl flex-col items-center justify-center px-4 py-20 text-center">
        <div className="mb-4 text-6xl">🔍</div>
        <h1 className="mb-2 text-2xl font-bold">Tool Not Found</h1>
        <p className={cn(
          "mb-6",
          theme === "day" ? "text-slate-600" : "text-slate-400"
        )}>
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
    </PageShell>
  );
}

// ============================================================
// Tool Detail Content
// ============================================================
type ToolDetailContentProps = {
  tool: ToolRecord;
};

export function ToolDetailContent({ tool }: ToolDetailContentProps) {
  const { theme } = useTheme();

  const categoryLabel = categoryLabelFromId(tool.category_id);
  const mainDescription =
    tool.desc_en ??
    tool.description ??
    "We are preparing a detailed description for this tool.";
  const displayTags = filterDisplayTags(tool.tags);
  const visitUrl = tool.affiliate_url ?? tool.url;

  return (
    <PageShell>
      <div className="mx-auto max-w-4xl px-4 py-10">
        {/* Back link */}
        <div className="pb-6">
          <Link
            href="/"
            className={cn(
              "inline-flex items-center gap-1.5 text-sm transition",
              theme === "day"
                ? "text-slate-500 hover:text-emerald-600"
                : "text-slate-400 hover:text-emerald-300"
            )}
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
              <span className={cn(
                "inline-flex items-center gap-1.5 rounded-full border px-3 py-1.5 text-xs font-semibold uppercase tracking-wide",
                theme === "day"
                  ? "border-emerald-500/50 bg-emerald-500/10 text-emerald-600"
                  : "border-emerald-500/50 bg-emerald-500/10 text-emerald-400"
              )}>
                <Sparkles className="h-3.5 w-3.5" />
                {tool.badge}
              </span>
            )}
          </div>
        </header>

        {/* Description Section */}
        <section className={cn(
          "mb-8 rounded-2xl border p-6",
          theme === "day"
            ? "border-slate-200 bg-white"
            : "border-white/10 bg-slate-900/50"
        )}>
          <p className={cn(
            "text-base leading-relaxed md:text-lg",
            theme === "day" ? "text-slate-600" : "text-slate-300"
          )}>
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
        <hr className={cn(
          "mb-10",
          theme === "day" ? "border-slate-200" : "border-white/10"
        )} />

        {/* More Tools Placeholder */}
        <section>
          <h2 className="mb-4 text-lg font-semibold">
            More tools you may like
          </h2>
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {[1, 2, 3].map((i) => (
              <div
                key={i}
                className={cn(
                  "flex h-32 items-center justify-center rounded-2xl border border-dashed text-sm",
                  theme === "day"
                    ? "border-slate-300 bg-slate-100/50 text-slate-500"
                    : "border-white/10 bg-slate-900/30 text-slate-500"
                )}
              >
                Coming soon...
              </div>
            ))}
          </div>
        </section>
      </div>
    </PageShell>
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
  const { theme } = useTheme();

  return (
    <div className={cn(
      "rounded-2xl border p-5",
      theme === "day"
        ? "border-slate-200 bg-white"
        : "border-white/10 bg-slate-900/50"
    )}>
      <div className={cn(
        "mb-2 flex items-center gap-2",
        theme === "day" ? "text-emerald-600" : "text-emerald-400"
      )}>
        {icon}
        <h3 className="text-xs font-semibold uppercase tracking-wider">
          {label}
        </h3>
      </div>
      <p className={cn(
        "text-sm leading-relaxed",
        theme === "day" ? "text-slate-600" : "text-slate-300"
      )}>
        {value}
      </p>
    </div>
  );
}

// ============================================================
// TagsCard Component
// ============================================================
function TagsCard({ tags }: { tags: string[] }) {
  const { theme } = useTheme();

  return (
    <div className={cn(
      "rounded-2xl border p-5",
      theme === "day"
        ? "border-slate-200 bg-white"
        : "border-white/10 bg-slate-900/50"
    )}>
      <div className={cn(
        "mb-3 flex items-center gap-2",
        theme === "day" ? "text-emerald-600" : "text-emerald-400"
      )}>
        <Tag className="h-4 w-4" />
        <h3 className="text-xs font-semibold uppercase tracking-wider">Tags</h3>
      </div>
      <div className="flex flex-wrap gap-2">
        {tags.map((tag) => (
          <span
            key={tag}
            className={cn(
              "rounded-full px-3 py-1 text-xs",
              theme === "day"
                ? "bg-slate-100 text-slate-600"
                : "bg-slate-800 text-slate-300"
            )}
          >
            #{tag}
          </span>
        ))}
      </div>
    </div>
  );
}


