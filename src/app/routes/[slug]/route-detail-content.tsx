"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { createClient } from "@supabase/supabase-js";
import { Star, ExternalLink, Scissors, Sparkles, Layout, FileText, AudioWaveform, Copy, Check, ChevronRight } from "lucide-react";
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
  const pathname = usePathname();
  const isKrMode = pathname.startsWith("/kr");
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

  // i18n text
  const t = {
    bestToolsTitle: isKrMode ? "이 루트에 최적화된 도구" : "Best Tools for This Route",
    recommended: isKrMode ? "추천" : "Recommended",
    bestToolsDesc: isKrMode 
      ? "이 워크플로우를 완료하기 위해 가장 잘 작동하는 3가지 도구입니다."
      : "The 3 tools that work best together to complete this workflow.",
    workflowSteps: isKrMode ? "워크플로우 단계" : "Workflow Steps",
    proTips: isKrMode ? "프로 팁" : "Pro Tips",
    relatedGuides: isKrMode ? "관련 가이드" : "Related Guides",
    relatedGuidesDesc: isKrMode ? "이 루트를 위한 최대 3개의 가이드" : "Up to 3 guides for this Route",
    noGuidesYet: isKrMode ? "아직 관련 가이드가 없습니다." : "No related guides found yet.",
    loadingGuides: isKrMode ? "가이드를 불러오는 중..." : "Loading guides...",
    saved: isKrMode ? "저장됨" : "Saved",
    saveRoute: isKrMode ? "루트 저장" : "Save route",
    removeFromFavorites: isKrMode ? "즐겨찾기에서 제거" : "Remove from favorites",
    addToFavorites: isKrMode ? "즐겨찾기에 추가" : "Add to favorites",
    featured: isKrMode ? "추천" : "Featured",
    addedToFavorites: isKrMode ? "즐겨찾기에 추가됨" : "Added to favorites",
    removedFromFavorites: isKrMode ? "즐겨찾기에서 제거됨" : "Removed from favorites",
    saveLimitReached: isKrMode 
      ? `저장 한도에 도달했습니다 (${limit}개 루트).`
      : `You reached your save limit (${limit} routes).`,
    guestSaveLimit: isKrMode
      ? "게스트는 1개의 루트만 저장할 수 있습니다. 로그인하여 더 많이 저장하세요."
      : "Guest can save up to 1 route. Sign in to save more.",
    failedToUpdate: isKrMode ? "즐겨찾기 업데이트에 실패했습니다" : "Failed to update favorites",
    copied: isKrMode ? "복사됨" : "Copied",
    copy: isKrMode ? "복사" : "Copy",
  };

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
      const preferredLang = isKrMode ? "kr" : "en";

      try {
        let previewRes = await supabaseClient
          .from("guides")
          .select("id,slug,title,excerpt,updated_at,created_at")
          .eq("guide_type", "route_based")
          .eq("route_slug", route.slug)
          .eq("status", "published")
          .eq("lang", preferredLang)
          .order("updated_at", { ascending: false, nullsFirst: false })
          .order("created_at", { ascending: false })
          .limit(3);

        // KR 가이드 없으면 EN 폴백
        if (isKrMode && (!previewRes.data || previewRes.data.length === 0)) {
          previewRes = await supabaseClient
            .from("guides")
            .select("id,slug,title,excerpt,updated_at,created_at")
            .eq("guide_type", "route_based")
            .eq("route_slug", route.slug)
            .eq("status", "published")
            .eq("lang", "en")
            .order("updated_at", { ascending: false, nullsFirst: false })
            .order("created_at", { ascending: false })
            .limit(3);
        }

        if (!isMounted) {
          return;
        }

        if (previewRes.error || !previewRes.data) {
          return;
        }

        setRelatedGuidesState(previewRes.data);
        setRelatedGuidesCountState(previewRes.data.length);
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
          ? t.saveLimitReached
          : t.guestSaveLimit;
        setToast({ message: limitMessage, type: "error" });
        setTimeout(() => setToast(null), 3000);
      } else {
        setToast({
          message: isFavorited ? t.removedFromFavorites : t.addedToFavorites,
          type: "success",
        });
        setTimeout(() => setToast(null), 3000);
      }
    } catch (error) {
      console.error("Error toggling favorite:", error);
      setToast({ message: t.failedToUpdate, type: "error" });
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
    <div className="min-h-screen bg-background px-4 pb-8 pt-6 sm:px-6 lg:px-8">
      <div className="mx-auto w-full max-w-[1200px]">
        {/* Header */}
        <header className="mb-8 rounded-2xl border border-border/70 bg-card/70 p-6">
          {/* Icon + Save Button Row */}
          <div className="mb-4 flex items-center gap-3">
            <div className="flex h-14 w-14 flex-shrink-0 items-center justify-center rounded-xl bg-primary/10">
              {route.icon && ROUTE_ICON_MAP[route.icon] ? (
                (() => {
                  const Icon = ROUTE_ICON_MAP[route.icon];
                  return <Icon className="h-7 w-7 text-muted-foreground" />;
                })()
              ) : (
                <Sparkles className="h-7 w-7 text-muted-foreground" />
              )}
            </div>
            {/* Save Button - Star icon to match All Routes page */}
            <button
              onClick={handleToggleFavorite}
              disabled={isLoading}
              className="flex h-9 w-9 flex-shrink-0 items-center justify-center rounded-full transition disabled:cursor-not-allowed disabled:opacity-50"
              aria-label={isFavorited ? t.removeFromFavorites : t.addToFavorites}
              title={isFavorited ? t.saved : t.saveRoute}
            >
              <Star
                className={`h-5 w-5 transition-colors ${
                  isFavorited
                    ? "fill-primary stroke-primary"
                    : "stroke-muted-foreground hover:stroke-foreground"
                }`}
              />
            </button>
            {route.featured && (
              <span className="rounded-full bg-primary/10 px-2.5 py-1 text-[11px] font-semibold uppercase tracking-wide text-primary border border-primary/20">
                {t.featured}
              </span>
            )}
          </div>
          
          {/* Title - no line break */}
          <h1 className="mb-4 text-xl font-bold text-foreground sm:text-2xl lg:text-3xl">
            {route.title}
          </h1>

          {/* Description */}
          <p className="text-sm leading-relaxed text-muted-foreground lg:text-base">{route.description}</p>

          {/* Tags */}
          {route.tags && route.tags.length > 0 && (
            <div className="mt-4 flex flex-wrap gap-2">
              {route.tags.map((tag) => (
                <span
                  key={tag}
                  className="rounded-full bg-muted px-3 py-1 text-xs text-foreground/70 border border-border"
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
            <h2 className="text-xl font-bold text-foreground">{t.bestToolsTitle}</h2>
            <span className="text-[10px] px-2 py-0.5 rounded-full bg-primary/10 text-primary border border-primary/20 uppercase font-semibold tracking-wide">
              {t.recommended}
            </span>
          </div>
          <p className="mb-4 text-sm text-muted-foreground">
            {t.bestToolsDesc}
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
                    className="inline-flex items-center gap-2 rounded-full border border-border bg-muted px-2.5 py-1 text-xs text-foreground hover:border-primary/50 hover:bg-primary/10 hover:text-primary transition-colors"
                  >
                    {item.tool.name}
                  </AffiliateLinkButton>
                ) : (
                  item.tool && (
                    <span
                      key={item.id}
                      className="inline-flex items-center gap-2 rounded-full border border-border bg-muted px-2.5 py-1 text-xs text-foreground"
                    >
                      {item.tool.name}
                    </span>
                  )
                )
              ))}
            </div>
          ) : (
            <p className="text-xs text-muted-foreground mt-2">Recommended tools will appear here.</p>
          )}
        </section>

        {/* Steps */}
        <section className="mb-8">
          <h2 className="mb-4 text-xl font-bold text-foreground">{t.workflowSteps}</h2>
          <div className="space-y-6">
            {best3Tools.map((step, index) => (
              <div
                key={step.id}
                className="rounded-2xl border border-border/70 bg-card/70 p-6"
              >
                {/* Step Number & Title */}
                <div className="mb-4 flex items-start gap-4">
                  <div className="flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-full bg-primary/10 text-sm font-bold text-primary">
                    {step.position}
                  </div>
                  <div className="flex-1">
                    <h3 className="text-lg font-semibold text-foreground">{step.step_title}</h3>
                    {step.tool && (
                      <Link
                        href={`/tools/${step.tool.slug || step.tool.id}`}
                        className="mt-2 inline-flex items-center gap-2 text-muted-foreground transition-colors hover:text-primary"
                      >
                        <ToolLogo
                          tool={{
                            name: step.tool.name,
                            image: step.tool.image,
                            website_url: step.tool.website_url,
                          }}
                          size={24}
                        />
                        <span className="text-sm font-medium">{step.tool.name}</span>
                      </Link>
                    )}
                  </div>
                </div>

                {/* Why */}
                {step.step_why && (
                  <p className="mb-4 text-sm leading-relaxed text-muted-foreground">{step.step_why}</p>
                )}

                {/* Prompt Example */}
                {step.step_prompt_example && (
                  <div className="relative mb-4 rounded-lg bg-muted/50 p-4 border border-border">
                    <div className="mb-2 flex items-center justify-between">
                      <p className="text-xs font-semibold uppercase tracking-wide text-primary">
                        {getInputLabel(step.step_input_type)}
                      </p>
                      <button
                        onClick={() => handleCopyPrompt(step.id, normalizePromptText(step.step_prompt_example))}
                        className="flex items-center gap-1.5 rounded-md bg-background/50 border border-border px-2.5 py-1.5 text-xs font-medium text-muted-foreground transition hover:bg-background hover:text-foreground"
                        aria-label="Copy to clipboard"
                      >
                        {copiedStepId === step.id ? (
                          <>
                            <Check className="h-3.5 w-3.5 text-primary" />
                            <span className="text-primary">{t.copied}</span>
                          </>
                        ) : (
                          <>
                            <Copy className="h-3.5 w-3.5" />
                            <span>{t.copy}</span>
                          </>
                        )}
                      </button>
                    </div>
                    <p className="text-sm leading-relaxed text-foreground/90 whitespace-pre-wrap">{normalizePromptText(step.step_prompt_example)}</p>
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
          <section className="mb-8 rounded-2xl border border-border/70 bg-card/70 p-6">
            <h2 className="mb-4 text-xl font-bold text-foreground">{t.proTips}</h2>
            <ul className="space-y-3">
              {route.guide_bullets.map((bullet, index) => (
                <li key={index} className="flex gap-3">
                  <span className="mt-1 flex h-5 w-5 flex-shrink-0 items-center justify-center rounded-full bg-primary/10 text-xs font-bold text-primary">
                    ✓
                  </span>
                  <span className="text-sm leading-relaxed text-muted-foreground">{bullet}</span>
                </li>
              ))}
            </ul>
          </section>
        )}

        {/* Related Guides */}
        {relatedGuidesCountState > 0 && (
          <section className="mb-8 rounded-2xl border border-border/70 bg-card/70 p-6">
            <div className="mb-1">
              <h2 className="text-xl font-bold text-foreground">{t.relatedGuides}</h2>
              <p className="mt-1 text-xs text-muted-foreground sm:text-sm">
                {t.relatedGuidesDesc}
              </p>
            </div>
            <div className="mt-4 space-y-3">
              {relatedGuidesState && relatedGuidesState.length > 0 ? (
                relatedGuidesState.map((guide) => (
                  <Link
                    key={guide.id}
                    href={isKrMode ? `/kr/guides/${guide.slug}` : `/guides/${guide.slug}`}
                    className="group flex items-center justify-between gap-3 rounded-lg border border-border bg-muted/30 px-4 py-3 transition hover:bg-card hover:border-primary/30"
                  >
                    <div className="flex-1 min-w-0">
                      <h3 className="text-sm font-semibold leading-5 text-foreground line-clamp-2">
                        {guide.title}
                      </h3>
                      {guide.excerpt && (
                        <p className="mt-1 text-sm leading-5 text-muted-foreground line-clamp-1">
                          {guide.excerpt}
                        </p>
                      )}
                    </div>
                    <ChevronRight className="h-5 w-5 flex-shrink-0 text-muted-foreground transition group-hover:text-primary" />
                  </Link>
                ))
              ) : (
                <p className="text-sm text-muted-foreground">
                  {isFetchingGuides ? t.loadingGuides : t.noGuidesYet}
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
                ? "border-destructive bg-destructive/80 text-destructive-foreground"
                : "border-primary bg-primary/80 text-primary-foreground"
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

