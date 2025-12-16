"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { ExternalLink, Sparkles, Tag, ArrowLeft, Bookmark, CheckCircle, Lightbulb } from "lucide-react";
import { CopyLinkButton } from "./copy-link-button";
import type { ToolRecord } from "@/lib/tools";
import { toggleToolFavorite, getFavorites } from "@/lib/favorites";
import { useAuth } from "@/app/_providers/auth-provider";
import { ToolLogo } from "@/components/tool-logo";
import { getToolLogoUrl } from "@/lib/logo";
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
  const { user } = useAuth();
  const [isFavorited, setIsFavorited] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [showLimitWarning, setShowLimitWarning] = useState(false);
  const [toast, setToast] = useState<{ message: string; type: "success" | "error" | "info" } | null>(null);

  const mainDescription =
    tool.desc_en ??
    tool.description ??
    "Premium AI tool for your creative workflow.";
  const displayTags = filterDisplayTags(tool.tags);
  const visitUrl = tool.affiliate_url ?? tool.url;
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
    
    // Optimistic update
    setIsFavorited(!isFavorited);
    setToast({ 
      message: !wasLiked ? "Added to Toolbox" : "Removed from Toolbox", 
      type: "success" 
    });
    
    try {
      const result = await toggleToolFavorite(toolSlug);
      
      if (result.blocked) {
        // Rollback
        setIsFavorited(wasLiked);
        setShowLimitWarning(true);
        setToast({ 
          message: "Guest limit reached (3 tools). Sign in for unlimited saves!", 
          type: "error" 
        });
        setTimeout(() => setShowLimitWarning(false), 3000);
      } else {
        setIsFavorited(result.tools.includes(toolSlug));
      }
    } catch (error) {
      // Rollback on error
      setIsFavorited(wasLiked);
      setToast({ message: "Failed to update toolbox", type: "error" });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-950 px-4 pb-8 pt-6">
      <div className="mx-auto max-w-5xl">
        {/* Tool Name & Logo */}
        <header className="mb-6 flex items-start gap-4">
          <ToolLogo
            src={getToolLogoUrl(tool)}
            name={tool.name}
            size={56}
          />
          <div className="flex-1">
            <h1 className="text-2xl font-bold text-slate-50 lg:text-3xl">{tool.name}</h1>
          </div>
        </header>

        {/* Description */}
        <section className="mb-6 rounded-2xl border border-slate-800/70 bg-slate-900/70 p-5">
          <p className="text-sm leading-relaxed text-slate-300 lg:text-base">
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
                Visit official site
              </AffiliateLinkButton>
            )}
            <button
              onClick={handleToggleFavorite}
              disabled={isLoading}
              className={`inline-flex items-center justify-center gap-2 rounded-xl px-5 py-2.5 text-sm font-semibold transition ${
                isFavorited
                  ? 'bg-emerald-500/20 text-emerald-400 hover:bg-emerald-500/30'
                  : 'border border-slate-700 bg-slate-900/50 text-slate-300 hover:border-emerald-500/50 hover:bg-slate-800'
              } disabled:opacity-50 disabled:cursor-not-allowed`}
            >
              <Bookmark className={`h-4 w-4 ${isFavorited ? 'fill-emerald-400' : ''}`} />
              {isFavorited ? 'Saved' : 'Save'}
            </button>
            <CopyLinkButton />
          </div>
          
          {/* Guest Limit Warning */}
          {showLimitWarning && !user && (
            <div className="rounded-lg border border-amber-500/50 bg-amber-500/10 px-4 py-2 text-sm text-amber-400">
              Guest limit reached (3 tools). Sign in for unlimited saves!
            </div>
          )}
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

        {/* Rich Content (for priority tools) */}
        <RichContent toolSlug={toolSlug} />

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
    <div className="rounded-2xl border border-slate-800/70 bg-slate-900/70 p-4">
      <h3 className="mb-2 text-xs font-semibold uppercase tracking-wider text-emerald-400">
        {label}
      </h3>
      <p className="text-sm leading-relaxed text-slate-300">{value}</p>
    </div>
  );
}

