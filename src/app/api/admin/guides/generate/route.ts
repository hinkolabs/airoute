import { NextResponse } from "next/server";
import { createAdminSupabase } from "@/lib/supabase/admin";
import { requireAdminOrThrow } from "@/lib/admin-auth";
import { buildFreeGuideEn, computeVariant, type Variant } from "@/lib/guides/free-templates/en";
// NOTE: KR template is available but disabled for v1.
// When lang="kr" is requested, we fallback to EN content for now.
// Future: re-enable buildFreeGuideKr when KR content is approved.
// import { buildFreeGuideKr } from "@/lib/guides/free-templates/kr";

// =====================================================
// FREE Template-based guide generation (no OpenAI cost)
// =====================================================

type Recipe = {
  guide_type: "route_based" | "tool_based" | "safety";
  primary_intent: string;
  primary_route: string | null;
  cta_type: "route" | "tool" | "mixed" | null;
  cta_route_slug: string | null;
  cta_tool_slug: string | null;
  title_seed: string;
  taxonomy: string; // categorization for dedupe + filtering
};

// Route 기반 레시피 (70%)
const ROUTE_RECIPES: Recipe[] = [
  {
    guide_type: "route_based",
    primary_intent: "turn-long-videos-into-shorts",
    primary_route: "long-to-shorts",
    cta_type: "route",
    cta_route_slug: "long-to-shorts",
    cta_tool_slug: null,
    title_seed: "How to turn long videos into YouTube Shorts",
    taxonomy: "video-editing",
  },
  {
    guide_type: "route_based",
    primary_intent: "polish-shorts-and-reels",
    primary_route: "polish-shorts",
    cta_type: "route",
    cta_route_slug: "polish-shorts",
    cta_tool_slug: null,
    title_seed: "How to polish Shorts and Reels quickly",
    taxonomy: "video-editing",
  },
  {
    guide_type: "route_based",
    primary_intent: "write-blog-posts-faster",
    primary_route: "blog-writing",
    cta_type: "route",
    cta_route_slug: "blog-writing",
    cta_tool_slug: null,
    title_seed: "How to write blog posts faster with AI",
    taxonomy: "content-writing",
  },
  {
    guide_type: "route_based",
    primary_intent: "generate-social-media-images",
    primary_route: "social-images",
    cta_type: "route",
    cta_route_slug: "social-images",
    cta_tool_slug: null,
    title_seed: "How to generate social media images with AI",
    taxonomy: "image-generation",
  },
  {
    guide_type: "route_based",
    primary_intent: "create-product-descriptions",
    primary_route: "product-copy",
    cta_type: "route",
    cta_route_slug: "product-copy",
    cta_tool_slug: null,
    title_seed: "How to create product descriptions with AI",
    taxonomy: "content-writing",
  },
  {
    guide_type: "route_based",
    primary_intent: "edit-podcast-audio",
    primary_route: "podcast-editing",
    cta_type: "route",
    cta_route_slug: "podcast-editing",
    cta_tool_slug: null,
    title_seed: "How to edit podcast audio with AI tools",
    taxonomy: "audio-editing",
  },
  {
    guide_type: "route_based",
    primary_intent: "generate-background-music",
    primary_route: "background-music",
    cta_type: "route",
    cta_route_slug: "background-music",
    cta_tool_slug: null,
    title_seed: "How to generate background music for videos",
    taxonomy: "audio-generation",
  },
];

// Tool 기반 레시피 (20%)
const TOOL_RECIPES: Recipe[] = [
  {
    guide_type: "tool_based",
    primary_intent: "midjourney-beginner-guide",
    primary_route: null,
    cta_type: "tool",
    cta_route_slug: null,
    cta_tool_slug: "midjourney",
    title_seed: "Midjourney Beginner Guide: Getting Started",
    taxonomy: "image-generation",
  },
  {
    guide_type: "tool_based",
    primary_intent: "chatgpt-writing-tips",
    primary_route: null,
    cta_type: "tool",
    cta_route_slug: null,
    cta_tool_slug: "chatgpt",
    title_seed: "ChatGPT Writing Tips for Better Results",
    taxonomy: "content-writing",
  },
  {
    guide_type: "tool_based",
    primary_intent: "runway-video-editing",
    primary_route: null,
    cta_type: "tool",
    cta_route_slug: null,
    cta_tool_slug: "runway",
    title_seed: "Runway Video Editing: A Complete Guide",
    taxonomy: "video-editing",
  },
  {
    guide_type: "tool_based",
    primary_intent: "elevenlabs-voice-cloning",
    primary_route: null,
    cta_type: "tool",
    cta_route_slug: null,
    cta_tool_slug: "elevenlabs",
    title_seed: "ElevenLabs Voice Cloning Tutorial",
    taxonomy: "audio-generation",
  },
];

