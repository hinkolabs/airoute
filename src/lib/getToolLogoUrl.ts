/**
 * Tool Logo URL Resolution
 * 
 * Rules:
 * 1. If tool.image exists → use it
 * 2. If tool.website_url exists → use logo.dev with domain
 * 3. Otherwise → return null (component renders placeholder)
 * 
 * IMPORTANT: Never use affiliate_url for logo calculation
 */

type ToolForLogo = {
  image?: string | null;
  website_url?: string | null;
  websiteUrl?: string | null;
  name?: string | null;
  slug?: string | null;
};

/**
 * Extract domain from URL
 */
function extractDomain(url: string): string | null {
  try {
    const urlObj = new URL(url);
    return urlObj.hostname.replace(/^www\./, '');
  } catch {
    return null;
  }
}

/**
 * Get tool logo URL
 * Priority: tool.image > logo.dev(website_url) > null
 */
export function getToolLogoUrl(tool: ToolForLogo): string | null {
  // Priority 1: Manual image
  if (tool.image) {
    return tool.image;
  }

  // Priority 2: logo.dev from website_url domain
  const websiteUrl = tool.website_url || tool.websiteUrl;
  if (websiteUrl) {
    const domain = extractDomain(websiteUrl);
    if (domain) {
      return `https://img.logo.dev/${domain}?token=pk_X-LqXcCGSb2T6Io0H7THbQ&format=png&size=200`;
    }
  }

  // Priority 3: null (component will render placeholder)
  return null;
}

/**
 * Get tool initial letter for placeholder
 */
export function getToolInitial(tool: { name?: string | null; slug?: string | null }): string {
  const str = (tool.name || tool.slug || "?").trim();
  return str ? str[0].toUpperCase() : "?";
}

