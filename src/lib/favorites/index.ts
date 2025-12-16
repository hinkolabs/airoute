/**
 * Unified Favorites Service
 * Handles favorites for both logged-in users (Supabase) and guests (localStorage)
 * IMPORTANT: This module must only be used in client components
 */

import { getSupabaseBrowserClient } from '@/lib/supabase/client';
import {
  loadGuestFavorites,
  saveGuestFavorites,
  canAddTool,
  canAddRoute,
  clearGuestFavorites,
  type GuestFavorites,
} from '@/lib/guest';

export type FavoritesData = {
  tools: string[];
  routes: string[];
  blocked?: boolean;
};

// Limits
const AUTHED_ROUTE_LIMIT = 3;

/**
 * Get current user from Supabase
 */
async function getCurrentUser() {
  const supabase = getSupabaseBrowserClient();
  const { data: { user } } = await supabase.auth.getUser();
  return user;
}

/**
 * Get favorites for current user (logged in or guest)
 */
export async function getFavorites(): Promise<FavoritesData> {
  const user = await getCurrentUser();

  if (!user) {
    // Guest user - use localStorage
    const guestFavs = loadGuestFavorites();
    return guestFavs;
  }

  // Logged-in user - fetch from Supabase
  const supabase = getSupabaseBrowserClient();

  const [toolsRes, routesRes] = await Promise.all([
    supabase
      .from('favorites_tools')
      .select('tool_slug')
      .eq('user_id', user.id)
      .order('created_at', { ascending: false }),
    supabase
      .from('favorites_routes')
      .select('route_slug')
      .eq('user_id', user.id)
      .order('created_at', { ascending: false })
      .limit(AUTHED_ROUTE_LIMIT),
  ]);

  const tools = toolsRes.data?.map(t => t.tool_slug) || [];
  const routes = routesRes.data?.map(r => r.route_slug) || [];

  return { tools, routes };
}

/**
 * Toggle a tool favorite (add or remove)
 */
export async function toggleToolFavorite(toolSlug: string): Promise<FavoritesData> {
  const user = await getCurrentUser();

  if (!user) {
    // Guest user - use localStorage
    const guestFavs = loadGuestFavorites();
    const isCurrentlyFavorited = guestFavs.tools.includes(toolSlug);

    if (isCurrentlyFavorited) {
      // Remove
      const newTools = guestFavs.tools.filter(t => t !== toolSlug);
      const newFavs = { ...guestFavs, tools: newTools };
      saveGuestFavorites(newFavs);
      return newFavs;
    } else {
      // Add - check limit
      if (!canAddTool(guestFavs.tools)) {
        return { ...guestFavs, blocked: true };
      }
      const newTools = [...guestFavs.tools, toolSlug];
      const newFavs = { ...guestFavs, tools: newTools };
      saveGuestFavorites(newFavs);
      return newFavs;
    }
  }

  // Logged-in user - use Supabase
  const supabase = getSupabaseBrowserClient();

  // Check if already favorited
  const { data: existing } = await supabase
    .from('favorites_tools')
    .select('id')
    .eq('user_id', user.id)
    .eq('tool_slug', toolSlug)
    .maybeSingle();

  if (existing) {
    // Remove
    await supabase
      .from('favorites_tools')
      .delete()
      .eq('user_id', user.id)
      .eq('tool_slug', toolSlug);
  } else {
    // Add
    await supabase
      .from('favorites_tools')
      .insert({ user_id: user.id, tool_slug: toolSlug });
  }

  // Return updated favorites
  return await getFavorites();
}

/**
 * Toggle a route favorite (add or remove)
 */
