"use client";

import { Home, BookOpen, Sparkles, User } from "lucide-react";
import Link from "next/link";
import { usePathname } from "next/navigation";

export default function MobileBottomNav() {
  const pathname = usePathname();

  // 특정 경로에서 숨기기
  const hiddenRoutes = ["/signup", "/login", "/coming-soon"];
  if (hiddenRoutes.includes(pathname)) return null;

  const isActive = (path: string) => pathname === path;

  return (
    // md 이상(데스크톱)에서 숨기기
    <nav className="fixed bottom-0 left-0 right-0 z-50 md:hidden bg-surface/90 backdrop-blur border-t border-gray-800 pb-safe">
      <div className="flex justify-around items-center h-16">
        <Link 
          href="/" 
          className={`flex flex-col items-center space-y-1 transition-colors ${
            isActive('/') ? 'text-accent-mint' : 'text-gray-500 hover:text-gray-300'
          }`}
        >
          <Home size={24} />
          <span className="text-xs font-medium">Home</span>
        </Link>
        
        <Link 
          href="/guides" 
          className={`flex flex-col items-center space-y-1 transition-colors ${
            isActive('/guides') || pathname.startsWith('/guides/') 
              ? 'text-accent-mint' 
              : 'text-gray-500 hover:text-gray-300'
          }`}
        >
          <BookOpen size={24} />
          <span className="text-xs font-medium">Guides</span>
        </Link>
        
        <Link 
          href="/studio" 
          className={`flex flex-col items-center space-y-1 transition-colors ${
            isActive('/studio') ? 'text-accent-cyan' : 'text-gray-500 hover:text-gray-300'
          }`}
        >
          <Sparkles size={24} />
          <span className="text-xs font-medium">Studio</span>
        </Link>
        
        <Link 
          href="/my" 
          className={`flex flex-col items-center space-y-1 transition-colors ${
            isActive('/my') ? 'text-accent-mint' : 'text-gray-500 hover:text-gray-300'
          }`}
        >
          <User size={24} />
          <span className="text-xs font-medium">My</span>
        </Link>
      </div>
    </nav>
  );
}

