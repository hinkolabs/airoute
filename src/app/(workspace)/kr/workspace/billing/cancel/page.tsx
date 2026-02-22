import Link from "next/link";
import { XCircle } from "lucide-react";

export default function BillingCancelPage() {
  return (
    <div className="mx-auto max-w-2xl px-4 py-16">
      <div className="rounded-lg border border-border bg-card p-8 text-center">
        <div className="mb-6 flex justify-center">
          <XCircle className="h-16 w-16 text-muted-foreground" />
        </div>
        
        <h1 className="mb-4 text-2xl font-bold text-foreground">
          결제가 취소되었습니다
        </h1>
        
        <p className="mb-8 text-sm text-muted-foreground">
          다시 시도하려면 플랜을 선택하고 계속하기 버튼을 눌러주세요.
        </p>

        <div className="flex justify-center gap-4">
          <Link
            href="/kr/workspace"
            className="inline-block rounded-lg border border-border bg-card px-6 py-3 text-sm font-medium text-foreground transition hover:bg-card/80"
          >
            워크스페이스로 돌아가기
          </Link>
          
          <Link
            href="/kr/workspace/billing"
            className="inline-block rounded-lg bg-primary px-6 py-3 text-sm font-medium text-primary-foreground transition hover:bg-primary/90"
          >
            플랜 선택하기
          </Link>
        </div>
      </div>
    </div>
  );
}
