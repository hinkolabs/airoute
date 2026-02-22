import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

/**
 * Server-side sign out endpoint
 * Called after client-side signOut to ensure server cookies are cleared
 * 
 * This is CRITICAL for proper logout in Next.js App Router with @supabase/ssr
 * Client-side signOut alone doesn't clear server cookies, causing users to
 * appear logged in again on page refresh.
 */
export async function POST() {
  console.log('[auth/signout] Server signOut requested');
  
  try {
    const supabase = await createClient();
    const { error } = await supabase.auth.signOut();
    
    if (error) {
      console.error('[auth/signout] Supabase signOut error:', error);
      return NextResponse.json(
        { error: error.message },
        { status: 500 }
      );
    }
    
    console.log('[auth/signout] Server cookies cleared successfully');
    
    return NextResponse.json({ success: true });
  } catch (err) {
    console.error('[auth/signout] Exception:', err);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
