/**
 * Guest User Favorites Management
 * Handles localStorage-based favorites for unauthenticated users
 * IMPORTANT: This module must only be used in client components
 */

const GUEST_ID_KEY = 'airoute_guest_id';
const GUEST_FAV_TOOLS_KEY = 'airoute_fav_tools';
const GUEST_FAV_ROUTES_KEY = 'airoute_fav_routes';

const GUEST_LIMITS = {
  MAX_TOOLS: 3,
  MAX_ROUTES: 1,
} as const;

export type GuestFavorites = {
  tools: string[];
  routes: string[];
};

/**
 * Get or create a unique guest ID
 */
export function getOrCreateGuestId(): string {
  if (typeof window === 'undefined') {
    throw new Error('getOrCreateGuestId can only be used in browser');
  }

  let guestId = localStorage.getItem(GUEST_ID_KEY);
  if (!guestId) {
    guestId = `guest_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`;
    localStorage.setItem(GUEST_ID_KEY, guestId);
  }
  return guestId;
}

/**
 * Load guest favorites from localStorage
 */
export function loadGuestFavorites(): GuestFavorites {
  if (typeof window === 'undefined') {
    return { tools: [], routes: [] };
  }

  try {
    const toolsJson = localStorage.getItem(GUEST_FAV_TOOLS_KEY);
    const tools = toolsJson ? JSON.parse(toolsJson) : [];

    const routesJson = localStorage.getItem(GUEST_FAV_ROUTES_KEY);
    const routes = routesJson ? JSON.parse(routesJson) : [];

    return {
      tools: Array.isArray(tools) ? tools : [],
      routes: Array.isArray(routes) ? routes : [],
    };
  } catch (error) {
    console.error('Error loading guest favorites:', error);
    return { tools: [], routes: [] };
  }
}

/**
 * Save guest favorites to localStorage
 */
export function saveGuestFavorites(data: GuestFavorites): void {
  if (typeof window === 'undefined') {
    return;
  }

  try {
    localStorage.setItem(GUEST_FAV_TOOLS_KEY, JSON.stringify(data.tools));
    localStorage.setItem(GUEST_FAV_ROUTES_KEY, JSON.stringify(data.routes));
  } catch (error) {
    console.error('Error saving guest favorites:', error);
  }
}

/**
 * Enforce guest limits (max 3 tools, max 1 route)
 */
export function enforceGuestLimits(data: GuestFavorites): GuestFavorites {
  return {
    tools: data.tools.slice(0, GUEST_LIMITS.MAX_TOOLS),
    routes: data.routes.slice(0, GUEST_LIMITS.MAX_ROUTES),
  };
}

/**
 * Clear all guest favorites from localStorage
 */
export function clearGuestFavorites(): void {
  if (typeof window === 'undefined') {
    return;
  }

  localStorage.removeItem(GUEST_FAV_TOOLS_KEY);
  localStorage.removeItem(GUEST_FAV_ROUTES_KEY);
}

/**
 * Check if adding a new tool would exceed limits
 */
export function canAddTool(currentTools: string[]): boolean {
  return currentTools.length < GUEST_LIMITS.MAX_TOOLS;
}

/**
 * Check if adding a new route would exceed limits
 */
export function canAddRoute(currentRoutes: string[]): boolean {
  return currentRoutes.length < GUEST_LIMITS.MAX_ROUTES;
}

export { GUEST_LIMITS };

