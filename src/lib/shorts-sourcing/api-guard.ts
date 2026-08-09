/**
 * Shared auth/membership helpers for the shorts-sourcing API routes.
 * Keeps the "auth -> workspace access" boilerplate in one place since almost
 * every route in src/app/api/shorts-sourcing/* needs it.
 *
 * Two auth modes are supported side by side:
 * 1. Legacy ADMIN_KEY cookie (same cookie set by /admin/login, see src/app/api/admin/auth).
 *    userId is null in this mode; all data is scoped to SHORTS_SOURCING_ADMIN_WORKSPACE_ID.
 * 2. Real Supabase-authenticated user + workspace membership (kept for when/if this
 *    feature is opened up to regular customer workspaces later).
 */

import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { createClient } from "@/lib/supabase/server";
import { createAdminSupabase } from "@/lib/supabase/admin";

export interface AuthedContext {
  userId: string | null;
  admin: ReturnType<typeof createAdminSupabase>;
}

async function hasLegacyAdminCookie(): Promise<boolean> {
  const adminKey = process.env.ADMIN_KEY;
  if (!adminKey) return false;
  const cookieStore = await cookies();
  return cookieStore.get("airoute_admin")?.value === adminKey;
}

/** Resolves the current caller via legacy ADMIN_KEY cookie or Supabase auth, or returns a 401 response. */
export async function requireUser(): Promise<AuthedContext | NextResponse> {
  if (await hasLegacyAdminCookie()) {
    return { userId: null, admin: createAdminSupabase() };
  }

  const supabase = await createClient();
  const { data: { user }, error } = await supabase.auth.getUser();
  if (error || !user) {
    return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  }
  return { userId: user.id, admin: createAdminSupabase() };
}

/**
 * Resolves which workspace to write NEW data into.
 * - Admin-key mode (userId === null): always SHORTS_SOURCING_ADMIN_WORKSPACE_ID, ignores requestedWorkspaceId.
 * - User mode: requires requestedWorkspaceId and verifies membership.
 */
export async function resolveWorkspaceId(
  ctx: AuthedContext,
  requestedWorkspaceId?: string | null
): Promise<{ workspaceId: string } | NextResponse> {
  if (ctx.userId === null) {
    const adminWorkspaceId = process.env.SHORTS_SOURCING_ADMIN_WORKSPACE_ID;
    if (!adminWorkspaceId) {
      return NextResponse.json({ error: "admin_workspace_not_configured" }, { status: 500 });
    }
    return { workspaceId: adminWorkspaceId };
  }

  if (!requestedWorkspaceId) {
    return NextResponse.json({ error: "workspace_id is required" }, { status: 400 });
  }

  const { data: membership } = await ctx.admin
    .from("workspace_members")
    .select("role")
    .eq("workspace_id", requestedWorkspaceId)
    .eq("user_id", ctx.userId)
    .maybeSingle();

  if (!membership) {
    return NextResponse.json({ error: "not_a_member" }, { status: 403 });
  }
  return { workspaceId: requestedWorkspaceId };
}

/** Verifies ctx may access an already-existing record that belongs to workspaceId. */
async function verifyWorkspaceAccess(
  ctx: AuthedContext,
  workspaceId: string
): Promise<true | NextResponse> {
  if (ctx.userId === null) {
    const adminWorkspaceId = process.env.SHORTS_SOURCING_ADMIN_WORKSPACE_ID;
    if (workspaceId !== adminWorkspaceId) {
      return NextResponse.json({ error: "not_a_member" }, { status: 403 });
    }
    return true;
  }

  const { data: membership } = await ctx.admin
    .from("workspace_members")
    .select("role")
    .eq("workspace_id", workspaceId)
    .eq("user_id", ctx.userId)
    .maybeSingle();

  if (!membership) {
    return NextResponse.json({ error: "not_a_member" }, { status: 403 });
  }
  return true;
}

/** Verifies the caller may access workspaceId (client-provided, e.g. history/favorites list). */
export async function requireWorkspaceMember(
  ctx: AuthedContext,
  workspaceId: string
): Promise<{ workspaceId: string } | NextResponse> {
  const ok = await verifyWorkspaceAccess(ctx, workspaceId);
  if (ok !== true) return ok;
  return { workspaceId };
}

/**
 * Looks up which workspace a sourcing session belongs to, and verifies the current
 * caller may access it. Returns the workspace_id, or an error response.
 */
export async function requireSessionAccess(
  ctx: AuthedContext,
  sessionId: string
): Promise<{ workspaceId: string } | NextResponse> {
  const { data: session } = await ctx.admin
    .from("shorts_sourcing_sessions")
    .select("workspace_id")
    .eq("id", sessionId)
    .maybeSingle();

  if (!session) {
    return NextResponse.json({ error: "session_not_found" }, { status: 404 });
  }

  const ok = await verifyWorkspaceAccess(ctx, session.workspace_id);
  if (ok !== true) return ok;
  return { workspaceId: session.workspace_id };
}

/**
 * Looks up which workspace a source item belongs to, and verifies the current
 * caller may access it. Returns the workspace_id, or an error response.
 */
export async function requireSourceItemAccess(
  ctx: AuthedContext,
  sourceItemId: string
): Promise<{ workspaceId: string } | NextResponse> {
  const { data: item } = await ctx.admin
    .from("shorts_source_items")
    .select("workspace_id")
    .eq("id", sourceItemId)
    .maybeSingle();

  if (!item) {
    return NextResponse.json({ error: "source_item_not_found" }, { status: 404 });
  }

  const ok = await verifyWorkspaceAccess(ctx, item.workspace_id);
  if (ok !== true) return ok;
  return { workspaceId: item.workspace_id };
}

export function isErrorResponse(value: unknown): value is NextResponse {
  return value instanceof NextResponse;
}
