import { useEffect, useMemo, useState } from "react";
import { useSearch, useLocation } from "wouter";
import { useListQuotes } from "@workspace/api-client-react";
import type { Quote } from "@workspace/api-client-react";
import { FileText, Search, ChevronRight } from "lucide-react";
import { ErrorBox } from "@/components/shell";
import { PageHeader, QuoteStatusBadge, SkeletonRows, Empty } from "@/components/kit";
import { PrintableQuoteModal } from "@/components/quote-document";
import { quoteToDoc } from "@/lib/quote-doc";
import { rm, myTime } from "@/lib/util";
import { shortDay } from "@/lib/dates";

type Filter = "all" | "draft" | "approved" | "rejected";
const FILTERS: Array<[Filter, string]> = [["all", "All"], ["draft", "Pending"], ["approved", "Approved"], ["rejected", "Declined"]];

export default function Quotations() {
  const q = useListQuotes();
  const search = useSearch();
  const [, setLocation] = useLocation();
  const [filter, setFilter] = useState<Filter>("all");
  const [text, setText] = useState("");
  const [open, setOpen] = useState<Quote | null>(null);
  const all = useMemo(() => [...(q.data ?? [])].sort((a, b) => b.createdAt.localeCompare(a.createdAt)), [q.data]);

  useEffect(() => {
    const id = Number(new URLSearchParams(search).get("open"));
    if (id && q.data) { const f = q.data.find((x) => x.id === id); if (f) setOpen(f); }
  }, [search, q.data]);

  const counts = { all: all.length, draft: 0, approved: 0, rejected: 0 } as Record<Filter, number>;
  all.forEach((x) => { counts[x.status as Filter] += 1; });
  const t = text.trim().toLowerCase();
  const rows = all.filter((x) => (filter === "all" || x.status === filter) && (!t || `${x.reference} ${x.customerName} ${x.location} ${x.serviceName}`.toLowerCase().includes(t)));
  const services = (x: Quote) => x.lineItems.map((l) => `${l.quantity} × ${l.serviceName}`).join(", ");

  return (
    <div className="page">
      <PageHeader eyebrow="Quotations" title="Every quote, traceable" sub="Prices come from the approved price list. Open a row for the printable quotation." />
      <div className="toolbar">
        <div className="seg" role="tablist" aria-label="Filter by status">
          {FILTERS.map(([k, l]) => (
            <button key={k} role="tab" aria-selected={filter === k} className={filter === k ? "on" : ""} onClick={() => setFilter(k)} data-testid={`filter-${k}`}>
              {l} <span className="seg-n">{counts[k]}</span>
            </button>
          ))}
        </div>
        <label className="search"><Search /><input value={text} onChange={(e) => setText(e.target.value)} placeholder="Search reference, customer, location" data-testid="input-search-quotes" /></label>
      </div>
      <section className="panel !p-0 overflow-hidden">
        {q.isLoading ? <div className="p-5"><SkeletonRows rows={6} /></div> : q.isError ? <div className="p-5"><ErrorBox error={q.error} onRetry={() => q.refetch()} /></div> : rows.length === 0 ? (
          <Empty icon={FileText} title={all.length ? "No quotations match" : "No quotations yet"}>{all.length ? "Try another filter or search term." : "Analyse an enquiry and send it for approval to create the first one."}</Empty>
        ) : (
          <>
            <div className="table-wrap hide-mobile">
              <table className="data-table">
                <thead><tr><th>Reference</th><th>Customer</th><th>Services</th><th className="r">Total</th><th>Requested</th><th>Appointment · crew</th><th>Status</th></tr></thead>
                <tbody>
                  {rows.map((x, i) => (
                    <tr key={x.id} className="clickable stagger" style={{ animationDelay: `${Math.min(i, 12) * 25}ms` }} onClick={() => setOpen(x)} data-testid={`row-quote-${x.id}`}>
                      <td><button className="table-link mono" onClick={(e) => { e.stopPropagation(); setOpen(x); }} data-testid={`button-open-quote-${x.id}`}>{x.reference}</button><div className="secondary-text">{x.createdBy ?? "—"}<br /><span className="nowrap">{myTime(x.createdAt)}</span></div></td>
                      <td className="min-w-[150px]"><div className="customer">{x.customerName}</div><div className="secondary-text">{x.location}</div></td>
                      <td className="max-w-[180px]"><div className="truncate" title={services(x)}>{services(x)}</div></td>
                      <td className="r money">{rm(x.totalPrice)}</td>
                      <td className="nowrap">{shortDay(x.requestedDate)}</td>
                      <td className="nowrap">{x.appointmentDate ? <strong>{shortDay(x.appointmentDate)}</strong> : <span className="text-[var(--muted-ink)]">—</span>}<div className="secondary-text max-w-[150px] truncate" title={x.crew.join(", ")}>{x.crew.join(", ") || (x.status === "draft" ? "awaiting approval" : "")}</div></td>
                      <td><QuoteStatusBadge status={x.status} risk={x.riskStatus} testId={`status-quote-${x.id}`} />{x.rejectionReason && <div className="secondary-text max-w-[180px]">{x.rejectionReason}</div>}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            <div className="show-mobile grid">
              {rows.map((x) => (
                <button key={x.id} className="m-card" onClick={() => setOpen(x)} data-testid={`card-quote-${x.id}`}>
                  <div className="flex justify-between items-start gap-2">
                    <div className="min-w-0"><span className="mono">{x.reference}</span><div className="customer truncate">{x.customerName}</div></div>
                    <span className="money">{rm(x.totalPrice)}</span>
                  </div>
                  <div className="secondary-text">{services(x)}</div>
                  <div className="flex items-center justify-between gap-2 mt-2 flex-wrap">
                    <QuoteStatusBadge status={x.status} risk={x.riskStatus} />
                    <span className="secondary-text !mt-0">{x.appointmentDate ? `Booked ${shortDay(x.appointmentDate)}` : `Requested ${shortDay(x.requestedDate)}`}</span>
                    <ChevronRight size={15} className="opacity-50" />
                  </div>
                  {x.rejectionReason && <div className="secondary-text">Reason: {x.rejectionReason}</div>}
                </button>
              ))}
            </div>
          </>
        )}
      </section>
      {open && <PrintableQuoteModal q={quoteToDoc(open)} onClose={() => { setOpen(null); if (search) setLocation("/quotations", { replace: true }); }} />}
    </div>
  );
}
