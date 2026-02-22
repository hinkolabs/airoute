import { NextResponse } from "next/server";
import { createAdminSupabase } from "@/lib/supabase/admin";

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { title, slug, description, icon, featured, tags, guide_bullets, manual_order } = body;

    if (!title || !title.trim()) {
      return NextResponse.json(
        { ok: false, error: "Route title is required" },
        { status: 400 }
      );
    }

    const supabase = createAdminSupabase();

    const routeSlug =
      slug?.trim() ||
      title
        .toLowerCase()
        .replace(/[^a-z0-9]+/g, "-")
        .replace(/^-|-$/g, "");

    const { data: existing } = await supabase
      .from("routes")
      .select("id")
      .eq("slug", routeSlug)
      .single();

    if (existing) {
      return NextResponse.json(
        { ok: false, error: `Route with slug "${routeSlug}" already exists` },
        { status: 400 }
      );
    }

    const { data, error } = await supabase
      .from("routes")
      .insert({
        title: title.trim(),
        slug: routeSlug,
        description: description?.trim() || null,
        icon: icon?.trim() || null,
        featured: featured === true,
        tags: tags || [],
        guide_bullets: guide_bullets || [],
        manual_order: manual_order ?? null,
        status: "active",
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      })
      .select("id, title, slug")
      .single();

    if (error) {
      return NextResponse.json(
        { ok: false, error: error.message },
        { status: 500 }
      );
    }

    return NextResponse.json({ ok: true, route: data });
  } catch (e: unknown) {
    const message = e instanceof Error ? e.message : "Unknown error";
    return NextResponse.json({ ok: false, error: message }, { status: 500 });
  }
}
