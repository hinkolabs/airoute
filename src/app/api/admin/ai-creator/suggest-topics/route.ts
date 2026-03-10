import { NextResponse } from "next/server";
import { createAdminSupabase } from "@/lib/supabase/admin";
import { checkAdminAuth } from "@/lib/admin/check-admin-auth";
import OpenAI from "openai";

const DAILY_LIMIT = 50;

const DIFFICULTY_TOOL_RULES = {
  beginner: `DIFFICULTY = 초급 (Beginner — AI 챗봇만 써본 수준)
- ONLY use these tools: ChatGPT, Gemini (Google), Claude (Anthropic), Canva
- These 4 tools ONLY. Do NOT include any other tool.
- Workflows must be purely: 프롬프트 입력 → 결과 복사 → Canva에 붙여넣기 수준
- NO file uploads beyond simple text/image, NO plugins, NO integrations, NO accounts other than Google/Kakao login
- Good angle: ChatGPT vs Gemini 비교, Claude의 장문 분석 특기, Canva AI 디자인 자동화
- Each step completable in under 3 minutes with zero prior knowledge`,
  intermediate: `DIFFICULTY = 중급 (Intermediate — 앱 설치·구독 경험 있는 수준)
- Recommend tools like: Notion AI, CapCut, Vrew, Clova Note, 브루, Google Docs, HeyGen, Gamma, Pictory, ElevenLabs (basic use)
- Users can install apps, create accounts, follow video tutorials
- Can involve paid subscriptions (monthly), basic template customization
- Focus on: drag-and-drop, preset templates, guided step-by-step UI`,
  advanced: `DIFFICULTY = 고급 (Advanced — 개발자·파워유저 수준)
- Can recommend: Midjourney, ComfyUI, FaceSwap, n8n, Make, Stable Diffusion, Kling API, Leonardo AI, Runway, custom GPTs
- Users are comfortable with API keys, JSON configs, local installs, prompt engineering
- Can involve technical setup, coding basics, complex integrations`,
};

const ROUTE_SYSTEM_PROMPT = `You are a practical AI content strategist for Airoute — a Korean AI tool discovery platform.

Your job: suggest 6 SPECIFIC, PRACTICAL AI workflow ideas that Korean users can realistically do TODAY.
A "Route" = a 3-step workflow chaining 2-3 AI tools together.

CORE QUALITY RULES (strict):
- Be ULTRA-SPECIFIC. Bad: "AI로 보고서 작성". Good: "ChatGPT에 회의록 붙여넣기 → 요약 프롬프트로 3줄 요약 → Notion에 자동 저장"
- The "prompt" field must describe EXACTLY what the user does at each step (tool name + specific action)
- "reason" must explain a REAL pain point this solves, not generic praise
- Avoid business jargon. Write like explaining to a friend.
- Mix of categories: video, image, writing, productivity (no more than 2 of the same category)
- 추천 이유는 반드시 구체적 수치나 실제 상황을 포함 ("30분 걸리던 작업이 5분으로", "매일 반복되는 업무를" 등)

OUTPUT FORMAT (strict JSON):
{
  "suggestions": [
    {
      "prompt": "string (Korean, SPECIFIC step-by-step workflow: Tool A로 X → Tool B로 Y → Tool C로 Z)",
      "title": "string (Korean, concrete benefit title, 15-30 chars, e.g. '회의록 자동 정리 3분 완성')",
      "reason": "string (Korean, 2-3 sentences: specific pain point + how this solves it + real benefit)",
      "category": "string (video | image | audio | writing | productivity)",
      "trend_type": "string (viral | seasonal | evergreen | meme)"
    }
  ]
}

IMPORTANT:
- Today's date and difficulty level will be provided. Respect them strictly.
- Include at least 1 evergreen productivity topic that solves a daily work problem.`;

const TOOL_SYSTEM_PROMPT = `You are a practical AI content strategist for Airoute — a Korean AI tool discovery platform.

Your job: suggest 6 SPECIFIC, PRACTICAL single AI tool ideas that Korean users can try TODAY.

CORE QUALITY RULES (strict):
- Be ULTRA-SPECIFIC. Bad: "AI로 이미지 생성". Good: "Canva AI - 블로그 썸네일을 텍스트 한 줄로 10초 만에 생성하는 법"
- The "prompt" field = tool name + exact use case + specific output the user gets
- "reason" must explain a REAL problem this tool solves, with concrete benefit
- Name the ACTUAL tool (Kling AI, Suno, ElevenLabs, Gamma, etc.)
- Avoid generic descriptions. Write what specifically the user can DO with it.
- Mix of categories: video, image, audio, writing, productivity

OUTPUT FORMAT (strict JSON):
{
  "suggestions": [
    {
      "prompt": "string (Korean, SPECIFIC: tool name + exact use case + what you get as output)",
      "title": "string (Korean, concrete benefit title, 15-30 chars)",
      "reason": "string (Korean, 2-3 sentences: specific pain point + how tool solves it + real benefit)",
      "category": "string (video | image | audio | writing | productivity)",
      "trend_type": "string (viral | seasonal | evergreen | meme)"
    }
  ]
}

IMPORTANT:
- Today's date and difficulty level will be provided. Respect them strictly.
- Include at least 1 evergreen productivity topic that solves a daily work problem.`;

