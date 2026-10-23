// PILOT New Enquiry. One screen: the customer's request on the left; on the right the result split
// into what was understood, the price, crew availability, and the manager's decision - in that order,
// because that is the order the business reasons in. No hold timer, no microphone, no wallet.
import { useEffect, useRef, useState } from "react";
import { ArrowRight, CalendarCheck, CheckCircle2, FileText, HelpCircle, Inbox, LayoutDashboard, Lock, RotateCcw, Send, ShieldCheck, Sparkles } from "lucide-react";
import { Button } from "@workspace/oro-design-system/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@workspace/oro-design-system/components/ui/card";
import { Input } from "@workspace/oro-design-system/components/ui/input";
import { Textarea } from "@workspace/oro-design-system/components/ui/textarea";
import { Label } from "@workspace/oro-design-system/components/ui/label";
import { Alert, AlertDescription, AlertTitle } from "@workspace/oro-design-system/components/ui/alert";
import { PageHeader } from "@workspace/oro-design-system/components/ui/page-header";
import { StatusBadge } from "@workspace/oro-design-system/components/ui/status-badges";
import { SkeletonRows } from "@workspace/oro-design-system/components/ui/skeleton-rows";
import { Skeleton } from "@workspace/oro-design-system/components/ui/skeleton";
import { Empty } from "@workspace/oro-design-system/components/ui/empty-state";
import { Badge } from "@workspace/oro-design-system/components/ui/badge";
import { Table, TableBody, TableCell, TableFooter, TableHead, TableHeader, TableRow } from "@workspace/oro-design-system/components/ui/table";
import { usePilot } from "./store";
import { longDate, rm } from "./format";
import { QuoteDialog, type QuoteSheetData } from "./quote-sheet";
import { SCENARIOS, stateParam, type EnquiryResult, type Quote, type ScheduleCheck } from "../_shared/sample-data";

const SAMPLE_LABELS = ["Friday install, 6 units (EN)", "Install + service (BM)", "2.0HP + chemical wash (ZH)", "Install, size missing (EN)"];
const KIND_LABEL: Record<string, string> = { install: "Air-conditioning installation", standard_service: "Standard air-conditioning service", chemical_wash: "Chemical wash" };

/** Local stand-in for POST /enquiry: the four sample messages resolve to fixed results. */
function analyseLocally(text: string): EnquiryResult {
  const hit = SCENARIOS.find((s) => s.message.trim() === text.trim());
  if (hit) return hit.result;
  return {
    status: "needs_clarification",
    summary: "This mockup only analyses the four sample messages. In the live app the rule-based parser runs on any text.",
    analysis: { serviceCode: null, quantity: null, specification: null, items: [], requestedDate: null, location: null, referenceDate: "2026-10-21", missing: ["service type (installation, servicing or chemical wash)", "requested date", "job location"], clarification: null },
    alternatives: [],
  };
}

function docFromResult(result: EnquiryResult, customer: string, proposed: ScheduleCheck | null): QuoteSheetData | null {
  const p = result.pricing;
  if (!p) return null;
  return {
    reference: null, status: "draft", customerName: customer.trim() || "Customer", location: result.analysis.location ?? "", lines: p.lines, totalPrice: p.totalPrice,
    requestedDate: result.analysis.requestedDate, promisedDate: proposed?.date ?? null, crew: proposed ? proposed.crew.map((c) => (c.isSenior ? `${c.name} (senior)` : c.name)) : [], approvedBy: null, approvedAt: null,
  };
}
function docFromQuote(q: Quote): QuoteSheetData {
  return { reference: q.reference, status: q.status === "approved" ? "approved" : "draft", customerName: q.customerName, location: q.location, lines: q.lineItems, totalPrice: q.totalPrice, requestedDate: q.requestedDate, promisedDate: q.appointmentDate, crew: q.crew, approvedBy: q.approvedBy, approvedAt: q.approvedAt };
}

