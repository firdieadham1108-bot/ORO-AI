import { useState } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { useProcessEnquiry, useApproveQuotation, useListActivity, getListActivityQueryKey } from "@workspace/api-client-react";
import type { EnquiryResult, ScheduleCheck, Quote } from "@workspace/api-client-react";
import { Sparkles, Loader2, AlertTriangle, ShieldCheck, Printer, RotateCcw, Inbox, CheckCircle2 } from "lucide-react";
import { ErrorBox } from "@/components/shell";
import { rm, longDate, myTime } from "@/lib/util";

const SAMPLES = ["Boss, can install 6 units 1.5HP at Cheras this Friday?", "Can you install aircon?"];
const STATUS: Record<string, { cls: string; label: string }> = {
  conflict: { cls: "badge-red", label: "Scheduling conflict" },
  feasible: { cls: "badge-green", label: "Feasible" },
  needs_information: { cls: "badge-amber", label: "Needs information" },
  needs_verification: { cls: "badge-amber", label: "Needs verification" },
};
const VERDICT: Record<string, { cls: string; label: string }> = {
  feasible: { cls: "badge-green", label: "Crew available" },
  not_feasible: { cls: "badge-red", label: "Not available" },
  needs_verification: { cls: "badge-amber", label: "Needs verification" },
};

