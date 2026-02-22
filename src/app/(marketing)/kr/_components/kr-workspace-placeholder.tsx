import { Package } from "lucide-react";

export function KRWorkspacePlaceholder() {
  return (
    <section className="px-4 py-10 sm:px-6 sm:py-8 lg:px-8">
      <div className="mx-auto max-w-[1200px]">
        {/* Section Header */}
        <div className="mb-4">
          <h2 className="text-lg font-semibold tracking-tight text-slate-900 md:text-xl">워크스페이스</h2>
          <p className="mt-1 text-sm text-slate-500">
            곧 출시될 기능입니다
          </p>
        </div>

        {/* Placeholder Card */}
        <div className="flex min-h-[200px] flex-col items-center justify-center rounded-xl border border-dashed border-slate-200 bg-slate-50/60 py-10 text-center ring-1 ring-slate-200/60 md:py-12">
          <div className="mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-white p-4 shadow-sm ring-1 ring-slate-200/60">
            <Package className="h-8 w-8 text-primary" />
          </div>
          <h3 className="mb-2 text-lg font-semibold text-foreground">워크스페이스 준비 중</h3>
          <p className="max-w-lg text-sm leading-relaxed text-slate-500">
            팀과 함께 AI 도구를 관리하고 워크플로우를 자동화할 수 있는 공간입니다.
          </p>
        </div>
      </div>
    </section>
  );
}