// Trust/Safety 레시피 (10%)
const SAFETY_RECIPES: Recipe[] = [
  {
    guide_type: "safety",
    primary_intent: "ai-tool-safety-checklist",
    primary_route: null,
    cta_type: null,
    cta_route_slug: null,
    cta_tool_slug: null,
    title_seed: "AI Tool Safety Checklist for Beginners",
    taxonomy: "trust-safety",
  },
  {
    guide_type: "safety",
    primary_intent: "avoid-ai-scams",
    primary_route: null,
    cta_type: null,
    cta_route_slug: null,
    cta_tool_slug: null,
    title_seed: "How to Avoid AI Tool Scams",
    taxonomy: "trust-safety",
  },
  {
    guide_type: "safety",
    primary_intent: "ai-copyright-basics",
    primary_route: null,
    cta_type: null,
    cta_route_slug: null,
    cta_tool_slug: null,
    title_seed: "AI Copyright Basics: What You Need to Know",
    taxonomy: "trust-safety",
  },
];

function selectRandomRecipe(): Recipe {
  const rand = Math.random() * 100;
  if (rand < 70) {
    return ROUTE_RECIPES[Math.floor(Math.random() * ROUTE_RECIPES.length)];
  } else if (rand < 90) {
    return TOOL_RECIPES[Math.floor(Math.random() * TOOL_RECIPES.length)];
  } else {
    return SAFETY_RECIPES[Math.floor(Math.random() * SAFETY_RECIPES.length)];
  }
}

function generateRecipeKey(recipe: Recipe, lang: string, variant: Variant): string {
  // Format: <mode>:<bucket>:<primary_key>:<lang>:<variant>
  // - mode: guide_type (route_based, tool_based, safety)
  // - bucket: taxonomy (video-editing, content-writing, etc.)
  // - primary_key: primary_intent
  // - lang: en or kr (for future multi-language support without collision)
  // - variant: A, B, or C
  return [
    recipe.guide_type,
    recipe.taxonomy,
    recipe.primary_intent,
    lang,
    variant,
  ].join(":");
}

const VARIANTS: Variant[] = ["A", "B", "C"];

function rotateVariant(current: Variant): Variant {
  const idx = VARIANTS.indexOf(current);
  return VARIANTS[(idx + 1) % 3];
}

function generateSlug(primaryIntent: string): string {
  const slugified = primaryIntent
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "");
  return `${slugified}-${Date.now()}`;
}

function getKSTDayStart(): string {
  const now = new Date();
  const kstOffset = 9 * 60 * 60 * 1000;
  const kstNow = new Date(now.getTime() + kstOffset);
  const kstDayStart = new Date(kstNow.toISOString().slice(0, 10) + "T00:00:00.000Z");
  return new Date(kstDayStart.getTime() - kstOffset).toISOString();
}

function getKSTDayEnd(): string {
  const now = new Date();
  const kstOffset = 9 * 60 * 60 * 1000;
  const kstNow = new Date(now.getTime() + kstOffset);
  const kstDayEnd = new Date(kstNow.toISOString().slice(0, 10) + "T23:59:59.999Z");
  return new Date(kstDayEnd.getTime() - kstOffset).toISOString();
}

const ALL_RECIPES = [...ROUTE_RECIPES, ...TOOL_RECIPES, ...SAFETY_RECIPES];

