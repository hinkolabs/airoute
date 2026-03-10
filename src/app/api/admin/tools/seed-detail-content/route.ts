import { NextResponse } from "next/server";
import { createAdminSupabase } from "@/lib/supabase/admin";

function getOpenAIConfig() {
  return {
    enabled: process.env.OPENAI_ENABLED === "true",
    apiKey: process.env.OPENAI_API_KEY,
    model: process.env.OPENAI_MODEL || "gpt-4o-mini",
  };
}

async function callOpenAI(prompt: string): Promise<string> {
  const { enabled, apiKey, model } = getOpenAIConfig();
  if (!enabled) throw new Error("OPENAI_ENABLED is not true");
  if (!apiKey) throw new Error("OPENAI_API_KEY is not set");

  const res = await fetch("https://api.openai.com/v1/chat/completions", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${apiKey}`,
    },
    body: JSON.stringify({
      model,
      messages: [{ role: "user", content: prompt }],
      temperature: 0.4,
    }),
  });

  if (!res.ok) {
    const err = await res.text();
    throw new Error(`OpenAI ${res.status}: ${err.slice(0, 200)}`);
  }
  const json = await res.json();
  return (json.choices?.[0]?.message?.content || "{}")
    .replace(/```json\n?/g, "")
    .replace(/```\n?/g, "")
    .trim();
}

async function generateDetailContent(tool: {
  name: string;
  desc_en: string | null;
  best_for: string | null;
  why_pick: string | null;
  task_category: string | null;
  tags: string[] | null;
}): Promise<Record<string, unknown>> {
  const prompt = `You are a content writer for an AI tools directory website targeting creators, marketers, and developers.

Write rich English guide content for the following AI tool:

Tool Name: ${tool.name}
Category: ${tool.task_category ?? "AI Tool"}
Description: ${tool.desc_en ?? ""}
Best For: ${tool.best_for ?? ""}
Why We Picked It: ${tool.why_pick ?? ""}
Tags: ${tool.tags?.join(", ") ?? ""}

=== OUTPUT FORMAT ===
Return ONLY a JSON object with exactly these keys:
{
  "intro": "2-3 sentence engaging introduction about what the tool does and who it's for. No fluff.",
  "features": ["Feature 1 — short clear description", "Feature 2 — ...", "Feature 3 — ...", "Feature 4 — ...", "Feature 5 — ..."],
  "bestFor": ["Use case 1", "Use case 2", "Use case 3", "Use case 4"],
  "whyPicked": "1-2 sentence reason why this tool stands out from alternatives. Be specific.",
  "tips": ["Practical tip 1", "Practical tip 2", "Practical tip 3"]
}

Rules:
- features: exactly 5 items, each starting with a short feature name followed by " — " and a brief description
- bestFor: exactly 4 use case labels (short, e.g. "YouTube creators", "Marketing teams")
- tips: exactly 3 practical usage tips
- All text must be in English
- Be concise and useful, not marketing fluff
- Return ONLY valid JSON, no other text`;

  const raw = await callOpenAI(prompt);
  return JSON.parse(raw);
}

export async function POST(req: Request) {
  try {
    const body = await req.json().catch(() => ({}));
    const { toolId, forceRegenerate = false, batchSize = 5, delayMs = 2000 } = body;

    const { enabled } = getOpenAIConfig();
    if (!enabled) {
      return NextResponse.json(
        { ok: false, error: "OPENAI_ENABLED is not true. Set it in .env.local" },
        { status: 400 }
      );
    }

    const supabase = createAdminSupabase();

    let query = supabase
      .from("tools")
      .select("id, name, desc_en, best_for, why_pick, task_category, tags, detail_content")
      .eq("is_active", true);

    if (toolId) {
      query = query.eq("id", toolId);
    } else if (!forceRegenerate) {
      query = query.is("detail_content", null);
    }

    const { data: tools, error: fetchError } = await query;

    if (fetchError) {
      return NextResponse.json({ ok: false, error: fetchError.message }, { status: 500 });
    }
    if (!tools || tools.length === 0) {
      return NextResponse.json({ ok: true, message: "모든 툴에 이미 detail_content가 있습니다", processed: 0 });
    }

    const limit = Math.min(Math.max(batchSize, 1), 20);
    const batch = tools.slice(0, limit);
    const remaining = tools.length - batch.length;
    const interval = Math.max(delayMs, 1500);

    const results: Array<{ toolId: string; name: string; status: string; error?: string }> = [];

    for (let i = 0; i < batch.length; i++) {
      const tool = batch[i];
      try {
        const detailContent = await generateDetailContent({
          name: tool.name,
          desc_en: tool.desc_en,
          best_for: tool.best_for,
          why_pick: tool.why_pick,
          task_category: tool.task_category,
          tags: tool.tags,
        });

        const { error: updateError } = await supabase
          .from("tools")
          .update({
            detail_content: detailContent,
            // sync description from desc_en if missing
            description: tool.desc_en ?? undefined,
          })
          .eq("id", tool.id);

        if (updateError) throw new Error(updateError.message);

        results.push({ toolId: tool.id, name: tool.name, status: "success" });
      } catch (e) {
        const msg = e instanceof Error ? e.message : String(e);
        console.error(`[seed-detail-content] ${tool.name}:`, msg);
        results.push({ toolId: tool.id, name: tool.name, status: "error", error: msg });
      }

      if (i < batch.length - 1) {
        await new Promise((r) => setTimeout(r, interval));
      }
    }

    const successCount = results.filter((r) => r.status === "success").length;

    return NextResponse.json({
      ok: true,
      message: `${batch.length}개 처리, ${successCount}개 성공`,
      processed: batch.length,
      total: tools.length,
      remaining,
      hasMore: remaining > 0,
      results,
    });
  } catch (e) {
    const msg = e instanceof Error ? e.message : String(e);
    return NextResponse.json({ ok: false, error: msg }, { status: 500 });
  }
}
