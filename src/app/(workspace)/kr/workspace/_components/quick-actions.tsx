import Link from "next/link";
import { Megaphone, Presentation, Image as ImageIcon, Lock } from "lucide-react";

const quickActions = [
  {
    label: "자동 포스팅 시작",
    href: "/kr/workspace/marketing/auto-posting",
    icon: Megaphone,
    description: "Instagram 포스트 자동 생성",
    requiresActive: true,
  },
  {
    label: "PPT 생성",
    href: "/kr/workspace/productivity/ppt",
    icon: Presentation,
    description: "AI 기반 프레젠테이션 템플릿",
    requiresActive: true,
  },
  {
    label: "스냅 (준비중)",
    href: "/kr/workspace/marketing/snap",
    icon: ImageIcon,
    description: "빠른 이미지 편집",
    requiresActive: false,
  },
];

interface QuickActionsProps {
  canUseFeatures: boolean;
}

export default function QuickActions({ canUseFeatures }: QuickActionsProps) {
  return (
    <div className="mb-8">
      <h2 className="mb-4 text-lg font-semibold text-foreground">
        빠른 작업
      </h2>
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {quickActions.map((action) => {
          const Icon = action.icon;
          const isLocked = action.requiresActive && !canUseFeatures;
          
          return (
            <Link
              key={action.href}
              href={isLocked ? "#" : action.href}
              className={`flex flex-col gap-3 rounded-lg border border-border bg-card p-4 transition ${
                isLocked
                  ? "cursor-not-allowed opacity-60"
                  : "hover:border-primary hover:shadow-md"
              }`}
              onClick={(e) => {
                if (isLocked) {
                  e.preventDefault();
                }
              }}
            >
              <div className="flex items-center justify-between">
                <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10">
                  <Icon className="h-5 w-5 text-primary" />
                </div>
                {isLocked && <Lock className="h-4 w-4 text-muted-foreground" />}
              </div>
              <div>
                <p className="font-medium text-foreground">{action.label}</p>
                <p className="text-sm text-muted-foreground">
                  {action.description}
                </p>
              </div>
            </Link>
          );
        })}
      </div>
    </div>
  );
}
