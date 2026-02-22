import { Suspense } from "react";
import Header from "@/components/layout/header";

export default function ToolsLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <>
      <Suspense fallback={<div className="h-16" />}>
        <Header />
      </Suspense>
      {children}
    </>
  );
}
