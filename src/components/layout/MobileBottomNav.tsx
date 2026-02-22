"use client";

import { Home, Route, BookOpen, Wrench, User } from "lucide-react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useDemoMode } from "@/app/_providers/demo-mode-provider";

export default function MobileBottomNav() {
  const pathname = usePathname();
  const demoMode = useDemoMode();
  const isKrMode = pathname.startsWith("/kr");

  // Helper: Get localized path
  const getLocalizedPath = (path: string) => {
    if (isKrMode) {
      return path === "/" ? "/kr" : `/kr${path}`;
    }
    return path;
  };

  const isActive = (path: string) => {
    const localizedPath = getLocalizedPath(path);
    if (path === '/workspace') {
      return pathname.startsWith(localizedPath);
    }
    if (path === '/') {
      return pathname === localizedPath;
    }
    return pathname.startsWith(localizedPath);
  };

  return (
    <nav className="fixed bottom-0 left-0 right-0 z-50 block md:hidden bg-background/90 backdrop-blur border-t border-border pb-safe">
      <div className="flex justify-around items-center h-16">
        <Link href={getLocalizedPath("/")} className={`flex flex-col items-center space-y-1 transition-colors ${isActive('/') ? 'text-primary' : 'text-muted-foreground hover:text-foreground'}`}>
          <Home size={24} />
          <span className="text-xs font-medium">{isKrMode ? "홈" : "Home"}</span>
        </Link>
        <Link href={getLocalizedPath("/routes")} className={`flex flex-col items-center space-y-1 transition-colors ${isActive('/routes') ? 'text-primary' : 'text-muted-foreground hover:text-foreground'}`}>
          <Route size={24} />
          <span className="text-xs font-medium">{isKrMode ? "루트" : "Routes"}</span>
        </Link>
        <Link href={getLocalizedPath("/guides")} className={`flex flex-col items-center space-y-1 transition-colors ${isActive('/guides') ? 'text-primary' : 'text-muted-foreground hover:text-foreground'}`}>
          <BookOpen size={24} />
          <span className="text-xs font-medium">{isKrMode ? "가이드" : "Guides"}</span>
        </Link>
        <Link href={getLocalizedPath("/tools")} className={`flex flex-col items-center space-y-1 transition-colors ${isActive('/tools') ? 'text-primary' : 'text-muted-foreground hover:text-foreground'}`}>
          <Wrench size={24} />
          <span className="text-xs font-medium">{isKrMode ? "도구" : "Tools"}</span>
        </Link>
        {!demoMode && (
          <Link href={getLocalizedPath("/workspace")} className={`flex flex-col items-center space-y-1 transition-colors ${isActive('/workspace') ? 'text-primary' : 'text-muted-foreground hover:text-foreground'}`}>
            <User size={24} />
            <span className="text-xs font-medium">{isKrMode ? "워크스페이스" : "Workspace"}</span>
          </Link>
        )}
      </div>
    </nav>
  );
}

