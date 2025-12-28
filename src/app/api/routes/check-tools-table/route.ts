import { NextResponse } from "next/server";
import { supabaseServerClient } from "@/lib/supabase/server";

export async function GET() {
  const supabase = supabaseServerClient;

  // 1) Count all tools
  const { count, error: countError } = await supabase
    .from('tools')
    .select('*', { count: 'exact', head: true });

  // 2) Get all tools
  const { data: allTools, error: toolsError } = await supabase
    .from('tools')
    .select('id, slug, name')
    .limit(100);

  return NextResponse.json({
    total_count: count,
    count_error: countError?.message,
    all_tools: allTools,
    tools_error: toolsError?.message,
  });
}