export function PilotEnquiryPage() {
  const { isManager, actorName, makeQuote, sendDraft, approveQuote, navigate } = usePilot();
  const [preset] = useState(() => stateParam());
  const startScenario = preset === "clarification" ? SCENARIOS[2]! : preset === "feasible" ? SCENARIOS[1]! : SCENARIOS[0]!;
  const startsAnalysed = preset !== "empty" && preset !== "loading";
  const [customer, setCustomer] = useState(preset === "empty" ? "" : startScenario.customer);
  const [message, setMessage] = useState(preset === "empty" ? "" : startScenario.message);
  const [result, setResult] = useState<EnquiryResult | null>(startsAnalysed ? startScenario.result : null);
  const [analysing, setAnalysing] = useState(preset === "loading");
  const [busy, setBusy] = useState<"approve" | "draft" | null>(null);
  const [quote, setQuote] = useState<Quote | null>(null);
  const [doc, setDoc] = useState<QuoteSheetData | null>(null);
  const resultRef = useRef<HTMLDivElement>(null);
  const timer = useRef<number | null>(null);
  useEffect(() => () => { if (timer.current) window.clearTimeout(timer.current); }, []);

  const analyse = () => {
    setQuote(null); setAnalysing(true);
    timer.current = window.setTimeout(() => {
      setResult(analyseLocally(message)); setAnalysing(false);
      if (window.matchMedia("(max-width: 1023px)").matches) requestAnimationFrame(() => resultRef.current?.scrollIntoView({ behavior: "smooth", block: "start" }));
    }, 700);
  };
  const reset = () => { setResult(null); setQuote(null); setMessage(""); setCustomer(""); };

  // Decision inputs
  const optA = result?.requestedSchedule ?? null;
  const optB = optA && optA.verdict !== "feasible" ? (result?.alternatives[0] ?? null) : null;
  const options = [optA, optB].filter((o): o is ScheduleCheck => !!o);
  const feasible = options.find((o) => o.verdict === "feasible") ?? null;
  const priced = !!result?.pricing && !!result.analysis.location && !!result.analysis.requestedDate;
  const clarification = result?.status === "needs_clarification";

  const approve = () => {
    if (!result || !feasible) return;
    setBusy("approve");
    timer.current = window.setTimeout(() => { const q = makeQuote(result, customer, message, feasible); approveQuote(q); setQuote(q); setBusy(null); }, 700);
  };
  const toManager = () => {
    if (!result) return;
    setBusy("draft");
    timer.current = window.setTimeout(() => { const q = makeQuote(result, customer, message, null); sendDraft(q); setQuote(q); setBusy(null); }, 700);
  };

  return (
    <>
      <PageHeader
        eyebrow={`Quotation workspace · ${actorName}`}
        title="New enquiry"
        sub="Paste the customer's message. ORO prices it from the approved price list and checks crew availability; the manager decides."
        actions={result || message ? <Button variant="outline" onClick={reset}><RotateCcw /> Start over</Button> : undefined}
      />

      <div className="grid items-start gap-5 lg:grid-cols-[minmax(0,5fr)_minmax(0,7fr)]">
        <Card>
          <CardHeader>
            <CardTitle>Customer request</CardTitle>
            <CardDescription>Any language the customer writes in. Voice notes are not part of this pilot.</CardDescription>
          </CardHeader>
          <CardContent className="grid gap-4">
            <div className="grid gap-2">
              <Label htmlFor="pilot-customer">Customer</Label>
              <Input id="pilot-customer" value={customer} maxLength={160} placeholder="Name or site, e.g. Cheras Office" onChange={(e) => setCustomer(e.target.value)} />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="pilot-message">Message</Label>
              <Textarea id="pilot-message" value={message} maxLength={2000} rows={6} placeholder="Paste the WhatsApp message here" onChange={(e) => setMessage(e.target.value)} />
            </div>
            <div className="grid gap-2">
              <p className="text-xs text-muted-foreground">Sample messages (demo)</p>
              <div className="flex flex-wrap gap-2">
                {SCENARIOS.map((s, i) => (
                  <Button key={s.label} type="button" variant={message === s.message ? "secondary" : "outline"} size="sm" onClick={() => { setMessage(s.message); setCustomer(s.customer); }}>
                    {SAMPLE_LABELS[i]}
                  </Button>
                ))}
              </div>
            </div>
            <Button className="w-full" onClick={analyse} disabled={!message.trim() || !customer.trim() || analysing}>
              <Sparkles /> {analysing ? "Analysing…" : "Analyse enquiry"}
            </Button>
            <p className="text-xs text-muted-foreground">Rule-based parser, no AI model connected. Prices and availability come from the demo records.</p>
          </CardContent>
        </Card>

        <div ref={resultRef} className="grid min-w-0 scroll-mt-20 gap-5">
          {analysing ? (
            <>
              <Card><CardHeader><Skeleton className="h-5 w-40" /><Skeleton className="h-4 w-72" /></CardHeader><CardContent><SkeletonRows rows={2} /></CardContent></Card>
              <Card><CardHeader><Skeleton className="h-5 w-32" /></CardHeader><CardContent><SkeletonRows rows={3} /></CardContent></Card>
              <Card><CardHeader><Skeleton className="h-5 w-36" /></CardHeader><CardContent><SkeletonRows rows={2} /></CardContent></Card>
            </>
          ) : !result ? (
            <Card>
              <CardContent className="pt-6">
                <Empty icon={Inbox} title="No enquiry analysed yet">Pick a sample message or paste one, then analyse it. The price, crew availability and the decision appear here.</Empty>
              </CardContent>
            </Card>
          ) : quote ? (
            <Card>
              <CardHeader>
                <div className="flex flex-wrap items-center gap-2">
                  <CardTitle>{quote.status === "approved" ? `Quotation ${quote.reference} approved` : `Draft ${quote.reference} sent to Faizal`}</CardTitle>
                  {quote.status === "approved" ? <StatusBadge tone="green">Approved</StatusBadge> : <StatusBadge tone="amber">Pending approval</StatusBadge>}
                </div>
                <CardDescription>
                  {quote.status === "approved"
                    ? `${quote.customerName} · ${longDate(quote.appointmentDate!)} · crew ${quote.crew.join(", ")} · ${rm(quote.totalPrice)}. Simulated Orbyte Work record created; no real booking.`
                    : `${quote.customerName} · requested ${longDate(quote.requestedDate)} · ${rm(quote.totalPrice)}. It is now on the dashboard under "Needs your attention" and in Manager Approval.`}
                </CardDescription>
              </CardHeader>
              <CardContent className="flex flex-wrap gap-2">
                <Button onClick={() => setDoc(docFromQuote(quote))}><FileText /> View quotation</Button>
                <Button variant="outline" onClick={() => navigate("dashboard")}><LayoutDashboard /> Go to dashboard</Button>
                <Button variant="ghost" onClick={reset}><RotateCcw /> New enquiry</Button>
              </CardContent>
            </Card>
          ) : (
            <>
              {/* 1 · Understood */}
              <Card>
                <CardHeader>
                  <div className="flex flex-wrap items-center justify-between gap-2">
                    <CardTitle>What the customer asked</CardTitle>
                    {result.status === "feasible" && <StatusBadge tone="green">Feasible</StatusBadge>}
                    {result.status === "conflict" && <StatusBadge tone="red">Requested date not available</StatusBadge>}
                    {clarification && <StatusBadge tone="amber">Needs clarification</StatusBadge>}
                    {result.status === "needs_verification" && <StatusBadge tone="verify">Needs verification</StatusBadge>}
                  </div>
                  <CardDescription>{result.summary}</CardDescription>
                </CardHeader>
                <CardContent className="grid gap-4">
                  <dl className="grid grid-cols-2 gap-x-6 gap-y-3 text-sm md:grid-cols-3">
                    <div className="col-span-2 md:col-span-1">
                      <dt className="text-xs text-muted-foreground">Services</dt>
                      <dd className="mt-0.5 font-medium">
                        {result.analysis.items.length === 0 ? <StatusBadge tone="amber">Missing</StatusBadge> : result.analysis.items.map((it, i) => (
                          <span key={i} className="block">{it.quantity ?? "?"} x {KIND_LABEL[it.serviceKind]}{it.specification ? ` ${it.specification}` : ""}</span>
                        ))}
                      </dd>
                    </div>
                    <div><dt className="text-xs text-muted-foreground">Requested date</dt><dd className="mt-0.5 font-medium">{result.analysis.requestedDate ? longDate(result.analysis.requestedDate) : <StatusBadge tone="amber">Missing</StatusBadge>}</dd></div>
                    <div><dt className="text-xs text-muted-foreground">Location</dt><dd className="mt-0.5 font-medium">{result.analysis.location ?? <StatusBadge tone="amber">Missing</StatusBadge>}</dd></div>
                  </dl>
                  {clarification && (
                    <Alert>
                      <HelpCircle className="size-4" />
                      <AlertTitle>Ask the customer before quoting</AlertTitle>
                      <AlertDescription>
                        <ul className="mt-1 list-disc pl-4">{result.analysis.missing.map((m) => <li key={m}>{m}</li>)}</ul>
                        {result.analysis.clarification && <p className="mt-2 font-medium text-foreground">Suggested reply: {result.analysis.clarification}</p>}
                        <p className="mt-2 text-xs">No price or date is promised until the customer answers.</p>
                      </AlertDescription>
                    </Alert>
                  )}
                </CardContent>
              </Card>

              {/* 2 · Price */}
              <Card>
                <CardHeader>
                  <div className="flex flex-wrap items-center justify-between gap-2">
                    <CardTitle>Price</CardTitle>
                    {result.pricing ? <Badge variant="outline">Price list · valid 7 days</Badge> : <StatusBadge tone="amber">Not priced yet</StatusBadge>}
                  </div>
                  <CardDescription>{result.pricing ? "From the approved CoolAir price list. The price does not depend on the date." : "Lines that cannot be priced are flagged. A total is shown only when every line is on the price list."}</CardDescription>
                </CardHeader>
                <CardContent>
                  {result.analysis.items.length === 0 ? (
                    <p className="text-sm text-muted-foreground">No service recognised in the message.</p>
                  ) : (
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead>Service</TableHead>
                          <TableHead className="text-right">Qty</TableHead>
                          <TableHead className="text-right">Unit price</TableHead>
                          <TableHead className="text-right">Amount</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {result.analysis.items.map((it, i) => {
                          const line = it.serviceCode ? result.pricing?.lines.find((l) => l.serviceCode === it.serviceCode) : undefined;
                          const sizeIssue = it.serviceKind === "install" && !it.serviceCode;
                          return (
                            <TableRow key={i}>
                              <TableCell>
                                <span className="font-medium">{line?.serviceName ?? KIND_LABEL[it.serviceKind]}{it.specification && !line ? ` ${it.specification}` : ""}</span>
                              </TableCell>
                              <TableCell className="text-right tabular-nums">{it.quantity ?? <StatusBadge tone="amber">Missing</StatusBadge>}</TableCell>
                              <TableCell className="text-right tabular-nums">{line ? rm(line.unitPrice) : sizeIssue ? <StatusBadge tone="amber">{it.specification ? "Not on price list" : "Size missing"}</StatusBadge> : "–"}</TableCell>
                              <TableCell className="text-right tabular-nums">{line ? rm(line.lineTotal) : "–"}</TableCell>
                            </TableRow>
                          );
                        })}
                      </TableBody>
                      {result.pricing && (
                        <TableFooter>
                          <TableRow>
                            <TableCell colSpan={3}>Total</TableCell>
                            <TableCell className="text-right text-base tabular-nums">{result.pricing.totalFormatted}</TableCell>
                          </TableRow>
                        </TableFooter>
                      )}
                    </Table>
                  )}
                  {priced && (
                    <div className="mt-4 flex justify-end">
                      <Button variant="outline" size="sm" onClick={() => setDoc(docFromResult(result, customer, feasible))}><FileText /> Preview quotation</Button>
                    </div>
                  )}
                </CardContent>
              </Card>

              {/* 3 · Availability */}
              <Card>
                <CardHeader>
                  <CardTitle>Crew availability</CardTitle>
                  <CardDescription>
                    {options.length ? "Checked against staff leave and booked jobs. The slot is locked only when the manager approves." : "Not checked yet. Availability is checked once the request is clear."}
                  </CardDescription>
                </CardHeader>
                {options.length > 0 && (
                  <CardContent>
                    <ul className="grid">
                      {options.map((o, i) => <OptionRow key={o.date} opt={o} label={i === 0 ? "Requested" : "Next feasible"} last={i === options.length - 1} />)}
                    </ul>
                  </CardContent>
                )}
              </Card>

              {/* 4 · Decision */}
              <Card>
                <CardHeader>
                  <CardTitle>Manager decision</CardTitle>
                  <CardDescription>
                    {!priced || clarification ? "Nothing to decide yet." : feasible ? `Approving confirms ${longDate(feasible.date)} with ${feasible.crew.map((c) => c.name).join(", ")} and issues the quotation.` : "No feasible date in this quote. Ask the customer for another date."}
                  </CardDescription>
                </CardHeader>
                {priced && !clarification && (
                  <CardContent className="grid gap-3">
                    {feasible && (
                      <div className="flex flex-wrap items-center justify-between gap-2 rounded-md border bg-muted px-3 py-2 text-sm">
                        <span className="flex items-center gap-2 font-medium"><CalendarCheck className="size-4 text-accent-foreground" aria-hidden /> {longDate(feasible.date)}{feasible.date !== result.analysis.requestedDate ? " (alternative)" : ""}</span>
                        <span className="text-muted-foreground">{feasible.crew.map((c) => c.name + (c.isSenior ? " (senior)" : "")).join(", ")} · {result.pricing!.totalFormatted}</span>
                      </div>
                    )}
                    {isManager ? (
                      <div className="flex flex-wrap items-center gap-3">
                        <Button onClick={approve} disabled={!feasible || busy !== null}><ShieldCheck /> {busy === "approve" ? "Re-checking crew…" : "Approve quotation and confirm crew"}</Button>
                        <span className="text-xs text-muted-foreground">Availability is re-checked at the moment of approval.</span>
                      </div>
                    ) : (
                      <div className="flex flex-wrap items-center gap-3">
                        <Button onClick={toManager} disabled={busy !== null}><Send /> {busy === "draft" ? "Sending…" : "Send to Faizal for approval"}</Button>
                        <span className="flex items-center gap-1 text-xs text-muted-foreground"><Lock className="size-3" aria-hidden /> Only the manager can confirm a crew slot.</span>
                      </div>
                    )}
                  </CardContent>
                )}
                {clarification && (
                  <CardContent>
                    <Button variant="outline" size="sm" onClick={() => document.getElementById("pilot-message")?.focus()}>Edit the message <ArrowRight /></Button>
                  </CardContent>
                )}
              </Card>
            </>
          )}
        </div>
      </div>
      <QuoteDialog q={doc} open={!!doc} onOpenChange={(o) => !o && setDoc(null)} />
    </>
  );
}

