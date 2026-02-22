"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { ExternalLink, Sparkles, Tag, ArrowLeft, Bookmark, CheckCircle, Lightbulb } from "lucide-react";
import { CopyLinkButton } from "./copy-link-button";
import type { ToolRecord } from "@/lib/tools";
import { toggleToolFavorite, getFavorites } from "@/lib/favorites";
import { useAuth } from "@/app/_providers/auth-provider";
import { ToolLogo } from "@/components/tool-logo";
import { Toast } from "@/components/toast";
import AffiliateLinkButton from "@/components/AffiliateLinkButton";
import { getToolDetailContent } from "@/lib/tool-detail-content";

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
    <div className="min-h-screen bg-background px-4 py-20 text-foreground">
      <div className="mx-auto flex max-w-[1200px] flex-col items-center justify-center text-center">
        <div className="mb-4 text-6xl">🔍</div>
        <h1 className="mb-2 text-2xl font-bold">Tool Not Found</h1>
        <p className="mb-6 text-muted-foreground">
          This tool does not exist or has been removed.
        </p>
        <Link
          href="/"
          className="inline-flex items-center gap-2 rounded-xl bg-primary px-5 py-2.5 text-sm font-semibold text-primary-foreground transition hover:bg-primary"
        >
          <ArrowLeft className="h-4 w-4" />
          Back to home
        </Link>
      </div>
    </div>
  );
}

// ============================================================
// i18n labels
// ============================================================
const labels = {
  en: {
    visitSite: "Visit official site",
    save: "Save",
    saved: "Saved",
    taskCategory: "TASK CATEGORY",
    bestFor: "BEST FOR",
    whyPicked: "WHY WE PICKED IT",
    tags: "TAGS",
    aboutPrefix: "About",
    keyFeatures: "Key Features",
    perfectFor: "Perfect For",
    whyWePickedIt: "Why We Picked It",
    proTips: "Pro Tips",
    guestLimit: "Guest limit reached (3 tools). Sign in for unlimited saves!",
    addedToolbox: "Added to Toolbox",
    removedToolbox: "Removed from Toolbox",
    failedUpdate: "Failed to update toolbox",
  },
  kr: {
    visitSite: "공식 사이트 방문",
    save: "저장",
    saved: "저장됨",
    taskCategory: "작업 카테고리",
    bestFor: "추천 대상",
    whyPicked: "선정 이유",
    tags: "태그",
    aboutPrefix: "소개:",
    keyFeatures: "주요 기능",
    perfectFor: "이런 분께 추천",
    whyWePickedIt: "선정 이유",
    proTips: "활용 팁",
    guestLimit: "게스트 한도 도달 (3개). 로그인하면 무제한 저장!",
    addedToolbox: "툴박스에 추가됨",
    removedToolbox: "툴박스에서 제거됨",
    failedUpdate: "업데이트 실패",
  },
} as const;

// ============================================================
// Tool Detail Content
// ============================================================
type ToolDetailContentProps = {
  tool: ToolRecord;
  locale?: "en" | "kr";
};

