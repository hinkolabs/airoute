"use client";

import React from "react";

import { ItemsList } from "./items-list";
import { BriefForm } from "./brief-form";

export type BriefState = "none" | "ready" | "generated";

// STUB: 추후 DB 연결 타입
interface WeeklyCampaignDraft {
  blog?: { title: string; summary: string };
  sns?: { text: string; imageCount: number };
}

interface BrandProfile {
  status: "missing" | "ready";
  updatedAt?: string;
}

interface ToneProfile {
  selectedTone: "professional" | "friendly" | "energetic";
  isPro: boolean;
  sampleText: string;
}

type Props = {
  briefState: BriefState;
  isAdminCapable: boolean;
  briefText: string;
  onChangeBrief: (v: string) => void;
  onSaveBrief: () => void;
  onLoadExample: () => void;
  onGenerateItems: () => void;
};

export function StatePanel({
  briefState,
  isAdminCapable,
  briefText,
  onChangeBrief,
  onSaveBrief,
  onLoadExample,
  onGenerateItems,
}: Props) {
  // STUB: Hard-coded data
  const weeklyDrafts: WeeklyCampaignDraft = {
    blog: { title: "신메뉴 출시! 프리미엄 커피 라인업", summary: "새롭게 선보이는 프리미엄 커피..." },
    sns: { text: "🎉 신메뉴 출시! 프리미엄 커피를 만나보세요", imageCount: 2 },
  };

  const brandProfile: BrandProfile = {
    status: briefState === "none" ? "missing" : "ready",
    updatedAt: briefState === "none" ? undefined : "2026-01-10",
  };

  const toneProfile: ToneProfile = {
    selectedTone: "friendly",
    isPro: false,
    sampleText: "안녕하세요! 오늘도 좋은 하루 보내세요 😊",
  };

  // 섹션 A: 이번 주 캠페인
  const weeklyCampaignSection = (
    <div className="rounded-lg border border-border bg-card p-4">
      <div className="font-medium text-foreground text-sm mb-3">이번 주 캠페인</div>
      <div className="space-y-3">
        {weeklyDrafts.blog && (
          <div className="rounded border border-border bg-muted/30 p-3">
            <div className="text-xs text-muted-foreground mb-1">📝 블로그</div>
            <div className="text-sm font-medium text-foreground">{weeklyDrafts.blog.title}</div>
            <div className="text-xs text-muted-foreground mt-1">{weeklyDrafts.blog.summary}</div>
          </div>
        )}
        {weeklyDrafts.sns && (
          <div className="rounded border border-border bg-muted/30 p-3">
            <div className="text-xs text-muted-foreground mb-1">📱 SNS</div>
            <div className="text-sm text-foreground">{weeklyDrafts.sns.text}</div>
            <div className="text-xs text-muted-foreground mt-1">이미지 {weeklyDrafts.sns.imageCount}장 포함</div>
          </div>
        )}
      </div>
    </div>
  );

  // 섹션 B: 회사 롤 상태
  const brandProfileSection = (
    <div className="rounded-lg border border-border bg-card p-4">
      <div className="font-medium text-foreground text-sm mb-3">회사 롤 상태</div>
      {brandProfile.status === "ready" ? (
        <div className="text-sm text-muted-foreground">
          <div className="text-foreground font-medium">✓ 입력 완료</div>
          <div className="text-xs mt-1">마지막 업데이트: {brandProfile.updatedAt}</div>
        </div>
      ) : (
        <div className="text-sm text-muted-foreground">
          <div className="text-foreground font-medium">⚠ 미설정</div>
          <div className="text-xs mt-1">메인 정보를 입력하세요</div>
        </div>
      )}
    </div>
  );

  // 섹션 C: 나의 톤 & 워터마크
  const toneProfileSection = (
    <div className="rounded-lg border border-border bg-card p-4">
      <div className="font-medium text-foreground text-sm mb-3">나의 톤 & 워터마크</div>
      <div className="space-y-2">
        <div className="text-sm">
          <span className="text-muted-foreground">선택한 톤:</span>{" "}
          <span className="text-foreground font-medium">
            {toneProfile.selectedTone === "professional"
              ? "전문적"
              : toneProfile.selectedTone === "friendly"
              ? "친근함"
              : "활기찬"}
          </span>
        </div>
        <div className="rounded border border-border bg-muted/30 p-3 text-xs text-muted-foreground italic">
          {toneProfile.sampleText}
        </div>
        {!toneProfile.isPro && (
          <div className="text-xs text-muted-foreground">
            💎 Pro 플랜에서는 커스텀 워터마크를 업로드할 수 있습니다
          </div>
        )}
      </div>
    </div>
  );

  if (briefState === "generated") {
    return (
      <div className="flex flex-col gap-4">
        {weeklyCampaignSection}
        <ItemsList />
        {brandProfileSection}
        {toneProfileSection}
      </div>
    );
  }

  if (briefState === "ready") {
    return (
      <div className="flex flex-col gap-4">
        {weeklyCampaignSection}
        <div className="rounded-lg border border-border bg-card p-4">
          <div className="flex flex-col gap-2">
            <div className="text-sm font-medium text-foreground">이번 달 아이템 생성</div>
            <div className="text-sm text-muted-foreground">
              메인 정보를 바탕으로 이번 달 15개 아이템을 생성합니다.
            </div>
          </div>
          <div className="mt-4 flex flex-wrap gap-2">
            {isAdminCapable ? (
              <button
                type="button"
                onClick={onGenerateItems}
                className="inline-flex items-center justify-center rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground hover:bg-primary/90"
              >
                이번 달 아이템 생성
              </button>
            ) : (
              <div className="text-sm text-muted-foreground">
                이 워크스페이스에서는 <span className="text-foreground">관리자</span>만 아이템을 생성할 수 있습니다.
              </div>
            )}
          </div>
        </div>
        {brandProfileSection}
        {toneProfileSection}
      </div>
    );
  }

  // briefState === "none"
  return (
    <div className="flex flex-col gap-4">
      {brandProfileSection}
      <BriefForm
        isAdminCapable={isAdminCapable}
        value={briefText}
        onChange={onChangeBrief}
        onSave={onSaveBrief}
        onLoadExample={onLoadExample}
      />
      {toneProfileSection}
    </div>
  );
}
