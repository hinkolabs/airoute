import { Metadata } from "next";
import GuidesListClient from "./_components/guides-list-client";
import { createClient } from "@supabase/supabase-js";

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

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
  { auth: { persistSession: false } }
);

export default async function GuidesPage() {
  try {
    const { data, error } = await supabase
      .from("guides")
      .select("id,slug,title,excerpt,guide_type,primary_intent,taxonomy,created_at,cta_type,cta_tool_slug,cta_route_slug")
      .eq("status", "approved") // Only show approved guides
      .eq("lang", "en") // Public pages default to EN only
      .order("created_at", { ascending: false })
      .order("id", { ascending: false })
      .limit(10);

    if (error) {
      console.error("[guides/page] Supabase error:", error.message);
      return (
        <div className="mx-auto max-w-2xl px-4 py-8 text-white/80">
          Failed to load guides.
        </div>
      );
    }

    const items = data ?? [];
    const last = items.length ? items[items.length - 1] : null;
    const initialCursor =
      items.length === 10 && last ? { createdAt: last.created_at, id: last.id } : null;

    return (
      <div className="mx-auto max-w-2xl px-4 py-8">
        <div className="mb-6">
          <h1 className="mb-3 text-2xl font-bold text-white">Getting started with AI</h1>
          <p className="max-w-lg text-sm leading-relaxed text-white/70">
            Simple, step-by-step guides
            <br />
            to help you choose the right AI tools
          </p>
        </div>
        <GuidesListClient initialItems={items as any} initialCursor={initialCursor as any} />
      </div>
    );
  } catch (e: unknown) {
    const message = e instanceof Error ? e.message : "Unknown error";
    console.error("[guides/page] Server error:", message);
    return (
      <div className="mx-auto max-w-2xl px-4 py-8 text-white/80">
        Failed to load guides.
      </div>
    );
  }
}
