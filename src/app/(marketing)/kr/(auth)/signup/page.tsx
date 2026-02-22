import { notFound } from "next/navigation";
import SignupForm from "@/app/(auth)/signup/_components/SignupForm";
import { getDemoMode } from "@/lib/flags";

export default async function KRSignUpPage() {
  if (await getDemoMode()) {
    notFound();
  }
  
  return <SignupForm locale="kr" />;
}

