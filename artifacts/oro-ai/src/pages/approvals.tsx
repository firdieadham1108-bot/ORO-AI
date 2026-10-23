import { useEffect, useMemo, useState } from "react";
import { useQueryClient } from "@tanstack/react-query";
import {
  useListQuotes, useGetQuoteScheduleOptions, useApproveDraftQuotation, useRejectDraftQuotation,
  getGetQuoteScheduleOptionsQueryKey, getListQuotesQueryKey, getGetDashboardSummaryQueryKey, getListActivityQueryKey,
  getGetOrbyteWalletQueryKey, getListCommitmentsQueryKey, getGetStaffScheduleQueryKey,
} from "@workspace/api-client-react";
import type { Quote, ScheduleCheck } from "@workspace/api-client-react";
import { ClipboardCheck, CheckCircle2, XCircle, Loader2, ChevronDown, MessageSquareQuote, Users, AlertTriangle, HelpCircle, Lock } from "lucide-react";
import { ErrorBox } from "@/components/shell";
import { LockBadge } from "@/components/lock-badge";
import { PageHeader } from "@workspace/oro-design-system/components/ui/page-header";
import { QuoteStatusBadge, StatusBadge } from "@workspace/oro-design-system/components/ui/status-badges";
import { SkeletonRows } from "@workspace/oro-design-system/components/ui/skeleton-rows";
import { Empty } from "@workspace/oro-design-system/components/ui/empty-state";
import { useRole } from "@/lib/role";
import { rm, myTime } from "@/lib/util";
import { shortDay } from "@/lib/dates";

export default function Approvals() {
  const q = useListQuotes();
  const sorted = useMemo(() => [...(q.data ?? [])].sort((a, b) => b.createdAt.localeCompare(a.createdAt)), [q.data]);
  const drafts = sorted.filter((x) => x.status === "draft");
  const history = sorted.filter((x) => x.status !== "draft").slice(0, 12);
  const [openId, setOpenId] = useState<number | null>(null);
  const [done, setDone] = useState<{ q: Quote; kind: "approved" | "rejected" } | null>(null);
  useEffect(() => { if (openId == null || !drafts.some((d) => d.id === openId)) setOpenId(drafts[0]?.id ?? null); }, [drafts, openId]);

  return (
    <div className="page">
      <PageHeader eyebrow="Manager approval" title="Quotations awaiting approval" sub="Only submitted drafts appear here. Analysing an enquiry or letting its availability check expire does not submit it. Crew availability is checked again on approval." />
      {done && (
        <div className={`notice ${done.kind === "approved" ? "success" : "warn"} mb-4`} role="status" data-testid="notice-decision">
          {done.kind === "approved" ? <CheckCircle2 /> : <XCircle />}
          <div className="flex-1">
            {done.kind === "approved" ? (
              <><strong>{done.q.reference} approved for {done.q.appointmentDate ? shortDay(done.q.appointmentDate) : "the chosen date"}.</strong> Confirmed crew: {done.q.crew.join(", ") || "to be assigned"}.</>
            ) : (
              <><strong>{done.q.reference} declined.</strong> {done.q.rejectionReason ? `Reason: ${done.q.rejectionReason}` : "No reason given."}</>
            )}
          </div>
          <button className="btn btn-ghost !min-h-[32px]" onClick={() => setDone(null)}>Dismiss</button>
        </div>
      )}
      {q.isError && <ErrorBox error={q.error} onRetry={() => q.refetch()} />}
      <div className="flex items-center gap-2 mb-3"><h2 className="section-title">Queue</h2>{q.data && <span className="count-pill">{drafts.length}</span>}</div>
      {q.isLoading ? <div className="panel"><SkeletonRows rows={4} /></div> : drafts.length === 0 && q.data ? (
        <div className="panel"><Empty icon={ClipboardCheck} title="Queue is clear">When Mei sends a priced enquiry for approval, it lands here.</Empty></div>
      ) : (
        <div className="grid gap-3">
          {drafts.map((d, i) => (
            <DraftCard key={d.id} q={d} i={i} open={openId === d.id} onToggle={() => setOpenId(openId === d.id ? -1 : d.id)} onDone={(r, kind) => setDone({ q: r, kind })} />
          ))}
        </div>
      )}

      <div className="flex items-center gap-2 mt-8 mb-3"><h2 className="section-title">Recent decisions</h2></div>
      <section className="panel !p-0 overflow-hidden">
        {q.isLoading ? <div className="p-5"><SkeletonRows rows={3} /></div> : q.isError ? <p className="p-5 text-sm text-muted-foreground">Decision history could not be loaded. Retry using the message above.</p> : history.length === 0 ? <Empty icon={ClipboardCheck} title="No decisions yet" /> : (
          <div className="grid">
            {history.map((h) => (
              <div key={h.id} className="hist-row" data-testid={`row-history-${h.id}`}>
                <span className="mono">{h.reference}</span>
                <span className="customer truncate">{h.customerName}</span>
                <span className="secondary-text !mt-0 truncate">{h.status === "approved" ? `${h.appointmentDate ? shortDay(h.appointmentDate) : ""} · ${h.crew.join(", ")}` : h.rejectionReason ?? "Declined"}</span>
                <span className="money">{rm(h.totalPrice)}</span>
                <QuoteStatusBadge status={h.status} risk={h.riskStatus} />
              </div>
            ))}
          </div>
        )}
      </section>
    </div>
  );
}

