import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import OpenAI from "openai";
import { getDemoMode } from "@/lib/flags";

// Force dynamic rendering
export const dynamic = "force-dynamic";

/**
 * POST /api/workspace/tone-profile
 * Analyzes user's writing sample and returns tone profile
 * Body: { workspace_id, text }
 * 
 * Security:
 * - Requires authenticated user
 * - User must be member of workspace
 * - Text must be >= 500 chars
 * - Pro entitlement check (TODO: enforce when ready)
 */
export async function POST(req: NextRequest) {
  if (await getDemoMode()) {
    return new NextResponse(null, { status: 404 });
  }
  
  try {
    const supabase = await createClient();
    const { data: { user }, error: authError } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json({ ok: false, error: "인증되지 않았습니다" }, { status: 401 });
    }

    // Parse body
    const body = await req.json();
    const { workspace_id, text } = body;

    // Validate inputs
    if (!workspace_id || typeof workspace_id !== "string") {
      return NextResponse.json({ ok: false, error: "workspace_id가 필요합니다" }, { status: 400 });
    }

    if (!text || typeof text !== "string") {
      return NextResponse.json({ ok: false, error: "text가 필요합니다" }, { status: 400 });
    }

    if (text.length < 500) {
      return NextResponse.json({ ok: false, error: "텍스트는 500자 이상이어야 합니다" }, { status: 400 });
    }

    // Verify user is a member of this workspace (security check)
    const { data: membership, error: membershipError } = await supabase
      .from("workspace_members")
      .select("role")
      .eq("workspace_id", workspace_id)
      .eq("user_id", user.id)
      .single();

    if (membershipError || !membership) {
      return NextResponse.json({ ok: false, error: "워크스페이스 접근 권한이 없습니다" }, { status: 403 });
    }

    // TODO: Add Pro entitlement check when subscription system is ready
    // For now, allow all workspace members to use this feature for testing
    // const hasProEntitlement = await checkProEntitlement(workspace_id);
    // if (!hasProEntitlement) {
    //   return NextResponse.json({ ok: false, error: "Pro 플랜이 필요합니다" }, { status: 403 });
    // }

    // Check if OpenAI is enabled
    if (process.env.OPENAI_ENABLED !== "true") {
      return NextResponse.json(
        { ok: false, error: "OpenAI 분석이 비활성화되어 있습니다" },
        { status: 403 }
      );
    }

    // Check API key
    const apiKey = process.env.OPENAI_API_KEY;
    if (!apiKey) {
      return NextResponse.json(
        { ok: false, error: "OpenAI API 키가 설정되지 않았습니다" },
        { status: 500 }
      );
    }

    // Call OpenAI to analyze tone
    const openai = new OpenAI({ apiKey });
    const model = process.env.OPENAI_MODEL || "gpt-4o-mini";

    const systemPrompt = `당신은 한국어 글쓰기 스타일 분석 전문가입니다.

사용자가 제공한 텍스트를 분석하여 다음을 추출하세요:
1. tone_summary: 말투/문체의 전반적인 특징 (2-3문장, 한국어)
2. do_list: 이 말투에서 자주 쓰이는 표현이나 스타일 (2-3개, 각 항목 1문장, 한국어)
3. dont_list: 이 말투에서 피하는 표현이나 스타일 (2-3개, 각 항목 1문장, 한국어)
4. sample_phrases: 원문에서 가장 특징적인 문장 1-2개 (그대로 인용, 한국어)

OUTPUT: 반드시 유효한 JSON만 출력하세요. 마크다운 코드 블록 없이 순수 JSON만 출력하세요.`;

    const userPrompt = `다음 텍스트의 말투/문체를 분석해주세요:

---
${text.slice(0, 2000)}
---

JSON 형식으로 반환:
{
  "tone_summary": "string",
  "do_list": ["string", "string"],
  "dont_list": ["string", "string"],
  "sample_phrases": ["string", "string"]
}`;

    const completion = await openai.chat.completions.create({
      model,
      messages: [
        { role: "system", content: systemPrompt },
        { role: "user", content: userPrompt },
      ],
      temperature: 0.5,
      max_tokens: 1000,
      response_format: { type: "json_object" },
    });

    const rawContent = completion.choices[0]?.message?.content;
    if (!rawContent) {
      throw new Error("OpenAI가 빈 응답을 반환했습니다");
    }

    let profile: {
      tone_summary: string;
      do_list: string[];
      dont_list: string[];
      sample_phrases: string[];
    };

    try {
      profile = JSON.parse(rawContent);
    } catch {
      throw new Error(`OpenAI JSON 파싱 실패: ${rawContent.slice(0, 200)}`);
    }

    // Validate required fields
    if (!profile.tone_summary || !profile.do_list || !profile.dont_list || !profile.sample_phrases) {
      throw new Error("OpenAI 응답에 필수 필드가 없습니다");
    }

    // Optionally save to DB (tone_profile_json column)
    // This allows persistence for future use
    try {
      const { error: updateError } = await supabase
        .from("user_marketing_settings")
        .upsert({
          workspace_id,
          user_id: user.id,
          tone_profile_json: profile,
        }, {
          onConflict: "workspace_id,user_id",
          ignoreDuplicates: false,
        });

      if (updateError) {
        console.error("[tone-profile] Failed to save tone_profile_json:", updateError);
        // Non-fatal: continue even if DB save fails
      }
    } catch (dbErr) {
      console.error("[tone-profile] DB save error:", dbErr);
      // Non-fatal
    }

    return NextResponse.json({
      ok: true,
      profile,
    });
  } catch (error: any) {
    console.error("[API] POST /api/workspace/tone-profile error:", {
      message: error?.message,
      details: error?.details,
      hint: error?.hint,
      code: error?.code,
    });

    // Return user-friendly error
    const userMessage = error?.message?.includes("OpenAI") 
      ? error.message 
      : "분석 중 오류가 발생했습니다";

    return NextResponse.json(
      { ok: false, error: userMessage },
      { status: 500 }
    );
  }
}
