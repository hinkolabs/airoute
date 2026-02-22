import { Suspense } from "react";
import { notFound } from "next/navigation";
import LoginForm from "@/app/(auth)/login/_components/LoginForm";
import { getDemoMode } from "@/lib/flags";

export default async function KRLoginPage() {
  if (await getDemoMode()) {
    notFound();
  }
  
  return (
    <Suspense fallback={<div className="flex min-h-screen items-center justify-center">로딩 중...</div>}>
      <LoginForm locale="kr" />
    </Suspense>
  );
}

