import { Metadata } from "next";
import Link from "next/link";
import { supabaseServerClient } from "@/lib/supabase/server";

type GuideRecord = {
  id: string;
  slug: string;
  title: string;
  excerpt: string | null;
  created_at: string;
};

export const metadata: Metadata = {
  title: "AI Tool Guides - Airoute",
  description: "Practical guides to help you choose the right AI tools faster. Learn about image generation, video editing, writing assistants, and more.",
  alternates: {
    canonical: "https://www.airoute.ai/guides",
  },
  openGraph: {
    title: "AI Tool Guides - Airoute",
    description: "Practical guides to help you choose the right AI tools faster. Learn about image generation, video editing, writing assistants, and more.",
    url: "https://www.airoute.ai/guides",
  },
};

export default async function GuidesPage() {
  const { data, error } = await supabaseServerClient
    .from("guides")
    .select("id, slug, title, excerpt, created_at")
    .order("created_at", { ascending: false });

  if (error || !data) {
    return (
      <div className="px-4 py-12 text-center text-slate-400">
        Failed to load guides.
      </div>
    );
  }

  return (
    <div className="min-h-[calc(100vh-80px)] bg-slate-950 px-4 pb-24 pt-3">
      <div className="mx-auto flex max-w-5xl flex-col gap-6">
        <header className="space-y-2">
          <h1 className="text-2xl font-semibold text-slate-50 sm:text-3xl">
            Guides
          </h1>
          <p className="text-sm text-slate-400 sm:text-base">
            Practical guides to help you choose the right AI tools faster.
          </p>
        </header>

        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          {data.map((guide: GuideRecord) => (
            <Link
              key={guide.id}
              href={`/guides/${guide.slug}`}
              className="group rounded-2xl border border-slate-800/70 bg-slate-950/40 p-4 transition hover:border-slate-700 hover:bg-slate-900/40"
            >
              <div className="flex flex-col gap-2">
                <h2 className="text-base font-semibold text-slate-100 group-hover:text-white sm:text-lg">
                  {guide.title}
                </h2>
                {guide.excerpt && (
                  <p className="text-sm text-slate-400 line-clamp-3">
                    {guide.excerpt}
                  </p>
                )}
                <span className="mt-2 text-xs text-slate-500">
                  {new Date(guide.created_at).toLocaleDateString()}
                </span>
              </div>
            </Link>
          ))}
        </div>
      </div>
    </div>
  );
}
