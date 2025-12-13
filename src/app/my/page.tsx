"use client";

import Link from "next/link";
import { PageShell } from "@/app/_design/components/page";
import { useTheme } from "@/app/_design/providers/theme-provider";
import { ComingSoonBanner } from "./_components/coming-soon-banner";
import { cn } from "@/lib/utils";
import { User, Bookmark, History, LogIn } from "lucide-react";

export default function MyPage() {
  const { theme } = useTheme();

  return (
    <PageShell>
      <div className="mx-auto max-w-md px-4 py-16 text-center">
        {/* Coming Soon Banner */}
        <ComingSoonBanner />
        {/* Icon */}
        <div className="mb-6 flex justify-center">
          <div className="rounded-full bg-emerald-500/10 p-5">
            <User className={cn(
              "h-10 w-10",
              theme === "day" ? "text-emerald-600" : "text-emerald-400"
            )} />
          </div>
        </div>

        {/* Header */}
        <h1 className="text-2xl font-bold sm:text-3xl">
          My Airoute
        </h1>
        <p className={cn(
          "mt-3 text-sm sm:text-base",
          theme === "day" ? "text-slate-600" : "text-slate-400"
        )}>
          로그인 후 나만의 도구 모음, 북마크, 히스토리가 여기에 표시될 예정입니다.
        </p>

        {/* Feature Preview */}
        <div className={cn(
          "mt-8 flex justify-center gap-6",
          theme === "day" ? "text-slate-400" : "text-slate-500"
        )}>
          <div className="flex flex-col items-center gap-1">
            <Bookmark className="h-5 w-5" />
            <span className="text-xs">Saved</span>
          </div>
          <div className="flex flex-col items-center gap-1">
            <History className="h-5 w-5" />
            <span className="text-xs">History</span>
          </div>
        </div>

        {/* Sign In Button */}
        <div className="mt-10">
          <Link
            href="/my?comingSoon=1"
            className="inline-flex items-center gap-2 rounded-xl bg-emerald-500 px-6 py-3 text-sm font-semibold text-slate-900 transition hover:bg-emerald-400"
          >
            <LogIn className="h-4 w-4" />
            Sign in / Sign up
          </Link>
        </div>

        {/* Footer note */}
        <p className={cn(
          "mt-8 text-xs",
          theme === "day" ? "text-slate-500" : "text-slate-500"
        )}>
          아직 계정이 없으신가요? 로그인 후 AI 도구를 저장하고 관리할 수 있어요.
        </p>
      </div>
    </PageShell>
  );
}

