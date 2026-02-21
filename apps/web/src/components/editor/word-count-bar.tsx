"use client";

import React from "react";

interface WordCountBarProps {
  wordCount: number;
  min: number;
  max: number;
}

export function WordCountBar({ wordCount, min, max }: WordCountBarProps) {
  const hardMax = Math.ceil(max * 1.2);
  const percent = Math.min((wordCount / max) * 100, 120);
  const isUnder = wordCount < min;
  const isInBuffer = wordCount > max && wordCount <= hardMax;
  const isOverHard = wordCount > hardMax;
  const isInRange = wordCount >= min && wordCount <= max;

  const barColor = isOverHard
    ? "bg-red-500"
    : isInBuffer
      ? "bg-amber-400"
      : isInRange
        ? "bg-green-500"
        : wordCount > 0
          ? "bg-amber-400"
          : "bg-gray-300";

  const textColor = isOverHard
    ? "text-red-600"
    : isInBuffer
      ? "text-amber-600"
      : isInRange
        ? "text-green-600"
        : "text-gray-600";

  return (
    <div className="flex items-center gap-3 text-sm">
      <span className={`font-medium tabular-nums ${textColor}`}>
        {wordCount} / {min}–{max} words
      </span>
      <div className="h-2 w-32 rounded-full bg-gray-200 overflow-hidden">
        <div
          className={`h-full rounded-full transition-all duration-300 ${barColor}`}
          style={{ width: `${Math.min(percent, 100)}%` }}
        />
      </div>
      {isOverHard && <span className="text-xs text-red-500 font-medium">Over limit!</span>}
      {isInBuffer && <span className="text-xs text-amber-500 font-medium">Slightly over</span>}
      {isInRange && <span className="text-xs text-green-500">✓</span>}
    </div>
  );
}