function DraftCard({ q, i, open, onToggle, onDone }: { q: Quote; i: number; open: boolean; onToggle: () => void; onDone: (q: Quote, k: "approved" | "rejected") => void }) {
  return (
    <section className={`panel draft-card stagger ${open ? "open" : ""}`} style={{ animationDelay: `${i * 40}ms` }} data-testid={`card-draft-${q.id}`}>
      <button className="draft-head" onClick={onToggle} aria-expanded={open} data-testid={`button-toggle-draft-${q.id}`}>
        <div className="min-w-0 flex-1 text-left">
          <div className="flex items-center gap-2 flex-wrap"><span className="mono">{q.reference}</span><QuoteStatusBadge status={q.status} /></div>
          <div className="customer mt-1">{q.customerName}</div>
          <div className="secondary-text">{q.location} · requested {shortDay(q.requestedDate)} · sent by {q.createdBy ?? "sales"} {myTime(q.createdAt)}</div>
        </div>
        <div className="text-right shrink-0"><div className="money lg">{rm(q.totalPrice)}</div><ChevronDown size={16} className={`ml-auto mt-1 transition-transform ${open ? "rotate-180" : ""}`} /></div>
      </button>
      {open && <DraftDetail q={q} onDone={onDone} />}
    </section>
  );
}

