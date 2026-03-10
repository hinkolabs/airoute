import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { getDemoMode } from "@/lib/flags";

export const dynamic = "force-dynamic";

// GET /api/autoposting/items?workspace_id=xxx
// Returns last 15 monthly_items for the workspace (status: ready or used)
export async function GET(request: NextRequest) {
  if (await getDemoMode()) {
    return new NextResponse(null, { status: 404 });
  }

  try {
    const supabase = await createClient();

    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json({ error: "unauthorized" }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const workspace_id = searchParams.get("workspace_id");

    if (!workspace_id) {
      return NextResponse.json(
        { error: "workspace_id is required" },
        { status: 400 }
      );
    }

    // Verify membership (RLS also enforces this, but explicit check gives clearer error)
    const { data: membershipRow } = await supabase
      .from("workspace_members")
      .select("role")
      .eq("workspace_id", workspace_id)
      .eq("user_id", user.id)
      .limit(1)
      .maybeSingle();

    if (!membershipRow) {
      return NextResponse.json({ error: "not_a_member" }, { status: 403 });
    }

    const { data: items, error } = await supabase
      .from("monthly_items")
      .select("id, topic, blog_content, sns_content, image_urls, generated_at, status")
      .eq("workspace_id", workspace_id)
      .in("status", ["ready", "used"])
      .order("created_at", { ascending: false })
      .limit(15);

    if (error) {
      console.error("[API] GET /api/autoposting/items error:", error.message);
      return NextResponse.json({ error: "db_error" }, { status: 500 });
    }

    return NextResponse.json({ ok: true, items: items ?? [] });
  } catch (error: any) {
    console.error("[API] GET /api/autoposting/items error:", error?.message);
    return NextResponse.json(
      { error: "internal_server_error" },
      { status: 500 }
    );
  }
}
