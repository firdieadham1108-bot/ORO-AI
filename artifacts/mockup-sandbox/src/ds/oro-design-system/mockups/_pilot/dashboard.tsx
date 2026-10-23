// PILOT Dashboard. Answers four operational questions in one screen: what needs my decision, which
// promises are at risk, what is booked ahead, who is free today. One primary action: New enquiry.
import { useState } from "react";
import { AlertTriangle, CalendarCheck, CalendarX2, CheckCircle2, History, Lock, MessageSquarePlus, RotateCcw, ShieldCheck } from "lucide-react";
import { Button } from "@workspace/oro-design-system/components/ui/button";
import { Badge } from "@workspace/oro-design-system/components/ui/badge";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@workspace/oro-design-system/components/ui/card";
import { Alert, AlertDescription, AlertTitle } from "@workspace/oro-design-system/components/ui/alert";
import { PageHeader } from "@workspace/oro-design-system/components/ui/page-header";
import { StatusBadge, RiskBadge } from "@workspace/oro-design-system/components/ui/status-badges";
import { SkeletonRows } from "@workspace/oro-design-system/components/ui/skeleton-rows";
import { Skeleton } from "@workspace/oro-design-system/components/ui/skeleton";
import { Empty } from "@workspace/oro-design-system/components/ui/empty-state";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@workspace/oro-design-system/components/ui/table";
import { Separator } from "@workspace/oro-design-system/components/ui/separator";
import { usePilot } from "./store";
import { longDate, myTime, rm, sentence, shortDay } from "./format";
import { STAFF, type AttentionItem } from "../_shared/sample-data";

