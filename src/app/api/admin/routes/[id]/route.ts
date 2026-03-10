import { NextResponse } from "next/server";
import { createAdminSupabase } from "@/lib/supabase/admin";

export async function GET(
  _req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const supabase = createAdminSupabase();
    const { id } = await params;

    const { data, error } = await supabase
      .from("routes")
      .select(
        `*, routes_i18n(locale, title, description, guide_bullets),
         route_tools(id, tool_id, position, is_best3, step_title, step_why, step_cta_label, step_prompt_example, step_input_type, created_at)`
      )
      .eq("id", id)
      .single();

    if (error || !data) {
      return NextResponse.json(
        { ok: false, error: error?.message || "Not found" },
        { status: 404 }
      );
    }

    // Sort route_tools by position
    if (data.route_tools) {
      (data.route_tools as any[]).sort(
        (a: any, b: any) => (a.position ?? 999) - (b.position ?? 999)
      );
    }

    // Fetch all tools for the tool selector dropdown
    const { data: allTools } = await supabase
      .from("tools")
      .select("id, name, slug")
      .order("name", { ascending: true });

    return NextResponse.json({
      ok: true,
      route: data,
      allTools: allTools || [],
    });
  } catch (e: unknown) {
    const message = e instanceof Error ? e.message : "Unknown error";
    return NextResponse.json({ ok: false, error: message }, { status: 500 });
  }
}

export async function PUT(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const supabase = createAdminSupabase();
    const { id } = await params;
    const body = await req.json();

    // 1) Update route fields
    const updateData: Record<string, unknown> = {};
    const allowedFields = [
      "title",
      "slug",
      "description",
      "icon",
      "featured",
      "tags",
      "guide_bullets",
      "manual_order",
      "status",
    ];

    for (const field of allowedFields) {
      if (body[field] !== undefined) {
        updateData[field] = body[field];
      }
    }

    updateData.updated_at = new Date().toISOString();

    const { data, error } = await supabase
      .from("routes")
      .update(updateData)
      .eq("id", id)
      .select("id, title, slug")
      .single();

    if (error) {
      return NextResponse.json(
        { ok: false, error: error.message },
        { status: 500 }
      );
    }

    // 2) Sync route_tools if provided
    if (Array.isArray(body.route_tools)) {
      const incoming = body.route_tools as Array<{
        id?: string;
        tool_id: string | null;
        position: number;
        is_best3: boolean;
        step_title: string | null;
        step_why: string | null;
        step_cta_label: string | null;
        step_prompt_example: string | null;
        step_input_type: string | null;
        _delete?: boolean;
      }>;

      // Delete flagged items
      const toDelete = incoming.filter((rt) => rt._delete && rt.id);
      for (const rt of toDelete) {
        await supabase
          .from("route_tools_i18n")
          .delete()
          .eq("route_tool_id", rt.id!);
        await supabase.from("route_tools").delete().eq("id", rt.id!);
      }

      // Upsert remaining
      const toUpsert = incoming.filter((rt) => !rt._delete);
      for (const rt of toUpsert) {
        const payload = {
          route_id: id,
          tool_id: rt.tool_id || null,
          position: rt.position,
          is_best3: rt.is_best3 ?? false,
          step_title: rt.step_title || null,
          step_why: rt.step_why || null,
          step_cta_label: rt.step_cta_label || null,
          step_prompt_example: rt.step_prompt_example || null,
          step_input_type: rt.step_input_type || null,
        };

        if (rt.id) {
          await supabase
            .from("route_tools")
            .update(payload)
            .eq("id", rt.id);
        } else {
          await supabase.from("route_tools").insert({
            ...payload,
            created_at: new Date().toISOString(),
          });
        }
      }
    }

    return NextResponse.json({ ok: true, route: data });
  } catch (e: unknown) {
    const message = e instanceof Error ? e.message : "Unknown error";
    return NextResponse.json({ ok: false, error: message }, { status: 500 });
  }
}

const FK_FIX_SQL = [
  "-- Drop both possible FK constraint names",
  "ALTER TABLE public.guides DROP CONSTRAINT IF EXISTS guides_route_slug_fkey;",
  "ALTER TABLE public.guides DROP CONSTRAINT IF EXISTS guides_cta_route_slug_fkey;",
  "",
  "-- Recreate with ON DELETE SET NULL",
  "ALTER TABLE public.guides ADD CONSTRAINT guides_cta_route_slug_fkey",
  "  FOREIGN KEY (cta_route_slug) REFERENCES public.routes(slug) ON DELETE SET NULL;",
].join("\n");

export async function DELETE(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const supabase = createAdminSupabase();
    const { id } = await params;
    const hard = new URL(req.url).searchParams.get("hard") === "true";

    const { data: routeRow } = await supabase
      .from("routes")
      .select("slug, status")
      .eq("id", id)
      .single();

    if (!routeRow) {
      return NextResponse.json(
        { ok: false, code: "NOT_FOUND", message: "Route not found" },
        { status: 404 }
      );
    }

    const slug = routeRow.slug;

    // ── Soft Delete (default) ──
    if (!hard) {
      const { error: softErr } = await supabase
        .from("routes")
        .update({ status: "inactive", updated_at: new Date().toISOString() })
        .eq("id", id);

      if (softErr) {
        return NextResponse.json(
          { ok: false, code: "SOFT_FAIL", message: softErr.message },
          { status: 500 }
        );
      }

      return NextResponse.json({ ok: true, mode: "soft", slug, newStatus: "inactive" });
    }

    // ── Hard Delete (hard=true) ──

    // Check guide FK references first
    const { count: guideCount } = await supabase
      .from("guides")
      .select("id", { count: "exact", head: true })
      .eq("cta_route_slug", slug)
      .neq("status", "rejected");

    if (guideCount && guideCount > 0) {
      return NextResponse.json(
        {
          ok: false,
          code: "FK_BLOCKED",
          message: `Route "${slug}" is referenced by ${guideCount} guide(s). Use soft delete or fix the FK constraint first.`,
          guideCount,
          sqlFix: FK_FIX_SQL,
        },
        { status: 409 }
      );
    }

    // Cascade-delete child rows
    await supabase.from("routes_i18n").delete().eq("route_id", id);

    const { data: routeTools } = await supabase
      .from("route_tools")
      .select("id")
      .eq("route_id", id);

    if (routeTools && routeTools.length > 0) {
      const rtIds = routeTools.map((rt) => rt.id);
      await supabase.from("route_tools_i18n").delete().in("route_tool_id", rtIds);
    }

    await supabase.from("route_tools").delete().eq("route_id", id);

    const { error: delErr } = await supabase.from("routes").delete().eq("id", id);

    if (delErr) {
      if (delErr.message.includes("foreign key")) {
        return NextResponse.json(
          {
            ok: false,
            code: "FK_BLOCKED",
            message: `Hard delete failed due to FK constraint: ${delErr.message}`,
            sqlFix: FK_FIX_SQL,
          },
          { status: 409 }
        );
      }
      return NextResponse.json(
        { ok: false, code: "DELETE_FAIL", message: delErr.message },
        { status: 500 }
      );
    }

    return NextResponse.json({ ok: true, mode: "hard", slug });
  } catch (e: unknown) {
    const message = e instanceof Error ? e.message : "Unknown error";
    return NextResponse.json({ ok: false, code: "INTERNAL", message }, { status: 500 });
  }
}
