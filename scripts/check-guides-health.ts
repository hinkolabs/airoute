/**
 * Guides 테이블 헬스 체크
 * Usage: npm run check:guides
 * Requires: SUPABASE_URL (or NEXT_PUBLIC_SUPABASE_URL), SUPABASE_SERVICE_ROLE_KEY
 * Load .env.local: npx dotenv -e .env.local -- npm run check:guides (if dotenv-cli installed)
 */

import { createClient } from "@supabase/supabase-js";
import { readFileSync, existsSync } from "fs";
import { resolve } from "path";

function loadEnvLocal() {
  const path = resolve(process.cwd(), ".env.local");
  if (!existsSync(path)) return;
  try {
    const content = readFileSync(path, "utf-8");
    for (const line of content.split("\n")) {
      const m = line.match(/^([^#=]+)=(.*)$/);
      if (m) {
        const k = m[1].trim();
        let v = m[2].trim();
        if ((v.startsWith('"') && v.endsWith('"')) || (v.startsWith("'") && v.endsWith("'"))) {
          v = v.slice(1, -1);
        }
        if (!process.env[k]) process.env[k] = v;
      }
    }
  } catch {
    // ignore
  }
}
loadEnvLocal();

function requireEnv(names: string[]): string {
  for (const name of names) {
    const val = process.env[name];
    if (val && val.trim() !== "") return val;
  }
  console.error(`\n❌ Missing required env. Set one of: ${names.join(", ")}`);
  console.error("   Also need: SUPABASE_SERVICE_ROLE_KEY in .env.local\n");
  process.exit(1);
}

async function main() {
  const url = requireEnv(["SUPABASE_URL", "NEXT_PUBLIC_SUPABASE_URL"]);
  const key = requireEnv(["SUPABASE_SERVICE_ROLE_KEY"]);

  const supabase = createClient(url, key, { auth: { persistSession: false } });

  try {
    // Connection test: simple query
    const { error: connError } = await supabase.from("guides").select("id").limit(1);
    if (connError) {
      console.error("\n❌ DB connection failed:", connError.message);
      process.exit(1);
    }
  } catch (err) {
    console.error("\n❌ Connection error:", err instanceof Error ? err.message : String(err));
    process.exit(1);
  }

  // A) CTA route slug 누락
  const { data: ctaRouteGuides, error: errA } = await supabase
    .from("guides")
    .select(
      "id, slug, lang, cta_type, cta_route_slug, title, route_slug, tool_slug, cta_tool_slug, guide_type, primary_route, primary_intent, published_source, updated_at, published_at"
    )
    .eq("status", "published")
    .eq("cta_type", "route");

  const missingCta = (ctaRouteGuides ?? []).filter(
    (g) => g.cta_route_slug == null || String(g.cta_route_slug).trim() === ""
  );

  if (errA) {
    console.error("Query A failed:", errA.message);
  } else {
    console.log("\n=== Missing CTA Routes ===");
    if (!missingCta.length) {
      console.log("(none)");
    } else {
      const display = missingCta.map((g) => ({
        id: String(g.id).slice(0, 8) + "...",
        slug: (g.slug ?? "").slice(0, 40),
        title: ((g.title as string) ?? "").slice(0, 40),
        lang: g.lang ?? "",
        cta_type: g.cta_type ?? "",
        cta_route_slug: g.cta_route_slug ?? "(null)",
        route_slug: g.route_slug ?? "(null)",
        tool_slug: (g.tool_slug ?? "(null)") as string,
        cta_tool_slug: (g.cta_tool_slug ?? "(null)") as string,
        guide_type: (g.guide_type ?? "(null)") as string,
        primary_route: (g.primary_route ?? "(null)") as string,
        primary_intent: (g.primary_intent ?? "(null)") as string,
        published_source: (g.published_source ?? "(null)") as string,
        updated_at: g.updated_at ?? "",
        published_at: (g.published_at ?? "(null)") as string,
      }));
      console.table(display);
    }
  }

  // B) route_slug vs cta_route_slug mismatch
  // - primary_route != cta_route_slug (when both exist)
  // - cta_route_slug references non-existent route
  const { data: routeGuides } = await supabase
    .from("guides")
    .select("id, slug, primary_route, cta_route_slug, cta_type")
    .eq("status", "published")
    .eq("cta_type", "route")
    .not("cta_route_slug", "is", null)
    .neq("cta_route_slug", "");

  const mismatches: { id: string; slug: string; primary_route: string | null; cta_route_slug: string; issue: string }[] = [];

  if (routeGuides?.length) {
    const { data: routes } = await supabase.from("routes").select("slug");
    const routeSlugs = new Set((routes ?? []).map((r) => r.slug));

    for (const g of routeGuides) {
      const pr = g.primary_route ?? null;
      const cta = g.cta_route_slug ?? "";
      const routeExists = routeSlugs.has(cta);
      if (pr && pr !== cta) {
        mismatches.push({
          id: String(g.id),
          slug: g.slug ?? "",
          primary_route: pr,
          cta_route_slug: cta,
          issue: "primary_route != cta_route_slug",
        });
      } else if (!routeExists) {
        mismatches.push({
          id: String(g.id),
          slug: g.slug ?? "",
          primary_route: pr,
          cta_route_slug: cta,
          issue: "route not found in routes table",
        });
      }
    }
  }

  console.log("\n=== Route Mismatches ===");
  if (!mismatches.length) {
    console.log("(none)");
  } else {
    console.table(mismatches);
  }

  // C-pre) Candidate routes for CTA fix
  const keywords = ["chatgpt", "claude", "upscale", "canva"] as const;
  console.log("\n=== Candidate Routes For Fix ===");

  for (const kw of keywords) {
    const { data: candidateRoutes, error: errCand } = await supabase
      .from("routes")
      .select("slug, title, status, category")
      .ilike("slug", `%${kw}%`)
      .limit(10);

    if (errCand) {
      console.error(`  [${kw}] query failed:`, errCand.message);
    } else if (!candidateRoutes?.length) {
      console.log(`  [${kw}] (none)`);
    } else {
      console.log(`  keyword: "${kw}" (${candidateRoutes.length} results)`);
      console.table(
        candidateRoutes.map((r) => ({
          slug: r.slug ?? "",
          title: ((r.title as string) ?? "").slice(0, 50),
          status: r.status ?? "",
          category: r.category ?? "",
        }))
      );
    }
  }

  // C) lang 분포
  const { data: langRows, error: errC } = await supabase
    .from("guides")
    .select("lang")
    .eq("status", "published");

  if (errC) {
    console.error("Query C failed:", errC.message);
  } else {
    const counts: Record<string, number> = {};
    for (const r of langRows ?? []) {
      const l = r.lang ?? "(null)";
      counts[l] = (counts[l] ?? 0) + 1;
    }
    const langStats = Object.entries(counts).map(([lang, count]) => ({ lang, count }));
    langStats.sort((a, b) => b.count - a.count);
    console.log("\n=== Language Stats ===");
    console.table(langStats);
  }

  // D) 최근 20개 가이드
  const { data: latest, error: errD } = await supabase
    .from("guides")
    .select("id, slug, title, status, lang, created_at")
    .order("created_at", { ascending: false })
    .limit(20);

  if (errD) {
    console.error("Query D failed:", errD.message);
  } else {
    console.log("\n=== Latest Guides ===");
    const display = (latest ?? []).map((g) => ({
      id: String(g.id).slice(0, 8) + "...",
      slug: (g.slug ?? "").slice(0, 40),
      title: ((g.title as string) ?? "").slice(0, 35),
      status: g.status ?? "",
      lang: g.lang ?? "",
      created_at: g.created_at ?? "",
    }));
    console.table(display);
  }

  console.log("");
}

main();
