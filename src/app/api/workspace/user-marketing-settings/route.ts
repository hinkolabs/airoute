import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

/**
 * GET /api/workspace/user-marketing-settings
 * Returns the current user's marketing settings for the given workspace
 * Query params: workspace_id (required)
 */
export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const workspaceId = searchParams.get("workspace_id");

  if (!workspaceId) {
    return NextResponse.json({ ok: false, error: "workspace_id is required" }, { status: 400 });
  }

  try {
    const supabase = await createClient();
    const { data: { user }, error: authError } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json({ ok: false, error: "Unauthorized" }, { status: 401 });
    }

    // Verify user is a member of this workspace
    const { data: membership, error: membershipError } = await supabase
      .from("workspace_members")
      .select("role")
      .eq("workspace_id", workspaceId)
      .eq("user_id", user.id)
      .single();

    if (membershipError || !membership) {
      return NextResponse.json({ ok: false, error: "Not a member of this workspace" }, { status: 403 });
    }

    // Fetch user's personal settings (RLS will enforce workspace membership)
    const { data: settings, error: settingsError } = await supabase
      .from("user_marketing_settings")
      .select("*")
      .eq("workspace_id", workspaceId)
      .eq("user_id", user.id)
      .maybeSingle();

    if (settingsError) {
      console.error("Error fetching user marketing settings:", settingsError);
      return NextResponse.json({ ok: false, error: "Failed to fetch settings" }, { status: 500 });
    }

    // Return null if no settings found (first time)
    return NextResponse.json({ ok: true, data: settings || null });
  } catch (error) {
    console.error("Error in GET /api/workspace/user-marketing-settings:", error);
    return NextResponse.json({ ok: false, error: "Internal server error" }, { status: 500 });
  }
}

/**
 * POST /api/workspace/user-marketing-settings
 * Upsert the current user's marketing settings for the given workspace
 * Body: { workspace_id, tone_preset, tone_example, personal_keywords, exclude_keywords, personal_notes }
 */
export async function POST(req: NextRequest) {
  try {
    const supabase = await createClient();
    const { data: { user }, error: authError } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json({ ok: false, error: "Unauthorized" }, { status: 401 });
    }

    const body = await req.json();
    const {
      workspace_id,
      tone_preset,
      tone_example,
      personal_keywords,
      exclude_keywords,
      personal_notes
    } = body;

    if (!workspace_id) {
      return NextResponse.json({ ok: false, error: "workspace_id is required" }, { status: 400 });
    }

    // Verify user is a member of this workspace
    const { data: membership, error: membershipError } = await supabase
      .from("workspace_members")
      .select("role")
      .eq("workspace_id", workspace_id)
      .eq("user_id", user.id)
      .single();

    if (membershipError || !membership) {
      return NextResponse.json({ ok: false, error: "Not a member of this workspace" }, { status: 403 });
    }

    // Upsert user marketing settings (RLS enforces user_id = auth.uid())
    const { data: settings, error: upsertError } = await supabase
      .from("user_marketing_settings")
      .upsert({
        workspace_id,
        user_id: user.id, // MUST be current user
        tone_preset: tone_preset || "practical",
        tone_example: tone_example || "",
        personal_keywords: personal_keywords || [],
        exclude_keywords: exclude_keywords || [],
        personal_notes: personal_notes || "",
      })
      .select()
      .single();

    if (upsertError) {
      console.error("Error upserting user marketing settings:", upsertError);
      return NextResponse.json({ ok: false, error: "Failed to save settings" }, { status: 500 });
    }

    return NextResponse.json({ ok: true, data: settings });
  } catch (error) {
    console.error("Error in POST /api/workspace/user-marketing-settings:", error);
    return NextResponse.json({ ok: false, error: "Internal server error" }, { status: 500 });
  }
}
