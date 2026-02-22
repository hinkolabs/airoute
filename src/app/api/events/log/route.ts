import { NextRequest, NextResponse } from 'next/server';
import { supabaseServerClient } from '@/lib/supabase/server';

// Allowed event types
const ALLOWED_EVENT_TYPES = [
  'route_outbound_click',
  'tool_click',
  'route_click',
  'guide_view',
  'save_action',
  'auth_sign_in',
  'auth_sign_out',
] as const;

// Allowed target types
const ALLOWED_TARGET_TYPES = ['route', 'tool', 'guide', 'auth'] as const;

type EventType = typeof ALLOWED_EVENT_TYPES[number];
type TargetType = typeof ALLOWED_TARGET_TYPES[number];

interface EventLogPayload {
  event_type: EventType;
  target_type: TargetType;
  target_slug: string;
  source: string;
  anonymous_id: string;
  user_id?: string; // Optional: client may send it for logging purposes (ignored in DB insert)
  metadata?: Record<string, any>;
}

// Simple UUID v4 validation (basic format check)
function isValidUUID(str: string): boolean {
  const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
  return uuidRegex.test(str);
}

/**
 * POST /api/events/log
 * 
 * Log user events to event_logs table in DB
 * No PII collected (IP, user agent, fingerprint)
 * User ID is derived server-side from Supabase auth session if logged in
 */
export async function POST(request: NextRequest) {
  try {
    const body = (await request.json().catch(() => ({}))) as Partial<EventLogPayload>;

    // Incognito / storage-restricted environments can omit anonymous_id.
    // Fall back to user_id when available (Supabase UUID) and keep logging best-effort.
    const effectiveAnonymousId =
      (typeof body?.anonymous_id === 'string' && body.anonymous_id.trim()
        ? body.anonymous_id.trim()
        : null) ||
      (typeof body?.user_id === 'string' && body.user_id.trim() ? body.user_id.trim() : null);

    if (!effectiveAnonymousId) {
      // Unable to identify caller; silently skip logging.
      return new NextResponse(null, { status: 204 });
    }

    // Ensure downstream logic always has anonymous_id (DB requires NOT NULL)
    if (!body.anonymous_id) {
      body.anonymous_id = effectiveAnonymousId;
    }

    // Log incoming request
    console.log('[api/events] incoming', {
      event_type: body.event_type,
      source: body.source,
      user_id: body.user_id,
      anonymous_id: body.anonymous_id,
    });

    // Collect missing fields for detailed error response
    const missingFields: string[] = [];

    // Input validation
    if (!body.event_type || !ALLOWED_EVENT_TYPES.includes(body.event_type)) {
      missingFields.push('event_type');
    }

    if (!body.target_type || !ALLOWED_TARGET_TYPES.includes(body.target_type)) {
      missingFields.push('target_type');
    }

    if (!body.target_slug || typeof body.target_slug !== 'string') {
      missingFields.push('target_slug');
    }

    if (!body.source || typeof body.source !== 'string') {
      missingFields.push('source');
    }

    if (!body.anonymous_id || !isValidUUID(body.anonymous_id)) {
      missingFields.push('anonymous_id');
    }

    if (body.metadata !== undefined && typeof body.metadata !== 'object') {
      missingFields.push('metadata (must be object)');
    }

    // Return 400 if any required fields are missing
    if (missingFields.length > 0) {
      return NextResponse.json(
        { error: 'missing_fields', fields: missingFields },
        { status: 400 }
      );
    }

    // Get user_id from Supabase auth session (server-side only)
    // DO NOT trust client-provided user_id
    const { data: { user } } = await supabaseServerClient.auth.getUser();
    const userId = user?.id || null;

    // Get country from headers if available (Vercel or Cloudflare)
    // Do NOT store IP address - only country code
    const country = request.headers.get('x-vercel-ip-country') || 
                    request.headers.get('cf-ipcountry') || 
                    null;

    // Merge country into metadata if available
    const finalMetadata = {
      ...(body.metadata || {}),
      ...(country && country !== 'XX' ? { country } : {}), // Skip unknown country codes
    };

    // Insert into event_logs
    const { error: insertError } = await supabaseServerClient
      .from('event_logs')
      .insert({
        event_type: body.event_type,
        target_type: body.target_type,
        target_slug: body.target_slug,
        source: body.source,
        user_id: userId,
        anonymous_id: body.anonymous_id,
        metadata: finalMetadata,
      });

    if (insertError) {
      console.error('[api/events] insert error', {
        message: insertError?.message,
        code: insertError?.code,
        details: insertError?.details,
        hint: insertError?.hint,
      });
      return NextResponse.json(
        {
          error: 'insert_failed',
          message: insertError?.message,
          code: insertError?.code,
        },
        { status: 500 }
      );
    }

    return NextResponse.json({ ok: true });

  } catch (error) {
    console.error('Event log API error:', error);
    return NextResponse.json(
      { ok: false, error: 'Internal server error' },
      { status: 500 }
    );
  }
}

