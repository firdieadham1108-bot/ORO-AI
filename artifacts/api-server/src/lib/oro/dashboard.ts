// Dashboard numbers. Everything is counted from the four tables at request time; nothing is cached or hard-coded.
import { db } from "./db";
import { getStaffAvailability } from "./availability";
import { formatLongDate, referenceDate, weekdayOf } from "./dates";
import { assessCommitment } from "./risk";
import { serviceSummaryOf, type QuoteRow } from "./quotes";
import { senToRm } from "./services";

const count = (sql: string, ...params: Array<string | number>): number =>
  Number((db.prepare(sql).get(...params) as { n: number }).n);

interface AttentionItem {
  kind: "at_risk" | "pending_approval" | "crew_short";
  severity: "danger" | "warning" | "info";
  title: string;
  detail: string;
  quoteId: number | null;
  reference: string | null;
}

export function getDashboardSummary() {
  const today = referenceDate();
  const enquiries = count("SELECT COUNT(*) AS n FROM activity_log WHERE action = 'enquiry_analysed'");
  const pendingQuotations = count("SELECT COUNT(*) AS n FROM quotes WHERE status = 'draft'");
  const approvedQuotations = count("SELECT COUNT(*) AS n FROM quotes WHERE status = 'approved'");
  const rejectedQuotations = count("SELECT COUNT(*) AS n FROM quotes WHERE status = 'rejected'");
  const upcomingAppointments = count(
    "SELECT COUNT(*) AS n FROM quotes WHERE status = 'approved' AND appointment_date >= ?",
    today,
  );
  // Conflicts ORO caught while analysing enquiries (requested date not feasible) ...
  const conflictsDetected = count("SELECT COUNT(*) AS n FROM activity_log WHERE action = 'scheduling_conflict_detected'");
  // ... plus approved jobs that became at risk after approval (e.g. emergency leave).
  const atRiskCommitments = count("SELECT COUNT(*) AS n FROM quotes WHERE status = 'approved' AND risk_status = 'AT_RISK'");

  const atRiskRows = db
    .prepare("SELECT * FROM quotes WHERE status = 'approved' AND risk_status = 'AT_RISK' ORDER BY appointment_date, id")
    .all() as unknown as QuoteRow[];
  const draftRows = db.prepare("SELECT * FROM quotes WHERE status = 'draft' ORDER BY id").all() as unknown as QuoteRow[];

  const needsAttention: AttentionItem[] = [
    ...atRiskRows.map((q) => {
      const plan = assessCommitment(q);
      return {
        kind: "at_risk" as const,
        severity: "danger" as const,
        title: `${q.reference} is at risk - ${q.customer_name}, ${formatLongDate(q.appointment_date!)}`,
        detail: plan ? `${q.risk_reason ?? "Crew no longer available."} Suggested fix: ${plan.summary}.` : (q.risk_reason ?? "Crew no longer available."),
        quoteId: q.id,
        reference: q.reference,
      };
    }),
    ...draftRows.map((q) => ({
      kind: "pending_approval" as const,
      severity: "warning" as const,
      title: `${q.reference} is waiting for manager approval - ${q.customer_name}`,
      detail: `${serviceSummaryOf(q)}, requested ${formatLongDate(q.requested_date)}. Sent by ${q.created_by ?? "sales staff"}.`,
      quoteId: q.id,
      reference: q.reference,
    })),
  ];

  const upcomingRows = db
    .prepare("SELECT * FROM quotes WHERE status = 'approved' AND appointment_date >= ? ORDER BY appointment_date, id LIMIT 8")
    .all(today) as unknown as QuoteRow[];
  const upcoming = upcomingRows.map((q) => ({
    quoteId: q.id,
    reference: q.reference,
    customerName: q.customer_name,
    location: q.location,
    appointmentDate: q.appointment_date!,
    weekday: weekdayOf(q.appointment_date!),
    serviceSummary: serviceSummaryOf(q),
    totalPrice: senToRm(q.total_sen),
    crew: q.crew ? (JSON.parse(q.crew) as string[]) : [],
    riskStatus: q.risk_status as "FEASIBLE" | "AT_RISK" | null,
  }));

  const day = getStaffAvailability(today);
  const technicians = day.staff.filter((s) => s.canInstall);
  const crewToday = {
    date: today,
    weekday: day.weekday,
    technicians: technicians.length,
    available: technicians.filter((s) => s.status === "available").length,
    onLeave: technicians.filter((s) => s.status === "on_leave").length,
    assigned: technicians.filter((s) => s.status === "assigned").length,
  };
  if (crewToday.available < 2) {
    needsAttention.push({
      kind: "crew_short" as const,
      severity: "info" as const,
      title: `Only ${crewToday.available} technician(s) free today (${day.weekday})`,
      detail: "Installations need two technicians including one senior. New same-day installation enquiries will be flagged.",
      quoteId: null,
      reference: null,
    });
  }

  return {
    referenceDate: today,
    referenceDateLabel: formatLongDate(today),
    counts: {
      enquiries,
      pendingQuotations,
      approvedQuotations,
      rejectedQuotations,
      upcomingAppointments,
      schedulingConflicts: conflictsDetected + atRiskCommitments,
      conflictsDetected,
      atRiskCommitments,
    },
    needsAttention,
    upcoming,
    crewToday,
  };
}
