import { NextResponse } from "next/server";
import { createAdminSupabase } from "@/lib/supabase/admin";
import { buildFreeGuideEn, computeVariant, type Variant } from "@/lib/guides/free-templates/en";

// =====================================================
// Vercel Cron job for automatic free guide generation
// Schedule: UTC 03:00 (KST 12:00), UTC 14:00 (KST 23:00)
// Uses v1-free-en template (no OpenAI calls)
// =====================================================

type Recipe = {
  guide_type: "route_based" | "tool_based" | "safety";
  primary_intent: string;
  primary_route: string | null;
  cta_type: "route" | "tool" | "mixed" | null;
  cta_route_slug: string | null;
  cta_tool_slug: string | null;
  title_seed: string;
  taxonomy: string;
};

const ROUTE_RECIPES: Recipe[] = [
  { guide_type: "route_based", primary_intent: "turn-long-videos-into-shorts", primary_route: "long-to-shorts", cta_type: "route", cta_route_slug: "long-to-shorts", cta_tool_slug: null, title_seed: "How to turn long videos into YouTube Shorts", taxonomy: "video-editing" },
  { guide_type: "route_based", primary_intent: "polish-shorts-and-reels", primary_route: "polish-shorts", cta_type: "route", cta_route_slug: "polish-shorts", cta_tool_slug: null, title_seed: "How to polish Shorts and Reels quickly", taxonomy: "video-editing" },
  { guide_type: "route_based", primary_intent: "write-blog-posts-faster", primary_route: "blog-writing", cta_type: "route", cta_route_slug: "blog-writing", cta_tool_slug: null, title_seed: "How to write blog posts faster with AI", taxonomy: "content-writing" },
  { guide_type: "route_based", primary_intent: "generate-social-media-images", primary_route: "social-images", cta_type: "route", cta_route_slug: "social-images", cta_tool_slug: null, title_seed: "How to generate social media images with AI", taxonomy: "image-generation" },
  { guide_type: "route_based", primary_intent: "create-product-descriptions", primary_route: "product-copy", cta_type: "route", cta_route_slug: "product-copy", cta_tool_slug: null, title_seed: "How to create product descriptions with AI", taxonomy: "content-writing" },
  { guide_type: "route_based", primary_intent: "edit-podcast-audio", primary_route: "podcast-editing", cta_type: "route", cta_route_slug: "podcast-editing", cta_tool_slug: null, title_seed: "How to edit podcast audio with AI tools", taxonomy: "audio-editing" },
  { guide_type: "route_based", primary_intent: "generate-background-music", primary_route: "background-music", cta_type: "route", cta_route_slug: "background-music", cta_tool_slug: null, title_seed: "How to generate background music for videos", taxonomy: "audio-generation" },
];

const TOOL_RECIPES: Recipe[] = [
  { guide_type: "tool_based", primary_intent: "midjourney-beginner-guide", primary_route: null, cta_type: "tool", cta_route_slug: null, cta_tool_slug: "midjourney", title_seed: "Midjourney Beginner Guide: Getting Started", taxonomy: "image-generation" },
  { guide_type: "tool_based", primary_intent: "chatgpt-writing-tips", primary_route: null, cta_type: "tool", cta_route_slug: null, cta_tool_slug: "chatgpt", title_seed: "ChatGPT Writing Tips for Better Results", taxonomy: "content-writing" },
  { guide_type: "tool_based", primary_intent: "runway-video-editing", primary_route: null, cta_type: "tool", cta_route_slug: null, cta_tool_slug: "runway", title_seed: "Runway Video Editing: A Complete Guide", taxonomy: "video-editing" },
  { guide_type: "tool_based", primary_intent: "elevenlabs-voice-cloning", primary_route: null, cta_type: "tool", cta_route_slug: null, cta_tool_slug: "elevenlabs", title_seed: "ElevenLabs Voice Cloning Tutorial", taxonomy: "audio-generation" },
];

