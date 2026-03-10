import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { getDemoMode } from "@/lib/flags";

export async function GET(req: NextRequest) {
  if (await getDemoMode()) {
    return new NextResponse(null, { status: 404 });
  }
  
  const { searchParams } = new URL(req.url);
  const workspaceId = searchParams.get("workspace_id");

  if (!workspaceId) {
    return NextResponse.json({ error: "workspace_id is required" }, { status: 400 });
  }

  try {
    const supabase = await createClient();
    const { data: { user }, error: authError } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Verify user is a member of this workspace
    const { data: membership, error: membershipError } = await supabase
      .from("workspace_members")
      .select("role")
      .eq("workspace_id", workspaceId)
      .eq("user_id", user.id)
      .single();

    if (membershipError || !membership) {
      return NextResponse.json({ error: "Not a member of this workspace" }, { status: 403 });
    }

    // Fetch manager settings
    const { data: settings, error: settingsError } = await supabase
      .from("workspace_manager_settings")
      .select("*")
      .eq("workspace_id", workspaceId)
      .maybeSingle();

    if (settingsError) {
      console.error("Error fetching manager settings:", settingsError);
      return NextResponse.json({ error: "Failed to fetch settings" }, { status: 500 });
    }

    return NextResponse.json({ settings: settings || null });
  } catch (error) {
    console.error("Error in GET /api/workspace/manager-settings:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  if (await getDemoMode()) {
    return new NextResponse(null, { status: 404 });
  }
  
  try {
    const supabase = await createClient();
    const { data: { user }, error: authError } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await req.json();
    const { workspace_id, brand_name, logo_url, company_profile, company_role, attachments } = body;

    if (!workspace_id) {
      return NextResponse.json({ error: "workspace_id is required" }, { status: 400 });
    }

    // Verify user has permission (owner/admin or personal workspace)
    const { data: membership, error: membershipError } = await supabase
      .from("workspace_members")
      .select("role, workspaces!inner(type)")
      .eq("workspace_id", workspace_id)
      .eq("user_id", user.id)
      .single();

    if (membershipError || !membership) {
      return NextResponse.json({ error: "Not a member of this workspace" }, { status: 403 });
    }

    const workspaceType = (membership as any).workspaces?.type;
    const isPersonalWorkspace = workspaceType === "personal";
    const isAdmin = membership.role === "owner" || membership.role === "admin";

    if (!isPersonalWorkspace && !isAdmin) {
      return NextResponse.json({ error: "Only owners/admins can edit settings" }, { status: 403 });
    }

    // Upsert manager settings
    const { data: settings, error: upsertError } = await supabase
      .from("workspace_manager_settings")
      .upsert({
        workspace_id,
        brand_name: brand_name || null,
        logo_url: logo_url || null,
        company_profile: company_profile || null,
        company_role: company_role || null,
        attachments: attachments || [],
        updated_by: user.id,
        updated_at: new Date().toISOString(),
      })
      .select()
      .single();

    if (upsertError) {
      console.error("Error upserting manager settings:", upsertError);
      return NextResponse.json({ error: "Failed to save settings" }, { status: 500 });
    }

    return NextResponse.json({ settings });
  } catch (error) {
    console.error("Error in POST /api/workspace/manager-settings:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
