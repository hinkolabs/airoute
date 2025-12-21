import { NextResponse } from "next/server";
import { createAdminSupabase } from "@/lib/supabase/admin";

// POST: Publish Now (긴급 발행 - KST 기준 하루 2개 제한)
export async function POST(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const supabase = createAdminSupabase();
    const { id } = await params;
    
    // Check daily limit (KST timezone)
    const { data: logs } = await supabase
      .from("admin_guide_publish_logs")
      .select("id")
      .eq("publish_mode", "manual")
      .gte("published_at", getKSTDayStart())
      .lt("published_at", getKSTDayEnd());
    
    const todayCount = logs?.length || 0;

    if (todayCount >= 2) {
      return NextResponse.json(
        { ok: false, error: "오늘 긴급 발행 한도(2개)를 초과했습니다." },
        { status: 429 }
      );
    }

    // Approve and publish
    const { data, error } = await supabase
      .from("guides")
      .update({
        status: "approved",
        published_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      })
      .eq("id", id)
      .select()
      .single();

    if (error) {
      return NextResponse.json({ ok: false, error: error.message }, { status: 500 });
    }

    // Log the manual publish
    await supabase.from("admin_guide_publish_logs").insert({
      guide_id: id,
      publish_mode: "manual",
      note: "Published via Publish Now (긴급 발행)",
    });

    return NextResponse.json({ 
      ok: true, 
      guide: data,
      remainingToday: 2 - todayCount - 1,
    });
  } catch (e: unknown) {
    const message = e instanceof Error ? e.message : "unknown error";
    return NextResponse.json({ ok: false, error: message }, { status: 500 });
  }
}

// Helper: Get KST day start (00:00:00 KST in UTC)
function getKSTDayStart(): string {
  const now = new Date();
  // KST is UTC+9
  const kstOffset = 9 * 60 * 60 * 1000;
  const kstNow = new Date(now.getTime() + kstOffset);
  const kstDayStart = new Date(kstNow.toISOString().slice(0, 10) + "T00:00:00.000Z");
  // Convert back to UTC
  return new Date(kstDayStart.getTime() - kstOffset).toISOString();
}

// Helper: Get KST day end (23:59:59.999 KST in UTC)  
function getKSTDayEnd(): string {
  const now = new Date();
  const kstOffset = 9 * 60 * 60 * 1000;
  const kstNow = new Date(now.getTime() + kstOffset);
  const kstDayEnd = new Date(kstNow.toISOString().slice(0, 10) + "T23:59:59.999Z");
  return new Date(kstDayEnd.getTime() - kstOffset).toISOString();
}
