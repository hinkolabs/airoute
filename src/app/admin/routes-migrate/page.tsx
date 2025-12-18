"use client";

import { useState } from "react";

/**
 * Routes Migration UI
 * Admin tool for migrating routes to DB
 * 
 * Access: http://localhost:3000/admin/routes-migrate
 */

type ActionResult = {
  status: string;
  message?: string;
  data?: any;
  error?: string;
};

export default function RoutesMigratePage() {
  const [loading, setLoading] = useState(false);
  const [results, setResults] = useState<Record<string, ActionResult>>({});

  const executeAction = async (action: string) => {
    setLoading(true);
    try {
      const res = await fetch(`/api/routes/migrate?action=${action}`);
      const data = await res.json();
      
      setResults((prev) => ({
        ...prev,
        [action]: {
          status: res.ok ? "success" : "error",
          data: data,
        },
      }));
    } catch (error) {
      setResults((prev) => ({
        ...prev,
        [action]: {
          status: "error",
          error: error instanceof Error ? error.message : "Unknown error",
        },
      }));
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-950 p-8">
      <div className="mx-auto max-w-4xl">
        <h1 className="mb-2 text-3xl font-bold text-slate-50">
          Routes Migration Tool
        </h1>
        <p className="mb-8 text-slate-400">
          Migrate routes from src/lib/routes.ts to Supabase DB
        </p>

        {/* Action Buttons */}
        <div className="mb-8 space-y-4 rounded-xl border border-slate-800 bg-slate-900/50 p-6">
          <h2 className="mb-4 text-lg font-semibold text-slate-50">Actions</h2>

          <div className="space-y-3">
            {/* Step 1: Check */}
            <button
              onClick={() => executeAction("check")}
              disabled={loading}
              className="w-full rounded-lg border border-slate-700 bg-slate-800 px-4 py-3 text-left text-sm font-medium text-slate-50 transition hover:bg-slate-700 disabled:opacity-50"
            >
              <div className="flex items-center justify-between">
                <div>
                  <div className="font-semibold">1. Check DB Status</div>
                  <div className="text-xs text-slate-400">
                    Check if routes tables exist and tools.id type
                  </div>
                </div>
                <span className="text-emerald-400">→</span>
              </div>
            </button>

            {/* Step 2: Create */}
            <button
              onClick={() => executeAction("create")}
              disabled={loading}
              className="w-full rounded-lg border border-slate-700 bg-slate-800 px-4 py-3 text-left text-sm font-medium text-slate-50 transition hover:bg-slate-700 disabled:opacity-50"
            >
              <div className="flex items-center justify-between">
                <div>
                  <div className="font-semibold">2. Generate Create SQL</div>
                  <div className="text-xs text-slate-400">
                    Get SQL to create routes and route_tools tables
                  </div>
                </div>
                <span className="text-emerald-400">→</span>
              </div>
            </button>

            {/* Step 3: Seed */}
            <button
              onClick={() => executeAction("seed")}
              disabled={loading}
              className="w-full rounded-lg border border-slate-700 bg-slate-800 px-4 py-3 text-left text-sm font-medium text-slate-50 transition hover:bg-slate-700 disabled:opacity-50"
            >
              <div className="flex items-center justify-between">
                <div>
                  <div className="font-semibold">3. Seed Data</div>
                  <div className="text-xs text-slate-400">
                    Insert 10 routes and their steps from src/lib/routes.ts
                  </div>
                </div>
                <span className="text-emerald-400">→</span>
              </div>
            </button>
          </div>

          {loading && (
            <div className="mt-4 rounded-lg bg-emerald-500/10 px-4 py-2 text-sm text-emerald-400">
              Processing...
            </div>
          )}
        </div>

        {/* Results */}
        {Object.keys(results).length > 0 && (
          <div className="space-y-4">
            <h2 className="text-lg font-semibold text-slate-50">Results</h2>

            {Object.entries(results).map(([action, result]) => (
              <div
                key={action}
                className="rounded-xl border border-slate-800 bg-slate-900/50 p-6"
              >
                <div className="mb-2 flex items-center justify-between">
                  <h3 className="font-semibold text-slate-50 capitalize">
                    {action}
                  </h3>
                  <span
                    className={`rounded-full px-2 py-1 text-xs font-medium ${
                      result.status === "success"
                        ? "bg-emerald-500/20 text-emerald-400"
                        : "bg-red-500/20 text-red-400"
                    }`}
                  >
                    {result.status}
                  </span>
                </div>

                <pre className="mt-3 overflow-x-auto rounded-lg bg-slate-950 p-4 text-xs text-slate-300">
                  {JSON.stringify(result.data || result.error, null, 2)}
                </pre>
              </div>
            ))}
          </div>
        )}

        {/* Instructions */}
        <div className="mt-8 rounded-xl border border-slate-800 bg-slate-900/30 p-6">
          <h2 className="mb-3 text-lg font-semibold text-slate-50">
            Instructions
          </h2>
          <ol className="space-y-2 text-sm text-slate-400">
            <li>
              <span className="font-semibold text-slate-300">1. Check:</span>{" "}
              Verify current DB state
            </li>
            <li>
              <span className="font-semibold text-slate-300">2. Create:</span>{" "}
              Copy SQL and run in Supabase SQL Editor
            </li>
            <li>
              <span className="font-semibold text-slate-300">3. Seed:</span>{" "}
              Insert route data from src/lib/routes.ts
            </li>
          </ol>

          <div className="mt-4 rounded-lg bg-yellow-500/10 px-3 py-2 text-xs text-yellow-400">
            ⚠️ Step 2 requires manual SQL execution in Supabase Dashboard
          </div>
        </div>
      </div>
    </div>
  );
}

