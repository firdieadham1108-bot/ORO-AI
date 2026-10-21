import { useListActivity } from "@workspace/api-client-react";
import { Activity as Icon } from "lucide-react";
import { PageHead, ErrorBox, Skeletons, Empty } from "@/components/shell";
import { myTime } from "@/lib/util";

export default function ActivityPage() {
  const q = useListActivity();
  return (
    <div className="page">
      <PageHead eyebrow="Audit trail" title="Activity log" sub="Everything that happened, newest first." />
      {q.isLoading && <Skeletons />}
      {q.isError && <ErrorBox error={q.error} onRetry={() => q.refetch()} />}
      {q.data && (
        <div className="panel">
          {q.data.length === 0 ? <Empty icon={<Icon />} title="No activity yet" text="Actions will appear here." /> : (
            <div className="activity-list">
              {q.data.map((a) => (
                <div key={a.id} className="activity-item" data-testid={`row-activity-${a.id}`}>
                  <div className={`activity-mark ${a.severity === "warning" ? "warning" : ""}`} />
                  <div>
                    <div className="activity-text"><strong>{a.action}</strong> - {a.description}</div>
                    <div className="activity-time">{myTime(a.createdAt)} · {a.actor}</div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
