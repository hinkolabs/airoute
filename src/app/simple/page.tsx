'use client';

import { useEffect, useState } from 'react';
import { DbTool } from '@/types/db-tool';
import ToolCard from '@/components/tool/tool-card';

export default function SimplePage() {
  const [tools, setTools] = useState<DbTool[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function fetchTools() {
      try {
        const response = await fetch('/api/tools');
        if (!response.ok) {
          throw new Error('Failed to fetch tools');
        }
        const data = await response.json();
        setTools(data);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Something went wrong');
      } finally {
        setLoading(false);
      }
    }

    fetchTools();
  }, []);

  return (
    <div className="min-h-screen">
      {/* Header */}
      <div className="border-b border-zinc-800 bg-zinc-950">
        <div className="mx-auto max-w-7xl px-4 py-12 sm:px-6 lg:px-8">
          <h1 className="mb-3 text-3xl font-bold text-white sm:text-4xl">
            Simple Mode
          </h1>
          <p className="max-w-2xl text-zinc-400">
            목적에 맞는 AI 도구를 빠르게 찾아보세요. 모든 도구는 검증된 링크를 제공합니다.
          </p>
        </div>
      </div>

      {/* Tools Grid */}
      <div className="mx-auto max-w-7xl px-4 py-12 sm:px-6 lg:px-8">
        {loading && (
          <div className="flex items-center justify-center py-20">
            <div className="h-8 w-8 animate-spin rounded-full border-2 border-emerald-500 border-t-transparent" />
          </div>
        )}

        {error && (
          <div className="rounded-lg border border-red-500/20 bg-red-500/10 p-6 text-center">
            <p className="text-red-400">{error}</p>
          </div>
        )}

        {!loading && !error && tools.length === 0 && (
          <div className="rounded-lg border border-zinc-800 bg-zinc-900/30 p-12 text-center">
            <p className="text-zinc-400">등록된 도구가 없습니다.</p>
          </div>
        )}

        {!loading && !error && tools.length > 0 && (
          <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {tools.map((tool) => (
              <ToolCard key={tool.id} tool={tool} />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

