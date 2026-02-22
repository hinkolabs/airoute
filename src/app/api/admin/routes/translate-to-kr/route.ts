import { NextResponse } from "next/server";
import { createAdminSupabase } from "@/lib/supabase/admin";
import { createClient } from "@/lib/supabase/server";
import OpenAI from "openai";

/**
 * Admin API: Translate EN routes to KR
 * 
 * POST /api/admin/routes/translate-to-kr
 * 
 * Fetches all active EN routes that don't have KR i18n yet,
 * translates them via OpenAI, and inserts into routes_i18n + route_tools_i18n
 */

const SYSTEM_PROMPT = `You are a professional translator specializing in AI tool content for Korean users.

RULES:
- Translate from English to Korean naturally and professionally
- Keep technical terms in English when appropriate (e.g., "AI", "Shorts", "Reels")
- Make it beginner-friendly and clear
- Maintain the same tone and intent as the original
- Do NOT translate tool names (e.g., "ChatGPT", "Filmora", "Opus Clip")
- Keep URLs, slugs, and technical identifiers unchanged

OUTPUT: Valid JSON only, no markdown code blocks.`;

interface TranslateRouteRequest {
  title: string;
  description: string | null;
  guide_bullets: string[] | null;
}

interface TranslateRouteResponse {
  title: string;
  description: string;
  guide_bullets: string[];
}

interface TranslateStepRequest {
  step_title: string | null;
  step_why: string | null;
  step_cta_label: string | null;
  step_prompt_example: string | null;
}

interface TranslateStepResponse {
  step_title: string;
  step_why: string;
  step_cta_label: string;
  step_prompt_example: string;
}

async function translateRoute(
  openai: OpenAI,
  model: string,
  route: TranslateRouteRequest
): Promise<TranslateRouteResponse> {
  const userPrompt = `Translate this route to Korean:

Title: ${route.title}
Description: ${route.description || ""}
Guide Bullets:
${route.guide_bullets?.map((b, i) => `${i + 1}. ${b}`).join("\n") || "None"}

Return JSON:
{
  "title": "Korean translation of title",
  "description": "Korean translation of description",
  "guide_bullets": ["Korean translation of bullet 1", "Korean translation of bullet 2", ...]
}`;

  const completion = await openai.chat.completions.create({
    model,
    messages: [
      { role: "system", content: SYSTEM_PROMPT },
      { role: "user", content: userPrompt },
    ],
    temperature: 0.5,
    max_tokens: 800,
    response_format: { type: "json_object" },
  });

  const rawContent = completion.choices[0]?.message?.content;
  if (!rawContent) throw new Error("OpenAI returned empty response");

  const parsed = JSON.parse(rawContent);
  return parsed as TranslateRouteResponse;
}

async function translateStep(
  openai: OpenAI,
  model: string,
  step: TranslateStepRequest
): Promise<TranslateStepResponse> {
  const userPrompt = `Translate this workflow step to Korean:

Step Title: ${step.step_title || ""}
Why: ${step.step_why || ""}
CTA Label: ${step.step_cta_label || ""}
Prompt Example: ${step.step_prompt_example || ""}

Return JSON:
{
  "step_title": "Korean translation",
  "step_why": "Korean translation",
  "step_cta_label": "Korean translation",
  "step_prompt_example": "Korean translation"
}`;

  const completion = await openai.chat.completions.create({
    model,
    messages: [
      { role: "system", content: SYSTEM_PROMPT },
      { role: "user", content: userPrompt },
    ],
    temperature: 0.5,
    max_tokens: 600,
    response_format: { type: "json_object" },
  });

  const rawContent = completion.choices[0]?.message?.content;
  if (!rawContent) throw new Error("OpenAI returned empty response");

  const parsed = JSON.parse(rawContent);
  return parsed as TranslateStepResponse;
}

