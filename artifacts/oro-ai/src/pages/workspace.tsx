import { useState } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { useProcessEnquiry, useApproveQuotation, useListActivity, useListCommitments, getListActivityQueryKey, getListCommitmentsQueryKey } from "@workspace/api-client-react";
import type { EnquiryResult, ScheduleCheck, Quote, Commitment, TranscriptionResult } from "@workspace/api-client-react";
import { Sparkles, Loader2, AlertTriangle, ShieldCheck, FileText, RotateCcw, Inbox, CheckCircle2, Lock, Mic } from "lucide-react";
import { ErrorBox } from "@/components/shell";
import { RiskAlerts, SimulationBar } from "@/components/risk";
import { PrintableQuoteModal, QuoteDocument, type QuoteDocData } from "@/components/quote-document";
import { LockBadge } from "@/components/lock-badge";
import { VoiceInput } from "@/components/voice-input";
import { useRole } from "@/lib/role";
import { rm, longDate, myTime } from "@/lib/util";

const COMPANY = "CoolAir Services Sdn Bhd";

const SCENARIOS = [
  {
    label: "Scenario 1: Flagship Friday Conflict (EN)",
    customer: "Cheras Office (demo customer)",
    message: "Boss, can you install 6 units of 1.5HP aircon at our Cheras office this Friday? Send quote please.",
  },
  {
    label: "Scenario 2: Bahasa Melayu Multi-Service",
    customer: "Taman Connaught Shop (demo customer)",
    message: "Salam boss, nak pasang 2 biji aircond 1.0hp dan servis biasa 3 biji dekat Taman Connaught Isnin 26 Oct boleh?",
  },
  {
    label: "Scenario 3: Chinese Enquiry",
    customer: "Cheras Shop (demo customer)",
    message: "老板，10月26号星期一我们在蕉赖的店要装一台2.0hp冷气，另外一台旧的要做chemical wash，多少钱？",
  },
  {
    label: "Scenario 4: Missing Info Edge Case",
    customer: "Cheras Apartment (demo customer)",
    message: "Hi CoolAir, can quote me price to install 4 aircons at my apartment in Cheras next Wednesday?",
  },
];

const VOICE_SAMPLE_CUSTOMER = "Cheras Condo (demo customer)";

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

function quoteToDoc(x: Quote): QuoteDocData {
  return {
    companyName: x.companyName,
    reference: x.reference,
    status: x.riskStatus === "AT_RISK" ? "at_risk" : x.status === "approved" ? "approved" : "draft",
    customerName: x.customerName,
    location: x.location,
    lines: x.lineItems,
    totalPrice: x.totalPrice,
    requestedDate: x.requestedDate,
    promisedDate: x.appointmentDate,
    crew: x.crew,
    crewIsProposal: false,
    approvedBy: x.approvedBy,
    approvedAt: x.approvedAt,
  };
}

/** Draft document from an analysed enquiry (before approval). */
function draftDoc(result: EnquiryResult, customer: string): QuoteDocData | null {
  const p = result.pricing;
  if (!p || !result.analysis.location) return null;
  const optA = result.requestedSchedule;
  const proposed = optA?.verdict === "feasible" ? optA : result.alternatives[0];
  return {
    companyName: COMPANY,
    reference: null,
    status: "draft",
    customerName: customer.trim() || "Customer",
    location: result.analysis.location,
    lines: p.lines,
    totalPrice: p.totalPrice,
    requestedDate: result.analysis.requestedDate,
    promisedDate: proposed?.date ?? null,
    crew: proposed ? proposed.crew.map((c) => (c.isSenior ? `${c.name} (senior)` : c.name)) : [],
    crewIsProposal: true,
    approvedBy: null,
    approvedAt: null,
  };
}

