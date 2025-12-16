"use client";

import { useEffect } from "react";

type ToastProps = {
  message: string;
  type?: "success" | "error" | "info";
  onClose: () => void;
  duration?: number;
};

export function Toast({ message, type = "success", onClose, duration = 3000 }: ToastProps) {
  useEffect(() => {
    const timer = setTimeout(onClose, duration);
    return () => clearTimeout(timer);
  }, [onClose, duration]);

  const bgColor = {
    success: "bg-emerald-500/90",
    error: "bg-red-500/90",
    info: "bg-slate-700/90",
  }[type];

  return (
    <div 
      className="fixed left-1/2 z-50 -translate-x-1/2 animate-in fade-in slide-in-from-bottom-2 md:bottom-8"
      style={{ bottom: 'calc(env(safe-area-inset-bottom, 0px) + 88px)' }}
    >
      <div className={`${bgColor} rounded-lg px-4 py-2.5 text-sm font-medium text-white shadow-lg`}>
        {message}
      </div>
    </div>
  );
}

