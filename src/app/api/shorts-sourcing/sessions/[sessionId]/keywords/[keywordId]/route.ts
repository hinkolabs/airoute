import { NextRequest, NextResponse } from "next/server";
import { getDemoMode } from "@/lib/flags";
import { requireUser, requireSessionAccess, isErrorResponse } from "@/lib/shorts-sourcing/api-guard";

export const dynamic = "force-dynamic";

// PATCH /api/shorts-sourcing/sessions/:sessionId/keywords/:keywordId
// Body: { is_selected: boolean }
export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ sessionId: string; keywordId: string }> }
) {
  if (await getDemoMode()) return new NextResponse(null, { status: 404 });

  const ctx = await requireUser();
  if (isErrorResponse(ctx)) return ctx;
  const { sessionId, keywordId } = await params;

  const access = await requireSessionAccess(ctx, sessionId);
  if (isErrorResponse(access)) return access;

  const body = await request.json().catch(() => ({}));
  if (typeof body.is_selected !== "boolean") {
    return NextResponse.json({ error: "is_selected must be boolean" }, { status: 400 });
  }

  const { error } = await ctx.admin
    .from("shorts_sourcing_keywords")
    .update({ is_selected: body.is_selected })
    .eq("id", keywordId)
    .eq("session_id", sessionId);

  if (error) {
    return NextResponse.json({ error: "server_error" }, { status: 500 });
  }

  return NextResponse.json({ ok: true });
}

// DELETE /api/shorts-sourcing/sessions/:sessionId/keywords/:keywordId
export async function DELETE(
  _request: NextRequest,
  { params }: { params: Promise<{ sessionId: string; keywordId: string }> }
) {
  if (await getDemoMode()) return new NextResponse(null, { status: 404 });

  const ctx = await requireUser();
  if (isErrorResponse(ctx)) return ctx;
  const { sessionId, keywordId } = await params;

  const access = await requireSessionAccess(ctx, sessionId);
  if (isErrorResponse(access)) return access;

  const { error } = await ctx.admin
    .from("shorts_sourcing_keywords")
    .delete()
    .eq("id", keywordId)
    .eq("session_id", sessionId);

  if (error) {
    return NextResponse.json({ error: "server_error" }, { status: 500 });
  }

  return NextResponse.json({ ok: true });
}