export async function toggleRouteFavorite(routeSlug: string): Promise<FavoritesData> {
  const user = await getCurrentUser();

  if (!user) {
    // Guest user - use localStorage
    const guestFavs = loadGuestFavorites();
    const isCurrentlyFavorited = guestFavs.routes.includes(routeSlug);

    if (isCurrentlyFavorited) {
      // Remove
      const newRoutes = guestFavs.routes.filter(r => r !== routeSlug);
      const newFavs = { ...guestFavs, routes: newRoutes };
      saveGuestFavorites(newFavs);
      return newFavs;
    } else {
      // Add - check limit
      if (!canAddRoute(guestFavs.routes)) {
        return { ...guestFavs, blocked: true };
      }
      const newRoutes = [...guestFavs.routes, routeSlug];
      const newFavs = { ...guestFavs, routes: newRoutes };
      saveGuestFavorites(newFavs);
      return newFavs;
    }
  }

  // Logged-in user - use Supabase
  const supabase = getSupabaseBrowserClient();

  // Check if already favorited
  const { data: existing } = await supabase
    .from('favorites_routes')
    .select('id')
    .eq('user_id', user.id)
    .eq('route_slug', routeSlug)
    .maybeSingle();

  if (existing) {
    // Remove
    await supabase
      .from('favorites_routes')
      .delete()
      .eq('user_id', user.id)
      .eq('route_slug', routeSlug);
  } else {
    // Check limit
    const currentFavorites = await getFavorites();
    if (currentFavorites.routes.length >= AUTHED_ROUTE_LIMIT) {
      return { ...currentFavorites, blocked: true };
    }

    // Add
    await supabase
      .from('favorites_routes')
      .insert({ user_id: user.id, route_slug: routeSlug });
  }

  // Return updated favorites
  return await getFavorites();
}

/**
 * Set route favorite (replace existing) - DEPRECATED, use toggleRouteFavorite instead
 * Kept for backward compatibility with existing code
 */
export async function setRouteFavorite(routeSlug: string | null): Promise<FavoritesData> {
  const user = await getCurrentUser();

  if (!user) {
    // Guest user - use localStorage
    const guestFavs = loadGuestFavorites();
    
    if (routeSlug === null) {
      // Clear routes
      const newFavs = { ...guestFavs, routes: [] };
      saveGuestFavorites(newFavs);
      return newFavs;
    }

    // Set route (replace existing)
    const newFavs = { ...guestFavs, routes: [routeSlug] };
    saveGuestFavorites(newFavs);
    return newFavs;
  }

  // Logged-in user - use Supabase
  const supabase = getSupabaseBrowserClient();

  if (routeSlug === null) {
    // Clear all routes
    await supabase
      .from('favorites_routes')
      .delete()
      .eq('user_id', user.id);
  } else {
    // Delete existing and insert new
    await supabase
      .from('favorites_routes')
      .delete()
      .eq('user_id', user.id);

    await supabase
      .from('favorites_routes')
      .insert({ user_id: user.id, route_slug: routeSlug });
  }

  // Return updated favorites
  return await getFavorites();
}

/**
 * Merge guest favorites into user account on login
 */
export async function mergeGuestFavorites(): Promise<void> {
  const user = await getCurrentUser();
  if (!user) return;

  const guestFavs = loadGuestFavorites();
  if (guestFavs.tools.length === 0 && guestFavs.routes.length === 0) return;

  const supabase = getSupabaseBrowserClient();

  // Upsert tools
  if (guestFavs.tools.length > 0) {
    const toolsToInsert = guestFavs.tools.map(toolSlug => ({
      user_id: user.id,
      tool_slug: toolSlug,
    }));

    // Insert, ignoring duplicates
    await supabase
      .from('favorites_tools')
      .upsert(toolsToInsert, { onConflict: 'user_id,tool_slug', ignoreDuplicates: true });
  }

  // Upsert routes
  if (guestFavs.routes.length > 0) {
    const routesToInsert = guestFavs.routes.map(routeSlug => ({
      user_id: user.id,
      route_slug: routeSlug,
    }));

    // Insert, ignoring duplicates
    await supabase
      .from('favorites_routes')
      .upsert(routesToInsert, { onConflict: 'user_id,route_slug', ignoreDuplicates: true });
  }

  // Clear guest favorites after merge
  clearGuestFavorites();
}

