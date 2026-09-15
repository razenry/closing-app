import React from "react";
import { cn } from "@/lib/utils";

interface ProgressBarProps {
  percentage: number;
  className?: string;
  showText?: boolean;
}

export function ProgressBar({ percentage, className, showText = true }: ProgressBarProps) {
  const safePercent = Math.min(100, Math.max(0, percentage));
  const isComplete = safePercent >= 100;

  return (
    <div className={cn("w-full", className)}>
      <div className="w-full bg-slate-200 rounded-full h-2.5 overflow-hidden">
        <div
          className={cn(
            "h-2.5 rounded-full transition-all duration-300",
            isComplete ? "bg-emerald-600" : "bg-amber-500"
          )}
          style={{ width: `${safePercent}%` }}
        />
      </div>
      {showText && (
        <div className="flex justify-between items-center mt-1.5 text-xs text-slate-500">
          <span>Kelengkapan Dokumen</span>
          <span className={cn("font-semibold", isComplete ? "text-emerald-700" : "text-amber-700")}>
            {safePercent}%
          </span>
        </div>
      )}
    </div>
  );
}
