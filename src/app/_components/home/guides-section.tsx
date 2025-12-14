import Link from "next/link";

// 가이드 정의 (하드코딩)
const GUIDES = [
  {
    id: "image-ai-comparison",
    title: "이미지 생성 AI 완전 정리",
    description:
      "Midjourney, DALL·E, Stable Diffusion 차이를 쉽게 비교해 드려요.",
    slug: "image-ai-comparison",
    icon: "🎨",
  },
  {
    id: "free-ai-top10",
    title: "무료로 쓸 수 있는 AI TOP 10",
    description: "비용 부담 없이 시작할 수 있는 서비스들만 모았어요.",
    slug: "free-ai-top10",
    icon: "💰",
  },
  {
    id: "chatgpt-claude-gemini",
    title: "ChatGPT vs Claude vs Gemini",
    description: "언제 어떤 챗봇을 써야 하는지 정리해 드려요.",
    slug: "chatgpt-claude-gemini",
    icon: "💬",
  },
];

export default function GuidesSection() {
  return (
    <section className="px-4 py-10 sm:px-6 sm:py-14 lg:px-8">
      <div className="mx-auto max-w-7xl">
        {/* Section Header */}
        <div className="mb-8 text-center sm:mb-10">
          <h2 className="mb-3 text-2xl font-bold text-[#111827] sm:text-3xl lg:text-4xl">
            AI가 처음이신가요?
          </h2>
          <p className="text-sm text-slate-600 sm:text-base">
            기초부터 따라갈 수 있는 가이드로 천천히 시작해보세요.
          </p>
        </div>

        {/* Guides Grid */}
        <div className="mb-8 grid grid-cols-1 gap-5 md:grid-cols-3 md:gap-6">
          {GUIDES.map((guide) => (
            <Link
              key={guide.id}
              href={`/guides/${guide.slug}`}
              className="group flex flex-col rounded-lg border border-slate-200 bg-white p-6 shadow-sm transition-all hover:border-slate-300 hover:shadow-md"
            >
              {/* Icon */}
              <div className="mb-4 text-3xl">{guide.icon}</div>

              {/* Title */}
              <h3 className="mb-2 text-lg font-bold text-[#111827] transition-colors group-hover:text-emerald-600">
                {guide.title}
              </h3>

              {/* Description */}
              <p className="text-sm leading-relaxed text-slate-600">
                {guide.description}
              </p>

              {/* Arrow Indicator */}
              <div className="mt-4 flex items-center gap-1 text-sm font-medium text-emerald-600">
                읽어보기
                <span className="transition-transform group-hover:translate-x-1">
                  →
                </span>
              </div>
            </Link>
          ))}
        </div>

        {/* View All Button */}
        <div className="flex justify-center">
          <Link
            href="/guides"
            className="inline-flex items-center gap-2 rounded-lg border-2 border-slate-900 bg-transparent px-6 py-3 text-sm font-semibold text-slate-900 transition-all hover:bg-slate-900 hover:text-white active:scale-[0.98]"
          >
            모든 가이드 보기
            <span>→</span>
          </Link>
        </div>
      </div>
    </section>
  );
}


