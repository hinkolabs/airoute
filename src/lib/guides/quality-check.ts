// Guide quality gate scoring
// Max score: 100 (5 criteria × 20 points each)
// auto_publish_eligible: score >= 80

export type QualityCheckInput = {
  content: string;
  cta_type: string | null;
  cta_route_slug: string | null;
  cta_tool_slug: string | null;
  primary_intent: string | null;
  primary_route: string | null;
};

export type QualityCheckResult = {
  score: number;
  auto_publish_eligible: boolean;
  breakdown: {
    content_length: boolean;
    cta_present: boolean;
    primary_intent_present: boolean;
    route_or_tool_slug_present: boolean;
    h2_structure_ok: boolean;
  };
};

// Counts ## headings (H2) in markdown content
function countH2(content: string): number {
  return (content.match(/^## /gm) || []).length;
}

export function computeGuideQualityScore(input: QualityCheckInput): QualityCheckResult {
  const breakdown = {
    // +20: content body length > 3000 chars
    content_length: (input.content?.length ?? 0) > 3000,

    // +20: CTA type defined AND at least one slug is present
    cta_present:
      !!input.cta_type &&
      !!(input.cta_route_slug || input.cta_tool_slug),

    // +20: primary_intent is set and non-empty
    primary_intent_present:
      typeof input.primary_intent === "string" && input.primary_intent.trim().length > 0,

    // +20: route_slug OR tool_slug (CTA destination) is present
    route_or_tool_slug_present: !!(input.cta_route_slug || input.cta_tool_slug || input.primary_route),

    // +20: at least 2 H2 sections (## ) in content
    h2_structure_ok: countH2(input.content ?? "") >= 2,
  };

  const score =
    (breakdown.content_length ? 20 : 0) +
    (breakdown.cta_present ? 20 : 0) +
    (breakdown.primary_intent_present ? 20 : 0) +
    (breakdown.route_or_tool_slug_present ? 20 : 0) +
    (breakdown.h2_structure_ok ? 20 : 0);

  return {
    score,
    auto_publish_eligible: score >= 80,
    breakdown,
  };
}
