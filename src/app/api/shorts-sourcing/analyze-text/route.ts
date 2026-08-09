import { createHash } from "crypto";
import { NextRequest, NextResponse } from "next/server";
import { requireUser, resolveWorkspaceId, isErrorResponse } from "@/lib/shorts-sourcing/api-guard";
import { generateKeywordsFromMatch } from "@/lib/shorts-sourcing/generate-keywords-from-match";
import { ProductAnalysis, SHORTS_TEXT_KEYWORDS_PROMPT_VERSION } from "@/lib/shorts-sourcing/types";
import { CREDIT_COSTS } from "@/lib/credit-costs";

export const dynamic = "force-dynamic";
export const maxDuration = 30;

const MAX_TITLE_LENGTH = 200;
const MAX_DESCRIPTION_LENGTH = 1000;

async function tryConsumeCredits(request: NextRequest, workspaceId: string) {
  try {
    await fetch(new URL("/api/credits/consume", request.url).toString(), {
      method: "POST",
      headers: { "Content-Type": "application/json", cookie: request.headers.get("cookie") ?? "" },
      body: JSON.stringify({
        workspace_id: workspaceId,
        feature_key: "shorts_sourcing_text_keywords",
        amount: CREDIT_COSTS.shorts_sourcing_text_keywords,
        description: "숏츠 소싱: 텍스트 상품명으로 검색어 생성",
      }),
    });
  } catch (err) {
    console.warn("[shorts-sourcing/analyze-text] credit consume skipped:", err);
  }
}

// POST /api/shorts-sourcing/analyze-text
// Body: { product_title, description?, workspace_id? }
// Alternative to analyze-image for admins who already found the exact product's
// real title themselves (e.g. copy-pasted from 1688/Alibaba) — skips the image
// upload + vision-identification step entirely and goes straight to keyword
// generation, reusing the same generateKeywordsFromMatch() cleanup pass that the
// confirmed-1688-match flow uses. Session shape mirrors analyze-image's response
// so the rest of the client (sections 3/4) works unchanged.
export async function POST(request: NextRequest) {
  try {
    const ctx = await requireUser();
    if (isErrorResponse(ctx)) return ctx;
    const admin = ctx.admin;

    const body = await request.json().catch(() => ({}));
    const { product_title, description, workspace_id: requestedWorkspaceId } = body as {
      product_title?: string;
      description?: string;
      workspace_id?: string;
    };

    const title = (product_title ?? "").trim();
    if (!title) {
      return NextResponse.json({ error: "product_title is required" }, { status: 400 });
    }
    if (title.length > MAX_TITLE_LENGTH) {
      return NextResponse.json(
        { error: "title_too_long", message: `상품명은 ${MAX_TITLE_LENGTH}자 이하여야 합니다.` },
        { status: 400 }
      );
    }
    const desc = (description ?? "").trim().slice(0, MAX_DESCRIPTION_LENGTH) || null;

    const wsResult = await resolveWorkspaceId(ctx, requestedWorkspaceId);
    if (isErrorResponse(wsResult)) return wsResult;
    const { workspaceId } = wsResult;

    if (process.env.OPENAI_ENABLED !== "true" || !process.env.OPENAI_API_KEY) {
      return NextResponse.json(
        { error: "keywords_unavailable", message: "검색어 생성을 사용할 수 없습니다. 관리자에게 문의해주세요." },
        { status: 503 }
      );
    }

    // Synthetic hash reuses the same workspace+hash+prompt_version cache lookup
    // pattern as analyze-image, so re-submitting the exact same title returns the
    // existing session instead of spending another OpenAI call.
    const normalized = `${title.toLowerCase()}\n${(desc ?? "").toLowerCase()}`;
    const textHash = `text:${createHash("sha256").update(normalized).digest("hex")}`;

    const { data: cachedSession } = await admin
      .from("shorts_sourcing_sessions")
      .select("id, product_name_ko, category_ko, analysis_json")
      .eq("workspace_id", workspaceId)
      .eq("image_hash", textHash)
      .eq("prompt_version", SHORTS_TEXT_KEYWORDS_PROMPT_VERSION)
      .order("created_at", { ascending: false })
      .limit(1)
      .maybeSingle();

    if (cachedSession) {
      const { data: keywords } = await admin
        .from("shorts_sourcing_keywords")
        .select("id, keyword, is_ai_generated, is_selected")
        .eq("session_id", cachedSession.id)
        .order("created_at", { ascending: true });

      return NextResponse.json({
        ok: true,
        cached: true,
        session_id: cachedSession.id,
        analysis: cachedSession.analysis_json,
        keywords: keywords ?? [],
        image_url: null,
      });
    }

    const generatedKeywords = await generateKeywordsFromMatch({ title, description: desc });
    if (generatedKeywords.length === 0) {
      return NextResponse.json(
        {
          error: "keyword_generation_failed",
          message: "이 상품명으로 검색어를 만들지 못했습니다. 상품명을 더 구체적으로 입력해 보세요.",
        },
        { status: 502 }
      );
    }

    const analysis: ProductAnalysis = {
      product_name_ko: title,
      category_ko: null,
      brand: null,
      model_name: null,
      attributes: [],
      chinese_product_name: title,
      chinese_keywords: generatedKeywords,
      chinese_hashtags: [],
      confidence: 1,
    };

    const { data: newSession, error: insertError } = await admin
      .from("shorts_sourcing_sessions")
      .insert({
        workspace_id: workspaceId,
        created_by: ctx.userId,
        image_hash: textHash,
        image_storage_path: null,
        product_name_ko: title,
        category_ko: null,
        analysis_json: analysis,
        vision_model: null,
        prompt_version: SHORTS_TEXT_KEYWORDS_PROMPT_VERSION,
      })
      .select("id")
      .single();

    if (insertError || !newSession) {
      console.error("[shorts-sourcing/analyze-text] session insert failed:", insertError);
      return NextResponse.json({ error: "server_error" }, { status: 500 });
    }

    const keywordRows = generatedKeywords.map((keyword) => ({
      session_id: newSession.id,
      keyword,
      is_ai_generated: true,
      is_selected: true,
    }));

    const { data: insertedKeywords } = await admin
      .from("shorts_sourcing_keywords")
      .insert(keywordRows)
      .select("id, keyword, is_ai_generated, is_selected");

    await tryConsumeCredits(request, workspaceId);

    return NextResponse.json({
      ok: true,
      cached: false,
      session_id: newSession.id,
      analysis,
      keywords: insertedKeywords ?? [],
      image_url: null,
    });
  } catch (err) {
    console.error("[shorts-sourcing/analyze-text] unexpected error:", err);
    return NextResponse.json({ error: "server_error" }, { status: 500 });
  }
}
