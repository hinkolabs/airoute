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

const SYSTEM_PROMPT = `You are a Korean localization expert for an AI tools website targeting 20-30s Korean users.

=== TONE ===
- Use 해요체 (polite conversational). Never 하십시오체 (overly formal).
- Write like a popular Korean IT/AI blog, not an academic paper.
- Good: "긴 영상에서 숏폼 10개를 뽑아보세요"
- Bad: "긴 영상을 숏폼으로 전환하십시오"

=== LOANWORD RULES ===
Keep established Korean loanwords instead of pure-Korean equivalents:
- research → 리서치 (NOT 연구)
- slide → 슬라이드 (NOT 발표 화면)
- prompt → 프롬프트 (NOT 명령문/지시문)
- workflow → 워크플로우 (NOT 작업 흐름)
- template → 템플릿 (NOT 양식)
- feedback → 피드백 (NOT 의견)
- content → 콘텐츠 (NOT 내용물)
- clip → 클립 (NOT 짧은 영상)
- draft → 초안 (Korean is natural here)
- export → 내보내기 (Korean is natural here)
- outline → 아웃라인 or 개요 (both OK)

=== TITLES ===
Titles must be concise and action-oriented, like Korean blog/YouTube titles.
- Good: "구글보다 빠른 리서치"
- Bad: "구글보다 더 빠르게 무엇이든 연구하기"

=== CRITICAL RULES ===
- NEVER translate brand names: ChatGPT, Claude, Filmora, Opus Clip, Canva, etc.
- Keep URLs, slugs, and technical identifiers unchanged.
- Translate the ENTIRE content of every field. Do NOT summarize or shorten.
- Prompt examples must be translated in FULL — every line, every bullet, every rule.
- Keep the same structure (line breaks, dashes, brackets like [topic]) as the original.

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
    max_tokens: 1500,
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
  const userPrompt = `Translate this workflow step to Korean.
IMPORTANT: Translate EVERY line of each field completely. Do NOT summarize or omit any part.

Step Title: ${step.step_title || ""}
Why: ${step.step_why || ""}
CTA Label: ${step.step_cta_label || ""}
Prompt Example (translate ALL lines, keep structure):
${step.step_prompt_example || ""}

Return JSON:
{
  "step_title": "Korean translation",
  "step_why": "Korean translation",
  "step_cta_label": "Korean translation",
  "step_prompt_example": "FULL Korean translation of the entire prompt example above"
}`;

  const completion = await openai.chat.completions.create({
    model,
    messages: [
      { role: "system", content: SYSTEM_PROMPT },
      { role: "user", content: userPrompt },
    ],
    temperature: 0.5,
    max_tokens: 2000,
    response_format: { type: "json_object" },
  });

  const rawContent = completion.choices[0]?.message?.content;
  if (!rawContent) throw new Error("OpenAI returned empty response");

  const parsed = JSON.parse(rawContent);
  return parsed as TranslateStepResponse;
}

export async function POST(req: Request) {
  // 1) Admin auth - ADMIN_KEY cookie OR Supabase session (consistent with admin layout)
  try {
    const { cookies } = await import("next/headers");
    const cookieStore = await cookies();
    const adminCookie = cookieStore.get("airoute_admin")?.value;
    const adminKey = process.env.ADMIN_KEY;
    const isAdminKeyCookie = adminKey && adminCookie === adminKey;

    if (!isAdminKeyCookie) {
      const supabase = await createClient();
      const {
        data: { user },
        error: authError,
      } = await supabase.auth.getUser();

      if (authError || !user) {
        return NextResponse.json({ ok: false, error: "Unauthorized: Not logged in" }, { status: 401 });
      }

      const { data: systemAdminRow } = await supabase
        .from("system_admins")
        .select("user_id")
        .eq("user_id", user.id)
        .maybeSingle();

      if (!systemAdminRow) {
        return NextResponse.json({ ok: false, error: "Unauthorized: Not a system admin" }, { status: 403 });
      }
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

    const supabase = createAdminSupabase();
    const openai = new OpenAI({ apiKey });

    // 3) Parse request body
    const body = await req.json().catch(() => ({}));
    const routeSlug = body.routeSlug as string | undefined;
    const forceRetranslate = body.forceRetranslate === true;

    const ALLOWED_MODELS = ["gpt-4o-mini", "gpt-4o"];
    const requestedModel = body.model as string | undefined;
    const model = (requestedModel && ALLOWED_MODELS.includes(requestedModel))
      ? requestedModel
      : (process.env.OPENAI_MODEL || "gpt-4o-mini");

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
