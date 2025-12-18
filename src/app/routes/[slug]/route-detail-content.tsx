"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { Bookmark, ExternalLink } from "lucide-react";
import type { DbRoute, DbRouteTool } from "@/lib/db/routes";
import { getFavorites, toggleRouteFavorite } from "@/lib/favorites";
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
  const [isFavorited, setIsFavorited] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [toast, setToast] = useState<{ message: string; type: "success" | "error" } | null>(null);

  // Load initial favorite state
  useEffect(() => {
    async function checkFavorite() {
      try {
        const favorites = await getFavorites();
        setIsFavorited(favorites.routes.includes(route.slug));
      } catch (error) {
        console.error("Error checking favorite:", error);
      }
    }
    checkFavorite();
  }, [route.slug, user]);

  // Scroll to top on mount
  useEffect(() => {
    window.scrollTo(0, 0);
  }, []);

  const handleToggleFavorite = async () => {
    setIsLoading(true);
    const previousState = isFavorited;
    setIsFavorited(!previousState); // Optimistic UI update

    try {
      const result = await toggleRouteFavorite(route.slug);
      if (result.blocked) {
        setIsFavorited(previousState); // Rollback
        const limitMessage = user
          ? "You reached your save limit."
          : "Guest can save up to 1 route. Sign in to save more.";
        setToast({ message: limitMessage, type: "error" });
        setTimeout(() => setToast(null), 3000);
      } else {
        setToast({
          message: previousState ? "Removed from favorites" : "Added to favorites",
          type: "success",
        });
        setTimeout(() => setToast(null), 3000);
      }
    } catch (error) {
      console.error("Error toggling favorite:", error);
      setIsFavorited(previousState); // Rollback on error
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
          <div className="mb-4 flex items-start justify-between gap-4">
            {/* Icon & Title */}
            <div className="flex items-center gap-4">
              <div className="flex h-14 w-14 flex-shrink-0 items-center justify-center rounded-xl bg-emerald-500/10 text-3xl">
                {route.icon || "🚀"}
              </div>
              <div>
                <h1 className="text-2xl font-bold text-slate-50 lg:text-3xl">{route.title}</h1>
              </div>
            </div>

            {/* Save Button */}
            <button
              onClick={handleToggleFavorite}
              disabled={isLoading}
              className={`flex items-center gap-2 rounded-xl px-4 py-2 text-sm font-semibold transition ${
                isFavorited
                  ? "bg-slate-700 text-slate-100 hover:bg-slate-600"
                  : "bg-emerald-600 text-white hover:bg-emerald-500"
              } disabled:cursor-not-allowed disabled:opacity-50`}
            >
              <Bookmark className={`h-4 w-4 ${isFavorited ? "fill-current" : ""}`} />
              {isFavorited ? "Saved" : "Save"}
            </button>
          </div>

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
                      <div className="mt-2 flex items-center gap-2">
                        <ToolLogo
                          tool={{
                            name: step.tool.name,
                            image: step.tool.image,
                            website_url: step.tool.website_url,
                          }}
                          size={24}
                        />
                        <span className="text-sm font-medium text-slate-300">{step.tool.name}</span>
                      </div>
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

        {/* Toast */}
        {toast && (
          <div
            className={`fixed bottom-4 left-1/2 z-50 -translate-x-1/2 rounded-xl border px-4 py-3 shadow-lg backdrop-blur-md ${
              toast.type === "error"
                ? "border-red-700 bg-red-900/80 text-red-100"
                : "border-emerald-700 bg-emerald-900/80 text-emerald-100"
            }`}
          >
            <span className="text-sm font-medium">{toast.message}</span>
          </div>
        )}
      </div>
    </div>
  );
}

