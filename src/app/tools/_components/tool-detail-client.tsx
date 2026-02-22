"use client";

import Link from "next/link";
import { useCallback } from "react";

type ToolDetailClientProps = {
  tool: {
    name: string;
    tagline?: string | null;
    description?: string | null;
    category?: string | null;
    categories?: string[] | null;
    labels?: string[] | null;
    officialUrl: string;
  };
  relatedTools?: {
    slug: string;
    name: string;
    tagline?: string | null;
  }[];
};

export function ToolDetailClient({
  tool,
  relatedTools = [],
}: ToolDetailClientProps) {
  // Normalize categories (string or array → array)
  const normalizedCategories = Array.isArray(tool.categories)
    ? tool.categories
    : tool.category
    ? [tool.category]
    : [];

  const handleCopyLink = useCallback(() => {
    try {
      const url = window.location.href;
      navigator.clipboard?.writeText(url);
      // TODO: connect to your toast system if you have one
      console.log("Copied tool link:", url);
    } catch (err) {
      console.error("Failed to copy tool link", err);
    }
  }, []);

  const handleBack = useCallback(() => {
    if (window.history.length > 1) {
      window.history.back();
    } else {
      window.location.href = "/tools";
    }
  }, []);

  return (
    <main className="mx-auto max-w-3xl px-4 pb-24 pt-6 sm:pt-8">
      {/* Back */}
      <button
        type="button"
        onClick={handleBack}
        className="mb-4 inline-flex items-center gap-2 text-sm font-medium text-slate-300 hover:text-white"
      >
        <span className="text-lg">←</span>
        Back
      </button>

      {/* Main Tool Card */}
      <section className="rounded-2xl border border-slate-800 bg-slate-900/60 p-6 shadow-sm">
        <h1 className="text-3xl font-bold text-white">{tool.name}</h1>
        {tool.tagline && (
          <p className="mt-2 text-base text-slate-300">{tool.tagline}</p>
        )}

        {/* Badges */}
        {(normalizedCategories.length > 0 ||
          (tool.labels && tool.labels.length > 0)) && (
          <div className="mt-4 flex flex-wrap gap-2">
            {normalizedCategories.map((cat) => (
              <span
                key={cat}
                className="inline-flex items-center rounded-full bg-primary/10 px-3 py-1 text-xs font-medium text-primary"
              >
                {cat}
              </span>
            ))}
            {tool.labels?.map((label) => (
              <span
                key={label}
                className="rounded-full bg-primary/10 px-3 py-1 text-xs font-medium text-primary"
              >
                {label}
              </span>
            ))}
          </div>
        )}

        {/* Actions */}
        <div className="mt-6 flex flex-col gap-3 sm:flex-row sm:gap-4">
          <a
            href={tool.officialUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex flex-1 items-center justify-center rounded-full bg-primary px-5 py-3 text-sm font-semibold text-primary-foreground hover:bg-primary-hover sm:flex-none"
          >
            Visit official site
          </a>
          <button
            type="button"
            onClick={handleCopyLink}
            className="inline-flex items-center justify-center rounded-full border border-slate-600 px-5 py-3 text-sm font-medium text-slate-200 hover:border-slate-400 hover:bg-slate-900"
          >
            Copy tool link
          </button>
        </div>

        {/* Description */}
        {tool.description && (
          <p className="mt-6 border-t border-slate-800 pt-6 text-sm leading-relaxed text-slate-200">
            {tool.description}
          </p>
        )}
      </section>

      {/* Recommended Tools */}
      <section className="mt-10">
        <div className="mb-4 flex items-center justify-between">
          <h2 className="text-lg font-semibold text-white">
            More tools you may like
          </h2>
        </div>
        {relatedTools.length ? (
          <div className="flex flex-col gap-3">
            {relatedTools.map((item) => (
              <Link
                key={item.slug}
                href={`/tools/${item.slug}`}
                className="rounded-2xl border border-slate-800 bg-slate-900/50 p-4 transition hover:border-primary hover:bg-slate-900"
              >
                <p className="text-sm font-semibold text-white">{item.name}</p>
                {item.tagline && (
                  <p className="text-xs text-slate-300">{item.tagline}</p>
                )}
              </Link>
            ))}
          </div>
        ) : (
          <div className="rounded-2xl border border-dashed border-slate-700 bg-slate-900/40 p-6 text-center text-sm text-slate-400">
            Coming soon...
          </div>
        )}
      </section>
    </main>
  );
}











