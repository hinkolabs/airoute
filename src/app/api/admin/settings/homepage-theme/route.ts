import { NextResponse } from "next/server";
import { requireAdminOrThrow } from "@/lib/admin-auth";
import { createAdminSupabase } from "@/lib/supabase/admin";
import { revalidateTag } from "next/cache";

const VALID_THEMES = ["default", "v2", "v2-simple"] as const;

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
    .eq("key", "homepage_theme")
    .single();

  if (error) {
    return NextResponse.json({
      ok: true,
      theme: "default",
      updated_at: null,
    });
  }

  return NextResponse.json({
    ok: true,
    theme: data.value || "default",
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
  const theme = body.theme as string | undefined;

  if (!theme || !VALID_THEMES.includes(theme as any)) {
    return NextResponse.json(
      { error: `theme must be one of: ${VALID_THEMES.join(", ")}` },
      { status: 400 },
    );
  }

  const sb = createAdminSupabase();
  const { error } = await sb.from("app_settings").upsert(
    { key: "homepage_theme", value: theme, updated_at: new Date().toISOString() },
    { onConflict: "key" },
  );

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  revalidateTag("homepage-theme", "max");

  return NextResponse.json({ ok: true, theme });
}
