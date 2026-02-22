import { 
  Scissors, 
  Sparkles, 
  Presentation, 
  Mail, 
  Search, 
  Clapperboard,
  LayoutTemplate,
  Briefcase
} from "lucide-react";

/**
 * Maps route slug to appropriate Lucide icon component
 * Used across Home Best Routes and /routes list page for consistency
 */
export function getRouteIcon(slug: string): React.ComponentType<{ className?: string; size?: number; strokeWidth?: number }> {
  if (slug.includes('short') || slug.includes('clip') || slug.includes('video')) {
    return Clapperboard;
  }
  if (slug.includes('slide') || slug.includes('presentation') || slug.includes('deck')) {
    return Presentation;
  }
  if (slug.includes('email') || slug.includes('business') || slug.includes('outreach')) {
    return Mail;
  }
  if (slug.includes('research') || slug.includes('google') || slug.includes('search')) {
    return Search;
  }
  // Fallback for unknown route types
  return Sparkles;
}

/**
 * Optional: Get icon background color class based on route slug
 * Can be extended for different route types if needed
 */
export function getRouteIconBg(slug: string): string {
  return "bg-emerald-500/10";
}


