import Link from "next/link";
import { FileText, Clock } from "lucide-react";

interface RecentResultsProps {
  items: Array<{
    id: string;
    title: string;
    type: string;
    timestamp: string;
  }>;
}

export default function RecentResults({ items }: RecentResultsProps) {
  return (
    <div>
      <div className="mb-4 flex items-center justify-between">
        <h2 className="text-lg font-semibold text-foreground">
          최근 작업 결과
        </h2>
        <Link
          href="/kr/workspace/inbox"
          className="text-sm font-medium text-primary transition hover:underline"
        >
          전체 보기
        </Link>
      </div>

      {items.length === 0 ? (
        <div className="rounded-lg border border-border bg-card p-8 text-center">
          <p className="text-sm text-muted-foreground">
            최근 작업 결과가 없습니다.
          </p>
        </div>
      ) : (
        <div className="space-y-3">
          {items.map((item) => (
            <Link
              key={item.id}
              href={`/kr/workspace/inbox?id=${item.id}`}
              className="flex items-center gap-4 rounded-lg border border-border bg-card p-4 transition hover:border-primary hover:shadow-md"
            >
              <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10">
                <FileText className="h-5 w-5 text-primary" />
              </div>
              <div className="flex-1">
                <p className="font-medium text-foreground">{item.title}</p>
                <div className="mt-1 flex items-center gap-2 text-xs text-muted-foreground">
                  <Clock className="h-3 w-3" />
                  <span>{item.timestamp}</span>
                </div>
              </div>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