function getTodayDateKey(): string {
  const now = new Date();
  return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}-${String(now.getDate()).padStart(2, "0")}`;
}

// In-memory cache per mode: { dateKey → suggestions[] }
const cachedSuggestions: Record<string, { date: string; data: unknown[] }> = {};

export async function POST(req: Request) {
  const auth = await checkAdminAuth();
  if (!auth.ok) {
    return NextResponse.json({ ok: false, error: auth.error }, { status: auth.status });
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
    const context: string = typeof body.context === "string" ? body.context.trim() : "";
    const difficulty: "beginner" | "intermediate" | "advanced" =
      body.difficulty === "intermediate" ? "intermediate"
      : body.difficulty === "advanced" ? "advanced"
      : "beginner";
    const actionKey = mode === "tool" ? "ai_suggest_topics_tool" : "ai_suggest_topics";

    const todayKey = getTodayDateKey();
    const cacheKey = `${mode}`;
    const db = createAdminSupabase();

    // context가 있으면 캐시 우회 (커스텀 요청은 항상 신선하게)
    const shouldBypassCache = force || !!context;

    // ── Return in-memory cache if same day (unless force refresh) ──
    // force=true 시 in-memory 캐시를 즉시 삭제하여 확실히 새 결과 반환
    if (shouldBypassCache) {
      delete cachedSuggestions[cacheKey];
    }
    const memCache = cachedSuggestions[cacheKey];
    if (!shouldBypassCache && memCache?.date === todayKey && memCache.data.length > 0) {
      return NextResponse.json({
        ok: true,
        suggestions: memCache.data,
        tokens: 0,
        cached: true,
      });
    }

    // ── Check DB cache: reuse today's most recent result (unless force) ──
    if (!shouldBypassCache) {
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

    const difficultyRule = DIFFICULTY_TOOL_RULES[difficulty];
    const systemPrompt = (mode === "tool" ? TOOL_SYSTEM_PROMPT : ROUTE_SYSTEM_PROMPT)
      + `\n\n--- DIFFICULTY CONSTRAINT (MUST FOLLOW) ---\n${difficultyRule}\n---`;

    // force 재추천 시 랜덤 시드 + "이전과 다르게" 지시 추가
    const refreshNote = shouldBypassCache && !context
      ? `\n\n[재추천 #${Math.floor(Math.random() * 99999)}] 이전에 추천한 주제와 완전히 다른 카테고리/키워드/접근법으로 6개를 새롭게 추천해주세요. 이전 결과와 중복 없이 신선한 아이디어여야 합니다.`
      : "";

    // 커스텀 컨텍스트가 있을 때: 해당 분야/직군에 특화된 인사이트 있는 추천
    const contextNote = context
      ? `\n\n[맞춤 추천 요청]\n사용자 요청: "${context}"\n\n위 요청을 최우선으로 반영하여, 해당 분야/직군/상황에 딱 맞는 AI 워크플로우 아이디어 6개를 추천해주세요.\n- 해당 분야의 실제 업무 고통점(pain point)을 해결하는 아이디어\n- 해당 직군/상황에서 바로 써먹을 수 있는 구체적인 워크플로우\n- "왜 이 아이디어가 이 분야에 유용한지" 인사이트 있게 설명\n- 트렌드나 계절보다 요청의 맥락을 우선시해서 추천`
      : "";

    const difficultyLabel = difficulty === "beginner" ? "초급 (비전문가, 클릭만 할 줄 아는 수준)"
      : difficulty === "intermediate" ? "중급 (구독/설정 가능, 학습 의지 있음)"
      : "고급 (개발자 수준, 기술 설정 가능)";

    const userMessage =
      mode === "tool"
        ? `오늘 날짜: ${dateStr}\n시즌 힌트: ${seasonHint}\n대상 사용자 수준: ${difficultyLabel}\n\n위 난이도 제약을 엄격하게 지켜서, 해당 수준의 사용자가 바로 쓸 수 있는 AI 툴 6개를 구체적으로 추천해주세요. 툴 이름 + 정확히 무엇을 할 수 있는지 + 어떤 불편함을 해결하는지 설명해주세요.${contextNote}${refreshNote}`
        : `오늘 날짜: ${dateStr}\n시즌 힌트: ${seasonHint}\n대상 사용자 수준: ${difficultyLabel}\n\n위 난이도 제약을 엄격하게 지켜서, 해당 수준의 사용자가 실제로 오늘 따라할 수 있는 AI 워크플로우 6개를 구체적으로 추천해주세요. 각 단계별로 어떤 툴로 무엇을 하는지 명확하게 설명해주세요.${contextNote}${refreshNote}`;

    const completion = await openai.chat.completions.create({
      model,
      messages: [
        { role: "system", content: systemPrompt },
        { role: "user", content: userMessage },
      ],
      temperature: shouldBypassCache ? 1.0 : 0.9,
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