export default function Workspace() {
  const qc = useQueryClient();
  const enquiry = useProcessEnquiry();
  const approve = useApproveQuotation();
  const [customer, setCustomer] = useState("Cheras Office (demo customer)");
  const [message, setMessage] = useState("");
  const [result, setResult] = useState<EnquiryResult | null>(null);
  const [sentMessage, setSentMessage] = useState("");
  const [quote, setQuote] = useState<Quote | null>(null);
  const [approvingDate, setApprovingDate] = useState<string | null>(null);

  const analyse = () => {
    approve.reset();
    setQuote(null);
    enquiry.mutate({ data: { message } }, { onSuccess: (r) => { setResult(r); setSentMessage(message); qc.invalidateQueries({ queryKey: getListActivityQueryKey() }); } });
  };
  const doApprove = (opt: ScheduleCheck) => {
    if (!result?.pricing || !result.analysis.requestedDate || !result.analysis.location) return;
    setApprovingDate(opt.date);
    approve.mutate({ data: {
      customerName: customer.trim(), serviceCode: result.pricing.serviceCode, quantity: result.pricing.quantity,
      requestedDate: result.analysis.requestedDate, appointmentDate: opt.date, location: result.analysis.location, message: sentMessage,
    } }, {
      onSuccess: (q) => { setQuote(q); qc.invalidateQueries({ queryKey: getListActivityQueryKey() }); },
      onSettled: () => setApprovingDate(null),
    });
  };
  const startOver = () => { setResult(null); setQuote(null); setMessage(""); enquiry.reset(); approve.reset(); };

  return (
    <div className="page">
      <div className="mb-6 no-print">
        <div className="eyebrow">Quotation workspace</div>
        <h1>Turn a customer message into an approved quote</h1>
        <p className="text-[13px] text-[#707b7a]">Paste the enquiry, let ORO check prices and crew, then approve the option that works.</p>
      </div>
      <div className="grid gap-5 lg:grid-cols-[minmax(0,.9fr)_minmax(0,1.3fr)] items-start">
        <div className="grid gap-5 no-print">
          <section className="panel">
            <div className="panel-heading"><div><h2>Customer enquiry</h2><p>Paste from WhatsApp or try a sample.</p></div></div>
            <div className="field mb-3"><label htmlFor="cust">Customer name</label>
              <input id="cust" value={customer} maxLength={160} onChange={(e) => setCustomer(e.target.value)} data-testid="input-customer" /></div>
            <div className="field"><label htmlFor="msg">Message</label>
              <textarea id="msg" value={message} maxLength={2000} onChange={(e) => setMessage(e.target.value)} placeholder="Paste the customer's message here" data-testid="input-message" /></div>
            <div className="flex flex-wrap gap-2 mt-3">
              {SAMPLES.map((s, i) => (
                <button key={i} className="btn text-left whitespace-normal h-auto py-2" onClick={() => setMessage(s)} data-testid={`button-sample-${i}`}>{s}</button>
              ))}
            </div>
            <button className="btn btn-primary w-full mt-4" disabled={!message.trim() || !customer.trim() || enquiry.isPending} onClick={analyse} data-testid="button-analyse">
              {enquiry.isPending ? <Loader2 className="spin" /> : <Sparkles />} {enquiry.isPending ? "Analysing enquiry" : "Analyse Enquiry"}
            </button>
            {enquiry.isError && <div className="mt-3"><ErrorBox error={enquiry.error} onRetry={analyse} /></div>}
          </section>
          <RecentActivity />
        </div>

        <div className="grid gap-5">
          {enquiry.isPending ? (
            <div className="panel grid gap-3"><div className="skeleton w-1/3" /><div className="skeleton-box" /><div className="grid sm:grid-cols-2 gap-3"><div className="skeleton-box h-48" /><div className="skeleton-box h-48" /></div></div>
          ) : quote ? (
            <QuotePreview quote={quote} onNew={startOver} />
          ) : result ? (
            <ApprovalCard result={result} onApprove={doApprove} approvingDate={approvingDate} error={approve.isError ? approve.error : null} canApprove={!!customer.trim()} />
          ) : (
            <div className="panel">
              <div className="empty py-16">
                <div className="empty-icon"><Inbox /></div>
                <div className="font-bold text-[#35434a] mb-1">No enquiry analysed yet</div>
                <div className="max-w-sm mx-auto">The approval card appears here with the price, the requested date and a backup option if the crew is not free.</div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

function ApprovalCard({ result, onApprove, approvingDate, error, canApprove }: {
  result: EnquiryResult; onApprove: (o: ScheduleCheck) => void; approvingDate: string | null; error: unknown; canApprove: boolean;
}) {
  const st = STATUS[result.status] ?? STATUS.needs_verification;
  const a = result.analysis;
  const p = result.pricing;
  const optA = result.requestedSchedule;
  const optB = optA && optA.verdict !== "feasible" ? result.alternatives[0] : undefined;
  const showOptions = result.status !== "needs_information" && optA;
  return (
    <section className="panel" data-testid="card-approval" style={{ animation: "fade-up .3s ease both" }}>
      <div className="flex items-start justify-between gap-3 flex-wrap mb-3">
        <div><div className="eyebrow">AGUI Approval Card</div><h2 className="text-[18px] font-bold" style={{ fontFamily: "Manrope" }}>Review and approve</h2></div>
        <span className={`badge ${st.cls}`} data-testid="status-result">{st.label}</span>
      </div>
      <p className="text-[13px] text-[#53605f] mb-4" data-testid="text-summary">{result.summary}</p>

      {result.status === "needs_information" && (
        <div className="notice warn mb-4" data-testid="list-missing">
          <AlertTriangle />
          <div>
            <strong>Missing information</strong>
            <ul className="list-disc pl-5 my-1">{a.missing.map((m) => <li key={m}>{m}</li>)}</ul>
            {a.clarification && <div><span className="font-semibold">Ask the customer: </span><span data-testid="text-clarification">"{a.clarification}"</span></div>}
          </div>
        </div>
      )}

      <dl className="grid grid-cols-2 sm:grid-cols-3 gap-x-4 gap-y-3 text-[13px] rounded-lg bg-[#f3f1e9] border border-[#e5e0d6] p-4">
        <Kv k="Service" v={p?.serviceName ?? a.serviceCode} />
        <Kv k="Quantity" v={a.quantity != null ? String(a.quantity) : null} />
        <Kv k="Specification" v={a.specification} />
        <Kv k="Requested date" v={a.requestedDate ? longDate(a.requestedDate) : null} />
        <Kv k="Location" v={a.location} />
      </dl>

      {p && (
        <div className="mt-4 flex items-baseline justify-between flex-wrap gap-2 border-t border-b border-[#e9e5dc] py-3">
          <span className="mono text-[13px]" data-testid="text-calculation">{p.quantity} x {rm(p.unitPrice).replace(" ", "")} = {p.totalFormatted}</span>
          <span className="detail-number" data-testid="text-total">{p.totalFormatted}</span>
        </div>
      )}

      {showOptions && (
        <div className={`grid gap-3 mt-4 ${optB ? "sm:grid-cols-2" : ""}`}>
          <OptionCard label="Option A · Requested" opt={optA!} onApprove={onApprove} approvingDate={approvingDate} canApprove={canApprove && !!p} />
          {optB && <OptionCard label="Option B · Alternative" opt={optB} onApprove={onApprove} approvingDate={approvingDate} canApprove={canApprove && !!p} />}
        </div>
      )}
      {showOptions && (
        <p className="flex items-center gap-2 mt-3 text-[11px] text-[#7b857f]"><ShieldCheck size={14} /> Manager action. Approval is recorded as Faizal (Manager) and availability is re-checked by the server.</p>
      )}
      {!!error && <div className="mt-3"><ErrorBox error={error} /></div>}
    </section>
  );
}

function Kv({ k, v }: { k: string; v: string | null | undefined }) {
  return (
    <div>
      <dt className="text-[10px] uppercase tracking-wider text-[#7b857f]" style={{ fontFamily: "IBM Plex Mono" }}>{k}</dt>
      <dd className={`m-0 mt-0.5 ${v ? "font-medium text-[#354248]" : "text-[#996b23]"}`}>{v || "Missing"}</dd>
    </div>
  );
}

function OptionCard({ label, opt, onApprove, approvingDate, canApprove }: {
  label: string; opt: ScheduleCheck; onApprove: (o: ScheduleCheck) => void; approvingDate: string | null; canApprove: boolean;
}) {
  const v = VERDICT[opt.verdict] ?? VERDICT.needs_verification;
  const ok = opt.verdict === "feasible";
  const busy = approvingDate === opt.date;
  return (
    <div className={`option-card flex flex-col ${ok ? "feasible" : "unfeasible"}`} style={{ marginTop: 0 }} data-testid={`card-option-${opt.date}`}>
      <div className="eyebrow mb-1">{label}</div>
      <div className="option-head"><span className="text-[15px]" style={{ fontFamily: "Manrope" }}>{longDate(opt.date)}</span></div>
      <div className="mt-2"><span className={`badge ${v.cls}`}>{v.label}</span></div>
      {opt.crew.length > 0 && (
        <div className="crew-list">
          {opt.crew.map((c) => (
            <span key={c.id} className="crew-pill"><span className="crew-avatar">{c.name.split(" ").map((w) => w[0]).slice(0, 2).join("")}</span>{c.name}{c.isSenior && <strong className="text-[#347956]">Senior</strong>}</span>
          ))}
        </div>
      )}
      {opt.conflicts.length > 0 && (
        <ul className="list-disc">{opt.conflicts.map((c, i) => <li key={i}>{c.description} <span className="mono">({c.reference})</span></li>)}</ul>
      )}
      <p className="flex-1">{opt.explanation}</p>
      <button className={`btn w-full mt-3 ${ok ? "btn-primary" : ""}`} disabled={!ok || !canApprove || approvingDate !== null} onClick={() => onApprove(opt)} data-testid={`button-approve-${opt.date}`}>
        {busy ? <Loader2 className="spin" /> : ok ? <CheckCircle2 /> : null}
        {ok ? `Approve ${opt.weekday}` : `${opt.weekday} not available`}
      </button>
    </div>
  );
}

function QuotePreview({ quote: x, onNew }: { quote: Quote; onNew: () => void }) {
  return (
    <>
      <div className="flex flex-wrap gap-2 justify-end no-print">
        <button className="btn" onClick={onNew} data-testid="button-new-enquiry"><RotateCcw /> Start new enquiry</button>
        <button className="btn btn-primary" onClick={() => window.print()} data-testid="button-print"><Printer /> Print</button>
      </div>
      <article className="quote-sheet w-full" data-testid="quote-sheet" style={{ animation: "fade-up .3s ease both" }}>
        <div className="flex justify-between gap-4 flex-wrap">
          <div><h2 data-testid="text-company">{x.companyName}</h2><div className="text-[12px] text-[#707b7a] mt-1">Cheras, Kuala Lumpur</div></div>
          <div className="sm:text-right">
            <div className="eyebrow">Quotation</div>
            <div className="mono text-[15px]" data-testid="text-reference">{x.reference}</div>
            <div className="mt-2"><span className="badge badge-green" data-testid="status-quote">Approved</span></div>
          </div>
        </div>
        <dl className="sheet-meta">
          <div><dt>Customer</dt><dd data-testid="text-customer">{x.customerName}</dd></div>
          <div><dt>Job location</dt><dd>{x.location}</dd></div>
          <div><dt>Requested date</dt><dd>{longDate(x.requestedDate)}</dd></div>
          <div><dt>Appointment date</dt><dd className="font-semibold" data-testid="text-appointment">{x.appointmentDate ? longDate(x.appointmentDate) : "To be confirmed"}</dd></div>
          <div className="sm:col-span-2"><dt>Assigned crew</dt><dd>{x.crew.length ? x.crew.join(", ") : "To be assigned"}</dd></div>
        </dl>
        <div className="overflow-x-auto">
          <table className="q-table">
            <thead><tr><th>Service</th><th className="r">Qty</th><th className="r">Unit price</th><th className="r">Amount</th></tr></thead>
            <tbody><tr><td>{x.serviceName}</td><td className="r">{x.quantity}</td><td className="r">{rm(x.unitPrice)}</td><td className="r">{rm(x.totalPrice)}</td></tr></tbody>
          </table>
        </div>
        <div className="q-total"><span className="text-[13px] font-semibold">Total</span><span data-testid="text-quote-total">{rm(x.totalPrice)}</span></div>
        <p className="mt-8 text-[12px] text-[#707b7a]" data-testid="text-approved-by">
          Approved by {x.approvedBy ?? "manager"}{x.approvedAt ? ` on ${myTime(x.approvedAt)} (Malaysia time)` : ""}. Prices from the approved CoolAir Services price list.
        </p>
      </article>
    </>
  );
}

function RecentActivity() {
  const q = useListActivity();
  const items = q.data?.slice(0, 6) ?? [];
  return (
    <section className="panel">
      <div className="panel-heading"><div><h2>Recent activity</h2><p>Newest first.</p></div></div>
      {q.isLoading && <div className="grid gap-3"><div className="skeleton" /><div className="skeleton w-2/3" /><div className="skeleton" /></div>}
      {q.isError && <ErrorBox error={q.error} onRetry={() => q.refetch()} />}
      {q.data && items.length === 0 && <div className="text-[12px] text-[#818984]">No activity yet.</div>}
      <div className="activity-list">
        {items.map((a) => (
          <div key={a.id} className="activity-item" data-testid={`row-activity-${a.id}`}>
            <div className={`activity-mark ${a.severity === "warning" ? "warning" : ""}`} />
            <div>
              <div className="activity-text"><strong>{a.action}</strong> - {a.description}</div>
              <div className="activity-time">{myTime(a.createdAt)} · {a.actor}</div>
            </div>
          </div>
        ))}
      </div>
    </section>
  );
}
