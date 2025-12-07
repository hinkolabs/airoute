"use client";

import Link from "next/link";
import {
  PageShell,
  SectionTitle,
  ToolCard,
  ToolCardProps,
} from "../_design/components/page";
import { useTheme } from "../_design/providers/theme-provider";
import { cn } from "@/lib/utils";
import type { ToolRecord } from "@/lib/tools";
import { Button } from "@/components/ui/button";

// Path to the full external tools list
const TOOLS_LIST_HREF = "/tools";

// Task-based sections for curated recommendations
// NOTE: toolSlugs should match actual slugs in your database
const TASK_SECTIONS = [
  {
    id: "resume",
    title: "Best for Resume & Writing",
    subtitle: "이력서 · 자기소개서 · 글쓰기에 강한 툴",
    toolSlugs: ["chatgpt", "claude", "notion-ai"],
  },
  {
    id: "logo",
    title: "Best for Logo & Design",
    subtitle: "브랜드 · 로고 · 그래픽 디자인에 적합한 툴",
    toolSlugs: ["midjourney", "dall-e", "canva"],
  },
  {
    id: "image-edit",
    title: "Best for Image Editing",
    subtitle: "이미지 보정 · 배경제거 · 업스케일",
    toolSlugs: ["remove-bg", "upscayl", "photoroom"],
  },
  {
    id: "video",
    title: "Best for Video & Shorts",
    subtitle: "영상 편집 · 숏폼 영상 제작",
    toolSlugs: ["runway", "capcut", "pika"],
  },
];

// Helper to get category label
const CATEGORY_DEFS: { id: string; label: string }[] = [
  { id: "chat", label: "Chat & Text" },
  { id: "image", label: "Image & Design" },
  { id: "video", label: "Video & Editing" },
  { id: "music", label: "Music & Audio" },
];

function categoryLabelFromId(categoryId: string | null): string {
  if (!categoryId) return "Other";
  const found = CATEGORY_DEFS.find((c) => c.id === categoryId);
  return found?.label ?? "Other";
}

/**
 * Filter tags to show only "global-friendly" ones.
 */
function filterDisplayTags(tags: string[] | null | undefined): string[] {
  if (!tags) return [];
  return tags.filter((tag) => /[A-Za-z0-9]/.test(tag));
}

type NormalModePageProps = {
  tools: ToolRecord[];
};

export default function NormalModePage({ tools }: NormalModePageProps) {
  const { theme } = useTheme();

  // Helper to find tool by slug
  function getToolBySlug(slug: string): ToolRecord | undefined {
    return tools.find((t) => t.slug === slug);
  }

  // Convert ToolRecord to ToolCardProps
  function toToolCardProps(tool: ToolRecord): ToolCardProps & { id: string } {
    const displayTags = filterDisplayTags(tool.tags);
    return {
      id: tool.id,
      name: tool.name,
      description:
        tool.description ??
        "This tool does not have a description yet.",
      category: categoryLabelFromId(tool.category_id),
      tags: displayTags,
      badge: tool.badge ?? undefined,
      href: tool.url ?? undefined,
      detailsHref: tool.slug ? `/tools/${tool.slug}` : undefined,
    };
  }

  return (
    <PageShell>
      {/* Hero Section */}
      <section className="pb-4 pt-3 sm:pb-8 sm:pt-8">
        <SectionTitle
          eyebrow="AIROUTE · NORMAL MODE"
          title={
            <>
              Too many{" "}
              <span
                className={
                  theme === "day" ? "text-emerald-600" : "text-emerald-400"
                }
              >
                AI tools?
              </span>
              <br className="hidden sm:block" />
              <span className="block sm:inline">
                We find the best route for you.
              </span>
            </>
          }
          description={
            <>
              Skip the noise. We curate the best AI tools for your task — simple,
              honest, and beginner-friendly.
            </>
          }
        />
      </section>

      {/* Task-Based Recommendation Sections */}
      <section className="space-y-10 pb-10 sm:space-y-12 sm:pb-12">
        {TASK_SECTIONS.map((section) => {
          const sectionTools = section.toolSlugs
            .map((slug) => getToolBySlug(slug))
            .filter((t): t is ToolRecord => t !== undefined && t.description !== null);

          // Skip section if no tools found
          if (sectionTools.length === 0) return null;

          return (
            <div key={section.id} className="space-y-4">
              {/* Section Header */}
              <div>
                <h2
                  className={cn(
                    "text-lg font-semibold sm:text-xl",
                    theme === "day" ? "text-slate-900" : "text-slate-50"
                  )}
                >
                  {section.title}
                </h2>
                {section.subtitle && (
                  <p
                    className={cn(
                      "mt-1 text-sm",
                      theme === "day" ? "text-slate-600" : "text-slate-400"
                    )}
                  >
                    {section.subtitle}
                  </p>
                )}
              </div>

              {/* Tools Grid - max 3 per row */}
              <div className="grid gap-3 sm:grid-cols-2 sm:gap-4 lg:grid-cols-3">
                {sectionTools.slice(0, 3).map((tool) => (
                  <ToolCard key={tool.id} {...toToolCardProps(tool)} variant="compact" />
                ))}
              </div>
            </div>
          );
        })}
      </section>

      {/* Web Bottom Button */}
      <div className="mt-10 hidden sm:flex justify-center">
        <Link href="/tools">
          <Button variant="outline" size="lg" className="rounded-full">
            전체 AI 툴 보기 →
          </Button>
        </Link>
      </div>

      {/* Mobile Bottom Text Link */}
      <div className="mt-8 sm:hidden flex justify-center">
        <Link
          href="/tools"
          className="text-sm font-medium text-slate-600 underline underline-offset-4"
        >
          전체 AI 툴 보기
        </Link>
      </div>

      {/* Footer */}
      <footer
        className={cn(
          "border-t pt-6 text-center text-xs",
          theme === "day"
            ? "border-slate-200 text-slate-500"
            : "border-slate-800/60 text-slate-500"
        )}
      >
        <p>© 2025 Hinko Labs · AIROUTE</p>
        <p className="mt-1">
          <a
            href="#"
            className={cn(
              "transition",
              theme === "day" ? "hover:text-slate-700" : "hover:text-slate-300"
            )}
          >
            Privacy
          </a>
          {" · "}
          <a
            href="#"
            className={cn(
              "transition",
              theme === "day" ? "hover:text-slate-700" : "hover:text-slate-300"
            )}
          >
            Terms
          </a>
          {" · "}
          <a
            href="#"
            className={cn(
              "transition",
              theme === "day" ? "hover:text-slate-700" : "hover:text-slate-300"
            )}
          >
            Contact
          </a>
        </p>
      </footer>
    </PageShell>
  );
}

