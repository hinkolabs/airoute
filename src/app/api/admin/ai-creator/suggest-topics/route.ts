import { NextResponse } from "next/server";
import { createAdminSupabase } from "@/lib/supabase/admin";
import { createClient } from "@/lib/supabase/server";
import OpenAI from "openai";

const DAILY_LIMIT = 50;

const ROUTE_SYSTEM_PROMPT = `You are a trend-savvy AI content strategist for Airoute — an AI tool discovery platform.

Your job: suggest 6 trending, viral, or seasonally relevant AI WORKFLOW ideas that an admin can turn into Routes + Guides.
A "Route" is a multi-step workflow (3 steps) that chains 2-3 AI tools together.

Requirements:
- Mix of categories: video, image, audio, writing, productivity
- Include CURRENT viral trends, social media memes, seasonal events, and evergreen popular topics
- Each suggestion must explain WHY it's trending or recommended
- Ideas should be practical multi-step "how-to" workflows that use 2-3 AI tools in sequence
- Write suggestions in Korean (the admin is Korean-speaking)
- Be specific and actionable, not vague
- Prompts should describe a WORKFLOW, e.g. "ChatGPT로 스크립트 → Runway로 영상 → CapCut으로 편집"

OUTPUT FORMAT (strict JSON):
{
  "suggestions": [
    {
      "prompt": "string (Korean, the actual prompt — describe the multi-tool workflow)",
      "title": "string (Korean, short catchy title, 15-30 chars)",
      "reason": "string (Korean, 1-2 sentences explaining why this is trending/recommended)",
      "category": "string (video | image | audio | writing | productivity)",
      "trend_type": "string (viral | seasonal | evergreen | meme)"
    }
  ]
}

IMPORTANT:
- Today's date context will be provided. Use it for seasonal relevance.
- Think about what's trending on TikTok, Instagram, YouTube, Twitter/X right now.
- Include at least 1 viral meme/trend, 1 seasonal item, and 1 evergreen popular topic.`;

const TOOL_SYSTEM_PROMPT = `You are a trend-savvy AI content strategist for Airoute — an AI tool discovery platform.

Your job: suggest 6 trending, viral, or seasonally relevant SINGLE AI TOOL ideas that an admin can turn into Tool + Guide content.
Each suggestion should focus on ONE specific AI tool and a compelling use case.

Requirements:
- Mix of categories: video, image, audio, writing, productivity
- Include CURRENT viral trends, social media memes, seasonal events, and evergreen popular topics
- Each suggestion must explain WHY this tool/use case is trending or recommended
- Ideas should focus on a SINGLE AI tool with a clear use case (not multi-tool workflows)
- Write suggestions in Korean (the admin is Korean-speaking)
- Be specific: name the actual tool (e.g. Kling AI, Suno, ElevenLabs, Midjourney, etc.)
- Prompts should describe a tool + use case, e.g. "Kling AI - 사진 한장으로 고퀄리티 AI 영상 만드는 툴"

OUTPUT FORMAT (strict JSON):
{
  "suggestions": [
    {
      "prompt": "string (Korean, tool name + specific use case description)",
      "title": "string (Korean, short catchy title, 15-30 chars)",
      "reason": "string (Korean, 1-2 sentences explaining why this tool is trending/recommended)",
      "category": "string (video | image | audio | writing | productivity)",
      "trend_type": "string (viral | seasonal | evergreen | meme)"
    }
  ]
}

IMPORTANT:
- Today's date context will be provided. Use it for seasonal relevance.
- Think about what's trending on TikTok, Instagram, YouTube, Twitter/X right now.
- Include at least 1 viral meme/trend, 1 seasonal item, and 1 evergreen popular topic.`;

