// Shared building blocks: status badges, page headers, skeletons and empty states.
import type { ReactNode } from "react";
import { AlertTriangle, CheckCircle2, Clock3, XCircle, HelpCircle, CircleDot } from "lucide-react";
import type { LucideIcon } from "lucide-react";

export type Tone = "green" | "amber" | "red" | "verify" | "neutral" | "navy";
const TONE_ICON: Record<Tone, LucideIcon> = {
  green: CheckCircle2, amber: Clock3, red: XCircle, verify: HelpCircle, neutral: CircleDot, navy: CircleDot,
};

export function StatusBadge({ tone, children, icon, testId }: { tone: Tone; children: ReactNode; icon?: LucideIcon; testId?: string }) {
  const Icon = icon ?? TONE_ICON[tone];
  return (
    <span className={`badge badge-${tone}`} data-testid={testId}>
      <Icon size={12} aria-hidden /> {children}
    </span>
  );
}

export function QuoteStatusBadge({ status, risk, testId }: { status: string; risk?: string | null; testId?: string }) {
  if (status === "approved" && risk === "AT_RISK") return <StatusBadge tone="red" icon={AlertTriangle} testId={testId}>Approved · at risk</StatusBadge>;
  if (status === "approved") return <StatusBadge tone="green" testId={testId}>Approved</StatusBadge>;
  if (status === "rejected") return <StatusBadge tone="red" testId={testId}>Declined</StatusBadge>;
  return <StatusBadge tone="amber" testId={testId}>Pending approval</StatusBadge>;
}

export function RiskBadge({ risk }: { risk: string | null | undefined }) {
  if (risk === "AT_RISK") return <StatusBadge tone="red" icon={AlertTriangle}>At risk</StatusBadge>;
  if (risk === "FEASIBLE") return <StatusBadge tone="green">Feasible</StatusBadge>;
  return <StatusBadge tone="verify">Not checked</StatusBadge>;
}

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

export function Empty({ icon: Icon, title, children }: { icon: LucideIcon; title: string; children?: ReactNode }) {
  return (
    <div className="empty">
      <div className="empty-icon"><Icon /></div>
      <div className="empty-title">{title}</div>
      {children && <div className="max-w-sm mx-auto">{children}</div>}
    </div>
  );
}

export const initials = (n: string) => n.replace(/\(.*?\)/g, "").trim().split(/\s+/).map((w) => w[0]).slice(0, 2).join("").toUpperCase();