function OptionRow({ opt, label, last }: { opt: ScheduleCheck; label: string; last: boolean }) {
  const ok = opt.verdict === "feasible";
  return (
    <li className={`grid gap-2 py-3 ${last ? "" : "border-b"}`}>
      <div className="flex flex-wrap items-center justify-between gap-2">
        <div className="flex flex-wrap items-center gap-2">
          <span className="text-xs text-muted-foreground">{label}</span>
          <span className="text-sm font-medium">{longDate(opt.date)}</span>
        </div>
        {ok ? <StatusBadge tone="green">Crew available</StatusBadge> : opt.verdict === "not_feasible" ? <StatusBadge tone="red">Not available</StatusBadge> : <StatusBadge tone="verify">Needs verification</StatusBadge>}
      </div>
      {opt.crew.length > 0 && (
        <p className="text-sm">
          {opt.crew.map((c, i) => (
            <span key={c.id}>{i > 0 && ", "}{c.name}{c.isSenior && <span className="text-xs text-muted-foreground"> (senior)</span>}</span>
          ))}
        </p>
      )}
      {opt.conflicts.length > 0 && <ul className="list-disc pl-4 text-xs text-muted-foreground">{opt.conflicts.map((c, i) => <li key={i}>{c.description}</li>)}</ul>}
      <p className="text-xs text-muted-foreground">{opt.explanation}</p>
      {ok && <p className="flex items-center gap-1 text-xs text-muted-foreground"><CheckCircle2 className="size-3" aria-hidden /> Crew of {opt.crew.length}{opt.crew.some((c) => c.isSenior) ? " including a senior technician" : ""}.</p>}
    </li>
  );
}
