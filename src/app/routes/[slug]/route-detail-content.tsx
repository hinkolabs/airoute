"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { createClient } from "@supabase/supabase-js";
import { Star, ExternalLink, Scissors, Sparkles, Layout, FileText, AudioWaveform, Copy, Check } from "lucide-react";
import type { DbRoute, DbRouteTool } from "@/lib/db/routes";
import { useSavedRoutes } from "@/lib/hooks/use-saved-routes";
import { useAuth } from "@/app/_providers/auth-provider";
import AffiliateLinkButton from "@/components/AffiliateLinkButton";
import { ToolLogo } from "@/components/tool-logo";

const ROUTE_ICON_MAP: Record<string, React.ComponentType<{ className?: string }>> = {
  "✂️": Scissors,
  "✨": Sparkles,
  "📊": Layout,
  "📝": FileText,
  "🎵": AudioWaveform,
};

// Helper: normalize escaped newline characters in prompt text
function normalizePromptText(input?: string | null): string {
  if (!input) return "";
  return input
    .replaceAll("\\r\\n", "\n")
    .replaceAll("\\n", "\n")
    .replaceAll("\\r", "\n")
    .replaceAll("\r\n", "\n")
    .replaceAll("\r", "\n");
}

const supabaseClient =
  process.env.NEXT_PUBLIC_SUPABASE_URL && process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
    ? createClient(
        process.env.NEXT_PUBLIC_SUPABASE_URL,
        process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
        { auth: { persistSession: false } }
      )
    : null;

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
  relatedGuides?: Array<{
    id: string;
    slug: string;
    title: string;
    excerpt: string | null;
  }>;
  totalGuidesCount?: number;
}

