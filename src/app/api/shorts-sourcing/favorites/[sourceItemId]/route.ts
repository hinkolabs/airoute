import { NextRequest, NextResponse } from "next/server";
import { getDemoMode } from "@/lib/flags";
import { requireUser, requireSourceItemAccess, isErrorResponse } from "@/lib/shorts-sourcing/api-guard";

export const dynamic = "force-dynamic";

// PATCH /api/shorts-sourcing/favorites/:sourceItemId
// Body: { usage_status?, note? }
export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ sourceItemId: string }> }
) {
  if (await getDemoMode()) return new NextResponse(null, { status: 404 });

  const ctx = await requireUser();
  if (isErrorResponse(ctx)) return ctx;
  const { sourceItemId } = await params;

  const access = await requireSourceItemAccess(ctx, sourceItemId);
  if (isErrorResponse(access)) return access;

  const body = await request.json().catch(() => ({}));
  const update: Record<string, unknown> = {};

  if (typeof body.note === "string" || body.note === null) update.note = body.note;
  if (["unreviewed", "approved", "rejected"].includes(body.usage_status)) update.usage_status = body.usage_status;

  if (Object.keys(update).length === 0) {
    return NextResponse.json({ error: "nothing_to_update" }, { status: 400 });
  }

  const { error } = await ctx.admin
    .from("shorts_favorites")
    .update(update)
    .eq("source_item_id", sourceItemId);

  if (error) {
    return NextResponse.json({ error: "server_error" }, { status: 500 });
  }

  return NextResponse.json({ ok: true });
}

// DELETE /api/shorts-sourcing/favorites/:sourceItemId — un-favorite (찜 해제)
export async function DELETE(
  _request: NextRequest,
  { params }: { params: Promise<{ sourceItemId: string }> }
) {
  if (await getDemoMode()) return new NextResponse(null, { status: 404 });

  const ctx = await requireUser();
  if (isErrorResponse(ctx)) return ctx;
  const { sourceItemId } = await params;

  const access = await requireSourceItemAccess(ctx, sourceItemId);
  if (isErrorResponse(access)) return access;

  const { error } = await ctx.admin.from("shorts_favorites").delete().eq("source_item_id", sourceItemId);

  if (error) {
    return NextResponse.json({ error: "server_error" }, { status: 500 });
  }

  return NextResponse.json({ ok: true });
}