const SAFETY_RECIPES: Recipe[] = [
  { guide_type: "safety", primary_intent: "ai-tool-safety-checklist", primary_route: null, cta_type: null, cta_route_slug: null, cta_tool_slug: null, title_seed: "AI Tool Safety Checklist for Beginners", taxonomy: "trust-safety" },
  { guide_type: "safety", primary_intent: "avoid-ai-scams", primary_route: null, cta_type: null, cta_route_slug: null, cta_tool_slug: null, title_seed: "How to Avoid AI Tool Scams", taxonomy: "trust-safety" },
  { guide_type: "safety", primary_intent: "ai-copyright-basics", primary_route: null, cta_type: null, cta_route_slug: null, cta_tool_slug: null, title_seed: "AI Copyright Basics: What You Need to Know", taxonomy: "trust-safety" },
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
  return [recipe.guide_type, recipe.taxonomy, recipe.primary_intent, lang, variant].join(":");
}

function generateSlug(primaryIntent: string): string {
  const slugified = primaryIntent.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "");
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

const VARIANTS: Variant[] = ["A", "B", "C"];

function rotateVariant(current: Variant): Variant {
  const idx = VARIANTS.indexOf(current);
  return VARIANTS[(idx + 1) % 3];
}

const ALL_RECIPES = [...ROUTE_RECIPES, ...TOOL_RECIPES, ...SAFETY_RECIPES];

// Vercel Cron detection: Vercel cannot set custom headers, so we detect cron requests
// by checking Vercel-specific headers/user-agent. Local testing uses ?secret= or x-cron-secret.
function isVercelCron(req: Request): boolean {
  const vercelCronHeader = req.headers.get("x-vercel-cron");
  const vercelDeploymentUrl = req.headers.get("x-vercel-deployment-url");
  const userAgent = req.headers.get("user-agent") || "";

  return (
    vercelCronHeader === "1" ||
    (vercelDeploymentUrl && vercelDeploymentUrl.length > 0 && userAgent.toLowerCase().includes("vercel")) ||
    userAgent.toLowerCase().includes("vercel-cron")
  );
}

