/**
 * Centralized Limits System
 * Single source of truth for guest and authenticated user limits
 */

export type AuthStatus = 'loading' | 'guest' | 'authed';

export interface UserLimits {
  maxTools: number;
  maxRoutes: number;
}

/**
 * Get limits based on authentication status
 * During loading, treat as guest to prevent UI flash
 */
export function getLimits(authStatus: AuthStatus): UserLimits {
  // Treat loading as guest to prevent showing authed limits prematurely
  if (authStatus === 'loading' || authStatus === 'guest') {
    return {
      maxTools: 3,
      maxRoutes: 1,
    };
  }

  // Authenticated user limits
  return {
    maxTools: 999, // Unlimited for now
    maxRoutes: 3,
  };
}

/**
 * Clamp favorites to limits
 * Ensures data never exceeds current user limits
 */
export function clampFavorites(
  favorites: { tools: string[]; routes: string[] },
  limits: UserLimits
): { tools: string[]; routes: string[] } {
  return {
    tools: favorites.tools.slice(0, limits.maxTools),
    routes: favorites.routes.slice(0, limits.maxRoutes),
  };
}

/**
 * Check if user can add more items
 */
export function canAddTool(currentCount: number, limits: UserLimits): boolean {
  return currentCount < limits.maxTools;
}

export function canAddRoute(currentCount: number, limits: UserLimits): boolean {
  return currentCount < limits.maxRoutes;
}

