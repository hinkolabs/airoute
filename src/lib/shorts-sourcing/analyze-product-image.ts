/**
 * Vision analysis for the Shopping Shorts Sourcing tool.
 *
 * Given a product screenshot, asks a vision-capable OpenAI model to identify the
 * product and produce Chinese search keywords for Douyin/Xiaohongshu. This is a
 * thin wrapper around the OpenAI SDK (same style as image-agent.ts / metadata-agent.ts) —
 * no separate "Vision Provider" abstraction, since the rest of the codebase doesn't
 * use one either.
 *
 * Caching (by image hash + prompt version + model) and persistence are handled by
 * the API route, not here — this function only talks to OpenAI.
 */

import OpenAI from "openai";
import { ProductAnalysis, SHORTS_VISION_PROMPT_VERSION } from "./types";

const VISION_MODEL = process.env.SHORTS_SOURCING_VISION_MODEL || "gpt-4o";

const SYSTEM_PROMPT = `너는 중국 쇼핑 숏폼 플랫폼(더우인, 샤오홍슈)의 상품 검색어 생성기다.
사용자가 제공한 이미지에서 핵심 상품 하나를 식별하라.
브랜드와 모델을 확실히 판별할 수 없으면 추측하지 말고 null로 반환하라.
Douyin과 Xiaohongshu에서 실제 사용자가 상품을 찾을 때 사용할 법한 중국어 검색어를 3~5개 생성하라.

가장 중요한 규칙: 검색어는 반드시 이 상품을 같은 대분류의 다른 상품과
구별해주는 특징(용도/형태/재질/기능 등)을 최소 2개 이상 조합해야 한다.
예를 들어 상품이 "연필 모양의 초경량 자외선 차단 우산"이라면,
"晴雨伞"(비/햇빛 겸용 우산)이나 "遮阳伞"(양산)처럼 카테고리 전체를 가리키는
단어를 특징 없이 단독으로 쓰지 말고, "创意铅笔晴雨伞"이나 "防晒铅笔遮阳伞"처럼
구별 특징 + 카테고리 명사를 합쳐서 하나의 검색어로 만들어라.
이런 식으로 대분류 카테고리 명사를 단독으로 사용하는 것은 금지된다 — 항상
구별 특징 수식어와 함께 붙여서 써라.
그렇다고 부자연스럽게 길게 늘어놓지는 말고, 실제 사람이 검색창에 입력할 법한
자연스러운 길이(대략 4~8자)를 유지하라.

서로 거의 동일한 검색어를 반복하지 마라.
너는 광고 문구를 쓰지 않는다. 오직 상품 식별과 검색어 생성만 한다.
반드시 아래 JSON 스키마로만 응답하라:
{
  "product_name_ko": "string",
  "category_ko": "string | null",
  "brand": "string | null",
  "model_name": "string | null",
  "attributes": ["string"],
  "chinese_product_name": "string",
  "chinese_keywords": ["string"],
  "chinese_hashtags": ["string"],
  "confidence": 0.0
}`;

function toProductAnalysis(raw: unknown): ProductAnalysis | null {
  if (!raw || typeof raw !== "object") return null;
  const r = raw as Record<string, unknown>;

  const productName = typeof r.product_name_ko === "string" ? r.product_name_ko.trim() : "";
  const chineseName = typeof r.chinese_product_name === "string" ? r.chinese_product_name.trim() : "";
  const keywords = Array.isArray(r.chinese_keywords)
    ? r.chinese_keywords.filter((k): k is string => typeof k === "string" && k.trim().length > 0).map((k) => k.trim())
    : [];

  if (!productName || !chineseName || keywords.length === 0) return null;

  return {
    product_name_ko: productName,
    category_ko: typeof r.category_ko === "string" && r.category_ko.trim() ? r.category_ko.trim() : null,
    brand: typeof r.brand === "string" && r.brand.trim() ? r.brand.trim() : null,
    model_name: typeof r.model_name === "string" && r.model_name.trim() ? r.model_name.trim() : null,
    attributes: Array.isArray(r.attributes)
      ? r.attributes.filter((a): a is string => typeof a === "string" && a.trim().length > 0).map((a) => a.trim())
      : [],
    chinese_product_name: chineseName,
    chinese_keywords: keywords.slice(0, 5),
    chinese_hashtags: Array.isArray(r.chinese_hashtags)
      ? r.chinese_hashtags.filter((h): h is string => typeof h === "string" && h.trim().length > 0).map((h) => h.trim())
      : [],
    confidence: typeof r.confidence === "number" ? Math.max(0, Math.min(1, r.confidence)) : 0.5,
  };
}

/**
 * Calls the vision model with a product image and returns a validated ProductAnalysis.
 * Throws on API failure or if the model's output fails schema validation — the caller
 * (API route) is responsible for turning that into a Korean user-facing error message.
 */
export async function analyzeProductImage(params: {
  imageUrl: string; // public/signed URL or data: URL
  brandContext?: string | null; // optional: workspace brand name / product catalog hint
}): Promise<{ analysis: ProductAnalysis; model: string; promptVersion: string }> {
  const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

  const userText = params.brandContext
    ? `참고: 이 이미지는 "${params.brandContext}" 브랜드/판매자와 관련된 상품일 수 있다. 확실하지 않으면 이 정보를 무시하라.`
    : "이 이미지 속 상품을 분석하라.";

  const response = await openai.chat.completions.create({
    model: VISION_MODEL,
    temperature: 0.2,
    response_format: { type: "json_object" },
    messages: [
      { role: "system", content: SYSTEM_PROMPT },
      {
        role: "user",
        content: [
          { type: "text", text: userText },
          { type: "image_url", image_url: { url: params.imageUrl } },
        ],
      },
    ],
    max_tokens: 1000,
  });

  const raw = response.choices[0]?.message?.content?.trim();
  if (!raw) {
    throw new Error("vision_empty_response");
  }

  let parsed: unknown;
  try {
    parsed = JSON.parse(raw);
  } catch {
    throw new Error("vision_invalid_json");
  }

  const analysis = toProductAnalysis(parsed);
  if (!analysis) {
    throw new Error("vision_schema_mismatch");
  }

  return { analysis, model: VISION_MODEL, promptVersion: SHORTS_VISION_PROMPT_VERSION };
}
