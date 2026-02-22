import { Metadata } from "next";
import { notFound } from "next/navigation";
import GuidesListClient from "@/app/guides/_components/guides-list-client";
import { createClient } from "@supabase/supabase-js";

export const metadata: Metadata = {
  title: "AI 도구 가이드 - Airoute KR",
  description: "올바른 AI 도구를 더 빠르게 선택하는 데 도움이 되는 실용적인 가이드. 이미지 생성, 영상 편집, 글쓰기 도우미 등에 대해 알아보세요.",
  alternates: {
    canonical: "https://www.airoute.ai/kr/guides",
  },
  openGraph: {
    title: "AI 도구 가이드 - Airoute KR",
    description: "올바른 AI 도구를 더 빠르게 선택하는 데 도움이 되는 실용적인 가이드. 이미지 생성, 영상 편집, 글쓰기 도우미 등에 대해 알아보세요.",
    url: "https://www.airoute.ai/kr/guides",
    locale: "ko_KR",
  },
};

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
  { auth: { persistSession: false } }
);

interface KRGuidesPageProps {
  searchParams: Promise<{ [key: string]: string | string[] | undefined }>;
}

export default async function KRGuidesPage({ searchParams }: KRGuidesPageProps) {
  const resolvedSearchParams = await searchParams;
  const routeFilter = typeof resolvedSearchParams?.route === "string" ? resolvedSearchParams.route : undefined;
  const isRouteMode = Boolean(routeFilter);

  try {
    let query = supabase
      .from("guides")
      .select("id,slug,title,excerpt,guide_type,primary_intent,taxonomy,created_at,cta_type,cta_tool_slug,cta_route_slug")
      .eq("status", "published") // Show only published guides
      .eq("lang", "kr"); // KR pages show KR guides

    if (routeFilter) {
      query = query.eq("route_slug", routeFilter);
      query = query.eq("guide_type", "route_based");
    }

    const { data, error } = await query
      .order("created_at", { ascending: false })
      .order("id", { ascending: false })
      .limit(20); // Fetch more for filtering

    if (error || !data) {
      return notFound();
    }

    const allItems = data ?? [];
    
    // Filter out route-CTA guides whose cta_route_slug doesn't exist
    const filteredItems = await Promise.all(
      allItems.map(async (guide) => {
        // If not a route CTA, keep it
        if (!guide.cta_type || guide.cta_type !== "route" || !guide.cta_route_slug) {
          return guide;
        }
        
        // Check if route exists
        const { data: route } = await supabase
          .from("routes")
          .select("slug")
          .eq("slug", guide.cta_route_slug)
          .single();
        
        return route ? guide : null;
      })
    );
    
    const items = filteredItems
      .filter((g): g is NonNullable<typeof g> => g !== null)
      .slice(0, 10);
    
    const last = items.length ? items[items.length - 1] : null;
    const initialCursor =
      items.length === 10 && last ? { createdAt: last.created_at, id: last.id } : null;

    return (
      <div className="mx-auto max-w-[1200px] px-4 py-8 sm:px-6 lg:px-8">
        <div className="mb-6">
          <h1 className="mb-3 text-2xl font-bold text-foreground">
            {isRouteMode ? "이 루트의 가이드" : "AI 시작하기"}
          </h1>
          <p className="max-w-lg text-sm leading-relaxed text-foreground/70">
            올바른 AI 도구를 선택하는 데 도움이 되는
            <br />
            간단한 단계별 가이드
          </p>
          {routeFilter && (
            <p className="mt-2 text-xs text-primary">
              이 루트의 가이드를 표시하고 있습니다
            </p>
          )}
        </div>
        <GuidesListClient initialItems={items as any} initialCursor={initialCursor as any} lang="kr" baseUrl="/kr/guides" />
      </div>
    );
  } catch (e: unknown) {
    return notFound();
  }
}
