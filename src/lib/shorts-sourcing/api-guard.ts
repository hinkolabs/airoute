/**
 * Shared auth/membership helpers for the shorts-sourcing API routes.
 * Keeps the "auth -> workspace membership" boilerplate in one place since almost
 * every route in src/app/api/shorts-sourcing/* needs it.
 */

import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { createAdminSupabase } from "@/lib/supabase/admin";

export interface AuthedContext {
  user: { id: string };
  admin: ReturnType<typeof createAdminSupabase>;
}

/** Resolves the current authenticated user, or returns a 401 response. */
export async function requireUser(): Promise<AuthedContext | NextResponse> {
  const supabase = await createClient();
  const { data: { user }, error } = await supabase.auth.getUser();
  if (error || !user) {
    return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  }
  return { user, admin: createAdminSupabase() };
}

/** Verifies the user is a member of workspaceId. Returns the role, or a 403 response. */
export async function requireWorkspaceMember(
  admin: AuthedContext["admin"],
  workspaceId: string,
  userId: string
): Promise<{ role: string } | NextResponse> {
  const { data: membership } = await admin
    .from("workspace_members")
    .select("role")
    .eq("workspace_id", workspaceId)
    .eq("user_id", userId)
    .maybeSingle();

  if (!membership) {
    return NextResponse.json({ error: "not_a_member" }, { status: 403 });
  }
  return membership;
}

/**
 * Looks up which workspace a sourcing session belongs to, and verifies the current
 * user is a member of that workspace. Returns the workspace_id, or an error response.
 */
export async function requireSessionAccess(
  admin: AuthedContext["admin"],
  sessionId: string,
  userId: string
): Promise<{ workspaceId: string } | NextResponse> {
  const { data: session } = await admin
    .from("shorts_sourcing_sessions")
    .select("workspace_id")
    .eq("id", sessionId)
    .maybeSingle();

  if (!session) {
    return NextResponse.json({ error: "session_not_found" }, { status: 404 });
  }

  const membership = await requireWorkspaceMember(admin, session.workspace_id, userId);
  if (membership instanceof NextResponse) return membership;

  return { workspaceId: session.workspace_id };
}

/**
 * Looks up which workspace a source item belongs to, and verifies the current
 * user is a member of that workspace. Returns the workspace_id, or an error response.
 */
export async function requireSourceItemAccess(
  admin: AuthedContext["admin"],
  sourceItemId: string,
  userId: string
): Promise<{ workspaceId: string } | NextResponse> {
  const { data: item } = await admin
    .from("shorts_source_items")
    .select("workspace_id")
    .eq("id", sourceItemId)
    .maybeSingle();

  if (!item) {
    return NextResponse.json({ error: "source_item_not_found" }, { status: 404 });
  }

  const membership = await requireWorkspaceMember(admin, item.workspace_id, userId);
  if (membership instanceof NextResponse) return membership;

  return { workspaceId: item.workspace_id };
}

export function isErrorResponse(value: unknown): value is NextResponse {
  return value instanceof NextResponse;
}
