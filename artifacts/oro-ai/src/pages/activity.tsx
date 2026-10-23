import { useMemo, useState } from "react";
import { useListActivity } from "@workspace/api-client-react";
import { History, Search } from "lucide-react";
import { ErrorBox } from "@/components/shell";
import { PageHeader } from "@workspace/oro-design-system/components/ui/page-header";
import { SkeletonRows } from "@workspace/oro-design-system/components/ui/skeleton-rows";
import { Empty } from "@workspace/oro-design-system/components/ui/empty-state";
import { ActivityFeed } from "@/components/activity-feed";
import { eventView, groupActivity, type ActivityGroup } from "@/lib/activity-feed";
import { fullDay, isoDayMY } from "@/lib/dates";

export default function Activity() {
  const q = useListActivity();
  const [text, setText] = useState("");
  const [warnOnly, setWarnOnly] = useState(false);
  const all = useMemo(() => [...(q.data ?? [])].sort((a, b) => b.createdAt.localeCompare(a.createdAt)).slice(0, 200), [q.data]);
  const t = text.trim().toLowerCase();
  const rows = groupActivity(all).filter(group => group.events.some(a =>
    (!warnOnly || a.severity === "warning") && (!t || `${eventView(a).title} ${a.action} ${a.description} ${a.actor}`.toLowerCase().includes(t))));
  const groups: Array<[string, ActivityGroup[]]> = [];
  rows.forEach((a) => {
    const d = isoDayMY(a.events[0].createdAt);
    const g = groups[groups.length - 1];
    if (g && g[0] === d) g[1].push(a); else groups.push([d, [a]]);
  });
  const warnings = all.filter((a) => a.severity === "warning").length;

  return (
    <div className="page">
      <PageHeader eyebrow="Activity log" title="What happened, and who did it" sub="Short summaries, newest first. Related events are grouped; Details keeps the full audit record. Times in Malaysia time." />
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
            <div className="day-head">{fullDay(day)} <span>{items.length} updates</span></div>
            <ActivityFeed groups={items} />
          </div>
        ))}
      </section>
    </div>
  );
}
