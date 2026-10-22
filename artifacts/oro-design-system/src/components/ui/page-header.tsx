import type { ReactNode } from "react";
import { AlertTriangle, CheckCircle2, Clock3, XCircle, HelpCircle, CircleDot } from "lucide-react";
import type { LucideIcon } from "lucide-react";
export function PageHeader({ eyebrow, title, sub, actions }: { eyebrow: string; title: string; sub?: string; actions?: ReactNode }) {
  return (
    <div className="page-head no-print">
      <div className="min-w-0">
        <div className="eyebrow">{eyebrow}</div>
        <h1>{title}</h1>
        {sub && <p>{sub}</p>}
      </div>
      {actions && <div className="flex flex-wrap gap-2 items-center">{actions}</div>}
    </div>
  );
}

