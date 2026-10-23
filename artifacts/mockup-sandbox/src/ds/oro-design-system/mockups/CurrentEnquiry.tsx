// BASELINE (not redesigned). Port of artifacts/oro-ai/src/pages/workspace.tsx (New Enquiry) inside the
// ported app shell. API mutations are replaced by local state with a short simulated delay; the four
// sample messages resolve to the fixed results in _shared/sample-data.
// ?state=empty (nothing analysed) · default (Scenario 1 analysed: Friday conflict) · ?state=clarification
// (Scenario 3) · ?state=conflict (Monday job at risk after the simulated eLeave event) · ?state=loading
import { useRef, useState } from "react";
import { Sparkles, Loader2, AlertTriangle, ShieldCheck, FileText, RotateCcw, Inbox, CheckCircle2, Lock, TimerOff, Send, Info } from "lucide-react";
import { CurrentShell, Link } from "./_current/shell";
import { ErrorBox, RiskAlerts, SimulationBar, PrintableQuoteModal, QuoteDocument, type QuoteDocData, LockBadge, VoiceInput, QuoteTerms, useHoldTimer, HOLD_SECONDS, quoteToDoc } from "./_current/parts";
import { useRole, rm, longDate, myTime } from "./_current/lib";
import {
  ACTIVITY, ACTIVITY_LEAVE_EVENT, ACTIVITY_RECOVERED, COMPANY, QUOTE_MONDAY_AT_RISK, QUOTE_MONDAY_RECOVERED, RECOVERY_PLAN, SCENARIOS, stateParam,
  type ActivityEntry, type Commitment, type EnquiryResult, type Quote, type ScheduleCheck,
} from "./_shared/sample-data";

const STATUS: Record<string, { cls: string; label: string }> = {
  conflict: { cls: "badge-red", label: "Scheduling conflict" },
  feasible: { cls: "badge-green", label: "Feasible" },
  needs_clarification: { cls: "badge-amber", label: "Needs clarification" },
  needs_verification: { cls: "badge-amber", label: "Needs verification" },
};
const VERDICT: Record<string, { cls: string; label: string }> = {
  feasible: { cls: "badge-green", label: "Crew available" },
  not_feasible: { cls: "badge-red", label: "Not available" },
  needs_verification: { cls: "badge-amber", label: "Needs verification" },
};
const KIND_LABEL: Record<string, string> = {
  install: "Air-conditioning installation",
  standard_service: "Standard air-conditioning service",
  chemical_wash: "Chemical wash",
};

function draftDoc(result: EnquiryResult, customer: string): QuoteDocData | null {
  const p = result.pricing;
  if (!p || !result.analysis.location) return null;
  const optA = result.requestedSchedule;
  const proposed = optA?.verdict === "feasible" ? optA : result.alternatives[0];
  return {
    companyName: COMPANY, reference: null, status: "draft", customerName: customer.trim() || "Customer", location: result.analysis.location,
    lines: p.lines, totalPrice: p.totalPrice, requestedDate: result.analysis.requestedDate, promisedDate: proposed?.date ?? null,
    crew: proposed ? proposed.crew.map((c) => (c.isSenior ? `${c.name} (senior)` : c.name)) : [], crewIsProposal: true, approvedBy: null, approvedAt: null,
  };
}

/** Local stand-in for POST /enquiry: the four sample messages map to fixed results. */
function analyseLocally(text: string): EnquiryResult {
  const hit = SCENARIOS.find((s) => s.message.trim() === text.trim());
  if (hit) return hit.result;
  return {
    status: "needs_clarification",
    summary: "This mockup only analyses the four sample messages. The live app runs its rule-based parser on any text.",
    analysis: { serviceCode: null, quantity: null, specification: null, items: [], requestedDate: null, location: null, referenceDate: "2026-10-21", missing: ["service type (installation, servicing or chemical wash)", "requested date", "job location"], clarification: null },
    alternatives: [],
  };
}

export default function CurrentEnquiry() {
  const state = stateParam();
  return (
    <CurrentShell active="/enquiry" pending={1}>
      <Workspace state={state} />
    </CurrentShell>
  );
}

