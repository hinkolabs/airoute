import { createAdminSupabase } from "@/lib/supabase/admin";

export interface AutoPostingEventPayload {
  workspace_id: string;
  user_id: string;
  provider: "n8n" | "manual";
  run_type: "scheduled" | "manual";
  job_id?: string;
  duration_ms?: number;
  error?: string;
}

/**
 * Logs auto-posting success event to event_logs table
 */
export async function logAutoPostingSuccess(payload: AutoPostingEventPayload) {
  try {
    const supabase = createAdminSupabase();

    const { error } = await supabase.from("event_logs").insert({
      event_type: "autoposting_success",
      target_type: "autoposting",
      target_slug: "run",
      source: "workspace",
      user_id: payload.user_id,
      anonymous_id: payload.user_id, // Use user_id as anonymous_id
      metadata: {
        workspace_id: payload.workspace_id,
        provider: payload.provider,
        run_type: payload.run_type,
        status: "success",
        duration_ms: payload.duration_ms,
        job_id: payload.job_id,
      },
      created_at: new Date().toISOString(),
    });

    if (error) {
      console.error("[EventLogger] Failed to log autoposting_success:", error);
    }
  } catch (err) {
    console.error("[EventLogger] logAutoPostingSuccess exception:", err);
  }
}

/**
 * Logs auto-posting failure event to event_logs table
 */
export async function logAutoPostingFail(payload: AutoPostingEventPayload) {
  try {
    const supabase = createAdminSupabase();

    const { error } = await supabase.from("event_logs").insert({
      event_type: "autoposting_fail",
      target_type: "autoposting",
      target_slug: "run",
      source: "workspace",
      user_id: payload.user_id,
      anonymous_id: payload.user_id,
      metadata: {
        workspace_id: payload.workspace_id,
        provider: payload.provider,
        run_type: payload.run_type,
        status: "fail",
        error: payload.error || "Unknown error",
        job_id: payload.job_id,
      },
      created_at: new Date().toISOString(),
    });

    if (error) {
      console.error("[EventLogger] Failed to log autoposting_fail:", error);
    }
  } catch (err) {
    console.error("[EventLogger] logAutoPostingFail exception:", err);
  }
}
