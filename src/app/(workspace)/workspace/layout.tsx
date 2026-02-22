import { ReactNode, Suspense } from "react";
import { notFound } from "next/navigation";
import WorkspaceComingSoon from "./_components/coming-soon";
import { getDemoMode } from "@/lib/flags";

export const dynamic = 'force-dynamic';

export const metadata = {
  title: "Workspace | AIRROUTE",
  description: "AI Workspace Dashboard",
};

export default async function WorkspaceENLayout({ children }: { children: ReactNode }) {
  if (await getDemoMode()) {
    notFound();
  }
  
  // Block all EN workspace pages with Coming Soon
  return <WorkspaceComingSoon />;
}
