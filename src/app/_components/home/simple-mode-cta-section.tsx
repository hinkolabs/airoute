import Link from "next/link";

export default function SimpleModeCtaSection() {
  return (
    <section className="px-4 py-12 sm:px-6 sm:py-16 lg:px-8">
      <div className="mx-auto max-w-4xl">
        {/* CTA Card */}
        <div className="rounded-xl bg-white p-8 text-center shadow-md sm:p-10 lg:p-12">
          {/* Title */}
          <h2 className="mb-4 text-2xl font-bold text-[#111827] sm:text-3xl lg:text-4xl">
            AI 선택, 어렵지 않아요.
          </h2>

          {/* Description */}
          <p className="mb-8 text-base leading-relaxed text-slate-600 sm:text-lg">
            하고 싶은 일을 알려주시면, 에이라우트가 가장 잘 맞는 AI 서비스와
            기능을 추천해 드릴게요.
          </p>

          {/* CTA Button */}
          <Link
            href="/simple"
            className="inline-flex items-center gap-2 rounded-full bg-primary px-8 py-4 text-base font-bold text-primary-foreground shadow-lg transition-all hover:bg-primary-hover hover:shadow-xl active:scale-[0.98] sm:px-10 sm:py-5 sm:text-lg"
          >
            Simple Mode 시작하기
            <span className="text-xl">✨</span>
          </Link>
        </div>
      </div>
    </section>
  );
}










