'use client';

/**
 * useSavedRoutes Hook
 * Hybrid storage strategy for saved routes:
 * - Guest (not logged in): localStorage only, limit = 1
 * - User (logged in): Supabase favorites_routes table, limit = 3
 * 
 * IMPORTANT: This hook must only be used in client components
 */

import { useState, useEffect, useCallback, useMemo } from 'react';
import { useAuth } from '@/app/_providers/auth-provider';
import { getSupabaseBrowserClient } from '@/lib/supabase/client';

// Constants
const GUEST_STORAGE_KEY = 'airoute_saved_routes_guest_v1';
const GUEST_ROUTE_LIMIT = 1;
const USER_ROUTE_LIMIT = 3; // Can increase later

// Types
export type SavedRoutesData = {
  routeSlugs: string[];
  count: number;
  limit: number;
  isLoading: boolean;
};

export type SavedRoutesResult = {
  blocked: boolean;
  routeSlugs: string[];
};

// ===========================
// Guest localStorage utilities
// ===========================

function loadGuestRoutes(): string[] {
  if (typeof window === 'undefined') return [];
  
  try {
    const json = localStorage.getItem(GUEST_STORAGE_KEY);
    const data = json ? JSON.parse(json) : [];
    return Array.isArray(data) ? data.slice(0, GUEST_ROUTE_LIMIT) : [];
  } catch (error) {
    console.error('Error loading guest routes:', error);
    return [];
  }
}

function saveGuestRoutes(routes: string[]): void {
  if (typeof window === 'undefined') return;
  
  try {
    // Enforce limit before saving
    const clamped = routes.slice(0, GUEST_ROUTE_LIMIT);
    localStorage.setItem(GUEST_STORAGE_KEY, JSON.stringify(clamped));
  } catch (error) {
    console.error('Error saving guest routes:', error);
  }
}

// ===========================
// Main Hook
// ===========================

export function useSavedRoutes() {
  const { user, authStatus } = useAuth();
  const [routeSlugs, setRouteSlugs] = useState<string[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  // Determine limit based on auth status
  const limit = useMemo(() => {
    return authStatus === 'authed' ? USER_ROUTE_LIMIT : GUEST_ROUTE_LIMIT;
  }, [authStatus]);

  // Count (derived from routeSlugs)
  const count = routeSlugs.length;

  // Set for quick lookups
  const savedRouteIdsSet = useMemo(() => new Set(routeSlugs), [routeSlugs]);

  // isSaved helper
  const isSaved = useCallback((routeSlug: string): boolean => {
    return savedRouteIdsSet.has(routeSlug);
  }, [savedRouteIdsSet]);

  // Load saved routes on mount and auth change
  useEffect(() => {
    async function loadSavedRoutes() {
      setIsLoading(true);

      try {
        if (authStatus === 'loading') {
          // Wait for auth to resolve
          return;
        }

        if (!user) {
          // Guest: load from localStorage only (NO DB calls)
          const guestRoutes = loadGuestRoutes();
          setRouteSlugs(guestRoutes);
        } else {
          // User: load from Supabase
          const supabase = getSupabaseBrowserClient();
          const { data, error } = await supabase
            .from('favorites_routes')
            .select('route_slug')
            .eq('user_id', user.id)
            .order('created_at', { ascending: false })
            .limit(USER_ROUTE_LIMIT);

          if (error) {
            console.error('Error loading saved routes:', error);
            setRouteSlugs([]);
          } else {
            setRouteSlugs(data?.map(r => r.route_slug) || []);
          }
        }
      } catch (error) {
        console.error('Error in loadSavedRoutes:', error);
        setRouteSlugs([]);
      } finally {
        setIsLoading(false);
      }
    }

    loadSavedRoutes();
  }, [user, authStatus]);

  // Toggle saved route
  const toggle = useCallback(async (routeSlug: string): Promise<SavedRoutesResult> => {
    const isCurrentlySaved = savedRouteIdsSet.has(routeSlug);

    if (!user) {
      // =============================
      // GUEST: localStorage only
      // =============================
      const currentRoutes = loadGuestRoutes();
      const alreadySaved = currentRoutes.includes(routeSlug);

      if (alreadySaved) {
        // Remove
        const newRoutes = currentRoutes.filter(s => s !== routeSlug);
        saveGuestRoutes(newRoutes);
        setRouteSlugs(newRoutes);
        return { blocked: false, routeSlugs: newRoutes };
      } else {
        // Add - check limit first
        if (currentRoutes.length >= GUEST_ROUTE_LIMIT) {
          // Blocked - limit reached
          return { blocked: true, routeSlugs: currentRoutes };
        }
        const newRoutes = [...currentRoutes, routeSlug];
        saveGuestRoutes(newRoutes);
        setRouteSlugs(newRoutes);
        return { blocked: false, routeSlugs: newRoutes };
      }
    } else {
      // =============================
      // USER: Supabase DB
      // =============================
      const supabase = getSupabaseBrowserClient();

      if (isCurrentlySaved) {
        // Remove from DB
        const { error } = await supabase
          .from('favorites_routes')
          .delete()
          .eq('user_id', user.id)
          .eq('route_slug', routeSlug);

        if (error) {
          console.error('Error removing saved route:', error);
          return { blocked: false, routeSlugs };
        }

        const newRoutes = routeSlugs.filter(s => s !== routeSlug);
        setRouteSlugs(newRoutes);
        return { blocked: false, routeSlugs: newRoutes };
      } else {
        // Check limit before adding
        if (routeSlugs.length >= USER_ROUTE_LIMIT) {
          return { blocked: true, routeSlugs };
        }

        // Add to DB
        const { error } = await supabase
          .from('favorites_routes')
          .insert({ user_id: user.id, route_slug: routeSlug });

        if (error) {
          console.error('Error adding saved route:', error);
          return { blocked: false, routeSlugs };
        }

        const newRoutes = [routeSlug, ...routeSlugs];
        setRouteSlugs(newRoutes);
        return { blocked: false, routeSlugs: newRoutes };
      }
    }
  }, [user, routeSlugs, savedRouteIdsSet]);

  return {
    routeSlugs,
    count,
    limit,
    isLoading,
    isSaved,
    toggle,
    savedRouteIdsSet,
  };
}

// Export constants for use elsewhere
export { GUEST_ROUTE_LIMIT, USER_ROUTE_LIMIT };





