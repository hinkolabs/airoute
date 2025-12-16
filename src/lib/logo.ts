/**
 * Tool Logo URL Resolution
 * Priority: manual image > logo.dev > null
 */

type ToolLike = {
  image?: string | null;
  logoUrl?: string | null;
  websiteUrl?: string | null;
  url?: string | null;
  affiliate_url?: string | null;
};

/**
 * Extract domain from URL for logo.dev
 */
function extractDomain(url: string): string | null {
  try {
    const urlObj = new URL(url);
    return urlObj.hostname.replace('www.', '');
  } catch {
    return null;
  }
}

/**
 * Get tool logo URL with priority fallback
 * 1. tool.image or tool.logoUrl (manual)
 * 2. logo.dev based on websiteUrl/url/affiliate_url domain
 * 3. null (component will render placeholder)
 */
export function getToolLogoUrl(tool: ToolLike): string | null {
  // Priority 1: Manual image
  if (tool.image) return tool.image;
  if (tool.logoUrl) return tool.logoUrl;

  // Priority 2: logo.dev from website domain
  const websiteUrl = tool.websiteUrl || tool.url || tool.affiliate_url;
  if (websiteUrl) {
    const domain = extractDomain(websiteUrl);
    if (domain) {
      return `https://img.logo.dev/${domain}?token=pk_X-LqXcCGSb2T6Io0H7THbQ&format=png&size=200`;
    }
  }

  // Priority 3: null (fallback to placeholder)
  return null;
}