// ============================================================
// Rich Content Component (for priority tools)
// ============================================================
function RichContent({ toolSlug }: { toolSlug: string }) {
  const content = getToolDetailContent(toolSlug);
  
  if (!content) return null;

  return (
    <div className="space-y-6">
      {/* Introduction */}
      {content.intro && (
        <section className="rounded-2xl border border-slate-800/70 bg-slate-900/70 p-6">
          <h2 className="mb-3 text-lg font-bold text-slate-50">About {content.slug.charAt(0).toUpperCase() + content.slug.slice(1)}</h2>
          <p className="text-sm leading-relaxed text-slate-300">{content.intro}</p>
        </section>
      )}

      {/* Features */}
      {content.features && content.features.length > 0 && (
        <section className="rounded-2xl border border-slate-800/70 bg-slate-900/70 p-6">
          <div className="mb-4 flex items-center gap-2">
            <CheckCircle className="h-5 w-5 text-emerald-400" />
            <h2 className="text-lg font-bold text-slate-50">Key Features</h2>
          </div>
          <ul className="space-y-2">
            {content.features.map((feature, index) => (
              <li key={index} className="flex gap-3 text-sm text-slate-300">
                <span className="mt-1 flex h-5 w-5 flex-shrink-0 items-center justify-center rounded-full bg-emerald-500/20 text-xs font-bold text-emerald-300">
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
        <section className="rounded-2xl border border-slate-800/70 bg-slate-900/70 p-6">
          <h2 className="mb-3 text-lg font-bold text-slate-50">Perfect For</h2>
          <div className="flex flex-wrap gap-2">
            {content.bestFor.map((item, index) => (
              <span
                key={index}
                className="rounded-full border border-emerald-500/30 bg-emerald-500/10 px-3 py-1.5 text-xs font-medium text-emerald-300"
              >
                {item}
              </span>
            ))}
          </div>
        </section>
      )}

      {/* Why We Picked It */}
      {content.whyPicked && (
        <section className="rounded-2xl border border-emerald-500/30 bg-gradient-to-br from-emerald-500/10 to-slate-900/70 p-6">
          <div className="mb-3 flex items-center gap-2">
            <Sparkles className="h-5 w-5 text-emerald-400" />
            <h2 className="text-lg font-bold text-slate-50">Why We Picked It</h2>
          </div>
          <p className="text-sm leading-relaxed text-slate-300">{content.whyPicked}</p>
        </section>
      )}

      {/* Pro Tips */}
      {content.tips && content.tips.length > 0 && (
        <section className="rounded-2xl border border-slate-800/70 bg-slate-900/70 p-6">
          <div className="mb-4 flex items-center gap-2">
            <Lightbulb className="h-5 w-5 text-amber-400" />
            <h2 className="text-lg font-bold text-slate-50">Pro Tips</h2>
          </div>
          <ul className="space-y-3">
            {content.tips.map((tip, index) => (
              <li key={index} className="flex gap-3 text-sm text-slate-300">
                <span className="mt-0.5 text-amber-400">💡</span>
                <span className="leading-relaxed">{tip}</span>
              </li>
            ))}
          </ul>
        </section>
      )}

      {/* Related Guides CTA */}
      <section className="rounded-2xl border border-slate-800/70 bg-gradient-to-br from-emerald-500/10 to-slate-900/70 p-6 text-center">
        <h3 className="mb-2 text-lg font-semibold text-slate-50">
          Want more guidance?
        </h3>
        <p className="mb-4 text-sm text-slate-400">
          Check out our detailed guides and workflows featuring this tool.
        </p>
        <div className="flex flex-col gap-2 sm:flex-row sm:justify-center">
          <Link
            href="/guides"
            className="inline-flex items-center justify-center rounded-xl bg-slate-700 px-5 py-2.5 text-sm font-semibold text-slate-100 transition hover:bg-slate-600"
          >
            Browse Guides
          </Link>
          <Link
            href="/routes"
            className="inline-flex items-center justify-center rounded-xl bg-emerald-500 px-5 py-2.5 text-sm font-semibold text-slate-950 transition hover:bg-emerald-400"
          >
            View Workflows
          </Link>
        </div>
      </section>
    </div>
  );
}


