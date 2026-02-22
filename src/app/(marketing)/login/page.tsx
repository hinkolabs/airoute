import { Suspense } from "react";
import { notFound } from "next/navigation";
import LoginForm from "@/app/(auth)/login/_components/LoginForm";
import { getDemoMode } from "@/lib/flags";

export default async function LoginPage() {
  if (await getDemoMode()) {
    notFound();
  }
  
  return (
    <Suspense fallback={<div className="flex min-h-screen items-center justify-center">Loading...</div>}>
      <LoginForm locale="en" />
    </Suspense>
  );
}
