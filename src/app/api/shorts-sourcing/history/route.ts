import { NextRequest, NextResponse } from "next/server";
import { getDemoMode } from "@/lib/flags";
import { requireUser, requireWorkspaceMember, isErrorResponse } from "@/lib/shorts-sourcing/api-guard";

export const dynamic = "force-dynamic";

// GET /api/shorts-sourcing/history?workspace_id=...
// Lists past sourcing sessions ("검색 기록"). Opening this never calls any external API.
export async function GET(request: NextRequest) {
  if (await getDemoMode()) return new NextResponse(null, { status: 404 });

  const ctx = await requireUser();
  if (isErrorResponse(ctx)) return ctx;

  const workspaceId = new URL(request.url).searchParams.get("workspace_id");
  if (!workspaceId) {
    return NextResponse.json({ error: "workspace_id is required" }, { status: 400 });
  }

  const membership = await requireWorkspaceMember(ctx.admin, workspaceId, ctx.user.id);
  if (isErrorResponse(membership)) return membership;

  const { data: sessions, error } = await ctx.admin
    .from("shorts_sourcing_sessions")
    .select("id, product_name_ko, category_ko, created_at")
    .eq("workspace_id", workspaceId)
    .order("created_at", { ascending: false })
    .limit(50);

  if (error) {
    return NextResponse.json({ error: "server_error" }, { status: 500 });
  }

  const sessionIds = (sessions ?? []).map((s) => s.id);
  const { data: itemCounts } = sessionIds.length
    ? await ctx.admin.from("shorts_source_items").select("session_id, platform").in("session_id", sessionIds)
    : { data: [] as { session_id: string; platform: string }[] };

  const countsBySession = new Map<string, { total: number; douyin: number; xiaohongshu: number }>();
  for (const row of itemCounts ?? []) {
    const c = countsBySession.get(row.session_id) ?? { total: 0, douyin: 0, xiaohongshu: 0 };
    c.total += 1;
    if (row.platform === "douyin") c.douyin += 1;
    if (row.platform === "xiaohongshu") c.xiaohongshu += 1;
    countsBySession.set(row.session_id, c);
  }

  const withCounts = (sessions ?? []).map((s) => ({
    ...s,
    counts: countsBySession.get(s.id) ?? { total: 0, douyin: 0, xiaohongshu: 0 },
  }));

  return NextResponse.json({ ok: true, sessions: withCounts });
}
