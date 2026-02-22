"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";

/**
 * This page has been moved to /kr/workspace/marketing/insights
 * Redirect users to the new location
 */
export default function KrWorkspaceMarketingInsightLetterPage() {
  const router = useRouter();

  useEffect(() => {
    router.replace("/kr/workspace/marketing/insights");
  }, [router]);

  return (
    <div className="px-4 py-8 md:px-6">
      <div className="mx-auto max-w-[900px]">
        <div className="rounded-lg border border-border bg-card p-8 text-center space-y-4">
          <h2 className="text-lg font-semibold">페이지 이동 중...</h2>
          <p className="text-sm text-muted-foreground">
            인사이트 레터 페이지로 이동합니다.
          </p>
        </div>
      </div>
    </div>
  );
}
