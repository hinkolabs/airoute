"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { createClient } from "@supabase/supabase-js";
import { ToolLogo } from "@/components/tool-logo";
import { ExternalLink } from "lucide-react";
import AffiliateLinkButton from "@/components/AffiliateLinkButton";

const supabaseClient =
  process.env.NEXT_PUBLIC_SUPABASE_URL && process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
    ? createClient(
        process.env.NEXT_PUBLIC_SUPABASE_URL,
        process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
        { auth: { persistSession: false } }
      )
    : null;

type ToolCategoryBest = {
  category: string;
  role: "popular" | "easy" | "free";
  tool_slug: string;
  note: string | null;
};

type ToolData = {
  id: string;
  slug: string;
  name: string;
  desc_en: string | null;
  description: string | null;
  website_url: string | null;
  url: string | null;
  affiliate_url: string | null;
  image: string | null;
  category: string;
};

type Best3Tool = {
  role: "popular" | "easy" | "free";
  tool: ToolData;
  note: string | null;
};

const ROLE_LABELS: Record<"popular" | "easy" | "free", string> = {
  popular: "Most popular",
  easy: "Easiest to start",
  free: "Best free option",
};

interface CategoryDetailContentProps {
  slug: string;
  categoryName: string;
}

export default function CategoryDetailContent({
  slug,
  categoryName,
}: CategoryDetailContentProps) {
  const [best3Tools, setBest3Tools] = useState<Best3Tool[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    async function loadBest3Tools() {
      if (!supabaseClient) {
        setIsLoading(false);
        return;
      }

      try {
        // Fetch from tool_category_best
        const { data: categoryBest, error: categoryBestError } = await supabaseClient
          .from("tool_category_best")
          .select("*")
          .eq("category", categoryName);

        if (categoryBestError) {
          console.error("[CategoryDetail] Error fetching tool_category_best:", categoryBestError);
          setIsLoading(false);
          return;
        }

        if (!categoryBest || categoryBest.length === 0) {
          setIsLoading(false);
          return;
        }

        // Get tool slugs
        const toolSlugs = categoryBest.map((item: ToolCategoryBest) => item.tool_slug);

        // Fetch tool data
        const { data: tools, error: toolsError } = await supabaseClient
          .from("tools")
          .select("id, slug, name, desc_en, description, website_url, url, affiliate_url, image, category")
          .in("slug", toolSlugs);

        if (toolsError) {
          console.error("[CategoryDetail] Error fetching tools:", toolsError);
          setIsLoading(false);
          return;
        }

        // Map tools by slug
        const toolsBySlug = new Map(
          tools?.map((t: ToolData) => [t.slug, t]) || []
        );

        // Sort by role order: popular -> easy -> free
        const roleOrder: Array<"popular" | "easy" | "free"> = ["popular", "easy", "free"];
        const sortedBest = categoryBest
          .map((item: ToolCategoryBest) => {
            const tool = toolsBySlug.get(item.tool_slug);
            if (!tool) return null;
            return {
              role: item.role,
              tool,
              note: item.note,
            };
          })
          .filter((item): item is Best3Tool => item !== null)
          .sort((a, b) => roleOrder.indexOf(a.role) - roleOrder.indexOf(b.role))
          .slice(0, 3); // Ensure exactly 3

        setBest3Tools(sortedBest);
      } catch (error) {
        console.error("[CategoryDetail] Error loading best 3 tools:", error);
      } finally {
        setIsLoading(false);
      }
    }

    loadBest3Tools();
  }, [categoryName]);

  const encodedCategory = encodeURIComponent(categoryName);

  return (
    <div className="min-h-screen bg-slate-950 px-4 pb-24 pt-6">
      <div className="mx-auto max-w-4xl">
        {/* Header */}
        <header className="mb-8">
          <h1 className="text-2xl font-bold text-slate-50 sm:text-3xl">
            {categoryName}
          </h1>
          <p className="mt-2 text-sm text-slate-400 sm:text-base">
            Best AI tools for {categoryName.toLowerCase()}.
          </p>
        </header>

        {/* Best 3 Tools Section */}
        <section className="mb-8">
          <div className="mb-4 flex items-center gap-2">
            <h2 className="text-xl font-bold text-slate-50">Best 3 Tools</h2>
            <span className="rounded-full border border-emerald-500/20 bg-emerald-500/10 px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide text-emerald-200">
              Recommended
            </span>
          </div>
          <p className="mb-6 text-sm text-slate-400">
            Hand-picked tools for {categoryName.toLowerCase()}.
          </p>

          {isLoading ? (
            <div className="flex min-h-[200px] items-center justify-center">
              <p className="text-sm text-slate-400">Loading...</p>
            </div>
          ) : best3Tools.length === 0 ? (
            <div className="rounded-2xl border border-dashed border-slate-700/70 bg-slate-900/30 p-8 text-center">
              <p className="text-sm text-slate-400">
                No recommended tools yet for this category.
              </p>
            </div>
          ) : (
            <div className="space-y-4">
              {best3Tools.map((item, index) => {
                const tool = item.tool;
                const description =
                  item.note || tool.desc_en || tool.description || "No description available.";
                const visitUrl = tool.affiliate_url || tool.website_url || tool.url || "#";

                return (
                  <div
                    key={tool.id}
                    className="rounded-2xl border border-slate-800/70 bg-slate-900/70 p-5"
                  >
                    {/* Role Label */}
                    <div className="mb-3 flex items-center gap-2">
                      <span className="rounded-full bg-emerald-500/20 px-2.5 py-1 text-xs font-semibold text-emerald-300">
                        {ROLE_LABELS[item.role]}
                      </span>
                    </div>

                    {/* Tool Info */}
                    <div className="mb-4 flex items-start gap-3">
                      <ToolLogo
                        tool={{
                          name: tool.name,
                          image: tool.image,
                          website_url: tool.website_url || tool.url,
                        }}
                        size={48}
                      />
                      <div className="flex-1">
                        <h3 className="mb-1 text-lg font-semibold text-slate-50">
                          {tool.name}
                        </h3>
                        <p className="text-sm leading-relaxed text-slate-400">
                          {description}
                        </p>
                      </div>
                    </div>

                    {/* CTA Buttons */}
                    <div className="flex flex-wrap gap-2">
                      <Link
                        href={`/tools/${tool.slug}`}
                        className="inline-flex items-center gap-2 rounded-lg border border-slate-700 bg-slate-800/50 px-4 py-2 text-sm font-medium text-slate-200 transition hover:border-slate-600 hover:bg-slate-800"
                      >
                        View details
                      </Link>
                      <AffiliateLinkButton
                        href={visitUrl}
                        placement="category_best3"
                        toolSlug={tool.slug}
                        className="inline-flex items-center gap-2 rounded-lg border border-emerald-500/40 bg-emerald-500/10 px-4 py-2 text-sm font-semibold text-emerald-300 transition hover:border-emerald-400 hover:bg-emerald-500/15"
                      >
                        <ExternalLink className="h-4 w-4" />
                        Visit {tool.name}
                      </AffiliateLinkButton>
                    </div>
                  </div>
                );
              })}
            </div>
          )}

          {/* More Tools Button */}
          <div className="mt-6 flex justify-center">
            <Link
              href={`/tools?category=${encodedCategory}`}
              className="inline-flex items-center justify-center gap-2 rounded-full border border-emerald-500/40 bg-emerald-500/10 px-6 py-3 text-sm font-semibold uppercase tracking-wide text-emerald-300 transition hover:border-emerald-400 hover:bg-emerald-500/15"
            >
              View all tools
              <span className="transition group-hover:translate-x-0.5">→</span>
            </Link>
          </div>
        </section>
      </div>
    </div>
  );
}



