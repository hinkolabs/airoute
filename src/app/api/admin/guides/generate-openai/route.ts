import { NextResponse } from "next/server";
import { createAdminSupabase } from "@/lib/supabase/admin";
import { requireAdminOrThrow } from "@/lib/admin-auth";
import OpenAI from "openai";

// =====================================================
// PAID OpenAI-based guide generation
// Requires OPENAI_ENABLED=true
// =====================================================

type Recipe = {
  guide_type: "route_based" | "tool_based" | "safety";
  primary_intent: string;
  primary_route: string | null;
  cta_type: "route" | "tool" | "mixed" | null;
  cta_route_slug: string | null;
  cta_tool_slug: string | null;
  title_seed: string;
};

// Same recipes as FREE generator
const ROUTE_RECIPES: Recipe[] = [
  { guide_type: "route_based", primary_intent: "turn-long-videos-into-shorts", primary_route: "long-to-shorts", cta_type: "route", cta_route_slug: "long-to-shorts", cta_tool_slug: null, title_seed: "How to turn long videos into YouTube Shorts" },
  { guide_type: "route_based", primary_intent: "polish-shorts-and-reels", primary_route: "polish-shorts", cta_type: "route", cta_route_slug: "polish-shorts", cta_tool_slug: null, title_seed: "How to polish Shorts and Reels quickly" },
  { guide_type: "route_based", primary_intent: "write-blog-posts-faster", primary_route: "blog-writing", cta_type: "route", cta_route_slug: "blog-writing", cta_tool_slug: null, title_seed: "How to write blog posts faster with AI" },
  { guide_type: "route_based", primary_intent: "generate-social-media-images", primary_route: "social-images", cta_type: "route", cta_route_slug: "social-images", cta_tool_slug: null, title_seed: "How to generate social media images with AI" },
  { guide_type: "route_based", primary_intent: "create-product-descriptions", primary_route: "product-copy", cta_type: "route", cta_route_slug: "product-copy", cta_tool_slug: null, title_seed: "How to create product descriptions with AI" },
  { guide_type: "route_based", primary_intent: "edit-podcast-audio", primary_route: "podcast-editing", cta_type: "route", cta_route_slug: "podcast-editing", cta_tool_slug: null, title_seed: "How to edit podcast audio with AI tools" },
  { guide_type: "route_based", primary_intent: "generate-background-music", primary_route: "background-music", cta_type: "route", cta_route_slug: "background-music", cta_tool_slug: null, title_seed: "How to generate background music for videos" },
];

const TOOL_RECIPES: Recipe[] = [
  { guide_type: "tool_based", primary_intent: "midjourney-beginner-guide", primary_route: null, cta_type: "tool", cta_route_slug: null, cta_tool_slug: "midjourney", title_seed: "Midjourney Beginner Guide: Getting Started" },
  { guide_type: "tool_based", primary_intent: "chatgpt-writing-tips", primary_route: null, cta_type: "tool", cta_route_slug: null, cta_tool_slug: "chatgpt", title_seed: "ChatGPT Writing Tips for Better Results" },
  { guide_type: "tool_based", primary_intent: "runway-video-editing", primary_route: null, cta_type: "tool", cta_route_slug: null, cta_tool_slug: "runway", title_seed: "Runway Video Editing: A Complete Guide" },
  { guide_type: "tool_based", primary_intent: "elevenlabs-voice-cloning", primary_route: null, cta_type: "tool", cta_route_slug: null, cta_tool_slug: "elevenlabs", title_seed: "ElevenLabs Voice Cloning Tutorial" },
];

const SAFETY_RECIPES: Recipe[] = [
  { guide_type: "safety", primary_intent: "ai-tool-safety-checklist", primary_route: null, cta_type: null, cta_route_slug: null, cta_tool_slug: null, title_seed: "AI Tool Safety Checklist for Beginners" },
  { guide_type: "safety", primary_intent: "avoid-ai-scams", primary_route: null, cta_type: null, cta_route_slug: null, cta_tool_slug: null, title_seed: "How to Avoid AI Tool Scams" },
  { guide_type: "safety", primary_intent: "ai-copyright-basics", primary_route: null, cta_type: null, cta_route_slug: null, cta_tool_slug: null, title_seed: "AI Copyright Basics: What You Need to Know" },
];

const ALL_RECIPES = [...ROUTE_RECIPES, ...TOOL_RECIPES, ...SAFETY_RECIPES];

function selectRandomRecipe(): Recipe {
  const rand = Math.random() * 100;
  if (rand < 70) return ROUTE_RECIPES[Math.floor(Math.random() * ROUTE_RECIPES.length)];
  if (rand < 90) return TOOL_RECIPES[Math.floor(Math.random() * TOOL_RECIPES.length)];
  return SAFETY_RECIPES[Math.floor(Math.random() * SAFETY_RECIPES.length)];
}

