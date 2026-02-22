"use client";

import { ReactNode } from "react";

interface SectionShellProps {
  title: string;
  description?: string;
  children: ReactNode;
}

export function SectionShell({ title, description, children }: SectionShellProps) {
  return (
    <section className="mb-8">
      <div className="mb-4">
        <h2 className="text-lg font-bold text-foreground">{title}</h2>
        {description && (
          <p className="mt-1 text-sm text-muted-foreground">{description}</p>
        )}
      </div>
      <div className="rounded-lg border border-border bg-card p-6">
        {children}
      </div>
    </section>
  );
}
