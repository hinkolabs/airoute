import { NextResponse } from "next/server";
import { createAdminSupabase } from "@/lib/supabase/admin";

function getOpenAIConfig() {
  return {
    enabled: process.env.OPENAI_ENABLED === "true",
    apiKey: process.env.OPENAI_API_KEY,
    model: process.env.OPENAI_MODEL || "gpt-4o-mini",
  };
}

type TranslatedTool = {
  name: string;
  description: string;
  task_category: string | null;
  best_for: string | null;
  why_pick: string | null;
  detail_content: Record<string, unknown> | null;
};

type ToolInput = {
  name: string;
  description: string | null;
  task_category: string | null;
  best_for: string | null;
  why_pick: string | null;
  detail_content: Record<string, unknown> | null;
};

async function callOpenAI(prompt: string): Promise<string> {
  const { enabled, apiKey, model } = getOpenAIConfig();

  if (!enabled) {
    throw new Error(
      `OpenAI disabled. OPENAI_ENABLED=${process.env.OPENAI_ENABLED ?? "(unset)"}. Set OPENAI_ENABLED=true in .env.local`
    );
  }
  if (!apiKey) {
    throw new Error("OPENAI_API_KEY is not set in .env.local");
  }

  const response = await fetch("https://api.openai.com/v1/chat/completions", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${apiKey}`,
    },
    body: JSON.stringify({
      model,
      messages: [{ role: "user", content: prompt }],
      temperature: 0.3,
    }),
  });

  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(
      `OpenAI API ${response.status}: ${errorText.slice(0, 300)}`
    );
  }

  const json = await response.json();
  const content = json.choices?.[0]?.message?.content || "{}";
  return content.replace(/```json\n?/g, "").replace(/```\n?/g, "").trim();
}

async function translateToolToKorean(tool: ToolInput): Promise<TranslatedTool> {
  const detailJson = tool.detail_content
    ? JSON.stringify(tool.detail_content)
    : null;

  const prompt = `You are a professional translator specializing in AI tool localization.
Translate ALL of the following AI tool fields from English to Korean.
Maintain natural, user-friendly Korean that beginners can understand.

=== FIELDS TO TRANSLATE ===

1. Tool Name: ${tool.name}
2. Description: ${tool.description || "(empty)"}
3. Task Category: ${tool.task_category || "(empty)"}
4. Best For: ${tool.best_for || "(empty)"}
5. Why We Picked It: ${tool.why_pick || "(empty)"}
${detailJson ? `6. Detail Content (JSON): ${detailJson}` : ""}

=== OUTPUT FORMAT ===

Return a JSON object with these exact keys:
{
  "name": "translated name (keep brand names like ChatGPT, Midjourney as-is)",
  "description": "translated description",
  "task_category": "translated task category or null",
  "best_for": "translated best_for or null",
  "why_pick": "translated why_pick or null"${detailJson ? `,
  "detail_content": { "intro": "...", "features": ["...", "..."], "bestFor": ["...", "..."], "whyPicked": "...", "tips": ["...", "..."] }` : ""}
}

Important:
- Keep brand names (ChatGPT, Midjourney, Filmora, etc.) as-is
- Use natural Korean that AI beginners can understand
- For empty fields, return null
- For detail_content, translate ALL string values inside the JSON structure
- Return ONLY the JSON, no other text`;

  let raw: string;
  try {
    raw = await callOpenAI(prompt);
  } catch (e) {
    throw new Error(`[OpenAI 호출] ${e instanceof Error ? e.message : e}`);
  }

  let parsed: Record<string, unknown>;
  try {
    parsed = JSON.parse(raw);
  } catch {
    throw new Error(
      `[JSON 파싱 실패] OpenAI 응답이 유효한 JSON이 아님: ${raw.slice(0, 200)}`
    );
  }

  return {
    name: (parsed.name as string) || tool.name,
    description:
      (parsed.description as string) || tool.description || "설명 없음",
    task_category: (parsed.task_category as string) || null,
    best_for: (parsed.best_for as string) || null,
    why_pick: (parsed.why_pick as string) || null,
    detail_content: (parsed.detail_content as Record<string, unknown>) || null,
  };
}

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { toolId, forceRetranslate, batchSize = 5, delayMs = 3000 } = body;

    const supabase = createAdminSupabase();

    // Fetch tools with all translatable fields
    let toolsQuery = supabase
      .from("tools")
      .select(
        "id, name, description, is_active, task_category, best_for, why_pick, detail_content"
      );

    if (toolId) {
      toolsQuery = toolsQuery.eq("id", toolId);
    } else {
      toolsQuery = toolsQuery.eq("is_active", true);
    }

    const { data: allTools, error: toolsError } = await toolsQuery;

    if (toolsError) {
      return NextResponse.json(
        {
          ok: false,
          error: `[DB 조회 실패] ${toolsError.message} (code: ${toolsError.code})`,
        },
        { status: 500 }
      );
    }

    if (!allTools || allTools.length === 0) {
      return NextResponse.json(
        { ok: false, error: "번역할 툴이 없습니다 (0개 조회됨)" },
        { status: 404 }
      );
    }

    const config = getOpenAIConfig();
    const envDebug = {
      OPENAI_ENABLED: config.enabled,
      OPENAI_API_KEY_SET: !!config.apiKey,
      OPENAI_MODEL: config.model,
    };

    // Filter out already-translated tools (unless force)
    const toolsToProcess: typeof allTools = [];
    const skippedResults: Array<{ toolId: string; toolName: string; status: string }> = [];

    for (const tool of allTools) {
      if (!forceRetranslate) {
        const { data: existing } = await supabase
          .from("tools_i18n")
          .select("id, task_category, best_for, why_pick, detail_content")
          .eq("tool_id", tool.id)
          .eq("locale", "kr")
          .maybeSingle();

        if (existing) {
          const hasExtended =
            existing.task_category ||
            existing.best_for ||
            existing.why_pick ||
            existing.detail_content;
          if (hasExtended) {
            skippedResults.push({
              toolId: tool.id,
              toolName: tool.name,
              status: "skipped",
            });
            continue;
          }
        }
      }
      toolsToProcess.push(tool);
    }

    // Apply batch limit
    const limit = Math.min(Math.max(batchSize, 1), 20);
    const batch = toolsToProcess.slice(0, limit);
    const remaining = toolsToProcess.length - batch.length;
    const interval = Math.max(delayMs, 1500);

    const results: Array<{
      toolId: string;
      toolName: string;
      status: string;
      error?: string;
    }> = [...skippedResults];

    for (let i = 0; i < batch.length; i++) {
      const tool = batch[i];
      try {
        const translated = await translateToolToKorean({
          name: tool.name,
          description: tool.description,
          task_category: tool.task_category,
          best_for: tool.best_for,
          why_pick: tool.why_pick,
          detail_content: tool.detail_content,
        });

        const { error: upsertError } = await supabase
          .from("tools_i18n")
          .upsert(
            {
              tool_id: tool.id,
              locale: "kr",
              name: translated.name,
              description: translated.description,
              task_category: translated.task_category,
              best_for: translated.best_for,
              why_pick: translated.why_pick,
              detail_content: translated.detail_content,
            },
            { onConflict: "tool_id,locale" }
          );

        if (upsertError) {
          throw new Error(
            `[DB 저장] ${upsertError.message} (code: ${upsertError.code})`
          );
        }

        results.push({
          toolId: tool.id,
          toolName: tool.name,
          status: "success",
        });

        if (i < batch.length - 1) {
          await new Promise((resolve) => setTimeout(resolve, interval));
        }
      } catch (error: unknown) {
        const message =
          error instanceof Error ? error.message : String(error);
        console.error(`[translate] Tool ${tool.id} (${tool.name}):`, message);
        results.push({
          toolId: tool.id,
          toolName: tool.name,
          status: "error",
          error: message,
        });
      }
    }

    const translated = results.filter((r) => r.status === "success").length;

    return NextResponse.json({
      ok: true,
      message: `Processed ${batch.length} tool(s), translated ${translated}`,
      processed: batch.length,
      total: toolsToProcess.length,
      remaining,
      hasMore: remaining > 0,
      envDebug,
      results,
    });
  } catch (e: unknown) {
    const message = e instanceof Error ? e.message : String(e);
    console.error("[translate] Top-level exception:", message);
    return NextResponse.json({ ok: false, error: message }, { status: 500 });
  }
}
