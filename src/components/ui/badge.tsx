import React from "react";
import { cn } from "@/lib/utils";
import { ClosingStatus } from "@prisma/client";

interface StatusBadgeProps {
  status: ClosingStatus | string;
  className?: string;
}

export function StatusBadge({ status, className }: StatusBadgeProps) {
  let label = status;
  let styleClass = "bg-slate-100 text-slate-700 border-slate-300";

  switch (status) {
    case ClosingStatus.DRAFT:
      label = "DRAFT";
      styleClass = "bg-slate-100 text-slate-700 border-slate-300";
      break;
    case ClosingStatus.SUBMITTED:
      label = "SUBMITTED";
      styleClass = "bg-blue-50 text-blue-700 border-blue-300";
      break;
    case ClosingStatus.REVISION_REQUIRED:
      label = "REVISION REQUIRED";
      styleClass = "bg-amber-50 text-amber-700 border-amber-300";
      break;
    case ClosingStatus.VERIFIED:
      label = "VERIFIED";
      styleClass = "bg-emerald-50 text-emerald-700 border-emerald-300";
      break;
  }

  return (
    <span
      className={cn(
        "inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold border tracking-wide",
        styleClass,
        className
      )}
    >
      {label}
    </span>
  );
}
