import { notFound } from "next/navigation";
import SignupForm from "@/app/(auth)/signup/_components/SignupForm";
import Link from "next/link";
import { getDemoMode } from "@/lib/flags";

export default async function KRStartPage() {
  if (await getDemoMode()) {
    notFound();
  }
  
  return (
    <div className="flex min-h-screen flex-col">
      <SignupForm locale="kr" />
      
      {/* Login link for mobile users */}
      <div className="mt-6 text-center text-sm text-muted-foreground">
        이미 계정이 있으신가요?{" "}
        <Link href="/kr/login" className="font-medium text-primary hover:underline">
          로그인
        </Link>
      </div>
    </div>
  );
}
