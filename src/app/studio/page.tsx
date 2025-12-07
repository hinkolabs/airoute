"use client";

import Link from "next/link";
import { useTheme } from "@/app/_design/providers/theme-provider";
import { cn } from "@/lib/utils";

// Temporary placeholder - will be replaced with real auth later
const isLoggedIn = false;

const studioTools = [
  { name: "Background Remover" },
  { name: "Image Upscale" },
  { name: "Image Restore" },
  { name: "Remove Objects" },
  { name: "Face Enhance" },
  { name: "Photo → Illustration" },
  { name: "Image Mix / Blend" },
  { name: "Text-to-Image Lite" },
  { name: "Color Fix / White Balance" },
  { name: "Compress Smart" },
];

export default function StudioPage() {
  const { theme } = useTheme();

  // Not logged in - show login CTA
  if (!isLoggedIn) {
    return (
      <div className="max-w-3xl mx-auto px-4 py-10 text-center">
        <h1
          className={cn(
            "text-3xl font-bold mb-4",
            theme === "day" ? "text-slate-900" : "text-slate-50"
          )}
        >
          AI Studio
        </h1>
        <p
          className={cn(
            "mb-8",
            theme === "day" ? "text-slate-600" : "text-slate-300"
          )}
        >
          로그인 후 AI Studio를 사용할 수 있습니다.
        </p>

        <Link
          href="/my"
          className="inline-flex items-center justify-center rounded-xl bg-emerald-500 px-5 py-3 text-white text-sm font-semibold shadow hover:bg-emerald-600 transition-colors"
        >
          로그인하러 가기
        </Link>
      </div>
    );
  }

  // Logged in - show Studio UI
  return (
    <>
      {/* Hero Block */}
      <div className="max-w-4xl mx-auto px-4 py-10">
        <h1
          className={cn(
            "text-3xl font-bold mb-2",
            theme === "day" ? "text-slate-900" : "text-slate-50"
          )}
        >
          AI Studio
        </h1>
        <p className={theme === "day" ? "text-slate-600" : "text-slate-300"}>
          Airoute의 내장 AI 기능을 한 곳에서 사용하세요.
        </p>
      </div>

      {/* Tools Grid */}
      <div className="max-w-5xl mx-auto px-4 grid gap-4 sm:grid-cols-2 lg:grid-cols-3 pb-20">
        {studioTools.map((tool) => (
          <div
            key={tool.name}
            className={cn(
              "rounded-xl border p-5 shadow-sm transition-colors",
              theme === "day"
                ? "bg-white border-slate-200"
                : "bg-slate-900 border-slate-800"
            )}
          >
            <h3
              className={cn(
                "font-semibold text-lg mb-3",
                theme === "day" ? "text-slate-900" : "text-slate-50"
              )}
            >
              {tool.name}
            </h3>

            <span
              className={cn(
                "inline-block mb-3 text-xs rounded-full px-2 py-1",
                theme === "day"
                  ? "bg-slate-200 text-slate-600"
                  : "bg-slate-700 text-slate-300"
              )}
            >
              Coming Soon
            </span>

            <button
              disabled
              className={cn(
                "w-full rounded-lg py-2 opacity-60 cursor-not-allowed",
                theme === "day"
                  ? "bg-slate-300 text-slate-500"
                  : "bg-slate-700 text-slate-400"
              )}
            >
              Open
            </button>
          </div>
        ))}
      </div>
    </>
  );
}


