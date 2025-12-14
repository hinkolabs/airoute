"use client";

import { useEffect } from "react";
import { usePathname, useSearchParams } from "next/navigation";

declare global {
  interface Window {
    gtag: (...args: any[]) => void;
  }
}

export default function GaPageView() {
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const gaId = process.env.NEXT_PUBLIC_GA_ID;

  useEffect(() => {
    if (!gaId || typeof window.gtag !== "function") return;

    const url = pathname + searchParams.toString();
    window.gtag("event", "page_view", {
      page_path: url,
    });
  }, [pathname, searchParams, gaId]);

  return null;
}



