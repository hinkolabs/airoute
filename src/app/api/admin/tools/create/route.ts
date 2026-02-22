import { NextResponse } from "next/server";
import { createAdminSupabase } from "@/lib/supabase/admin";

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const {
      name,
      slug,
      description,
      category_id,
      url,
      affiliate_url,
      badge,
      tags,
      is_active,
    } = body;

    // Validation
    if (!name || !name.trim()) {
      return NextResponse.json(
        { ok: false, error: "Tool name is required" },
        { status: 400 }
      );
    }

    const supabase = createAdminSupabase();

    // Generate slug if not provided
    const toolSlug =
      slug?.trim() ||
      name
        .toLowerCase()
        .replace(/[^a-z0-9]+/g, "-")
        .replace(/^-|-$/g, "");

    // Check if slug already exists
    const { data: existing } = await supabase
      .from("tools")
      .select("id")
      .eq("slug", toolSlug)
      .single();

    if (existing) {
      return NextResponse.json(
        { ok: false, error: `Tool with slug "${toolSlug}" already exists` },
        { status: 400 }
      );
    }

    // Create tool
    const { data, error } = await supabase
      .from("tools")
      .insert({
        name: name.trim(),
        slug: toolSlug,
        description: description?.trim() || null,
        category_id: category_id || null,
        url: url?.trim() || null,
        affiliate_url: affiliate_url?.trim() || null,
        badge: badge || null,
        tags: tags || [],
        is_active: body.is_active === true,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      })
      .select("id, name, slug")
      .single();

    if (error) {
      console.error("[create] Error creating tool:", error);
      return NextResponse.json(
        { ok: false, error: error.message },
        { status: 500 }
      );
    }

    console.log("[create] Tool created:", data);
    return NextResponse.json(
      { ok: true, tool: data },
      { status: 200 }
    );
  } catch (e: unknown) {
    const message = e instanceof Error ? e.message : "Unknown error";
    console.error("[create] Exception:", e);
    return NextResponse.json({ ok: false, error: message }, { status: 500 });
  }
}
