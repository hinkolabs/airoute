/**
 * Event Logger - Client-side utility for logging events to DB
 * 
 * Uses navigator.sendBeacon (with fetch keepalive fallback)
 * Manages anonymous_id in localStorage
 * No PII collection (IP, user agent, fingerprint)
 */

const ANONYMOUS_ID_KEY = 'airoute_anonymous_id';
const API_ENDPOINT = '/api/events/log';

type EventType = 'route_outbound_click' | 'tool_click' | 'route_click' | 'guide_view' | 'save_action';
type TargetType = 'route' | 'tool' | 'guide';

interface EventLogPayload {
  event_type: EventType;
  target_type: TargetType;
  target_slug: string;
  source: string;
  anonymous_id: string;
  metadata?: Record<string, any>;
}

/**
 * Get device type based on viewport width
 * <768px: mobile, <1024px: tablet, else: desktop
 */
function getDeviceType(): string {
  if (typeof window === 'undefined') return 'unknown';
  
  const width = window.innerWidth;
  if (width < 768) return 'mobile';
  if (width < 1024) return 'tablet';
  return 'desktop';
}

/**
 * Get device metadata without collecting PII
 */
function getDeviceMetadata(): Record<string, any> {
  if (typeof window === 'undefined') {
    return {};
  }

  return {
    device_type: getDeviceType(),
    viewport_w: window.innerWidth,
    viewport_h: window.innerHeight,
  };
}

/**
 * Get or create anonymous_id from localStorage
 */
function getAnonymousId(): string {
  if (typeof window === 'undefined') {
    // SSR - generate temporary ID (won't be stored)
    return crypto.randomUUID();
  }

  try {
    let anonymousId = localStorage.getItem(ANONYMOUS_ID_KEY);
    
    if (!anonymousId) {
      anonymousId = crypto.randomUUID();
      localStorage.setItem(ANONYMOUS_ID_KEY, anonymousId);
    }
    
    return anonymousId;
  } catch (error) {
    // localStorage not available (private mode, etc.)
    console.warn('localStorage unavailable, generating temporary anonymous_id');
    return crypto.randomUUID();
  }
}

/**
 * Send event log to DB without blocking navigation
 * Uses sendBeacon if available, fallback to fetch with keepalive
 */
export function logEventToDB(payload: Omit<EventLogPayload, 'anonymous_id'>): void {
  if (typeof window === 'undefined') {
    return; // Skip during SSR
  }

  try {
    const anonymousId = getAnonymousId();
    const deviceMetadata = getDeviceMetadata();
    
    const fullPayload: EventLogPayload = {
      ...payload,
      anonymous_id: anonymousId,
      metadata: {
        ...deviceMetadata,
        ...(payload.metadata || {}),
      },
    };

    const data = JSON.stringify(fullPayload);

    // Try sendBeacon first (most reliable for navigation)
    if (navigator.sendBeacon) {
      const blob = new Blob([data], { type: 'application/json' });
      const sent = navigator.sendBeacon(API_ENDPOINT, blob);
      
      if (sent) {
        return; // Successfully queued
      }
      // If sendBeacon fails, fall through to fetch
    }

    // Fallback: fetch with keepalive
    fetch(API_ENDPOINT, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: data,
      keepalive: true, // Important: ensures request completes even if page unloads
    }).catch((error) => {
      // Silent failure - don't block user navigation
      console.debug('Event log failed:', error);
    });

  } catch (error) {
    // Silent failure - don't break user experience
    console.debug('Event log error:', error);
  }
}

