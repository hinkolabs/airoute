import { ReactNode, Suspense } from "react";
import { notFound } from "next/navigation";
import WorkspaceHeader from "./_components/workspace-header";
import WorkspaceSidebar from "./_components/workspace-sidebar";
import { WorkspaceProvider } from "@/app/_providers/workspace-provider";
import { getDemoMode } from "@/lib/flags";

export const dynamic = 'force-dynamic';

export const metadata = {
  title: "워크스페이스 | AIRROUTE",
  description: "AI 워크스페이스 대시보드",
};

function WorkspaceContent({ children }: { children: ReactNode }) {
  return (
    <WorkspaceProvider>
      <div className="flex h-screen flex-col">
        {/* Header */}
        <WorkspaceHeader />

        {/* Main Content Area */}
        <div className="flex flex-1 overflow-hidden">
          {/* Desktop Sidebar */}
          <aside className="hidden w-64 border-r border-border bg-card lg:block">
            <WorkspaceSidebar />
          </aside>

          {/* Page Content */}
          <main className="flex-1 overflow-y-auto bg-background">
            {children}
          </main>
        </div>

        {/* Mobile Bottom Nav - TODO (optional) */}
      </div>
    </WorkspaceProvider>
  );
}

export default async function WorkspaceLayout({ children }: { children: ReactNode }) {
  if (await getDemoMode()) {
    notFound();
  }
  
  return (
    <Suspense fallback={
      <div className="flex min-h-screen items-center justify-center">
        <div className="text-center">
          <div className="mb-4 h-8 w-8 animate-spin rounded-full border-4 border-border border-t-primary mx-auto" />
          <p className="text-sm text-muted-foreground">로딩 중...</p>
        </div>
      </div>
    }>
      <WorkspaceContent>{children}</WorkspaceContent>
    </Suspense>
  );
}
