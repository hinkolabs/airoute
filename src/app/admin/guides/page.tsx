import AdminGuidesListClient from "./_components/admin-guides-list";

export default function AdminGuidesPage() {
  return (
    <div className="min-h-screen bg-slate-950">
      <div className="mx-auto max-w-6xl px-4 py-8">
        <div className="mb-8">
          <h1 className="text-2xl font-bold text-white">가이드 관리</h1>
          <p className="mt-1 text-sm text-white/60">
            가이드를 작성하고 승인/발행할 수 있습니다.
          </p>
        </div>
        <AdminGuidesListClient />
      </div>
    </div>
  );
}



