import { useState } from "react";
import { useGetStaffAvailability } from "@workspace/api-client-react";
import { Users } from "lucide-react";
import { PageHead, ErrorBox, Skeletons, Empty } from "@/components/shell";
import { longDate, myClock } from "@/lib/util";

const QUICK = [{ d: "2026-10-23", l: "Fri 23 Oct 2026" }, { d: "2026-10-26", l: "Mon 26 Oct 2026" }];
const STATUS: Record<string, { cls: string; label: string }> = {
  available: { cls: "badge-green", label: "Available" },
  on_leave: { cls: "badge-red", label: "On leave" },
  assigned: { cls: "badge-amber", label: "Assigned" },
  not_a_technician: { cls: "badge-neutral", label: "Not a technician" },
};

export default function Availability() {
  const [date, setDate] = useState("2026-10-23");
  const valid = /^\d{4}-\d{2}-\d{2}$/.test(date);
  const q = useGetStaffAvailability({ date }, { query: { enabled: valid, queryKey: ["/api/staff/availability", { date }] } });
  const d = q.data;
  return (
    <div className="page">
      <PageHead eyebrow="Who can take the job" title="Staff availability" sub={valid ? longDate(date) : "Pick a date"}>
        <div className="calendar-head">
          <input type="date" value={date} onChange={(e) => setDate(e.target.value)} style={{ height: 44 }} data-testid="input-date" />
        </div>
      </PageHead>
      <div className="chip-row" style={{ marginBottom: 20 }}>
        {QUICK.map((x) => (
          <button key={x.d} className={`btn ${date === x.d ? "btn-primary" : ""}`} onClick={() => setDate(x.d)} data-testid={`button-quick-${x.d}`}>{x.l}</button>
        ))}
      </div>
      {q.isLoading && <Skeletons />}
      {q.isError && <ErrorBox error={q.error} onRetry={() => q.refetch()} />}
      {d && (
        <>
          <div className="grid stats-grid" style={{ gridTemplateColumns: "repeat(2,minmax(0,1fr))" }}>
            <div className="stat-card"><div className="stat-label">Available installers</div><div className="stat-value" data-testid="text-installers">{d.availableInstallers}</div><div className="stat-caption">{d.windowStart && d.windowEnd ? `${myClock(d.windowStart)} to ${myClock(d.windowEnd)}` : d.weekday}</div></div>
            <div className="stat-card"><div className="stat-label">Senior installers</div><div className="stat-value" data-testid="text-senior">{d.availableSeniorInstallers}</div><div className="stat-caption">available on {d.weekday}</div></div>
          </div>
          <div className="panel">
            {d.staff.length === 0 ? (
              <Empty icon={<Users />} title="No staff records" text="Nothing on file for this date." />
            ) : d.staff.map((s) => {
              const st = STATUS[s.status] ?? STATUS.not_a_technician;
              return (
                <div key={s.id} className="schedule-item-card" data-testid={`row-staff-${s.id}`}>
                  <div className="employee-avatar">{s.name.split(" ").map((w) => w[0]).slice(0, 2).join("")}</div>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ display: "flex", gap: 8, flexWrap: "wrap", alignItems: "center" }}>
                      <span className="employee-name">{s.name}</span>
                      {s.isSenior && <span className="badge badge-neutral">Senior</span>}
                      <span className={`badge ${st.cls}`} data-testid={`status-staff-${s.id}`}>{st.label}</span>
                    </div>
                    <div className="employee-title">{s.role}</div>
                    {s.blocks.map((b) => (
                      <div key={b.id} className={`schedule-line ${b.kind === "leave" ? "leave" : "commitment"}`} style={{ marginTop: 8 }}>
                        <div className="schedule-item-title">{b.title}</div>
                        <div className="schedule-item-sub">{b.kind === "leave" ? "Leave" : "Assignment"} · {myClock(b.startAt)} to {myClock(b.endAt)} · <span className="mono">{b.reference}</span></div>
                      </div>
                    ))}
                  </div>
                </div>
              );
            })}
          </div>
        </>
      )}
    </div>
  );
}
