/**
 * Ranking — SSOT section 16.
 *
 * Basic ranking (computeBaseScores) never calls an external API: it only uses
 * metadata already stored on each SourceItem. Precise ranking (computeVisualScores)
 * is the only function here that costs money — it's triggered by a separate "AI
 * 정밀 정렬" button, never automatically.
 */

import OpenAI from "openai";
import { SourceItem, SHORTS_SEARCH_LIMITS } from "./types";

const RANK_MODEL = process.env.SHORTS_SOURCING_VISION_MODEL || "gpt-4o";

const WEIGHTS_BASE = { text: 0.6, engagement: 0.25, recency: 0.15 };
const WEIGHTS_PRECISE = { visual: 0.55, text: 0.25, engagement: 0.1, recency: 0.1 };

function computeTextScore(item: SourceItem, selectedKeywords: string[]): number {
  if (selectedKeywords.length === 0) return 0.5;
  const keywordCoverage = item.matched_keywords.length / selectedKeywords.length;
  const titleHasKeyword = item.title ? selectedKeywords.some((k) => item.title!.includes(k)) : false;
  return Math.min(1, keywordCoverage * 0.7 + (titleHasKeyword ? 0.3 : 0));
}

function computeRecencyScore(publishedAt: string | null, now: number): number {
  if (!publishedAt) return 0.3; // unknown publish date -> neutral-low, not zero
  const days = (now - new Date(publishedAt).getTime()) / (1000 * 60 * 60 * 24);
  if (!Number.isFinite(days) || days <= 0) return 1;
  return Math.max(0, 1 - days / 365);
}

/** Computes text/engagement/recency scores and a base final_score — no API calls. */
export function computeBaseScores(items: SourceItem[], selectedKeywords: string[]): SourceItem[] {
  const now = Date.now();
  const engagementRaw = items.map((i) =>
    Math.log1p((i.like_count ?? 0) + (i.comment_count ?? 0) * 2 + (i.share_count ?? 0) * 3)
  );
  const maxEngagement = Math.max(1, ...engagementRaw);

  return items.map((item, idx) => {
    const text_score = computeTextScore(item, selectedKeywords);
    const engagement_score = engagementRaw[idx] / maxEngagement;
    const recency_score = computeRecencyScore(item.published_at, now);
    const final_score =
      text_score * WEIGHTS_BASE.text + engagement_score * WEIGHTS_BASE.engagement + recency_score * WEIGHTS_BASE.recency;

    return { ...item, text_score, engagement_score, recency_score, final_score };
  });
}

/**
 * AI 정밀 정렬: compares the original product photo against each candidate's
 * thumbnail and asks the model for a 0~1 visual similarity score, in a single
 * batched call (cheaper than one call per thumbnail). Only ever called on the
 * top N items (SHORTS_SEARCH_LIMITS.preciseRankTopN) from a separate button click.
 */
export async function computeVisualScores(
  productImageUrl: string,
  candidates: { id: string; thumbnailUrl: string }[]
): Promise<Map<string, number>> {
  const scores = new Map<string, number>();
  if (candidates.length === 0) return scores;

  const limited = candidates.slice(0, SHORTS_SEARCH_LIMITS.preciseRankTopN);
  const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

  const content: OpenAI.Chat.Completions.ChatCompletionContentPart[] = [
    {
      type: "text",
      text: `첫 번째 이미지는 원본 판매 상품이다. 이후 이미지들은 index 0부터 순서대로 후보 영상의 썸네일이다.
각 후보 썸네일이 원본 상품과 같은 상품(또는 매우 유사한 상품)을 보여주는지 0.0~1.0 사이 유사도로 평가하라.
반드시 JSON만 반환하라: {"scores": [{"index": 0, "score": 0.0}, ...]} (candidates 개수와 같은 길이)`,
    },
    { type: "image_url", image_url: { url: productImageUrl } },
    ...limited.map((c): OpenAI.Chat.Completions.ChatCompletionContentPart => ({
      type: "image_url",
      image_url: { url: c.thumbnailUrl },
    })),
  ];

  try {
    const response = await openai.chat.completions.create({
      model: RANK_MODEL,
      temperature: 0.1,
      response_format: { type: "json_object" },
      messages: [{ role: "user", content }],
      max_tokens: 1000,
    });

    const raw = response.choices[0]?.message?.content?.trim();
    if (!raw) return scores;

    const parsed = JSON.parse(raw) as { scores?: { index: number; score: number }[] };
    for (const entry of parsed.scores ?? []) {
      const candidate = limited[entry.index];
      if (candidate && typeof entry.score === "number") {
        scores.set(candidate.id, Math.max(0, Math.min(1, entry.score)));
      }
    }
  } catch (err) {
    console.warn("[ranking] computeVisualScores failed, returning empty scores:", err);
  }

  return scores;
}

/** Recomputes final_score once visual_score is available (AI 정밀 정렬 pass). */
export function applyPreciseScores(items: SourceItem[], visualScores: Map<string, number>): SourceItem[] {
  return items.map((item) => {
    const visual_score = item.id ? visualScores.get(item.id) ?? item.visual_score : item.visual_score;
    if (visual_score === null || visual_score === undefined) return item;

    const final_score =
      visual_score * WEIGHTS_PRECISE.visual +
      (item.text_score ?? 0) * WEIGHTS_PRECISE.text +
      (item.engagement_score ?? 0) * WEIGHTS_PRECISE.engagement +
      (item.recency_score ?? 0) * WEIGHTS_PRECISE.recency;

    return { ...item, visual_score, final_score };
  });
}
