import { NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';
import { DbTool } from '@/types/db-tool';

export async function GET() {
  try {
    const { data, error } = await supabase
      .from('tools')
      .select('*')
      .order('manual_rank', { ascending: true })
      .order('rank_in_task', { ascending: true })
      .order('created_at', { ascending: false });

    if (error) {
      console.error('Supabase error:', error);
      return NextResponse.json(
        { error: 'Failed to fetch tools' },
        { status: 500 }
      );
    }

    return NextResponse.json(data as DbTool[]);
  } catch (error) {
    console.error('Server error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}