function generateRecipeKey(recipe: Recipe, lang: string): string {
  return [recipe.guide_type, recipe.primary_intent, recipe.primary_route || "", recipe.cta_type || "", recipe.cta_route_slug || "", recipe.cta_tool_slug || ""].join("|") + `::${lang}`;
}

function generateSlug(primaryIntent: string): string {
  return primaryIntent.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "") + `-${Date.now()}`;
}

function getKSTDayStart(): string {
  const now = new Date();
  const kstOffset = 9 * 60 * 60 * 1000;
  const kstNow = new Date(now.getTime() + kstOffset);
  return new Date(new Date(kstNow.toISOString().slice(0, 10) + "T00:00:00.000Z").getTime() - kstOffset).toISOString();
}

function getKSTDayEnd(): string {
  const now = new Date();
  const kstOffset = 9 * 60 * 60 * 1000;
  const kstNow = new Date(now.getTime() + kstOffset);
  return new Date(new Date(kstNow.toISOString().slice(0, 10) + "T23:59:59.999Z").getTime() - kstOffset).toISOString();
}

// OpenAI prompts
const SYSTEM_PROMPT_EN = `You are an expert AI tools guide writer for Airoute, a platform that helps users find the best AI tools.

Your task is to generate a comprehensive, practical guide based on the given recipe.

RULES:
- Write ENTIRELY in English. No Korean text anywhere.
- Title: Clear, actionable, SEO-friendly (50-70 chars)
- Excerpt: Compelling summary (100-150 chars)
- Content: Well-structured Markdown with H2 sections, practical step-by-step instructions, tips and best practices (800-1200 words)
- Do NOT include CTA sections in content
- Focus on being helpful and actionable

OUTPUT FORMAT: Valid JSON only, no markdown code blocks.`;

const SYSTEM_PROMPT_KR = `You are an expert AI tools guide writer for Airoute.

RULES:
- Write title, excerpt, and content ENTIRELY in Korean (한국어).
- Keep all slugs in kebab-case English.
- Title: 20-40 Korean chars, Excerpt: 50-80 Korean chars
- Content: Well-structured Markdown, 800-1200 words equivalent
- Do NOT include CTA sections

OUTPUT FORMAT: Valid JSON only, no markdown code blocks.`;

function buildUserPrompt(recipe: Recipe, lang: "en" | "kr"): string {
  const langLabel = lang === "kr" ? "Korean" : "English";
  return `Generate a guide for:
- guide_type: ${recipe.guide_type}
- primary_intent: ${recipe.primary_intent}
- primary_route: ${recipe.primary_route || "null"}
- cta_type: ${recipe.cta_type || "null"}
- cta_route_slug: ${recipe.cta_route_slug || "null"}
- cta_tool_slug: ${recipe.cta_tool_slug || "null"}
- title_seed: ${recipe.title_seed}
Language: ${langLabel}

Return JSON:
{
  "title": "string in ${langLabel}",
  "excerpt": "string in ${langLabel}",
  "content": "markdown in ${langLabel}"
}`;
}