export default function Workspace() {
  const qc = useQueryClient();
  const { name: actorName } = useRole();
  const enquiry = useProcessEnquiry();
  const approve = useApproveQuotation();
  const [customer, setCustomer] = useState(SCENARIOS[0]!.customer);
  const [message, setMessage] = useState("");
  const [result, setResult] = useState<EnquiryResult | null>(null);
  const [sentMessage, setSentMessage] = useState("");
  const [quote, setQuote] = useState<Quote | null>(null);
  const [approvingDate, setApprovingDate] = useState<string | null>(null);
  const [recovered, setRecovered] = useState<Commitment | null>(null);
  const [printDoc, setPrintDoc] = useState<QuoteDocData | null>(null);
  const [voice, setVoice] = useState<TranscriptionResult | null>(null);
  const commitments = useListCommitments();
  // Show the latest saved version of the approved quote (crew or risk status may change after approval).
  const liveQuote = quote ? (commitments.data?.find((c) => c.quote.id === quote.id)?.quote ?? quote) : null;

  const analyse = (text: string = message) => {
    approve.reset();
    setQuote(null);
    enquiry.mutate({ data: { message: text } }, { onSuccess: (r) => { setResult(r); setSentMessage(text); qc.invalidateQueries({ queryKey: getListActivityQueryKey() }); } });
  };
  // Voice-to-Quote handoff: the transcript goes into the editable message box, then the normal analysis runs on it.
  const onTranscript = (t: TranscriptionResult) => {
    setVoice(t);
    setMessage(t.transcript);
    if (t.source === "sample") setCustomer(VOICE_SAMPLE_CUSTOMER);
    qc.invalidateQueries({ queryKey: getListActivityQueryKey() });
    analyse(t.transcript);
  };
  const doApprove = (opt: ScheduleCheck) => {
    const p = result?.pricing;
    if (!p || !result.analysis.requestedDate || !result.analysis.location) return;
    const primaryIndex = p.lines.findIndex((l) => l.serviceCode === p.serviceCode);
    setApprovingDate(opt.date);
    approve.mutate({ data: {
      customerName: customer.trim(), serviceCode: p.serviceCode, quantity: p.quantity,
      extraItems: p.lines.filter((_, i) => i !== primaryIndex).map((l) => ({ serviceCode: l.serviceCode, quantity: l.quantity })),
      requestedDate: result.analysis.requestedDate, appointmentDate: opt.date, location: result.analysis.location, message: sentMessage,
      approverName: actorName,
    } }, {
      onSuccess: (q) => {
        setQuote(q);
        qc.invalidateQueries({ queryKey: getListCommitmentsQueryKey() });
      },
      onSettled: () => { setApprovingDate(null); qc.invalidateQueries({ queryKey: getListActivityQueryKey() }); },
    });
  };
  const startOver = () => { setResult(null); setQuote(null); setMessage(""); setVoice(null); enquiry.reset(); approve.reset(); };

  return (
    <div className="page">
      <div className="mb-6 no-print">
        <div className="eyebrow">Quotation workspace</div>
        <h1>Turn a customer message into an approved quote</h1>
        <p className="text-[13px] text-[#707b7a]">Paste the enquiry, let ORO check prices and crew, then approve the option that works.</p>
      </div>
      <SimulationBar />
      <RiskAlerts recovered={recovered} onRecovered={setRecovered} />
      <div className="grid gap-5 lg:grid-cols-[minmax(0,.9fr)_minmax(0,1.3fr)] items-start">
        <div className="grid gap-5 no-print">
          <section className="panel">
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
                      message === s.message ? "border-[#2f6e52] bg-[#e8f2e9] text-[#2f6e52]" : "border-[#ded9ce] bg-[#faf9f4] text-[#4c5a5f] hover:bg-[#f0ede4]"
                    }`}
                    onClick={() => { setMessage(s.message); setCustomer(s.customer); setVoice(null); }}
                    data-testid={`button-scenario-${i + 1}`}
                  >
                    {s.label}
                  </button>
                ))}
              </div>
            </div>
            <div className="field"><label htmlFor="msg">Message</label>
              {voice && <VoiceTranscriptNotice voice={voice} edited={message !== voice.transcript} />}
              <textarea id="msg" value={message} maxLength={2000} onChange={(e) => setMessage(e.target.value)} placeholder="Paste the customer's message here, or use a voice note below" data-testid="input-message" /></div>
            <VoiceInput onTranscript={onTranscript} disabled={enquiry.isPending} />
            <button className="btn btn-primary w-full mt-4" disabled={!message.trim() || !customer.trim() || enquiry.isPending} onClick={() => analyse()} data-testid="button-analyse">
              {enquiry.isPending ? <Loader2 className="spin" /> : <Sparkles />} {enquiry.isPending ? "Analysing enquiry" : "Analyse Enquiry"}
            </button>
            {enquiry.isError && <div className="mt-3"><ErrorBox error={enquiry.error} onRetry={() => analyse()} /></div>}
          </section>
          <RecentActivity />
        </div>

        <div className="grid gap-5">
          {enquiry.isPending ? (
            <div className="panel grid gap-3"><div className="skeleton w-1/3" /><div className="skeleton-box" /><div className="grid sm:grid-cols-2 gap-3"><div className="skeleton-box h-48" /><div className="skeleton-box h-48" /></div></div>
          ) : liveQuote ? (
            <>
              <div className="flex flex-wrap gap-2 justify-end no-print">
                <button className="btn" onClick={startOver} data-testid="button-new-enquiry"><RotateCcw /> Start new enquiry</button>
                <button className="btn btn-primary" onClick={() => setPrintDoc(quoteToDoc(liveQuote))} data-testid="button-view-printable"><FileText /> View Printable Quotation</button>
              </div>
              <div style={{ animation: "fade-up .3s ease both" }}><QuoteDocument q={quoteToDoc(liveQuote)} /></div>
            </>
          ) : result ? (
            <ApprovalCard
              result={result}
              onApprove={doApprove}
              onViewDraft={() => { const d = draftDoc(result, customer); if (d) setPrintDoc(d); }}
              approvingDate={approvingDate}
              error={approve.isError ? approve.error : null}
              canApprove={!!customer.trim()}
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

/** Shows where the text in the message box came from, so nobody mistakes a simulated transcript for a real one. */
function VoiceTranscriptNotice({ voice, edited }: { voice: TranscriptionResult; edited: boolean }) {
  const simulated = voice.mode === "simulated";
  return (
    <div className={`voice-notice ${simulated ? "simulated" : ""}`} data-testid="voice-transcript-notice">
      <Mic size={14} />
      <div className="min-w-0">
        <div>
          <strong data-testid="text-voice-label">{voice.label}</strong>
          <span className="voice-notice-meta"> · {voice.fileName ?? voice.provider}{voice.durationSeconds ? ` · ${Math.round(voice.durationSeconds)}s` : ""}</span>
        </div>
        <div data-testid="text-voice-note">{voice.note}</div>
        <div className="voice-notice-hint">
          {edited ? "You edited the transcript. Click Analyse Enquiry to re-check with your changes." : "Review the words below. Edit them and click Analyse Enquiry again if anything is wrong."}
        </div>
      </div>
    </div>
  );
}

function ApprovalCard({ result, onApprove, onViewDraft, approvingDate, error, canApprove }: {
  result: EnquiryResult; onApprove: (o: ScheduleCheck) => void; onViewDraft: () => void; approvingDate: string | null; error: unknown; canApprove: boolean;
}) {
  const st = STATUS[result.status] ?? STATUS.needs_verification!;
  const a = result.analysis;
  const p = result.pricing;
  const optA = result.requestedSchedule;
  const optB = optA && optA.verdict !== "feasible" ? result.alternatives[0] : undefined;
  const showOptions = result.status !== "needs_clarification" && optA;
  return (
    <section className="panel" data-testid="card-approval" style={{ animation: "fade-up .3s ease both" }}>
      <div className="flex items-start justify-between gap-3 flex-wrap mb-3">
        <div><div className="eyebrow">AGUI Approval Card</div><h2 className="text-[18px] font-bold" style={{ fontFamily: "Manrope" }}>Review and approve</h2></div>
        <span className={`badge ${st.cls}`} data-testid="status-result">{st.label}</span>
      </div>
      <p className="text-[13px] text-[#53605f] mb-4" data-testid="text-summary">{result.summary}</p>

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

      <dl className="grid grid-cols-2 gap-x-4 gap-y-3 text-[13px] rounded-lg bg-[#f3f1e9] border border-[#e5e0d6] p-4 mt-3">
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

      {showOptions && (
        <div className={`grid gap-3 mt-4 ${optB ? "sm:grid-cols-2" : ""}`}>
          <OptionCard label="Option A · Requested" opt={optA!} onApprove={onApprove} approvingDate={approvingDate} canApprove={canApprove && !!p} />
          {optB && <OptionCard label="Option B · Alternative" opt={optB} onApprove={onApprove} approvingDate={approvingDate} canApprove={canApprove && !!p} />}
        </div>
      )}
      {showOptions && (
        <p className="flex items-center gap-2 mt-3 text-[11px] text-[#7b857f]"><ShieldCheck size={14} /> Manager action. Availability is re-checked by the server at the moment of approval.</p>
      )}
      {!!error && <div className="mt-3"><ErrorBox error={error} /></div>}
    </section>
  );
}

/** One row per requested service. Rows that cannot be priced yet are highlighted in amber. */
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
        <thead className="bg-[#f3f1e9] text-[10px] uppercase tracking-wider text-[#7b857f]" style={{ fontFamily: "IBM Plex Mono" }}>
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

function OptionCard({ label, opt, onApprove, approvingDate, canApprove }: {
  label: string; opt: ScheduleCheck; onApprove: (o: ScheduleCheck) => void; approvingDate: string | null; canApprove: boolean;
}) {
  const { isManager } = useRole();
  const v = VERDICT[opt.verdict] ?? VERDICT.needs_verification!;
  const ok = opt.verdict === "feasible";
  const busy = approvingDate === opt.date;
  const locked = ok && !isManager;
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
      {locked && <LockBadge className="mt-3" />}
      <button
        className={`btn w-full mt-2 !whitespace-normal !h-auto !py-2 ${ok && !locked ? "btn-primary" : ""}`}
        disabled={!ok || locked || !canApprove || approvingDate !== null}
        onClick={() => onApprove(opt)}
        data-testid={`button-approve-${opt.date}`}
      >
        {busy ? <Loader2 className="spin" /> : locked ? <Lock /> : ok ? <CheckCircle2 /> : null}
        {ok ? "Approve Quotation & Confirm Slot" : `${opt.weekday} not available`}
      </button>
    </div>
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
