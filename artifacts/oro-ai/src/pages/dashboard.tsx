import { Link } from "wouter";
import { useGetDashboardSummary, useListActivity } from "@workspace/api-client-react";
import type { AttentionItem } from "@workspace/api-client-react";
import { Inbox, Clock3, CheckCircle2, CalendarCheck, AlertTriangle, ChevronRight, ShieldAlert, Users, MessageSquarePlus, History, ClipboardCheck, CalendarDays } from "lucide-react";
import type { LucideIcon } from "lucide-react";
import { ErrorBox } from "@/components/shell";
import { PageHeader, RiskBadge, SkeletonRows, Empty, initials } from "@/components/kit";
import { rm, myTime } from "@/lib/util";
import { shortDay, dayNum, monthShort } from "@/lib/dates";

const ATTN: Record<string, { href: string; icon: LucideIcon }> = {
  at_risk: { href: "/risk", icon: ShieldAlert },
  pending_approval: { href: "/approvals", icon: ClipboardCheck },
  crew_short: { href: "/schedule", icon: Users },
};
const ORDER = { at_risk: 0, pending_approval: 1, crew_short: 2 } as Record<string, number>;

export default function Dashboard() {
  const s = useGetDashboardSummary();
  const d = s.data;
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
        title="Good morning, CoolAir"
        sub="Every number below comes from a quotation, leave or job record."
        actions={<Link href="/enquiry" className="btn btn-primary" data-testid="link-new-enquiry"><MessageSquarePlus /> New enquiry</Link>}
      />
      {s.isError && <div className="mb-4"><ErrorBox error={s.error} onRetry={() => s.refetch()} /></div>}

      <div className="stats-grid">
        {stats.map((x, i) => (
          <Link key={x.id} href={x.href} className={`stat-card ${x.tone}`} style={{ animationDelay: `${i * 40}ms` }} data-testid={`stat-${x.id}`}>
            <div className="stat-label"><x.icon /> {x.label}</div>
            {s.isLoading ? <div className="skeleton !w-12 !h-7 mt-3" /> : <div className="stat-value">{x.value ?? "–"}</div>}
            <div className="stat-caption">{x.cap}</div>
          </Link>
        ))}
      </div>

      <div className="dashboard-grid">
        <div className="wide-stack">
          <section className="panel">
            <div className="panel-heading"><div><h2>Needs attention</h2><p>At-risk promises first, then drafts, then crew shortages.</p></div>{attention.length > 0 && <span className="count-pill">{attention.length}</span>}</div>
            {s.isLoading ? <SkeletonRows rows={3} /> : attention.length === 0 ? (
              <Empty icon={CheckCircle2} title="Nothing waiting on you">Every approved promise is feasible and no draft is queued.</Empty>
            ) : (
              <div className="attn-list">
                {attention.map((a, i) => <AttentionRow key={i} a={a} i={i} />)}
              </div>
            )}
          </section>

          <section className="panel">
            <div className="panel-heading"><div><h2>Upcoming appointments</h2><p>Approved jobs with a confirmed crew.</p></div><Link href="/schedule" className="btn btn-ghost"><CalendarDays /> Schedule</Link></div>
            {s.isLoading ? <SkeletonRows /> : !d?.upcoming.length ? (
              <Empty icon={CalendarCheck} title="No appointments booked">Approve a quotation and the job appears here.</Empty>
            ) : (
              <div className="grid">
                {d.upcoming.map((u, i) => (
                  <Link key={u.quoteId} href={`/quotations?open=${u.quoteId}`} className="appt-row stagger" style={{ animationDelay: `${i * 35}ms` }} data-testid={`row-upcoming-${u.quoteId}`}>
                    <div className="date-tile"><span>{u.weekday.slice(0, 3)}</span><strong>{dayNum(u.appointmentDate)}</strong><span>{monthShort(u.appointmentDate)}</span></div>
                    <div className="min-w-0">
                      <div className="flex items-center gap-2 flex-wrap"><span className="mono">{u.reference}</span><span className="customer truncate">{u.customerName}</span></div>
                      <div className="secondary-text truncate">{u.serviceSummary} · {u.location}</div>
                      <div className="crew-inline">{u.crew.map((c) => <span key={c} className="crew-avatar" title={c}>{initials(c)}</span>)}<span className="secondary-text !mt-0">{u.crew.join(", ") || "Crew to be assigned"}</span></div>
                    </div>
                    <div className="text-right grid gap-1.5 justify-items-end">
                      <span className="money">{rm(u.totalPrice)}</span>
                      <RiskBadge risk={u.riskStatus} />
                    </div>
                  </Link>
                ))}
              </div>
            )}
          </section>
        </div>

        <div className="wide-stack">
          <section className="panel">
            <div className="panel-heading"><div><h2>Crew today</h2><p>{d ? `${d.crewToday.weekday}, ${shortDay(d.crewToday.date)}` : "Loading"}</p></div><Users size={16} className="text-[var(--muted-ink)]" /></div>
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
          </section>
          <RecentActivity />
        </div>
      </div>
    </div>
  );
}

function AttentionRow({ a, i }: { a: AttentionItem; i: number }) {
  const m = ATTN[a.kind] ?? ATTN.crew_short!;
  const href = a.kind === "pending_approval" || a.kind === "at_risk" ? m.href : m.href;
  return (
    <Link href={href} className={`attn-row ${a.severity} stagger`} style={{ animationDelay: `${i * 35}ms` }} data-testid={`attention-${i}`}>
      <span className="attn-icon"><m.icon size={15} /></span>
      <div className="min-w-0 flex-1">
        <div className="attn-title">{a.reference && <span className="mono mr-1.5">{a.reference}</span>}{a.title}</div>
        <div className="secondary-text">{a.detail}</div>
      </div>
      <ChevronRight size={16} className="shrink-0 opacity-50" />
    </Link>
  );
}

function RecentActivity() {
  const q = useListActivity();
  const items = q.data?.slice(0, 7) ?? [];
  return (
    <section className="panel">
      <div className="panel-heading"><div><h2>Recent activity</h2><p>Newest first.</p></div><Link href="/activity" className="btn btn-ghost"><History /> All</Link></div>
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
    </section>
  );
}
