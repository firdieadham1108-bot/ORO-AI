import { useMemo, useState } from "react";
import { useListActivity } from "@workspace/api-client-react";
import type { ActivityEntry } from "@workspace/api-client-react";
import { History, Search } from "lucide-react";
import { ErrorBox } from "@/components/shell";
import { PageHeader, SkeletonRows, Empty, StatusBadge } from "@/components/kit";
import { myClock } from "@/lib/util";
import { fullDay, isoDayMY } from "@/lib/dates";

export default function Activity() {
  const q = useListActivity();
  const [text, setText] = useState("");
  const [warnOnly, setWarnOnly] = useState(false);
  const all = useMemo(() => [...(q.data ?? [])].sort((a, b) => b.createdAt.localeCompare(a.createdAt)).slice(0, 200), [q.data]);
  const t = text.trim().toLowerCase();
  const rows = all.filter((a) => (!warnOnly || a.severity === "warning") && (!t || `${a.action} ${a.description} ${a.actor}`.toLowerCase().includes(t)));
  const groups: Array<[string, ActivityEntry[]]> = [];
  rows.forEach((a) => {
    const d = isoDayMY(a.createdAt);
    const g = groups[groups.length - 1];
    if (g && g[0] === d) g[1].push(a); else groups.push([d, [a]]);
  });
  const warnings = all.filter((a) => a.severity === "warning").length;

  return (
    <div className="page">
      <PageHeader eyebrow="Activity log" title="What happened, and who did it" sub="A chronological record of every analysis, approval, leave event and recovery. Times in Malaysia time." />
      <div className="toolbar">
        <label className="search"><Search /><input value={text} onChange={(e) => setText(e.target.value)} placeholder="Search action, description or person" data-testid="input-search-activity" /></label>
        <div className="seg">
          <button className={!warnOnly ? "on" : ""} onClick={() => setWarnOnly(false)} data-testid="filter-activity-all">All <span className="seg-n">{all.length}</span></button>
          <button className={warnOnly ? "on" : ""} onClick={() => setWarnOnly(true)} data-testid="filter-activity-warnings">Warnings <span className="seg-n">{warnings}</span></button>
        </div>
      </div>
      <section className="panel">
        {q.isLoading ? <SkeletonRows rows={8} /> : q.isError ? <ErrorBox error={q.error} onRetry={() => q.refetch()} /> : rows.length === 0 ? (
          <Empty icon={History} title={all.length ? "Nothing matches" : "No activity yet"}>{all.length ? "Clear the search or show all entries." : "Actions appear here as soon as someone uses ORO."}</Empty>
        ) : groups.map(([day, items]) => (
          <div key={day} className="day-group">
            <div className="day-head">{fullDay(day)} <span>{items.length}</span></div>
            {items.map((a) => (
              <div key={a.id} className="log-row" data-testid={`row-activity-${a.id}`}>
                <span className="log-time">{myClock(a.createdAt)}</span>
                <span className={`activity-mark ${a.severity}`} />
                <div className="min-w-0">
                  <div className="flex items-center gap-2 flex-wrap"><strong className="log-action">{a.action}</strong>{a.severity === "warning" && <StatusBadge tone="amber">Warning</StatusBadge>}{a.severity === "success" && <StatusBadge tone="green">Done</StatusBadge>}</div>
                  <div className="activity-text">{a.description}</div>
                </div>
                <span className="log-actor">{a.actor}</span>
              </div>
            ))}
          </div>
        ))}
      </section>
    </div>
  );
}
