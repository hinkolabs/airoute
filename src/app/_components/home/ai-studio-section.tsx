"use client";

import { useRouter } from "next/navigation";

// AI Studio 기능 정의
const AI_STUDIO_FEATURES = [
  {
    id: "background-removal",
    title: "배경 제거",
    icon: "✂️",
    path: "/ai-studio/background-removal",
  },
  {
    id: "upscale",
    title: "이미지 업스케일",
    icon: "📐",
    path: "/ai-studio/upscale",
  },
  {
    id: "thumbnail",
    title: "썸네일 제작",
    icon: "🖼️",
    path: "/ai-studio/thumbnail",
  },
  {
    id: "profile",
    title: "프로필 이미지 생성",
    icon: "👤",
    path: "/ai-studio/profile",
  },
  {
    id: "audio-caption",
    title: "오디오 클린 & 자막",
    icon: "🎧",
    path: "/ai-studio/audio-caption",
  },
  {
    id: "video-summary",
    title: "영상 요약",
    icon: "📹",
    path: "/ai-studio/video-summary",
  },
];

export default function AiStudioSection() {
  const router = useRouter();

  const handleFeatureClick = (path: string) => {
    router.push(path);
  };

  return (
    <section className="px-4 py-10 sm:px-6 sm:py-14 lg:px-8">
      <div className="mx-auto max-w-7xl">
        {/* Section Header */}
        <div className="mb-8 text-center sm:mb-10">
          <h2 className="mb-3 text-2xl font-bold text-[#111827] sm:text-3xl lg:text-4xl">
            바로 사용할 수 있는 AI 기능
          </h2>
          <p className="text-sm text-slate-600 sm:text-base">
            자주 사용하는 기능을 한 번에 실행해보세요.
          </p>
        </div>

        {/* Features Grid */}
        <div className="grid grid-cols-2 gap-3 sm:gap-4 md:grid-cols-3 md:gap-5">
          {AI_STUDIO_FEATURES.map((feature) => (
            <button
              key={feature.id}
              onClick={() => handleFeatureClick(feature.path)}
              className="group flex flex-col items-center gap-3 rounded-lg border border-slate-200 bg-white p-5 shadow-sm transition-all hover:border-slate-300 hover:shadow-md active:scale-[0.98] sm:gap-4 sm:p-6"
            >
              {/* Icon */}
              <div className="flex h-12 w-12 items-center justify-center rounded-full bg-slate-100 text-2xl transition-transform group-hover:scale-110 sm:h-14 sm:w-14 sm:text-3xl">
                {feature.icon}
              </div>

              {/* Title */}
              <span className="text-center text-sm font-semibold text-[#111827] sm:text-base">
                {feature.title}
              </span>
            </button>
          ))}
        </div>
      </div>
    </section>
  );
}







