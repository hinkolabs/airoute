"use client";

import { useState } from "react";
import Link from "next/link";
import { getBrowserSupabaseClient } from "@/lib/supabase/browser";

type SignupFormProps = {
  locale: "en" | "kr";
};

export default function SignupForm({ locale }: SignupFormProps) {
  const [email, setEmail] = useState("");
  const [msg, setMsg] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const isKR = locale === "kr";

  async function signUpWithKakao() {
    setMsg(null);
    const supabase = getBrowserSupabaseClient();
    const { error } = await supabase.auth.signInWithOAuth({
      provider: "kakao",
      options: {
        redirectTo: `${window.location.origin}/auth/callback?next=/my`,
      },
    });
    if (error) {
      setMsg(error.message);
    }
  }

  async function signUpWithGoogle() {
    setMsg(null);
    const supabase = getBrowserSupabaseClient();
    const { error } = await supabase.auth.signInWithOAuth({
      provider: "google",
      options: {
        redirectTo: `${window.location.origin}/auth/callback?next=/my`,
      },
    });
    if (error) {
      setMsg(error.message);
    }
  }

  async function signUpWithEmail(e: React.FormEvent) {
    e.preventDefault();
    if (!email) return;

    setMsg(null);
    setLoading(true);

    try {
      const supabase = getBrowserSupabaseClient();
      const { error } = await supabase.auth.signInWithOtp({
        email,
        options: {
          emailRedirectTo: `${window.location.origin}/auth/callback?next=/my`,
        },
      });

      if (error) {
        setMsg(error.message);
      } else {
        setMsg(isKR ? "이메일을 확인해주세요. 가입 링크를 발송했습니다." : "Check your email for the sign-up link.");
      }
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-white px-4 py-16">
      <div className="w-full max-w-md">
        <div className="rounded-2xl border border-gray-200 bg-white shadow-sm p-8">
          <h1 className="text-2xl font-semibold text-gray-900">
            {isKR ? "회원가입" : "Sign up"}
          </h1>
          <p className="mt-2 text-sm text-gray-600">
            {isKR ? "카카오, 구글 또는 이메일로 가입하세요." : "Continue with Google or email."}
          </p>

          <div className="mt-6 space-y-3">
            {isKR && (
              <button
                type="button"
                onClick={signUpWithKakao}
                className="w-full rounded-xl border border-yellow-500 bg-yellow-500 px-4 py-3 font-semibold text-white transition hover:bg-yellow-600"
              >
                카카오로 시작하기
              </button>
            )}

            <button
              type="button"
              onClick={signUpWithGoogle}
              className="w-full rounded-xl border border-blue-500 bg-blue-500 px-4 py-3 font-semibold text-white transition hover:bg-blue-600"
            >
              {isKR ? "구글로 시작하기" : "Continue with Google"}
            </button>
          </div>

          <div className="my-6 flex items-center gap-3">
            <div className="h-px flex-1 bg-gray-200" />
            <span className="text-sm text-gray-500">{isKR ? "또는" : "or"}</span>
            <div className="h-px flex-1 bg-gray-200" />
          </div>

          <form onSubmit={signUpWithEmail}>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full rounded-xl border border-gray-300 bg-white px-4 py-3 text-gray-900 outline-none focus:border-primary focus:ring-2 focus:ring-primary/20"
              placeholder={isKR ? "이메일 주소" : "Email address"}
            />

            <button
              type="submit"
              disabled={loading || !email}
              className="mt-4 w-full rounded-xl border border-primary bg-primary px-4 py-3 font-semibold text-primary-foreground transition hover:bg-primary-hover disabled:cursor-not-allowed disabled:opacity-50"
            >
              {loading ? (isKR ? "발송 중..." : "Sending...") : (isKR ? "이메일로 가입" : "Continue with email")}
            </button>
          </form>

          {msg && (
            <div className="mt-4 text-sm text-primary">{msg}</div>
          )}

          <div className="mt-6 text-center text-sm text-gray-600">
            {isKR ? "이미 계정이 있으신가요? " : "Already have an account? "}
            <Link href={isKR ? "/kr/login" : "/login"} className="font-semibold text-primary hover:text-primary-hover transition">
              {isKR ? "로그인" : "Log in"}
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}

