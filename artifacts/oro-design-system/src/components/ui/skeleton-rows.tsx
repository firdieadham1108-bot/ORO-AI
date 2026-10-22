import type { ReactNode } from "react";
import { AlertTriangle, CheckCircle2, Clock3, XCircle, HelpCircle, CircleDot } from "lucide-react";
import type { LucideIcon } from "lucide-react";
export function SkeletonRows({ rows = 4 }: { rows?: number }) {
  return (
    <div className="grid gap-3" aria-busy="true" aria-label="Loading">
      {Array.from({ length: rows }).map((_, i) => (
        <div key={i} className="flex gap-3 items-center">
          <div className="skeleton !w-16" />
          <div className="skeleton flex-1" style={{ opacity: 1 - i * 0.12 }} />
          <div className="skeleton !w-20" />
        </div>
      ))}
    </div>
  );
}

