import { NextResponse } from "next/server";
import { createAdminSupabase } from "@/lib/supabase/admin";
import { checkAdminAuth } from "@/lib/admin/check-admin-auth";

export async function GET() {
  const auth = await checkAdminAuth();
  if (!auth.ok) {
    return NextResponse.json({ ok: false, error: auth.error }, { status: auth.status });
  }

  try {
    const db = createAdminSupabase();
    const now = new Date();
    const todayKey = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}-${String(now.getDate()).padStart(2, "0")}`;
    const monthKey = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}-01`;

    // Today's usage
    const { data: todayLogs } = await db
      .from("admin_openai_usage_logs")
      .select("total_tokens, action")
      .gte("created_at", `${todayKey}T00:00:00Z`);

    // This month's usage
    const { data: monthLogs } = await db
      .from("admin_openai_usage_logs")
      .select("total_tokens, action")
      .gte("created_at", `${monthKey}T00:00:00Z`);

    const sumTokens = (logs: { total_tokens: number | null }[] | null) =>
      (logs ?? []).reduce((sum, l) => sum + (l.total_tokens ?? 0), 0);

    const countByAction = (logs: { action: string | null }[] | null, action: string) =>
      (logs ?? []).filter((l) => l.action === action).length;

    const todayTokens = sumTokens(todayLogs);
    const monthTokens = sumTokens(monthLogs);

    const model = process.env.OPENAI_MODEL || "gpt-4o-mini";

    // gpt-4o-mini: ~$0.15/1M input + $0.60/1M output ≈ avg ~$0.30/1M tokens
    // gpt-4o: ~$2.50/1M input + $10/1M output ≈ avg ~$5/1M tokens
    const costPer1MTokens = model.includes("4o-mini") ? 0.3 : model.includes("4o") ? 5 : 0.3;
    const todayCostUsd = (todayTokens / 1_000_000) * costPer1MTokens;
    const monthCostUsd = (monthTokens / 1_000_000) * costPer1MTokens;

    return NextResponse.json({
      ok: true,
      model,
      today: {
        tokens: todayTokens,
        calls: todayLogs?.length ?? 0,
        cost_usd: Math.round(todayCostUsd * 10000) / 10000,
        suggests: countByAction(todayLogs, "ai_suggest_topics"),
        creates: countByAction(todayLogs, "ai_creator_analyze"),
      },
      month: {
        tokens: monthTokens,
        calls: monthLogs?.length ?? 0,
        cost_usd: Math.round(monthCostUsd * 10000) / 10000,
        suggests: countByAction(monthLogs, "ai_suggest_topics"),
        creates: countByAction(monthLogs, "ai_creator_analyze"),
      },
    });
  } catch (e: unknown) {
    const message = e instanceof Error ? e.message : "Unknown error";
    console.error("[ai-creator/usage]", message);
    return NextResponse.json({ ok: false, error: message }, { status: 500 });
  }
}
