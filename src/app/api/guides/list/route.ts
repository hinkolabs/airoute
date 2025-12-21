// src/app/api/guides/list/route.ts
// GET URL format examples:
//   /api/guides/list?limit=10
//   /api/guides/list?q=video&type=route_based&limit=10
//   /api/guides/list?q=writing&taxonomy=content-writing&cursorCreatedAt=2025-01-01T00:00:00.000Z&cursorId=123
import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

// Public endpoint: use anon + RLS only. Never service role.
const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
  { auth: { persistSession: false } }
);

function clampLimit(n: number) {
  if (!Number.isFinite(n)) return 10;
  return Math.min(20, Math.max(1, n));
}

export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url);

    const limit = clampLimit(Number(searchParams.get("limit") ?? "10"));
    const cursorCreatedAt = searchParams.get("cursorCreatedAt");
    const cursorId = searchParams.get("cursorId");

    // Query params: q (search), type (guide_type), taxonomy
    const q = searchParams.get("q")?.trim() ?? "";
    const type = (searchParams.get("type") ?? "all").toLowerCase();
    const taxonomy = searchParams.get("taxonomy")?.trim() || null;

    // Default to EN for public pages (can be extended later with lang param)
    const lang = searchParams.get("lang") || "en";
    const statusFilter = "approved";
    const langFilter = lang;

    let query = supabase
      .from("guides")
      .select("id,slug,title,excerpt,guide_type,primary_intent,created_at,cta_tool_slug,cta_route_slug")
      .eq("status", statusFilter) // Only show approved guides
      .eq("lang", langFilter); // Filter by language

    // Apply type filter (guide_type)
    if (type !== "all" && (type === "route_based" || type === "tool_based" || type === "safety")) {
      query = query.eq("guide_type", type);
    }

    // Apply taxonomy filter
    if (taxonomy) {
      query = query.eq("taxonomy", taxonomy);
    }

    // Apply search filter (title OR excerpt OR primary_intent OR cta_tool_slug OR cta_route_slug ILIKE)
    if (q && q.trim().length >= 2) {
      query = query.or(
        [
          `title.ilike.%${q}%`,
          `excerpt.ilike.%${q}%`,
          `primary_intent.ilike.%${q}%`,
          `cta_tool_slug.ilike.%${q}%`,
          `cta_route_slug.ilike.%${q}%`
        ].join(",")
      );
    }

    // Ordering
    query = query.order("created_at", { ascending: false }).order("id", { ascending: false });

    // Keyset cursor: (created_at < cursorCreatedAt) OR (created_at = cursorCreatedAt AND id < cursorId)
    if (cursorCreatedAt && cursorId) {
      // NOTE: created_at is timestamp. cursorCreatedAt must be ISO string.
      query = query.or(
        `created_at.lt.${cursorCreatedAt},and(created_at.eq.${cursorCreatedAt},id.lt.${cursorId})`
      );
    }

    query = query.limit(limit);

    const { data, error } = await query;
    
    if (error) {
      console.error("[api/guides/list] Supabase query error:", error.message);
      return NextResponse.json(
        { ok: false, error: "Failed to load guides", items: [], nextCursor: null },
        { status: 500 }
      );
    }

    const items = data ?? [];
    const last = items.length ? items[items.length - 1] : null;

    const nextCursor =
      items.length === limit && last
        ? { createdAt: last.created_at, id: last.id }
        : null;

    const response: {
      ok: boolean;
      items: typeof items;
      nextCursor: typeof nextCursor;
      debug?: {
        statusFilter: string;
        langFilter: string;
        limit: number;
        q?: string;
        type?: string;
        taxonomy?: string;
      };
    } = {
      ok: true,
      items,
      nextCursor,
    };

    // Add debug field only in development
    if (process.env.NODE_ENV !== "production") {
      response.debug = {
        statusFilter,
        langFilter,
        limit,
        ...(q && { q }),
        ...(type && { type }),
        ...(taxonomy && { taxonomy }),
      };
    }

    return NextResponse.json(response, { status: 200 });
  } catch (e: unknown) {
    const message = e instanceof Error ? e.message : "Unknown error";
    console.error("[api/guides/list] Server error:", message);
    return NextResponse.json(
      { ok: false, error: "Failed to load guides", items: [], nextCursor: null },
      { status: 500 }
    );
  }
}

