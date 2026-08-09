import { NextRequest, NextResponse } from "next/server";
import { getDemoMode } from "@/lib/flags";
import { requireUser, requireSessionAccess, isErrorResponse } from "@/lib/shorts-sourcing/api-guard";
import { SHORTS_SEARCH_LIMITS } from "@/lib/shorts-sourcing/types";

export const dynamic = "force-dynamic";

// GET /api/shorts-sourcing/sessions/:sessionId/keywords
export async function GET(_request: NextRequest, { params }: { params: Promise<{ sessionId: string }> }) {
  if (await getDemoMode()) return new NextResponse(null, { status: 404 });

  const ctx = await requireUser();
  if (isErrorResponse(ctx)) return ctx;
  const { sessionId } = await params;

  const access = await requireSessionAccess(ctx.admin, sessionId, ctx.user.id);
  if (isErrorResponse(access)) return access;

  const { data: keywords, error } = await ctx.admin
    .from("shorts_sourcing_keywords")
    .select("id, keyword, is_ai_generated, is_selected")
    .eq("session_id", sessionId)
    .order("created_at", { ascending: true });

  if (error) {
    return NextResponse.json({ error: "server_error" }, { status: 500 });
  }

  return NextResponse.json({ ok: true, keywords: keywords ?? [] });
}

// POST /api/shorts-sourcing/sessions/:sessionId/keywords
// Body: { keyword: string } — adds a user-added keyword (is_ai_generated=false)
export async function POST(request: NextRequest, { params }: { params: Promise<{ sessionId: string }> }) {
  if (await getDemoMode()) return new NextResponse(null, { status: 404 });

  const ctx = await requireUser();
  if (isErrorResponse(ctx)) return ctx;
  const { sessionId } = await params;

  const access = await requireSessionAccess(ctx.admin, sessionId, ctx.user.id);
  if (isErrorResponse(access)) return access;

  const body = await request.json().catch(() => ({}));
  const keyword = typeof body.keyword === "string" ? body.keyword.trim() : "";

  if (!keyword) {
    return NextResponse.json({ error: "keyword_required" }, { status: 400 });
  }

  const { count } = await ctx.admin
    .from("shorts_sourcing_keywords")
    .select("id", { count: "exact", head: true })
    .eq("session_id", sessionId);

  if ((count ?? 0) >= SHORTS_SEARCH_LIMITS.maxKeywordsPerSession) {
    return NextResponse.json(
      { error: "too_many_keywords", message: `검색어는 최대 ${SHORTS_SEARCH_LIMITS.maxKeywordsPerSession}개까지 추가할 수 있습니다.` },
      { status: 422 }
    );
  }

  const { data: inserted, error } = await ctx.admin
    .from("shorts_sourcing_keywords")
    .insert({ session_id: sessionId, keyword, is_ai_generated: false, is_selected: true })
    .select("id, keyword, is_ai_generated, is_selected")
    .single();

  if (error || !inserted) {
    return NextResponse.json({ error: "server_error" }, { status: 500 });
  }

  return NextResponse.json({ ok: true, keyword: inserted });
}
