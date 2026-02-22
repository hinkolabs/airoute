import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { getDemoMode } from "@/lib/flags";

// Force dynamic rendering to avoid caching auth state
export const dynamic = "force-dynamic";

// GET /api/workspace/entitlement?workspace_id=xxx
export async function GET(request: NextRequest) {
  if (await getDemoMode()) {
    return new NextResponse(null, { status: 404 });
  }
  
  try {
    const supabase = await createClient();

    // Auth check
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json({ error: "unauthorized" }, { status: 401 });
    }

    // Get workspace_id from query
    const searchParams = request.nextUrl.searchParams;
    const workspaceId = searchParams.get("workspace_id");

    if (!workspaceId) {
      return NextResponse.json(
        { error: "workspace_id is required" },
        { status: 400 }
      );
    }

    // A) Check system_admin
    const { data: systemAdminRow } = await supabase
      .from("system_admins")
      .select("user_id")
      .eq("user_id", user.id)
      .limit(1)
      .maybeSingle();

    const isSystemAdmin = !!systemAdminRow;

    // B) Check workspace membership & role
    const { data: membershipRow } = await supabase
      .from("workspace_members")
      .select("role")
      .eq("workspace_id", workspaceId)
      .eq("user_id", user.id)
      .limit(1)
      .maybeSingle();

    const role = membershipRow?.role || null;

    // If not system_admin and not a member => 403
    if (!isSystemAdmin && !role) {
      return NextResponse.json({ error: "not_a_member" }, { status: 403 });
    }

    // D) Get workspace info
    const { data: workspaceRow, error: workspaceError } = await supabase
      .from("workspaces")
      .select("id, type, name")
      .eq("id", workspaceId)
      .limit(1)
      .single();

    if (workspaceError || !workspaceRow) {
      return NextResponse.json(
        { error: "workspace_not_found" },
        { status: 404 }
      );
    }

    // C) Get subscription
    const { data: subscriptionRow } = await supabase
      .from("workspace_subscriptions")
      .select("*")
      .eq("workspace_id", workspaceId)
      .limit(1)
      .maybeSingle();

    // Get plan if subscription exists
    let planRow = null;
    if (subscriptionRow?.plan_key) {
      const { data: plan } = await supabase
        .from("plans")
        .select("*")
        .eq("plan_key", subscriptionRow.plan_key)
        .limit(1)
        .maybeSingle();

      planRow = plan;
    }

    // Remove sensitive Stripe fields from subscription
    let cleanSubscription = null;
    if (subscriptionRow) {
      const { stripe_customer_id, stripe_subscription_id, ...rest } =
        subscriptionRow as any;
      cleanSubscription = rest;
    }

    // Capabilities
    const isPaidBySubscription =
      !!subscriptionRow && subscriptionRow.status === "active";

    const workspaceType = workspaceRow?.type;
    const isPaidForLock = workspaceType === 'company' ? true : !!isPaidBySubscription;

    const capabilities = {
      can_manage_billing:
        isSystemAdmin || role === "owner" || role === "admin",

      is_paid_by_subscription: isPaidBySubscription,

      is_paid: isSystemAdmin || isPaidBySubscription,

      is_paid_for_lock: isPaidForLock,
    };

    return NextResponse.json({
      workspace: {
        id: workspaceRow.id,
        type: workspaceRow.type,
        name: workspaceRow.name,
      },
      actor: {
        user_id: user.id,
        is_system_admin: isSystemAdmin,
        role,
      },
      subscription: cleanSubscription,
      plan: planRow,
      capabilities,
    });
  } catch (error: any) {
    console.error("[API] GET /api/workspace/entitlement error:", {
      message: error?.message,
      details: error?.details,
      hint: error?.hint,
      code: error?.code,
    });
    return NextResponse.json(
      { error: "internal_server_error" },
      { status: 500 }
    );
  }
}
