import type { ReactNode } from "react";
import { AlertTriangle, CheckCircle2, Clock3, XCircle, HelpCircle, CircleDot } from "lucide-react";
import type { LucideIcon } from "lucide-react";
export function Empty({ icon: Icon, title, children }: { icon: LucideIcon; title: string; children?: ReactNode }) {
  return (
    <div className="empty">
      <div className="empty-icon"><Icon /></div>
      <div className="empty-title">{title}</div>
      {children && <div className="max-w-sm mx-auto">{children}</div>}
    </div>
  );
}

