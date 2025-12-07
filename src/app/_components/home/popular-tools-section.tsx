import Link from "next/link";
import type { ToolRecord } from "@/lib/tools";

type PopularToolsSectionProps = {
  tools: ToolRecord[];
};

// 인기 툴 정의 (하드코딩)
const POPULAR_TOOLS = [
  {
    id: "chatgpt",
    name: "ChatGPT",
    tags: ["텍스트", "챗봇"],
    slug: "chatgpt",
    icon: "💬",
  },
  {
    id: "claude",
    name: "Claude",
    tags: ["텍스트", "챗봇"],
    slug: "claude",
    icon: "🤖",
  },
  {
    id: "midjourney",
    name: "Midjourney",
    tags: ["이미지 생성"],
    slug: "midjourney",
    icon: "🎨",
  },
  {
    id: "pika",
    name: "Pika",
    tags: ["비디오 생성", "편집"],
    slug: "pika",
    icon: "🎬",
  },
  {
    id: "runway",
    name: "Runway",
    tags: ["비디오", "이미지"],
    slug: "runway",
    icon: "✨",
  },
  {
    id: "gemini",
    name: "Gemini",
    tags: ["텍스트", "멀티모달"],
    slug: "gemini",
    icon: "🌟",
  },
];

export default function PopularToolsSection({
  tools,
}: PopularToolsSectionProps) {
  return (
    <section className="px-4 py-10 sm:px-6 sm:py-14 lg:px-8">
      <div className="mx-auto max-w-7xl">
        {/* Section Header */}
        <div className="mb-8 text-center sm:mb-10">
          <h2 className="mb-3 text-2xl font-bold text-[#111827] sm:text-3xl lg:text-4xl">
            지금 인기 있는 AI 툴
          </h2>
          <p className="text-sm text-slate-600 sm:text-base">
            많은 사람들이 사용하는 대표적인 AI 서비스들이에요.
          </p>
        </div>

        {/* Tools Grid */}
        <div className="grid grid-cols-1 gap-4 sm:gap-5 md:grid-cols-2 lg:grid-cols-3">
          {POPULAR_TOOLS.map((tool) => (
            <div
              key={tool.id}
              className="group flex flex-col rounded-lg border border-slate-200 bg-white p-5 shadow-sm transition-all hover:border-slate-300 hover:shadow-md sm:p-6"
            >
              {/* Icon & Name */}
              <div className="mb-3 flex items-center gap-3">
                <span className="text-3xl">{tool.icon}</span>
                <h3 className="text-lg font-bold text-[#111827] sm:text-xl">
                  {tool.name}
                </h3>
              </div>

              {/* Tags */}
              <div className="mb-4 flex flex-wrap gap-2">
                {tool.tags.map((tag, index) => (
                  <span
                    key={index}
                    className="rounded-full bg-slate-100 px-3 py-1 text-xs font-medium text-slate-700"
                  >
                    {tag}
                  </span>
                ))}
              </div>

              {/* CTA Link */}
              <Link
                href={`/tools/${tool.slug}`}
                className="mt-auto inline-flex items-center gap-2 text-sm font-semibold text-emerald-600 transition-colors hover:text-emerald-700"
              >
                자세히 보기
                <span className="transition-transform group-hover:translate-x-1">
                  →
                </span>
              </Link>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
