import { useRef, useState } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { Link } from "wouter";
import { useProcessEnquiry, useApproveQuotation, useCreateQuote, useListActivity, useListCommitments, getListActivityQueryKey, getListCommitmentsQueryKey, getGetOrbyteWalletQueryKey, getListQuotesQueryKey, getGetDashboardSummaryQueryKey } from "@workspace/api-client-react";
import type { EnquiryResult, ScheduleCheck, Quote, Commitment, TranscriptionResult } from "@workspace/api-client-react";
import { Sparkles, Loader2, AlertTriangle, ShieldCheck, FileText, RotateCcw, Inbox, CheckCircle2, Lock, Mic, TimerOff, Send, Info } from "lucide-react";
import { ErrorBox } from "@/components/shell";
import { RiskAlerts, SimulationBar } from "@/components/risk";
import { PrintableQuoteModal, QuoteDocument, type QuoteDocData } from "@/components/quote-document";
import { LockBadge } from "@/components/lock-badge";
import { VoiceInput } from "@/components/voice-input";
import { QuoteTerms, useHoldTimer, HOLD_SECONDS } from "@/components/quote-terms";
import { useRole } from "@/lib/role";
import { rm, longDate, myTime } from "@/lib/util";
import { quoteToDoc } from "@/lib/quote-doc";
import { Button } from "@workspace/oro-design-system/components/ui/button";
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@workspace/oro-design-system/components/ui/card";
import { PageHeader } from "@workspace/oro-design-system/components/ui/page-header";
import { Input } from "@workspace/oro-design-system/components/ui/input";
import { Textarea } from "@workspace/oro-design-system/components/ui/textarea";
import { Label } from "@workspace/oro-design-system/components/ui/label";
import { Empty } from "@workspace/oro-design-system/components/ui/empty-state";
import { SkeletonRows } from "@workspace/oro-design-system/components/ui/skeleton-rows";
import { StatusBadge } from "@workspace/oro-design-system/components/ui/status-badges";
import { Table, TableHeader, TableHead, TableBody, TableRow, TableCell } from "@workspace/oro-design-system/components/ui/table";
import { ActivityFeed } from "@/components/activity-feed";
import { groupActivity } from "@/lib/activity-feed";

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
  const createDraft = useCreateQuote();
  const [customer, setCustomer] = useState(SCENARIOS[0]!.customer);
  const [message, setMessage] = useState("");
  const [result, setResult] = useState<EnquiryResult | null>(null);
  const [sentMessage, setSentMessage] = useState("");
  const [quote, setQuote] = useState<Quote | null>(null);
  // Sales staff cannot approve: they send the priced enquiry to the manager as a draft quotation instead.
  const [draft, setDraft] = useState<Quote | null>(null);
  const [approvingDate, setApprovingDate] = useState<string | null>(null);
  const [recovered, setRecovered] = useState<Commitment | null>(null);
  const [printDoc, setPrintDoc] = useState<QuoteDocData | null>(null);
  const [voice, setVoice] = useState<TranscriptionResult | null>(null);
  // Changes on every analysis, so the approval card (and its crew-hold timer) starts fresh.
  const [resultId, setResultId] = useState(0);
  const resultRef = useRef<HTMLDivElement>(null);
  const commitments = useListCommitments();
  // Show the latest saved version of the approved quote (crew or risk status may change after approval).
  const liveQuote = quote ? (commitments.data?.find((c) => c.quote.id === quote.id)?.quote ?? quote) : null;

  const analyse = (text: string = message, preserveDraft = false) => {
    approve.reset();
    createDraft.reset();
    setQuote(null);
    if (!preserveDraft) setDraft(null);
    enquiry.mutate({ data: { message: text } }, {
      onSuccess: (r) => {
        setResult(r);
        setResultId((n) => n + 1);
        setSentMessage(text);
        qc.invalidateQueries({ queryKey: getListActivityQueryKey() });
        // On phones the result sits below the enquiry form: bring it into view.
        if (window.matchMedia("(max-width: 1023px)").matches) {
          requestAnimationFrame(() => resultRef.current?.scrollIntoView({ behavior: "smooth", block: "start" }));
        }
      },
    });
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
        qc.invalidateQueries({ queryKey: getGetOrbyteWalletQueryKey() });
      },
      onSettled: () => { setApprovingDate(null); qc.invalidateQueries({ queryKey: getListActivityQueryKey() }); },
    });
  };
  const sendForApproval = () => {
    const p = result?.pricing;
    if (!p || !result.analysis.requestedDate || !result.analysis.location) return;
    const primaryIndex = p.lines.findIndex((l) => l.serviceCode === p.serviceCode);
    createDraft.mutate({ data: {
      customerName: customer.trim(), serviceCode: p.serviceCode, quantity: p.quantity,
      extraItems: p.lines.filter((_, i) => i !== primaryIndex).map((l) => ({ serviceCode: l.serviceCode, quantity: l.quantity })),
      requestedDate: result.analysis.requestedDate, location: result.analysis.location, message: sentMessage, requestedBy: actorName,
    } }, {
      onSuccess: (q) => {
        setDraft(q);
        qc.invalidateQueries({ queryKey: getListQuotesQueryKey() });
        qc.invalidateQueries({ queryKey: getGetDashboardSummaryQueryKey() });
      },
      onSettled: () => qc.invalidateQueries({ queryKey: getListActivityQueryKey() }),
    });
  };
  const startOver = () => { setResult(null); setQuote(null); setDraft(null); setMessage(""); setVoice(null); enquiry.reset(); approve.reset(); createDraft.reset(); };

  return (
    <div className="page">
      <div className="no-print">
        <PageHeader eyebrow={`Quotation workspace · ${actorName}`} title="New enquiry"
          sub="Paste the customer's message. ORO checks the approved price list and crew availability; the manager decides."
          actions={<Button variant="outline" onClick={startOver}><RotateCcw /> Start over</Button>} />
      </div>
      <RiskAlerts recovered={recovered} onRecovered={setRecovered} />
      <div className="grid gap-5 lg:grid-cols-5 items-start">
        <div className="contents lg:grid lg:col-span-2 gap-5 no-print">
          <Card className="order-1">
            <CardHeader><CardTitle>Customer request</CardTitle><CardDescription>Paste from WhatsApp, send a voice note, or pick a sample message.</CardDescription></CardHeader>
            <CardContent className="grid gap-4">
            <div className="grid gap-2"><Label htmlFor="cust">Customer</Label>
              <Input id="cust" value={customer} maxLength={160} onChange={(e) => setCustomer(e.target.value)} data-testid="input-customer" /></div>
            <div className="grid gap-2"><Label htmlFor="msg">Message</Label>
              {voice && <VoiceTranscriptNotice voice={voice} edited={message !== voice.transcript} />}
              <Textarea className="min-h-36" id="msg" value={message} maxLength={2000} onChange={(e) => setMessage(e.target.value)} placeholder="Paste the customer's message here, or use a voice note below" data-testid="input-message" /></div>
            <div>
              <div className="mb-2 text-xs text-muted-foreground">Sample messages (demo)</div>
              <div className="flex flex-wrap gap-1.5">
                {SCENARIOS.map((s, i) => (
                  <Button
                    key={i}
                    variant={message === s.message ? "secondary" : "outline"} size="sm"
                    onClick={() => { setMessage(s.message); setCustomer(s.customer); setVoice(null); }}
                    data-testid={`button-scenario-${i + 1}`}
                  >
                    {["Friday install, 6 units (EN)", "Install + service (BM)", "2.0HP + chemical wash (ZH)", "Install, size missing (EN)"][i]}
                  </Button>
                ))}
              </div>
            </div>
            <VoiceInput onTranscript={onTranscript} disabled={enquiry.isPending} />
            <Button className="w-full" disabled={!message.trim() || !customer.trim() || enquiry.isPending} onClick={() => analyse()} data-testid="button-analyse">
              {enquiry.isPending ? <Loader2 className="spin" /> : <Sparkles />} {enquiry.isPending ? "Analysing enquiry" : "Analyse Enquiry"}
            </Button>
            {enquiry.isError && <div className="mt-3"><ErrorBox error={enquiry.error} onRetry={() => analyse()} /></div>}
            </CardContent>
          </Card>
          <Card className="order-4">
            <CardHeader><CardTitle>Demo tools</CardTitle><CardDescription>Simulated Orbyte events for the walkthrough.</CardDescription></CardHeader>
            <CardContent><SimulationBar /></CardContent>
          </Card>
          <RecentActivity />
        </div>

        <div className="grid min-w-0 gap-5 order-2 scroll-mt-14 lg:col-span-3" ref={resultRef} aria-live="polite">
          {enquiry.isPending ? (
            <Card><CardHeader><CardTitle>Checking the enquiry</CardTitle><CardDescription>Checking the price list and crew availability.</CardDescription></CardHeader><CardContent><SkeletonRows rows={4} /></CardContent></Card>
          ) : liveQuote ? (
            <>
              <div className="flex flex-wrap gap-2 justify-end no-print">
                <Button variant="outline" onClick={startOver} data-testid="button-new-enquiry"><RotateCcw /> Start new enquiry</Button>
                <Button onClick={() => setPrintDoc(quoteToDoc(liveQuote))} data-testid="button-view-printable"><FileText /> View Printable Quotation</Button>
              </div>
              <div style={{ animation: "fade-up .3s ease both" }}><QuoteDocument q={quoteToDoc(liveQuote)} /></div>
            </>
          ) : result ? (
            <ApprovalCard
              key={resultId}
              result={result}
              onReverify={() => analyse(sentMessage, true)}
              reverifying={enquiry.isPending}
              onApprove={doApprove}
              onViewDraft={() => { const d = draftDoc(result, customer); if (d) setPrintDoc(d); }}
              approvingDate={approvingDate}
              error={approve.isError ? approve.error : createDraft.isError ? createDraft.error : null}
              canApprove={!!customer.trim()}
              onSendForApproval={sendForApproval}
              sendingDraft={createDraft.isPending}
              draft={draft}
            />
          ) : (
            <Card><CardContent className="pt-6"><Empty icon={Inbox} title="No enquiry analysed yet">Pick a sample message, paste one or use a voice note, then click Analyse Enquiry. The price, crew availability and manager decision appear here.</Empty></CardContent></Card>
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
  // A quote is "generated" once it is priced; a crew slot can only be held when one option is feasible.
  const hasSlot = !!(showOptions && p && [optA, optB].some((o) => o?.verdict === "feasible"));
  const hold = useHoldTimer(HOLD_SECONDS, hasSlot);
  return (
    <section className="grid gap-5" data-testid="card-approval">
      <Card>
      <CardHeader>
      <div className="flex items-start justify-between gap-3 flex-wrap">
        <CardTitle>What the customer asked</CardTitle>
        <StatusBadge tone={result.status === "conflict" ? "red" : result.status === "feasible" ? "green" : "amber"} testId="status-result">{st.label}</StatusBadge>
      </div>
      <CardDescription data-testid="text-summary">{result.summary}</CardDescription>
      </CardHeader>
      <CardContent>
      <p className="flex items-center gap-1.5 text-xs text-muted-foreground" data-testid="badge-extraction-mode">
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

      <dl className="grid grid-cols-2 gap-4 mt-4 text-sm">
        <Kv k="Requested date" v={a.requestedDate ? longDate(a.requestedDate) : null} />
        <Kv k="Location" v={a.location} />
      </dl>
      </CardContent>
      </Card>

      <Card>
      <CardHeader><CardTitle>Price</CardTitle><CardDescription>From the approved CoolAir price list. Pricing and crew availability are checked separately.</CardDescription></CardHeader>
      <CardContent>
      <LineItems result={result} />
      {p && (
        <div className="mt-4 flex items-baseline justify-between flex-wrap gap-2 border-y py-3">
          <span className="mono text-[13px]" data-testid="text-calculation">
            {p.lines.map((l) => `${l.quantity} x ${rm(l.unitPrice).replace(" ", "")}`).join(" + ")} = {p.totalFormatted}
          </span>
          <span className="detail-number" data-testid="text-total">{p.totalFormatted}</span>
        </div>
      )}
      {p && a.location && (
        <div className="flex justify-end mt-3">
          <Button variant="outline" size="sm" onClick={onViewDraft} data-testid="button-view-printable"><FileText /> View Printable Quotation</Button>
        </div>
      )}
      </CardContent>
      </Card>

      <Card>
      <CardHeader><CardTitle>Crew availability &amp; manager decision</CardTitle><CardDescription>Check the requested date and available alternatives before confirming a promise.</CardDescription></CardHeader>
      <CardContent>
      {!showOptions && <p className="text-sm text-muted-foreground">Clarify the request before checking a crew slot or approving the quotation.</p>}
      {p && showOptions && <QuoteTerms hasSlot={hasSlot} hold={hold} onReverify={onReverify} reverifying={reverifying} submitted={!!draft} />}

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
          <Button className="w-full mt-3" onClick={onSendForApproval} disabled={sendingDraft || !canApprove} data-testid="button-send-approval">
            {sendingDraft ? <Loader2 className="spin" /> : <Send />} {sendingDraft ? "Sending to manager" : "Send to Manager for approval"}
          </Button>
        )
      )}
      {!!error && <div className="mt-3"><ErrorBox error={error} /></div>}
      </CardContent>
      </Card>
    </section>
  );
}

