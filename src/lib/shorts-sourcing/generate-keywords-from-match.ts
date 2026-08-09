/**
 * Refines a confirmed 1688 product match's raw title/description/tags into clean
 * Douyin/Xiaohongshu search keywords. Text-only (no vision call) — the 1688
 * reverse-image-search step already gives us the product's real Chinese title for
 * free, so this is just a cheap cleanup pass, not another product-identification
 * call. Keeps costs negligible compared to analyze-product-image.ts's vision call.
 */

import OpenAI from "openai";

const KEYWORD_MODEL = process.env.SHORTS_SOURCING_KEYWORD_MODEL || "gpt-4o-mini";

const SYSTEM_PROMPT = `너는 중국 쇼핑 숏폼 플랫폼(더우인, 샤오홍슈)의 검색어 정제기다.
입력으로 1688(중국 도매 사이트) 상품의 제목, 설명, 태그를 받는다.
이 텍스트는 SEO를 위해 키워드가 나열/중복된 스팸성 문구일 수 있다.
여기서 실제 사용자가 더우인/샤오홍슈에서 이 정확한 상품을 찾을 때 입력할 법한
간결한 중국어 검색어를 3~5개 뽑아라.
서로 거의 동일한 검색어를 반복하지 마라. 색상/사이즈 등 지나치게 세부적인 옵션만
다른 변형은 하나로 합쳐라. 상품과 무관한 브랜드/판촉 문구는 제외하라.
반드시 아래 JSON 스키마로만 응답하라:
{ "keywords": ["string", ...] }`;

/** Returns 3~5 cleaned search keywords, or [] if the model call fails or the input is empty. */
export async function generateKeywordsFromMatch(match: {
  title: string;
  description?: string | null;
  tags?: string[];
}): Promise<string[]> {
  const userText = [
    `제목: ${match.title}`,
    match.description ? `설명: ${match.description}` : null,
    match.tags && match.tags.length > 0 ? `태그: ${match.tags.join(", ")}` : null,
  ]
    .filter(Boolean)
    .join("\n");

  if (!userText.trim()) return [];

  try {
    const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });
    const response = await openai.chat.completions.create({
      model: KEYWORD_MODEL,
      temperature: 0.2,
      response_format: { type: "json_object" },
      messages: [
        { role: "system", content: SYSTEM_PROMPT },
        { role: "user", content: userText },
      ],
      max_tokens: 300,
    });

    const raw = response.choices[0]?.message?.content?.trim();
    if (!raw) return [];

    const parsed = JSON.parse(raw) as { keywords?: unknown };
    if (!Array.isArray(parsed.keywords)) return [];

    return parsed.keywords
      .filter((k): k is string => typeof k === "string" && k.trim().length > 0)
      .map((k) => k.trim())
      .slice(0, 5);
  } catch (err) {
    console.warn("[generate-keywords-from-match] failed, returning no keywords:", err);
    return [];
  }
}