function Workspace({ state }: { state: string }) {
  const { name: actorName } = useRole();
  const initialScenario = state === "clarification" ? SCENARIOS[2]! : SCENARIOS[0]!;
  const startWithResult = state !== "empty" && state !== "loading";
  const [customer, setCustomer] = useState(initialScenario.customer);
  const [message, setMessage] = useState(startWithResult || state === "loading" ? initialScenario.message : "");
  const [result, setResult] = useState<EnquiryResult | null>(startWithResult ? initialScenario.result : null);
  const [sentMessage, setSentMessage] = useState(startWithResult ? initialScenario.message : "");
  const [analysing, setAnalysing] = useState(state === "loading");
  const [quote, setQuote] = useState<Quote | null>(null);
  const [draft, setDraft] = useState<Quote | null>(null);
  const [approvingDate, setApprovingDate] = useState<string | null>(null);
  const [sendingDraft, setSendingDraft] = useState(false);
  const [simFired, setSimFired] = useState(state === "conflict");
  const [atRisk, setAtRisk] = useState<Commitment[]>(state === "conflict" ? [{ quote: QUOTE_MONDAY_AT_RISK, recovery: RECOVERY_PLAN }] : []);
  const [recovered, setRecovered] = useState<Commitment | null>(null);
  const [printDoc, setPrintDoc] = useState<QuoteDocData | null>(null);
  const [activity, setActivity] = useState<ActivityEntry[]>(state === "conflict" ? [ACTIVITY_LEAVE_EVENT, ...ACTIVITY] : ACTIVITY);
  const [resultId, setResultId] = useState(0);
  const [nextId, setNextId] = useState(4);
  const resultRef = useRef<HTMLDivElement>(null);

  const log = (e: Omit<ActivityEntry, "id" | "createdAt">) => setActivity((a) => [{ ...e, id: Date.now(), createdAt: new Date().toISOString() }, ...a]);

  const analyse = (text: string = message) => {
    setQuote(null); setDraft(null); setAnalysing(true);
    setTimeout(() => {
      const r = analyseLocally(text);
      setResult(r); setResultId((n) => n + 1); setSentMessage(text); setAnalysing(false);
      log({ action: "enquiry_analysed", description: r.summary, actor: actorName, severity: r.status === "conflict" ? "warning" : "info" });
      if (window.matchMedia("(max-width: 1023px)").matches) requestAnimationFrame(() => resultRef.current?.scrollIntoView({ behavior: "smooth", block: "start" }));
    }, 700);
  };
  const buildQuote = (opt: ScheduleCheck | null, status: Quote["status"]): Quote => {
    const p = result!.pricing!;
    const id = nextId; setNextId(id + 1);
    return {
      id, reference: `ORO-${1022 + id}`, companyName: COMPANY, customerName: customer.trim(), location: result!.analysis.location!, serviceCode: p.serviceCode, serviceName: p.serviceName,
      quantity: p.quantity, unitPrice: p.unitPrice, totalPrice: p.totalPrice, requestedDate: result!.analysis.requestedDate!, appointmentDate: opt?.date ?? null, status,
      approvedBy: status === "approved" ? actorName : null, approvedAt: status === "approved" ? new Date().toISOString() : null, rejectionReason: null, createdBy: actorName, message: sentMessage,
      crew: opt ? opt.crew.map((c) => c.name) : [], lineItems: p.lines, riskStatus: status === "approved" ? "FEASIBLE" : null, riskReason: null, createdAt: new Date().toISOString(),
    };
  };
  const doApprove = (opt: ScheduleCheck) => {
    setApprovingDate(opt.date);
    setTimeout(() => {
      const q = buildQuote(opt, "approved");
      setQuote(q); setApprovingDate(null);
      log({ action: "quote_approved", description: `Quotation ${q.reference} approved for ${q.customerName}, ${longDate(opt.date)}. Crew: ${q.crew.join(", ")}. (Simulated: no real booking.)`, actor: actorName, severity: "success" });
    }, 700);
  };
  const sendForApproval = () => {
    setSendingDraft(true);
    setTimeout(() => {
      const q = buildQuote(null, "pending");
      setDraft(q); setSendingDraft(false);
      log({ action: "draft_created", description: `Draft ${q.reference} sent for manager approval: ${q.customerName}.`, actor: actorName, severity: "info" });
    }, 700);
  };
  const fireSim = () => {
    setSimFired(true);
    setAtRisk([{ quote: QUOTE_MONDAY_AT_RISK, recovery: RECOVERY_PLAN }]);
    setActivity((a) => [ACTIVITY_LEAVE_EVENT, ...a]);
  };
  const onRecovered = () => {
    setAtRisk([]);
    setRecovered({ quote: QUOTE_MONDAY_RECOVERED, recovery: null });
    setActivity((a) => [ACTIVITY_RECOVERED, ...a]);
  };
  const startOver = () => { setResult(null); setQuote(null); setDraft(null); setMessage(""); };

  return (
    <div className="page">
      <div className="mb-6 no-print">
        <div className="eyebrow">Quotation workspace</div>
        <h1>Turn a customer message into an approved quote</h1>
        <p className="text-[13px] text-[#707b7a]">Paste the enquiry, let ORO check prices and crew, then approve the option that works.</p>
      </div>
      <SimulationBar fired={simFired} onFire={fireSim} />
      <RiskAlerts atRisk={atRisk} recovered={recovered} onRecovered={onRecovered} />
      <div className="grid gap-5 lg:grid-cols-[minmax(0,.9fr)_minmax(0,1.3fr)] items-start">
        <div className="contents lg:grid gap-5 no-print">
          <section className="panel order-1">
            <div className="panel-heading"><div><h2>Customer enquiry</h2><p>Paste from WhatsApp, send a voice note, or pick a test scenario.</p></div></div>
            <div className="field mb-3"><label htmlFor="cust">Customer name</label>
              <input id="cust" value={customer} maxLength={160} onChange={(e) => setCustomer(e.target.value)} data-testid="input-customer" /></div>
            <div className="mb-2">
              <div className="text-[10px] uppercase tracking-wider text-[#7b857f] mb-1.5" style={{ fontFamily: "IBM Plex Mono" }}>Quick-fill scenarios</div>
              <div className="flex flex-wrap gap-1.5">
                {SCENARIOS.map((s, i) => (
                  <button
                    key={i}
                    className={`rounded-full border px-2.5 py-1 text-[11px] font-semibold transition-colors ${
                      message === s.message ? "border-[#0F1E33] bg-[#0F1E33] text-[#F3EBD7]" : "border-[#E4E2DC] bg-[#FFFFFF] text-[#1E242B] hover:border-[#B99545] hover:bg-[#F3EBD7]"
                    }`}
                    onClick={() => { setMessage(s.message); setCustomer(s.customer); }}
                    data-testid={`button-scenario-${i + 1}`}
                  >
                    {s.label}
                  </button>
                ))}
              </div>
            </div>
            <div className="field"><label htmlFor="msg">Message</label>
              <textarea id="msg" value={message} maxLength={2000} onChange={(e) => setMessage(e.target.value)} placeholder="Paste the customer's message here, or use a voice note below" data-testid="input-message" /></div>
            <VoiceInput disabled={analysing} />
            <button className="btn btn-primary w-full mt-4" disabled={!message.trim() || !customer.trim() || analysing} onClick={() => analyse()} data-testid="button-analyse">
              {analysing ? <Loader2 className="spin" /> : <Sparkles />} {analysing ? "Analysing enquiry" : "Analyse Enquiry"}
            </button>
          </section>
          <RecentActivity items={activity} />
        </div>

        <div className="grid gap-5 order-2 scroll-mt-14" ref={resultRef}>
          {analysing ? (
            <div className="panel grid gap-3"><div className="skeleton w-1/3" /><div className="skeleton-box" /><div className="grid sm:grid-cols-2 gap-3"><div className="skeleton-box h-48" /><div className="skeleton-box h-48" /></div></div>
          ) : quote ? (
            <>
              <div className="flex flex-wrap gap-2 justify-end no-print">
                <button className="btn" onClick={startOver} data-testid="button-new-enquiry"><RotateCcw /> Start new enquiry</button>
                <button className="btn btn-primary" onClick={() => setPrintDoc(quoteToDoc(quote))} data-testid="button-view-printable"><FileText /> View Printable Quotation</button>
              </div>
              <div style={{ animation: "fade-up .3s ease both" }}><QuoteDocument q={quoteToDoc(quote)} /></div>
            </>
          ) : result ? (
            <ApprovalCard
              key={resultId}
              result={result}
              onReverify={() => analyse(sentMessage)}
              reverifying={analysing}
              onApprove={doApprove}
              onViewDraft={() => { const d = draftDoc(result, customer); if (d) setPrintDoc(d); }}
              approvingDate={approvingDate}
              error={null}
              canApprove={!!customer.trim()}
              onSendForApproval={sendForApproval}
              sendingDraft={sendingDraft}
              draft={draft}
            />
          ) : (
            <div className="panel">
              <div className="empty py-16">
                <div className="empty-icon"><Inbox /></div>
                <div className="font-bold text-[#35434a] mb-1">No enquiry analysed yet</div>
                <div className="max-w-sm mx-auto">Pick a scenario on the left and click Analyse Enquiry. The approval card appears here with the price, the requested date and a backup option if the crew is not free.</div>
              </div>
            </div>
          )}
        </div>
      </div>
      {printDoc && <PrintableQuoteModal q={printDoc} onClose={() => setPrintDoc(null)} />}
    </div>
  );
}

