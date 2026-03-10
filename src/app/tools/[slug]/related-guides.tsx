import Link from "next/link";
import { supabaseServerClient } from "@/lib/supabase/server";

type RelatedGuidesProps = {
  toolSlug: string;
  locale?: "en" | "kr";
};

export async function RelatedGuides({ toolSlug, locale = "en" }: RelatedGuidesProps) {
  const supabase = supabaseServerClient;
  const isKr = locale === "kr";

  // KR 페이지면 KR 가이드 우선, 없으면 EN 폴백
  let guides = null;

  if (isKr) {
    const { data: krGuides } = await supabase
      .from("guides")
      .select("id, slug, title, excerpt, lang")
      .eq("guide_type", "tool_based")
      .eq("tool_slug", toolSlug)
      .in("status", ["approved", "published"])
      .eq("lang", "kr")
      .order("created_at", { ascending: false })
      .limit(3);

    if (krGuides && krGuides.length > 0) {
      guides = krGuides;
    }
  }

  // EN 폴백 (또는 EN 페이지)
  if (!guides) {
    const { data: enGuides } = await supabase
      .from("guides")
      .select("id, slug, title, excerpt, lang")
      .eq("guide_type", "tool_based")
      .eq("tool_slug", toolSlug)
      .in("status", ["approved", "published"])
      .eq("lang", "en")
      .order("created_at", { ascending: false })
      .limit(3);

    guides = enGuides;
  }

  if (!guides || guides.length === 0) {
    return null;
  }

  const heading = isKr ? "관련 가이드" : "Related Guides";

  return (
    <section className="mt-8 border-t border-border/50 pt-8 px-4 sm:px-6 lg:px-8">
      <div className="mx-auto max-w-[1200px]">
        <h3 className="mb-4 text-xl font-bold text-foreground">
          {heading}
        </h3>
        <div className="space-y-4">
          {guides.map((guide) => {
            const href = guide.lang === "kr"
              ? `/kr/guides/${guide.slug}`
              : `/guides/${guide.slug}`;
            return (
              <Link
                key={guide.id}
                href={href}
                className="block rounded-2xl border border-border bg-card/70 p-5 transition hover:border-primary/30 hover:bg-card hover:shadow-md"
              >
                <h4 className="mb-2 text-base font-semibold text-foreground leading-snug">
                  {guide.title}
                </h4>
                {guide.excerpt && (
                  <p className="line-clamp-2 text-sm text-muted-foreground leading-relaxed">
                    {guide.excerpt}
                  </p>
                )}
              </Link>
            );
          })}
        </div>
      </div>
    </section>
  );
}







