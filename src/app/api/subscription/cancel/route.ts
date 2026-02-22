import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { createAdminSupabase } from "@/lib/supabase/admin";
import { getDemoMode } from "@/lib/flags";

export const dynamic = "force-dynamic";

// POST /api/subscription/cancel
// Body: { workspace_id: string }
// Sets current_period_end = now() to immediately cancel subscription
export async function POST(request: NextRequest) {
  if (await getDemoMode()) {
    return new NextResponse(null, { status: 404 });
  }
  
  try {
    const supabase = await createClient();

    // 1) Auth check
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json(
        { ok: false, code: "UNAUTHORIZED", message: "로그인이 필요합니다" },
        { status: 401 }
      );
    }

    // 2) Parse body
    const body = await request.json();
    const { workspace_id } = body;

    if (!workspace_id) {
      return NextResponse.json(
        { ok: false, code: "MISSING_WORKSPACE_ID", message: "workspace_id는 필수입니다" },
        { status: 400 }
      );
    }

    // 3) Check system_admin status
    const { data: systemAdminRow } = await supabase
      .from("system_admins")
      .select("user_id")
      .eq("user_id", user.id)
      .maybeSingle();

    const isSystemAdmin = !!systemAdminRow;

    // 4) Check workspace membership and role
    if (!isSystemAdmin) {
      const { data: membershipRow } = await supabase
        .from("workspace_members")
        .select("role")
        .eq("workspace_id", workspace_id)
        .eq("user_id", user.id)
        .limit(1)
        .maybeSingle();

      if (!membershipRow) {
        return NextResponse.json(
          { ok: false, code: "NOT_A_MEMBER", message: "워크스페이스 멤버가 아닙니다" },
          { status: 403 }
        );
      }

      if (membershipRow.role !== "owner" && membershipRow.role !== "admin") {
        return NextResponse.json(
          { ok: false, code: "FORBIDDEN", message: "owner 또는 admin만 구독을 취소할 수 있습니다" },
          { status: 403 }
        );
      }
    }

    // 5) Use admin client for write
    const adminSupabase = createAdminSupabase();

    // 6) Get current subscription
    const { data: subRow } = await adminSupabase
      .from("workspace_subscriptions")
      .select("*")
      .eq("workspace_id", workspace_id)
      .limit(1)
      .maybeSingle();

    if (!subRow) {
      return NextResponse.json(
        { ok: false, code: "NO_SUBSCRIPTION", message: "활성화된 구독이 없습니다" },
        { status: 404 }
      );
    }

    // 7) Update current_period_end to now() (immediate cancellation)
    const now = new Date().toISOString();
    const { error: updateError } = await adminSupabase
      .from("workspace_subscriptions")
      .update({ current_period_end: now })
      .eq("workspace_id", workspace_id);

    if (updateError) {
      console.error("[Subscription Cancel] Failed to update subscription:", updateError);
      return NextResponse.json(
        { ok: false, code: "UPDATE_FAILED", message: "구독 취소에 실패했습니다" },
        { status: 500 }
      );
    }

    // Note: In the future, if stripe_subscription_id exists, call Stripe API to cancel
    // For now, we only update the DB

    return NextResponse.json({
      ok: true,
      message: "구독이 취소되었습니다",
      cancelled_at: now,
    });
  } catch (error: any) {
    console.error("[API] POST /api/subscription/cancel error:", {
      message: error?.message,
      details: error?.details,
      hint: error?.hint,
      code: error?.code,
    });
    return NextResponse.json(
      { ok: false, code: "INTERNAL_ERROR", message: "서버 오류가 발생했습니다" },
      { status: 500 }
    );
  }
}
