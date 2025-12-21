/**
 * Tool Logo URL Resolution
 * 
 * Rules:
 * 1. If tool.image exists → use it
 * 2. If tool.website_url exists AND starts with http → use logo.dev with domain
 * 3. Otherwise → return null (component renders placeholder)
 * 
 * IMPORTANT: 
 * - Never use affiliate_url for logo calculation
 * - All URL parsing must be in try/catch for SSR safety
 * - Never throw errors from these functions
 */

type ToolForLogo = {
  image?: string | null;
  website_url?: string | null;
  websiteUrl?: string | null;
  name?: string | null;
  slug?: string | null;
};

/**
 * Extract domain from URL (SSR-safe)
 * Returns null on any error - never throws
 */
function extractDomain(url: string | null | undefined): string | null {
  if (!url) return null;
  
  const trimmed = url.trim();
  if (!trimmed) return null;

  const tryParse = (value: string): URL | null => {
    try { return new URL(value); } catch { return null; }
  };

  const u1 = tryParse(trimmed);
  const u2 = u1 ?? tryParse(`https://${trimmed}`);
  const hostname = u2?.hostname?.toLowerCase() ?? "";

  if (!hostname) return null;
  const cleaned = hostname.startsWith("www.") ? hostname.slice(4) : hostname;

  // basic guard
  if (!cleaned.includes(".")) return null;
  return cleaned;
}

/**
 * Get tool logo URL (SSR-safe)
 * Priority: tool.image > logo.dev(website_url) > null
 * Never throws - returns null on any error
 */
export function getToolLogoUrl(tool: ToolForLogo | null | undefined): string | null {
  // Guard: invalid tool object
  if (!tool || typeof tool !== 'object') return null;
  
  try {
    // Priority 1: Manual image
    if (tool.image && typeof tool.image === 'string' && tool.image.length > 0) {
      return tool.image;
    }

    // Priority 2: logo.dev from website_url domain
    const websiteUrl = tool.website_url || tool.websiteUrl;
    if (websiteUrl && typeof websiteUrl === 'string') {
      const domain = extractDomain(websiteUrl);
      if (domain) {
        return `https://img.logo.dev/${domain}?token=pk_X-LqXcCGSb2T6Io0H7THbQ&format=png&size=200`;
      }
    }
  } catch {
    // Catch any unexpected errors - return null
    return null;
  }

  // Priority 3: null (component will render placeholder)
  return null;
}

/**
 * Get tool initial letter for placeholder (SSR-safe)
 * Never throws - returns "?" on any error
 */
export function getToolInitial(tool: { name?: string | null; slug?: string | null } | null | undefined): string {
  try {
    if (!tool || typeof tool !== 'object') return "?";
    const str = (tool.name || tool.slug || "").trim();
    if (!str || str.length === 0) return "?";
    return str[0].toUpperCase();
  } catch {
    return "?";
  }
}


