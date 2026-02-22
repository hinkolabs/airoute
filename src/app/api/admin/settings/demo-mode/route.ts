import { NextResponse } from "next/server";
import { requireAdminOrThrow } from "@/lib/admin-auth";
import { createAdminSupabase } from "@/lib/supabase/admin";
import { revalidateTag } from "next/cache";

export async function GET() {
  try {
    await requireAdminOrThrow();
  } catch {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const sb = createAdminSupabase();
  const { data, error } = await sb
    .from("app_settings")
    .select("value, updated_at")
    .eq("key", "demo_mode")
    .single();

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({
    ok: true,
    demo_mode: data.value === "true",
    updated_at: data.updated_at,
  });
}

export async function POST(req: Request) {
  try {
    await requireAdminOrThrow();
  } catch {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const body = await req.json().catch(() => ({}));
  const enabled = typeof body.enabled === "boolean" ? body.enabled : undefined;

  if (enabled === undefined) {
    return NextResponse.json(
      { error: "Body must include { enabled: boolean }" },
      { status: 400 },
    );
  }

  const sb = createAdminSupabase();
  const { error } = await sb
    .from("app_settings")
    .update({ value: String(enabled), updated_at: new Date().toISOString() })
    .eq("key", "demo_mode");

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  revalidateTag("demo-mode", "max");

  return NextResponse.json({ ok: true, demo_mode: enabled });
}
