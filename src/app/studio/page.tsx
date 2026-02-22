export default function StudioPage() {
  return (
    <div className="min-h-[calc(100vh-80px)] bg-background px-4 pt-10 pb-24 text-slate-50">
      <div className="mx-auto max-w-3xl">
        {/* Coming Soon Badge */}
        <div className="mb-6 text-center">
          <div className="inline-flex items-center gap-2 rounded-full bg-primary/15 px-4 py-2 text-sm font-semibold text-primary">
            <span className="text-base">✨</span>
            <span>Coming soon</span>
          </div>
        </div>

        {/* Title */}
        <h1 className="mb-4 text-center text-3xl font-bold text-slate-50 sm:text-4xl">
          Airoute Studio
        </h1>

        {/* Subtitle */}
        <p className="mb-6 text-center text-base leading-relaxed text-slate-300 sm:text-lg">
          One-screen workflow automation for scripts, images, and videos.
        </p>

        {/* Launch Pill */}
        <div className="mb-10 text-center">
          <span className="inline-block rounded-full border border-slate-700 bg-slate-900/50 px-4 py-2 text-sm font-medium text-slate-400">
            Launching Feb 2026
          </span>
        </div>

        {/* Feature Preview */}
        <div className="rounded-2xl border border-slate-800/70 bg-slate-900/40 p-6 shadow-sm">
          <h2 className="mb-4 text-lg font-semibold text-slate-50">What's coming</h2>
          <ul className="space-y-3 text-sm text-slate-300">
            <li className="flex items-start gap-3">
              <span className="mt-0.5 flex h-5 w-5 flex-shrink-0 items-center justify-center rounded-full bg-primary/20 text-xs font-bold text-primary">
                ✓
              </span>
              <span>One-click workflows for common tasks (background removal, upscaling, etc.)</span>
            </li>
            <li className="flex items-start gap-3">
              <span className="mt-0.5 flex h-5 w-5 flex-shrink-0 items-center justify-center rounded-full bg-primary/20 text-xs font-bold text-primary">
                ✓
              </span>
              <span>Batch processing for multiple files</span>
            </li>
            <li className="flex items-start gap-3">
              <span className="mt-0.5 flex h-5 w-5 flex-shrink-0 items-center justify-center rounded-full bg-primary/20 text-xs font-bold text-primary">
                ✓
              </span>
              <span>No subscription needed - pay only for what you use</span>
            </li>
          </ul>
        </div>

        {/* CTA */}
        <div className="mt-8 text-center">
          <p className="text-sm text-slate-400">
            Want early access?{" "}
            <a
              href="mailto:hello@airoute.app"
              className="font-medium text-primary transition hover:text-primary-hover hover:underline"
            >
              Contact us
            </a>
          </p>
        </div>
      </div>
    </div>
  );
}
