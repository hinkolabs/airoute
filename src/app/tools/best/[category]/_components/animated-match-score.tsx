"use client";

import { useState, useEffect } from "react";

interface AnimatedMatchScoreProps {
  targetScore: number;
  delay?: number;
  rank: number;
}

export function AnimatedMatchScore({ 
  targetScore, 
  delay = 0,
  rank 
}: AnimatedMatchScoreProps) {
  const [displayScore, setDisplayScore] = useState(0);

  useEffect(() => {
    // delay 후 애니메이션 시작
    const startTimer = setTimeout(() => {
      // 애니메이션: 0부터 목표 점수까지 증가
      const duration = 800; // 0.8초
      const steps = 20;
      const increment = targetScore / steps;
      const interval = duration / steps;

      let currentStep = 0;
      const animationTimer = setInterval(() => {
        currentStep++;
        if (currentStep <= steps) {
          setDisplayScore(Math.min(Math.round(increment * currentStep), targetScore));
        } else {
          clearInterval(animationTimer);
        }
      }, interval);

      return () => clearInterval(animationTimer);
    }, delay);

    return () => clearTimeout(startTimer);
  }, [targetScore, delay]);

  // Rank별 색상 차별화
  let colorClass = "text-gray-500"; // default
  if (rank === 1) colorClass = "text-emerald-400"; // 네온 그린
  else if (rank === 2) colorClass = "text-emerald-300"; // 민트
  else if (rank === 3) colorClass = "text-gray-400"; // 그레이 톤 그린

  return (
    <div className="flex flex-col items-end">
      <div className="text-xs font-medium text-slate-400">Match</div>
      <div className={`text-2xl font-bold transition-all duration-300 ${colorClass}`}>
        {displayScore}%
      </div>
    </div>
  );
}

