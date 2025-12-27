import { NextResponse } from "next/server";
import { supabaseServerClient } from "@/lib/supabase/server";

export async function GET() {
  const supabase = supabaseServerClient;

  // 우리가 사용하려는 tool slugs
  const requiredSlugs = [
    'opus-clip',
    'filmora',
    'chatgpt',
    'prowritingaid',
    'mubert',
    'slidesai',
    'fliki',
  ];

  const { data: tools } = await supabase
    .from('tools')
    .select('id, slug, name')
    .in('slug', requiredSlugs);

  const foundSlugs = new Set(tools?.map(t => t.slug) || []);
  const missingSlugs = requiredSlugs.filter(slug => !foundSlugs.has(slug));

  return NextResponse.json({
    required: requiredSlugs,
    found: tools,
    missing: missingSlugs,
    found_count: tools?.length || 0,
    missing_count: missingSlugs.length,
  });
}






