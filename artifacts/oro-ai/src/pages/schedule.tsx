import { useState } from "react";
import { Link } from "wouter";
import { useGetStaffSchedule } from "@workspace/api-client-react";
import type { ScheduleBlock, StaffScheduleDay, StaffScheduleRow } from "@workspace/api-client-react";
import { ChevronLeft, ChevronRight, CalendarDays, Plane, Wrench, FileCheck2, CheckCircle2, Moon, Star } from "lucide-react";
import { ErrorBox } from "@/components/shell";
import { PageHeader } from "@workspace/oro-design-system/components/ui/page-header";
import { Empty } from "@workspace/oro-design-system/components/ui/empty-state";
import { initials } from "@/lib/initials";
import { myClock } from "@/lib/util";
import { addDays, shortDay, dayNum } from "@/lib/dates";

const SOURCE: Record<string, { label: string; cls: string; icon: typeof Plane }> = {
  eleave: { label: "eLeave", cls: "blk-leave", icon: Plane },
  orbyte_work: { label: "Orbyte job", cls: "blk-job", icon: Wrench },
  oro_booking: { label: "ORO booking", cls: "blk-oro", icon: FileCheck2 },
};

export default function Schedule() {
  const [from, setFrom] = useState<string | undefined>(undefined);
  const params = from ? { from, days: 7 } : { days: 7 };
  const q = useGetStaffSchedule(params);
  const s = q.data;
  const shift = (n: number) => s && setFrom(addDays(s.from, n));

  return (
    <div className="page">
      <PageHeader
        eyebrow="Staff schedule"
        title="Who is free, day by day"
        sub={s ? `${s.windowLabel} · leave from Orbyte eLeave, jobs from Orbyte Work and ORO bookings` : "Leave from Orbyte eLeave, jobs from Orbyte Work and ORO bookings."}
        actions={
          <div className="week-nav">
            <button className="btn" onClick={() => shift(-7)} disabled={!s || q.isFetching} aria-label="Previous week" data-testid="button-prev-week"><ChevronLeft /></button>
            <span className="week-label" data-testid="text-week">{s ? `${shortDay(s.from)} – ${shortDay(s.to)}` : "Loading week"}</span>
            <button className="btn" onClick={() => shift(7)} disabled={!s || q.isFetching} aria-label="Next week" data-testid="button-next-week"><ChevronRight /></button>
            {from && <button className="btn btn-ghost" onClick={() => setFrom(undefined)} data-testid="button-this-week">Demo week</button>}
          </div>
        }
      />
      <Legend />
      <p className="mb-4 text-xs text-muted-foreground">Demo records only. “Available” means no job or leave is recorded, not that the technician meets every job's requirements. Crew is checked again before booking. Select an ORO booking block to open its quotation.</p>
      {q.isError ? <ErrorBox error={q.error} onRetry={() => q.refetch()} /> : q.isLoading || !s ? (
        <div className="panel"><div className="grid grid-cols-4 md:grid-cols-8 gap-2">{Array.from({ length: 32 }).map((_, i) => <div key={i} className="skeleton-box !h-16" />)}</div></div>
      ) : s.staff.length === 0 ? (
        <div className="panel"><Empty icon={CalendarDays} title="No technicians on record" /></div>
      ) : (
        <>
          <div className={`panel !p-0 hide-mobile board-wrap ${q.isFetching ? "opacity-70" : ""}`}>
            <table className="board" data-testid="board-schedule">
              <thead>
                <tr>
                  <th className="board-corner">Technician</th>
                  {s.days.map((d) => (
                    <th key={d.date} className={`${d.workingDay ? "" : "muted"} ${d.isReferenceDate ? "ref" : ""}`} data-testid={`head-day-${d.date}`}>
                      <div className="bd-wd">{d.weekday.slice(0, 3)} <strong>{dayNum(d.date)}</strong></div>
                      <div className="bd-cap">{d.workingDay ? <><span className={d.availableInstallers > 0 ? "ok" : "bad"}>{d.availableInstallers}</span>/{d.technicians} free · {d.availableSeniorInstallers} senior</> : "Closed"}</div>
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {s.staff.map((r) => (
                  <tr key={r.id} data-testid={`row-staff-${r.id}`}>
                    <th className="board-person"><Person r={r} /></th>
                    {r.days.map((d) => <td key={d.date} className={`cell st-${d.status}`}><Cell d={d} /></td>)}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <div className="show-mobile grid gap-3">
            {s.days.map((d, i) => (
              <section key={d.date} className={`panel !p-3.5 ${d.workingDay ? "" : "opacity-60"}`} data-testid={`card-day-${d.date}`}>
                <div className="flex items-center justify-between mb-2">
                  <strong className="font-display text-[14px]">{shortDay(d.date)}{d.isReferenceDate ? " · demo today" : ""}</strong>
                  <span className="secondary-text !mt-0">{d.workingDay ? `${d.availableInstallers} free · ${d.availableSeniorInstallers} senior` : "Non-working day"}</span>
                </div>
                {d.workingDay && s.staff.map((r) => {
                  const day = r.days[i];
                  if (!day) return null;
                  return (
                    <div key={r.id} className={`m-slot st-${day.status}`}>
                      <span className="crew-avatar">{initials(r.name)}</span>
                      <div className="min-w-0 flex-1"><div className="text-[12.5px] font-semibold">{r.name}{r.isSenior && <span className="sr-tag">Senior</span>}</div><Cell d={day} /></div>
                    </div>
                  );
                })}
              </section>
            ))}
          </div>
        </>
      )}
    </div>
  );
}

function Person({ r }: { r: StaffScheduleRow }) {
  return (
    <div className="flex items-center gap-2.5">
      <span className="crew-avatar lg">{initials(r.name)}</span>
      <div className="min-w-0">
        <div className="person-name">{r.name}{r.isSenior && <span className="sr-tag"><Star size={9} /> Senior</span>}</div>
        <div className="secondary-text !mt-0.5">{r.role}{r.canInstall ? " · installs" : ""}</div>
      </div>
    </div>
  );
}

function Cell({ d }: { d: StaffScheduleDay }) {
  if (d.status === "non_working") return <span className="cell-tag muted"><Moon size={11} /> Off</span>;
  if (d.status === "not_a_technician") return <span className="cell-tag muted">n/a</span>;
  if (d.blocks.length === 0) return <span className="cell-tag ok"><CheckCircle2 size={11} /> Available</span>;
  return <div className="grid gap-1">{d.blocks.map((b) => <Block key={b.id} b={b} />)}</div>;
}

/** Leave records cover the whole day (midnight to midnight), so the clock times would read 12:00 am - 12:00 am. */
function isAllDay(b: ScheduleBlock): boolean {
  return b.kind === "leave" || new Date(b.endAt).getTime() - new Date(b.startAt).getTime() >= 24 * 60 * 60 * 1000;
}

function Block({ b }: { b: ScheduleBlock }) {
  const m = SOURCE[b.source] ?? SOURCE.orbyte_work!;
  const body = (
    <>
      <span className="blk-top"><m.icon size={10} /> {b.kind === "leave" ? "On leave" : b.reference}</span>
      <span className="blk-time">{isAllDay(b) ? "All day" : `${myClock(b.startAt)}–${myClock(b.endAt)}`}</span>
      <span className="blk-title" title={b.title}>{b.kind === "leave" ? `${m.label} #${b.reference}` : b.title}</span>
    </>
  );
  return b.source === "oro_booking" && b.quoteId ? (
    <Link href={`/quotations?open=${b.quoteId}`} className={`blk ${m.cls}`} data-testid={`block-${b.id}`}>{body}</Link>
  ) : <div className={`blk ${m.cls}`} data-testid={`block-${b.id}`}>{body}</div>;
}

function Legend() {
  return (
    <div className="legend no-print" aria-label="Legend">
      <span><i className="sw ok" />Available</span>
      <span><i className="sw job" />Orbyte job</span>
      <span><i className="sw oro" />ORO booking (opens quote)</span>
      <span><i className="sw leave" />On leave (eLeave)</span>
      <span><i className="sw muted" />Non-working day</span>
    </div>
  );
}
