import AdminGuidesListClient from "./_components/admin-guides-list";

// Layout handles auth/admin check
export default function AdminGuidesPage() {
  return (
    <div className="min-h-screen bg-background">
      <div className="mx-auto max-w-6xl px-4 py-8">
        {/* Back Link */}
        <a
          href="/admin"
          className="mb-4 inline-block text-sm text-primary hover:underline"
        >
          ← 관리자 대시보드로 돌아가기
        </a>
        
        <div className="mb-8">
          <h1 className="text-2xl font-bold text-foreground">가이드 관리</h1>
          <p className="mt-1 text-sm text-muted-foreground">
            가이드를 작성하고 승인/발행할 수 있습니다.
          </p>
        </div>
        <AdminGuidesListClient />
      </div>
    </div>
  );
}