export function PilotDashboardPage() {
  const { state, dashboard: d, atRisk, recoveredCommitment, isManager, navigate, explain, fireLeave, approveRecovery, retry, reset } = usePilot();
  const loading = state.loading;
  const error = state.error;
  const [recovering, setRecovering] = useState(false);
  const doRecover = () => { setRecovering(true); setTimeout(() => { setRecovering(false); approveRecovery(); }, 600); };

  const nextJob = d.upcoming[0];
  const kpis: Array<{ label: string; value: string; sub: string; alarm?: boolean }> = [
    { label: "Waiting for your decision", value: String(d.counts.pendingQuotations), sub: d.counts.pendingQuotations === 1 ? "draft quotation" : "draft quotations" },
    { label: "Promises at risk", value: String(d.counts.atRiskCommitments), sub: d.counts.atRiskCommitments > 0 ? "recovery needed" : "all approved jobs feasible", alarm: d.counts.atRiskCommitments > 0 },
    { label: "Jobs booked ahead", value: String(d.counts.upcomingAppointments), sub: nextJob ? `next: ${shortDay(nextJob.appointmentDate)}` : "nothing scheduled" },
    { label: "Crew free today", value: `${d.crewToday.available} of ${d.crewToday.technicians}`, sub: `${d.crewToday.onLeave} on leave · ${d.crewToday.assigned} on a job` },
  ];
  const attention = d.needsAttention.filter((a) => a.kind !== "at_risk");

  return (
    <>
      <PageHeader
        eyebrow={`Operations desk · ${d.referenceDateLabel}`}
        title="Dashboard"
        sub="Every number comes from a quotation, leave or job record in the demo data."
        actions={<Button onClick={() => navigate("enquiry")}><MessageSquarePlus /> New enquiry</Button>}
      />

      {error && (
        <Alert variant="destructive" className="mb-5">
          <AlertTriangle className="size-4" />
          <AlertTitle>Could not load the dashboard</AlertTitle>
          <AlertDescription className="flex flex-wrap items-center justify-between gap-2">
            <span>The demo server did not answer. Nothing was changed.</span>
            <Button variant="outline" size="sm" onClick={retry}>Try again</Button>
          </AlertDescription>
        </Alert>
      )}

      <Card className="mb-5">
        <dl className="grid grid-cols-2 md:grid-cols-4">
          {kpis.map((k, i) => (
            <div key={k.label} className={`p-4 md:p-5 ${i % 2 === 1 ? "border-l" : ""} ${i >= 2 ? "border-t md:border-t-0" : ""} ${i === 2 ? "md:border-l" : ""}`}>
              <dt className="text-xs text-muted-foreground">{k.label}</dt>
              {loading ? <Skeleton className="mt-2 h-7 w-12" /> : (
                <dd className={`ds-title mt-1 text-2xl font-extrabold tabular-nums ${k.alarm ? "text-destructive" : "text-primary"}`}>{error ? "–" : k.value}</dd>
              )}
              <dd className="mt-1 text-xs text-muted-foreground">{loading || error ? "\u00a0" : k.sub}</dd>
            </div>
          ))}
        </dl>
      </Card>

      {atRisk && !loading && (
        <Alert variant="destructive" className="mb-5" role="alert">
          <AlertTriangle className="size-4" />
          <AlertTitle>Promise at risk: {atRisk.quote.reference} · {atRisk.quote.customerName} · {longDate(atRisk.quote.appointmentDate!)}</AlertTitle>
          <AlertDescription>
            <p>{atRisk.quote.riskReason}</p>
            {atRisk.recovery && (
              <div className="mt-3 rounded-md border bg-card p-3 text-foreground">
                <p className="text-xs text-muted-foreground">Recommended recovery</p>
                <p className="mt-0.5 text-sm font-medium">{atRisk.recovery.summary}</p>
                <ul className="mt-2 grid gap-1 text-xs text-muted-foreground">
                  {atRisk.recovery.otherEligible.map((m) => <li key={m.id}>{m.name} is also free and qualified (backup).</li>)}
                  {atRisk.recovery.rejected.map((r) => <li key={r.staffName}>{r.staffName} not considered: {r.reason}.</li>)}
                </ul>
                <div className="mt-3 flex flex-wrap items-center gap-2">
                  <Button variant="destructive" size="sm" onClick={doRecover} disabled={!isManager || recovering}>
                    {isManager ? <ShieldCheck /> : <Lock />} {recovering ? "Updating Orbyte Work…" : "Approve recovery: Chong replaces Bala"}
                  </Button>
                  <span className="text-xs text-muted-foreground">{isManager ? "Manager action. The replacement is re-checked before the crew changes." : "Requires Manager (Faizal) approval. Switch role at the top to approve."}</span>
                </div>
              </div>
            )}
            <p className="mt-2 text-xs opacity-80">Leave details stay in Orbyte eLeave; only the approval reference is shown here (PDPA).</p>
          </AlertDescription>
        </Alert>
      )}
      {recoveredCommitment && !loading && (
        <Alert className="mb-5" role="status">
          <CheckCircle2 className="size-4" />
          <AlertTitle>Recovery approved for {recoveredCommitment.quote.reference}</AlertTitle>
          <AlertDescription>Crew is now {recoveredCommitment.quote.crew.join(", ")} on {longDate(recoveredCommitment.quote.appointmentDate!)}. The promise is feasible again and the change is in the activity log.</AlertDescription>
        </Alert>
      )}

      <div className="grid gap-5 lg:grid-cols-[minmax(0,1.6fr)_minmax(0,1fr)]">
        <div className="grid min-w-0 content-start gap-5">
          <Card>
            <CardHeader className="flex-row items-start justify-between gap-3 space-y-0">
              <div>
                <CardTitle>Needs your attention</CardTitle>
                <CardDescription>Drafts waiting for a decision, then crew shortages.</CardDescription>
              </div>
              {!loading && attention.length > 0 && <Badge variant="secondary" className="font-mono tabular-nums">{attention.length}</Badge>}
            </CardHeader>
            <CardContent>
              {loading ? <SkeletonRows rows={2} /> : attention.length === 0 ? (
                <Empty icon={CheckCircle2} title="Nothing waiting on you">Every approved promise is feasible and no draft is queued.</Empty>
              ) : (
                <ul className="grid">
                  {attention.map((a, i) => <AttentionRow key={`${a.kind}-${a.reference ?? i}`} a={a} onOpen={() => explain(a.kind === "pending_approval" ? "approvals" : "schedule")} last={i === attention.length - 1} />)}
                </ul>
              )}
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex-row items-start justify-between gap-3 space-y-0">
              <div>
                <CardTitle>Upcoming jobs</CardTitle>
                <CardDescription>Approved quotations with a confirmed crew.</CardDescription>
              </div>
              <Button variant="ghost" size="sm" onClick={() => explain("schedule")}><CalendarCheck /> Schedule</Button>
            </CardHeader>
            <CardContent>
              {loading ? <SkeletonRows rows={3} /> : d.upcoming.length === 0 ? (
                <Empty icon={CalendarCheck} title="No jobs booked">Approve a quotation and the job appears here with its crew.</Empty>
              ) : (
                <>
                  <div className="hidden md:block">
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead>Date</TableHead>
                          <TableHead>Quotation</TableHead>
                          <TableHead>Customer and job</TableHead>
                          <TableHead>Crew</TableHead>
                          <TableHead className="text-right">Total</TableHead>
                          <TableHead>Status</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {d.upcoming.map((u) => (
                          <TableRow key={u.quoteId}>
                            <TableCell className="whitespace-nowrap font-medium">{shortDay(u.appointmentDate)}</TableCell>
                            <TableCell className="whitespace-nowrap font-mono text-xs tabular-nums">{u.reference}</TableCell>
                            <TableCell>
                              <p className="font-medium">{u.customerName}</p>
                              <p className="text-xs text-muted-foreground">{u.serviceSummary} · {u.location}</p>
                            </TableCell>
                            <TableCell className="whitespace-nowrap">{u.crew.join(", ") || "To be assigned"}</TableCell>
                            <TableCell className="whitespace-nowrap text-right tabular-nums">{rm(u.totalPrice)}</TableCell>
                            <TableCell><RiskBadge risk={u.riskStatus} /></TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  </div>
                  <ul className="grid md:hidden">
                    {d.upcoming.map((u, i) => (
                      <li key={u.quoteId} className={`grid gap-1 py-3 ${i < d.upcoming.length - 1 ? "border-b" : ""}`}>
                        <div className="flex items-center justify-between gap-2">
                          <span className="text-sm font-medium">{shortDay(u.appointmentDate)} · {u.customerName}</span>
                          <span className="text-sm tabular-nums">{rm(u.totalPrice)}</span>
                        </div>
                        <div className="flex flex-wrap items-center justify-between gap-2 text-xs text-muted-foreground">
                          <span><span className="font-mono">{u.reference}</span> · {u.serviceSummary} · {u.crew.join(", ") || "crew to be assigned"}</span>
                          <RiskBadge risk={u.riskStatus} />
                        </div>
                      </li>
                    ))}
                  </ul>
                </>
              )}
            </CardContent>
          </Card>
        </div>

        <div className="grid min-w-0 content-start gap-5">
          <Card>
            <CardHeader>
              <CardTitle>Crew today</CardTitle>
              <CardDescription>{d.crewToday.weekday}, {shortDay(d.crewToday.date)} · {d.crewToday.available} of {d.crewToday.technicians} free</CardDescription>
            </CardHeader>
            <CardContent>
              {loading ? <SkeletonRows rows={4} /> : (
                <ul className="grid">
                  {Object.values(STAFF).map((m, i, arr) => (
                    <li key={m.id} className={`flex items-center justify-between gap-3 py-2.5 ${i < arr.length - 1 ? "border-b" : ""}`}>
                      <div className="min-w-0">
                        <p className="text-sm font-medium">{m.name}</p>
                        <p className="truncate text-xs text-muted-foreground">{m.role}</p>
                      </div>
                      <StatusBadge tone="green">Free</StatusBadge>
                    </li>
                  ))}
                </ul>
              )}
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex-row items-start justify-between gap-3 space-y-0">
              <div>
                <CardTitle>Recent activity</CardTitle>
                <CardDescription>Newest first.</CardDescription>
              </div>
              <Button variant="ghost" size="sm" onClick={() => explain("activity")}><History /> All</Button>
            </CardHeader>
            <CardContent>
              {loading ? <SkeletonRows rows={4} /> : state.activity.length === 0 ? <Empty icon={History} title="No activity yet" /> : (
                <ul className="grid">
                  {state.activity.slice(0, 6).map((a, i, arr) => (
                    <li key={a.id} className={`grid gap-0.5 py-2.5 ${i < arr.length - 1 ? "border-b" : ""}`}>
                      <div className="flex items-center justify-between gap-2">
                        <span className="text-xs font-medium">{sentence(a.action)}</span>
                        <span className="font-mono text-xs tabular-nums text-muted-foreground">{myTime(a.createdAt)}</span>
                      </div>
                      <p className="text-xs leading-relaxed text-muted-foreground">{a.description}</p>
                      <p className="text-xs text-muted-foreground">{a.actor}</p>
                    </li>
                  ))}
                </ul>
              )}
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Demo tools</CardTitle>
              <CardDescription>Simulated Orbyte events for the walkthrough. Nothing here creates a real booking or leave record.</CardDescription>
            </CardHeader>
            <CardContent className="grid gap-2">
              <Button variant="outline" size="sm" className="justify-start" onClick={fireLeave} disabled={state.leaveFired || loading}>
                <CalendarX2 /> {state.leaveFired ? "eLeave event fired: Bala, Mon 26 Oct" : "Simulate eLeave: Bala off on Mon 26 Oct"}
              </Button>
              <p className="text-xs text-muted-foreground">Fires a simulated Orbyte eLeave approval. The Monday promise is re-checked and a recovery is proposed above.</p>
              <Separator />
              <Button variant="ghost" size="sm" className="justify-start" onClick={reset}><RotateCcw /> Reset demo data</Button>
            </CardContent>
          </Card>
        </div>
      </div>
    </>
  );
}

function AttentionRow({ a, onOpen, last }: { a: AttentionItem; onOpen: () => void; last: boolean }) {
  const pending = a.kind === "pending_approval";
  return (
    <li className={`grid gap-2 py-3 sm:flex sm:items-start sm:justify-between sm:gap-4 ${last ? "" : "border-b"}`}>
      <div className="min-w-0 flex-1">
        <div className="flex flex-wrap items-center gap-2">
          {a.reference && <span className="font-mono text-xs tabular-nums text-muted-foreground">{a.reference}</span>}
          <span className="text-sm font-medium">{a.title}</span>
        </div>
        <p className="mt-0.5 text-xs text-muted-foreground">{a.detail}</p>
      </div>
      <div className="flex items-center justify-between gap-2 sm:justify-end">
        {pending ? <StatusBadge tone="amber">Pending approval</StatusBadge> : <StatusBadge tone="verify">Crew short</StatusBadge>}
        <Button variant="outline" size="sm" onClick={onOpen}>{pending ? "Review" : "Schedule"}</Button>
      </div>
    </li>
  );
}
