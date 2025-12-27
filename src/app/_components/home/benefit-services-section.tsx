// 혜택이 좋은 AI 서비스 정의 (하드코딩)
const BENEFIT_SERVICES = [
  {
    id: "midjourney",
    name: "Midjourney",
    benefit: "첫 달 10% 할인",
    description: "포토리얼 이미지가 필요하다면 가장 가성비 좋은 선택이에요.",
    buttonText: "혜택 받기",
    url: "https://www.midjourney.com",
    icon: "🎨",
  },
  {
    id: "pika-studio",
    name: "Pika Studio Pro",
    benefit: "신규 가입 보너스 크레딧",
    description: "쇼츠·릴스 같은 짧은 영상 만들 때 유용해요.",
    buttonText: "혜택 받기",
    url: "https://pika.art",
    icon: "🎬",
  },
  {
    id: "canva-pro",
    name: "Canva Pro",
    benefit: "첫 달 무료 + 템플릿 제공",
    description:
      "디자인 경험이 없어도 쉽게 썸네일과 포스터를 만들 수 있어요.",
    buttonText: "혜택 받기",
    url: "https://www.canva.com",
    icon: "✨",
  },
];

export default function BenefitServicesSection() {
  return (
    <section className="px-4 py-10 sm:px-6 sm:py-14 lg:px-8">
      <div className="mx-auto max-w-7xl">
        {/* Section Header */}
        <div className="mb-8 text-center sm:mb-10">
          <h2 className="mb-3 text-2xl font-bold text-[#111827] sm:text-3xl lg:text-4xl">
            지금 혜택이 좋은 AI 서비스
          </h2>
          <p className="text-sm text-slate-600 sm:text-base">
            할인, 무료 체험 등 지금 가입하면 이득인 서비스만 모았어요.
          </p>
        </div>

        {/* Services Grid */}
        <div className="grid grid-cols-1 gap-5 md:grid-cols-3 md:gap-6">
          {BENEFIT_SERVICES.map((service) => (
            <div
              key={service.id}
              className="flex flex-col rounded-lg border border-slate-200 bg-white p-6 shadow-sm transition-all hover:border-slate-300 hover:shadow-md"
            >
              {/* Icon */}
              <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-emerald-100 text-2xl">
                {service.icon}
              </div>

              {/* Service Name */}
              <h3 className="mb-2 text-lg font-bold text-[#111827]">
                {service.name}
              </h3>

              {/* Benefit Badge */}
              <div className="mb-3">
                <span className="inline-block rounded-full bg-amber-100 px-3 py-1 text-xs font-semibold text-amber-800">
                  {service.benefit}
                </span>
              </div>

              {/* Description */}
              <p className="mb-5 flex-1 text-sm leading-relaxed text-slate-600">
                {service.description}
              </p>

              {/* CTA Button */}
              <a
                href={service.url}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center justify-center gap-2 rounded-lg bg-[#111827] px-5 py-2.5 text-sm font-semibold text-white transition-all hover:bg-slate-800 active:scale-[0.98]"
              >
                {service.buttonText}
                <span className="text-base">↗</span>
              </a>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}