function getTodayDateKey(): string {
  const now = new Date();
  return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}-${String(now.getDate()).padStart(2, "0")}`;
}

// In-memory cache per mode: { dateKey → suggestions[] }
const cachedSuggestions: Record<string, { date: string; data: unknown[] }> = {};

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
      return NextResponse.json(
        { ok: false, error: "OpenAI disabled. Set OPENAI_ENABLED=true." },
        { status: 403 },
      );
    }

    const apiKey = process.env.OPENAI_API_KEY;
    if (!apiKey) {
      return NextResponse.json({ ok: false, error: "Missing OPENAI_API_KEY" }, { status: 500 });
    }

    const body = await req.json().catch(() => ({}));
    const force = body.force === true;
    const mode: "route" | "tool" = body.mode === "tool" ? "tool" : "route";
    const actionKey = mode === "tool" ? "ai_suggest_topics_tool" : "ai_suggest_topics";

    const todayKey = getTodayDateKey();
    const cacheKey = `${mode}`;
    const db = createAdminSupabase();

    // ── Return in-memory cache if same day (unless force refresh) ──
    const memCache = cachedSuggestions[cacheKey];
    if (!force && memCache?.date === todayKey && memCache.data.length > 0) {
      return NextResponse.json({
        ok: true,
        suggestions: memCache.data,
        tokens: 0,
        cached: true,
      });
    }

    // ── Check DB cache: reuse today's most recent result (unless force) ──
    if (!force) {
      const { data: recentLog } = await db
        .from("admin_openai_usage_logs")
        .select("note")
        .eq("action", actionKey)
        .gte("created_at", `${todayKey}T00:00:00Z`)
        .order("created_at", { ascending: false })
        .limit(1)
        .maybeSingle();

      if (recentLog?.note) {
        try {
          const cached = JSON.parse(recentLog.note);
          if (Array.isArray(cached) && cached.length > 0) {
            cachedSuggestions[cacheKey] = { date: todayKey, data: cached };
            return NextResponse.json({
              ok: true,
              suggestions: cached,
              tokens: 0,
              cached: true,
            });
          }
        } catch { /* parse error — generate fresh */ }
      }
    }

    // ── Daily rate limit check (shared across modes) ──
    const { count } = await db
      .from("admin_openai_usage_logs")
      .select("id", { count: "exact", head: true })
      .in("action", ["ai_suggest_topics", "ai_suggest_topics_tool"])
      .gte("created_at", `${todayKey}T00:00:00Z`);

    if ((count ?? 0) >= DAILY_LIMIT) {
      return NextResponse.json(
        { ok: false, error: `일일 추천 한도(${DAILY_LIMIT}회)를 초과했습니다. 내일 다시 시도해 주세요.` },
        { status: 429 },
      );
    }

    // ── Call OpenAI ──
    const now = new Date();
    const dateStr = now.toLocaleDateString("ko-KR", {
      year: "numeric",
      month: "long",
      day: "numeric",
      weekday: "long",
    });
    const month = now.getMonth() + 1;

    let seasonHint = "";
    if (month === 12 || month === 1) seasonHint = "겨울, 크리스마스/새해 시즌";
    else if (month === 2) seasonHint = "겨울 끝자락, 발렌타인데이, 설날/구정 시즌";
    else if (month >= 3 && month <= 5) seasonHint = "봄, 벚꽃 시즌, 졸업/입학 시즌";
    else if (month >= 6 && month <= 8) seasonHint = "여름, 여행/바캉스 시즌";
    else if (month >= 9 && month <= 11) seasonHint = "가을, 할로윈, 추석, 블랙프라이데이 시즌";

    const model = process.env.OPENAI_MODEL || "gpt-4o-mini";
    const openai = new OpenAI({ apiKey });

    const systemPrompt = mode === "tool" ? TOOL_SYSTEM_PROMPT : ROUTE_SYSTEM_PROMPT;
    const userMessage =
      mode === "tool"
        ? `오늘 날짜: ${dateStr}\n시즌 힌트: ${seasonHint}\n\n현재 SNS와 AI 커뮤니티에서 인기 있는 트렌드를 분석해서 6개의 개별 AI 툴 + 사용법 아이디어를 추천해주세요. 각각 구체적인 툴 이름과 왜 추천하는지 이유도 설명해주세요.`
        : `오늘 날짜: ${dateStr}\n시즌 힌트: ${seasonHint}\n\n현재 SNS와 AI 커뮤니티에서 인기 있는 트렌드를 분석해서 6개의 AI 멀티툴 워크플로우 아이디어를 추천해주세요. 각각 왜 추천하는지 이유도 설명해주세요.`;

    const completion = await openai.chat.completions.create({
      model,
      messages: [
        { role: "system", content: systemPrompt },
        { role: "user", content: userMessage },
      ],
      temperature: 0.9,
      max_tokens: 2000,
      response_format: { type: "json_object" },
    });

    const raw = completion.choices[0]?.message?.content;
    if (!raw) throw new Error("OpenAI returned empty response");

    let parsed: { suggestions: unknown[] };
    try {
      parsed = JSON.parse(raw);
    } catch {
      throw new Error("Failed to parse suggestions JSON");
    }

    if (!parsed.suggestions || !Array.isArray(parsed.suggestions)) {
      throw new Error("Invalid suggestions format");
    }

    // ── Log usage + cache result in note field ──
    const usage = completion.usage;
    await db.from("admin_openai_usage_logs").insert({
      guide_id: null,
      action: actionKey,
      lang: "kr",
      model,
      prompt_tokens: usage?.prompt_tokens ?? null,
      completion_tokens: usage?.completion_tokens ?? null,
      total_tokens: usage?.total_tokens ?? null,
      note: JSON.stringify(parsed.suggestions),
    });

    cachedSuggestions[cacheKey] = { date: todayKey, data: parsed.suggestions };

    return NextResponse.json({
      ok: true,
      suggestions: parsed.suggestions,
      tokens: usage?.total_tokens ?? 0,
      cached: false,
    });
  } catch (e: unknown) {
    const message = e instanceof Error ? e.message : "Unknown error";
    console.error("[ai-creator/suggest-topics]", message);
    return NextResponse.json({ ok: false, error: message }, { status: 500 });
  }
}
