"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { Star, ExternalLink } from "lucide-react";
import type { DbRoute, DbRouteTool } from "@/lib/db/routes";
import { useSavedRoutes } from "@/lib/hooks/use-saved-routes";
import { useAuth } from "@/app/_providers/auth-provider";
import AffiliateLinkButton from "@/components/AffiliateLinkButton";
import { ToolLogo } from "@/components/tool-logo";

interface RouteDetailContentProps {
  route: DbRoute;
  best3Tools: Array<
    DbRouteTool & {
      tool: {
        id: string;
        name: string;
        slug: string | null;
        website_url: string | null;
        image: string | null;
        affiliate_url: string | null;
      };
    }
  >;
}

export default function RouteDetailContent({ route, best3Tools }: RouteDetailContentProps) {
  const { user } = useAuth();
  const { isSaved, toggle, limit } = useSavedRoutes();
  const [isLoading, setIsLoading] = useState(false);
  const [toast, setToast] = useState<{ message: string; type: "success" | "error" } | null>(null);

  // Check if this route is saved
  const isFavorited = isSaved(route.slug);

  // Scroll to top on mount
  useEffect(() => {
    window.scrollTo(0, 0);
  }, []);

  const handleToggleFavorite = async () => {
    setIsLoading(true);

    try {
      const result = await toggle(route.slug);
      if (result.blocked) {
        const limitMessage = user
          ? `You reached your save limit (${limit} routes).`
          : "Guest can save up to 1 route. Sign in to save more.";
        setToast({ message: limitMessage, type: "error" });
        setTimeout(() => setToast(null), 3000);
      } else {
        setToast({
          message: isFavorited ? "Removed from favorites" : "Added to favorites",
          type: "success",
        });
        setTimeout(() => setToast(null), 3000);
      }
    } catch (error) {
      console.error("Error toggling favorite:", error);
      setToast({ message: "Failed to update favorites", type: "error" });
      setTimeout(() => setToast(null), 3000);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-950 px-4 pb-8 pt-6">
      <div className="mx-auto max-w-4xl">
        {/* Header */}
        <header className="mb-8 rounded-2xl border border-slate-800/70 bg-slate-900/70 p-6">
          {/* Icon + Save Button Row */}
          <div className="mb-4 flex items-center gap-3">
            <div className="flex h-14 w-14 flex-shrink-0 items-center justify-center rounded-xl bg-emerald-500/10 text-3xl">
              {route.icon || "🚀"}
            </div>
            {/* Save Button - Star icon to match All Routes page */}
            <button
              onClick={handleToggleFavorite}
              disabled={isLoading}
              className="flex h-9 w-9 flex-shrink-0 items-center justify-center rounded-full transition disabled:cursor-not-allowed disabled:opacity-50"
              aria-label={isFavorited ? "Remove from favorites" : "Add to favorites"}
              title={isFavorited ? "Saved" : "Save route"}
            >
              <Star
                className={`h-5 w-5 transition-colors ${
                  isFavorited
                    ? "fill-emerald-400 stroke-emerald-400"
                    : "stroke-slate-500 hover:stroke-slate-300"
                }`}
              />
            </button>
            {route.featured && (
              <span className="rounded-full bg-emerald-500/20 px-2.5 py-1 text-[11px] font-semibold uppercase tracking-wide text-emerald-300">
                Featured
              </span>
            )}
          </div>
          
          {/* Title - no line break */}
          <h1 className="mb-4 text-xl font-bold text-slate-50 sm:text-2xl lg:text-3xl">
            {route.title}
          </h1>

          {/* Description */}
          <p className="text-sm leading-relaxed text-slate-300 lg:text-base">{route.description}</p>

          {/* Tags */}
          {route.tags && route.tags.length > 0 && (
            <div className="mt-4 flex flex-wrap gap-2">
              {route.tags.map((tag) => (
                <span
                  key={tag}
                  className="rounded-full bg-slate-900/40 px-3 py-1 text-xs text-slate-400"
                >
                  #{tag}
                </span>
              ))}
            </div>
          )}
        </header>

        {/* Steps */}
        <section className="mb-8">
          <h2 className="mb-4 text-xl font-bold text-slate-50">Workflow Steps</h2>
          <div className="space-y-6">
            {best3Tools.map((step, index) => (
              <div
                key={step.id}
                className="rounded-2xl border border-slate-800/70 bg-slate-900/70 p-6"
              >
                {/* Step Number & Title */}
                <div className="mb-4 flex items-start gap-4">
                  <div className="flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-full bg-emerald-500/20 text-sm font-bold text-emerald-300">
                    {step.position}
                  </div>
                  <div className="flex-1">
                    <h3 className="text-lg font-semibold text-slate-50">{step.step_title}</h3>
                    {step.tool && (
                      <Link
                        href={`/tools/${step.tool.slug || step.tool.id}`}
                        className="mt-2 inline-flex items-center gap-2 transition-colors hover:text-emerald-300"
                      >
                        <ToolLogo
                          tool={{
                            name: step.tool.name,
                            image: step.tool.image,
                            website_url: step.tool.website_url,
                          }}
                          size={24}
                        />
                        <span className="text-sm font-medium text-slate-300">{step.tool.name}</span>
                      </Link>
                    )}
                  </div>
                </div>

                {/* Why */}
                {step.step_why && (
                  <p className="mb-4 text-sm leading-relaxed text-slate-400">{step.step_why}</p>
                )}

                {/* Prompt Example */}
                {step.step_prompt_example && (
                  <div className="mb-4 rounded-lg bg-slate-950/50 p-4">
                    <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-emerald-400">
                      Prompt Example
                    </p>
                    <p className="text-sm leading-relaxed text-slate-300">{step.step_prompt_example}</p>
                  </div>
                )}

                {/* CTA */}
                {step.tool && (step.tool.affiliate_url || step.tool.website_url) && (
                  <AffiliateLinkButton
                    href={step.tool.affiliate_url || step.tool.website_url || "#"}
                    placement="route_detail"
                    toolSlug={step.tool.slug || step.tool.id}
                    variant="primary"
                    size="md"
                    className="w-full sm:w-auto"
                  >
                    <ExternalLink className="mr-2 h-4 w-4" />
                    {step.step_cta_label || `Visit ${step.tool.name}`}
                  </AffiliateLinkButton>
                )}
              </div>
            ))}
          </div>
        </section>

        {/* Guide Section */}
        {route.guide_bullets && route.guide_bullets.length > 0 && (
          <section className="mb-8 rounded-2xl border border-slate-800/70 bg-slate-900/70 p-6">
            <h2 className="mb-4 text-xl font-bold text-slate-50">Pro Tips</h2>
            <ul className="space-y-3">
              {route.guide_bullets.map((bullet, index) => (
                <li key={index} className="flex gap-3">
                  <span className="mt-1 flex h-5 w-5 flex-shrink-0 items-center justify-center rounded-full bg-emerald-500/20 text-xs font-bold text-emerald-300">
                    ✓
                  </span>
                  <span className="text-sm leading-relaxed text-slate-300">{bullet}</span>
                </li>
              ))}
            </ul>
          </section>
        )}

        {/* Related Guides CTA */}
        <section className="rounded-2xl border border-slate-800/70 bg-gradient-to-br from-emerald-500/10 to-slate-900/70 p-6 text-center">
          <h3 className="mb-2 text-lg font-semibold text-slate-50">
            Want more in-depth guidance?
          </h3>
          <p className="mb-4 text-sm text-slate-400">
            Check out our detailed guides for step-by-step tutorials.
          </p>
          <Link
            href="/guides"
            className="inline-flex items-center justify-center rounded-xl bg-emerald-500 px-6 py-3 text-sm font-semibold text-slate-950 transition hover:bg-emerald-400"
          >
            Browse Guides
          </Link>
        </section>

        {/* Toast - positioned at top to avoid mobile nav */}
        {toast && (
          <div
            className={`fixed left-1/2 top-4 z-50 -translate-x-1/2 rounded-xl border px-4 py-3 shadow-lg backdrop-blur-md ${
              toast.type === "error"
                ? "border-red-700 bg-red-900/80 text-red-100"
                : "border-emerald-700 bg-emerald-900/80 text-emerald-100"
            }`}
            style={{ top: 'calc(env(safe-area-inset-top, 0px) + 16px)' }}
          >
            <span className="text-sm font-medium">{toast.message}</span>
          </div>
        )}
      </div>
    </div>
  );
}

