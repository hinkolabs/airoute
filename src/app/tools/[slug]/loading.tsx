"use client";

export default function ToolDetailLoading() {
  return (
    <div className="min-h-screen bg-slate-950 px-4 pb-24 pt-3">
      <div className="mx-auto max-w-4xl px-4 py-10">
        {/* Back link skeleton */}
        <div className="pb-6">
          <div className="h-5 w-32 animate-pulse rounded bg-slate-800" />
        </div>

        {/* Header skeleton */}
        <header className="mb-8 text-center md:text-left">
          <div className="flex flex-col items-center gap-3 md:flex-row md:items-start md:justify-between">
            <div className="h-10 w-56 animate-pulse rounded bg-slate-800 md:w-72" />
            <div className="h-7 w-24 animate-pulse rounded-full bg-slate-800" />
          </div>
        </header>

        {/* Description skeleton */}
        <section className="mb-8 rounded-2xl border border-white/10 bg-slate-900/50 p-6">
          <div className="space-y-2">
            <div className="h-5 w-full animate-pulse rounded bg-slate-800" />
            <div className="h-5 w-5/6 animate-pulse rounded bg-slate-800" />
            <div className="h-5 w-4/6 animate-pulse rounded bg-slate-800" />
          </div>
        </section>

        {/* Button row skeleton */}
        <section className="mb-10 flex flex-col gap-3 sm:flex-row sm:items-center">
          <div className="h-12 w-44 animate-pulse rounded-xl bg-slate-800" />
          <div className="h-12 w-36 animate-pulse rounded-xl bg-slate-800" />
        </section>

        {/* Meta blocks skeleton */}
        <section className="mb-10 space-y-4">
          {[1, 2, 3].map((i) => (
            <div
              key={i}
              className="h-24 animate-pulse rounded-2xl border border-white/10 bg-slate-900/50"
            />
          ))}
        </section>

        {/* Divider */}
        <hr className="mb-10 border-white/10" />

        {/* More tools skeleton */}
        <section>
          <div className="mb-4 h-6 w-48 animate-pulse rounded bg-slate-800" />
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {[1, 2, 3].map((i) => (
              <div
                key={i}
                className="h-32 animate-pulse rounded-2xl bg-slate-800"
              />
            ))}
          </div>
        </section>
      </div>
    </div>
  );
}
