import { Metadata } from "next";
import { Suspense } from "react";
import { getActiveTools } from "@/lib/tools";
import { ToolsListClient } from "@/app/tools/_components/tools-list";
import { FALLBACK_TOOLS } from "@/lib/tool-fallback-data";
import type { ToolRecord } from "@/lib/tools";

export const metadata: Metadata = {
  title: "AI 도구 모음 – Airoute",
  description: "Airoute에서 엄선한 AI 도구를 모두 확인하세요.",
};

export default async function ToolsPage() {
  const dbTools = await getActiveTools("kr");
  
  // Add fallback tools that are not in DB
  const fallbackToolsList = Object.values(FALLBACK_TOOLS).filter(
    fallbackTool => !dbTools.some(dbTool => dbTool.slug === fallbackTool.slug)
  ) as ToolRecord[];
  
  const tools = [...dbTools, ...fallbackToolsList];

  return (
    <Suspense fallback={<div className="flex justify-center items-center min-h-screen">로딩 중...</div>}>
      <ToolsListClient tools={tools} basePath="/kr" locale="kr" />
    </Suspense>
  );
}