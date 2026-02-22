import { NextResponse } from "next/server";
import { createAdminSupabase } from "@/lib/supabase/admin";
import { createClient } from "@/lib/supabase/server";
import { normalizeGuideCta } from "@/lib/guides/payload-normalizer";
import { computeGuideQualityScore } from "@/lib/guides/quality-check";

type StepPayload = {
  position: number;
  tool_slug: string;
  is_existing_tool: boolean;
  is_best3: boolean;
  step_title: string;
  step_title_kr?: string;
  step_why: string;
  step_why_kr?: string;
  step_cta_label: string;
  step_cta_label_kr?: string;
  step_prompt_example_en?: string;
  step_prompt_example_kr?: string;
  step_prompt_example?: string;
  step_input_type: "prompt" | "settings" | "action";
  new_tool?: {
    name: string;
    slug: string;
    description: string;
    category: string;
    website_url: string;
    tags: string[];
  } | null;
};

type RoutePayload = {
  title: string;
  title_kr?: string;
  slug: string;
  description: string;
  description_kr?: string;
  icon: string;
  tags: string[];
  guide_bullets_en?: string[];
  guide_bullets_kr?: string[];
  guide_bullets?: string[];
  steps: StepPayload[];
};

type GuidePayload = {
  title: string;
  slug: string;
  excerpt: string;
  content: string;
  category: string;
  taxonomy: string;
  primary_intent: string;
};

type ToolPayload = {
  slug: string;
  name: string;
  name_kr?: string;
  description: string;
  description_kr?: string;
  url: string;
  category: string;
  pricing: string;
  is_existing: boolean;
};

const VALID_CATEGORIES = ["Image & Design", "Writing", "Video", "Audio", "Voice", "Coding"];

async function insertGuide(
  db: ReturnType<typeof createAdminSupabase>,
  guide: GuidePayload,
  opts: {
    guideType: "route_based" | "tool_based";
    routeSlug: string | null;
    toolSlug: string | null;
    lang: "en" | "kr";
    now: string;
  },
) {
  const { guideType, routeSlug, toolSlug, lang, now } = opts;
  const refSlug = routeSlug || toolSlug || "unknown";
  const guideSlug = guide.slug
    ? `${guide.slug}-${lang}`
    : `guide-${refSlug}-${lang}-${Date.now()}`;

  const cta = normalizeGuideCta({
    guide_type: guideType,
    route_slug: routeSlug,
    tool_slug: toolSlug,
  });

  const payload: Record<string, unknown> = {
    slug: guideSlug,
    title: guide.title,
    excerpt: guide.excerpt,
    content: guide.content,
    status: "review" as const,
    lang,
    lang_original: lang,
    guide_type: guideType,
    content_focus: guideType === "tool_based" ? "tool" : "route",
    taxonomy: guide.taxonomy || null,
    primary_intent: guide.primary_intent || null,
    primary_route: routeSlug,
    route_slug: routeSlug,
    tool_slug: toolSlug,
    category: VALID_CATEGORIES.includes(guide.category) ? guide.category : null,
    cta_type: cta.cta_type,
    cta_route_slug: cta.cta_route_slug,
    cta_tool_slug: cta.cta_tool_slug,
    generation_version: `v3-ai-creator-${guideType === "tool_based" ? "tool" : "route"}-${lang}`,
    created_at: now,
    updated_at: now,
  };

  const { data: newGuide, error } = await db
    .from("guides")
    .insert(payload)
    .select("id, slug")
    .single();

  if (error) {
    console.error("[ai-creator/confirm] Guide insert error:", JSON.stringify(error, null, 2));
    console.error("[ai-creator/confirm] Guide payload keys:", Object.keys(payload));
    console.error("[ai-creator/confirm] Guide payload:", JSON.stringify(payload, null, 2).slice(0, 2000));
    return { error: `Guide(${lang}): ${error.message} [code=${error.code}, details=${error.details}]` };
  }

  const qualityResult = computeGuideQualityScore({
    content: guide.content,
    cta_type: cta.cta_type,
    cta_route_slug: cta.cta_route_slug,
    cta_tool_slug: cta.cta_tool_slug,
    primary_intent: guide.primary_intent,
    primary_route: routeSlug,
  });

  const { error: qErr } = await db
    .from("guides")
    .update({
      quality_score: qualityResult.score,
      auto_publish_eligible: qualityResult.auto_publish_eligible,
    })
    .eq("id", newGuide.id);
  if (qErr) console.error("[ai-creator/confirm] quality update error:", qErr.message);

  const { error: logErr } = await db.from("admin_guide_generation_logs").insert({
    guide_id: newGuide.id,
    recipe_key: `ai-creator::${refSlug}::${lang}`,
    mode: "manual",
    lang,
    note: `v3-ai-creator-${guideType} (${lang}): ${guide.title}`,
  });
  if (logErr) console.error("[ai-creator/confirm] generation_logs insert error:", logErr.message);

  return {
    id: newGuide.id,
    slug: newGuide.slug,
    quality_score: qualityResult.score,
  };
}

