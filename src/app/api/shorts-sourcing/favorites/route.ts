import { NextRequest, NextResponse } from "next/server";
import { requireUser, resolveWorkspaceId, requireSourceItemAccess, isErrorResponse } from "@/lib/shorts-sourcing/api-guard";

export const dynamic = "force-dynamic";

// GET /api/shorts-sourcing/favorites?workspace_id=... (workspace_id optional in admin-key mode)
// Lists all favorited candidates for a workspace ("소싱함"), newest first.
export async function GET(request: NextRequest) {
  const ctx = await requireUser();
  if (isErrorResponse(ctx)) return ctx;

  const requestedWorkspaceId = new URL(request.url).searchParams.get("workspace_id");
  const resolved = await resolveWorkspaceId(ctx, requestedWorkspaceId);
  if (isErrorResponse(resolved)) return resolved;
  const { workspaceId } = resolved;

  const { data: favorites, error } = await ctx.admin
    .from("shorts_favorites")
    .select(
      "id, note, usage_status, created_at, source_item:shorts_source_items(id, session_id, platform, canonical_url, title, author_name, thumbnail_url, like_count, comment_count, duration_seconds, session:shorts_sourcing_sessions(product_name_ko))"
    )
    .eq("workspace_id", workspaceId)
    .order("created_at", { ascending: false });

  if (error) {
    console.error("[shorts-sourcing/favorites] GET failed:", error.message);
    return NextResponse.json({ error: "server_error" }, { status: 500 });
  }

  return NextResponse.json({ ok: true, favorites: favorites ?? [] });
}

// POST /api/shorts-sourcing/favorites
// Body: { source_item_id, note? }
export async function POST(request: NextRequest) {
  const ctx = await requireUser();
  if (isErrorResponse(ctx)) return ctx;

  const body = await request.json().catch(() => ({}));
  const sourceItemId = body.source_item_id as string | undefined;
  if (!sourceItemId) {
    return NextResponse.json({ error: "source_item_id is required" }, { status: 400 });
  }

  const access = await requireSourceItemAccess(ctx, sourceItemId);
  if (isErrorResponse(access)) return access;

  const { data: favorite, error } = await ctx.admin
    .from("shorts_favorites")
    .upsert(
      {
        source_item_id: sourceItemId,
        workspace_id: access.workspaceId,
        note: typeof body.note === "string" ? body.note : null,
        created_by: ctx.userId,
      },
      { onConflict: "source_item_id" }
    )
    .select("id, usage_status, note")
    .single();

  if (error || !favorite) {
    console.error("[shorts-sourcing/favorites] POST failed:", error?.message);
    return NextResponse.json({ error: "server_error" }, { status: 500 });
  }

  return NextResponse.json({ ok: true, favorite });
}
