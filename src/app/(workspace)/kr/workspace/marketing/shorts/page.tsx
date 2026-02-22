import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import PlaceholderClient from "../../_components/placeholder-client";

export default async function MarketingShortsPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/auth/login?next=/kr/workspace/marketing/shorts");
  }

  return (
    <PlaceholderClient
      title="숏폼 제작"
      description="AI 기반 숏폼 비디오 자동 제작 기능입니다."
      featureKey="shorts"
    />
  );
}
