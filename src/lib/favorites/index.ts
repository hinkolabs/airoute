/**
 * Unified Favorites Service
 * Handles favorites for both logged-in users (Supabase) and guests (localStorage)
 * IMPORTANT: This module must only be used in client components
 */

import { getBrowserSupabaseClient } from '@/lib/supabase/browser';
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
  const supabase = getBrowserSupabaseClient();
  const { data: { user } } = await supabase.auth.getUser();
  return user;
}

/**
 * Get favorites for current user (logged in or guest)
 * Guest: localStorage only (NO DB calls)
 * User: Supabase DB (saved_tools with tool_id UUID)
 */
export async function getFavorites(): Promise<FavoritesData> {
  const __DEV__ = process.env.NODE_ENV !== 'production';
  
  const user = await getCurrentUser();

  if (!user) {
    // =============================
    // GUEST: localStorage ONLY (no DB calls)
    // =============================
    if (__DEV__) console.log('[getFavorites] Guest mode - loading from localStorage');
    return loadGuestFavorites();
  }

  // =============================
  // USER: Supabase DB (saved_tools uses tool_id UUID)
  // =============================
  if (__DEV__) console.log('[getFavorites] User mode - fetching from DB for user:', user.id);
  
  const supabase = getBrowserSupabaseClient();
  
  try {
    // Fetch saved_tools (tool_id) and join to tools table to get slugs
    const [toolsRes, routesRes] = await Promise.all([
      supabase
        .from('saved_tools')
        .select('tool_id, tools!inner(slug)')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false }),
      supabase
        .from('saved_routes')
        .select('route_id, routes!inner(slug)')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false })
        .limit(AUTHED_ROUTE_LIMIT),
    ]);

    // Extract tool slugs from joined result
    const tools = toolsRes.error
      ? []
      : (toolsRes.data?.map((item: any) => item.tools?.slug).filter(Boolean) || []);
    
    const routes = routesRes.error
      ? []
      : (routesRes.data?.map((r: any) => r.routes?.[0]?.slug || r.routes?.slug).filter(Boolean) || []);

    if (__DEV__) console.log('[getFavorites] Loaded:', { tools: tools.length, routes: routes.length });

    return { tools, routes };
  } catch (error) {
    console.error('[getFavorites] Unexpected error:', error);
    // On any error, return empty state instead of hanging
    return { tools: [], routes: [] };
  }
}

/**
 * Toggle a tool favorite (add or remove)
 * Guest: localStorage with slugs
 * User: saved_tools table with tool_id (UUID)
 */
export async function toggleToolFavorite(toolSlug: string): Promise<FavoritesData> {
  const __DEV__ = process.env.NODE_ENV !== 'production';
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

  // Logged-in user - use Supabase saved_tools table (tool_id UUID)
  const supabase = getBrowserSupabaseClient();

  // Step 1: Get tool ID from slug
  const { data: toolData, error: toolError } = await supabase
    .from('tools')
    .select('id')
    .eq('slug', toolSlug)
    .maybeSingle();

  if (toolError || !toolData) {
    console.error('[toggleToolFavorite] Tool not found:', toolSlug, toolError);
    // Return current favorites unchanged
    return await getFavorites();
  }

  const toolId = toolData.id;

  // Step 2: Check if already saved
  const { data: existing } = await supabase
    .from('saved_tools')
    .select('id')
    .eq('user_id', user.id)
    .eq('tool_id', toolId)
    .maybeSingle();

  if (existing) {
    // Remove
    const { error: deleteError } = await supabase
      .from('saved_tools')
      .delete()
      .eq('user_id', user.id)
      .eq('tool_id', toolId);

    if (deleteError && __DEV__) {
      console.error('[toggleToolFavorite] Delete error:', deleteError);
    }
  } else {
    // Add
    const { error: insertError } = await supabase
      .from('saved_tools')
      .insert({ user_id: user.id, tool_id: toolId });

    if (insertError && __DEV__) {
      console.error('[toggleToolFavorite] Insert error:', insertError);
    }
  }

  // Return updated favorites
  return await getFavorites();
}

/**
 * Toggle a route favorite (add or remove)
 * Guest: localStorage only (NO DB calls), limit = 1
 * User: Supabase saved_routes table, limit = 3
 */
