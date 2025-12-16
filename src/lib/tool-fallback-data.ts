/**
 * Fallback Tool Data
 * Used when tools are not in Supabase DB yet
 */

import type { ToolRecord } from "./tools";

export const FALLBACK_TOOLS: Record<string, Partial<ToolRecord>> = {
  "filmora": {
    id: "filmora",
    name: "Filmora",
    slug: "filmora",
    description: "Easy-to-use video editing software with AI features for creators. Includes AI copilot, auto-captions, background removal, and effects library for fast content production.",
    category_id: "video",
    tags: ["Video", "Editing", "Creator", "AI Features"],
    badge: null,
    url: "https://tidd.ly/44vL1oI",
    affiliate_url: "https://tidd.ly/44vL1oI",
    is_active: true,
    desc_en: "Easy-to-use video editing software with AI features for creators. Includes AI copilot, auto-captions, background removal, and effects library for fast content production.",
    desc_simple_en: "Easy-to-use video editing software with AI features for creators",
    task_category: "video",
    best_for: "Video editing, subtitles, exporting",
    why_pick: "Intuitive interface with powerful AI tools for creators at all levels",
  },
  "prowritingaid": {
    id: "prowritingaid",
    name: "ProWritingAid",
    slug: "prowritingaid",
    description: "Deep writing feedback for clarity, style, and readability. Goes beyond grammar to improve sentence structure, word choice, and overall writing quality with detailed reports.",
    category_id: "writing",
    tags: ["Editing", "Grammar", "Style", "Professional"],
    badge: null,
    url: "https://tidd.ly/48Y1lQu",
    affiliate_url: "https://tidd.ly/48Y1lQu",
    is_active: true,
    desc_en: "Deep writing feedback for clarity, style, and readability. Goes beyond grammar to improve sentence structure, word choice, and overall writing quality with detailed reports.",
    desc_simple_en: "Deep writing feedback for clarity, style, and readability",
    task_category: "writing",
    best_for: "Writing Improvement",
    why_pick: "Great for polishing long-form and professional writing",
  },
  "opus-clip": {
    id: "opus-clip",
    name: "Opus Clip",
    slug: "opus-clip",
    description: "Opus Clip automatically finds the best moments in long videos and converts them into social-ready Shorts with captions and styles—ideal for YouTube Shorts, TikTok, and Reels.",
    category_id: "video",
    tags: ["Video", "Shorts", "Repurposing", "Captions", "Creator"],
    badge: "Trending",
    url: "https://www.opus.pro/?via=165d30",
    affiliate_url: "https://www.opus.pro/?via=165d30",
    is_active: true,
    desc_en: "Opus Clip automatically finds the best moments in long videos and converts them into social-ready Shorts with captions and styles—ideal for YouTube Shorts, TikTok, and Reels.",
    desc_simple_en: "Turn long videos into viral Shorts automatically with AI highlights, captions, and templates",
    task_category: "video",
    best_for: "Shorts & Repurposing",
    why_pick: "Auto highlight detection • Captions with styles • 9:16 export for Shorts/Reels/TikTok • Fast repurposing workflow for creators",
  },
};

export function getFallbackTool(slug: string): ToolRecord | null {
  const fallback = FALLBACK_TOOLS[slug];
  if (!fallback) return null;
  
  return fallback as ToolRecord;
}

