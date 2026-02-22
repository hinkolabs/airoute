import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { createAdminSupabase } from "@/lib/supabase/admin";
import { getDemoMode } from "@/lib/flags";

export const dynamic = "force-dynamic";

// GET /api/coupons/redemptions?workspace_id=xxx&limit=50&cursor=xxx
// Returns coupon redemption history for the current user (or all for system_admin)
export async function GET(request: NextRequest) {
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

    // 2) Parse query params
    const searchParams = request.nextUrl.searchParams;
    const workspaceId = searchParams.get("workspace_id");
    const limitParam = searchParams.get("limit");
    const cursor = searchParams.get("cursor"); // ISO timestamp
    const filterUserId = searchParams.get("user_id"); // admin only

    if (!workspaceId) {
      return NextResponse.json(
        { ok: false, code: "MISSING_WORKSPACE_ID", message: "workspace_id는 필수입니다" },
        { status: 400 }
      );
    }

    // 3) Parse limit
    let limit = 50;
    if (limitParam) {
      const parsedLimit = parseInt(limitParam, 10);
      if (isNaN(parsedLimit) || parsedLimit < 1) {
        return NextResponse.json(
          { ok: false, code: "INVALID_LIMIT", message: "limit은 양수여야 합니다" },
          { status: 400 }
        );
      }
      limit = Math.min(parsedLimit, 200);
    }

    // 4) Check system_admin status
    const { data: systemAdminRow } = await supabase
      .from("system_admins")
      .select("user_id")
      .eq("user_id", user.id)
      .maybeSingle();

    const isSystemAdmin = !!systemAdminRow;

    // 5) If not system_admin, check workspace membership
    if (!isSystemAdmin) {
      const { data: membershipRow } = await supabase
        .from("workspace_members")
        .select("role")
        .eq("workspace_id", workspaceId)
        .eq("user_id", user.id)
        .limit(1)
        .maybeSingle();

      if (!membershipRow) {
        return NextResponse.json(
          { ok: false, code: "NOT_A_MEMBER", message: "워크스페이스 멤버가 아닙니다" },
          { status: 403 }
        );
      }
    }

    // 6) Use admin client for reading
    const adminSupabase = createAdminSupabase();

    // 7) Build query
    let query = adminSupabase
      .from("coupon_redemptions")
      .select("id, coupon_id, code, workspace_id, redeemed_by, redeemed_at, metadata")
      .eq("workspace_id", workspaceId)
      .order("redeemed_at", { ascending: false })
      .limit(limit);

    // 8) Privacy: Regular users can only see their own redemptions
    if (!isSystemAdmin) {
      query = query.eq("redeemed_by", user.id);
    } else if (filterUserId) {
      // System admin can filter by user_id
      query = query.eq("redeemed_by", filterUserId);
    }

    // 9) Apply cursor pagination
    if (cursor) {
      query = query.lt("redeemed_at", cursor);
    }

    const { data: redemptions, error: redemptionsError } = await query;

    if (redemptionsError) {
      console.error("[API] Failed to fetch coupon_redemptions:", redemptionsError);
      return NextResponse.json(
        { ok: false, code: "FETCH_FAILED", message: "쿠폰 내역 조회 실패" },
        { status: 500 }
      );
    }

    // 10) Determine next cursor
    const nextCursor = redemptions && redemptions.length > 0
      ? redemptions[redemptions.length - 1].redeemed_at
      : null;

    return NextResponse.json({
      ok: true,
      workspace_id: workspaceId,
      items: redemptions || [],
      next_cursor: nextCursor,
      has_more: redemptions && redemptions.length === limit,
    });
  } catch (error: any) {
    console.error("[API] GET /api/coupons/redemptions error:", {
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
