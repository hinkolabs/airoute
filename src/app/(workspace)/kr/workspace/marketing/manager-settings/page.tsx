"use client";

import { useState, useEffect } from "react";
import { useWorkspace } from "@/app/_providers/workspace-provider";
import { Button } from "@/components/ui/button";
import Badge from "@/components/ui/Badge";
import { Upload, X } from "lucide-react";

// Manager Settings structure
interface ManagerSettings {
  logoUrl?: string;
  companyNotes?: string;
  files?: { name: string; size: number; type: string }[];
}

export default function KrWorkspaceMarketingManagerSettingsPage() {
  const { activeWorkspace, loading } = useWorkspace();
  
  const [logoUrl, setLogoUrl] = useState("");
  const [logoFile, setLogoFile] = useState<File | null>(null);
  const [brandName, setBrandName] = useState("");
  const [companyNotes, setCompanyNotes] = useState("");
  const [uploadedFiles, setUploadedFiles] = useState<{ name: string; size: number; type: string }[]>([]);
  const [saved, setSaved] = useState(false);
  const [saving, setSaving] = useState(false);
  const [loadingSettings, setLoadingSettings] = useState(true);

  // Load existing settings from DB
  useEffect(() => {
    if (!activeWorkspace) return;
    
    const loadSettings = async () => {
      try {
        setLoadingSettings(true);
        const res = await fetch(`/api/workspace/manager-settings?workspace_id=${activeWorkspace.workspace.id}`);
        if (res.ok) {
          const data = await res.json();
          if (data.settings) {
            setLogoUrl(data.settings.logo_url || "");
            setBrandName(data.settings.brand_name || "");
            setCompanyNotes(data.settings.company_profile || "");
            setUploadedFiles(data.settings.attachments || []);
          }
        }
      } catch (err) {
        console.error("Failed to load manager settings:", err);
      } finally {
        setLoadingSettings(false);
      }
    };

    loadSettings();
  }, [activeWorkspace]);

  // Handle logo file upload (UI only - store filename)
  const handleLogoFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      // Check if it's an image
      if (!file.type.startsWith("image/")) {
        alert("이미지 파일만 업로드 가능합니다.");
        return;
      }
      setLogoFile(file);
    }
  };

  // Handle material files upload (UI only - store filenames)
  const handleMaterialFilesChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (files) {
      const newFiles = Array.from(files).map((file) => ({
        name: file.name,
        size: file.size,
        type: file.type,
      }));
      setUploadedFiles([...uploadedFiles, ...newFiles]);
    }
  };

  // Remove uploaded file
  const handleRemoveFile = (index: number) => {
    setUploadedFiles(uploadedFiles.filter((_, i) => i !== index));
  };

  // Save settings to DB
  const handleSave = async () => {
    if (!activeWorkspace) return;
    
    try {
      setSaving(true);
      const res = await fetch(`/api/workspace/manager-settings`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          workspace_id: activeWorkspace.workspace.id,
          brand_name: brandName,
          logo_url: logoUrl,
          company_profile: companyNotes,
          attachments: uploadedFiles,
        }),
      });

      if (!res.ok) {
        const errData = await res.json();
        throw new Error(errData.error || "저장 실패");
      }

      setSaved(true);
      setTimeout(() => setSaved(false), 3000);
    } catch (err) {
      console.error("Failed to save manager settings:", err);
      alert("저장 중 오류가 발생했습니다.");
    } finally {
      setSaving(false);
    }
  };

  // Role-based access control
  const workspaceName = activeWorkspace?.workspace.name || "워크스페이스";
  const workspaceType = activeWorkspace?.workspaceType || "personal";
  const userRole = activeWorkspace?.role || "member";
  const isPersonalWorkspace = workspaceType === "personal";
  const isAdmin = userRole === "owner" || userRole === "admin";
  const canEdit = isPersonalWorkspace || isAdmin;

  if (loading || loadingSettings) {
    return (
      <div className="px-4 py-8 md:px-6">
        <div className="flex items-center justify-center py-12">
          <div className="text-muted-foreground">로딩 중...</div>
        </div>
      </div>
    );
  }

  // Access denied for non-admin members
  if (!canEdit) {
    return (
      <div className="px-4 py-8 md:px-6 max-w-7xl">
        <div className="rounded-lg border border-amber-200 bg-amber-50 p-6">
          <h2 className="text-lg font-bold text-amber-900 mb-2">
            접근 권한이 없습니다
          </h2>
          <p className="text-sm text-amber-800 leading-relaxed">
            담당자 셋팅은 관리자만 수정할 수 있습니다.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="px-4 py-8 md:px-6 max-w-7xl">
      {/* Top Header */}
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-foreground mb-2">
          담당자 셋팅 · {workspaceName}
        </h1>
        <p className="text-sm text-muted-foreground flex items-center gap-2">
          마케팅 기능에서 공통으로 사용할 기본 설정입니다
          <Badge tone="muted" className="text-xs">
            {workspaceType === "personal" ? "개인" : "팀"}
          </Badge>
        </p>
      </div>

      {/* Info Banner */}
      <div className="mb-6 rounded-lg border border-blue-200 bg-blue-50 px-4 py-3">
        <p className="text-sm text-blue-800 leading-relaxed">
          <span className="font-semibold">이 설정은 다음 기능에서 공용으로 사용됩니다:</span> 자동 포스팅, 인사이트 레터, CS 지원
        </p>
      </div>

      <div className="space-y-6">
        {/* Section A: 로고 등록 */}
        <div className="rounded-lg border border-border bg-card p-6">
          <h2 className="text-xl font-bold text-foreground mb-4">A) 브랜드 정보</h2>
          <p className="text-sm text-muted-foreground mb-6">
            브랜드명과 로고를 등록하세요.
          </p>

          <div className="space-y-4">
            {/* Brand Name Input */}
            <div>
              <label className="block text-sm font-semibold text-foreground mb-2">
                브랜드명
              </label>
              <input
                type="text"
                value={brandName}
                onChange={(e) => setBrandName(e.target.value)}
                className="w-full rounded-md border border-border bg-background px-4 py-3 text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-primary"
                placeholder="예) AIROUTE"
              />
            </div>

            {/* Logo URL Input */}
            <div>
              <label className="block text-sm font-semibold text-foreground mb-2">
                로고 URL
              </label>
              <input
                type="text"
                value={logoUrl}
                onChange={(e) => setLogoUrl(e.target.value)}
                className="w-full rounded-md border border-border bg-background px-4 py-3 text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-primary"
                placeholder="예) https://example.com/logo.png"
              />
            </div>

            {/* OR Divider */}
            <div className="flex items-center gap-3">
              <div className="flex-1 h-px bg-border"></div>
              <span className="text-xs text-muted-foreground">또는</span>
              <div className="flex-1 h-px bg-border"></div>
            </div>

            {/* Logo File Upload */}
            <div>
              <label className="block text-sm font-semibold text-foreground mb-2">
                로고 파일 업로드
              </label>
              <div className="flex items-center gap-3">
                <label className="cursor-pointer">
                  <input
                    type="file"
                    accept="image/*"
                    onChange={handleLogoFileChange}
                    className="hidden"
                  />
                  <div className="flex items-center gap-2 rounded-md border border-border bg-background px-4 py-2 text-sm text-foreground hover:bg-muted transition">
                    <Upload className="h-4 w-4" />
                    파일 선택
                  </div>
                </label>
                {logoFile && (
                  <div className="flex items-center gap-2">
                    <span className="text-sm text-foreground">{logoFile.name}</span>
                    <Badge tone="muted" className="text-xs">업로드(준비중)</Badge>
                  </div>
                )}
              </div>
              <p className="text-xs text-muted-foreground mt-2">
                이미지 파일 (png, jpg, gif 등)만 업로드 가능합니다. 실제 업로드 기능은 준비 중입니다.
              </p>
            </div>
          </div>
        </div>

        {/* Section B: 회사/상품/마케팅 자료 업로드 */}
        <div className="rounded-lg border border-border bg-card p-6">
          <h2 className="text-xl font-bold text-foreground mb-4">B) 회사/상품/마케팅 자료 업로드</h2>
          <p className="text-sm text-muted-foreground mb-6">
            회사 소개, 상품 설명, 마케팅 자료를 입력하세요.
          </p>

          <div className="space-y-4">
            {/* Company Notes */}
            <div>
              <label className="block text-sm font-semibold text-foreground mb-2">
                회사/상품 설명 (베이스)
              </label>
              <textarea
                value={companyNotes}
                onChange={(e) => setCompanyNotes(e.target.value)}
                className="w-full rounded-md border border-border bg-background px-4 py-3 text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-primary min-h-[150px] leading-relaxed"
                placeholder="예) AIROUTE는 마케팅 자동화 솔루션을 제공합니다. AI 기반으로 블로그 포스팅, 이메일 발송, CS 답변을 자동화합니다."
              />
            </div>

            {/* File Upload Area */}
            <div>
              <label className="block text-sm font-semibold text-foreground mb-2">
                자료 파일 업로드
              </label>
              <label className="cursor-pointer">
                <input
                  type="file"
                  multiple
                  accept=".pdf,.docx,.png,.jpg,.jpeg,.txt"
                  onChange={handleMaterialFilesChange}
                  className="hidden"
                />
                <div className="flex items-center justify-center gap-2 rounded-md border-2 border-dashed border-border bg-muted/30 px-6 py-8 text-sm text-muted-foreground hover:bg-muted/50 transition">
                  <Upload className="h-5 w-5" />
                  파일 선택 또는 드래그 앤 드롭
                </div>
              </label>
              <p className="text-xs text-muted-foreground mt-2">
                pdf, docx, png, jpg, txt 파일을 업로드할 수 있습니다. 실제 업로드 기능은 준비 중입니다.
              </p>
            </div>

            {/* Uploaded Files List */}
            {uploadedFiles.length > 0 && (
              <div className="space-y-2">
                <p className="text-sm font-semibold text-foreground">업로드된 파일 ({uploadedFiles.length}개)</p>
                <div className="space-y-2">
                  {uploadedFiles.map((file, idx) => (
                    <div
                      key={idx}
                      className="flex items-center justify-between rounded-md border border-border bg-background px-4 py-2"
                    >
                      <div className="flex-1 min-w-0">
                        <p className="text-sm text-foreground truncate">{file.name}</p>
                        <p className="text-xs text-muted-foreground">
                          {(file.size / 1024).toFixed(1)} KB
                        </p>
                      </div>
                      <button
                        onClick={() => handleRemoveFile(idx)}
                        className="ml-2 text-muted-foreground hover:text-destructive transition"
                      >
                        <X className="h-4 w-4" />
                      </button>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Section C: 저장 */}
        <div className="rounded-lg border border-border bg-card p-6">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-lg font-bold text-foreground mb-1">설정 저장</h2>
              <p className="text-sm text-muted-foreground">
                저장하면 모든 마케팅 기능에서 이 설정이 적용됩니다.
              </p>
            </div>
            <div className="flex items-center gap-3">
              {saved && (
                <Badge tone="primary" className="text-xs">
                  저장 완료
                </Badge>
              )}
              <Button
                variant="primary"
                size="lg"
                onClick={handleSave}
                disabled={saving}
              >
                {saving ? "저장 중..." : "저장"}
              </Button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
