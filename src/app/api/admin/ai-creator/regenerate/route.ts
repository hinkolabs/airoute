import { NextResponse } from "next/server";
import { createAdminSupabase } from "@/lib/supabase/admin";
import { createClient } from "@/lib/supabase/server";
import OpenAI from "openai";

type RegenerateTarget = "route_en" | "route_kr" | "guide_en" | "guide_kr";

const GUIDE_FORMAT = `🚨🚨🚨 ABSOLUTE MINIMUM: 4000 characters. TARGET: 5000 characters. Under 3500 = REJECTED. 🚨🚨🚨
No CTA sections — rendered separately by frontend.

ALL 6 H2 sections are MANDATORY:
EN: ## Summary | ## Step-by-Step Guide | ## Common Mistakes | ## Quick Checklist | ## Recommended Tool Stack | ## Bonus Tips
KR: ## 요약 | ## 단계별 가이드 | ## 흔한 실수 | ## 빠른 체크리스트 | ## 추천 도구 스택 | ## 보너스 팁

EXACT REQUIREMENTS PER SECTION (adds up to 4000-5500 chars):
1. 요약/Summary (500-700 chars): 3 paragraphs — what you'll create, why this approach, who it's for
2. 단계별 가이드/Step-by-Step (2000-2500 chars): For EACH step write ### sub-heading with:
   - 준비물: what files/accounts/setup needed
   - 상세 과정: click-by-click instructions ("Click X → Select Y → Set Z")
   - 복사용 프롬프트: EXACT text to type/paste in blockquote
   - 예상 결과: what the output should look like
   - 문제 해결: "If [problem], try [solution]" (1-2 per step)
3. 흔한 실수/Common Mistakes (500-600 chars): 5 mistakes with "- **Title**: 2-3 sentences explaining cause and fix"
4. 빠른 체크리스트/Checklist (300-400 chars): 8-10 items as "- [ ] specific action item"
5. 추천 도구 스택/Tool Stack (400-500 chars): Why EACH tool was chosen, alternatives, free vs paid
6. 보너스 팁/Bonus Tips (400-500 chars): 4-5 tips for going from "good" to "amazing"

If you think you're done writing, you're probably only halfway. KEEP WRITING MORE DETAIL.`;

function buildRegeneratePromptForTool(target: "guide_en" | "guide_kr", context: {
  prompt: string;
  tool: Record<string, unknown>;
}): { system: string; user: string } {
  if (target === "guide_en") {
    return {
      system: `You regenerate an English tool-based guide for a specific AI tool.
${GUIDE_FORMAT}

Output JSON: { "guide_en": { "title", "slug", "excerpt", "content", "category", "taxonomy", "primary_intent" } }
- title: SEO-friendly, 20-60 chars, English
- slug: kebab-case English
- content: LONG markdown, MUST be 4000-5500 chars, ALL 6 H2 sections in English
- Focus on THIS specific tool — how to use it, tips, common mistakes
- Step-by-Step section alone should be 2000+ chars with detailed instructions per step
- Write ENTIRELY in English.`,
      user: `Topic: "${context.prompt}"
Tool: ${context.tool.name} (${context.tool.slug})
Description: ${context.tool.description}
Category: ${context.tool.category}

Generate a fresh English guide for this tool.`,
    };
  }

  return {
    system: `한국어 도구 가이드를 재생성합니다.
${GUIDE_FORMAT}

Output JSON: { "guide_kr": { "title", "slug", "excerpt", "content", "category", "taxonomy", "primary_intent" } }
- title: SEO 최적화, 20-60자, 한국어
- slug: kebab-case English
- content: 마크다운, 반드시 4000-5500자, 6개 H2 섹션 모두 한국어로
- 이 특정 도구 사용법에 집중 — 사용 방법, 팁, 흔한 실수
- 단계별 가이드 섹션만 2000자 이상으로 각 단계에 상세한 설명 포함
- 한국어 가이드는 짧아지기 쉬우므로 의식적으로 더 자세히 작성
- 완전히 한국어로 작성.`,
    user: `주제: "${context.prompt}"
도구: ${context.tool.name_kr || context.tool.name} (${context.tool.slug})
설명: ${context.tool.description_kr || context.tool.description}
카테고리: ${context.tool.category}

이 도구에 대한 새로운 한국어 가이드를 생성하세요.`,
  };
}

