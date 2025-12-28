"use client";

import { useState } from "react";

export default function AdminLoginPage() {
  const [key, setKey] = useState("");
  const [msg, setMsg] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setMsg(null);
    setLoading(true);
    
    try {
      const res = await fetch("/api/admin/auth", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ key }),
      });
      
      if (res.ok) {
        location.href = "/admin/guides";
      } else {
        setMsg("키가 올바르지 않습니다.");
      }
    } catch {
      setMsg("오류가 발생했습니다.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-slate-950 px-4">
      <div className="w-full max-w-md">
        <div className="rounded-2xl border border-slate-800 bg-slate-900/50 p-8">
          <h1 className="text-xl font-semibold text-white">Admin 로그인</h1>
          <p className="mt-2 text-sm text-white/60">ADMIN_KEY를 입력하세요.</p>

          <form onSubmit={onSubmit} className="mt-6">
            <input
              type="password"
              value={key}
              onChange={(e) => setKey(e.target.value)}
              className="w-full rounded-xl border border-white/10 bg-white/5 px-4 py-3 text-white outline-none focus:border-emerald-500/50 focus:ring-1 focus:ring-emerald-500/50"
              placeholder="ADMIN_KEY"
              autoFocus
            />

            <button
              type="submit"
              disabled={loading || !key}
              className="mt-4 w-full rounded-xl border border-emerald-500/30 bg-emerald-500/20 px-4 py-3 font-semibold text-emerald-300 transition hover:bg-emerald-500/30 disabled:cursor-not-allowed disabled:opacity-50"
            >
              {loading ? "확인 중..." : "로그인"}
            </button>
          </form>

          {msg && <div className="mt-4 text-sm text-red-400">{msg}</div>}
        </div>
      </div>
    </div>
  );
}