function ApprovalCard({ result, onApprove, onReverify, reverifying, onViewDraft, approvingDate, error, canApprove, onSendForApproval, sendingDraft, draft }: {
  result: EnquiryResult; onApprove: (o: ScheduleCheck) => void; onReverify: () => void; reverifying: boolean;
  onViewDraft: () => void; approvingDate: string | null; error: unknown; canApprove: boolean;
  onSendForApproval: () => void; sendingDraft: boolean; draft: Quote | null;
}) {
  const { isManager } = useRole();
  const st = STATUS[result.status] ?? STATUS.needs_verification!;
  const a = result.analysis;
  const p = result.pricing;
  const optA = result.requestedSchedule;
  const optB = optA && optA.verdict !== "feasible" ? result.alternatives[0] : undefined;
  const showOptions = result.status !== "needs_clarification" && optA;
  const hasSlot = !!(showOptions && p && [optA, optB].some((o) => o?.verdict === "feasible"));
  const hold = useHoldTimer(HOLD_SECONDS, hasSlot);
  return (
    <section className="panel" data-testid="card-approval" style={{ animation: "fade-up .3s ease both" }}>
      <div className="flex items-start justify-between gap-3 flex-wrap mb-3">
        <div><div className="eyebrow">AGUI Approval Card</div><h2 className="text-[18px] font-bold" style={{ fontFamily: "Manrope" }}>Review and approve</h2></div>
        <span className={`badge ${st.cls}`} data-testid="status-result">{st.label}</span>
      </div>
      <p className="text-[13px] text-[#53605f] mb-2" data-testid="text-summary">{result.summary}</p>
      <p className="flex items-center gap-1.5 text-[11px] text-[#7b857f] mb-4" data-testid="badge-extraction-mode">
        <Info size={13} /> Demo extraction: rule-based parser (no AI model connected). Prices and crew checks come from the database.
      </p>

      {result.status === "needs_clarification" && (
        <div className="notice warn mb-4" data-testid="list-missing">
          <AlertTriangle />
          <div>
            <strong>Needs clarification before quoting</strong>
            <ul className="list-disc pl-5 my-1">{a.missing.map((m) => <li key={m}>{m}</li>)}</ul>
            <div className="text-[11px]">No price is confirmed until the customer answers.</div>
          </div>
        </div>
      )}

      <LineItems result={result} />

      <dl className="grid grid-cols-2 gap-x-4 gap-y-3 text-[13px] rounded-lg bg-[#F6F5F2] border border-[#E4E2DC] p-4 mt-3">
        <Kv k="Requested date" v={a.requestedDate ? longDate(a.requestedDate) : null} />
        <Kv k="Location" v={a.location} />
      </dl>

      {p && (
        <div className="mt-4 flex items-baseline justify-between flex-wrap gap-2 border-t border-b border-[#e9e5dc] py-3">
          <span className="mono text-[13px]" data-testid="text-calculation">
            {p.lines.map((l) => `${l.quantity} x ${rm(l.unitPrice).replace(" ", "")}`).join(" + ")} = {p.totalFormatted}
          </span>
          <span className="detail-number" data-testid="text-total">{p.totalFormatted}</span>
        </div>
      )}
      {p && a.location && (
        <div className="flex justify-end mt-3">
          <button className="btn" onClick={onViewDraft} data-testid="button-view-printable"><FileText /> View Printable Quotation</button>
        </div>
      )}

      {p && showOptions && <QuoteTerms hasSlot={hasSlot} hold={hold} onReverify={onReverify} reverifying={reverifying} />}

      {showOptions && (
        <div className={`grid gap-3 mt-4 ${optB ? "sm:grid-cols-2" : ""}`}>
          <OptionCard label="Option A · Requested" opt={optA!} onApprove={onApprove} approvingDate={approvingDate} canApprove={canApprove && !!p} holdExpired={hold.expired} />
          {optB && <OptionCard label="Option B · Alternative" opt={optB} onApprove={onApprove} approvingDate={approvingDate} canApprove={canApprove && !!p} holdExpired={hold.expired} />}
        </div>
      )}
      {showOptions && (
        <p className="flex items-center gap-2 mt-3 text-[11px] text-[#7b857f]"><ShieldCheck size={14} /> Manager action. Availability is re-checked by the server at the moment of approval.</p>
      )}
      {showOptions && p && a.location && !isManager && (
        draft ? (
          <div className="notice success mt-3" data-testid="notice-draft-sent">
            <CheckCircle2 />
            <div>
              <strong>Draft {draft.reference} sent to Faizal (Manager) for approval.</strong>
              <div className="text-[11px] mt-0.5">It now shows under Manager Approval and on the Dashboard. The manager re-checks the date before confirming.</div>
              <Link href="/approvals" className="inline-block mt-2 text-[12px] font-semibold underline underline-offset-2" data-testid="link-open-approvals">Open Manager Approval</Link>
            </div>
          </div>
        ) : (
          <button className="btn btn-primary w-full mt-3" onClick={onSendForApproval} disabled={sendingDraft || !canApprove} data-testid="button-send-approval">
            {sendingDraft ? <Loader2 className="spin" /> : <Send />} {sendingDraft ? "Sending to manager" : "Send to Manager for approval"}
          </button>
        )
      )}
      {!!error && <div className="mt-3"><ErrorBox error={error} /></div>}
    </section>
  );
}

