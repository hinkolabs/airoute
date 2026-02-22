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

  // Rank별 색상 차별화 (인라인 버전)
  let colorClass = "text-primary";
  if (rank === 1) colorClass = "text-primary";
  else if (rank === 2) colorClass = "text-primary/80";
  else if (rank === 3) colorClass = "text-primary/80";

  return (
    <span className={`flex items-center gap-1 ${colorClass}`}>
      <span>✓</span>
      <span>{displayScore}% match</span>
    </span>
  );
}
