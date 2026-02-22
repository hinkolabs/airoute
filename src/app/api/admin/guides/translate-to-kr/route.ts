import { NextResponse } from "next/server";
import { createAdminSupabase } from "@/lib/supabase/admin";
import { createClient } from "@/lib/supabase/server";
import OpenAI from "openai";

/**
 * Admin API: Translate EN guides to KR
 * 
 * POST /api/admin/guides/translate-to-kr
 * 
 * Fetches EN guides and creates KR versions via OpenAI translation
 */

const SYSTEM_PROMPT = `You are a professional translator specializing in AI tool content for Korean users.

RULES:
- Translate from English to Korean naturally and professionally
- Keep technical terms in English when appropriate (e.g., "AI", "ChatGPT", "Prompt")
- Make it beginner-friendly and clear
- Maintain the same tone and intent as the original
- Do NOT translate tool names or brand names
- Keep URLs, slugs, and technical identifiers unchanged
- Preserve markdown formatting in content

OUTPUT: Valid JSON only, no markdown code blocks.`;

interface TranslateGuideRequest {
  title: string;
  excerpt: string | null;
  content: string | null;
}

interface TranslateGuideResponse {
  title: string;
  excerpt: string;
  content: string;
}

async function translateGuide(
  openai: OpenAI,
  model: string,
  guide: TranslateGuideRequest
): Promise<TranslateGuideResponse> {
  const userPrompt = `Translate this guide to Korean:

Title: ${guide.title}
Excerpt: ${guide.excerpt || ""}
Content (markdown):
${guide.content || ""}

Return JSON:
{
  "title": "Korean translation of title",
  "excerpt": "Korean translation of excerpt",
  "content": "Korean translation of content (preserve markdown formatting)"
}`;

  const completion = await openai.chat.completions.create({
    model,
    messages: [
      { role: "system", content: SYSTEM_PROMPT },
      { role: "user", content: userPrompt },
    ],
    temperature: 0.5,
    max_tokens: 3000, // Guides can be longer
    response_format: { type: "json_object" },
  });

  const rawContent = completion.choices[0]?.message?.content;
  if (!rawContent) throw new Error("OpenAI returned empty response");

  const parsed = JSON.parse(rawContent);
  return parsed as TranslateGuideResponse;
}

