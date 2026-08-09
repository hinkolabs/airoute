import { createHash } from "crypto";
import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { createAdminSupabase } from "@/lib/supabase/admin";
import { getDemoMode } from "@/lib/flags";
import { analyzeProductImage } from "@/lib/shorts-sourcing/analyze-product-image";
import { SHORTS_VISION_PROMPT_VERSION } from "@/lib/shorts-sourcing/types";
import { CREDIT_COSTS } from "@/lib/credit-costs";

export const dynamic = "force-dynamic";

const BUCKET = "workspace-assets";
const MAX_SIZE = 10 * 1024 * 1024; // 10MB per SSOT
const ALLOWED_TYPES: Record<string, string> = {
  "image/jpeg": "jpg",
  "image/jpg": "jpg",
  "image/png": "png",
  "image/webp": "webp",
};

// Best-effort credit logging: this feature is admin-only for now, so insufficient
// credits never blocks the admin's own workflow — see plan section 5.
async function tryConsumeCredits(request: NextRequest, workspaceId: string) {
  try {
    await fetch(new URL("/api/credits/consume", request.url).toString(), {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        cookie: request.headers.get("cookie") ?? "",
      },
      body: JSON.stringify({
        workspace_id: workspaceId,
        feature_key: "shorts_sourcing_vision_analyze",
        amount: CREDIT_COSTS.shorts_sourcing_vision_analyze,
        description: "숏츠 소싱: 상품 이미지 분석",
      }),
    });
  } catch (err) {
    console.warn("[shorts-sourcing/analyze-image] credit consume skipped:", err);
  }
}

// POST /api/shorts-sourcing/analyze-image
// FormData: { file, workspace_id }
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

    const formData = await request.formData();
    const file = formData.get("file") as File | null;
    const workspaceId = formData.get("workspace_id") as string | null;

    if (!file || !workspaceId) {
      return NextResponse.json({ error: "file and workspace_id are required" }, { status: 400 });
    }

    const ext = ALLOWED_TYPES[file.type];
    if (!ext) {
      return NextResponse.json(
        { error: "invalid_file_type", message: "JPG, PNG, WEBP 파일만 업로드할 수 있습니다." },
        { status: 400 }
      );
    }

    if (file.size > MAX_SIZE) {
      return NextResponse.json(
        { error: "file_too_large", message: "이미지 파일은 10MB 이하여야 합니다." },
        { status: 400 }
      );
    }

    // Verify workspace membership
    const { data: membership, error: membershipError } = await supabase
      .from("workspace_members")
      .select("role")
      .eq("workspace_id", workspaceId)
      .eq("user_id", user.id)
      .maybeSingle();

    if (membershipError || !membership) {
      return NextResponse.json({ error: "not_a_member" }, { status: 403 });
    }

    if (process.env.OPENAI_ENABLED !== "true" || !process.env.OPENAI_API_KEY) {
      return NextResponse.json(
        { error: "vision_unavailable", message: "이미지 분석을 사용할 수 없습니다. 관리자에게 문의해주세요." },
        { status: 503 }
      );
    }

    const arrayBuffer = await file.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);
    const imageHash = createHash("sha256").update(buffer).digest("hex");

    const admin = createAdminSupabase();

    // Cache check: same workspace + image + prompt/model combo -> reuse existing analysis
    const { data: cachedSession } = await admin
      .from("shorts_sourcing_sessions")
      .select("id, product_name_ko, category_ko, analysis_json, image_storage_path")
      .eq("workspace_id", workspaceId)
      .eq("image_hash", imageHash)
      .eq("prompt_version", SHORTS_VISION_PROMPT_VERSION)
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
        image_url: cachedSession.image_storage_path
          ? admin.storage.from(BUCKET).getPublicUrl(cachedSession.image_storage_path).data.publicUrl
          : null,
      });
    }

    // Not cached: upload the image, then run vision analysis
    const storagePath = `shorts-sourcing/${workspaceId}/${imageHash}.${ext}`;

    const { error: uploadError } = await admin.storage
      .from(BUCKET)
      .upload(storagePath, buffer, { contentType: file.type, upsert: true });

    if (uploadError) {
      console.error("[shorts-sourcing/analyze-image] upload failed:", uploadError.message);
      return NextResponse.json({ error: "upload_failed", message: "이미지 업로드에 실패했습니다." }, { status: 500 });
    }

    const { data: urlData } = admin.storage.from(BUCKET).getPublicUrl(storagePath);
    const imageUrl = urlData.publicUrl;

    // Optional brand context from manager settings, to disambiguate similar products
    const { data: managerSettings } = await admin
      .from("workspace_manager_settings")
      .select("brand_name")
      .eq("workspace_id", workspaceId)
      .maybeSingle();

    let visionResult;
    try {
      visionResult = await analyzeProductImage({
        imageUrl,
        brandContext: managerSettings?.brand_name ?? null,
      });
    } catch (err) {
      console.error("[shorts-sourcing/analyze-image] vision failed:", err);
      return NextResponse.json(
        {
          error: "vision_failed",
          message: "상품 분석에 실패했습니다. 이미지를 다시 선택하거나 잠시 후 다시 시도해 주세요.",
        },
        { status: 502 }
      );
    }

    const { analysis, model, promptVersion } = visionResult;

    const { data: newSession, error: insertError } = await admin
      .from("shorts_sourcing_sessions")
      .insert({
        workspace_id: workspaceId,
        created_by: user.id,
        image_hash: imageHash,
        image_storage_path: storagePath,
        product_name_ko: analysis.product_name_ko,
        category_ko: analysis.category_ko,
        analysis_json: analysis,
        vision_model: model,
        prompt_version: promptVersion,
      })
      .select("id")
      .single();

    if (insertError || !newSession) {
      console.error("[shorts-sourcing/analyze-image] session insert failed:", insertError);
      return NextResponse.json({ error: "server_error" }, { status: 500 });
    }

    const keywordRows = analysis.chinese_keywords.map((keyword) => ({
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
      image_url: imageUrl,
    });
  } catch (err) {
    console.error("[shorts-sourcing/analyze-image] unexpected error:", err);
    return NextResponse.json({ error: "server_error" }, { status: 500 });
  }
}
