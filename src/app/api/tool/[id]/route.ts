import { NextRequest, NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';
import { DbTool } from '@/types/db-tool';
import { DbPrompt } from '@/types/db-prompt';

interface ToolDetailResponse extends DbTool {
  prompts?: DbPrompt[];
}

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;

    const { data: tool, error: toolError } = await supabase
      .from('tools')
      .select('*')
      .eq('id', id)
      .single();

    if (toolError) {
      console.error('Supabase tool error:', toolError);
      return NextResponse.json(
        { error: 'Tool not found' },
        { status: 404 }
      );
    }

    const { data: prompts, error: promptsError } = await supabase
      .from('prompts')
      .select('*')
      .eq('tool_id', id)
      .order('created_at', { ascending: false });

    if (promptsError) {
      console.error('Supabase prompts error:', promptsError);
    }

    const response: ToolDetailResponse = {
      ...tool,
      prompts: prompts || [],
    };

    return NextResponse.json(response);
  } catch (error) {
    console.error('Server error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

