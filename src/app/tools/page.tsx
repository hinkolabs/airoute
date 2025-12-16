import { Metadata } from "next";
import { getActiveTools } from "@/lib/tools";
import { ToolsListClient } from "./_components/tools-list";
import { FALLBACK_TOOLS } from "@/lib/tool-fallback-data";
import type { ToolRecord } from "@/lib/tools";

export const metadata: Metadata = {
  title: "All Tools – Airoute",
  description: "Browse all AI tools listed on Airoute.",
};

export default async function ToolsPage() {
  const dbTools = await getActiveTools();
  
  // Add fallback tools that are not in DB
  const fallbackToolsList = Object.values(FALLBACK_TOOLS).filter(
    fallbackTool => !dbTools.some(dbTool => dbTool.slug === fallbackTool.slug)
  ) as ToolRecord[];
  
  const tools = [...dbTools, ...fallbackToolsList];

  return <ToolsListClient tools={tools} />;
}




