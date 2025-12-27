import { ReactNode } from 'react';
import { cn } from '@/lib/utils';

interface PageShellProps {
  children: ReactNode;
  className?: string;
}

/**
 * PageShell - 페이지 컨텐츠 래퍼.
 * 배경/텍스트 색상은 AppShell에서 처리하므로 여기서는 레이아웃만 담당.
 */
export default function PageShell({ children, className }: PageShellProps) {
  return (
    <div className={cn(className)}>
      <main className="mx-auto max-w-5xl px-4 py-8 sm:px-6 lg:px-8">
        {children}
      </main>
    </div>
  );
}