function LineItems({ result }: { result: EnquiryResult }) {
  const items = result.analysis.items;
  const priced = result.pricing?.lines ?? [];
  if (items.length === 0) {
    return (
      <div className="rounded-lg border border-[#eddfbf] bg-[#fbf3e1] p-3 text-[12px] text-[#795d2c]" data-testid="text-no-service">
        Service type not recognised. <span className="font-semibold">Missing</span>
      </div>
    );
  }
  return (
    <div className="overflow-x-auto rounded-lg border border-[#e5e0d6]">
      <table className="w-full text-[12px]" data-testid="table-line-items">
        <thead className="bg-[#F6F5F2] text-[10px] uppercase tracking-wider text-[#7b857f]" style={{ fontFamily: "IBM Plex Mono" }}>
          <tr><th className="text-left p-2 font-semibold">Service</th><th className="text-left p-2 font-semibold">Spec</th><th className="text-right p-2 font-semibold">Qty</th><th className="text-right p-2 font-semibold">Unit</th><th className="text-right p-2 font-semibold">Amount</th></tr>
        </thead>
        <tbody>
          {items.map((it, i) => {
            const line = priced.find((l) => l.serviceCode === it.serviceCode);
            const sizeMissing = it.serviceKind === "install" && !it.serviceCode;
            return (
              <tr key={i} className={`border-t border-[#ece8df] ${it.issue ? "bg-[#fbf3e1]" : ""}`} data-testid={`row-item-${i}`}>
                <td className="p-2 text-[#354248] font-medium">
                  {line?.serviceName ?? KIND_LABEL[it.serviceKind]}
                  {it.issue && <div className="text-[11px] font-normal text-[#996b23] mt-0.5" data-testid={`text-item-issue-${i}`}>Needs: {it.issue}</div>}
                </td>
                <td className="p-2">
                  {sizeMissing ? (
                    <span className="inline-block rounded-md border border-[#e3c98f] bg-[#f7e6bf] px-1.5 py-0.5 font-semibold text-[#8a5e14]" data-testid={`text-spec-missing-${i}`}>
                      {it.specification ? `${it.specification} not on price list` : "HP missing"}
                    </span>
                  ) : (it.specification ?? <span className="text-[#9aa29d]">—</span>)}
                </td>
                <td className={`p-2 text-right ${it.quantity == null ? "text-[#996b23] font-semibold" : ""}`}>{it.quantity ?? "Missing"}</td>
                <td className="p-2 text-right">{line ? rm(line.unitPrice) : <span className="text-[#996b23]">?</span>}</td>
                <td className="p-2 text-right font-semibold">{line ? rm(line.lineTotal) : <span className="text-[#996b23]">?</span>}</td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}

function Kv({ k, v }: { k: string; v: string | null | undefined }) {
  return (
    <div>
      <dt className="text-[10px] uppercase tracking-wider text-[#7b857f]" style={{ fontFamily: "IBM Plex Mono" }}>{k}</dt>
      <dd className={`m-0 mt-0.5 ${v ? "font-medium text-[#354248]" : "font-semibold text-[#996b23]"}`}>{v || "Missing"}</dd>
    </div>
  );
}

function OptionCard({ label, opt, onApprove, approvingDate, canApprove, holdExpired }: {
  label: string; opt: ScheduleCheck; onApprove: (o: ScheduleCheck) => void; approvingDate: string | null; canApprove: boolean; holdExpired: boolean;
}) {
  const { isManager } = useRole();
  const v = VERDICT[opt.verdict] ?? VERDICT.needs_verification!;
  const ok = opt.verdict === "feasible";
  const busy = approvingDate === opt.date;
  const locked = ok && !isManager;
  const stale = ok && holdExpired;
  return (
    <div className={`option-card flex flex-col ${ok ? "feasible" : "unfeasible"}`} style={{ marginTop: 0 }} data-testid={`card-option-${opt.date}`}>
      <div className="eyebrow mb-1">{label}</div>
      <div className="option-head"><span className="text-[15px]" style={{ fontFamily: "Manrope" }}>{longDate(opt.date)}</span></div>
      <div className="mt-2">
        {stale ? <span className="badge badge-amber !normal-case" data-testid={`badge-stale-${opt.date}`}>Hold expired · re-check needed</span> : <span className={`badge ${v.cls}`}>{v.label}</span>}
      </div>
      {opt.crew.length > 0 && (
        <div className="crew-list">
          {opt.crew.map((c) => (
            <span key={c.id} className="crew-pill"><span className="crew-avatar">{c.name.split(" ").map((w) => w[0]).slice(0, 2).join("")}</span>{c.name}{c.isSenior && <strong className="text-[#347956]">Senior</strong>}</span>
          ))}
        </div>
      )}
      {opt.conflicts.length > 0 && (
        <ul className="list-disc">{opt.conflicts.map((c, i) => <li key={i}>{c.description}</li>)}</ul>
      )}
      <p className="flex-1">{opt.explanation}</p>
      {locked && <LockBadge className="mt-3" />}
      <button
        className={`btn w-full mt-2 !whitespace-normal !h-auto !py-2 ${ok && !locked && !stale ? "btn-primary" : ""}`}
        disabled={!ok || locked || stale || !canApprove || approvingDate !== null}
        onClick={() => onApprove(opt)}
        data-testid={`button-approve-${opt.date}`}
      >
        {busy ? <Loader2 className="spin" /> : locked ? <Lock /> : stale ? <TimerOff /> : ok ? <CheckCircle2 /> : null}
        {stale ? "Re-verify availability before confirming" : ok ? "Approve Quotation & Confirm Slot" : `${opt.weekday} not available`}
      </button>
    </div>
  );
}

function RecentActivity({ items }: { items: ActivityEntry[] }) {
  const list = items.slice(0, 6);
  return (
    <section className="panel order-3">
      <div className="panel-heading"><div><h2>Recent activity</h2><p>Newest first.</p></div></div>
      {list.length === 0 && <div className="text-[12px] text-[#818984]">No activity yet.</div>}
      <div className="activity-list">
        {list.map((a) => (
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
