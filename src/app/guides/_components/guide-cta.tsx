import Link from "next/link";

// Helper to check if route/tool exists (client-side, doesn't block rendering)
// In the future, we can add a real DB check here if needed

interface GuideCTAProps {
  ctaType?: string | null;
  ctaRouteSlug?: string | null;
  ctaToolSlug?: string | null;
  primaryIntent?: string | null;
  guideType?: string | null;
  className?: string;
}

type CTAResult = {
  type: "route" | "tool";
  href: string;
  label: string;
} | null;

/**
 * CTA 해석 규칙을 하나의 함수로 통일
 * taxonomy는 절대 slug로 사용하지 않음 (표시용 라벨로만 사용)
 */
function resolveCTA(
  ctaType: string | null | undefined,
  ctaRouteSlug: string | null | undefined,
  ctaToolSlug: string | null | undefined,
  primaryIntent: string | null | undefined,
  guideType: string | null | undefined
): CTAResult {
  // Normalize inputs
  const normalizedCtaType = ctaType?.trim() || null;
  const normalizedCtaRouteSlug = ctaRouteSlug?.trim() || null;
  const normalizedCtaToolSlug = ctaToolSlug?.trim() || null;
  const normalizedPrimaryIntent = primaryIntent?.trim() || null;
  const normalizedGuideType = guideType?.trim() || null;

  // Convert text to slug format (lowercase, replace spaces with hyphens)
  const toSlug = (text: string): string => {
    return text
      .toLowerCase()
      .trim()
      .replace(/\s+/g, '-')        // spaces to hyphens
      .replace(/[^a-z0-9-]/g, '')  // remove non-alphanumeric except hyphens
      .replace(/-+/g, '-')         // collapse multiple hyphens
      .replace(/^-|-$/g, '');      // trim leading/trailing hyphens
  };

  // Check if slugCandidate has spaces (human-readable string, needs conversion)
  const hasSpaces = (str: string | null | undefined): boolean => {
    if (!str || typeof str !== "string") return false;
    return str.trim().includes(" ");
  };

  // Rule 1: guide.cta_type === "tool"
  if (normalizedCtaType === "tool") {
    const slugCandidate = normalizedCtaToolSlug;
    if (!slugCandidate || slugCandidate.length === 0) return null;
    
    // Auto-convert text to slug if it contains spaces
    const finalSlug = hasSpaces(slugCandidate) ? toSlug(slugCandidate) : slugCandidate;
    
    if (hasSpaces(slugCandidate)) {
      console.warn(
        "[GuideCTA] Auto-converting tool slug with spaces:",
        slugCandidate,
        "→",
        finalSlug
      );
    }
    
    return {
      type: "tool",
      href: `/tools/${finalSlug}`,
      label: "Open Tool",
    };
  }

  // Rule 2: guide.cta_type === "route"
  if (normalizedCtaType === "route") {
    const slugCandidate = normalizedCtaRouteSlug ?? normalizedPrimaryIntent;
    if (!slugCandidate || slugCandidate.length === 0) return null;
    
    // Auto-convert text to slug if it contains spaces
    const finalSlug = hasSpaces(slugCandidate) ? toSlug(slugCandidate) : slugCandidate;
    
    if (hasSpaces(slugCandidate)) {
      console.warn(
        "[GuideCTA] Auto-converting route slug with spaces:",
        slugCandidate,
        "→",
        finalSlug
      );
    }
    
    return {
      type: "route",
      href: `/routes/${finalSlug}`,
      label: "Open Route",
    };
  }

  // Rule 3: cta_type이 없거나 null인 경우
  // guide.guide_type === "tool_based"
  if (normalizedGuideType === "tool_based") {
    const slugCandidate = normalizedCtaToolSlug;
    if (!slugCandidate || slugCandidate.length === 0) return null;
    
    // Auto-convert text to slug if it contains spaces
    const finalSlug = hasSpaces(slugCandidate) ? toSlug(slugCandidate) : slugCandidate;
    
    if (hasSpaces(slugCandidate)) {
      console.warn(
        "[GuideCTA] Auto-converting tool slug with spaces:",
        slugCandidate,
        "→",
        finalSlug
      );
    }
    
    return {
      type: "tool",
      href: `/tools/${finalSlug}`,
      label: "Open Tool",
    };
  }

  // guide.guide_type === "route_based" (기본값)
  if (normalizedGuideType === "route_based" || !normalizedGuideType) {
    const slugCandidate = normalizedCtaRouteSlug ?? normalizedPrimaryIntent;
    if (!slugCandidate || slugCandidate.length === 0) return null;
    
    // Auto-convert text to slug if it contains spaces
    const finalSlug = hasSpaces(slugCandidate) ? toSlug(slugCandidate) : slugCandidate;
    
    if (hasSpaces(slugCandidate)) {
      console.warn(
        "[GuideCTA] Auto-converting route slug with spaces:",
        slugCandidate,
        "→",
        finalSlug
      );
    }
    
    return {
      type: "route",
      href: `/routes/${finalSlug}`,
      label: "Open Route",
    };
  }

  return null;
}

export default function GuideCTA({
  ctaType,
  ctaRouteSlug,
  ctaToolSlug,
  primaryIntent,
  guideType,
  className = "",
}: GuideCTAProps) {
  const cta = resolveCTA(
    ctaType,
    ctaRouteSlug,
    ctaToolSlug,
    primaryIntent,
    guideType
  );

  // CTA 계산 결과가 있으면 무조건 렌더
  if (!cta) return null;

  return (
    <section className={`mt-8 ${className}`}>
      <div className="rounded-2xl border border-slate-800/70 bg-slate-900/40 p-5 sm:p-6">
        <div className="flex flex-col gap-3">
          <div>
            <h3 className="text-base font-semibold text-slate-50 mb-1">
              {cta.type === "route" ? "Next step" : "Recommended tool"}
            </h3>
            <p className="text-sm text-slate-300/70">
              {cta.type === "route"
                ? "Follow the route to pick the best tools for this task."
                : "Go to the tool page and visit the official website."}
            </p>
          </div>
          <Link
            href={cta.href}
            className="inline-flex items-center justify-center rounded-full bg-primary px-5 py-2.5 text-base font-semibold text-primary-foreground transition-colors hover:bg-primary-hover"
          >
            {cta.label} →
          </Link>
          <p className="text-xs text-slate-500 mt-1">
            🛡️ Official website only
          </p>
        </div>
      </div>
    </section>
  );
}

