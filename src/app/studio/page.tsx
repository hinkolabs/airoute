"use client";

import Link from "next/link";

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
  // Not logged in - show login CTA
  if (!isLoggedIn) {
    return (
      <div className="min-h-[calc(100vh-80px)] bg-slate-950 px-4 pt-10 pb-24">
        <div className="max-w-3xl mx-auto text-center">
          <h1 className="text-3xl font-bold mb-4 text-slate-50">
            AI Studio
          </h1>
          <p className="mb-8 text-slate-300">
            로그인 후 AI Studio를 사용할 수 있습니다.
          </p>

          <Link
            href="/my"
            className="inline-flex items-center justify-center rounded-xl bg-emerald-500 px-5 py-3 text-white text-sm font-semibold shadow hover:bg-emerald-600 transition-colors"
          >
            로그인하러 가기
          </Link>
        </div>
      </div>
    );
  }

  // Logged in - show Studio UI
  return (
    <div className="min-h-[calc(100vh-80px)] bg-slate-950 px-4 pb-24">
      {/* Hero Block */}
      <div className="max-w-4xl mx-auto pt-10">
        <h1 className="text-3xl font-bold mb-2 text-slate-50">
          AI Studio
        </h1>
        <p className="text-slate-300">
          Airoute의 내장 AI 기능을 한 곳에서 사용하세요.
        </p>
      </div>

      {/* Tools Grid */}
      <div className="max-w-5xl mx-auto mt-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {studioTools.map((tool) => (
          <div
            key={tool.name}
            className="rounded-xl border border-slate-800 bg-slate-900 p-5 shadow-sm transition-colors"
          >
            <h3 className="font-semibold text-lg mb-3 text-slate-50">
              {tool.name}
            </h3>

            <span className="inline-block mb-3 text-xs rounded-full px-2 py-1 bg-slate-700 text-slate-300">
              Coming Soon
            </span>

            <button
              disabled
              className="w-full rounded-lg py-2 opacity-60 cursor-not-allowed bg-slate-700 text-slate-400"
            >
              Open
            </button>
          </div>
        ))}
      </div>
    </div>
  );
}
