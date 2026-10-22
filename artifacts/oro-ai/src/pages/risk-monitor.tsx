import { useState } from "react";
import { Link } from "wouter";
import { useListCommitments } from "@workspace/api-client-react";
import type { Commitment } from "@workspace/api-client-react";
import { ShieldCheck } from "lucide-react";
import { ErrorBox } from "@/components/shell";
import { RiskAlerts, SimulationBar } from "@/components/risk";
import { PageHeader } from "@workspace/oro-design-system/components/ui/page-header";
import { RiskBadge } from "@workspace/oro-design-system/components/ui/status-badges";
import { SkeletonRows } from "@workspace/oro-design-system/components/ui/skeleton-rows";
import { Empty } from "@workspace/oro-design-system/components/ui/empty-state";
import { rm } from "@/lib/util";
import { shortDay } from "@/lib/dates";

export default function RiskMonitor() {
  const [recovered, setRecovered] = useState<Commitment | null>(null);
  const q = useListCommitments();
  const rows = [...(q.data ?? [])].sort((a, b) => (a.quote.riskStatus === "AT_RISK" ? -1 : 0) - (b.quote.riskStatus === "AT_RISK" ? -1 : 0) || (a.quote.appointmentDate ?? "").localeCompare(b.quote.appointmentDate ?? ""));
  const atRisk = rows.filter((c) => c.quote.riskStatus === "AT_RISK").length;
  return (
    <div className="page">
      <PageHeader eyebrow="Risk monitor" title="Keep the promises already made" sub="ORO watches every approved job against new leave and job records from Orbyte." />
      <SimulationBar />
      <RiskAlerts recovered={recovered} onRecovered={setRecovered} />
      <section className="panel !p-0 overflow-hidden">
        <div className="panel-heading px-5 pt-4"><div><h2>Approved commitments</h2><p>{q.data ? `${rows.length} approved · ${atRisk} at risk` : "Loading"}</p></div></div>
        {q.isLoading ? <div className="p-5"><SkeletonRows /></div> : q.isError ? <div className="p-5"><ErrorBox error={q.error} onRetry={() => q.refetch()} /></div> : rows.length === 0 ? (
          <Empty icon={ShieldCheck} title="No approved commitments yet">Approved quotations are monitored here automatically.</Empty>
        ) : (
          <div className="table-wrap">
            <table className="data-table stack-mobile">
              <thead><tr><th>Reference</th><th>Customer</th><th>Date</th><th>Crew</th><th className="r">Total</th><th>Status</th><th>Reason</th></tr></thead>
              <tbody>
                {rows.map((c) => (
                  <tr key={c.quote.id} className={c.quote.riskStatus === "AT_RISK" ? "row-risk" : ""} data-testid={`row-commitment-${c.quote.id}`}>
                    <td data-label="Reference"><Link href={`/quotations?open=${c.quote.id}`} className="table-link mono">{c.quote.reference}</Link></td>
                    <td data-label="Customer"><span className="customer">{c.quote.customerName}</span></td>
                    <td data-label="Date" className="nowrap">{c.quote.appointmentDate ? shortDay(c.quote.appointmentDate) : "—"}</td>
                    <td data-label="Crew">{c.quote.crew.join(", ") || "—"}</td>
                    <td data-label="Total" className="r money">{rm(c.quote.totalPrice)}</td>
                    <td data-label="Status"><RiskBadge risk={c.quote.riskStatus} /></td>
                    <td data-label="Reason" className="secondary-text max-w-[280px]">{c.quote.riskReason ?? (c.quote.riskStatus === "FEASIBLE" ? "Crew still available" : "—")}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </section>
    </div>
  );
}