function buildRegeneratePrompt(target: RegenerateTarget, context: {
  prompt: string;
  route: Record<string, unknown>;
  steps: Record<string, unknown>[];
}): { system: string; user: string } {
  const toolNames = context.steps.map((s) => s.tool_slug || s.step_title).join(", ");

  if (target === "guide_en") {
    return {
      system: `You regenerate an English guide for an AI workflow route.
${GUIDE_FORMAT}

Output JSON: { "guide_en": { "title", "slug", "excerpt", "content", "category", "taxonomy", "primary_intent" } }
- title: SEO-friendly, 20-60 chars, English
- slug: kebab-case English
- content: LONG markdown, MUST be 4000-5500 chars, ALL 6 H2 sections in English
- Step-by-Step section alone should be 2000+ chars with detailed instructions, prompts, and troubleshooting per step
- Write ENTIRELY in English. This is NOT a translation — write independently for English audience.
- If you think you're done writing, you're probably only halfway. KEEP WRITING MORE DETAIL.`,
      user: `Topic: "${context.prompt}"
Route: ${context.route.title} (${context.route.slug})
Steps: ${toolNames}
Route description: ${context.route.description}

Generate a fresh English guide for this topic.`,
    };
  }

  if (target === "guide_kr") {
    return {
      system: `You regenerate a Korean guide for an AI workflow route.
${GUIDE_FORMAT}

Output JSON: { "guide_kr": { "title", "slug", "excerpt", "content", "category", "taxonomy", "primary_intent" } }
- title: SEO 최적화, 20-60자, 한국어
- slug: kebab-case English
- content: 마크다운, 반드시 4000-5500자, 6개 H2 섹션 모두 한국어로
- 단계별 가이드 섹션만 2000자 이상 — 각 단계에 준비물, 상세과정, 복사용 프롬프트, 예상결과, 문제해결 포함
- 한국어 가이드는 짧아지기 쉬우므로 의식적으로 더 자세히 작성할 것
- 완전히 한국어로 작성. 번역이 아닌 한국어 독자를 위해 독립적으로 작성.
- 가이드 작성이 끝났다고 생각되면 아직 절반밖에 안 쓴 것입니다. 더 자세히 쓰세요.`,
      user: `주제: "${context.prompt}"
루트: ${context.route.title_kr || context.route.title} (${context.route.slug})
스텝: ${toolNames}
설명: ${context.route.description_kr || context.route.description}

이 주제에 대한 새로운 한국어 가이드를 생성하세요.`,
    };
  }

  if (target === "route_en") {
    return {
      system: `You regenerate ONLY the English fields of a route. Keep the same tools and structure.
A Route has exactly 3 steps with is_best3: true.

Output JSON:
{
  "title": "string (English)",
  "description": "string (English, 1 sentence)",
  "guide_bullets": ["string (English pro tips, 3-5 items)"],
  "steps": [
    {
      "position": 1,
      "step_title": "string (English short action phrase)",
      "step_why": "string (English, why this tool)",
      "step_cta_label": "Try [ToolName]",
      "step_prompt_example": "string (English prompt/settings/action)"
    }
  ]
}
Keep the same tools, same step_input_type, same positions. Only regenerate English text.`,
      user: `Topic: "${context.prompt}"
Current tools: ${JSON.stringify(context.steps.map((s) => ({ position: s.position, tool_slug: s.tool_slug, step_input_type: s.step_input_type })))}

Regenerate English route content with fresh, improved text.`,
    };
  }

  // route_kr
  return {
    system: `한국어 루트 필드만 재생성합니다. 같은 도구와 구조를 유지하세요.
루트는 정확히 3단계, 모두 is_best3: true.

Output JSON:
{
  "title_kr": "string (한국어)",
  "description_kr": "string (한국어, 1문장)",
  "guide_bullets_kr": ["string (한국어 프로팁, 3-5개)"],
  "steps": [
    {
      "position": 1,
      "step_title_kr": "string (한국어, 괄호 안에 설명 포함)",
      "step_why_kr": "string (한국어, 이 도구를 쓰는 이유)",
      "step_cta_label_kr": "[ToolName] 사용해보기",
      "step_prompt_example_kr": "string (한국어 프롬프트/설정/액션)"
    }
  ]
}
같은 도구, 같은 step_input_type, 같은 position 유지. 한국어 텍스트만 재생성.`,
    user: `주제: "${context.prompt}"
현재 도구: ${JSON.stringify(context.steps.map((s) => ({ position: s.position, tool_slug: s.tool_slug, step_input_type: s.step_input_type })))}

새롭고 개선된 한국어 루트 콘텐츠를 재생성하세요.`,
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
    if (process.env.OPENAI_ENABLED !== "true") {
      return NextResponse.json({ ok: false, error: "OpenAI disabled" }, { status: 403 });
    }

    const apiKey = process.env.OPENAI_API_KEY;
    if (!apiKey) {
      return NextResponse.json({ ok: false, error: "Missing OPENAI_API_KEY" }, { status: 500 });
    }

    const body = await req.json().catch(() => ({}));
    const target: RegenerateTarget = body.target;
    const prompt: string = body.prompt;
    const route = body.route;
    const tool = body.tool;
    const mode: string = body.mode || "route";
    const difficulty: string = body.difficulty || "beginner";

    if (!target || !prompt) {
      return NextResponse.json({ ok: false, error: "target, prompt are required" }, { status: 400 });
    }

    const validTargets: RegenerateTarget[] = ["route_en", "route_kr", "guide_en", "guide_kr"];
    if (!validTargets.includes(target)) {
      return NextResponse.json({ ok: false, error: `Invalid target: ${target}` }, { status: 400 });
    }

    if (mode === "tool" && (target === "route_en" || target === "route_kr")) {
      return NextResponse.json({ ok: false, error: "Route regeneration not available in tool mode" }, { status: 400 });
    }

    if (mode === "route" && !route) {
      return NextResponse.json({ ok: false, error: "route is required for route mode" }, { status: 400 });
    }
    if (mode === "tool" && !tool) {
      return NextResponse.json({ ok: false, error: "tool is required for tool mode" }, { status: 400 });
    }

    const difficultyHint =
      difficulty === "beginner" ? "\nIMPORTANT: Target audience is BEGINNERS. Use simple, accessible language. Assume no prior AI tool experience." :
      difficulty === "intermediate" ? "\nTarget audience is intermediate users with some AI tool experience." :
      "\nTarget audience is advanced/power users. Can use technical language.";

    let system: string;
    let userMsg: string;

    if (mode === "tool" && (target === "guide_en" || target === "guide_kr")) {
      const result = buildRegeneratePromptForTool(target, { prompt, tool });
      system = result.system;
      userMsg = result.user;
    } else {
      const result = buildRegeneratePrompt(target, {
        prompt,
        route,
        steps: route?.steps ?? [],
      });
      system = result.system;
      userMsg = result.user;
    }

    const systemWithDifficulty = system + difficultyHint;

    const model = process.env.OPENAI_CREATOR_MODEL || "gpt-4o";
    const openai = new OpenAI({ apiKey });

    const isGuide = target.startsWith("guide_");
    const maxTokens = isGuide ? 12000 : 3000;

    const completion = await openai.chat.completions.create({
      model,
      messages: [
        { role: "system", content: systemWithDifficulty },
        { role: "user", content: userMsg },
      ],
      temperature: 0.8,
      max_tokens: maxTokens,
      response_format: { type: "json_object" },
    });

    const raw = completion.choices[0]?.message?.content;
    if (!raw) throw new Error("OpenAI returned empty response");

    let parsed: Record<string, unknown>;
    try {
      parsed = JSON.parse(raw);
    } catch {
      throw new Error("Failed to parse regeneration JSON");
    }

    const db = createAdminSupabase();
    const usage = completion.usage;
    await db.from("admin_openai_usage_logs").insert({
      guide_id: null,
      action: `ai_regenerate_${target}`,
      lang: target.endsWith("_kr") ? "kr" : "en",
      model,
      prompt_tokens: usage?.prompt_tokens ?? null,
      completion_tokens: usage?.completion_tokens ?? null,
      total_tokens: usage?.total_tokens ?? null,
    });

    return NextResponse.json({
      ok: true,
      target,
      data: parsed,
      tokens: usage?.total_tokens ?? 0,
    });
  } catch (e: unknown) {
    const message = e instanceof Error ? e.message : "Unknown error";
    console.error("[ai-creator/regenerate]", message);
    return NextResponse.json({ ok: false, error: message }, { status: 500 });
  }
}
