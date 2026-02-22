"use client";

import React, { useMemo } from "react";

type Props = {
  isAdminCapable: boolean;
  value: string;
  onChange: (v: string) => void;
  onSave: () => void;
  onLoadExample: () => void;
  maxChars?: number;
};

export function BriefForm({
  isAdminCapable,
  value,
  onChange,
  onSave,
  onLoadExample,
  maxChars = 5000,
}: Props) {
  const count = value.length;
  const isOver = count > maxChars;

  const helper = useMemo(() => {
    return "이 내용은 이번 달 15개 아이템 생성의 기준이 됩니다.";
  }, []);

  if (!isAdminCapable) {
    return (
      <div className="rounded-lg border border-border bg-card p-4">
        <div className="text-sm font-medium text-foreground">메인 정보(Brief)</div>
        <p className="mt-2 text-sm text-muted-foreground">
          팀 워크스페이스에서는 <span className="text-foreground">관리자 1명</span>만 메인 정보를 설정할 수 있습니다.
          <br />
          (개인 워크스페이스는 본인이 관리자 권한입니다.)
        </p>
      </div>
    );
  }

  return (
    <div className="rounded-lg border border-border bg-card p-4">
      <div className="flex flex-col gap-1">
        <div className="text-sm font-medium text-foreground">메인 정보(Brief)</div>
        <div className="text-sm text-muted-foreground">{helper}</div>
      </div>

      <div className="mt-4">
        <label className="mb-2 block text-xs font-medium text-muted-foreground">메인 정보 (최대 {maxChars}자)</label>
        <textarea
          value={value}
          onChange={(e) => onChange(e.target.value)}
          rows={10}
          className="w-full resize-none rounded-md border border-border bg-background px-3 py-2 text-sm text-foreground outline-none focus:ring-2 focus:ring-primary/40"
          placeholder={[
            "예시:",
            "- 누구에게 무엇을 판매/제공하나요?",
            "- 이번 달 프로모션/핵심 키워드/금지 표현은?",
            "- 강점/후기/FAQ/상담 방식은?",
          ].join("\n")}
        />
        <div className="mt-2 flex items-center justify-between text-xs">
          <span className={isOver ? "text-destructive" : "text-muted-foreground"}>
            {count.toLocaleString()} / {maxChars.toLocaleString()}
          </span>
          {isOver ? <span className="text-destructive">글자 수를 줄여주세요.</span> : <span className="text-muted-foreground"> </span>}
        </div>
      </div>

      <div className="mt-4">
        <div className="rounded-md border border-dashed border-border bg-muted/30 p-4">
          <div className="text-sm font-medium text-foreground">문서 파일 업로드 (준비중)</div>
          <div className="mt-1 text-sm text-muted-foreground">
            Pro 옵션(검토중): 파일 업로드 후 AI가 요약합니다. (현재는 UI만 표시됩니다.)
          </div>
          <button
            type="button"
            disabled
            className="mt-3 inline-flex items-center justify-center rounded-md border border-border bg-background px-3 py-2 text-sm text-muted-foreground opacity-60"
          >
            파일 선택 (비활성)
          </button>
        </div>
      </div>

      <div className="mt-4 flex flex-wrap gap-2">
        <button
          type="button"
          onClick={onSave}
          disabled={count === 0 || isOver}
          className="inline-flex items-center justify-center rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground hover:bg-primary/90 disabled:cursor-not-allowed disabled:opacity-60"
        >
          저장하기
        </button>
        <button
          type="button"
          onClick={onLoadExample}
          className="inline-flex items-center justify-center rounded-md border border-border bg-background px-4 py-2 text-sm font-medium text-foreground hover:bg-muted"
        >
          예시 불러오기
        </button>
      </div>
    </div>
  );
}
