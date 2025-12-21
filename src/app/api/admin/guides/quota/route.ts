import { NextResponse } from "next/server";
import { createAdminSupabase } from "@/lib/supabase/admin";
import { requireAdminOrThrow } from "@/lib/admin-auth";

// =====================================================
// Daily generation quota check (KST-based)
// =====================================================

const FREE_DAILY_LIMIT = 2;

function getKSTDayStart(): string {
  const now = new Date();
  const kstOffset = 9 * 60 * 60 * 1000;
  const kstNow = new Date(now.getTime() + kstOffset);
  const kstDayStart = new Date(kstNow.toISOString().slice(0, 10) + "T00:00:00.000Z");
  return new Date(kstDayStart.getTime() - kstOffset).toISOString();
}

function getKSTDayEnd(): string {
  const now = new Date();
  const kstOffset = 9 * 60 * 60 * 1000;
  const kstNow = new Date(now.getTime() + kstOffset);
  const kstDayEnd = new Date(kstNow.toISOString().slice(0, 10) + "T23:59:59.999Z");
  return new Date(kstDayEnd.getTime() - kstOffset).toISOString();
}

export async function GET() {
  try {
    await requireAdminOrThrow();
  } catch {
    return NextResponse.json(
      { ok: false, error: "Unauthorized" },
      { status: 401 }
    );
  }

  try {
    const supabase = createAdminSupabase();

    // Count today's free (auto) generations - KST based
    const { data: todayLogs, error } = await supabase
      .from("admin_guide_generation_logs")
      .select("id")
      .eq("mode", "auto")
      .gte("created_at", getKSTDayStart())
      .lt("created_at", getKSTDayEnd());

    if (error) {
      return NextResponse.json(
        { ok: false, error: error.message },
        { status: 500 }
      );
    }

    const usedToday = todayLogs?.length || 0;
    const remainingToday = Math.max(0, FREE_DAILY_LIMIT - usedToday);

    const kstStartIso = getKSTDayStart();
    const kstEndIso = getKSTDayEnd();
    const nowIso = new Date().toISOString();

    const response: {
      ok: boolean;
      usedToday: number;
      limit: number;
      remainingToday: number;
      debug?: {
        kstStartIso: string;
        kstEndIso: string;
        usedToday: number;
        nowIso: string;
      };
    } = {
      ok: true,
      usedToday,
      limit: FREE_DAILY_LIMIT,
      remainingToday,
    };

    if (process.env.NODE_ENV !== "production") {
      response.debug = {
        kstStartIso,
        kstEndIso,
        usedToday,
        nowIso,
      };
    }

    return NextResponse.json(response);
  } catch (e: unknown) {
    const message = e instanceof Error ? e.message : "Unknown error";
    return NextResponse.json({ ok: false, error: message }, { status: 500 });
  }
}

