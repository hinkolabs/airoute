"use client";

import { useRouter } from "next/navigation";

export default function AuthComingSoonPage() {
  const router = useRouter();

  return (
    <div className="min-h-[calc(100vh-80px)] bg-slate-950 px-4 pt-10 pb-24 text-slate-50">
      <div className="mx-auto max-w-xl">
        {/* Coming Soon Badge */}
        <div className="mb-6 text-center">
          <div className="inline-flex items-center gap-2 rounded-full bg-emerald-500/15 px-4 py-2 text-sm font-semibold text-emerald-300">
            <span className="text-base">✨</span>
            <span>Coming soon</span>
          </div>
        </div>

        {/* Title */}
        <h1 className="mb-4 text-center text-3xl font-bold text-slate-50 sm:text-4xl">
          Sign in
        </h1>

        {/* Main Copy */}
        <p className="mb-4 text-center text-base leading-relaxed text-slate-300 sm:text-lg">
          Google sign-in is coming soon. For now, you can use Airoute without an account.
        </p>

        {/* Secondary Text */}
        <p className="mb-8 text-center text-sm text-slate-400">
          Favorites and My Route will sync after launch.
        </p>

        {/* Info Card */}
        <div className="mb-8 rounded-2xl border border-slate-800/70 bg-slate-900/40 p-6 shadow-sm">
          <h2 className="mb-4 text-lg font-semibold text-slate-50">What you can do now</h2>
          <ul className="space-y-3 text-sm text-slate-300">
            <li className="flex items-start gap-3">
              <span className="mt-0.5 flex h-5 w-5 flex-shrink-0 items-center justify-center rounded-full bg-emerald-500/20 text-xs font-bold text-emerald-400">
                ✓
              </span>
              <span>Browse all AI tools and routes</span>
            </li>
            <li className="flex items-start gap-3">
              <span className="mt-0.5 flex h-5 w-5 flex-shrink-0 items-center justify-center rounded-full bg-emerald-500/20 text-xs font-bold text-emerald-400">
                ✓
              </span>
              <span>Save up to 3 tools and 1 route (guest mode)</span>
            </li>
            <li className="flex items-start gap-3">
              <span className="mt-0.5 flex h-5 w-5 flex-shrink-0 items-center justify-center rounded-full bg-emerald-500/20 text-xs font-bold text-emerald-400">
                ✓
              </span>
              <span>Read guides and explore workflows</span>
            </li>
          </ul>
        </div>

        {/* Back Button */}
        <div className="text-center">
          <button
            onClick={() => router.back()}
            className="inline-flex items-center justify-center rounded-full bg-emerald-500 px-6 py-3 text-sm font-semibold text-slate-950 transition hover:bg-emerald-400"
          >
            Back to Airoute
          </button>
        </div>

        {/* Footer Note */}
        <div className="mt-8 text-center">
          <p className="text-sm text-slate-400">
            Questions?{" "}
            <a
              href="mailto:hello@airoute.app"
              className="font-medium text-emerald-400 transition hover:text-emerald-300 hover:underline"
            >
              Contact us
            </a>
          </p>
        </div>
      </div>
    </div>
  );
}





