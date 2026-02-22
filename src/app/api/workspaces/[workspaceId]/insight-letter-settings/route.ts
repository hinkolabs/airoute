import { NextRequest, NextResponse } from "next/server";
import { createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";

export const dynamic = "force-dynamic";

interface InsightLetterSettings {
  id?: string;
  workspace_id: string;
  industry: string;
  audience: string;
  region: string;
  offerings: string[];
  price_tier: string;
  primary_channels: string[];
  role: string;
  quarterly_goal: string;
  weekly_kpi: string;
  forbidden_claims: string[];
  seed_keywords: string[];
  competitor_urls: string[];
  created_at?: string;
  updated_at?: string;
}

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

async function verifyAdmin(supabase: any, userId: string, workspaceId: string): Promise<boolean> {
  const { data: membership, error } = await supabase
    .from("workspace_members")
    .select("role")
    .eq("workspace_id", workspaceId)
    .eq("user_id", userId)
    .single();

  if (error || !membership) {
    return false;
  }

  return membership.role === "owner" || membership.role === "admin";
}

// GET /api/workspaces/[workspaceId]/insight-letter-settings
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ workspaceId: string }> }
) {
  try {
    const { workspaceId } = await params;
    const supabase = await createSupabaseClient();
    
    // Auth check
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    
    if (authError || !user) {
      return NextResponse.json(
        { error: "인증되지 않았습니다" },
        { status: 401 }
      );
    }

    // Member check (any workspace member can read settings for overview)
    const { data: membership, error: membershipError } = await supabase
      .from("workspace_members")
      .select("role")
      .eq("workspace_id", workspaceId)
      .eq("user_id", user.id)
      .single();

    if (membershipError || !membership) {
      return NextResponse.json(
        { error: "워크스페이스 멤버가 아닙니다" },
        { status: 403 }
      );
    }

    // Fetch settings
    const { data: settings, error: fetchError } = await supabase
      .from("workspace_insight_letter_settings")
      .select("*")
      .eq("workspace_id", workspaceId)
      .maybeSingle();

    if (fetchError) {
      throw fetchError;
    }

    return NextResponse.json({ settings: settings || null });
  } catch (error: any) {
    console.error("[API] GET insight-letter-settings error:", error);
    return NextResponse.json(
      { error: "설정을 가져오는데 실패했습니다" },
      { status: 500 }
    );
  }
}

// POST /api/workspaces/[workspaceId]/insight-letter-settings
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ workspaceId: string }> }
) {
  try {
    const { workspaceId } = await params;
    const supabase = await createSupabaseClient();
    
    // Auth check
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    
    if (authError || !user) {
      return NextResponse.json(
        { error: "인증되지 않았습니다" },
        { status: 401 }
      );
    }

    // Admin check
    const isAdmin = await verifyAdmin(supabase, user.id, workspaceId);
    if (!isAdmin) {
      return NextResponse.json(
        { error: "관리자 권한이 필요합니다" },
        { status: 403 }
      );
    }

    // Parse body
    const body = await request.json();

    // Sanitize and validate arrays
    const sanitizeArray = (arr: any[], maxLength: number): string[] => {
      if (!Array.isArray(arr)) return [];
      return arr
        .filter((item) => typeof item === "string" && item.trim().length > 0)
        .map((item) => item.trim())
        .slice(0, maxLength);
    };

    const sanitizeString = (str: any): string => {
      return typeof str === "string" ? str.trim() : "";
    };

    const settingsData: Omit<InsightLetterSettings, "id" | "created_at" | "updated_at"> = {
      workspace_id: workspaceId,
      industry: sanitizeString(body.industry),
      audience: sanitizeString(body.audience),
      region: sanitizeString(body.region),
      offerings: sanitizeArray(body.offerings, 3),
      price_tier: sanitizeString(body.price_tier),
      primary_channels: sanitizeArray(body.primary_channels, 10),
      role: sanitizeString(body.role),
      quarterly_goal: sanitizeString(body.quarterly_goal),
      weekly_kpi: sanitizeString(body.weekly_kpi),
      forbidden_claims: sanitizeArray(body.forbidden_claims, 20),
      seed_keywords: sanitizeArray(body.seed_keywords, 10),
      competitor_urls: sanitizeArray(body.competitor_urls, 3),
    };

    // Upsert settings
    const { data: updatedSettings, error: upsertError } = await supabase
      .from("workspace_insight_letter_settings")
      .upsert(settingsData, { onConflict: "workspace_id" })
      .select()
      .single();

    if (upsertError) {
      throw upsertError;
    }

    return NextResponse.json({ settings: updatedSettings });
  } catch (error: any) {
    console.error("[API] POST insight-letter-settings error:", error);
    return NextResponse.json(
      { error: "설정을 저장하는데 실패했습니다" },
      { status: 500 }
    );
  }
}
