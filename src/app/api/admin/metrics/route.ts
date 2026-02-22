import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { createAdminSupabase } from "@/lib/supabase/admin";

export const dynamic = "force-dynamic";

// GET /api/admin/metrics?month=2026-01
// Returns monthly KPIs for system_admin dashboard
export async function GET(request: NextRequest) {
  try {
    const supabase = await createClient();

    // 1. Auth check
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json({ error: "unauthorized" }, { status: 401 });
    }

    // 2. system_admin check (REQUIRED)
    const { data: systemAdminRow } = await supabase
      .from("system_admins")
      .select("user_id")
      .eq("user_id", user.id)
      .maybeSingle();

    const isSystemAdmin = !!systemAdminRow;

    if (!isSystemAdmin) {
      return NextResponse.json(
        { error: "forbidden", message: "system_admin permission required" },
        { status: 403 }
      );
    }

    // 3. Parse month parameter (default: current month in Asia/Seoul)
    const searchParams = request.nextUrl.searchParams;
    const monthParam = searchParams.get("month");

    let targetMonth: string;
    if (monthParam) {
      // Validate YYYY-MM format
      if (!/^\d{4}-\d{2}$/.test(monthParam)) {
        return NextResponse.json(
          { error: "invalid month format, expected YYYY-MM" },
          { status: 400 }
        );
      }
      targetMonth = monthParam;
    } else {
      // Default to current month in Asia/Seoul
      const now = new Date();
      const seoulOffset = 9 * 60; // UTC+9
      const seoulTime = new Date(now.getTime() + seoulOffset * 60 * 1000);
      const year = seoulTime.getUTCFullYear();
      const month = String(seoulTime.getUTCMonth() + 1).padStart(2, "0");
      targetMonth = `${year}-${month}`;
    }

    // Calculate date range for the target month
    const [year, month] = targetMonth.split("-");
    const startDate = `${year}-${month}-01T00:00:00Z`;
    const nextMonth = new Date(parseInt(year), parseInt(month), 1);
    const endDate = nextMonth.toISOString().slice(0, 10) + "T00:00:00Z";

    // Use admin client for cross-workspace queries
    const adminSupabase = createAdminSupabase();

    // ========================================
    // KPI 1: 이번달 회원가입자 수 (auth.users 조회)
    // ========================================
    // Note: We need to use admin client to query auth.users
    // Supabase Admin API for auth: supabase.auth.admin.listUsers()
    // For simplicity, we'll count workspace_members creation as proxy for signups
    // since we don't have direct access to auth.users created_at easily via SQL
    
    // Alternative: Use workspace_members table as signup proxy
    // Better: Try to query auth schema if accessible, else fallback to workspace_members
    
    let signupsCount = 0;
    try {
      // Try to count distinct user_ids created in workspace_members during the month
      // This is a proxy - ideally we'd query auth.users but RLS might block
      const { count: signupsRaw, error: signupsError } = await adminSupabase
        .from("workspace_members")
        .select("user_id", { count: "exact", head: true })
        .gte("created_at", startDate)
        .lt("created_at", endDate);

      if (signupsError) {
        console.error("[Metrics] Failed to count signups:", signupsError);
      } else {
        signupsCount = signupsRaw ?? 0;
      }
    } catch (e) {
      console.error("[Metrics] Signups query error:", e);
    }

    // ========================================
    // KPI 2: 이번달 유료결제 수 (Starter / Pro 각각)
    // ========================================
    // Define: workspace_subscriptions created during month with status=active
    const { data: subscriptionsData, error: subscriptionsError } =
      await adminSupabase
        .from("workspace_subscriptions")
        .select("plan_key")
        .eq("status", "active")
        .gte("created_at", startDate)
        .lt("created_at", endDate);

    let starterCount = 0;
    let proCount = 0;

    if (subscriptionsError) {
      console.error("[Metrics] Failed to fetch subscriptions:", subscriptionsError);
    } else if (subscriptionsData) {
      subscriptionsData.forEach((sub) => {
        const planKey = (sub.plan_key ?? "").toLowerCase();
        if (planKey.includes("starter")) {
          starterCount++;
        } else if (planKey.includes("pro")) {
          proCount++;
        }
      });
    }

    // ========================================
    // KPI 3: 자동 포스팅 성공/실패 수 (event_logs 기반)
    // ========================================
    let autopostingSuccess = 0;
    let autopostingFail = 0;

    // Count success events
    const { count: successCount, error: successError } = await adminSupabase
      .from("event_logs")
      .select("*", { count: "exact", head: true })
      .eq("event_type", "autoposting_success")
      .gte("created_at", startDate)
      .lt("created_at", endDate);

    if (!successError) {
      autopostingSuccess = successCount ?? 0;
    } else {
      console.error("[Metrics] Failed to count autoposting_success:", successError);
    }

    // Count fail events
    const { count: failCount, error: failError } = await adminSupabase
      .from("event_logs")
      .select("*", { count: "exact", head: true })
      .eq("event_type", "autoposting_fail")
      .gte("created_at", startDate)
      .lt("created_at", endDate);

    if (!failError) {
      autopostingFail = failCount ?? 0;
    } else {
      console.error("[Metrics] Failed to count autoposting_fail:", failError);
    }

    // ========================================
    // KPI 4: 크레딧 충전/사용 합계
    // ========================================
    const { data: creditsData, error: creditsError } = await adminSupabase
      .from("credit_ledger")
      .select("delta")
      .gte("created_at", startDate)
      .lt("created_at", endDate);

    let topupSum = 0;
    let consumeSum = 0;

    if (creditsError) {
      console.error("[Metrics] Failed to fetch credit_ledger:", creditsError);
    } else if (creditsData) {
      creditsData.forEach((row: any) => {
        const delta = row.delta ?? 0;
        if (delta > 0) {
          topupSum += delta;
        } else if (delta < 0) {
          consumeSum += Math.abs(delta);
        }
      });
    }

    // ========================================
    // Recent Activity: 최근 20개
    // ========================================
    // Recent subscriptions (최근 10개)
    const { data: recentSubscriptions } = await adminSupabase
      .from("workspace_subscriptions")
      .select("id, workspace_id, plan_key, status, created_at")
      .order("created_at", { ascending: false })
      .limit(10);

    // Recent credits (최근 10개)
    const { data: recentCredits } = await adminSupabase
      .from("credit_ledger")
      .select("id, workspace_id, user_id, action_type, delta, created_at")
      .order("created_at", { ascending: false })
      .limit(10);

    // Recent auto-posting events (event_logs 기반)
    const { data: recentAutoposting } = await adminSupabase
      .from("event_logs")
      .select("id, event_type, metadata, created_at")
      .in("event_type", ["autoposting_success", "autoposting_fail"])
      .order("created_at", { ascending: false })
      .limit(10);

    // ========================================
    // Response
    // ========================================
    return NextResponse.json({
      month: targetMonth,
      signups: signupsCount,
      paid: {
        starter: starterCount,
        pro: proCount,
      },
      autoposting: {
        success: autopostingSuccess,
        fail: autopostingFail,
        source: "event_logs",
      },
      credits: {
        topup: topupSum,
        consume: consumeSum,
      },
      recent: {
        subscriptions: recentSubscriptions ?? [],
        credits: recentCredits ?? [],
        autoposting: recentAutoposting ?? [],
      },
    });
  } catch (error: any) {
    console.error("[API] GET /api/admin/metrics error:", {
      message: error?.message,
      stack: error?.stack,
    });
    return NextResponse.json(
      { error: "internal_server_error" },
      { status: 500 }
    );
  }
}
