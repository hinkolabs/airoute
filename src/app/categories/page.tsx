import Link from "next/link";
import { TASK_CATEGORIES } from "@/lib/categories";

export default function CategoriesPage() {
  return (
    <div className="min-h-screen bg-slate-950 px-4 pb-24 pt-3">
      <div className="mx-auto max-w-5xl">
        {/* Header */}
        <header className="mb-8 space-y-2">
          <h1 className="text-2xl font-semibold text-slate-50 sm:text-3xl">
            Categories
          </h1>
          <p className="text-sm text-slate-400 sm:text-base">
            Pick a task. We'll show the best route.
          </p>
        </header>

        {/* Category Grid */}
        <div className="grid grid-cols-2 gap-3 lg:gap-4">
          {TASK_CATEGORIES.map((category) => (
            <Link
              key={category.id}
              href={`/tools/best/${category.id}`}
              className="group flex h-[140px] flex-col justify-between rounded-2xl border border-slate-800/70 bg-slate-900/70 p-3 shadow-sm transition hover:border-emerald-400/30 hover:bg-slate-900"
            >
              {/* Icon + Title */}
              <div>
                <div className="mb-2 flex h-9 w-9 items-center justify-center rounded-xl bg-emerald-500/10 text-xl">
                  {category.icon}
                </div>
                <h3 className="mb-1 text-sm font-semibold text-slate-50">
                  {category.title}
                </h3>
                <p className="text-xs leading-snug text-slate-400">
                  {category.description}
                </p>
              </div>

              {/* Bottom CTA */}
              <div className="flex items-center justify-between text-[11px] font-medium text-emerald-300">
                <span>View best 3 tools</span>
                <span className="transition group-hover:translate-x-0.5">→</span>
              </div>
            </Link>
          ))}
        </div>
      </div>
    </div>
  );
}