export async function POST(req: Request) {
  // 1) Admin auth - check Supabase user + system_admins table (consistent with layout)
  try {
    const supabase = await createClient();
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json({ ok: false, error: "Unauthorized: Not logged in" }, { status: 401 });
    }

    // Check system_admin status
    const { data: systemAdminRow } = await supabase
      .from("system_admins")
      .select("user_id")
      .eq("user_id", user.id)
      .maybeSingle();

    if (!systemAdminRow) {
      return NextResponse.json({ ok: false, error: "Unauthorized: Not a system admin" }, { status: 403 });
    }
  } catch (err) {
    console.error("[translate-to-kr] Auth error:", err);
    return NextResponse.json({ ok: false, error: "Authentication failed" }, { status: 401 });
  }

  try {
    // 2) Check OpenAI enabled
    if (process.env.OPENAI_ENABLED !== "true") {
      return NextResponse.json(
        { ok: false, error: "OpenAI is disabled. Set OPENAI_ENABLED=true" },
        { status: 403 }
      );
    }

    const apiKey = process.env.OPENAI_API_KEY;
    if (!apiKey) {
      return NextResponse.json({ ok: false, error: "Missing OPENAI_API_KEY" }, { status: 500 });
    }

    const model = process.env.OPENAI_MODEL || "gpt-4o-mini";
    const supabase = createAdminSupabase();
    const openai = new OpenAI({ apiKey });

    // 3) Parse request body
    const body = await req.json().catch(() => ({}));
    const guideId = body.guideId as string | undefined;
    const forceRetranslate = body.forceRetranslate === true;
    const batchSize = body.batchSize ? Math.min(Math.max(1, body.batchSize), 10) : 10; // 1~10개, 기본 10개

    // 4) Fetch EN guides that need translation (same condition as /guides page)
    let guidesQuery = supabase
      .from("guides")
      .select("*")
      .eq("lang", "en")
      .eq("status", "published"); // Same as public /guides page

    if (guideId) {
      // Single guide mode
      guidesQuery = guidesQuery.eq("id", guideId);
    }

    const { data: guides, error: guidesError } = await guidesQuery;

    if (guidesError) {
      return NextResponse.json({ ok: false, error: guidesError.message }, { status: 500 });
    }

    if (!guides || guides.length === 0) {
      return NextResponse.json({ ok: false, error: "No guides found" }, { status: 404 });
    }

    // Limit to batch size to prevent timeout
    const guidesToProcess = guideId ? guides : guides.slice(0, batchSize);
    const totalGuides = guides.length;
    const willProcessCount = guidesToProcess.length;

    console.log(`[translate-to-kr] Total guides: ${totalGuides}, Will process: ${willProcessCount}, Batch size: ${batchSize}`);

    const results: Array<{
      id: string;
      slug: string;
      krSlug: string | null;
      translated: boolean;
      error?: string;
    }> = [];

    // 5) Process each guide with delay to avoid rate limits
    for (let i = 0; i < guidesToProcess.length; i++) {
      const guide = guidesToProcess[i];
      
      // Add delay between guides to avoid rate limits (except first)
      if (i > 0) {
        await new Promise(resolve => setTimeout(resolve, 5000)); // 5 second delay for safety
      }
      
      try {
        // Check if KR version already exists
        const krSlug = `${guide.slug}-kr`;
        const { data: existingKr } = await supabase
          .from("guides")
          .select("id, slug")
          .eq("slug", krSlug)
          .eq("lang", "kr")
          .single();

        let translated = false;
        let finalKrSlug = krSlug;

        if (!existingKr || forceRetranslate) {
          // Translate guide
          const translatedGuide = await translateGuide(openai, model, {
            title: guide.title,
            excerpt: guide.excerpt,
            content: guide.content,
          });

          if (existingKr && forceRetranslate) {
            // Update existing KR guide
            const { error: updateError } = await supabase
              .from("guides")
              .update({
                title: translatedGuide.title,
                excerpt: translatedGuide.excerpt,
                content: translatedGuide.content,
                updated_at: new Date().toISOString(),
              })
              .eq("id", existingKr.id);

            if (updateError) {
              console.error("[translate-to-kr] Guide update error:", updateError);
              throw updateError;
            }
            translated = true;
          } else {
            // Insert new KR guide - copy all relevant fields from EN guide
            const insertData: any = {
              slug: krSlug,
              title: translatedGuide.title,
              excerpt: translatedGuide.excerpt,
              content: translatedGuide.content,
              lang: "kr",
              status: guide.status,
              taxonomy: `${guide.slug}`, // Link to EN guide via taxonomy
            };

            // Copy published_at if status is published (constraint requirement)
            if (guide.status === 'published') {
              insertData.published_at = guide.published_at || new Date().toISOString();
            }

            // Copy all metadata fields from EN guide
            const metadataFields = [
              'guide_type',
              'primary_intent', 
              'primary_route',
              'cta_type',
              'cta_route_slug',
              'cta_tool_slug',
              'cta_partner',
              'generation_version',
              'route_slug',      // constraint 체크용 컬럼 추가
              'tool_slug',       // constraint 체크용 컬럼 추가
              'category',        // constraint 체크용 컬럼 추가
            ];

            for (const field of metadataFields) {
              if (guide[field] !== null && guide[field] !== undefined) {
                insertData[field] = guide[field];
              }
            }

            // Validate and fix constraint fields based on guide_type
            if (insertData.guide_type === 'route_based') {
              // route_based: route_slug 필수, tool_slug NULL
              if (!insertData.route_slug) {
                throw new Error(`원본 가이드(${guide.slug})에 route_slug 값이 없습니다. route_based 가이드는 route_slug가 필수입니다. 원본 가이드를 먼저 수정해주세요.`);
              }
              insertData.tool_slug = null;  // 반드시 NULL
            } else if (insertData.guide_type === 'tool_based') {
              // tool_based: tool_slug 필수, route_slug NULL
              if (!insertData.tool_slug) {
                throw new Error(`원본 가이드(${guide.slug})에 tool_slug 값이 없습니다. tool_based 가이드는 tool_slug가 필수입니다. 원본 가이드를 먼저 수정해주세요.`);
              }
              insertData.route_slug = null;  // 반드시 NULL
            } else if (insertData.guide_type === 'theme') {
              // theme: category 필수, route_slug/tool_slug NULL
              if (!insertData.category) {
                throw new Error(`원본 가이드(${guide.slug})에 category 값이 없습니다. theme 가이드는 category가 필수입니다. 원본 가이드를 먼저 수정해주세요.`);
              }
              insertData.route_slug = null;  // 반드시 NULL
              insertData.tool_slug = null;   // 반드시 NULL
            }

            const { data: newGuide, error: insertError } = await supabase
              .from("guides")
              .insert(insertData)
              .select("slug")
              .single();

            if (insertError) {
              console.error("[translate-to-kr] Guide insert error:", insertError);
              // Provide more detailed error info
              throw new Error(`DB Insert Error: ${insertError.message}${insertError.code ? ` (Code: ${insertError.code})` : ''}${insertError.details ? ` - ${insertError.details}` : ''}${insertError.hint ? ` - Hint: ${insertError.hint}` : ''}`);
            }
            
            if (newGuide) {
              finalKrSlug = newGuide.slug;
            }
            translated = true;
          }
        }

        results.push({
          id: guide.id,
          slug: guide.slug,
          krSlug: finalKrSlug,
          translated,
        });
      } catch (err: unknown) {
        const errorMessage = err instanceof Error 
          ? err.message 
          : JSON.stringify(err);
        console.error(`[translate-to-kr] Error for guide ${guide.slug}:`, err);
        results.push({
          id: guide.id,
          slug: guide.slug,
          krSlug: null,
          translated: false,
          error: errorMessage,
        });
      }
    }

    return NextResponse.json({
      ok: true,
      processed: results.length,
      total: totalGuides,
      remaining: totalGuides - willProcessCount,
      hasMore: totalGuides > willProcessCount,
      results,
    });
  } catch (e: unknown) {
    const message = e instanceof Error ? e.message : "Unknown error";
    return NextResponse.json({ ok: false, error: message }, { status: 500 });
  }
}
