import Link from "next/link";
import { supabaseServerClient } from "@/lib/supabase/server";

export async function RelatedGuides({ toolSlug }: { toolSlug: string }) {
  const { data: guides } = await supabaseServerClient
    .from("guides")
    .select("id, slug, title, excerpt")
    .eq("guide_type", "tool_based")
    .eq("tool_slug", toolSlug)
    .in("status", ["approved", "published"])
    .eq("lang", "en")
    .order("created_at", { ascending: false })
    .limit(3);

  if (!guides || guides.length === 0) {
    return null;
  }

  return (
    <section className="mt-8 border-t border-border/50 pt-8 px-4 sm:px-6 lg:px-8">
      <div className="mx-auto max-w-[1200px]">
        <h3 className="mb-4 text-xl font-bold text-foreground">
          Related Guides
        </h3>
        <div className="space-y-4">
          {guides.map((guide) => (
            <Link
              key={guide.id}
              href={`/guides/${guide.slug}`}
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
          ))}
        </div>
      </div>
    </section>
  );
}







