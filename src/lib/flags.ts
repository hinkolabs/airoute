import { unstable_cache } from "next/cache";
import { supabaseServerClient } from "@/lib/supabase/server-legacy";

const ENV_FALLBACK = process.env.NEXT_PUBLIC_DEMO_MODE === "true";

/**
 * Server-side only: reads demo_mode from Supabase app_settings.
 * Cached for 60 s and tagged so the admin toggle can revalidate instantly.
 * Falls back to NEXT_PUBLIC_DEMO_MODE env var if DB read fails.
 */
export const getDemoMode = unstable_cache(
  async (): Promise<boolean> => {
    try {
      const { data, error } = await supabaseServerClient
        .from("app_settings")
        .select("value")
        .eq("key", "demo_mode")
        .single();

      if (error || !data) return ENV_FALLBACK;
      return data.value === "true";
    } catch {
      return ENV_FALLBACK;
    }
  },
  ["demo-mode"],
  { revalidate: 60, tags: ["demo-mode"] },
);

/** Sync constant kept for client-component fallback (build-time inlined). */
export const DEMO_MODE = ENV_FALLBACK;

// ─── Homepage Theme ──────────────────────────────
export type HomepageTheme = "default" | "v2" | "v2-simple";

export const getHomepageTheme = unstable_cache(
  async (): Promise<HomepageTheme> => {
    try {
      const { data, error } = await supabaseServerClient
        .from("app_settings")
        .select("value")
        .eq("key", "homepage_theme")
        .single();

      if (error || !data) return "default";
      const v = data.value as string;
      if (v === "v2" || v === "v2-simple") return v;
      return "default";
    } catch {
      return "default";
    }
  },
  ["homepage-theme"],
  { revalidate: 60, tags: ["homepage-theme"] },
);
