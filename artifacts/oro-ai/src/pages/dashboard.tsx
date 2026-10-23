import { Link } from "wouter";
import { useGetDashboardSummary, useListActivity } from "@workspace/api-client-react";
import type { AttentionItem } from "@workspace/api-client-react";
import { Inbox, Clock3, CheckCircle2, CalendarCheck, AlertTriangle, ShieldAlert, Users, MessageSquarePlus, History, ClipboardCheck, CalendarDays } from "lucide-react";
import type { LucideIcon } from "lucide-react";
import { ErrorBox } from "@/components/shell";
import { PageHeader } from "@workspace/oro-design-system/components/ui/page-header";
import { RiskBadge } from "@workspace/oro-design-system/components/ui/status-badges";
import { SkeletonRows } from "@workspace/oro-design-system/components/ui/skeleton-rows";
import { Empty } from "@workspace/oro-design-system/components/ui/empty-state";
import { rm, myTime } from "@/lib/util";
import { shortDay, dayNum, monthShort } from "@/lib/dates";
import { Button } from "@workspace/oro-design-system/components/ui/button";
import { Badge } from "@workspace/oro-design-system/components/ui/badge";
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@workspace/oro-design-system/components/ui/card";
import { Skeleton } from "@workspace/oro-design-system/components/ui/skeleton";
import { StatusBadge } from "@workspace/oro-design-system/components/ui/status-badges";
import { RiskAlerts, SimulationBar } from "@/components/risk";
import { useState } from "react";
import type { Commitment } from "@workspace/api-client-react";

const ATTN: Record<string, { href: string; icon: LucideIcon }> = {
  at_risk: { href: "/risk", icon: ShieldAlert },
  pending_approval: { href: "/approvals", icon: ClipboardCheck },
  crew_short: { href: "/schedule", icon: Users },
};
const ORDER = { at_risk: 0, pending_approval: 1, crew_short: 2 } as Record<string, number>;

