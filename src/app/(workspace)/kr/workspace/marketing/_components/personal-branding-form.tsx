"use client";

import React, { useState } from "react";
import { ToneSelector } from "./tone-selector";

export type PersonalBrandingValue = {
  watermarkText: string;
  email: string;
};

type Props = {
  value: PersonalBrandingValue;
  onChange: (v: PersonalBrandingValue) => void;
  onSave: () => void;
  showLogoUpload: boolean; // admin in business, or personal workspace
};

export function PersonalBrandingForm({ value, onChange, onSave, showLogoUpload }: Props) {
  const set = (patch: Partial<PersonalBrandingValue>) => onChange({ ...value, ...patch });
  const [logoPreview, setLogoPreview] = useState<string | null>(null);

  const isEmailValid = value.email.trim().length > 3 && value.email.includes("@");
  const isWatermarkValid = value.watermarkText.trim().length > 0;
  const canSave = isEmailValid && isWatermarkValid;

  const handleLogoSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    
    // Create preview (stub only, no actual upload)
    const reader = new FileReader();
    reader.onloadend = () => {
      setLogoPreview(reader.result as string);
    };
    reader.readAsDataURL(file);
  };

  return (
    <div className="space-y-4">
      <div className="rounded-lg border border-border bg-card p-4">
        <div className="text-sm font-medium text-foreground">개인 설정(멤버별)</div>
        <p className="mt-1 text-sm text-muted-foreground">
          자동 포스팅은 메일로 발송됩니다. 팀이라도 <span className="text-foreground">각 멤버의 워터마크 문구</span>는 멤버별로 다르게 적용됩니다.
        </p>
      </div>

      {/* Logo Upload (admin/owner only in business workspace) */}
      {showLogoUpload && (
        <div className="rounded-lg border border-border bg-card p-4">
          <label className="mb-2 block text-sm font-medium text-foreground">
            로고 업로드 (팀 공통)
          </label>
          <p className="mb-3 text-xs text-muted-foreground">
            이미지 하단에 투명도 20%로 오버레이됩니다. (PNG/JPG, 최대 2MB)
          </p>
          
          <div className="flex items-start gap-4">
            {logoPreview && (
              <div className="flex h-24 w-24 shrink-0 items-center justify-center rounded-lg border border-border bg-muted">
                <img src={logoPreview} alt="로고 미리보기" className="h-full w-full rounded-lg object-contain" />
              </div>
            )}
            
            <div className="flex-1">
              <input
                type="file"
                accept="image/png,image/jpeg,image/jpg"
                onChange={handleLogoSelect}
                className="block w-full text-sm text-muted-foreground file:mr-4 file:rounded-md file:border-0 file:bg-primary file:px-4 file:py-2 file:text-sm file:font-medium file:text-primary-foreground hover:file:bg-primary/90"
              />
              <p className="mt-2 text-xs text-muted-foreground">
                업로드는 실제 동작하지 않습니다 (UI 전용).
              </p>
            </div>
          </div>
        </div>
      )}

      <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
        <div className="rounded-lg border border-border bg-card p-4">
          <label className="mb-2 block text-xs font-medium text-muted-foreground">이메일 수신 주소(필수)</label>
          <input
            type="email"
            value={value.email}
            onChange={(e) => set({ email: e.target.value })}
            className="w-full rounded-md border border-border bg-background px-3 py-2 text-sm text-foreground outline-none focus:ring-2 focus:ring-primary/40"
            placeholder="you@company.com"
          />
          <p className="mt-2 text-xs text-muted-foreground">블로그용/SNS용 초안이 이 이메일로 발송됩니다.</p>
        </div>

        <div className="rounded-lg border border-border bg-card p-4">
          <label className="mb-2 block text-xs font-medium text-muted-foreground">이미지에 들어갈 문구(필수) · 최대 60자</label>
          <input
            value={value.watermarkText}
            onChange={(e) => set({ watermarkText: e.target.value.slice(0, 60) })}
            className="w-full rounded-md border border-border bg-background px-3 py-2 text-sm text-foreground outline-none focus:ring-2 focus:ring-primary/40"
            placeholder="예: 문의 010-1234-5678 / 카카오톡 @airoute"
          />
          <p className="mt-2 text-xs text-muted-foreground">
            모든 발송 이미지 하단에 로고 + 이 문구가 자동으로 합성됩니다.
          </p>
        </div>
      </div>

      <div className="flex flex-wrap items-center gap-2">
        <button
          type="button"
          onClick={onSave}
          disabled={!canSave}
          className="inline-flex items-center justify-center rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground hover:bg-primary/90 disabled:cursor-not-allowed disabled:opacity-60"
        >
          저장
        </button>
        {!canSave && (
          <span className="text-xs text-muted-foreground">
            이메일과 워터마크 문구를 입력하면 저장할 수 있습니다.
          </span>
        )}
      </div>

      {/* Tone Selector Section */}
      <div className="border-t border-border pt-6">
        <ToneSelector />
      </div>
    </div>
  );
}
