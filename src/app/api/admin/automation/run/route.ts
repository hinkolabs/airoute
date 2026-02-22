import { NextResponse } from "next/server";
import { createAdminSupabase } from "@/lib/supabase/admin";
import { buildFreeGuideEn, computeVariant, type Variant } from "@/lib/guides/free-templates/en";

// =====================================================
// n8n Automation endpoint for guide generation
// No admin cookie auth - uses AUTOMATION_SECRET Bearer token
// =====================================================

type Recipe = {
  guide_type: "route_based" | "tool_based" | "theme";
  primary_intent: string;
  primary_route: string | null;
  cta_type: "route" | "tool" | "mixed" | null;
  cta_route_slug: string | null;
  cta_tool_slug: string | null;
  title_seed: string;
  taxonomy: string;
};

type RunRequest = {
  run_type: "generate_guide_route_based";
  recipe_key: string;
  lang: "ko" | "en";
  input: {
    route_slug: string;
  };
  dry_run?: boolean;
};

const VALID_CATEGORIES = ['Image & Design', 'Writing', 'Video', 'Audio', 'Voice', 'Coding'];

const categoryMap: Record<string, string> = {
  'video-editing': 'Video',
  'content-writing': 'Writing',
  'image-generation': 'Image & Design',
  'audio-editing': 'Audio',
  'audio-generation': 'Audio',
  'trust-safety': 'Writing',
  'long-to-shorts': 'Video',
  'polish-shorts': 'Video',
  'blog-writing': 'Writing',
  'social-images': 'Image & Design',
  'product-copy': 'Writing',
  'podcast-editing': 'Audio',
  'background-music': 'Audio',
};

function generateRecipeKey(recipe: Recipe, lang: string, variant: Variant): string {
  return [recipe.guide_type, recipe.taxonomy, recipe.primary_intent, lang, variant].join(":");
}

function generateSlug(primaryIntent: string): string {
  const slugified = primaryIntent.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "");
  return `${slugified}-${Date.now()}`;
}

const VARIANTS: Variant[] = ["A", "B", "C"];

function rotateVariant(current: Variant): Variant {
  const idx = VARIANTS.indexOf(current);
  return VARIANTS[(idx + 1) % 3];
}

