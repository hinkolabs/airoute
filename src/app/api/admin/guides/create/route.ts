import { NextResponse } from "next/server";
import { createAdminSupabase } from "@/lib/supabase/admin";
import { normalizeGuideCta } from "@/lib/guides/payload-normalizer";

const VALID_CATEGORIES = ['Image & Design', 'Writing', 'Video', 'Audio', 'Voice', 'Coding'];

export async function POST(req: Request) {
  try {
    const supabase = createAdminSupabase();
    
    // Parse body and normalize camelCase to snake_case
    const body = await req.json().catch(() => ({}));
    let guideType = body.guideType || body.guide_type || "route_based";
    let routeSlug = body.routeSlug || body.route_slug || null;
    let toolSlug = body.toolSlug || body.tool_slug || null;
    
    // Normalize guide_type
    if (!['route_based', 'tool_based', 'theme'].includes(guideType)) {
      guideType = 'route_based';
    }

    const slug = `draft-${Date.now()}`;
    
    // AUTO-PICK LOGIC (BEFORE validation)
    if (guideType === 'route_based' && !routeSlug) {
      const { data: fallbackRoute } = await supabase
        .from('routes')
        .select('slug')
        .in('status', ['published', 'active'])
        .order('updated_at', { ascending: false, nullsFirst: false })
        .limit(1)
        .single();
      
      if (!fallbackRoute) {
        return NextResponse.json(
          { ok: false, error: "No routes available for route_based guide" },
          { status: 400 }
        );
      }
      routeSlug = fallbackRoute.slug;
    }
    
    if (guideType === 'tool_based' && !toolSlug) {
      const { data: fallbackTool } = await supabase
        .from('tools')
        .select('id')
        .in('status', ['published', 'active'])
        .order('updated_at', { ascending: false, nullsFirst: false })
        .limit(1)
        .single();
      
      if (!fallbackTool) {
        return NextResponse.json(
          { ok: false, error: "No tools available for tool_based guide" },
          { status: 400 }
        );
      }
      toolSlug = fallbackTool.id;
    }

    // Build normalized payload
    let payload: any = {
      slug,
      title: "",
      excerpt: "",
      content: "",
      status: "draft",
      lang: "en",
      taxonomy: "general",
      published_source: "manual",
      guide_type: guideType,
      cta_partner: null,
      primary_intent: null,
      updated_at: new Date().toISOString(),
    };

    // Enforce CTA integrity
    const cta = normalizeGuideCta({
      guide_type: guideType,
      route_slug: routeSlug,
      tool_slug: toolSlug,
    });

    if (guideType === 'route_based') {
      payload.route_slug = cta.cta_route_slug;
      payload.primary_route = cta.cta_route_slug;
      payload.tool_slug = null;
      payload.category = null;
      console.log('[create] route_based payload:', { cta_route_slug: cta.cta_route_slug });
    } else if (guideType === 'tool_based') {
      payload.route_slug = null;
      payload.primary_route = null;
      payload.tool_slug = cta.cta_tool_slug;
      payload.category = null;
      console.log('[create] tool_based payload:', { cta_tool_slug: cta.cta_tool_slug });
    } else {
      // theme
      payload.route_slug = null;
      payload.tool_slug = null;
      payload.primary_route = null;
      payload.category = 'Writing';
      console.log('[create] theme payload:', { category: payload.category });
    }

    payload.cta_type = cta.cta_type;
    payload.cta_route_slug = cta.cta_route_slug;
    payload.cta_tool_slug = cta.cta_tool_slug;
    
    console.log('[create] Starting with guideType:', guideType, 'routeSlug:', routeSlug, 'toolSlug:', toolSlug);
    
    const { data, error } = await supabase
      .from("guides")
      .insert(payload)
      .select("id")
      .single();

    if (error) {
      console.error("Guide creation error:", error);
      console.error("Failed payload:", JSON.stringify(payload, null, 2));
      return NextResponse.json({ ok: false, error: error.message }, { status: 500 });
    }

    console.log('[create] Success! Guide ID:', data?.id);
    return NextResponse.json({ ok: true, id: data?.id }, { status: 200 });
  } catch (e: unknown) {
    const message = e instanceof Error ? e.message : "Unknown error";
    console.error("Guide creation exception:", e);
    return NextResponse.json(
      { ok: false, error: message },
      { status: 500 }
    );
  }
}
