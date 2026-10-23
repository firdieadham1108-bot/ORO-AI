/** Presentation only: retain every audit event and group only known relationships. */
export interface FeedEvent {
  id: number;
  action: string;
  description: string;
  actor: string;
  severity: string;
  createdAt: string;
}
export type ActivityTone = "green" | "amber" | "red" | "navy" | "neutral";
const labels: Record<string, [string, ActivityTone]> = {
  quotation_approved: ["Quotation approved", "green"],
  quote_created: ["Awaiting manager approval", "amber"],
  quotation_rejected: ["Quotation declined", "amber"],
  commitment_at_risk: ["Promise at risk", "red"],
  scheduling_conflict_detected: ["Scheduling conflict", "red"],
  approval_blocked: ["Approval blocked", "red"],
  approval_denied: ["Manager approval required", "amber"],
  recovery_blocked: ["Recovery blocked", "red"],
  recovery_recommended: ["Recovery awaiting approval", "amber"],
  recovery_approved: ["Crew recovery approved", "green"],
  availability_unverified: ["Availability needs checking", "amber"],
  availability_checked: ["Crew availability checked", "navy"],
  enquiry_analysed: ["Enquiry analysed", "navy"],
  price_calculated: ["Price calculated", "navy"],
  alternative_suggested: ["Alternative date found", "navy"],
  leave_approved: ["Staff leave recorded", "amber"],
  orbyte_credits_deducted: ["Wallet charge recorded", "neutral"],
  voice_transcribed: ["Voice note transcribed", "navy"],
  risk_scan: ["Commitments checked", "neutral"],
  demo_reset: ["Demo reset", "amber"],
  demo_seeded: ["Demo ready", "neutral"],
};
export function eventView(event: FeedEvent) {
  const key = event.action.toLowerCase();
  const known = labels[key];
  let title = known?.[0] ?? event.action.replace(/_/g, " ").toLowerCase().replace(/^./, c => c.toUpperCase());
  let tone: ActivityTone = known?.[1] ?? (event.severity === "warning" ? "amber" : event.severity === "success" ? "green" : "neutral");
  if (key === "enquiry_analysed" && event.severity === "warning") {
    title = "Enquiry needs clarification";
    tone = "amber";
  } else if (event.severity === "warning" && (tone === "navy" || tone === "neutral" || tone === "green")) {
    tone = "amber";
  }
  const reference = event.description.match(/\bORO-\d+\b/)?.[0];
  const amount = key === "price_calculated"
    ? event.description.match(/=\s*(RM\s?[\d,]+(?:\.\d{2})?)/)?.[1]
    : key === "quotation_approved"
      ? event.description.match(/total\s+(RM\s?[\d,]+(?:\.\d{2})?)/i)?.[1]
      : undefined;
  const date = event.description.match(/Appointment:\s*([^(.]+)/)?.[1]?.trim();
  const customer = event.description.match(/(?:approved quotation ORO-\d+ for|created for)\s+(.+?)\s+\(/i)?.[1];
  return { title, tone, reference, customer, summary: [title, amount, date].filter(Boolean).join(" · ") };
}
export interface ActivityGroup {
  id: string;
  events: FeedEvent[];
}
const analysisSteps = new Set(["price_calculated", "scheduling_conflict_detected", "availability_checked", "availability_unverified", "alternative_suggested"]);
export function groupActivity(events: readonly FeedEvent[]): ActivityGroup[] {
  const ordered = [...events].sort((a, b) => a.createdAt.localeCompare(b.createdAt) || a.id - b.id);
  const groups: ActivityGroup[] = [];
  const quotes = new Map<string, ActivityGroup>();
  let analysis: ActivityGroup | undefined;
  for (const event of ordered) {
    const ref = eventView(event).reference;
    const day = new Date(event.createdAt).toLocaleDateString("en-CA", { timeZone: "Asia/Kuala_Lumpur" });
    if (ref) {
      analysis = undefined;
      const key = `${day}:${ref}`;
      let group = quotes.get(key);
      if (!group) { group = { id: key, events: [] }; quotes.set(key, group); groups.push(group); }
      group.events.push(event);
      continue;
    }
    const last = analysis?.events.at(-1);
    // Never associate anonymous analyses with a quote/customer by timestamp alone.
    // Only combine contiguous system steps immediately following an analysis.
    if (analysis && last && analysisSteps.has(event.action) && event.actor === "System" &&
      Date.parse(event.createdAt) - Date.parse(last.createdAt) <= 5000) {
      analysis.events.push(event);
    } else {
      analysis = undefined;
      const group = { id: `event:${event.id}`, events: [event] };
      groups.push(group);
      if (event.action === "enquiry_analysed") analysis = group;
    }
  }
  return groups.map(g => ({ ...g, events: [...g.events].reverse() }))
    .sort((a, b) => b.events[0].createdAt.localeCompare(a.events[0].createdAt) || b.events[0].id - a.events[0].id);
}
export function groupHeadline(group: ActivityGroup) {
  return group.events.find(e => !["orbyte_credits_deducted", "price_calculated"].includes(e.action.toLowerCase())) ?? group.events[0];
}
