"use client";

import ComingSoonBanner from "./_components/coming-soon-banner";
import { User, Bookmark, History } from "lucide-react";
import Link from "next/link";

export default function MyPage() {
  return (
    <div className="min-h-[calc(100vh-80px)] bg-slate-950 px-4 pt-3 pb-24 text-slate-50">
      <div className="mx-auto flex max-w-4xl flex-col gap-6">
        {/* Coming Soon Banner */}
        <ComingSoonBanner />

        {/* Header */}
        <header className="mt-6 space-y-2 text-center">
          <div className="flex justify-center">
            <div className="rounded-full bg-emerald-500/10 p-4">
              <User className="h-8 w-8 text-emerald-400" />
            </div>
          </div>
          <h1 className="text-2xl font-semibold sm:text-3xl">My Airoute</h1>
          <p className="text-sm text-slate-400 sm:text-base">
            Manage your saved tools, history, and preferences.
          </p>
        </header>

        {/* Dashboard Grid */}
        <div className="mt-8 grid gap-4 md:grid-cols-2">
          {/* Saved Tools Card */}
          <div className="rounded-2xl border border-slate-800/70 bg-slate-900/40 p-6 shadow-sm">
            <div className="mb-4 flex items-center gap-3">
              <div className="flex h-12 w-12 items-center justify-center rounded-full bg-emerald-500/10">
                <Bookmark className="h-6 w-6 text-emerald-400" />
              </div>
              <h2 className="text-xl font-bold">Saved Tools</h2>
            </div>
            <p className="mb-4 text-sm text-slate-400">
              Your bookmarked AI tools appear here.
            </p>
            <div className="text-center text-sm text-slate-500">
              No saved tools yet
            </div>
          </div>

          {/* History Card */}
          <div className="rounded-2xl border border-slate-800/70 bg-slate-900/40 p-6 shadow-sm">
            <div className="mb-4 flex items-center gap-3">
              <div className="flex h-12 w-12 items-center justify-center rounded-full bg-emerald-500/10">
                <History className="h-6 w-6 text-emerald-400" />
              </div>
              <h2 className="text-xl font-bold">History</h2>
            </div>
            <p className="mb-4 text-sm text-slate-400">
              Recently viewed AI tools.
            </p>
            <div className="text-center text-sm text-slate-500">
              No history yet
            </div>
          </div>

          {/* Settings Card */}
          <div className="rounded-2xl border border-slate-800/70 bg-slate-900/40 p-6 shadow-sm md:col-span-2">
            <div className="mb-4 flex items-center gap-3">
              <div className="flex h-12 w-12 items-center justify-center rounded-full bg-emerald-500/10">
                <User className="h-6 w-6 text-emerald-400" />
              </div>
              <h2 className="text-xl font-bold">Settings</h2>
            </div>
            <p className="text-sm text-slate-400">
              Account settings and preferences coming soon.
            </p>
          </div>
        </div>

        {/* More Features Coming Soon Notice */}
        <div className="mt-8 rounded-2xl border border-emerald-500/20 bg-emerald-500/5 p-6 text-center">
          <p className="text-sm text-slate-400">
            🚀{" "}
            <strong className="text-slate-50">
              More features coming soon:
            </strong>{" "}
            Tool collections, usage analytics, and personalized
            recommendations.
          </p>
        </div>
      </div>
    </div>
  );
}
