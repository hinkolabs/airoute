// src/lib/guides/payload-normalizer.ts
// Enforces CTA integrity for guide payloads.

export type GuideType = "route_based" | "tool_based" | "theme";
export type CtaType = "route" | "tool" | null;

export interface GuideCtaInput {
  guide_type: GuideType;
  /** Resolved route slug (post-fallback or from recipe) */
  route_slug?: string | null;
  /** Resolved tool slug (post-fallback or from recipe) */
  tool_slug?: string | null;
}

export interface GuideCtaOutput {
  cta_type: CtaType;
  cta_route_slug: string | null;
  cta_tool_slug: string | null;
}

/**
 * Normalizes CTA fields for a guide payload.
 *
 * Priority rules:
 * 1. guide_type='theme'   → cta_type=null, both slugs null
 * 2. Only tool_slug       → cta_type='tool', cta_tool_slug=tool_slug, cta_route_slug=null
 * 3. Only route_slug      → cta_type='route', cta_route_slug=route_slug, cta_tool_slug=null
 * 4. Both present         → guide_type wins (tool_based→tool, route_based→route)
 * 5. Neither present      → guide_type-based cta_type, both slugs null
 *                           (caller must ensure fallback DB queries ran first)
 */
export function normalizeGuideCta(input: GuideCtaInput): GuideCtaOutput {
  const { guide_type, tool_slug, route_slug } = input;
  const hasTool = !!tool_slug;
  const hasRoute = !!route_slug;

  if (guide_type === "theme") {
    return { cta_type: null, cta_route_slug: null, cta_tool_slug: null };
  }

  // Both present → guide_type breaks the tie
  if (hasTool && hasRoute) {
    if (guide_type === "tool_based") {
      return { cta_type: "tool", cta_tool_slug: tool_slug!, cta_route_slug: null };
    }
    return { cta_type: "route", cta_route_slug: route_slug!, cta_tool_slug: null };
  }

  if (hasTool) {
    return { cta_type: "tool", cta_tool_slug: tool_slug!, cta_route_slug: null };
  }

  if (hasRoute) {
    return { cta_type: "route", cta_route_slug: route_slug!, cta_tool_slug: null };
  }

  // Neither resolved – return type-based default with null slugs
  return {
    cta_type: guide_type === "tool_based" ? "tool" : "route",
    cta_route_slug: null,
    cta_tool_slug: null,
  };
}