export async function POST(req: Request) {
  // 1) Admin auth
  try {
    await requireAdminOrThrow();
  } catch {
    return NextResponse.json({ ok: false, error: "Unauthorized" }, { status: 401 });
  }

  try {
    // 2) Kill switch check
    if (process.env.OPENAI_ENABLED !== "true") {
      return NextResponse.json(
        { ok: false, error: "OpenAI generation is disabled. Set OPENAI_ENABLED=true to enable." },
        { status: 403 }
      );
    }

    // 3) API key check
    const apiKey = process.env.OPENAI_API_KEY;
    if (!apiKey) {
      return NextResponse.json({ ok: false, error: "Missing env: OPENAI_API_KEY" }, { status: 500 });
    }

    // 4) Parse params
    const body = await req.json().catch(() => ({}));
    const lang: "en" | "kr" = body.lang === "kr" ? "kr" : "en";
    const model = process.env.OPENAI_MODEL || "gpt-4o-mini";
    const maxTokens = parseInt(process.env.OPENAI_MAX_OUTPUT_TOKENS || "1200", 10);
    const dailyLimit = parseInt(process.env.OPENAI_DAILY_CALL_LIMIT || "2", 10);

    const supabase = createAdminSupabase();

    // 5) Daily OpenAI call limit (KST)
    const { data: todayUsage } = await supabase
      .from("admin_openai_usage_logs")
      .select("id")
      .gte("created_at", getKSTDayStart())
      .lt("created_at", getKSTDayEnd());

    const todayCount = todayUsage?.length || 0;
    if (todayCount >= dailyLimit) {
      return NextResponse.json(
        { ok: false, error: `Daily OpenAI limit (${dailyLimit}) reached. Try again tomorrow.` },
        { status: 429 }
      );
    }

    // 6) Recipe selection with duplication check
    const MAX_RETRIES = 10;
    let selectedRecipe: Recipe | null = null;
    let recipeKey = "";
    const triedKeys = new Set<string>();

    for (let i = 0; i < MAX_RETRIES; i++) {
      const recipe = i < 5 ? selectRandomRecipe() : ALL_RECIPES[i % ALL_RECIPES.length];
      recipeKey = generateRecipeKey(recipe, lang);
      if (triedKeys.has(recipeKey)) continue;
      triedKeys.add(recipeKey);

      const { data: existing } = await supabase
        .from("guides")
        .select("id")
        .eq("guide_type", recipe.guide_type)
        .eq("primary_intent", recipe.primary_intent)
        .like("generation_version", `%-${lang}`)
        .in("status", ["approved", "review", "draft"])
        .limit(1);

      if (!existing || existing.length === 0) {
        selectedRecipe = recipe;
        break;
      }
    }

    if (!selectedRecipe) {
      return NextResponse.json(
        { ok: false, error: "No available recipes. All are already in use." },
        { status: 409 }
      );
    }

    // 7) Call OpenAI
    const openai = new OpenAI({ apiKey });
    const systemPrompt = lang === "kr" ? SYSTEM_PROMPT_KR : SYSTEM_PROMPT_EN;

    const completion = await openai.chat.completions.create({
      model,
      messages: [
        { role: "system", content: systemPrompt },
        { role: "user", content: buildUserPrompt(selectedRecipe, lang) },
      ],
      temperature: 0.7,
      max_tokens: maxTokens,
      response_format: { type: "json_object" },
    });

    const rawContent = completion.choices[0]?.message?.content;
    if (!rawContent) throw new Error("OpenAI returned empty response");

    let parsed: { title: string; excerpt: string; content: string };
    try {
      parsed = JSON.parse(rawContent);
    } catch {
      throw new Error(`Failed to parse OpenAI JSON: ${rawContent.slice(0, 200)}`);
    }

    if (!parsed.title || !parsed.excerpt || !parsed.content) {
      throw new Error("OpenAI response missing required fields");
    }

    // 8) Insert guide
    const slug = generateSlug(selectedRecipe.primary_intent);
    const now = new Date().toISOString();

    // Derive taxonomy from recipe
    const taxonomy = selectedRecipe.primary_route || selectedRecipe.cta_tool_slug || "general";

    const { data: guide, error: insertError } = await supabase
      .from("guides")
      .insert({
        slug,
        title: parsed.title,
        excerpt: parsed.excerpt,
        content: parsed.content,
        status: "review",
        lang, // Include language
        taxonomy, // Include taxonomy
        guide_type: selectedRecipe.guide_type,
        primary_intent: selectedRecipe.primary_intent,
        primary_route: selectedRecipe.primary_route,
        cta_type: selectedRecipe.cta_type,
        cta_route_slug: selectedRecipe.cta_route_slug,
        cta_tool_slug: selectedRecipe.cta_tool_slug,
        generation_version: `v2-openai-${lang}`,
        created_at: now,
        updated_at: now,
      })
      .select("id, slug")
      .single();

    if (insertError) {
      return NextResponse.json({ ok: false, error: insertError.message }, { status: 500 });
    }

    // 9) Log to generation logs (include lang for language-scoped tracking)
    await supabase.from("admin_guide_generation_logs").insert({
      guide_id: guide.id,
      recipe_key: recipeKey,
      mode: "auto",
      lang, // Track which language was generated
      note: `v2-openai (${lang}): ${selectedRecipe.guide_type} - ${selectedRecipe.primary_intent}`,
    });

    // 10) Log OpenAI usage
    const usage = completion.usage;
    await supabase.from("admin_openai_usage_logs").insert({
      guide_id: guide.id,
      action: "generate_openai",
      lang,
      model,
      prompt_tokens: usage?.prompt_tokens ?? null,
      completion_tokens: usage?.completion_tokens ?? null,
      total_tokens: usage?.total_tokens ?? null,
    });

    return NextResponse.json({
      ok: true,
      id: guide.id,
      slug: guide.slug,
      remainingToday: dailyLimit - todayCount - 1,
      lang,
      model,
    });
  } catch (e: unknown) {
    const message = e instanceof Error ? e.message : "Unknown error";
    return NextResponse.json({ ok: false, error: message }, { status: 500 });
  }
}

