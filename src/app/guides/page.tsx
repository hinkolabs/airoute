"use client";

import { PageShell } from "@/app/_design/components/page";
import { useTheme } from "@/app/_design/providers/theme-provider";
import { cn } from "@/lib/utils";
import { FileText } from "lucide-react";

export default function GuidesPage() {
  const { theme } = useTheme();

  return (
    <PageShell>
      <div className="mx-auto max-w-3xl px-4 py-16 text-center">
        {/* Header */}
        <div className="mb-10">
          <div className="mb-4 flex justify-center">
            <div className="rounded-full bg-emerald-500/10 p-4">
              <FileText className={cn(
                "h-8 w-8",
                theme === "day" ? "text-emerald-600" : "text-emerald-400"
              )} />
            </div>
          </div>
          <h1 className="text-2xl font-bold sm:text-3xl">
            Guides & Articles
          </h1>
          <p className={cn(
            "mt-3 text-sm sm:text-base",
            theme === "day" ? "text-slate-600" : "text-slate-400"
          )}>
            AI 트렌드, 툴 리뷰, 사용 가이드 아티클을 모아둘 예정입니다.
          </p>
        </div>

        {/* Placeholder Cards */}
        <div className="space-y-4">
          {[1, 2, 3].map((i) => (
            <div
              key={i}
              className={cn(
                "flex h-24 items-center justify-center rounded-2xl border border-dashed text-sm",
                theme === "day"
                  ? "border-slate-300 bg-slate-100/50 text-slate-500"
                  : "border-slate-700/70 bg-slate-900/30 text-slate-500"
              )}
            >
              Guide {i} — Coming soon...
            </div>
          ))}
        </div>

        {/* Footer note */}
        <p className={cn(
          "mt-10 text-xs",
          theme === "day" ? "text-slate-500" : "text-slate-500"
        )}>
          💡 이 페이지는 현재 개발 중입니다. 곧 AI 관련 유용한 콘텐츠로 채워질 예정이에요!
        </p>
      </div>
    </PageShell>
  );
}