export async function POST(req: Request) {
  try {
    await requireAdminOrThrow();
  } catch {
    return NextResponse.json(
      { ok: false, error: "Unauthorized: Admin authentication required" },
      { status: 401 }
    );
  }

  try {
    // Read lang from JSON body only
    const body = await req.json().catch(() => ({}));
    const bodyLang = body.lang;
    
    // Determine lang: body > default "en"
    // Allowed values: "en" | "kr", default to "en" if missing/invalid
    const lang = (bodyLang === "kr" ? "kr" : "en") as "en" | "kr";
    
    // IMPORTANT: For now, actual content is always generated in EN.
    // When KR templates are approved, change this to: const contentLang = lang;
    const contentLang: "en" = "en";

    const supabase = createAdminSupabase();

    // Daily limit check (KST, 2 per day for FREE generation)
    const { data: todayLogs } = await supabase
      .from("admin_guide_generation_logs")
      .select("id")
      .eq("mode", "auto")
      .gte("created_at", getKSTDayStart())
      .lt("created_at", getKSTDayEnd());

    const todayCount = todayLogs?.length || 0;
    if (todayCount >= 2) {
      return NextResponse.json(
        { ok: false, error: "Daily template generation limit (2) reached. Try again tomorrow." },
        { status: 429 }
      );
    }

    // Recipe selection with duplication check + variant collision guard
    const MAX_RETRIES = 10;
    let selectedRecipe: Recipe | null = null;
    let recipeKey: string = "";
    let selectedVariant: Variant = "A";
    const triedKeys = new Set<string>();

    for (let i = 0; i < MAX_RETRIES; i++) {
      const recipe = i < 5 
        ? selectRandomRecipe() 
        : ALL_RECIPES[i % ALL_RECIPES.length];
      
      // Compute default variant deterministically
      const defaultVariant = computeVariant(recipe.primary_intent, recipe.guide_type);
      let variant = defaultVariant;
      
      // Dedupe query: check for existing guide with same attributes
      // Rule: same lang + guide_type + primary_intent + taxonomy + cta_type
      // Plus: route_based includes primary_route, tool_based includes cta_tool_slug
      let dedupeQuery = supabase
        .from("guides")
        .select("id, generation_version")
        .eq("lang", lang)
        .eq("guide_type", recipe.guide_type)
        .eq("primary_intent", recipe.primary_intent)
        .eq("taxonomy", recipe.taxonomy)
        .in("status", ["approved", "review", "draft"]);

      // Add type-specific fields to dedupe
      if (recipe.guide_type === "route_based" && recipe.primary_route) {
        dedupeQuery = dedupeQuery.eq("primary_route", recipe.primary_route);
      } else if (recipe.guide_type === "tool_based" && recipe.cta_tool_slug) {
        dedupeQuery = dedupeQuery.eq("cta_tool_slug", recipe.cta_tool_slug);
      }
      if (recipe.cta_type) {
        dedupeQuery = dedupeQuery.eq("cta_type", recipe.cta_type);
      }

      const { data: recentGuides } = await dedupeQuery
        .order("created_at", { ascending: false })
        .limit(30);

      // Extract existing variants from recent guides' recipe_keys in logs
      const { data: recentLogs } = await supabase
        .from("admin_guide_generation_logs")
        .select("recipe_key")
        .in("guide_id", (recentGuides || []).map(g => g.id));

      const existingVariants = new Set<string>();
      for (const log of recentLogs || []) {
        // recipe_key format: guide_type:taxonomy:primary_intent:lang:variant
        // Variant is the last segment (A, B, or C)
        // Also support legacy format: guide_type:primary_intent:tone:variant::lang
        const newFormatMatch = log.recipe_key?.match(/:([ABC])$/);
        const legacyFormatMatch = log.recipe_key?.match(/:([ABC])::/);
        const match = newFormatMatch || legacyFormatMatch;
        if (match) existingVariants.add(match[1]);
      }

      // Rotate variant if collision (max 3 attempts: A→B→C)
      let variantAttempts = 0;
      while (existingVariants.has(variant) && variantAttempts < 3) {
        variant = rotateVariant(variant);
        variantAttempts++;
      }

      // If all variants exhausted for this recipe, try another recipe
      if (variantAttempts >= 3 && existingVariants.has(variant)) {
        continue;
      }

      recipeKey = generateRecipeKey(recipe, lang, variant);
      
      if (triedKeys.has(recipeKey)) continue;
      triedKeys.add(recipeKey);

      // Final check: no guide with this exact recipe_key exists
      const { data: exactMatch } = await supabase
        .from("admin_guide_generation_logs")
        .select("id")
        .eq("recipe_key", recipeKey)
        .limit(1);

      if (!exactMatch || exactMatch.length === 0) {
        selectedRecipe = recipe;
        selectedVariant = variant;
        break;
      }
    }

    if (!selectedRecipe) {
      return NextResponse.json(
        { ok: false, error: "No available recipes. All recipe+variant combinations are in use." },
        { status: 409 }
      );
    }

    // =====================================================
    // FREE TEMPLATE PATH (v1-free-en) - NO OpenAI calls
    // =====================================================
    // This endpoint uses deterministic template-based generation.
    // Content is derived from primary_route / primary_intent.
    // English only. No AI/LLM API calls.
    
    const slug = generateSlug(selectedRecipe.primary_intent);
    const now = new Date().toISOString();

    // v1-free-en: Always generate English content regardless of lang parameter.
    // This ensures 100% English text output for free generation.
    // When KR support is enabled, add conditional logic here based on contentLang.
    // buildFreeGuideEn uses deterministic templates - NO OpenAI calls
    const generatedGuide = buildFreeGuideEn({
      recipe_key: recipeKey,
      guide_type: selectedRecipe.guide_type,
      primary_intent: selectedRecipe.primary_intent,
      primary_route: selectedRecipe.primary_route,
      cta_type: selectedRecipe.cta_type,
      cta_route_slug: selectedRecipe.cta_route_slug,
      cta_tool_slug: selectedRecipe.cta_tool_slug,
      variant: selectedVariant,
    });
    
    const { title, excerpt, content } = generatedGuide;
    // generation_version tracks which template was used
    // v1-free-en = English-only free template (current) - NO OpenAI
    // v1-free-kr = Korean free template (future, when enabled)
    const generationVersion = `v1-free-${contentLang}`;

    const { data: guide, error: insertError } = await supabase
      .from("guides")
      .insert({
        slug,
        title,
        excerpt,
        content,
        status: "review",
        lang,
        taxonomy: selectedRecipe.taxonomy,
        guide_type: selectedRecipe.guide_type,
        primary_intent: selectedRecipe.primary_intent,
        primary_route: selectedRecipe.primary_route,
        cta_type: selectedRecipe.cta_type,
        cta_route_slug: selectedRecipe.cta_route_slug,
        cta_tool_slug: selectedRecipe.cta_tool_slug,
        generation_version: generationVersion,
        created_at: now,
        updated_at: now,
      })
      .select("id, slug")
      .single();

    if (insertError) {
      return NextResponse.json(
        { ok: false, error: insertError.message },
        { status: 500 }
      );
    }

    // Validate required fields before insert
    const mode = "auto";
    if (!mode || typeof mode !== "string" || mode.trim() === "") {
      return NextResponse.json(
        { ok: false, error: "Internal error: mode is required and must be a non-empty string" },
        { status: 500 }
      );
    }
    if (!recipeKey || typeof recipeKey !== "string" || recipeKey.trim() === "") {
      return NextResponse.json(
        { ok: false, error: "Internal error: recipe_key is required and must be a non-empty string" },
        { status: 500 }
      );
    }

    // Log generation
    // CRITICAL: If log insert fails, the entire operation must fail
    // lang is NOT NULL, so it must be included
    const { error: logError } = await supabase
      .from("admin_guide_generation_logs")
      .insert({
        guide_id: guide.id,
        mode,
        recipe_key: recipeKey,
        created_by: "admin",
        created_at: now,
        lang,
      });

    if (logError) {
      console.error("[admin/guides/generate] Failed to insert generation log:", logError);
      return NextResponse.json(
        { ok: false, error: `Failed to log generation: ${logError.message}` },
        { status: 500 }
      );
    }

    // Re-fetch quota after log insert to ensure consistency
    const { data: updatedTodayLogs } = await supabase
      .from("admin_guide_generation_logs")
      .select("id")
      .eq("mode", "auto")
      .gte("created_at", getKSTDayStart())
      .lt("created_at", getKSTDayEnd());

    const updatedTodayCount = updatedTodayLogs?.length || 0;
    const remainingToday = Math.max(0, 2 - updatedTodayCount);

    const kstStartIso = getKSTDayStart();
    const kstEndIso = getKSTDayEnd();
    const nowIso = new Date().toISOString();

    const response: {
      ok: boolean;
      id: string;
      slug: string;
      remainingToday: number;
      lang: string;
      debug?: {
        kstStartIso: string;
        kstEndIso: string;
        usedToday: number;
        lang: string;
        nowIso: string;
      };
    } = {
      ok: true,
      id: guide.id,
      slug: guide.slug,
      remainingToday,
      lang,
    };

    if (process.env.NODE_ENV !== "production") {
      response.debug = {
        kstStartIso,
        kstEndIso,
        usedToday: updatedTodayCount,
        lang,
        nowIso,
      };
    }

    return NextResponse.json(response);
  } catch (e: unknown) {
    const message = e instanceof Error ? e.message : "Unknown error";
    return NextResponse.json({ ok: false, error: message }, { status: 500 });
  }
}