export function ToolDetailContent({ tool, locale = "en" }: ToolDetailContentProps) {
  const t = labels[locale];
  const { user } = useAuth();
  const [isFavorited, setIsFavorited] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [showLimitWarning, setShowLimitWarning] = useState(false);
  const [toast, setToast] = useState<{ message: string; type: "success" | "error" | "info" } | null>(null);

  const mainDescription =
    tool.description ??
    tool.desc_en ??
    "Premium AI tool for your creative workflow.";
  const displayTags = filterDisplayTags(tool.tags);
  const visitUrl = tool.affiliate_url ?? tool.website_url ?? tool.url;
  const toolSlug = tool.slug || tool.id || '';

  // Load initial favorite state
  useEffect(() => {
    async function checkFavorite() {
      try {
        const favorites = await getFavorites();
        setIsFavorited(favorites.tools.includes(toolSlug));
      } catch (error) {
        console.error('Error checking favorite:', error);
      }
    }
    checkFavorite();
  }, [toolSlug, user]);

  // Scroll to top when component mounts
  useEffect(() => {
    window.scrollTo(0, 0);
  }, []);

  const handleToggleFavorite = async () => {
    setIsLoading(true);
    setShowLimitWarning(false);
    
    const wasLiked = isFavorited;
    
    setIsFavorited(!isFavorited);
    setToast({ 
      message: !wasLiked ? t.addedToolbox : t.removedToolbox, 
      type: "success" 
    });
    
    try {
      const result = await toggleToolFavorite(toolSlug);
      
      if (result.blocked) {
        setIsFavorited(wasLiked);
        setShowLimitWarning(true);
        setToast({ 
          message: t.guestLimit, 
          type: "error" 
        });
        setTimeout(() => setShowLimitWarning(false), 3000);
      } else {
        setIsFavorited(result.tools.includes(toolSlug));
      }
    } catch (error) {
      // Rollback on error
      setIsFavorited(wasLiked);
      setToast({ message: t.failedUpdate, type: "error" });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-background px-4 pb-8 pt-6 sm:px-6 lg:px-8">
      <div className="mx-auto max-w-[1200px]">
        {/* Tool Name & Logo */}
        <header className="mb-6 flex items-start gap-4">
          <ToolLogo
            tool={tool}
            size={56}
          />
          <div className="flex-1">
            <h1 className="text-2xl font-bold text-foreground lg:text-3xl">{tool.name}</h1>
          </div>
        </header>

        {/* Description */}
        <section className="mb-6 rounded-2xl border border-border/70 bg-card/70 p-5">
          <p className="text-sm leading-relaxed text-muted-foreground lg:text-base">
            {mainDescription}
          </p>
        </section>

        {/* Buttons */}
        <section className="mb-8 space-y-3">
          <div className="flex flex-col gap-3 sm:flex-row">
            {visitUrl && (
              <AffiliateLinkButton
                href={visitUrl}
                partnerName={tool.name}
                placement="tool_detail"
                toolSlug={toolSlug}
                variant="primary"
                size="md"
                className="w-full sm:w-auto gap-2 rounded-xl"
              >
                <ExternalLink className="h-4 w-4" />
                {t.visitSite}
              </AffiliateLinkButton>
            )}
            <button
              onClick={handleToggleFavorite}
              disabled={isLoading}
              className={`inline-flex items-center justify-center gap-2 rounded-xl px-5 py-2.5 text-sm font-semibold transition ${
                isFavorited
                  ? 'bg-primary/20 text-primary hover:bg-primary/30 border border-primary/40'
                  : 'border border-border bg-card text-muted-foreground hover:border-primary/50 hover:bg-muted hover:text-primary'
              } disabled:opacity-50 disabled:cursor-not-allowed`}
            >
              <Bookmark className={`h-4 w-4 ${isFavorited ? 'fill-primary' : ''}`} />
              {isFavorited ? t.saved : t.save}
            </button>
            <CopyLinkButton />
          </div>
          
          {/* Guest Limit Warning */}
          {showLimitWarning && !user && (
            <div className="rounded-lg border border-destructive/50 bg-destructive/10 px-4 py-2 text-sm text-destructive">
              {t.guestLimit}
            </div>
          )}
        </section>

        {/* Info Cards */}
        <section className="mb-8 space-y-3">
          {tool.task_category && (
            <InfoCard label={t.taskCategory} value={tool.task_category} />
          )}
          {tool.best_for && (
            <InfoCard label={t.bestFor} value={tool.best_for} />
          )}
          {tool.why_pick && (
            <InfoCard label={t.whyPicked} value={tool.why_pick} />
          )}
          {displayTags.length > 0 && (
            <div className="rounded-2xl border border-border/70 bg-card/70 p-4">
              <div className="mb-2 flex items-center gap-2 text-primary">
                <Tag className="h-4 w-4" />
                <h3 className="text-xs font-semibold uppercase tracking-wider">{t.tags}</h3>
              </div>
              <div className="flex flex-wrap gap-2">
                {displayTags.map((tag) => (
                  <span
                    key={tag}
                    className="rounded-full bg-muted px-2.5 py-1 text-xs text-muted-foreground"
                  >
                    #{tag}
                  </span>
                ))}
              </div>
            </div>
          )}
        </section>

        {/* Rich Content (for priority tools) */}
        <RichContent toolSlug={toolSlug} tool={tool} locale={locale} />

        {/* Toast */}
        {toast && (
          <Toast
            message={toast.message}
            type={toast.type}
            onClose={() => setToast(null)}
          />
        )}
      </div>
    </div>
  );
}

// ============================================================
// InfoCard Component
// ============================================================
function InfoCard({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-2xl border border-border/70 bg-card/70 p-4">
      <h3 className="mb-2 text-xs font-semibold uppercase tracking-wider text-primary">
        {label}
      </h3>
      <p className="text-sm leading-relaxed text-muted-foreground">{value}</p>
    </div>
  );
}

// ============================================================
// Rich Content Component (for priority tools)
// ============================================================
type DetailContent = {
  intro?: string;
  features?: string[];
  bestFor?: string[];
  whyPicked?: string;
  tips?: string[];
};

function normalizeDetailContent(raw: any): DetailContent | null {
  if (!raw) return null;
  
  let parsed: any;
  if (typeof raw === 'string') {
    try {
      parsed = JSON.parse(raw);
    } catch {
      return null;
    }
  } else if (typeof raw === 'object') {
    parsed = raw;
  } else {
    return null;
  }

  const result: DetailContent = {};
  
  if (typeof parsed.intro === 'string' && parsed.intro.trim()) {
    result.intro = parsed.intro.trim();
  }
  
  if (Array.isArray(parsed.features)) {
    const filtered = parsed.features
      .filter((f: any) => typeof f === 'string')
      .map((f: string) => f.trim())
      .filter((f: string) => f.length > 0);
    if (filtered.length > 0) result.features = filtered;
  }
  
  if (Array.isArray(parsed.bestFor)) {
    const filtered = parsed.bestFor
      .filter((b: any) => typeof b === 'string')
      .map((b: string) => b.trim())
      .filter((b: string) => b.length > 0);
    if (filtered.length > 0) result.bestFor = filtered;
  }
  
  if (typeof parsed.whyPicked === 'string' && parsed.whyPicked.trim()) {
    result.whyPicked = parsed.whyPicked.trim();
  }
  
  if (Array.isArray(parsed.tips)) {
    const filtered = parsed.tips
      .filter((t: any) => typeof t === 'string')
      .map((t: string) => t.trim())
      .filter((t: string) => t.length > 0);
    if (filtered.length > 0) result.tips = filtered;
  }

  return Object.keys(result).length > 0 ? result : null;
}

function RichContent({ toolSlug, tool, locale = "en" }: { toolSlug: string; tool?: ToolRecord; locale?: "en" | "kr" }) {
  const t = labels[locale];
  
  const dbContent = normalizeDetailContent((tool as any)?.detail_content);
  const legacyContent = getToolDetailContent(toolSlug);
  const content = dbContent ?? legacyContent;
  
  if (!content) return null;

  const displayName = toolSlug.charAt(0).toUpperCase() + toolSlug.slice(1);

  return (
    <div className="space-y-6">
      {content.intro && (
        <section className="rounded-2xl border border-border/70 bg-card/70 p-6">
          <h2 className="mb-3 text-lg font-bold text-foreground">{t.aboutPrefix} {displayName}</h2>
          <p className="text-sm leading-relaxed text-muted-foreground">{content.intro}</p>
        </section>
      )}

      {content.features && content.features.length > 0 && (
        <section className="rounded-2xl border border-border/70 bg-card/70 p-6">
          <div className="mb-4 flex items-center gap-2">
            <CheckCircle className="h-5 w-5 text-primary" />
            <h2 className="text-lg font-bold text-foreground">{t.keyFeatures}</h2>
          </div>
          <ul className="space-y-2">
            {content.features.map((feature, index) => (
              <li key={index} className="flex gap-3 text-sm text-muted-foreground">
                <span className="mt-1 flex h-5 w-5 flex-shrink-0 items-center justify-center rounded-full bg-primary/20 text-xs font-bold text-primary">
                  ✓
                </span>
                <span className="leading-relaxed">{feature}</span>
              </li>
            ))}
          </ul>
        </section>
      )}

      {/* Best For */}
      {content.bestFor && content.bestFor.length > 0 && (
        <section className="rounded-2xl border border-border/70 bg-card/70 p-6">
          <h2 className="mb-3 text-lg font-bold text-foreground">{t.perfectFor}</h2>
          <div className="flex flex-wrap gap-2">
            {content.bestFor.map((item, index) => (
              <span
                key={index}
                className="rounded-full border border-primary/30 bg-primary/10 px-3 py-1.5 text-xs font-medium text-primary"
              >
                {item}
              </span>
            ))}
          </div>
        </section>
      )}

      {/* Why We Picked It */}
      {content.whyPicked && (
        <section className="rounded-2xl border border-primary/30 bg-gradient-to-br from-primary/10 to-background/70 p-6">
          <div className="mb-3 flex items-center gap-2">
            <Sparkles className="h-5 w-5 text-primary" />
            <h2 className="text-lg font-bold text-foreground">{t.whyWePickedIt}</h2>
          </div>
          <p className="text-sm leading-relaxed text-muted-foreground">{content.whyPicked}</p>
        </section>
      )}

      {/* Pro Tips */}
      {content.tips && content.tips.length > 0 && (
        <section className="rounded-2xl border border-border/70 bg-card/70 p-6">
          <div className="mb-4 flex items-center gap-2">
            <Lightbulb className="h-5 w-5 text-primary" />
            <h2 className="text-lg font-bold text-foreground">{t.proTips}</h2>
          </div>
          <ul className="space-y-3">
            {content.tips.map((tip, index) => (
              <li key={index} className="flex gap-3 text-sm text-muted-foreground">
                <span className="mt-0.5 text-primary">💡</span>
                <span className="leading-relaxed">{tip}</span>
              </li>
            ))}
          </ul>
        </section>
      )}
    </div>
  );
}


