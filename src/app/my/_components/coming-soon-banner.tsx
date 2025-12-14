"use client";

import { useSearchParams } from "next/navigation";

export function ComingSoonBanner() {
  const searchParams = useSearchParams();
  const showBanner = searchParams.get("comingSoon") === "1";

  if (!showBanner) return null;

  return (
    <div className="mb-8 rounded-2xl border border-emerald-500/20 bg-emerald-500/10 p-6 text-center">
      <h2 className="mb-2 text-lg font-semibold text-slate-50">
        Sign up is coming soon
      </h2>
      <p className="mb-3 text-sm text-slate-300">
        We're preparing accounts. For now, Airoute works without login.
      </p>
      <p className="text-xs text-slate-400">
        Need help?{" "}
        <a
          href="mailto:contact@hinkolabs.com"
          className="text-emerald-400 hover:underline"
        >
          contact@hinkolabs.com
        </a>
      </p>
    </div>
  );
}



