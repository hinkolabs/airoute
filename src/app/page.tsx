import Link from 'next/link';
import Button from '@/components/ui/button';

export default function Home() {
  return (
    <div className="flex flex-col">
      {/* Hero Section */}
      <section className="relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-b from-emerald-500/5 via-transparent to-transparent" />
        <div className="mx-auto max-w-7xl px-4 py-24 sm:px-6 sm:py-32 lg:px-8">
          <div className="flex flex-col items-center text-center">
            <span className="mb-4 rounded-full bg-emerald-500/10 px-4 py-1.5 text-sm font-medium text-emerald-400">
              v0.5 Beta
            </span>
            <h1 className="mb-6 max-w-3xl text-4xl font-bold tracking-tight text-white sm:text-5xl lg:text-6xl">
              AI 도구를{' '}
              <span className="bg-gradient-to-r from-emerald-400 to-teal-400 bg-clip-text text-transparent">
                3초 만에
              </span>{' '}
              찾아보세요
            </h1>
            <p className="mb-10 max-w-xl text-lg text-zinc-400 sm:text-xl">
              Airoute는 당신에게 딱 맞는 AI 도구를 빠르고 간단하게 추천해드립니다.
              복잡한 검색 없이 바로 시작하세요.
            </p>
            <div className="flex flex-col gap-4 sm:flex-row">
              <Link href="/simple">
                <Button size="lg">
                  Simple Mode 시작하기
                </Button>
              </Link>
              <Button variant="outline" size="lg">
                더 알아보기
              </Button>
            </div>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section className="border-t border-zinc-800 bg-zinc-950">
        <div className="mx-auto max-w-7xl px-4 py-20 sm:px-6 lg:px-8">
          <h2 className="mb-12 text-center text-2xl font-bold text-white sm:text-3xl">
            왜 Airoute인가요?
          </h2>
          <div className="grid gap-8 sm:grid-cols-2 lg:grid-cols-3">
            <FeatureCard
              title="빠른 검색"
              description="목적만 선택하면 즉시 추천받을 수 있습니다."
              icon="⚡"
            />
            <FeatureCard
              title="검증된 도구"
              description="모든 AI 도구는 직접 검증된 링크만 제공합니다."
              icon="✓"
            />
            <FeatureCard
              title="심플한 UX"
              description="복잡한 필터 없이 카드 형태로 한눈에 확인하세요."
              icon="🎯"
            />
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="border-t border-zinc-800">
        <div className="mx-auto max-w-7xl px-4 py-16 sm:px-6 lg:px-8">
          <div className="flex flex-col items-center text-center">
            <h2 className="mb-4 text-2xl font-bold text-white sm:text-3xl">
              지금 바로 AI 도구를 찾아보세요
            </h2>
            <p className="mb-8 max-w-md text-zinc-400">
              Simple Mode에서 목적에 맞는 AI 도구를 추천받으세요.
            </p>
            <Link href="/simple">
              <Button size="lg">시작하기</Button>
            </Link>
          </div>
        </div>
      </section>
    </div>
  );
}

function FeatureCard({
  title,
  description,
  icon,
}: {
  title: string;
  description: string;
  icon: string;
}) {
  return (
    <div className="rounded-xl border border-zinc-800 bg-zinc-900/30 p-6 transition-colors hover:border-zinc-700">
      <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-lg bg-emerald-500/10 text-2xl">
        {icon}
      </div>
      <h3 className="mb-2 text-lg font-semibold text-white">{title}</h3>
      <p className="text-sm text-zinc-400">{description}</p>
    </div>
  );
}