export default function Dashboard() {
  const s = useGetDashboardSummary();
  const d = s.data;
  const [recovered, setRecovered] = useState<Commitment | null>(null);
  const stats: Array<{ id: string; label: string; value?: number; href: string; icon: LucideIcon; tone: string; cap: string }> = [
    { id: "enquiries", label: "Customer enquiries", value: d?.counts.enquiries, href: "/enquiry", icon: Inbox, tone: "", cap: "analysed by ORO" },
    { id: "pending", label: "Pending quotations", value: d?.counts.pendingQuotations, href: "/approvals", icon: Clock3, tone: "warn", cap: "waiting for Faizal" },
    { id: "approved", label: "Approved quotations", value: d?.counts.approvedQuotations, href: "/quotations", icon: CheckCircle2, tone: "ok", cap: `${d?.counts.rejectedQuotations ?? 0} declined` },
    { id: "upcoming", label: "Upcoming appointments", value: d?.counts.upcomingAppointments, href: "/schedule", icon: CalendarCheck, tone: "", cap: "crew confirmed" },
    { id: "conflicts", label: "Scheduling conflicts", value: d?.counts.schedulingConflicts, href: "/risk", icon: AlertTriangle, tone: "bad", cap: `${d?.counts.atRiskCommitments ?? 0} commitments at risk` },
  ];
  const attention = [...(d?.needsAttention ?? [])].sort((a, b) => (ORDER[a.kind] ?? 9) - (ORDER[b.kind] ?? 9));

  return (
    <div className="page">
      <PageHeader
        eyebrow={d ? `Operations desk · ${d.referenceDateLabel}` : "Operations desk"}
        title="Dashboard"
        sub="Every number below comes from a quotation, leave or job record."
        actions={<Button asChild><Link href="/enquiry" data-testid="link-new-enquiry"><MessageSquarePlus /> New enquiry</Link></Button>}
      />
      {s.isError && <div className="mb-4"><ErrorBox error={s.error} onRetry={() => s.refetch()} /></div>}

      <Card className="mb-5">
        <dl className="grid grid-cols-2 md:grid-cols-4">
          {[
            { label: "Waiting for your decision", value: d?.counts.pendingQuotations, sub: "draft quotations", href: "/approvals" },
            { label: "Promises at risk", value: d?.counts.atRiskCommitments, sub: "approved commitments to review", href: "/risk" },
            { label: "Jobs booked ahead", value: d?.counts.upcomingAppointments, sub: d?.upcoming[0] ? `next: ${shortDay(d.upcoming[0].appointmentDate)}` : "nothing scheduled", href: "/schedule" },
            { label: "Crew free today", value: d ? `${d.crewToday.available} of ${d.crewToday.technicians}` : undefined, sub: d ? `${d.crewToday.onLeave} on leave · ${d.crewToday.assigned} on a job` : "loading crew", href: "/schedule" },
          ].map((k, i) => (
            <div key={k.label} className={`p-4 md:p-5 ${i % 2 ? "border-l" : ""} ${i >= 2 ? "border-t md:border-t-0" : ""} ${i === 2 ? "md:border-l" : ""}`}>
              <dt className="text-xs text-muted-foreground">{k.label}</dt>
              <dd className="mt-1 text-2xl font-extrabold tabular-nums text-primary">
                {s.isLoading ? <Skeleton className="h-7 w-12" /> : <Link href={k.href} aria-label={k.label}>{s.isError ? "–" : k.value ?? "–"}</Link>}
              </dd>
              <dd className="mt-1 text-xs text-muted-foreground">{s.isLoading || s.isError ? "Awaiting dashboard data" : k.sub}</dd>
            </div>
          ))}
        </dl>
      </Card>
      <RiskAlerts recovered={recovered} onRecovered={setRecovered} />

      <div className="grid gap-5 lg:grid-cols-3">
        <div className="grid content-start gap-5 lg:col-span-2">
          <Card>
            <CardHeader><div className="flex items-start justify-between gap-2"><div><CardTitle>Needs your attention</CardTitle><CardDescription>At-risk promises first, then drafts, then crew shortages.</CardDescription></div>{attention.length > 0 && <Badge variant="secondary">{attention.length}</Badge>}</div></CardHeader>
            <CardContent>
            {s.isLoading ? <SkeletonRows rows={3} /> : attention.length === 0 ? (
              <Empty icon={CheckCircle2} title="Nothing waiting on you">Every approved promise is feasible and no draft is queued.</Empty>
            ) : (
              <div className="divide-y">
                {attention.map((a, i) => <AttentionRow key={i} a={a} i={i} />)}
              </div>
            )}
            </CardContent>
          </Card>

          <Card>
            <CardHeader><div className="flex flex-wrap items-center justify-between gap-2"><div><CardTitle>Upcoming jobs</CardTitle><CardDescription>Approved jobs with a confirmed crew.</CardDescription></div><Button variant="outline" size="sm" asChild><Link href="/schedule"><CalendarDays /> Schedule</Link></Button></div></CardHeader>
            <CardContent>
            {s.isLoading ? <SkeletonRows /> : !d?.upcoming.length ? (
              <Empty icon={CalendarCheck} title="No appointments booked">Approve a quotation and the job appears here.</Empty>
            ) : (
              <div className="grid">
                {d.upcoming.map((u) => (
                  <Link key={u.quoteId} href={`/quotations?open=${u.quoteId}`} className="grid grid-cols-2 gap-2 border-b py-4 last:border-0 sm:grid-cols-3" data-testid={`row-upcoming-${u.quoteId}`}>
                    <div className="text-sm font-medium"><span>{u.weekday.slice(0, 3)} {dayNum(u.appointmentDate)} {monthShort(u.appointmentDate)}</span><div className="mt-1 font-mono text-xs text-muted-foreground">{u.reference}</div></div>
                    <div className="min-w-0">
                      <div className="text-sm font-medium">{u.customerName}</div>
                      <div className="mt-1 text-xs text-muted-foreground">{u.serviceSummary} · {u.location}</div>
                      <div className="mt-1 text-xs text-muted-foreground">{u.crew.join(", ") || "Crew to be assigned"}</div>
                    </div>
                    <div className="text-right grid gap-1.5 justify-items-end">
                      <span className="money">{rm(u.totalPrice)}</span>
                      <RiskBadge risk={u.riskStatus} />
                    </div>
                  </Link>
                ))}
              </div>
            )}
            </CardContent>
          </Card>
        </div>

        <div className="grid content-start gap-5">
          <Card>
            <CardHeader><CardTitle>Crew today</CardTitle><CardDescription>{d ? `${d.crewToday.weekday}, ${shortDay(d.crewToday.date)}` : "Loading"}</CardDescription></CardHeader>
            <CardContent>
            {s.isLoading || !d ? <SkeletonRows rows={2} /> : (
              <>
                <div className="crew-bar" aria-hidden>
                  <span className="ok" style={{ flex: d.crewToday.available }} />
                  <span className="navy" style={{ flex: d.crewToday.assigned }} />
                  <span className="bad" style={{ flex: d.crewToday.onLeave }} />
                </div>
                <dl className="crew-today">
                  <div><dt><i className="dot ok" />Available</dt><dd data-testid="text-crew-available">{d.crewToday.available}</dd></div>
                  <div><dt><i className="dot navy" />On a job</dt><dd>{d.crewToday.assigned}</dd></div>
                  <div><dt><i className="dot bad" />On leave</dt><dd>{d.crewToday.onLeave}</dd></div>
                  <div><dt>Technicians</dt><dd>{d.crewToday.technicians}</dd></div>
                </dl>
              </>
            )}
            </CardContent>
          </Card>
          <RecentActivity />
          <Card>
            <CardHeader><CardTitle>Demo tools</CardTitle><CardDescription>Simulated Orbyte events for the walkthrough.</CardDescription></CardHeader>
            <CardContent><SimulationBar /></CardContent>
          </Card>
        </div>
      </div>
      <div className="mt-5 flex flex-wrap gap-2" aria-label="Quotation totals">
        {stats.map((x) => <Button key={x.id} variant="ghost" size="sm" asChild><Link href={x.href} data-testid={`stat-${x.id}`}>{x.label}: {s.isLoading || s.isError ? "–" : x.value ?? "–"}</Link></Button>)}
      </div>
    </div>
  );
}