export async function POST(req: Request) {
  try {
    const supabase = await createClient();
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json({ ok: false, error: "Unauthorized" }, { status: 401 });
    }

    const { data: adminRow } = await supabase
      .from("system_admins")
      .select("user_id")
      .eq("user_id", user.id)
      .maybeSingle();

    if (!adminRow) {
      return NextResponse.json({ ok: false, error: "Not a system admin" }, { status: 403 });
    }
  } catch {
    return NextResponse.json({ ok: false, error: "Auth failed" }, { status: 401 });
  }

  try {
    const body = await req.json().catch(() => ({}));
    const lang: "en" | "kr" | "both" = body.lang === "en" ? "en" : body.lang === "kr" ? "kr" : "both";
    const mode: "route" | "tool" = body.mode === "tool" ? "tool" : "route";
    const guideEn: GuidePayload | undefined = body.guide_en;
    const guideKr: GuidePayload | undefined = body.guide_kr;

    const saveEn = lang === "en" || lang === "both";
    const saveKr = lang === "kr" || lang === "both";

    if (!guideEn && !guideKr) {
      return NextResponse.json({ ok: false, error: "At least one guide (en or kr) is required" }, { status: 400 });
    }

    const db = createAdminSupabase();
    const now = new Date().toISOString();

    /* ══════════════════════════════════════════════════════ */
    /* TOOL MODE                                             */
    /* ══════════════════════════════════════════════════════ */
    if (mode === "tool") {
      const tool: ToolPayload | undefined = body.tool;
      if (!tool) {
        return NextResponse.json({ ok: false, error: "tool is required for tool mode" }, { status: 400 });
      }

      const results: {
        tool_slug: string;
        tool_created: boolean;
        guide_en?: { id: string; slug: string; quality_score: number };
        guide_kr?: { id: string; slug: string; quality_score: number };
      } = { tool_slug: tool.slug, tool_created: false };

      if (!tool.is_existing) {
        const { data: dupCheck } = await db
          .from("tools")
          .select("id")
          .eq("slug", tool.slug)
          .maybeSingle();

        if (!dupCheck) {
          const { data: newTool, error: toolErr } = await db
            .from("tools")
            .insert({
              name: tool.name,
              slug: tool.slug,
              description: tool.description,
              category_id: tool.category,
              website_url: tool.url,
              tags: [],
              is_active: true,
              created_at: now,
              updated_at: now,
            })
            .select("id, slug")
            .single();

          if (toolErr) {
            return NextResponse.json({ ok: false, error: `Tool: ${toolErr.message}` }, { status: 500 });
          }

          results.tool_created = true;

          const toolI18nRows: { tool_id: string; locale: string; name: string; description: string }[] = [];
          if (saveEn) {
            toolI18nRows.push({ tool_id: newTool.id, locale: "en", name: tool.name, description: tool.description });
          }
          if (saveKr) {
            toolI18nRows.push({
              tool_id: newTool.id,
              locale: "kr",
              name: tool.name_kr ?? tool.name,
              description: tool.description_kr ?? tool.description,
            });
          }
          if (toolI18nRows.length > 0) {
            await db.from("tools_i18n").insert(toolI18nRows);
          }
        }
      }

      if (guideEn && saveEn) {
        const res = await insertGuide(db, guideEn, {
          guideType: "tool_based",
          routeSlug: null,
          toolSlug: tool.slug,
          lang: "en",
          now,
        });
        if ("error" in res) {
          return NextResponse.json({ ok: false, error: `Guide EN: ${res.error}` }, { status: 500 });
        }
        results.guide_en = res as { id: string; slug: string; quality_score: number };
      }

      if (guideKr && saveKr) {
        const res = await insertGuide(db, guideKr, {
          guideType: "tool_based",
          routeSlug: null,
          toolSlug: tool.slug,
          lang: "kr",
          now,
        });
        if ("error" in res) {
          return NextResponse.json({ ok: false, error: `Guide KR: ${res.error}` }, { status: 500 });
        }
        results.guide_kr = res as { id: string; slug: string; quality_score: number };
      }

      return NextResponse.json({ ok: true, results });
    }

    /* ══════════════════════════════════════════════════════ */
    /* ROUTE MODE (original)                                 */
    /* ══════════════════════════════════════════════════════ */
    const route: RoutePayload = body.route;
    if (!route) {
      return NextResponse.json({ ok: false, error: "route is required" }, { status: 400 });
    }

    const results: {
      route_id?: string;
      guide_en?: { id: string; slug: string; quality_score: number };
      guide_kr?: { id: string; slug: string; quality_score: number };
      tools_created: string[];
      tools_matched: string[];
    } = { tools_created: [], tools_matched: [] };

    // ── Step 1: Create new tools if needed ──
    const toolSlugToId = new Map<string, string>();

    for (const step of route.steps) {
      if (step.is_existing_tool) {
        const { data: existingTool } = await db
          .from("tools")
          .select("id")
          .eq("slug", step.tool_slug)
          .maybeSingle();

        if (existingTool) {
          toolSlugToId.set(step.tool_slug, existingTool.id);
          results.tools_matched.push(step.tool_slug);
        }
      } else if (step.new_tool) {
        const nt = step.new_tool;

        const { data: dupCheck } = await db
          .from("tools")
          .select("id")
          .eq("slug", nt.slug)
          .maybeSingle();

        if (dupCheck) {
          toolSlugToId.set(nt.slug, dupCheck.id);
          results.tools_matched.push(nt.slug);
          continue;
        }

        const ntUrl = nt.website_url || (nt as Record<string, unknown>).url as string || "";
        const { data: newTool, error: toolErr } = await db
          .from("tools")
          .insert({
            name: nt.name,
            slug: nt.slug,
            description: nt.description,
            category_id: nt.category,
            website_url: ntUrl,
            tags: nt.tags ?? [],
            is_active: true,
            created_at: now,
            updated_at: now,
          })
          .select("id, slug")
          .single();

        if (toolErr) {
          console.error("[ai-creator/confirm] Tool creation error:", toolErr);
          continue;
        }

        toolSlugToId.set(nt.slug, newTool.id);
        results.tools_created.push(nt.slug);

        const toolI18nRows: { tool_id: string; locale: string; name: string; description: string }[] = [];
        if (saveEn) {
          toolI18nRows.push({ tool_id: newTool.id, locale: "en", name: nt.name, description: nt.description });
        }
        if (saveKr) {
          toolI18nRows.push({
            tool_id: newTool.id,
            locale: "kr",
            name: (nt as Record<string, unknown>).name_kr as string ?? nt.name,
            description: (nt as Record<string, unknown>).description_kr as string ?? nt.description,
          });
        }
        if (toolI18nRows.length > 0) {
          await db.from("tools_i18n").insert(toolI18nRows);
        }
      }
    }

    // ── Step 2: Create the route ──
    const { data: existingRoute } = await db
      .from("routes")
      .select("id")
      .eq("slug", route.slug)
      .maybeSingle();

    if (existingRoute) {
      return NextResponse.json(
        { ok: false, error: `Route slug "${route.slug}" already exists` },
        { status: 409 },
      );
    }

    const guideBulletsEn = route.guide_bullets_en ?? route.guide_bullets ?? [];
    const guideBulletsKr = route.guide_bullets_kr ?? route.guide_bullets ?? guideBulletsEn;

    const { data: newRoute, error: routeErr } = await db
      .from("routes")
      .insert({
        slug: route.slug,
        title: route.title,
        description: route.description,
        icon: route.icon,
        tags: route.tags,
        guide_bullets: guideBulletsEn,
        featured: false,
        status: "active",
        created_at: now,
        updated_at: now,
      })
      .select("id")
      .single();

    if (routeErr) {
      console.error("[ai-creator/confirm] Route insert error:", JSON.stringify(routeErr, null, 2));
      return NextResponse.json(
        { ok: false, error: `Route: ${routeErr.message} [code=${routeErr.code}, details=${routeErr.details}]` },
        { status: 500 },
      );
    }

    results.route_id = newRoute.id;

    if (saveKr) {
      await db.from("routes_i18n").insert({
        route_id: newRoute.id,
        locale: "kr",
        title: route.title_kr ?? route.title,
        description: route.description_kr ?? route.description,
        guide_bullets: guideBulletsKr,
      });
    }

    // ── Step 3: Create route_tools (steps) ──
    for (const step of route.steps) {
      const toolId = toolSlugToId.get(step.tool_slug) ?? null;
      const enPrompt = step.step_prompt_example_en ?? step.step_prompt_example ?? "";
      const krPrompt = step.step_prompt_example_kr ?? step.step_prompt_example ?? "";

      const rtPayload: Record<string, unknown> = {
        route_id: newRoute.id,
        tool_id: toolId,
        tool_id_text: step.tool_slug,
        position: step.position,
        is_best3: step.is_best3,
        step_title: step.step_title,
        step_why: step.step_why,
        step_cta_label: step.step_cta_label,
        step_prompt_example: enPrompt,
        step_input_type: step.step_input_type,
        created_at: now,
      };
      if (!toolId) delete rtPayload.tool_id;

      const { data: rtData, error: rtErr } = await db
        .from("route_tools")
        .insert(rtPayload)
        .select("id")
        .single();

      if (rtErr) {
        console.error("[ai-creator/confirm] route_tools insert error:", JSON.stringify(rtErr, null, 2), "step:", step.position, "tool_slug:", step.tool_slug);
      }

      if (rtData && saveKr) {
        await db.from("route_tools_i18n").insert({
          route_tool_id: rtData.id,
          locale: "kr",
          step_title: step.step_title_kr ?? step.step_title,
          step_why: step.step_why_kr ?? step.step_why,
          step_cta_label: step.step_cta_label_kr ?? step.step_cta_label,
          step_prompt_example: krPrompt,
        });
      }
    }

    // ── Step 4: Create guide(s) ──
    if (guideEn && saveEn) {
      const res = await insertGuide(db, guideEn, {
        guideType: "route_based",
        routeSlug: route.slug,
        toolSlug: null,
        lang: "en",
        now,
      });
      if ("error" in res) {
        return NextResponse.json(
          { ok: false, error: `Guide EN: ${res.error}`, route_id: results.route_id },
          { status: 500 },
        );
      }
      results.guide_en = res as { id: string; slug: string; quality_score: number };
    }

    if (guideKr && saveKr) {
      const res = await insertGuide(db, guideKr, {
        guideType: "route_based",
        routeSlug: route.slug,
        toolSlug: null,
        lang: "kr",
        now,
      });
      if ("error" in res) {
        return NextResponse.json(
          { ok: false, error: `Guide KR: ${res.error}`, route_id: results.route_id },
          { status: 500 },
        );
      }
      results.guide_kr = res as { id: string; slug: string; quality_score: number };
    }

    return NextResponse.json({
      ok: true,
      results: {
        route_id: results.route_id,
        route_slug: route.slug,
        guide_en: results.guide_en ?? null,
        guide_kr: results.guide_kr ?? null,
        tools_created: results.tools_created,
        tools_matched: results.tools_matched,
      },
    });
  } catch (e: unknown) {
    const message = e instanceof Error ? e.message : "Unknown error";
    const stack = e instanceof Error ? e.stack : undefined;
    console.error("[ai-creator/confirm] ERROR:", message);
    if (stack) console.error("[ai-creator/confirm] STACK:", stack);
    return NextResponse.json(
      { ok: false, error: message, debug: { stack: stack?.split("\n").slice(0, 5) } },
      { status: 500 },
    );
  }
}