export async function POST(req: Request) {
  // 1) Auth via AUTOMATION_SECRET (Bearer token)
  const authHeader = req.headers.get("authorization");
  const expectedSecret = process.env.AUTOMATION_SECRET;

  if (!expectedSecret) {
    return NextResponse.json(
      { ok: false, error: "AUTOMATION_SECRET not configured" },
      { status: 500 }
    );
  }

  const bearerToken = authHeader?.replace(/^Bearer\s+/i, "");
  if (!bearerToken || bearerToken !== expectedSecret) {
    return NextResponse.json(
      { ok: false, error: "Unauthorized" },
      { status: 401 }
    );
  }

  try {
    // 2) Parse request body
    const body: RunRequest = await req.json();
    const { run_type, recipe_key, lang, input, dry_run = false } = body;

    // 3) Validate run_type
    if (run_type !== "generate_guide_route_based") {
      return NextResponse.json(
        { ok: false, error: `Unsupported run_type: ${run_type}` },
        { status: 400 }
      );
    }

    // 4) Validate input.route_slug
    if (!input?.route_slug) {
      return NextResponse.json(
        { ok: false, error: "input.route_slug is required" },
        { status: 400 }
      );
    }

    const routeSlug = input.route_slug;
    const finalLang = lang === "ko" ? "kr" : "en"; // Normalize ko -> kr for consistency

    const supabase = createAdminSupabase();

    // 5) Fetch route data to build recipe
    const { data: routeData, error: routeError } = await supabase
      .from("routes")
      .select("slug, primary_intent, taxonomy")
      .eq("slug", routeSlug)
      .single();

    if (routeError || !routeData) {
      return NextResponse.json(
        { ok: false, error: `Route not found: ${routeSlug}` },
        { status: 404 }
      );
    }

    // 6) Build recipe from route data
    const recipe: Recipe = {
      guide_type: "route_based",
      primary_intent: routeData.primary_intent || routeSlug,
      primary_route: routeSlug,
      cta_type: "route",
      cta_route_slug: routeSlug,
      cta_tool_slug: null,
      title_seed: `How to ${(routeData.primary_intent || routeSlug).replace(/-/g, " ")}`,
      taxonomy: routeData.taxonomy || "content-writing",
    };

    // 7) Compute variant
    const defaultVariant = computeVariant(recipe.primary_intent, recipe.guide_type);
    let selectedVariant = defaultVariant;

    // 8) Check for duplicate automation_key (recipe_key exact match)
    const fullRecipeKey = generateRecipeKey(recipe, finalLang, selectedVariant);

    // Dedupe query: same lang + guide_type + primary_intent + primary_route
    let dedupeQuery = supabase
      .from("guides")
      .select("id, generation_version")
      .eq("lang", finalLang)
      .eq("guide_type", recipe.guide_type)
      .eq("primary_intent", recipe.primary_intent)
      .eq("taxonomy", recipe.taxonomy)
      .in("status", ["approved", "review", "draft"]);

    if (recipe.primary_route) {
      dedupeQuery = dedupeQuery.eq("primary_route", recipe.primary_route);
    }
    if (recipe.cta_type) {
      dedupeQuery = dedupeQuery.eq("cta_type", recipe.cta_type);
    }

    const { data: recentGuides } = await dedupeQuery
      .order("created_at", { ascending: false })
      .limit(30);

    // Extract existing variants from generation logs
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

    // Rotate variant if collision (max 3 attempts)
    let variantAttempts = 0;
    while (existingVariants.has(selectedVariant) && variantAttempts < 3) {
      selectedVariant = rotateVariant(selectedVariant);
      variantAttempts++;
    }

    // If all variants exhausted, return 409
    if (variantAttempts >= 3 && existingVariants.has(selectedVariant)) {
      return NextResponse.json(
        { ok: false, error: "duplicate_automation_key" },
        { status: 409 }
      );
    }

    const finalRecipeKey = generateRecipeKey(recipe, finalLang, selectedVariant);

    // Final exact match check
    const { data: exactMatch } = await supabase
      .from("admin_guide_generation_logs")
      .select("id")
      .eq("recipe_key", finalRecipeKey)
      .limit(1);

    if (exactMatch && exactMatch.length > 0) {
      return NextResponse.json(
        { ok: false, error: "duplicate_automation_key" },
        { status: 409 }
      );
    }

    // 9) Generate guide content using free template (reuse existing logic)
    const slug = generateSlug(recipe.primary_intent);
    const now = new Date().toISOString();

    const generatedGuide = buildFreeGuideEn({
      recipe_key: finalRecipeKey,
      guide_type: recipe.guide_type,
      primary_intent: recipe.primary_intent,
      primary_route: recipe.primary_route,
      cta_type: recipe.cta_type,
      cta_route_slug: recipe.cta_route_slug,
      cta_tool_slug: recipe.cta_tool_slug,
      variant: selectedVariant,
    });

    const { title, excerpt, content } = generatedGuide;

    // 10) Preflight checks (basic validation)
    if (content.length < 500) {
      return NextResponse.json(
        { ok: false, error: "Content too short (min 500 chars)" },
        { status: 400 }
      );
    }

    if (!content.includes("##")) {
      return NextResponse.json(
        { ok: false, error: "Content missing H2 sections" },
        { status: 400 }
      );
    }

    // 11) Dry run mode: return preview without DB insert
    if (dry_run) {
      return NextResponse.json({
        ok: true,
        dry_run: true,
        preview: {
          title,
          excerpt,
          content_length: content.length,
          has_h2: content.includes("##"),
          slug,
          lang: finalLang,
          recipe_key: finalRecipeKey,
          variant: selectedVariant,
        },
      });
    }

    // 12) Build normalized payload
    const generationVersion = recipe_key || `v1-n8n-${finalLang}`;

    const mappedCat = categoryMap[recipe.taxonomy] || categoryMap[recipe.primary_route || ""];
    const finalCategory = mappedCat && VALID_CATEGORIES.includes(mappedCat) ? mappedCat : null;

    const normalizedPayload: Record<string, any> = {
      slug,
      title,
      excerpt,
      content,
      status: "review",
      lang: finalLang,
      taxonomy: recipe.taxonomy,
      guide_type: recipe.guide_type,
      primary_intent: recipe.primary_intent,
      primary_route: recipe.primary_route,
      cta_type: recipe.cta_type,
      cta_route_slug: recipe.cta_route_slug,
      cta_tool_slug: recipe.cta_tool_slug,
      category: finalCategory,
      generation_version: generationVersion,
      published_at: null,
      published_source: "n8n",
      created_at: now,
      updated_at: now,
    };

    // 13) Insert guide
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

    // 14) Log to admin_guide_generation_logs
    const { error: logError } = await supabase.from("admin_guide_generation_logs").insert({
      guide_id: guide.id,
      mode: "n8n",
      recipe_key: finalRecipeKey,
      created_by: "n8n",
      created_at: now,
      lang: finalLang,
    });

    if (logError) {
      console.error("[automation/run] Failed to insert generation log:", logError);
      // Non-fatal: guide is created, but log failed
    }

    // 15) Success response
    return NextResponse.json({
      ok: true,
      guide_id: guide.id,
      slug: guide.slug,
      status: "review",
      published_source: "n8n",
      lang: finalLang,
      recipe_key: finalRecipeKey,
      variant: selectedVariant,
    });
  } catch (e: unknown) {
    const message = e instanceof Error ? e.message : "Unknown error";
    console.error("[automation/run] Error:", e);
    return NextResponse.json({ ok: false, error: message }, { status: 500 });
  }
}
