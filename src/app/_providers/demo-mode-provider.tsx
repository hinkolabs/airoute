"use client";

import { createContext, useContext, type ReactNode } from "react";

const DemoModeContext = createContext<boolean>(true);

export function DemoModeProvider({
  enabled,
  children,
}: {
  enabled: boolean;
  children: ReactNode;
}) {
  return (
    <DemoModeContext.Provider value={enabled}>
      {children}
    </DemoModeContext.Provider>
  );
}

export function useDemoMode(): boolean {
  return useContext(DemoModeContext);
}
