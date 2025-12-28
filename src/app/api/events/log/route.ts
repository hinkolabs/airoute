import { NextRequest, NextResponse } from 'next/server';
import { supabaseServerClient } from '@/lib/supabase/server';

// Allowed event types
const ALLOWED_EVENT_TYPES = [
  'route_outbound_click',
  'tool_click',
  'route_click',
  'guide_view',
  'save_action',
] as const;

// Allowed target types
const ALLOWED_TARGET_TYPES = ['route', 'tool', 'guide'] as const;

type EventType = typeof ALLOWED_EVENT_TYPES[number];
type TargetType = typeof ALLOWED_TARGET_TYPES[number];

interface EventLogPayload {
  event_type: EventType;
  target_type: TargetType;
  target_slug: string;
  source: string;
  anonymous_id: string;
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
    const body: EventLogPayload = await request.json();

    // Input validation
    if (!body.event_type || !ALLOWED_EVENT_TYPES.includes(body.event_type)) {
      return NextResponse.json(
        { ok: false, error: 'Invalid event_type' },
        { status: 400 }
      );
    }

    if (!body.target_type || !ALLOWED_TARGET_TYPES.includes(body.target_type)) {
      return NextResponse.json(
        { ok: false, error: 'Invalid target_type' },
        { status: 400 }
      );
    }

    if (!body.target_slug || typeof body.target_slug !== 'string') {
      return NextResponse.json(
        { ok: false, error: 'Invalid target_slug' },
        { status: 400 }
      );
    }

    if (!body.source || typeof body.source !== 'string') {
      return NextResponse.json(
        { ok: false, error: 'Invalid source' },
        { status: 400 }
      );
    }

    if (!body.anonymous_id || !isValidUUID(body.anonymous_id)) {
      return NextResponse.json(
        { ok: false, error: 'Invalid or missing anonymous_id (must be UUID)' },
        { status: 400 }
      );
    }

    if (body.metadata && typeof body.metadata !== 'object') {
      return NextResponse.json(
        { ok: false, error: 'metadata must be an object' },
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
      console.error('Event log insert error:', insertError);
      return NextResponse.json(
        { ok: false, error: 'Failed to log event' },
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

