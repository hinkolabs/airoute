import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import PlaceholderClient from "../../_components/placeholder-client";

export const dynamic = 'force-dynamic';

export default async function MarketingSnapPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/auth/login?next=/kr/workspace/marketing/snap");
  }

  return (
    <PlaceholderClient
      title="스냅(Snap)"
      description="이미지 자동 생성 및 편집 기능입니다."
      featureKey="snap"
    />
  );
}