function DraftDetail({ q, onDone }: { q: Quote; onDone: (q: Quote, k: "approved" | "rejected") => void }) {
  const qc = useQueryClient();
  const { isManager, name } = useRole();
  const opts = useGetQuoteScheduleOptions(q.id, { query: { enabled: !!q.id, queryKey: getGetQuoteScheduleOptionsQueryKey(q.id) } });
  const approve = useApproveDraftQuotation();
  const reject = useRejectDraftQuotation();
  const [date, setDate] = useState<string | null>(null);
  const [declining, setDeclining] = useState(false);
  const [reason, setReason] = useState("");
  const checks: ScheduleCheck[] = opts.data ? [opts.data.requested, ...opts.data.alternatives.filter((a) => a.date !== opts.data!.requested.date)] : [];
  useEffect(() => {
    if (date || !opts.data) return;
    const first = [opts.data.requested, ...opts.data.alternatives].find((c) => c.verdict === "feasible");
    if (first) setDate(first.date);
  }, [opts.data, date]);
  const refresh = () => {
    [getListQuotesQueryKey(), getGetDashboardSummaryQueryKey(), getListActivityQueryKey(), getGetOrbyteWalletQueryKey(), getListCommitmentsQueryKey(), getGetStaffScheduleQueryKey()]
      .forEach((k) => qc.invalidateQueries({ queryKey: k }));
  };
  const doApprove = () => date && approve.mutate({ id: q.id, data: { appointmentDate: date, approverName: name } }, {
    onSuccess: (r) => onDone(r, "approved"),
    onSettled: () => { refresh(); qc.invalidateQueries({ queryKey: getGetQuoteScheduleOptionsQueryKey(q.id) }); },
  });
  const doReject = () => reject.mutate({ id: q.id, data: { reason: reason.trim() || null, managerName: name } }, {
    onSuccess: (r) => onDone(r, "rejected"),
    onSettled: refresh,
  });
  const chosen = checks.find((c) => c.date === date);

  return (
    <div className="draft-body">
      <div className="draft-grid">
        <div className="grid gap-3 content-start">
          <div className="overflow-x-auto rounded-lg border border-[var(--line)]">
            <table className="data-table compact">
              <thead><tr><th>Service</th><th className="r">Qty</th><th className="r hidden sm:table-cell">Unit</th><th className="r">Amount</th></tr></thead>
              <tbody>
                {q.lineItems.map((l, i) => <tr key={i}><td>{l.serviceName}<span className="block sm:hidden secondary-text">{rm(l.unitPrice)} each</span></td><td className="r">{l.quantity}</td><td className="r money hidden sm:table-cell">{rm(l.unitPrice)}</td><td className="r money">{rm(l.lineTotal)}</td></tr>)}
                <tr className="total-row"><td colSpan={2} className="sm:hidden">Total</td><td colSpan={3} className="hidden sm:table-cell">Total</td><td className="r money">{rm(q.totalPrice)}</td></tr>
              </tbody>
            </table>
          </div>
          {q.message && <blockquote className="cust-msg"><MessageSquareQuote size={14} /><span>{q.message}</span></blockquote>}
        </div>

        <div className="grid gap-2 content-start">
          <div className="eyebrow !mb-0">Re-checked availability</div>
          {opts.isLoading && <SkeletonRows rows={3} />}
          {opts.isError && <ErrorBox error={opts.error} onRetry={() => opts.refetch()} />}
          {checks.map((c, idx) => {
            const ok = c.verdict === "feasible";
            const sel = date === c.date;
            return (
              <button
                key={c.date}
                className={`date-opt ${ok ? "ok" : c.verdict === "needs_verification" ? "warn" : "bad"} ${sel ? "sel" : ""}`}
                disabled={!ok || !isManager}
                onClick={() => setDate(c.date)}
                aria-pressed={sel}
                data-testid={`button-draft-date-${q.id}-${c.date}`}
              >
                <div className="flex items-center justify-between gap-2 flex-wrap">
                  <span className="font-display font-bold text-[13.5px]">{idx === 0 ? "Requested · " : "Alternative · "}{c.weekday.slice(0, 3)} {shortDay(c.date).split(" ").slice(1).join(" ")}</span>
                  {ok ? <StatusBadge tone="green">Crew available</StatusBadge> : c.verdict === "needs_verification" ? <StatusBadge tone="amber" icon={HelpCircle}>Needs verification</StatusBadge> : <StatusBadge tone="red" icon={AlertTriangle}>Conflict</StatusBadge>}
                </div>
                {c.crew.length > 0 && <div className="secondary-text flex items-center gap-1.5"><Users size={12} /> {c.crew.map((m) => m.isSenior ? `${m.name} (senior)` : m.name).join(", ")}</div>}
                {c.conflicts.length > 0 && (
                  <ul className={`conflicts ${ok ? "muted" : ""}`}>
                    {ok && <li className="list-none -ml-4 font-semibold">Not free that day:</li>}
                    {c.conflicts.map((x, k) => <li key={k}>{x.description}</li>)}
                  </ul>
                )}
                <div className="secondary-text">{c.explanation}</div>
              </button>
            );
          })}
        </div>
      </div>

      <div className="decision-bar">
        {!isManager && <LockBadge />}
        {declining ? (
          <div className="flex-1 flex flex-wrap gap-2 items-center">
            <input className="input flex-1 min-w-[200px]" value={reason} maxLength={400} onChange={(e) => setReason(e.target.value)} placeholder="Reason for the customer record (optional)" data-testid={`input-decline-reason-${q.id}`} />
            <button className="btn btn-ghost" onClick={() => setDeclining(false)}>Cancel</button>
            <button className="btn btn-danger-solid" onClick={doReject} disabled={reject.isPending || !isManager} data-testid={`button-confirm-decline-${q.id}`}>
              {reject.isPending ? <Loader2 className="spin" /> : <XCircle />} Confirm decline
            </button>
          </div>
        ) : (
          <>
            <span className="secondary-text !mt-0 flex-1">{chosen ? <>Confirm <strong>{shortDay(chosen.date)}</strong> with {chosen.crew.map((m) => m.name).join(", ")}</> : "Pick a feasible date to approve."}</span>
            <button className="btn" onClick={() => setDeclining(true)} disabled={!isManager} data-testid={`button-decline-draft-${q.id}`}>{isManager ? <XCircle /> : <Lock />} Decline</button>
            <button className="btn btn-primary" onClick={doApprove} disabled={!isManager || !date || approve.isPending} data-testid={`button-approve-draft-${q.id}`}>
              {approve.isPending ? <Loader2 className="spin" /> : isManager ? <CheckCircle2 /> : <Lock />} Approve &amp; confirm date
            </button>
          </>
        )}
      </div>
      {approve.isError && <div className="mt-3"><ErrorBox error={approve.error} /></div>}
      {reject.isError && <div className="mt-3"><ErrorBox error={reject.error} /></div>}
    </div>
  );
}
