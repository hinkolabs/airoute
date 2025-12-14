import { NextResponse } from 'next/server';
import { supabaseServerClient } from '@/lib/supabase/server';

// Tool seed data
const SEED_TOOLS = [
  {
    id: 'leonardo-ai',
    name: 'Leonardo AI',
    affiliate_url: 'https://leonardo.ai',
    desc_en: 'Create production-quality visual assets for your projects with unprecedented quality, speed, and style-consistency.',
    desc_simple_en: 'AI-powered image generation for game assets and concept art',
    task_category: 'image',
    best_for: 'Game Assets & Concept Art',
    tags: ['Game Assets', 'Concept Art', 'High Quality'],
    manual_rank: 2,
    rank_in_task: 2,
    why_pick: 'Great for concept art and game assets with lots of presets and templates to start from.',
  },
  {
    id: 'canva',
    name: 'Canva',
    affiliate_url: 'https://www.canva.com',
    desc_en: 'A user-friendly design tool with powerful AI features (Magic Studio) for creating social media graphics, presentations, and more.',
    desc_simple_en: 'Beginner-friendly design tool with AI-powered templates',
    task_category: 'image',
    best_for: 'Social Media & Templates',
    tags: ['Beginner Friendly', 'Templates', 'All-in-one'],
    manual_rank: 3,
    rank_in_task: 3,
    why_pick: 'Template-based design tool that makes thumbnails and posters easy, even if you\'re not a designer.',
  },
];

export async function GET() {
  try {
    const results = [];

    for (const tool of SEED_TOOLS) {
      // Check if tool already exists
      const { data: existing } = await supabaseServerClient
        .from('tools')
        .select('id')
        .eq('id', tool.id)
        .single();

      if (existing) {
        // Update existing tool
        const { error: updateError } = await supabaseServerClient
          .from('tools')
          .update({
            name: tool.name,
            affiliate_url: tool.affiliate_url,
            desc_en: tool.desc_en,
            desc_simple_en: tool.desc_simple_en,
            task_category: tool.task_category,
            best_for: tool.best_for,
            tags: tool.tags,
            manual_rank: tool.manual_rank,
            rank_in_task: tool.rank_in_task,
            why_pick: tool.why_pick,
          })
          .eq('id', tool.id);

        if (updateError) {
          results.push({ id: tool.id, status: 'error', error: updateError.message });
        } else {
          results.push({ id: tool.id, status: 'updated' });
        }
      } else {
        // Insert new tool
        const { error: insertError } = await supabaseServerClient
          .from('tools')
          .insert(tool);

        if (insertError) {
          results.push({ id: tool.id, status: 'error', error: insertError.message });
        } else {
          results.push({ id: tool.id, status: 'inserted' });
        }
      }
    }

    return NextResponse.json({
      message: 'Tool seed completed',
      results,
    });
  } catch (error) {
    console.error('Tool seed error:', error);
    return NextResponse.json(
      { error: 'Failed to seed tools' },
      { status: 500 }
    );
  }
}

