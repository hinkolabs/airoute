import { NextRequest, NextResponse } from "next/server";
import { createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";
import { getDemoMode } from "@/lib/flags";

// Force dynamic rendering to avoid caching auth state
export const dynamic = "force-dynamic";

type SubscriptionPlanKey = "starter" | "pro";
type SubscriptionBillingCycle = "monthly" | "yearly";
type SubscriptionStatus = "active" | "cancelled" | "past_due";

interface WorkspaceSubscription {
  workspace_id: string;
  plan_key: SubscriptionPlanKey;
  billing_cycle: SubscriptionBillingCycle;
  status: SubscriptionStatus;
  seat_count: number;
  created_at?: string;
  updated_at?: string;
}

// Helper to create Supabase client with cookies
async function createSupabaseClient() {
  const cookieStore = await cookies();
  
  return createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return cookieStore.getAll();
        },
        setAll(cookiesToSet) {
          try {
            cookiesToSet.forEach(({ name, value, options }) =>
              cookieStore.set(name, value, options)
            );
          } catch {
            // Ignore errors in Route Handlers
          }
        },
      },
    }
  );
}

// GET /api/workspace/subscription?workspace_id=xxx
export async function GET(request: NextRequest) {
  if (await getDemoMode()) {
    return new NextResponse(null, { status: 404 });
  }
  
  try {
    const supabase = await createSupabaseClient();
    
    // Auth check
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    
    if (authError || !user) {
      return NextResponse.json(
        { error: "인증되지 않았습니다" },
        { status: 401 }
      );
    }

    // Get workspace_id from query
    const searchParams = request.nextUrl.searchParams;
    const workspaceId = searchParams.get("workspace_id");
    
    if (!workspaceId) {
      return NextResponse.json(
        { error: "workspace_id가 필요합니다" },
        { status: 400 }
      );
    }

    // Verify user has access to this workspace
    const { data: membership, error: membershipError } = await supabase
      .from("workspace_members")
      .select("workspace_id")
      .eq("workspace_id", workspaceId)
      .eq("user_id", user.id)
      .single();

    if (membershipError || !membership) {
      return NextResponse.json(
        { error: "워크스페이스에 접근 권한이 없습니다" },
        { status: 403 }
      );
    }

    // Fetch subscription (latest row)
    const { data: subscription, error: subscriptionError } = await supabase
      .from("workspace_subscriptions")
      .select("workspace_id, plan_key, billing_cycle, status, seat_count, current_period_end, updated_at")
      .eq("workspace_id", workspaceId)
      .order("updated_at", { ascending: false })
      .limit(1)
      .maybeSingle();

    if (subscriptionError) {
      // No subscription found is OK (null state)
      if (subscriptionError.code === "PGRST116") {
        return NextResponse.json({ subscription: null });
      }
      throw subscriptionError;
    }

    // No subscription row found
    if (!subscription) {
      return NextResponse.json({ subscription: null });
    }

    return NextResponse.json({ subscription });
  } catch (error: any) {
    console.error("[API] GET /api/workspace/subscription error:", {
      message: error?.message,
      details: error?.details,
      hint: error?.hint,
      code: error?.code,
      json: (() => { try { return JSON.stringify(error); } catch { return "[unstringifiable]"; } })(),
    });
    return NextResponse.json(
      { error: "구독 정보를 가져오는데 실패했습니다" },
      { status: 500 }
    );
  }
}

// POST /api/workspace/subscription
export async function POST(request: NextRequest) {
  try {
    const supabase = await createSupabaseClient();
    
    // Auth check
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    
    if (authError || !user) {
      return NextResponse.json(
        { error: "인증되지 않았습니다" },
        { status: 401 }
      );
    }

    // Parse body
    const body = await request.json();
    const { workspace_id, plan_key, billing_cycle } = body;

    // Validate inputs
    if (!workspace_id || typeof workspace_id !== "string") {
      return NextResponse.json(
        { error: "workspace_id가 필요합니다" },
        { status: 400 }
      );
    }

    if (!plan_key || !["starter", "pro"].includes(plan_key)) {
      return NextResponse.json(
        { error: "plan_key는 'starter' 또는 'pro'여야 합니다" },
        { status: 400 }
      );
    }

    if (!billing_cycle || !["monthly", "yearly"].includes(billing_cycle)) {
      return NextResponse.json(
        { error: "billing_cycle은 'monthly' 또는 'yearly'여야 합니다" },
        { status: 400 }
      );
    }

    // Verify user has access to this workspace
    const { data: membership, error: membershipError } = await supabase
      .from("workspace_members")
      .select("workspace_id, role")
      .eq("workspace_id", workspace_id)
      .eq("user_id", user.id)
      .single();

    if (membershipError || !membership) {
      return NextResponse.json(
        { error: "워크스페이스에 접근 권한이 없습니다" },
        { status: 403 }
      );
    }

    // Upsert subscription
    const subscriptionData: WorkspaceSubscription = {
      workspace_id,
      plan_key: plan_key as SubscriptionPlanKey,
      billing_cycle: billing_cycle as SubscriptionBillingCycle,
      status: "active",
      seat_count: 1,
    };

    const { error: upsertError } = await supabase
      .from("workspace_subscriptions")
      .upsert(subscriptionData, { onConflict: "workspace_id" });

    if (upsertError) {
      throw upsertError;
    }

    return NextResponse.json({ ok: true });
  } catch (error) {
    console.error("[API] POST /api/workspace/subscription error:", error);
    return NextResponse.json(
      { error: "구독 정보를 저장하는데 실패했습니다" },
      { status: 500 }
    );
  }
}
