import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import PlaceholderClient from "../../_components/placeholder-client";

export default async function AdvisoryVerdictPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/auth/login?next=/kr/workspace/advisory/verdict");
  }

  return (
    <PlaceholderClient
      title="AI 판정단"
      description="다양한 관점에서 AI 의견 수렴 및 판정 기능입니다."
      featureKey="verdict"
    />
  );
}
