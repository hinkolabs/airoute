import { NextResponse } from "next/server";
import { createAdminSupabase } from "@/lib/supabase/admin";
import { createClient } from "@/lib/supabase/server";
import { buildFreeGuideEn, computeVariant, type Variant } from "@/lib/guides/free-templates/en";
import { buildFreeGuideKr } from "@/lib/guides/free-templates/kr";
import { normalizeGuideCta } from "@/lib/guides/payload-normalizer";
import { computeGuideQualityScore } from "@/lib/guides/quality-check";

// =====================================================
// FREE Template-based guide generation (no OpenAI cost)
// =====================================================

type Recipe = {
  guide_type: "route_based" | "tool_based" | "theme";
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

// Theme 레시피 (10%)
const THEME_RECIPES: Recipe[] = [
  {
    guide_type: "theme",
    primary_intent: "ai-tool-safety-checklist",
    primary_route: null,
    cta_type: null,
    cta_route_slug: null,
    cta_tool_slug: null,
    title_seed: "AI Tool Safety Checklist for Beginners",
    taxonomy: "trust-safety",
  },
  {
    guide_type: "theme",
    primary_intent: "avoid-ai-scams",
    primary_route: null,
    cta_type: null,
    cta_route_slug: null,
    cta_tool_slug: null,
    title_seed: "How to Avoid AI Tool Scams",
    taxonomy: "trust-safety",
  },
  {
    guide_type: "theme",
    primary_intent: "ai-copyright-basics",
    primary_route: null,
    cta_type: null,
    cta_route_slug: null,
    cta_tool_slug: null,
    title_seed: "AI Copyright Basics: What You Need to Know",
    taxonomy: "trust-safety",
  },
];

// =====================================================
// KR Pipeline 전용 레시피 (EN routes 공유, KR 독립 pipeline)
// =====================================================
const KR_ROUTE_RECIPES: Recipe[] = [
  {
    guide_type: "route_based",
    primary_intent: "turn-long-videos-into-shorts",
    primary_route: "long-to-shorts",
    cta_type: "route",
    cta_route_slug: "long-to-shorts",
    cta_tool_slug: null,
    title_seed: "긴 영상을 유튜브 쇼츠로 변환하는 방법",
    taxonomy: "video-editing",
  },
  {
    guide_type: "route_based",
    primary_intent: "polish-shorts-and-reels",
    primary_route: "polish-shorts",
    cta_type: "route",
    cta_route_slug: "polish-shorts",
    cta_tool_slug: null,
    title_seed: "쇼츠와 릴스를 빠르게 다듬는 방법",
    taxonomy: "video-editing",
  },
  {
    guide_type: "route_based",
    primary_intent: "write-blog-posts-faster",
    primary_route: "blog-writing",
    cta_type: "route",
    cta_route_slug: "blog-writing",
    cta_tool_slug: null,
    title_seed: "AI로 블로그 글 더 빠르게 작성하기",
    taxonomy: "content-writing",
  },
  {
    guide_type: "route_based",
    primary_intent: "generate-social-media-images",
    primary_route: "social-images",
    cta_type: "route",
    cta_route_slug: "social-images",
    cta_tool_slug: null,
    title_seed: "AI로 SNS 이미지 생성하는 방법",
    taxonomy: "image-generation",
  },
  {
    guide_type: "route_based",
    primary_intent: "create-product-descriptions",
    primary_route: "product-copy",
    cta_type: "route",
    cta_route_slug: "product-copy",
    cta_tool_slug: null,
    title_seed: "AI로 상품 설명 문구 만들기",
    taxonomy: "content-writing",
  },
  {
    guide_type: "route_based",
    primary_intent: "edit-podcast-audio",
    primary_route: "podcast-editing",
    cta_type: "route",
    cta_route_slug: "podcast-editing",
    cta_tool_slug: null,
    title_seed: "AI 도구로 팟캐스트 오디오 편집하기",
    taxonomy: "audio-editing",
  },
  {
    guide_type: "route_based",
    primary_intent: "generate-background-music",
    primary_route: "background-music",
    cta_type: "route",
    cta_route_slug: "background-music",
    cta_tool_slug: null,
    title_seed: "영상용 배경 음악 자동 생성하기",
    taxonomy: "audio-generation",
  },
];

const KR_TOOL_RECIPES: Recipe[] = [
  {
    guide_type: "tool_based",
    primary_intent: "midjourney-beginner-guide",
    primary_route: null,
    cta_type: "tool",
    cta_route_slug: null,
    cta_tool_slug: "midjourney",
    title_seed: "Midjourney 입문 가이드: 처음 시작하기",
    taxonomy: "image-generation",
  },
  {
    guide_type: "tool_based",
    primary_intent: "chatgpt-writing-tips",
    primary_route: null,
    cta_type: "tool",
    cta_route_slug: null,
    cta_tool_slug: "chatgpt",
    title_seed: "ChatGPT 글쓰기 활용 팁",
    taxonomy: "content-writing",
  },
  {
    guide_type: "tool_based",
    primary_intent: "runway-video-editing",
    primary_route: null,
    cta_type: "tool",
    cta_route_slug: null,
    cta_tool_slug: "runway",
    title_seed: "Runway 영상 편집 완전 가이드",
    taxonomy: "video-editing",
  },
  {
    guide_type: "tool_based",
    primary_intent: "elevenlabs-voice-cloning",
    primary_route: null,
    cta_type: "tool",
    cta_route_slug: null,
    cta_tool_slug: "elevenlabs",
    title_seed: "ElevenLabs 목소리 복제 튜토리얼",
    taxonomy: "audio-generation",
  },
];

const KR_THEME_RECIPES: Recipe[] = [
  {
    guide_type: "theme",
    primary_intent: "ai-tool-safety-checklist",
    primary_route: null,
    cta_type: null,
    cta_route_slug: null,
    cta_tool_slug: null,
    title_seed: "AI 도구 안전 사용 체크리스트",
    taxonomy: "trust-safety",
  },
  {
    guide_type: "theme",
    primary_intent: "avoid-ai-scams",
    primary_route: null,
    cta_type: null,
    cta_route_slug: null,
    cta_tool_slug: null,
    title_seed: "AI 사기 피하는 방법",
    taxonomy: "trust-safety",
  },
  {
    guide_type: "theme",
    primary_intent: "ai-copyright-basics",
    primary_route: null,
    cta_type: null,
    cta_route_slug: null,
    cta_tool_slug: null,
    title_seed: "AI 저작권 기초: 꼭 알아야 할 것들",
    taxonomy: "trust-safety",
  },
];

const KR_ALL_RECIPES = [...KR_ROUTE_RECIPES, ...KR_TOOL_RECIPES, ...KR_THEME_RECIPES];

function selectRandomRecipe(): Recipe {
  const rand = Math.random() * 100;
  if (rand < 70) {
    return ROUTE_RECIPES[Math.floor(Math.random() * ROUTE_RECIPES.length)];
  } else if (rand < 90) {
    return TOOL_RECIPES[Math.floor(Math.random() * TOOL_RECIPES.length)];
  } else {
    return THEME_RECIPES[Math.floor(Math.random() * THEME_RECIPES.length)];
  }
}

function selectKrRecipe(): Recipe {
  const rand = Math.random() * 100;
  if (rand < 70) {
    return KR_ROUTE_RECIPES[Math.floor(Math.random() * KR_ROUTE_RECIPES.length)];
  } else if (rand < 90) {
    return KR_TOOL_RECIPES[Math.floor(Math.random() * KR_TOOL_RECIPES.length)];
  } else {
    return KR_THEME_RECIPES[Math.floor(Math.random() * KR_THEME_RECIPES.length)];
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

const ALL_RECIPES = [...ROUTE_RECIPES, ...TOOL_RECIPES, ...THEME_RECIPES];

export async function POST(req: Request) {
  // Admin auth - check Supabase user + system_admins table (consistent with layout)
  try {
    const supabase = await createClient();
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json(
        { ok: false, error: "Unauthorized: Not logged in" },
        { status: 401 }
      );
    }

    // Check system_admin status
    const { data: systemAdminRow } = await supabase
      .from("system_admins")
      .select("user_id")
      .eq("user_id", user.id)
      .maybeSingle();

    if (!systemAdminRow) {
      return NextResponse.json(
        { ok: false, error: "Unauthorized: Not a system admin" },
        { status: 403 }
      );
    }
  } catch (err) {
    console.error("[generate] Auth error:", err);
    return NextResponse.json(
      { ok: false, error: "Authentication failed" },
      { status: 401 }
    );
  }

  try {
    // Read lang from JSON body only
    const body = await req.json().catch(() => ({}));
    const bodyLang = body.lang;

    // Allowed values: "en" | "kr", default to "en" if missing/invalid
    const lang = (bodyLang === "kr" ? "kr" : "en") as "en" | "kr";

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

    const activeAllRecipes = lang === "kr" ? KR_ALL_RECIPES : ALL_RECIPES;

    for (let i = 0; i < MAX_RETRIES; i++) {
      const recipe = i < 5
        ? (lang === "kr" ? selectKrRecipe() : selectRandomRecipe())
        : activeAllRecipes[i % activeAllRecipes.length];
      
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

    // =====================================================
    // EN Pipeline: buildFreeGuideEn (deterministic, NO OpenAI)
    // KR Pipeline: buildFreeGuideKr (독립 KR 템플릿, NO OpenAI)
    // =====================================================
    const generatedGuide = lang === "kr"
      ? buildFreeGuideKr({
          recipe_key: recipeKey,
          // KR template uses "safety" instead of "theme"
          guide_type: selectedRecipe.guide_type === "theme" ? "safety" : selectedRecipe.guide_type,
          primary_intent: selectedRecipe.primary_intent,
          primary_route: selectedRecipe.primary_route,
          cta_type: selectedRecipe.cta_type,
          cta_route_slug: selectedRecipe.cta_route_slug,
          cta_tool_slug: selectedRecipe.cta_tool_slug,
          variant: selectedVariant,
        })
      : buildFreeGuideEn({
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
    // v1-free-en = EN free template | v1-free-kr = KR free template
    const generationVersion = `v1-free-${lang}`;

    // Normalize payload to satisfy guides_guide_type_link_check constraint
    const VALID_CATEGORIES = ['Image & Design','Writing','Video','Audio','Voice','Coding'];
    
    // Map taxonomy to valid category enum (best effort)
    const categoryMap: Record<string, string> = {
      'video-editing': 'Video',
      'content-writing': 'Writing',
      'image-generation': 'Image & Design',
      'audio-editing': 'Audio',
      'audio-generation': 'Audio',
      'trust-safety': 'Writing', // fallback
    };
    
    let normalizedPayload: Record<string, any> = {
      slug,
      title,
      excerpt,
      content,
      status: "review",
      lang,
      taxonomy: selectedRecipe.taxonomy,
      guide_type: selectedRecipe.guide_type,
      primary_intent: selectedRecipe.primary_intent,
      generation_version: generationVersion,
      created_at: now,
      updated_at: now,
    };

    // Resolve fallback slugs (existing DB query logic preserved)
    if (selectedRecipe.guide_type === 'route_based' && !selectedRecipe.cta_route_slug) {
      const { data: fallbackRoute } = await supabase
        .from('routes')
        .select('slug')
        .in('status', ['published', 'active'])
        .order('updated_at', { ascending: false, nullsFirst: false })
        .limit(1)
        .single();

      if (!fallbackRoute) {
        return NextResponse.json(
          { ok: false, error: "route_based guide requires route_slug but no published/active routes found" },
          { status: 400 }
        );
      }
      selectedRecipe.cta_route_slug = fallbackRoute.slug;
    }

    if (selectedRecipe.guide_type === 'tool_based' && !selectedRecipe.cta_tool_slug) {
      const { data: fallbackTool } = await supabase
        .from('tools')
        .select('id')
        .order('updated_at', { ascending: false, nullsFirst: false })
        .limit(1)
        .single();

      if (!fallbackTool) {
        return NextResponse.json(
          { ok: false, error: "tool_based guide requires tool_slug but no tools found" },
          { status: 400 }
        );
      }
      selectedRecipe.cta_tool_slug = fallbackTool.id;
    }

    // Enforce CTA integrity
    const cta = normalizeGuideCta({
      guide_type: selectedRecipe.guide_type,
      route_slug: selectedRecipe.cta_route_slug,
      tool_slug: selectedRecipe.cta_tool_slug,
    });

    if (selectedRecipe.guide_type === 'route_based') {
      normalizedPayload.primary_route = selectedRecipe.primary_route;
      const mappedCat = categoryMap[selectedRecipe.taxonomy];
      normalizedPayload.category = (mappedCat && VALID_CATEGORIES.includes(mappedCat)) ? mappedCat : null;
    } else if (selectedRecipe.guide_type === 'tool_based') {
      normalizedPayload.primary_route = null;
      const mappedCat = categoryMap[selectedRecipe.taxonomy];
      normalizedPayload.category = (mappedCat && VALID_CATEGORIES.includes(mappedCat)) ? mappedCat : null;
    } else {
      // theme
      normalizedPayload.primary_route = null;
      const mappedCat = categoryMap[selectedRecipe.taxonomy] || 'Writing';
      normalizedPayload.category = VALID_CATEGORIES.includes(mappedCat) ? mappedCat : 'Writing';
    }

    normalizedPayload.cta_type = cta.cta_type;
    normalizedPayload.cta_route_slug = cta.cta_route_slug;
    normalizedPayload.cta_tool_slug = cta.cta_tool_slug;

    // =====================================================
    // Soft Dedup Check (semantic intent duplication prevention)
    // Rule: same lang + guide_type + primary_intent + status != 'rejected'
    // Fires BEFORE Hard Dedup, single indexed query
    // =====================================================
    {
      const { data: softDedupMatch } = await supabase
        .from("guides")
        .select("id")
        .eq("lang", lang)
        .eq("guide_type", selectedRecipe.guide_type)
        .eq("primary_intent", selectedRecipe.primary_intent)
        .neq("status", "rejected")
        .limit(1);

      if (softDedupMatch && softDedupMatch.length > 0) {
        return NextResponse.json({
          ok: true,
          id: softDedupMatch[0].id,
          soft_dedup: true,
          generation_version: "soft-dedup-skip",
        });
      }
    }

    // =====================================================
    // Hard Dedup Check (SEO cannibalization prevention)
    // Rule: same lang + guide_type + (primary_route OR cta_tool_slug) + status != 'rejected'
    // Fires AFTER CTA/fallback resolution, BEFORE insert
    // =====================================================
    {
      const orParts: string[] = [];
      if (selectedRecipe.primary_route) {
        orParts.push(`primary_route.eq.${selectedRecipe.primary_route}`);
      }
      if (selectedRecipe.cta_tool_slug) {
        orParts.push(`cta_tool_slug.eq.${selectedRecipe.cta_tool_slug}`);
      }
      if (orParts.length > 0) {
        const { data: dedupMatch } = await supabase
          .from("guides")
          .select("id")
          .eq("lang", lang)
          .eq("guide_type", selectedRecipe.guide_type)
          .neq("status", "rejected")
          .or(orParts.join(","))
          .limit(1);

        if (dedupMatch && dedupMatch.length > 0) {
          return NextResponse.json({
            ok: true,
            id: dedupMatch[0].id,
            dedup: true,
            generation_version: "dedup-skip",
          });
        }
      }
    }

    const { data: guide, error: insertError } = await supabase
      .from("guides")
      .insert(normalizedPayload)
      .select("id, slug")
      .single();

    if (insertError) {
      return NextResponse.json(
        { ok: false, error: insertError.message },
        { status: 500 }
      );
    }

    // Quality gate: compute score and update guide
    const qualityResult = computeGuideQualityScore({
      content,
      cta_type: normalizedPayload.cta_type ?? null,
      cta_route_slug: normalizedPayload.cta_route_slug ?? null,
      cta_tool_slug: normalizedPayload.cta_tool_slug ?? null,
      primary_intent: selectedRecipe.primary_intent,
      primary_route: selectedRecipe.primary_route ?? null,
    });

    await supabase
      .from("guides")
      .update({
        quality_score: qualityResult.score,
        auto_publish_eligible: qualityResult.auto_publish_eligible,
      })
      .eq("id", guide.id);

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
      quality_score: number;
      auto_publish_eligible: boolean;
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
      quality_score: qualityResult.score,
      auto_publish_eligible: qualityResult.auto_publish_eligible,
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
