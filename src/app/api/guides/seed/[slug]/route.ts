"use server";

import { NextRequest, NextResponse } from "next/server";
import { supabaseServerClient } from "@/lib/supabase/server";
import { GUIDES_SEED_DATA } from "./seed-data";

export async function GET(req: NextRequest) {
  // URL 경로에서 slug 직접 파싱
  const url = new URL(req.url);
  const segments = url.pathname.split("/").filter(Boolean);
  const slug = segments[segments.length - 1];

  if (!slug || slug === "seed") {
    return NextResponse.json(
      { status: "error", message: "Slug param is missing" },
      { status: 400 }
    );
  }

  // slug로 시드 데이터 찾기
  const seed = GUIDES_SEED_DATA[slug as keyof typeof GUIDES_SEED_DATA];

  if (!seed) {
    return NextResponse.json(
      {
        status: "error",
        message: `No seed data found for slug "${slug}"`,
        availableSlugs: Object.keys(GUIDES_SEED_DATA),
      },
      { status: 404 }
    );
  }

  // 이미 존재하는지 확인
  const { data: existing, error: existingError } = await supabaseServerClient
    .from("guides")
    .select("id")
    .eq("slug", seed.slug)
    .maybeSingle();

  if (existingError) {
    return NextResponse.json(
      { status: "error", message: existingError.message },
      { status: 500 }
    );
  }

  if (existing) {
    return NextResponse.json({
      status: "exists",
      message: `Guide "${seed.slug}" already exists`,
      id: existing.id,
    });
  }

  // 새 가이드 insert
  const { data, error } = await supabaseServerClient
    .from("guides")
    .insert({
      slug: seed.slug,
      title: seed.title,
      excerpt: seed.excerpt,
      content: seed.content,
    })
    .select()
    .single();

  if (error) {
    return NextResponse.json(
      { status: "error", message: error.message },
      { status: 500 }
    );
  }

  return NextResponse.json({
    status: "inserted",
    message: `Guide "${seed.slug}" inserted successfully.`,
    id: data.id,
  });
}
