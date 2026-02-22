"use client";

import { useState } from "react";
import { Upload, Image as ImageIcon } from "lucide-react";

export default function SnapClient() {
  const [image, setImage] = useState<File | null>(null);
  const [preview, setPreview] = useState<string | null>(null);

  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setImage(file);
      const reader = new FileReader();
      reader.onloadend = () => {
        setPreview(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  return (
    <div className="mx-auto max-w-3xl space-y-6 p-5">
      <div>
        <h1 className="text-2xl font-bold">스냅(Snap)</h1>
        <p className="mt-2 text-sm text-muted-foreground">
          사진에 로고와 연락처를 빠르게 오버레이하여 공유하세요. (무료)
        </p>
      </div>

      <div className="rounded-lg border border-border bg-card p-6 space-y-4">
        <div>
          <label className="block text-sm font-medium mb-2">사진 업로드</label>
          <div className="flex items-center gap-3">
            <input
              type="file"
              accept="image/*"
              onChange={handleImageChange}
              className="flex-1 text-sm file:mr-4 file:rounded file:border-0 file:bg-primary file:px-4 file:py-2 file:text-sm file:font-medium file:text-primary-foreground hover:file:bg-primary/90"
            />
            {image && (
              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                <ImageIcon className="h-4 w-4" />
                {image.name}
              </div>
            )}
          </div>
        </div>

        {preview && (
          <div className="border rounded-lg p-4">
            <img
              src={preview}
              alt="Preview"
              className="max-w-full h-auto max-h-96 object-contain mx-auto"
            />
          </div>
        )}

        <div className="rounded-lg bg-muted p-4">
          <p className="text-sm font-medium text-muted-foreground">
            로고/연락처 오버레이 기능은 준비 중입니다.
          </p>
        </div>
      </div>

      <div className="rounded-lg bg-muted p-4 text-sm space-y-2">
        <p className="font-medium">안내</p>
        <ul className="list-disc list-inside space-y-1 text-muted-foreground">
          <li>스냅 기능은 무료로 제공됩니다.</li>
          <li>사진에 워크스페이스 로고와 연락처를 자동으로 추가할 수 있습니다.</li>
          <li>클라이언트 브라우저에서 처리되어 빠르고 안전합니다.</li>
        </ul>
      </div>
    </div>
  );
}
