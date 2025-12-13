"use client";

import { useState, useEffect } from "react";

interface AnimatedMatchScoreProps {
  rank: number;
  score: number;
}

export function AnimatedMatchScore({ rank, score }: AnimatedMatchScoreProps) {
  const [displayScore, setDisplayScore] = useState(0);

  useEffect(() => {
    // 애니메이션: 0부터 목표 점수까지 증가
    const duration = 1000; // 1초
    const steps = 30;
    const increment = score / steps;
    const interval = duration / steps;

    let currentStep = 0;
    const timer = setInterval(() => {
      currentStep++;
      if (currentStep <= steps) {
        setDisplayScore(Math.min(Math.round(increment * currentStep), score));
      } else {
        clearInterval(timer);
      }
    }, interval);

    return () => clearInterval(timer);
  }, [score]);

  // Rank별 색상 차별화
  let colorClass = "text-gray-500"; // default
  if (rank === 1) colorClass = "text-emerald-400"; // 네온 그린
  else if (rank === 2) colorClass = "text-emerald-300"; // 민트
  else if (rank === 3) colorClass = "text-gray-400"; // 그레이 톤 그린

  return (
    <div className="flex items-center gap-2">
      <span className="text-xs font-medium text-slate-400">Match:</span>
      <span className={`text-lg font-bold transition-all duration-300 ${colorClass}`}>
        {displayScore}%
      </span>
    </div>
  );
}