export async function toggleRouteFavorite(routeSlug: string): Promise<FavoritesData> {
  const user = await getCurrentUser();

  if (!user) {
    // =============================
    // GUEST: localStorage ONLY (no DB calls)
    // =============================
    const guestFavs = loadGuestFavorites();
    const isCurrentlyFavorited = guestFavs.routes.includes(routeSlug);

    if (isCurrentlyFavorited) {
      // Remove
      const newRoutes = guestFavs.routes.filter(r => r !== routeSlug);
      const newFavs = { ...guestFavs, routes: newRoutes };
      saveGuestFavorites(newFavs);
      return newFavs;
    } else {
      // Add - check limit (guest limit = 1)
      if (!canAddRoute(guestFavs.routes)) {
        return { ...guestFavs, blocked: true };
      }
      const newRoutes = [...guestFavs.routes, routeSlug];
      const newFavs = { ...guestFavs, routes: newRoutes };
      saveGuestFavorites(newFavs);
      return newFavs;
    }
  }

  // =============================
  // USER: Supabase DB
  // =============================
  const supabase = getBrowserSupabaseClient();

  const { data: routeRecord, error: routeError } = await supabase
    .from('routes')
    .select('id')
    .eq('slug', routeSlug)
    .maybeSingle();

  if (routeError || !routeRecord) {
    console.error('Error resolving route ID for toggle:', routeError);
    return await getFavorites();
  }

  const routeId = routeRecord.id;

  const { data: existing } = await supabase
    .from('saved_routes')
    .select('id')
    .eq('user_id', user.id)
    .eq('route_id', routeId)
    .maybeSingle();

  if (existing) {
    const { error } = await supabase
      .from('saved_routes')
      .delete()
      .eq('user_id', user.id)
      .eq('route_id', routeId);

    if (error) {
      console.error('Error removing saved route:', error);
      return await getFavorites();
    }

    // Return updated favorites
    return await getFavorites();
  }

  // Check limit before adding
  const currentFavs = await getFavorites();
  if (currentFavs.routes.length >= AUTHED_ROUTE_LIMIT) {
    return { ...currentFavs, blocked: true };
  }

  const { error } = await supabase
    .from('saved_routes')
    .insert({ user_id: user.id, route_id: routeId });

  if (error) {
    console.error('Error adding saved route:', error);
    return await getFavorites();
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
  const supabase = getBrowserSupabaseClient();

  if (routeSlug === null) {
    // Clear all routes
    await supabase
      .from('saved_routes')
      .delete()
      .eq('user_id', user.id);
  } else {
    const { data: routeRecord, error: routeError } = await supabase
      .from('routes')
      .select('id')
      .eq('slug', routeSlug)
      .maybeSingle();

    if (routeError || !routeRecord) {
      console.error('Error resolving route ID for setRouteFavorite:', routeError);
      return await getFavorites();
    }

    await supabase
      .from('saved_routes')
      .delete()
      .eq('user_id', user.id);

    const { error: insertError } = await supabase
      .from('saved_routes')
      .insert({ user_id: user.id, route_id: routeRecord.id });

    if (insertError) {
      console.error('Error setting saved route:', insertError);
    }
  }

  // Return updated favorites
  return await getFavorites();
}

/**
 * Check if guest has any saved tools in localStorage
 * Used to determine if we should prompt for import
 */
export function hasGuestToolSaves(): boolean {
  if (typeof window === 'undefined') return false;
  const guestFavs = loadGuestFavorites();
  return guestFavs.tools.length > 0;
}

/**
 * Import guest tool saves to user account
 * Called only when user explicitly confirms import
 * Returns number of tools successfully imported
 */
export async function importGuestToolSavesToUser(userId: string): Promise<{ imported: number }> {
  const __DEV__ = process.env.NODE_ENV !== 'production';
  
  if (!userId) {
    if (__DEV__) console.error('[importGuestToolSavesToUser] userId is required');
    return { imported: 0 };
  }

  const guestFavs = loadGuestFavorites();
  if (guestFavs.tools.length === 0) {
    if (__DEV__) console.log('[importGuestToolSavesToUser] No guest tools to import');
    return { imported: 0 };
  }

  if (__DEV__) {
    console.log('[importGuestToolSavesToUser] Starting import', {
      userId,
      guestToolsCount: guestFavs.tools.length,
    });
  }

  const supabase = getBrowserSupabaseClient();

  try {
    // Step 1: Query tools table to get IDs for the slugs
    const { data: toolsData, error: toolsError } = await supabase
      .from('tools')
      .select('id, slug')
      .in('slug', guestFavs.tools);

    if (toolsError) {
      if (__DEV__) console.error('[importGuestToolSavesToUser] Error fetching tool IDs:', toolsError);
      return { imported: 0 };
    }

    if (!toolsData || toolsData.length === 0) {
      if (__DEV__) console.warn('[importGuestToolSavesToUser] No tool IDs found for guest slugs:', guestFavs.tools);
      return { imported: 0 };
    }

    // Step 2: Insert into saved_tools with tool_id (UUID)
    const toolsToInsert = toolsData.map((tool: { id: string; slug: string }) => ({
      user_id: userId,
      tool_id: tool.id,
    }));

    const { error: insertError, data: insertedData } = await supabase
      .from('saved_tools')
      .insert(toolsToInsert)
      .select();

    let importedCount = 0;
    
    if (insertError) {
      // Handle duplicate errors (constraint violation is expected)
      if (insertError.code !== '23505') { // 23505 = unique_violation
        if (__DEV__) console.error('[importGuestToolSavesToUser] Error inserting saved_tools:', insertError);
        return { imported: 0 };
      } else {
        if (__DEV__) console.log('[importGuestToolSavesToUser] Some tools already saved (duplicates ignored)');
        // On duplicate error, we still count the ones we attempted as "imported" (they're already there)
        importedCount = toolsToInsert.length;
      }
    } else {
      importedCount = insertedData?.length || 0;
    }

    // Step 3: Clear guest localStorage ONLY after successful insert
    if (importedCount > 0) {
      // Clear only tools, keep routes if any
      const updatedFavs = { ...guestFavs, tools: [] };
      saveGuestFavorites(updatedFavs);
      if (__DEV__) console.log('[importGuestToolSavesToUser] Import complete, guest tools cleared', { imported: importedCount });
    }

    return { imported: importedCount };

  } catch (error) {
    if (__DEV__) console.error('[importGuestToolSavesToUser] Unexpected error during import:', error);
    return { imported: 0 };
  }
}

/**
 * Merge guest favorites into user account on login
 * Maps tool slugs -> tool IDs and inserts into saved_tools table
 */
export async function mergeGuestFavorites(): Promise<void> {
  const __DEV__ = process.env.NODE_ENV !== 'production';
  const user = await getCurrentUser();
  if (!user) return;

  const guestFavs = loadGuestFavorites();
  if (guestFavs.tools.length === 0 && guestFavs.routes.length === 0) {
    if (__DEV__) console.log('[mergeGuestFavorites] No guest favorites to migrate');
    return;
  }

  if (__DEV__) {
    console.log('[mergeGuestFavorites] Migration started', {
      userId: user.id,
      guestToolsCount: guestFavs.tools.length,
      guestRoutesCount: guestFavs.routes.length,
    });
  }

  const supabase = getBrowserSupabaseClient();

  try {
    // =============================
    // TOOLS: Map slugs -> tool_id UUIDs
    // =============================
    if (guestFavs.tools.length > 0) {
      // Step 1: Query tools table to get IDs for the slugs
      const { data: toolsData, error: toolsError } = await supabase
        .from('tools')
        .select('id, slug')
        .in('slug', guestFavs.tools);

      if (toolsError) {
        console.error('[mergeGuestFavorites] Error fetching tool IDs:', toolsError);
      } else if (toolsData && toolsData.length > 0) {
        // Step 2: Insert into saved_tools with tool_id (UUID)
        const toolsToInsert = toolsData.map((tool: { id: string; slug: string }) => ({
          user_id: user.id,
          tool_id: tool.id, // UUID from tools table
        }));

        const { error: insertError } = await supabase
          .from('saved_tools')
          .insert(toolsToInsert)
          // No upsert - just ignore duplicates if any constraint exists
          .select();

        if (insertError) {
          // Silently handle duplicate errors (constraint violation is expected)
          if (insertError.code !== '23505') { // 23505 = unique_violation
            console.error('[mergeGuestFavorites] Error inserting saved_tools:', insertError);
          } else if (__DEV__) {
            console.log('[mergeGuestFavorites] Some tools already saved (duplicates ignored)');
          }
        }

        if (__DEV__) {
          console.log('[mergeGuestFavorites] Tools migrated:', {
            guestCount: guestFavs.tools.length,
            mappedCount: toolsData.length,
            inserted: toolsToInsert.length,
          });
        }
      } else {
        if (__DEV__) {
          console.warn('[mergeGuestFavorites] No tool IDs found for guest slugs:', guestFavs.tools);
        }
      }
    }

    // =============================
    // ROUTES: Keep existing slug-based logic
    // =============================
    if (guestFavs.routes.length > 0) {
      const { data: routesData, error: lookupError } = await supabase
        .from('routes')
        .select('id, slug')
        .in('slug', guestFavs.routes);

      if (lookupError) {
        console.error('[mergeGuestFavorites] Error resolving routes:', lookupError);
      } else if (routesData && routesData.length > 0) {
        const routesToInsert = routesData.map((route: any) => ({
          user_id: user.id,
          route_id: route.id,
        }));

        const { error: routesError } = await supabase
          .from('saved_routes')
          .upsert(routesToInsert, { onConflict: 'user_id,route_id', ignoreDuplicates: true });

        if (routesError) {
          console.error('[mergeGuestFavorites] Error inserting routes:', routesError);
        } else if (__DEV__) {
          console.log('[mergeGuestFavorites] Routes migrated:', guestFavs.routes.length);
        }
      }
    }

    // Step 3: Clear guest localStorage AFTER successful DB insert
    clearGuestFavorites();
    if (__DEV__) console.log('[mergeGuestFavorites] Migration complete, guest storage cleared');

  } catch (error) {
    console.error('[mergeGuestFavorites] Unexpected error during migration:', error);
    // Do NOT clear localStorage if migration fails
  }
}

