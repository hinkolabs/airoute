import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { getDemoMode } from "@/lib/flags";
import OpenAI from "openai";

export const dynamic = "force-dynamic";

const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

const TYPE_LABEL: Record<string, string> = {
  review_reply: "고객 리뷰 답변",
  inquiry_reply: "고객 문의 답변",
  claim_response: "컴플레인/클레임 대응",
};

// POST /api/workspace/cs-support/generate
// Body: { workspace_id, type: "review_reply"|"inquiry_reply"|"claim_response", input_text }
export async function POST(request: NextRequest) {
  if (await getDemoMode()) {
    return new NextResponse(null, { status: 404 });
  }

  try {
    const supabase = await createClient();

    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json({ error: "unauthorized" }, { status: 401 });
    }

    const body = await request.json();
    const { workspace_id, type, input_text } = body;

    if (!workspace_id || !type || !input_text?.trim()) {
      return NextResponse.json(
        { error: "workspace_id, type, and input_text are required" },
        { status: 400 }
      );
    }

    if (!Object.keys(TYPE_LABEL).includes(type)) {
      return NextResponse.json({ error: "invalid type" }, { status: 400 });
    }

    // Verify membership
    const { data: membershipRow } = await supabase
      .from("workspace_members")
      .select("role")
      .eq("workspace_id", workspace_id)
      .eq("user_id", user.id)
      .limit(1)
      .maybeSingle();

    if (!membershipRow) {
      return NextResponse.json({ error: "not_a_member" }, { status: 403 });
    }

    // Fetch manager settings (brand_name, company_profile, company_role)
    const { data: managerSettings } = await supabase
      .from("workspace_manager_settings")
      .select("brand_name, company_profile, company_role")
      .eq("workspace_id", workspace_id)
      .maybeSingle();

    // Fetch user tone profile
    const { data: userSettings } = await supabase
      .from("user_marketing_settings")
      .select("tone_profile_json, tone_preset, tone_example")
      .eq("workspace_id", workspace_id)
      .eq("user_id", user.id)
      .maybeSingle();

    // Deduct 10 credits before generation
    const consumeRes = await fetch(
      new URL("/api/credits/consume", request.url).toString(),
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          // Forward cookies so the consume route can auth the user
          cookie: request.headers.get("cookie") ?? "",
        },
        body: JSON.stringify({
          workspace_id,
          feature_key: "cs_support_generate",
          amount: 10,
          description: `CS 지원 생성: ${TYPE_LABEL[type]}`,
        }),
      }
    );

    if (!consumeRes.ok) {
      const consumeData = await consumeRes.json().catch(() => ({}));
      if (consumeData.code === "INSUFFICIENT_CREDITS") {
        return NextResponse.json(
          { error: "insufficient_credits", code: "INSUFFICIENT_CREDITS", balance: consumeData.balance },
          { status: 402 }
        );
      }
      return NextResponse.json({ error: "credit_consume_failed" }, { status: 500 });
    }

    // Build prompt
    let toneInstruction = "";
    if (userSettings?.tone_profile_json) {
      try {
        const tp = typeof userSettings.tone_profile_json === "string"
          ? JSON.parse(userSettings.tone_profile_json)
          : userSettings.tone_profile_json;
        toneInstruction = `
말투 지침:
- 요약: ${tp.tone_summary ?? ""}
- 해야 할 것: ${(tp.do_list ?? []).join(", ")}
- 하지 말 것: ${(tp.dont_list ?? []).join(", ")}
- 예시 표현: ${(tp.sample_phrases ?? []).join(" / ")}`;
      } catch {}
    } else if (userSettings?.tone_example) {
      toneInstruction = `\n말투 예시: ${userSettings.tone_example}`;
    }

    const systemPrompt = `당신은 한국 소상공인의 고객 응대 전문 AI 어시스턴트입니다.
브랜드 정보와 말투 지침을 반드시 반영하여 자연스럽고 전문적인 한국어 응대 문구를 생성합니다.
응대 유형: ${TYPE_LABEL[type]}${toneInstruction}`;

    const userPrompt = `[브랜드 정보]
- 브랜드명: ${managerSettings?.brand_name ?? "브랜드"}
- 회사 소개: ${managerSettings?.company_profile ?? "없음"}
- 회사 역할/직책: ${(managerSettings as any)?.company_role ?? "담당자"}

[고객 입력 내용]
${input_text.trim()}

위 내용에 대해 ${TYPE_LABEL[type]} 문구를 작성해주세요.
- 인사말 포함
- 공감 표현 포함
- 명확한 해결/안내 내용
- 정중하고 따뜻한 마무리
- 200~400자 분량의 한국어 텍스트로 반환 (JSON 없이 텍스트만)`;

    const response = await openai.chat.completions.create({
      model: "gpt-4o-mini",
      messages: [
        { role: "system", content: systemPrompt },
        { role: "user", content: userPrompt },
      ],
      temperature: 0.7,
      max_tokens: 600,
    });

    const generated_text = response.choices[0]?.message?.content?.trim() ?? "";

    return NextResponse.json({ ok: true, generated_text });
  } catch (error: any) {
    console.error("[API] POST /api/workspace/cs-support/generate error:", error?.message);
    return NextResponse.json(
      { error: "internal_server_error" },
      { status: 500 }
    );
  }
}
