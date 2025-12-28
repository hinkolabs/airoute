"use client";

import { useRouter } from "next/navigation";
import type { ToolRecord } from "@/lib/tools";

type BestForYouSectionProps = {
  tools: ToolRecord[];
};

// 타겟 역할 정의
const TARGET_ROLES = [
  {
    id: "jobseeker",
    label: "취준생",
    description: "이력서, 자기소개서, 면접 준비까지 AI로 완벽하게 대비하세요",
    emoji: "💼",
  },
  {
    id: "youtuber",
    label: "유튜버",
    description: "숏폼 영상, 썸네일, 자막 생성을 AI 도구로 빠르게 제작하세요",
    emoji: "🎥",
  },
  {
    id: "designer",
    label: "디자이너",
    description: "로고, 배너, UI 디자인을 AI와 함께 효율적으로 완성하세요",
    emoji: "🎨",
  },
  {
    id: "marketer",
    label: "마케터",
    description: "광고 카피, SNS 콘텐츠, 이미지 제작을 AI로 한 번에 해결하세요",
    emoji: "📊",
  },
];

export default function BestForYouSection({ tools }: BestForYouSectionProps) {
  const router = useRouter();

  const handleRoleClick = (roleId: string) => {
    router.push(`/simple?role=${roleId}`);
  };

  return (
    <section className="px-4 py-10 sm:px-6 sm:py-14 lg:px-8">
      <div className="mx-auto max-w-7xl">
        {/* Section Title */}
        <h2 className="mb-8 text-center text-2xl font-bold text-[#111827] sm:mb-10 sm:text-3xl lg:text-4xl">
          이런 분들께 추천드려요
        </h2>

        {/* Cards Grid */}
        <div className="grid grid-cols-1 gap-5 md:grid-cols-2 md:gap-6">
          {TARGET_ROLES.map((role) => (
            <div
              key={role.id}
              className="group rounded-2xl border border-slate-200 bg-white p-6 shadow-sm transition-all hover:border-slate-300 hover:shadow-md sm:p-8"
            >
              {/* Emoji & Badge */}
              <div className="mb-4 flex items-center gap-3">
                <span className="text-3xl">{role.emoji}</span>
                <span className="inline-block rounded-full bg-emerald-100 px-4 py-1.5 text-sm font-semibold text-emerald-700">
                  Best for {role.label}
                </span>
              </div>

              {/* Description */}
              <p className="mb-5 text-[15px] leading-relaxed text-slate-600 sm:text-base">
                {role.description}
              </p>

              {/* CTA Button */}
              <button
                onClick={() => handleRoleClick(role.id)}
                className="inline-flex w-full items-center justify-center gap-2 rounded-lg bg-[#111827] px-5 py-3 text-sm font-semibold text-white transition-all hover:bg-slate-800 active:scale-[0.98] sm:w-auto"
              >
                AI 추천 받기
                <span className="transition-transform group-hover:translate-x-1">
                  →
                </span>
              </button>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}









