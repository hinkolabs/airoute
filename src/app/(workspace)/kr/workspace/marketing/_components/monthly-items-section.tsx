"use client";

import React, { useState } from "react";
import { ItemsList } from "./items-list";

export type ItemsState = "none" | "generated";

type Props = {
  isAdminCapable: boolean;
  itemsState: ItemsState;
  onGenerateItems: () => void;
  manualInput: string;
  onChangeManualInput: (v: string) => void;
  onApplyManualInput: () => void;
};

export function MonthlyItemsSection({
  isAdminCapable,
  itemsState,
  onGenerateItems,
  manualInput,
  onChangeManualInput,
  onApplyManualInput,
}: Props) {
  const [isManualMode, setIsManualMode] = useState(false);

  return (
    <div className="space-y-6">
      {/* Action Buttons */}
      {itemsState === "none" && (
        <div className="rounded-lg border border-border bg-card p-4">
          <div className="space-y-4">
            <div>
              <div className="text-sm font-medium text-foreground">아이템 생성 방법</div>
              <p className="mt-1 text-sm text-muted-foreground">
                AI가 회사 롤을 기반으로 15개 아이템을 자동 생성하거나, 직접 입력할 수 있습니다.
              </p>
            </div>

            <div className="flex flex-wrap gap-3">
              <button
                type="button"
                onClick={onGenerateItems}
                disabled={!isAdminCapable}
                className="inline-flex items-center justify-center rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground hover:bg-primary/90 disabled:cursor-not-allowed disabled:opacity-60"
              >
                AI로 15개 아이템 자동 생성
              </button>
              
              <button
                type="button"
                onClick={() => setIsManualMode(!isManualMode)}
                disabled={!isAdminCapable}
                className="inline-flex items-center justify-center rounded-md border border-border bg-background px-4 py-2 text-sm font-medium text-foreground hover:bg-muted disabled:cursor-not-allowed disabled:opacity-60"
              >
                {isManualMode ? "직접 입력 닫기" : "아이템 직접 입력"}
              </button>
            </div>

            {!isAdminCapable && (
              <div className="rounded-md border border-yellow-200 bg-yellow-50 p-3 text-sm text-yellow-800">
                <div className="flex items-start gap-2">
                  <svg
                    className="mt-0.5 h-4 w-4 shrink-0"
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
                  <span>
                    팀 워크스페이스에서는 <span className="font-semibold">관리자만</span> 아이템을 생성하거나 입력할 수 있습니다.
                  </span>
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Manual Input Mode */}
      {isManualMode && itemsState === "none" && (
        <div className="rounded-lg border border-border bg-card p-4">
          <div className="space-y-3">
            <div>
              <label className="mb-2 block text-sm font-medium text-foreground">
                아이템 직접 입력 (한 줄당 1개)
              </label>
              <textarea
                value={manualInput}
                onChange={(e) => onChangeManualInput(e.target.value)}
                rows={8}
                className="w-full resize-none rounded-md border border-border bg-background px-3 py-2 text-sm text-foreground outline-none focus:ring-2 focus:ring-primary/40"
                placeholder={[
                  "예시:",
                  "겨울 세일 프로모션",
                  "신규 회원 할인 이벤트",
                  "봄맞이 특별 패키지",
                  "...",
                ].join("\n")}
              />
              <p className="mt-2 text-xs text-muted-foreground">
                줄바꿈으로 구분하여 입력하세요. 최대 15개까지 입력 가능합니다.
              </p>
            </div>

            <button
              type="button"
              onClick={onApplyManualInput}
              disabled={manualInput.trim().length === 0}
              className="inline-flex items-center justify-center rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground hover:bg-primary/90 disabled:cursor-not-allowed disabled:opacity-60"
            >
              적용
            </button>
          </div>
        </div>
      )}

      {/* Items List */}
      {itemsState === "generated" && <ItemsList />}

      {/* Read-only notice for members */}
      {!isAdminCapable && itemsState === "generated" && (
        <div className="rounded-md border border-blue-200 bg-blue-50 p-3 text-sm text-blue-800">
          <div className="flex items-start gap-2">
            <svg
              className="mt-0.5 h-4 w-4 shrink-0"
              xmlns="http://www.w3.org/2000/svg"
              viewBox="0 0 20 20"
              fill="currentColor"
            >
              <path
                fillRule="evenodd"
                d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z"
                clipRule="evenodd"
              />
            </svg>
            <span>
              생성된 아이템은 조회만 가능합니다. 관리자만 수정/재생성할 수 있습니다.
            </span>
          </div>
        </div>
      )}
    </div>
  );
}
