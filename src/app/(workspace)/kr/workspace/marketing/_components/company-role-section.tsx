"use client";

import React from "react";

type Props = {
  isAdminCapable: boolean;
  value: string;
  onChange: (v: string) => void;
  onSave: () => void;
  maxChars?: number;
};

export function CompanyRoleSection({
  isAdminCapable,
  value,
  onChange,
  onSave,
  maxChars = 5000,
}: Props) {
  const count = value.length;
  const isOver = count > maxChars;

  if (!isAdminCapable) {
    return (
      <div className="rounded-lg border border-yellow-200 bg-yellow-50 p-4">
        <div className="flex items-start gap-3">
          <svg
            className="mt-0.5 h-5 w-5 shrink-0 text-yellow-600"
            xmlns="http://www.w3.org/2000/svg"
            viewBox="0 0 20 20"
            fill="currentColor"
          >
            <path
              fillRule="evenodd"
              d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z"
              clipRule="evenodd"
            />
          </svg>
          <div className="text-sm text-yellow-800">
            <div className="font-medium">읽기 전용</div>
            <p className="mt-1">
              팀 워크스페이스에서는 <span className="font-semibold">관리자(소유자)만</span> 회사 롤을 편집할 수 있습니다.
            </p>
          </div>
        </div>
        
        {value && (
          <div className="mt-4 rounded-md border border-yellow-200 bg-white p-3">
            <div className="text-xs font-medium text-muted-foreground mb-2">현재 회사 롤</div>
            <div className="whitespace-pre-wrap text-sm text-foreground">{value}</div>
          </div>
        )}
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="rounded-lg border border-border bg-muted/30 p-4">
        <div className="text-sm font-medium text-foreground">회사 롤이란?</div>
        <p className="mt-1 text-sm text-muted-foreground">
          회사 롤은 <span className="text-foreground">한 번 저장하면 기본적으로 고정</span>되며, 자동 포스팅/CS 응답에 재사용됩니다.
        </p>
      </div>

      <div>
        <label className="mb-2 block text-sm font-medium text-foreground">
          회사 롤 (최대 {maxChars.toLocaleString()}자)
        </label>
        <textarea
          value={value}
          onChange={(e) => onChange(e.target.value)}
          rows={12}
          className="w-full resize-none rounded-md border border-border bg-background px-3 py-2 text-sm text-foreground outline-none focus:ring-2 focus:ring-primary/40"
          placeholder={[
            "예시:",
            "- 회사/브랜드 소개",
            "- 주요 제품/서비스",
            "- 타겟 고객층",
            "- 브랜드 톤앤매너",
            "- 강조할 점 / 금지 표현",
          ].join("\n")}
        />
        <div className="mt-2 flex items-center justify-between text-xs">
          <span className={isOver ? "text-destructive" : "text-muted-foreground"}>
            {count.toLocaleString()} / {maxChars.toLocaleString()}
          </span>
          {isOver && <span className="text-destructive">글자 수를 줄여주세요.</span>}
        </div>
      </div>

      <div className="rounded-md border border-dashed border-border bg-muted/30 p-4">
        <div className="flex items-start gap-3">
          <span className="inline-flex items-center rounded-full bg-primary/10 px-2 py-0.5 text-xs font-semibold text-primary">
            Pro
          </span>
          <div className="flex-1">
            <div className="text-sm font-medium text-foreground">문서 파일 업로드 (준비중)</div>
            <div className="mt-1 text-sm text-muted-foreground">
              Pro 플랜에서는 파일 업로드 후 AI가 요약합니다. (현재는 UI만 표시됩니다.)
            </div>
            <button
              type="button"
              disabled
              className="mt-3 inline-flex items-center justify-center rounded-md border border-border bg-background px-3 py-2 text-sm text-muted-foreground opacity-60 cursor-not-allowed"
            >
              파일 선택 (비활성)
            </button>
          </div>
        </div>
      </div>

      <div className="flex flex-wrap gap-2">
        <button
          type="button"
          onClick={onSave}
          disabled={count === 0 || isOver}
          className="inline-flex items-center justify-center rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground hover:bg-primary/90 disabled:cursor-not-allowed disabled:opacity-60"
        >
          저장하기
        </button>
        {count === 0 && (
          <span className="flex items-center text-xs text-muted-foreground">
            내용을 입력하면 저장할 수 있습니다.
          </span>
        )}
      </div>
    </div>
  );
}
