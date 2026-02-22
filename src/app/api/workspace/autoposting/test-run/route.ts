import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { createAdminSupabase } from "@/lib/supabase/admin";

interface TestRunRequest {
  workspace_id: string;
  force_fail?: boolean;
}

export async function POST(req: NextRequest) {
  try {
    // 1. Auth check
    const supabase = await createClient();
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json(
        { error: "Unauthorized", code: "AUTH_REQUIRED" },
        { status: 401 }
      );
    }

    // 2. Parse body
    let body: TestRunRequest;
    try {
      body = await req.json();
    } catch {
      return NextResponse.json(
        { error: "Invalid JSON body", code: "INVALID_BODY" },
        { status: 400 }
      );
    }

    const { workspace_id, force_fail = false } = body;

    if (!workspace_id) {
      return NextResponse.json(
        { error: "workspace_id is required", code: "MISSING_WORKSPACE_ID" },
        { status: 400 }
      );
    }

    // 3. Check workspace membership
    const { data: membership, error: membershipError } = await supabase
      .from("workspace_members")
      .select("role, workspace_id")
      .eq("workspace_id", workspace_id)
      .eq("user_id", user.id)
      .maybeSingle();

    if (membershipError || !membership) {
      return NextResponse.json(
        { error: "Not a member of this workspace", code: "NOT_MEMBER" },
        { status: 403 }
      );
    }

    // 4. Get workspace details for entitlement check
    const { data: workspace, error: workspaceError } = await supabase
      .from("workspaces")
      .select("id, name, type")
      .eq("id", workspace_id)
      .single();

    if (workspaceError || !workspace) {
      return NextResponse.json(
        { error: "Workspace not found", code: "WORKSPACE_NOT_FOUND" },
        { status: 404 }
      );
    }

    // 5. Check entitlement
    // Company workspace: always allowed
    // Personal workspace: requires active subscription
    if (workspace.type === "personal") {
      const { data: subscription } = await supabase
        .from("workspace_subscriptions")
        .select("status")
        .eq("workspace_id", workspace_id)
        .limit(1)
        .maybeSingle();

      const isPaid = subscription?.status === "active";
      if (!isPaid) {
        return NextResponse.json(
          {
            error: "Personal workspace requires active subscription",
            code: "SUBSCRIPTION_REQUIRED",
          },
          { status: 402 }
        );
      }
    }

    // 6. Simulate autoposting run
    const startTime = Date.now();
    const adminSupabase = createAdminSupabase();

    let eventLogId: string | null = null;

    if (force_fail) {
      // Insert fail event
      const { data: insertedLog, error: insertError } = await adminSupabase
        .from("event_logs")
        .insert({
          event_type: "autoposting_fail",
          target_type: "autoposting",
          target_slug: "run",
          source: "workspace",
          user_id: user.id,
          anonymous_id: user.id,
          metadata: {
            workspace_id,
            run_type: "manual_test",
            provider: "n8n",
            status: "fail",
            error: "Forced fail for testing",
            debug: {
              request_id: crypto.randomUUID(),
              test_mode: true,
            },
          },
          created_at: new Date().toISOString(),
        })
        .select("id")
        .single();

      if (insertError) {
        console.error("[TestRun] Failed to insert fail event:", insertError);
        return NextResponse.json(
          {
            error: "Failed to log event",
            code: "EVENT_INSERT_FAILED",
            details: insertError.message,
          },
          { status: 500 }
        );
      }

      eventLogId = insertedLog.id;
    } else {
      // Insert success event
      const durationMs = Date.now() - startTime;

      const { data: insertedLog, error: insertError } = await adminSupabase
        .from("event_logs")
        .insert({
          event_type: "autoposting_success",
          target_type: "autoposting",
          target_slug: "run",
          source: "workspace",
          user_id: user.id,
          anonymous_id: user.id,
          metadata: {
            workspace_id,
            run_type: "manual_test",
            provider: "n8n",
            status: "success",
            duration_ms: durationMs,
            debug: {
              request_id: crypto.randomUUID(),
              test_mode: true,
            },
          },
          created_at: new Date().toISOString(),
        })
        .select("id")
        .single();

      if (insertError) {
        console.error("[TestRun] Failed to insert success event:", insertError);
        return NextResponse.json(
          {
            error: "Failed to log event",
            code: "EVENT_INSERT_FAILED",
            details: insertError.message,
          },
          { status: 500 }
        );
      }

      eventLogId = insertedLog.id;
    }

    // 7. Return success
    return NextResponse.json({
      ok: true,
      event_log_id: eventLogId,
      wrote: true,
      forced: force_fail ? "fail" : "success",
      workspace_id,
      workspace_name: workspace.name,
      user_id: user.id,
    });
  } catch (error) {
    console.error("[TestRun] Unexpected error:", error);
    return NextResponse.json(
      {
        error: "Internal server error",
        code: "INTERNAL_ERROR",
        details: error instanceof Error ? error.message : String(error),
      },
      { status: 500 }
    );
  }
}