async function handleCron(req: Request) {
  // Security: Allow Vercel Cron (auto-detected) OR secret-based access for local testing
  // Vercel Cron cannot set custom headers, so we detect it via headers/user-agent
  // Local dev: allow query param ?secret= only when NODE_ENV !== "production"
  const isVercel = isVercelCron(req);
  const secretHeader = req.headers.get("x-cron-secret");
  const secretQuery = process.env.NODE_ENV !== "production" ? new URL(req.url).searchParams.get("secret") : null;
  const providedSecret = secretHeader || secretQuery;
  const expectedSecret = process.env.CRON_SECRET;

  // If Vercel Cron, allow without secret
  if (isVercel) {
    // Vercel Cron request - allow
  } else {
    // Not Vercel Cron - require secret
    if (!expectedSecret) {
      return NextResponse.json(
        { ok: false, generated: false, reason: "Cron secret not configured" },
        { status: 500 }
      );
    }

    if (!providedSecret || providedSecret !== expectedSecret) {
      return NextResponse.json(
        { ok: false, generated: false, reason: "Unauthorized" },
        { status: 401 }
      );
    }
  }

  try {
    const supabase = createAdminSupabase();
    const lang = "en" as const;
    const contentLang: "en" = "en";

    // Daily limit check (KST, 2 per day)
    const { data: todayLogs } = await supabase
      .from("admin_guide_generation_logs")
      .select("id")
      .eq("mode", "auto")
      .gte("created_at", getKSTDayStart())
      .lt("created_at", getKSTDayEnd());

    const todayCount = todayLogs?.length || 0;
    if (todayCount >= 2) {
      return NextResponse.json({
        ok: true,
        generated: false,
        reason: "Daily limit (2) already reached",
        todayCount,
        limit: 2,
      });
    }

    // Recipe selection with duplication check
    const MAX_RETRIES = 10;
    let selectedRecipe: Recipe | null = null;
    let recipeKey: string = "";
    let selectedVariant: Variant = "A";
    const triedKeys = new Set<string>();

    for (let i = 0; i < MAX_RETRIES; i++) {
      const recipe = i < 5 ? selectRandomRecipe() : ALL_RECIPES[i % ALL_RECIPES.length];
      const defaultVariant = computeVariant(recipe.primary_intent, recipe.guide_type);
      let variant = defaultVariant;

      let dedupeQuery = supabase
        .from("guides")
        .select("id")
        .eq("lang", lang)
        .eq("guide_type", recipe.guide_type)
        .eq("primary_intent", recipe.primary_intent)
        .eq("taxonomy", recipe.taxonomy)
        .in("status", ["approved", "review", "draft"]);

      if (recipe.guide_type === "route_based" && recipe.primary_route) {
        dedupeQuery = dedupeQuery.eq("primary_route", recipe.primary_route);
      } else if (recipe.guide_type === "tool_based" && recipe.cta_tool_slug) {
        dedupeQuery = dedupeQuery.eq("cta_tool_slug", recipe.cta_tool_slug);
      }
      if (recipe.cta_type) {
        dedupeQuery = dedupeQuery.eq("cta_type", recipe.cta_type);
      }

      const { data: recentGuides } = await dedupeQuery.order("created_at", { ascending: false }).limit(30);
      const { data: recentLogs } = await supabase
        .from("admin_guide_generation_logs")
        .select("recipe_key")
        .in("guide_id", (recentGuides || []).map((g) => g.id));

      const existingVariants = new Set<string>();
      for (const log of recentLogs || []) {
        const newFormatMatch = log.recipe_key?.match(/:([ABC])$/);
        const legacyFormatMatch = log.recipe_key?.match(/:([ABC])::/);
        const match = newFormatMatch || legacyFormatMatch;
        if (match) existingVariants.add(match[1]);
      }

      let variantAttempts = 0;
      while (existingVariants.has(variant) && variantAttempts < 3) {
        variant = rotateVariant(variant);
        variantAttempts++;
      }

      if (variantAttempts >= 3 && existingVariants.has(variant)) {
        continue;
      }

      recipeKey = generateRecipeKey(recipe, lang, variant);
      if (triedKeys.has(recipeKey)) continue;
      triedKeys.add(recipeKey);

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
      return NextResponse.json({
        ok: true,
        generated: false,
        reason: "No available recipes",
        todayCount,
        limit: 2,
      });
    }

    // Generate guide using free template (no OpenAI)
    const slug = generateSlug(selectedRecipe.primary_intent);
    const now = new Date().toISOString();

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
    const generationVersion = `v1-free-${contentLang}`;

    // Ensure cta_type is never null (guides table NOT NULL constraint)
    // Safety recipes have null cta_type, so fallback to "route"
    const safeCtaType = (selectedRecipe.cta_type ?? "route") as "route" | "tool" | "mixed";

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
        cta_type: safeCtaType,
        cta_route_slug: selectedRecipe.cta_route_slug,
        cta_tool_slug: selectedRecipe.cta_tool_slug,
        generation_version: generationVersion,
        created_at: now,
        updated_at: now,
      })
      .select("id, slug")
      .single();

    if (insertError) {
      return NextResponse.json({
        ok: false,
        generated: false,
        reason: `guide_insert_failed: ${insertError.message}`,
        todayCount,
        limit: 2,
      });
    }

    // Insert log with created_by = 'cron'
    // CRITICAL: Must always insert log when guide insert succeeds
    const mode = "auto";
    const { error: logError } = await supabase.from("admin_guide_generation_logs").insert({
      guide_id: guide.id,
      mode,
      recipe_key: recipeKey,
      created_by: "cron",
      created_at: now,
      lang,
    });

    if (logError) {
      // Log insert failed after guide insert - include guide info for debugging
      return NextResponse.json({
        ok: false,
        generated: false,
        reason: `log_insert_failed: ${logError.message}`,
        guideId: guide.id,
        guideSlug: guide.slug,
        todayCount,
        limit: 2,
      });
    }

    return NextResponse.json({
      ok: true,
      generated: true,
      todayCount: todayCount + 1,
      limit: 2,
    });
  } catch (e: unknown) {
    const message = e instanceof Error ? e.message : "Unknown error";
    return NextResponse.json(
      { ok: false, generated: false, reason: message },
      { status: 500 }
    );
  }
}

export async function GET(req: Request) {
  return handleCron(req);
}

export async function POST(req: Request) {
  return handleCron(req);
}

