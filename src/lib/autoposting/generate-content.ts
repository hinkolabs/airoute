import OpenAI from "openai";

const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

export interface AutopostingSettings {
  brand_name?: string;
  company_profile?: string;
  content_purpose: string;
  brand_intro: string;
  brand_strengths: string[];
  target_age: string;
  target_persona: string[];
  channels: string[];
  tone_profile_json?: string | null;
}

export interface GeneratedPreview {
  blog_content: string;
  sns_content: string;
  topic: string;
}

const PURPOSE_MAP: Record<string, string> = {
  new_customer: "신규 고객 유치",
  repurchase: "기존 고객 재구매 유도",
  branding: "브랜드 인지도 향상",
  event: "이벤트/프로모션 홍보",
  sales: "직접 매출 증대",
};

const AGE_MAP: Record<string, string> = {
  "20s": "20대",
  "30s": "30대",
  "40s": "40대",
  "50plus": "50대 이상",
  all: "전 연령",
};

export async function generateAutopostingPreview(
  settings: AutopostingSettings
): Promise<GeneratedPreview> {
  const purpose = PURPOSE_MAP[settings.content_purpose] ?? settings.content_purpose;
  const targetAge = AGE_MAP[settings.target_age] ?? settings.target_age;

  let toneInstruction = "";
  if (settings.tone_profile_json) {
    try {
      const toneProfile = JSON.parse(settings.tone_profile_json);
      toneInstruction = `
말투 지침:
- 요약: ${toneProfile.tone_summary ?? ""}
- 해야 할 것: ${(toneProfile.do_list ?? []).join(", ")}
- 하지 말 것: ${(toneProfile.dont_list ?? []).join(", ")}
- 예시 표현: ${(toneProfile.sample_phrases ?? []).join(" / ")}`;
    } catch {
      // ignore parse error
    }
  }

  const systemPrompt = `당신은 한국 소상공인과 마케터를 위한 AI 마케팅 콘텐츠 생성 전문가입니다.
주어진 브랜드 정보와 설정을 기반으로 실제로 사용 가능한 고품질 마케팅 콘텐츠를 생성합니다.
${toneInstruction}`;

  const userPrompt = `아래 정보를 바탕으로 마케팅 콘텐츠를 생성해주세요.

[브랜드 정보]
- 브랜드명: ${settings.brand_name ?? "브랜드"}
- 소개: ${settings.brand_intro}
- 강점: ${settings.brand_strengths.join(", ")}
- 회사 프로필: ${settings.company_profile ?? "없음"}

[마케팅 설정]
- 목적: ${purpose}
- 타겟 연령: ${targetAge}
- 타겟 성향: ${settings.target_persona.join(", ")}
- 발송 채널: ${settings.channels.join(", ")}

다음 형식으로 JSON을 반환하세요 (다른 텍스트 없이 JSON만):
{
  "topic": "이번 콘텐츠의 핵심 주제 (한 문장)",
  "blog_content": "블로그/이메일용 콘텐츠 (최소 400자, 자연스러운 한국어, H2 소제목 포함)",
  "sns_content": "SNS용 짧은 콘텐츠 (150~250자, 해시태그 5~8개 포함, 이모지 허용)"
}`;

  const response = await openai.chat.completions.create({
    model: "gpt-4o-mini",
    messages: [
      { role: "system", content: systemPrompt },
      { role: "user", content: userPrompt },
    ],
    temperature: 0.8,
    response_format: { type: "json_object" },
  });

  const raw = response.choices[0]?.message?.content ?? "{}";
  const parsed = JSON.parse(raw);

  return {
    topic: parsed.topic ?? "마케팅 콘텐츠",
    blog_content: parsed.blog_content ?? "",
    sns_content: parsed.sns_content ?? "",
  };
}
