import { NextRequest, NextResponse } from "next/server";
import { requireUser, requireProductMatchAccess, isErrorResponse } from "@/lib/shorts-sourcing/api-guard";
import { generateKeywordsFromMatch } from "@/lib/shorts-sourcing/generate-keywords-from-match";

export const dynamic = "force-dynamic";
export const maxDuration = 30;

// PATCH /api/shorts-sourcing/matches/:matchId
// Body: { is_selected: boolean }
// Selecting a match (is_selected: true) is a single-select action: every other
// match in the session is deselected, and search keywords are regenerated from
// this match's real 1688 title/description/tags (existing vision-generated
// keywords are kept but deselected, not deleted, so the admin can still revert).
export async function PATCH(request: NextRequest, { params }: { params: Promise<{ matchId: string }> }) {
  const ctx = await requireUser();
  if (isErrorResponse(ctx)) return ctx;
  const { matchId } = await params;

  const access = await requireProductMatchAccess(ctx, matchId);
  if (isErrorResponse(access)) return access;
  const { sessionId } = access;

  const body = await request.json().catch(() => ({}));
  if (typeof body.is_selected !== "boolean") {
    return NextResponse.json({ error: "is_selected must be boolean" }, { status: 400 });
  }

  if (!body.is_selected) {
    const { error } = await ctx.admin
      .from("shorts_product_matches")
      .update({ is_selected: false })
      .eq("id", matchId);
    if (error) return NextResponse.json({ error: "server_error" }, { status: 500 });
    return NextResponse.json({ ok: true });
  }

  const { data: match, error: fetchError } = await ctx.admin
    .from("shorts_product_matches")
    .select("id, title, description, tags")
    .eq("id", matchId)
    .single();

  if (fetchError || !match) {
    return NextResponse.json({ error: "match_not_found" }, { status: 404 });
  }

  // Single-select: deselect every other match in this session first.
  await ctx.admin.from("shorts_product_matches").update({ is_selected: false }).eq("session_id", sessionId);
  const { error: selectError } = await ctx.admin
    .from("shorts_product_matches")
    .update({ is_selected: true })
    .eq("id", matchId);

  if (selectError) {
    return NextResponse.json({ error: "server_error" }, { status: 500 });
  }

  const generatedKeywords = await generateKeywordsFromMatch({
    title: match.title,
    description: match.description,
    tags: Array.isArray(match.tags) ? (match.tags as string[]) : [],
  });

  if (generatedKeywords.length > 0) {
    // Keep the earlier vision-guess keywords around (deselected) rather than
    // deleting them, in case the admin wants to revert or add them back.
    await ctx.admin
      .from("shorts_sourcing_keywords")
      .update({ is_selected: false })
      .eq("session_id", sessionId);

    await ctx.admin.from("shorts_sourcing_keywords").insert(
      generatedKeywords.map((keyword) => ({
        session_id: sessionId,
        keyword,
        is_ai_generated: true,
        is_selected: true,
      }))
    );
  }

  const { data: keywords } = await ctx.admin
    .from("shorts_sourcing_keywords")
    .select("id, keyword, is_ai_generated, is_selected")
    .eq("session_id", sessionId)
    .order("created_at", { ascending: true });

  return NextResponse.json({ ok: true, keywords: keywords ?? [] });
}
