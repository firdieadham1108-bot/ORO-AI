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

