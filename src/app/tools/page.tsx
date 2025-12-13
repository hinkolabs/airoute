import { Metadata } from "next";
import { getActiveTools } from "@/lib/tools";
import { ToolsListClient } from "./_components/tools-list";

export const metadata: Metadata = {
  title: "All Tools – Airoute",
  description: "Browse all AI tools listed on Airoute.",
};

export default async function ToolsPage() {
  const tools = await getActiveTools();

  return <ToolsListClient tools={tools} />;
}



