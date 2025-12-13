"use client";

import { useState, useEffect } from "react";

export function ScanningBanner() {
  const [text, setText] = useState("Scanning 5,230 tools...");

  useEffect(() => {
    const timer1 = setTimeout(() => {
      setText("Filtering...");
    }, 500);
    const timer2 = setTimeout(() => {
      setText("✓ Found 3 best routes.");
    }, 1000);

    return () => {
      clearTimeout(timer1);
      clearTimeout(timer2);
    };
  }, []);

  return (
    <div className="mb-6 rounded-2xl border border-emerald-500/20 bg-emerald-500/5 px-4 py-3 text-center">
      <p className="text-sm font-medium text-emerald-300">{text}</p>
    </div>
  );
}


