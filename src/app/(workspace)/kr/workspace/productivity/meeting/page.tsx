import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import PlaceholderClient from "../../_components/placeholder-client";

export default async function ProductivityMeetingPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/auth/login?next=/kr/workspace/productivity/meeting");
  }

  return (
    <PlaceholderClient
      title="회의 비서"
      description="회의 녹음, 요약 및 액션 아이템 자동 추출 기능입니다."
      featureKey="meeting"
    />
  );
}