/** One row per requested service. Rows that cannot be priced yet are highlighted in amber. */
function LineItems({ result }: { result: EnquiryResult }) {
  const items = result.analysis.items;
  const priced = result.pricing?.lines ?? [];
  if (items.length === 0) {
    return (
      <div className="rounded-md border bg-accent p-3 text-sm text-accent-foreground" data-testid="text-no-service">
        Service type not recognised. <span className="font-semibold">Missing</span>
      </div>
    );
  }
  return (
    <div>
      <Table data-testid="table-line-items">
        <TableHeader>
          <TableRow><TableHead>Service</TableHead><TableHead>Spec</TableHead><TableHead className="text-right">Qty</TableHead><TableHead className="text-right">Unit</TableHead><TableHead className="text-right">Amount</TableHead></TableRow>
        </TableHeader>
        <TableBody>
          {items.map((it, i) => {
            const line = priced.find((l) => l.serviceCode === it.serviceCode);
            const sizeMissing = it.serviceKind === "install" && !it.serviceCode;
            return (
              <TableRow key={i} data-testid={`row-item-${i}`}>
                <TableCell>
                  {line?.serviceName ?? KIND_LABEL[it.serviceKind]}
                  {it.issue && <div className="mt-1 text-xs text-muted-foreground" data-testid={`text-item-issue-${i}`}>Needs: {it.issue}</div>}
                </TableCell>
                <TableCell>
                  {sizeMissing ? (
                    <StatusBadge tone="amber" testId={`text-spec-missing-${i}`}>
                      {it.specification ? `${it.specification} not on price list` : "HP missing"}
                    </StatusBadge>
                  ) : (it.specification ?? "—")}
                </TableCell>
                <TableCell className="text-right">{it.quantity ?? "Missing"}</TableCell>
                <TableCell className="text-right">{line ? rm(line.unitPrice) : "—"}</TableCell>
                <TableCell className="text-right">{line ? rm(line.lineTotal) : "—"}</TableCell>
              </TableRow>
            );
          })}
        </TableBody>
      </Table>
    </div>
  );
}

