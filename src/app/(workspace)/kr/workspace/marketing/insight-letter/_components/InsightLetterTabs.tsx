"use client";

import { useMemo, useCallback } from "react";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import Badge from "@/components/ui/Badge";

const TAB_KEYS = ["overview", "settings"] as const;
type TabKey = typeof TAB_KEYS[number];

function normalizeTab(value: string | null): TabKey {
  return TAB_KEYS.includes(value as TabKey) ? (value as TabKey) : "overview";
}

interface InsightLetterTabsProps {
  activeTab: string;
  isAdmin: boolean;
  onTabChange: (tab: string) => void;
  overviewContent: React.ReactNode;
  settingsContent: React.ReactNode;
}

export function InsightLetterTabs({
  activeTab,
  isAdmin,
  onTabChange,
  overviewContent,
  settingsContent,
}: InsightLetterTabsProps) {
  // Safe active tab: members cannot access settings
  const safeActiveTab = useMemo(() => {
    const normalized = normalizeTab(activeTab);
    if (!isAdmin && normalized === "settings") {
      return "overview";
    }
    return normalized;
  }, [activeTab, isAdmin]);

  const handleTabChange = useCallback(
    (next: string) => {
      const newTab = normalizeTab(next);
      onTabChange(newTab);
    },
    [onTabChange]
  );

  return (
    <Tabs defaultValue="overview" value={safeActiveTab} onValueChange={handleTabChange} className="w-full">
      <TabsList className="w-full justify-start gap-2 mb-6">
        <TabsTrigger value="overview" className="min-w-[80px]">
          한눈에 보기
        </TabsTrigger>
        {isAdmin ? (
          <TabsTrigger value="settings" className="min-w-[80px]">
            설정
          </TabsTrigger>
        ) : (
          <div className="min-w-[80px] flex items-center justify-center gap-2 px-4 py-2 text-sm font-medium text-muted-foreground/50 cursor-not-allowed">
            설정
            <Badge tone="muted" className="text-xs">
              관리자만
            </Badge>
          </div>
        )}
      </TabsList>

      <TabsContent value="overview" className="pt-2">
        {overviewContent}
      </TabsContent>

      {isAdmin && (
        <TabsContent value="settings" className="pt-2">
          {settingsContent}
        </TabsContent>
      )}
    </Tabs>
  );
}
