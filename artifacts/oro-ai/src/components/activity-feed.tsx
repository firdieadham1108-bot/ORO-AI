import { ChevronDown } from "lucide-react";
import { Button } from "@workspace/oro-design-system/components/ui/button";
import { StatusBadge } from "@workspace/oro-design-system/components/ui/status-badges";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@workspace/oro-design-system/components/ui/collapsible";
import { eventView, groupHeadline, type ActivityGroup } from "@/lib/activity-feed";
import { myTime } from "@/lib/util";

export function ActivityFeed({ groups }: { groups: ActivityGroup[] }) {
  return <div className="divide-y">
    {groups.map(group => {
      const headline = groupHeadline(group);
      const view = eventView(headline);
      const context = group.events.map(eventView).find(v => v.customer);
      const warnings = group.events.filter(e => e.severity === "warning");
      return <Collapsible key={group.id} className="py-4 first:pt-0 last:pb-0">
        <div className="flex flex-wrap items-center gap-2">
          <StatusBadge tone={view.tone}>{view.title}</StatusBadge>
          {view.reference && <span className="font-mono text-xs text-muted-foreground">{view.reference}</span>}
        </div>
        {view.summary !== view.title && <p className="mt-2 mb-0 text-sm font-medium">{view.summary.slice(view.title.length + 3)}</p>}
        {context?.customer && <p className="mt-1 mb-0 text-sm">{context.customer}</p>}
        <p className="mt-2 mb-0 text-xs text-muted-foreground">{myTime(group.events[0].createdAt)} · {headline.actor}</p>
        {warnings.length > 0 && <div className="mt-2 grid gap-2" aria-label="Warnings in this history">
          {group.events.length > 1 && <span className="text-xs text-muted-foreground">Warnings in this history</span>}
          {warnings.map(event => {
            const warning = eventView(event);
            return <div key={event.id} className="flex flex-wrap items-center gap-2 text-xs">
              {event.id !== headline.id && <StatusBadge tone={warning.tone}>{warning.title}</StatusBadge>}
              <span>{event.description.length > 150 ? `${event.description.slice(0, 147)}…` : event.description}</span>
            </div>;
          })}
        </div>}
        <CollapsibleTrigger asChild>
          <Button variant="ghost" size="sm" className="mt-2" aria-label={`Details for ${view.reference ?? view.title}`}>
            Details{group.events.length > 1 ? ` · ${group.events.length} events` : ""}<ChevronDown />
          </Button>
        </CollapsibleTrigger>
        <CollapsibleContent>
          <ol className="mt-2 grid gap-4 border-l pl-4">
            {group.events.map(event => <li key={event.id} data-testid={`row-activity-${event.id}`} className="min-w-0">
              <StatusBadge tone={eventView(event).tone}>{eventView(event).title}</StatusBadge>
              <p className="mt-2 mb-1 break-words text-sm">{event.description}</p>
              <p className="m-0 text-xs text-muted-foreground">{myTime(event.createdAt)} · {event.actor}</p>
              <code className="text-xs text-muted-foreground">{event.action}</code>
            </li>)}
          </ol>
        </CollapsibleContent>
      </Collapsible>;
    })}
  </div>;
}
