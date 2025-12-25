"use client";

import { useRouter } from "next/navigation";

// 카테고리 정의
const CATEGORIES = [
  {
    id: "image",
    label: "이미지 & 디자인",
    icon: "🎨",
  },
  {
    id: "video",
    label: "영상 & 편집",
    icon: "🎬",
  },
  {
    id: "writing",
    label: "글쓰기 & 문서",
    icon: "✍️",
  },
  {
    id: "code",
    label: "코드 & 개발",
    icon: "💻",
  },
  {
    id: "voice",
    label: "음성 & 음악",
    icon: "🎵",
  },
  {
    id: "chat",
    label: "채팅 & 대화",
    icon: "💬",
  },
  {
    id: "business",
    label: "비즈니스 & 생산성",
    icon: "📊",
  },
  {
    id: "education",
    label: "교육 & 학습",
    icon: "📚",
  },
];

export default function HeroSection() {
  const router = useRouter();

  const handleCategoryClick = (categoryId: string) => {
    router.push(`/simple?category=${categoryId}`);
  };

  return (
    <section className="px-4 py-8 sm:px-6 sm:py-12 lg:px-8">
      <div className="mx-auto max-w-7xl">
        {/* Hero Card */}
        <div className="relative overflow-hidden rounded-2xl">
          <div className="pointer-events-none absolute inset-0 bg-gradient-to-br from-sky-500/30 via-indigo-500/20 to-transparent opacity-80" />
          <div className="relative rounded-2xl border border-white/10 bg-slate-900/40 p-5 shadow-[0_20px_60px_rgba(2,6,23,0.65)] backdrop-blur-xl sm:p-8 lg:p-10">
          {/* Title */}
          <h1 className="text-center text-2xl font-bold leading-tight text-slate-50 sm:text-3xl lg:text-4xl">
            어떤 AI 작업을 해결하고 싶으세요?
          </h1>

          {/* Category Buttons Grid */}
          <div className="mt-6 grid grid-cols-2 gap-3 sm:mt-10 sm:grid-cols-3 sm:gap-4 lg:grid-cols-4">
            {CATEGORIES.map((category) => (
              <button
                key={category.id}
                onClick={() => handleCategoryClick(category.id)}
                className="group flex flex-col items-center gap-2 rounded-xl border border-slate-200 bg-white p-4 transition-all hover:border-slate-300 hover:shadow-md active:scale-95 sm:gap-3 sm:p-6"
              >
                {/* Icon */}
                <span className="text-3xl transition-transform group-hover:scale-110 sm:text-4xl">
                  {category.icon}
                </span>

                {/* Label */}
                <span className="text-center text-sm font-medium text-slate-700 sm:text-base">
                  {category.label}
                </span>
              </button>
            ))}
          </div>
        </div>
      </div>
      </div>
    </section>
  );
}