export default function RouteDetailContent({
  route,
  best3Tools,
  relatedGuides = [],
  totalGuidesCount = 0,
}: RouteDetailContentProps) {
  const { user } = useAuth();
  const { isSaved, toggle, limit } = useSavedRoutes();
  const [isLoading, setIsLoading] = useState(false);
  const [toast, setToast] = useState<{ message: string; type: "success" | "error" } | null>(null);
  const [relatedGuidesState, setRelatedGuidesState] =
    useState<RouteDetailContentProps["relatedGuides"]>(relatedGuides);
  const [relatedGuidesCountState, setRelatedGuidesCountState] = useState(totalGuidesCount);
  const [isFetchingGuides, setIsFetchingGuides] = useState(false);
  const [copiedStepId, setCopiedStepId] = useState<string | null>(null);

  // Check if this route is saved
  const isFavorited = isSaved(route.slug);

  // Scroll to top on mount
  useEffect(() => {
    window.scrollTo(0, 0);
  }, []);

  useEffect(() => {
    if (!supabaseClient) {
      return;
    }

    let isMounted = true;

    const loadGuides = async () => {
      setIsFetchingGuides(true);

      try {
        const [previewRes, countRes] = await Promise.all([
          supabaseClient
            .from("guides")
            .select("id,slug,title,excerpt,updated_at,created_at")
            .eq("guide_type", "route_based")
            .eq("route_slug", route.slug)
            .eq("status", "published")
            .eq("lang", "en")
            .order("updated_at", { ascending: false, nullsFirst: false })
            .order("created_at", { ascending: false })
            .limit(3),
          supabaseClient
            .from("guides")
            .select("id", { count: "exact", head: true })
            .eq("guide_type", "route_based")
            .eq("route_slug", route.slug)
            .eq("status", "published")
            .eq("lang", "en"),
        ]);

        if (!isMounted) {
          return;
        }

        if (previewRes.error || !previewRes.data) {
          return;
        }

        setRelatedGuidesState(previewRes.data);
        setRelatedGuidesCountState(countRes.count ?? 0);
      } catch (error) {
        console.error("Failed to load related guides:", error);
      } finally {
        if (isMounted) {
          setIsFetchingGuides(false);
        }
      }
    };

    loadGuides();

    return () => {
      isMounted = false;
    };
  }, [route.slug]);

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

  const handleCopyPrompt = async (stepId: string, text: string) => {
    try {
      await navigator.clipboard.writeText(text);
      setCopiedStepId(stepId);
      setTimeout(() => setCopiedStepId(null), 2000);
    } catch (error) {
      console.error("Failed to copy:", error);
    }
  };

  const getInputLabel = (inputType: DbRouteTool["step_input_type"]): string => {
    switch (inputType) {
      case "settings":
        return "SETTINGS";
      case "action":
        return "ACTION GUIDE";
      case "prompt":
        return "PROMPT";
      default:
        return "PROMPT";
    }
  };

  return (
    <div className="min-h-screen bg-slate-950 px-4 pb-8 pt-6">
      <div className="mx-auto max-w-4xl">
        {/* Header */}
        <header className="mb-8 rounded-2xl border border-slate-800/70 bg-slate-900/70 p-6">
          {/* Icon + Save Button Row */}
          <div className="mb-4 flex items-center gap-3">
            <div className="flex h-14 w-14 flex-shrink-0 items-center justify-center rounded-xl bg-emerald-500/10">
              {route.icon && ROUTE_ICON_MAP[route.icon] ? (
                (() => {
                  const Icon = ROUTE_ICON_MAP[route.icon];
                  return <Icon className="h-7 w-7 text-slate-400" />;
                })()
              ) : (
                <Sparkles className="h-7 w-7 text-slate-400" />
              )}
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

        {/* Best Tools Section */}
        <section className="mb-8">
          <div className="flex items-center gap-2 mb-2">
            <h2 className="text-xl font-bold text-slate-50">Best Tools for This Route</h2>
            <span className="text-[10px] px-2 py-0.5 rounded-full bg-emerald-500/10 text-emerald-200 border border-emerald-500/20 uppercase font-semibold tracking-wide">
              Recommended
            </span>
          </div>
          <p className="mb-4 text-sm text-slate-400">
            The 3 tools that work best together to complete this workflow.
          </p>
          {best3Tools.length > 0 ? (
            <div className="mt-2 flex flex-wrap gap-2">
              {best3Tools.map((item) => (
                item.tool && (item.tool.affiliate_url || item.tool.website_url) ? (
                  <AffiliateLinkButton
                    key={item.id}
                    href={item.tool.affiliate_url || item.tool.website_url || "#"}
                    placement="route_best_tools"
                    toolSlug={item.tool.slug || item.tool.id}
                    routeSlug={route.slug}
                    variant="ghost"
                    size="sm"
                    className="inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/5 px-2.5 py-1 text-xs text-white/90 hover:border-emerald-400/50 hover:bg-emerald-500/10 transition-colors"
                  >
                    {item.tool.name}
                  </AffiliateLinkButton>
                ) : (
                  item.tool && (
                    <span
                      key={item.id}
                      className="inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/5 px-2.5 py-1 text-xs text-white/90"
                    >
                      {item.tool.name}
                    </span>
                  )
                )
              ))}
            </div>
          ) : (
            <p className="text-xs text-slate-500 mt-2">Recommended tools will appear here.</p>
          )}
        </section>

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
                  <div className="relative mb-4 rounded-lg bg-slate-950/50 p-4">
                    <div className="mb-2 flex items-center justify-between">
                      <p className="text-xs font-semibold uppercase tracking-wide text-emerald-400">
                        {getInputLabel(step.step_input_type)}
                      </p>
                      <button
                        onClick={() => handleCopyPrompt(step.id, normalizePromptText(step.step_prompt_example))}
                        className="flex items-center gap-1.5 rounded-md bg-slate-800/50 px-2.5 py-1.5 text-xs font-medium text-slate-300 transition hover:bg-slate-700/50 active:bg-slate-600/50"
                        aria-label="Copy to clipboard"
                      >
                        {copiedStepId === step.id ? (
                          <>
                            <Check className="h-3.5 w-3.5 text-emerald-400" />
                            <span className="text-emerald-400">Copied</span>
                          </>
                        ) : (
                          <>
                            <Copy className="h-3.5 w-3.5" />
                            <span>Copy</span>
                          </>
                        )}
                      </button>
                    </div>
                    <p className="text-sm leading-relaxed text-slate-300 whitespace-pre-wrap">{normalizePromptText(step.step_prompt_example)}</p>
                  </div>
                )}

                {/* CTA */}
                {step.tool && (step.tool.affiliate_url || step.tool.website_url) && (
                  <AffiliateLinkButton
                    href={step.tool.affiliate_url || step.tool.website_url || "#"}
                    placement={`route_step_${step.position}`}
                    toolSlug={step.tool.slug || step.tool.id}
                    routeSlug={route.slug}
                    stepIndex={step.position}
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

        {/* Related Guides */}
        {relatedGuidesCountState > 0 && (
          <section className="mb-8 rounded-2xl border border-slate-800/70 bg-slate-900/70 p-6">
            <div className="flex flex-wrap items-end justify-between gap-3">
              <div>
                <h2 className="text-xl font-bold text-slate-50">Related Guides</h2>
                <p className="text-xs text-slate-400 sm:text-sm">
                  Showing {Math.min(3, relatedGuidesCountState)} of {relatedGuidesCountState} guides for this route
                </p>
              </div>
              {relatedGuidesCountState > 3 && (
                <Link
                  href={`/guides?route=${route.slug}`}
                  className="inline-flex items-center justify-center rounded-full border border-slate-700 px-4 py-2 text-xs font-semibold uppercase tracking-wide text-emerald-400 transition hover:border-emerald-300 hover:text-emerald-200"
                >
                  View all guides for this route ({relatedGuidesCountState})
                </Link>
              )}
            </div>
            <div className="mt-5 space-y-4">
              {relatedGuidesState && relatedGuidesState.length > 0 ? (
                relatedGuidesState.map((guide) => (
                  <div
                    key={guide.id}
                    className="flex flex-col gap-3 rounded-2xl border border-slate-800/70 bg-slate-950/40 p-4 sm:p-5"
                  >
                    <div>
                      <h3 className="text-base font-semibold text-slate-50 sm:text-lg">
                        {guide.title}
                      </h3>
                      {guide.excerpt && (
                        <p className="mt-2 text-sm leading-relaxed text-slate-300 line-clamp-3">
                          {guide.excerpt}
                        </p>
                      )}
                    </div>
                    <Link
                      href={`/guides/${guide.slug}`}
                      className="inline-flex items-center justify-center gap-2 rounded-full border border-emerald-500/40 bg-emerald-500/10 px-4 py-2 text-xs font-semibold uppercase tracking-wide text-emerald-300 transition hover:border-emerald-400 hover:bg-emerald-500/15 sm:text-sm"
                    >
                      <ExternalLink className="h-3 w-3" />
                      Open guide
                    </Link>
                  </div>
                ))
              ) : (
                <p className="text-sm text-slate-400">
                  {isFetchingGuides ? "Loading guides..." : "No related guides found yet."}
                </p>
              )}
            </div>
          </section>
        )}

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

