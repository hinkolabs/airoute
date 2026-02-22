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
    success: "border-primary bg-primary/10",
    error: "border-red-700 bg-red-900/90",
    info: "border-slate-600 bg-slate-800/90",
  }[type];

  const textColor = {
    success: "text-primary",
    error: "text-red-100",
    info: "text-slate-100",
  }[type];

  return (
    <div 
      className="fixed left-1/2 top-4 z-50 -translate-x-1/2 animate-in fade-in slide-in-from-top-2"
      style={{ top: 'calc(env(safe-area-inset-top, 0px) + 16px)' }}
    >
      <div className={`${bgColor} ${textColor} rounded-xl border px-4 py-3 text-sm font-medium shadow-lg backdrop-blur-md`}>
        {message}
      </div>
    </div>
  );
}

