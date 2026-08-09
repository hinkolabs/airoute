"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { History, ChevronRight } from "lucide-react";
import { PageContainer, PageHeader, EmptyState, Card, SkeletonRow } from "../_components/ui";
import ShortsSourcingNav from "../_components/shorts-nav";

interface SessionRow {
  id: string;
  product_name_ko: string | null;
  category_ko: string | null;
  created_at: string;
  counts: { total: number; douyin: number; xiaohongshu: number };
}

export default function HistoryClient() {
  const [sessions, setSessions] = useState<SessionRow[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    (async () => {
      setLoading(true);
      const res = await fetch("/api/shorts-sourcing/history");
      const data = await res.json();
      if (res.ok) setSessions(data.sessions ?? []);
      setLoading(false);
    })();
  }, []);

  return (
    <PageContainer>
      <PageHeader title="검색 기록" subtitle="지난 소싱 세션을 다시 열어볼 수 있습니다 (API를 다시 호출하지 않습니다)." />
      <ShortsSourcingNav />

      {loading ? (
        <div className="space-y-3">
          {Array.from({ length: 4 }).map((_, i) => (
            <Card key={i}>
              <SkeletonRow />
            </Card>
          ))}
        </div>
      ) : sessions.length === 0 ? (
        <EmptyState icon={<History className="h-6 w-6" />} title="검색 기록이 없습니다" description="새 소싱을 진행하면 여기에 기록됩니다." />
      ) : (
        <div className="space-y-2">
          {sessions.map((s) => (
            <Link key={s.id} href={`/admin/shopping-shorts/session/${s.id}`}>
              <Card className="flex items-center justify-between" onClick={() => {}}>
                <div>
                  <p className="text-sm font-medium">{s.product_name_ko ?? "이름 없는 상품"}</p>
                  <p className="mt-0.5 text-xs text-muted-foreground">
                    {s.category_ko ?? "-"} · 결과 {s.counts.total}개 (더우인 {s.counts.douyin} · 샤오홍슈 {s.counts.xiaohongshu}) ·{" "}
                    {new Date(s.created_at).toLocaleDateString("ko-KR")}
                  </p>
                </div>
                <ChevronRight className="h-4 w-4 text-muted-foreground" />
              </Card>
            </Link>
          ))}
        </div>
      )}
    </PageContainer>
  );
}