function Kv({ k, v }: { k: string; v: string | null | undefined }) {
  return (
    <div>
      <dt className="text-xs text-muted-foreground">{k}</dt>
      <dd className="m-0 mt-1 font-medium">{v || "Missing"}</dd>
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
    <div className="flex flex-col rounded-md border p-4 text-sm" data-testid={`card-option-${opt.date}`}>
      <div className="mb-1 text-xs text-muted-foreground">{label}</div>
      <div className="font-semibold">{longDate(opt.date)}</div>
      <div className="mt-2">
        {stale ? <StatusBadge tone="amber" testId={`badge-stale-${opt.date}`}>Check expired · re-check needed</StatusBadge> : <StatusBadge tone={ok ? "green" : opt.verdict === "not_feasible" ? "red" : "verify"}>{v.label}</StatusBadge>}
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
      <p className="flex-1 mt-3 text-xs text-muted-foreground">{opt.explanation}</p>
      {locked && <LockBadge className="mt-3" />}
      <Button
        variant={ok && !locked && !stale ? "default" : "outline"}
        className="w-full mt-2 h-auto"
        disabled={!ok || locked || stale || !canApprove || approvingDate !== null}
        onClick={() => onApprove(opt)}
        data-testid={`button-approve-${opt.date}`}
      >
        {busy ? <Loader2 className="spin" /> : locked ? <Lock /> : stale ? <TimerOff /> : ok ? <CheckCircle2 /> : null}
        <span className="whitespace-normal">{stale ? "Re-verify availability before confirming" : ok ? "Approve Quotation & Confirm Slot" : `${opt.weekday} not available`}</span>
      </Button>
    </div>
  );
}

function RecentActivity() {
  const q = useListActivity();
  const items = groupActivity(q.data ?? []).slice(0, 4);
  return (
    <Card className="order-3">
      <CardHeader><CardTitle>Recent activity</CardTitle><CardDescription>Newest first.</CardDescription></CardHeader>
      <CardContent>
      {q.isLoading && <div className="grid gap-3"><div className="skeleton" /><div className="skeleton w-2/3" /><div className="skeleton" /></div>}
      {q.isError && <ErrorBox error={q.error} onRetry={() => q.refetch()} />}
      {q.data && items.length === 0 && <div className="text-[12px] text-[#818984]">No activity yet.</div>}
      <ActivityFeed groups={items} />
      {q.data && q.data.length > 0 && <Button variant="ghost" size="sm" asChild className="mt-3"><Link href="/activity">View all activity</Link></Button>}
      </CardContent>
    </Card>
  );
}
