import { NextResponse } from "next/server";
import { checkAdminAuth } from "@/lib/admin/check-admin-auth";

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY!;

const SQL = `
-- Fix guides_uniq_automation_key: lang 포함하여 재생성
-- EN + KR 가이드가 같은 route/intent로 공존할 수 있도록 수정

ALTER TABLE public.guides DROP CONSTRAINT IF EXISTS guides_uniq_automation_key;
DROP INDEX IF EXISTS guides_uniq_automation_key;

CREATE UNIQUE INDEX guides_uniq_automation_key
ON public.guides (
  lang,
  guide_type,
  COALESCE(primary_intent,  ''),
  COALESCE(primary_route,   ''),
  COALESCE(cta_type,        ''),
  COALESCE(cta_route_slug,  ''),
  COALESCE(cta_tool_slug,   '')
);
`.trim();

export async function POST() {
  const auth = await checkAdminAuth();
  if (!auth.ok) {
    return NextResponse.json({ ok: false, error: auth.error }, { status: auth.status });
  }

  // Project ref is extracted from the URL (e.g. https://xxxx.supabase.co → xxxx)
  const projectRef = SUPABASE_URL.replace("https://", "").split(".")[0];

  // Attempt via Supabase Management API (requires SUPABASE_ACCESS_TOKEN env)
  const accessToken = process.env.SUPABASE_ACCESS_TOKEN;
  if (accessToken) {
    const res = await fetch(`https://api.supabase.com/v1/projects/${projectRef}/database/query`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${accessToken}`,
      },
      body: JSON.stringify({ query: SQL }),
    });

    if (res.ok) {
      const data = await res.json();
      return NextResponse.json({ ok: true, method: "management-api", result: data });
    }
    const errText = await res.text();
    console.error("[fix-guides-constraint] Management API error:", errText);
  }

  // Fallback: return the SQL so admin can run it manually
  return NextResponse.json({
    ok: false,
    manual_required: true,
    message: "SUPABASE_ACCESS_TOKEN 환경변수가 없어 수동 실행이 필요합니다.",
    sql: SQL,
    dashboard_url: `https://supabase.com/dashboard/project/${projectRef}/sql/new`,
  });
}

export async function GET() {
  const auth = await checkAdminAuth();
  if (!auth.ok) {
    return NextResponse.json({ ok: false, error: auth.error }, { status: auth.status });
  }

  const projectRef = SUPABASE_URL.replace("https://", "").split(".")[0];

  return NextResponse.json({
    sql: SQL,
    dashboard_url: `https://supabase.com/dashboard/project/${projectRef}/sql/new`,
    instructions: [
      "1. dashboard_url로 이동",
      "2. sql 내용을 붙여넣기",
      "3. Run 클릭",
    ],
  });
}