export async function POST(req: Request) {
  // 1) Admin auth - check Supabase user + system_admins table (consistent with layout)
  try {
    const supabase = await createClient();
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json({ ok: false, error: "Unauthorized: Not logged in" }, { status: 401 });
    }

    // Check system_admin status
    const { data: systemAdminRow } = await supabase
      .from("system_admins")
      .select("user_id")
      .eq("user_id", user.id)
      .maybeSingle();

    if (!systemAdminRow) {
      return NextResponse.json({ ok: false, error: "Unauthorized: Not a system admin" }, { status: 403 });
    }
  } catch (err) {
    console.error("[translate-to-kr] Auth error:", err);
    return NextResponse.json({ ok: false, error: "Authentication failed" }, { status: 401 });
  }

  try {
    // 2) Check OpenAI enabled
    if (process.env.OPENAI_ENABLED !== "true") {
      return NextResponse.json(
        { ok: false, error: "OpenAI is disabled. Set OPENAI_ENABLED=true" },
        { status: 403 }
      );
    }

    const apiKey = process.env.OPENAI_API_KEY;
    if (!apiKey) {
      return NextResponse.json({ ok: false, error: "Missing OPENAI_API_KEY" }, { status: 500 });
    }

    const model = process.env.OPENAI_MODEL || "gpt-4o-mini";
    const supabase = createAdminSupabase();
    const openai = new OpenAI({ apiKey });

    // 3) Parse request body
    const body = await req.json().catch(() => ({}));
    const routeSlug = body.routeSlug as string | undefined;
    const forceRetranslate = body.forceRetranslate === true; // Force re-translate even if exists

    // 4) Fetch routes that need translation
    let routesQuery = supabase
      .from("routes")
      .select("id, slug, title, description, guide_bullets")
      .eq("status", "active");

    if (routeSlug) {
      // Single route mode
      routesQuery = routesQuery.eq("slug", routeSlug);
    }

    const { data: routes, error: routesError } = await routesQuery;

    if (routesError) {
      return NextResponse.json({ ok: false, error: routesError.message }, { status: 500 });
    }

    if (!routes || routes.length === 0) {
      return NextResponse.json({ ok: false, error: "No routes found" }, { status: 404 });
    }

    const results: Array<{
      slug: string;
      routeTranslated: boolean;
      stepsTranslated: number;
      error?: string;
    }> = [];

    // 5) Process each route with delay to avoid rate limits
    for (let i = 0; i < routes.length; i++) {
      const route = routes[i];
      
      // Add delay between routes to avoid rate limits (except first)
      if (i > 0) {
        await new Promise(resolve => setTimeout(resolve, 2000)); // 2 second delay
      }
      
      try {
        // Check if KR translation already exists
        const { data: existingI18n } = await supabase
          .from("routes_i18n")
          .select("id")
          .eq("route_id", route.id)
          .eq("locale", "kr")
          .single();

        let routeTranslated = false;

        if (!existingI18n || forceRetranslate) {
          // Translate route
          const translated = await translateRoute(openai, model, {
            title: route.title,
            description: route.description,
            guide_bullets: route.guide_bullets,
          });

          // UPSERT routes_i18n (INSERT or UPDATE if exists)
          const { error: upsertError } = await supabase
            .from("routes_i18n")
            .upsert(
              {
                route_id: route.id,
                locale: "kr",
                title: translated.title,
                description: translated.description,
                guide_bullets: translated.guide_bullets,
                updated_at: new Date().toISOString(),
              },
              {
                onConflict: "route_id, locale",
              }
            );

          if (upsertError) {
            console.error("[translate-to-kr] Route upsert error:", upsertError);
            throw upsertError;
          }
          routeTranslated = true;
        }

        // 6) Translate route_tools (steps)
        const { data: steps, error: stepsError } = await supabase
          .from("route_tools")
          .select("id, step_title, step_why, step_cta_label, step_prompt_example")
          .eq("route_id", route.id);

        if (stepsError) throw stepsError;

        let stepsTranslated = 0;

        if (steps && steps.length > 0) {
          for (let j = 0; j < steps.length; j++) {
            const step = steps[j];
            
            // Add small delay between steps
            if (j > 0) {
              await new Promise(resolve => setTimeout(resolve, 1000)); // 1 second delay
            }
            // Check if KR translation exists
            const { data: existingStepI18n } = await supabase
              .from("route_tools_i18n")
              .select("id")
              .eq("route_tool_id", step.id)
              .eq("locale", "kr")
              .single();

            if ((!existingStepI18n || forceRetranslate) && step.step_title) {
              // Translate step
              const translatedStep = await translateStep(openai, model, {
                step_title: step.step_title,
                step_why: step.step_why,
                step_cta_label: step.step_cta_label,
                step_prompt_example: step.step_prompt_example,
              });

              // UPSERT route_tools_i18n
              const { error: upsertStepError } = await supabase
                .from("route_tools_i18n")
                .upsert(
                  {
                    route_tool_id: step.id,
                    locale: "kr",
                    step_title: translatedStep.step_title,
                    step_why: translatedStep.step_why,
                    step_cta_label: translatedStep.step_cta_label,
                    step_prompt_example: translatedStep.step_prompt_example,
                    updated_at: new Date().toISOString(),
                  },
                  {
                    onConflict: "route_tool_id, locale",
                  }
                );

              if (upsertStepError) {
                console.error("[translate-to-kr] Step upsert error:", upsertStepError);
                throw upsertStepError;
              }
              stepsTranslated++;
            }
          }
        }

        results.push({
          slug: route.slug,
          routeTranslated,
          stepsTranslated,
        });
      } catch (err: unknown) {
        const errorMessage = err instanceof Error 
          ? err.message 
          : JSON.stringify(err);
        console.error(`[translate-to-kr] Error for ${route.slug}:`, err);
        results.push({
          slug: route.slug,
          routeTranslated: false,
          stepsTranslated: 0,
          error: errorMessage,
        });
      }
    }

    return NextResponse.json({
      ok: true,
      processed: results.length,
      results,
    });
  } catch (e: unknown) {
    const message = e instanceof Error ? e.message : "Unknown error";
    return NextResponse.json({ ok: false, error: message }, { status: 500 });
  }
}