function AttentionRow({ a, i }: { a: AttentionItem; i: number }) {
  const m = ATTN[a.kind] ?? ATTN.crew_short!;
  const href = a.kind === "pending_approval" || a.kind === "at_risk" ? m.href : m.href;
  return (
    <div className="grid gap-2 py-3 sm:flex sm:items-start sm:justify-between sm:gap-4">
      <div className="min-w-0 flex-1">
        <div className="text-sm font-medium">{a.reference && <span className="mr-1.5 font-mono text-xs text-muted-foreground">{a.reference}</span>}{a.title}</div>
        <div className="mt-1 text-xs text-muted-foreground">{a.detail}</div>
      </div>
      <div className="flex items-center justify-between gap-2">
        <StatusBadge tone={a.kind === "at_risk" ? "red" : a.kind === "pending_approval" ? "amber" : "verify"}>{a.kind === "at_risk" ? "At risk" : a.kind === "pending_approval" ? "Pending approval" : "Crew short"}</StatusBadge>
        <Button variant="outline" size="sm" asChild><Link href={href} data-testid={`attention-${i}`}>{a.kind === "crew_short" ? "Schedule" : "Review"}</Link></Button>
      </div>
    </div>
  );
}

function RecentActivity() {
  const q = useListActivity();
  const items = q.data?.slice(0, 7) ?? [];
  return (
    <Card>
      <CardHeader><div className="flex items-center justify-between gap-2"><CardTitle>Recent activity</CardTitle><Button variant="ghost" size="sm" asChild><Link href="/activity"><History /> All</Link></Button></div><CardDescription>Newest first.</CardDescription></CardHeader>
      <CardContent>
      {q.isLoading && <SkeletonRows rows={4} />}
      {q.isError && <ErrorBox error={q.error} onRetry={() => q.refetch()} />}
      {q.data && items.length === 0 && <Empty icon={History} title="No activity yet" />}
      <div className="activity-list">
        {items.map((a) => (
          <div key={a.id} className="activity-item" data-testid={`row-activity-${a.id}`}>
            <div className={`activity-mark ${a.severity}`} />
            <div className="min-w-0">
              <div className="activity-text"><strong>{a.action}</strong> - {a.description}</div>
              <div className="activity-time">{myTime(a.createdAt)} · {a.actor}</div>
            </div>
          </div>
        ))}
      </div>
      </CardContent>
    </Card>
  );
}
