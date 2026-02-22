import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import PlaceholderClient from "../../_components/placeholder-client";

export const dynamic = 'force-dynamic';

export default async function ProductivitySummaryPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/auth/login?next=/kr/workspace/productivity/summary");
  }

  return (
    <PlaceholderClient
      title="문서 요약"
      description="문서 자동 요약 및 핵심 내용 추출 기능입니다."
      featureKey="summary"
    />
  );
}
