// Commitment risk monitoring and recovery (brief Optional C and D).
// A leave event from (simulated) Orbyte eLeave is always recorded; ORO AI never blocks leave.
// Afterwards, approved commitments that depend on the person are re-checked from the database,
// flagged AT_RISK, and a replacement is recommended. Changing the crew needs the manager.
import { db, inTransaction, logActivity } from "./db";
import { getStaffAvailability } from "./availability";
import { MockOrbyteApprovalAdapter, MockOrbyteLeaveAdapter, MockOrbytePeopleAdapter, MockOrbyteWorkAdapter } from "./orbyte-adapters";
import { addDays, formatLongDate, overlaps, workingWindow } from "./dates";
import { crewLabel, formatRm, toQuote, type QuoteRow } from "./quotes";
import { crewRequirementFor, findAlternatives, type CrewMember } from "./scheduling";
import { chargeTransaction } from "./wallet";

const ELEAVE_ACTOR = "Orbyte eLeave (simulated)";
const MONITOR_ACTOR = "ORO AI risk monitor";

/** The scripted demo event: Bala's emergency leave for Monday 26 Oct 2026 is approved in eLeave. */
export const DEMO_LEAVE_EVENT = {
  staffName: "Bala",
  date: "2026-10-26",
  reference: "LV-0499",
  title: "Approved emergency leave",
} as const;

const toMember = (s: { id: number; name: string; role: string; isSenior: boolean }): CrewMember => ({
  id: s.id,
  name: s.name,
  role: s.role,
  isSenior: s.isSenior,
});

function reservationsFor(quoteId: number) {
  return MockOrbyteWorkAdapter.assignmentsForQuote(quoteId);
}

function getQuoteRow(id: number): QuoteRow | undefined {
  return db.prepare("SELECT * FROM quotes WHERE id = ?").get(id) as unknown as QuoteRow | undefined;
}

export interface RecoveryPlan {
  status: "replacement_found" | "no_replacement";
  unavailableStaffName: string;
  unavailableStaffId: number;
  leaveReference: string;
  replacement: CrewMember | null;
  availableHours: number;
  extraCost: number;
  extraCostFormatted: string;
  otherJobsDelayed: number;
  summary: string;
  otherEligible: CrewMember[];
  rejected: Array<{ staffName: string; reason: string }>;
  riskReason: string;
}

/**
 * Re-check one approved commitment against the current records.
 * Returns null when the whole reserved crew is still free; otherwise who dropped out, why,
 * and the best safe replacement (or a new-date suggestion when nobody qualifies).
 */
export function assessCommitment(quote: QuoteRow): RecoveryPlan | null {
  if (quote.status !== "approved" || !quote.appointment_date) return null;
  const date = quote.appointment_date;
  const day = getStaffAvailability(date);
  const reservations = reservationsFor(quote.id);
  const crewIds = new Set(reservations.map((r) => r.staffId));
  const crew = day.staff.filter((s) => crewIds.has(s.id));

  const missing = crew.find((s) => s.status === "on_leave");
  if (!missing) return null;
  const leave = missing.blocks.find((b) => b.kind === "leave")!;
  const requirement = crewRequirementFor(quote.service_code);
  const remaining = crew.filter((s) => s.id !== missing.id);
  const seniorsShort = Math.max(0, requirement.minSeniors - remaining.filter((s) => s.isSenior).length);

  const riskReason =
    `${missing.name} is on ${leave.title.toLowerCase()} (Orbyte eLeave #${leave.reference}); ` +
    (seniorsShort > 0
      ? "crew no longer meets Senior Technician requirement."
      : `crew is now ${requirement.crewSize - remaining.length} technician short.`);

  // Candidate replacements: qualified installers not already on this job, checked against leave and bookings.
  const rejected: Array<{ staffName: string; reason: string }> = [];
  const eligible = day.staff
    .filter((s) => s.canInstall && !crewIds.has(s.id))
    .sort((a, b) => a.dispatchOrder - b.dispatchOrder)
    .filter((s) => {
      const leaveBlock = s.blocks.find((b) => b.kind === "leave");
      if (leaveBlock) {
        rejected.push({ staffName: s.name, reason: `On approved leave (${leaveBlock.reference}).` });
        return false;
      }
      const job = s.blocks.find((b) => b.kind === "assignment");
      if (job) {
        rejected.push({ staffName: s.name, reason: `Already booked: ${job.title} (${job.reference}); swapping would create another conflict.` });
        return false;
      }
      if (seniorsShort > 0 && !s.isSenior) {
        rejected.push({ staffName: s.name, reason: "Not a senior installation technician; the crew needs one." });
        return false;
      }
      return true;
    });

  const window = workingWindow(date);
  const windowHours = (Date.parse(window.end) - Date.parse(window.start)) / 3_600_000;
  const longDate = formatLongDate(date);
  const base = {
    unavailableStaffName: missing.name,
    unavailableStaffId: missing.id,
    leaveReference: leave.reference,
    rejected,
    riskReason,
    extraCost: 0,
    extraCostFormatted: formatRm(0),
  };

  const pick = eligible[0];
  if (!pick) {
    const nextDate = findAlternatives(date, quote.service_code)[0];
    return {
      ...base,
      status: "no_replacement",
      replacement: null,
      availableHours: 0,
      otherJobsDelayed: 0,
      otherEligible: [],
      summary:
        `No qualified technician is free on ${longDate} without causing another conflict. ` +
        (nextDate
          ? `Suggest moving to ${formatLongDate(nextDate.date)} (crew available); the customer must agree first.`
          : "No feasible date found in the next two weeks; contact the customer."),
    };
  }

  // The pick has no leave or job overlapping the window, so the whole window is free,
  // no other job has to move, and no overtime is needed (normal working hours).
  const busyHours = pick.blocks
    .filter((b) => overlaps(window.start, window.end, b.startAt, b.endAt))
    .reduce((h, b) => h + (Math.min(Date.parse(window.end), Date.parse(b.endAt)) - Math.max(Date.parse(window.start), Date.parse(b.startAt))) / 3_600_000, 0);
  const availableHours = windowHours - busyHours;
  const role = pick.isSenior ? "Senior Tech" : "Technician";
  return {
    ...base,
    status: "replacement_found",
    replacement: toMember(pick),
    availableHours,
    otherJobsDelayed: 0,
    otherEligible: eligible.slice(1).map(toMember),
    summary: `Swap ${missing.name} -> ${pick.name} (${role}, Available ${availableHours} hrs, RM0 extra cost, 0 other jobs delayed)`,
  };
}

export function toCommitment(row: QuoteRow) {
  return { quote: toQuote(row), recovery: row.risk_status === "AT_RISK" ? assessCommitment(row) : null };
}

/** All approved commitments, at-risk ones first. */
export function listCommitments() {
  const rows = db
    .prepare("SELECT * FROM quotes WHERE status = 'approved' ORDER BY (risk_status = 'AT_RISK') DESC, appointment_date, id")
    .all() as unknown as QuoteRow[];
  return rows.map(toCommitment);
}

/** Simulated Orbyte eLeave webhook: record the leave, then re-check commitments that depend on that person. */
export function simulateEmergencyLeave() {
  const ev = DEMO_LEAVE_EVENT;
  return inTransaction(() => {
    const person = MockOrbytePeopleAdapter.findByName(ev.staffName);
    if (!person) throw new Error(`Staff member ${ev.staffName} is missing from the demo data.`);
    const leaveStart = `${ev.date}T00:00:00+08:00`;
    const leaveEnd = `${addDays(ev.date, 1)}T00:00:00+08:00`;
    const longDate = formatLongDate(ev.date);

    const existing = MockOrbyteLeaveAdapter.findLeave(person.id, ev.reference);
    if (!existing) {
      MockOrbyteLeaveAdapter.recordApprovedLeave({
        staffId: person.id, title: ev.title, startAt: leaveStart, endAt: leaveEnd, reference: ev.reference,
      });
      logActivity(
        "leave_approved",
        `Orbyte eLeave approved emergency leave for ${person.name} on ${longDate} (eLeave #${ev.reference}). ` +
          "Leave approvals are never blocked by ORO AI. Re-checking commitments that depend on him.",
        ELEAVE_ACTOR,
        "warning",
      );
    }

    // Approved commitments whose Orbyte Work assignment for this person overlaps the leave.
    const quoteIds = new Set(
      MockOrbyteWorkAdapter.listAssignments()
        .filter((r) => r.staffId === person.id && r.quoteId !== null && overlaps(leaveStart, leaveEnd, r.startAt, r.endAt))
        .map((r) => r.quoteId as number),
    );
    const affected = [...quoteIds]
      .sort((a, b) => a - b)
      .map((id) => getQuoteRow(id))
      .filter((q): q is QuoteRow => q?.status === "approved");

    const newlyFlagged: string[] = [];
    for (const q of affected) {
      const plan = assessCommitment(q);
      if (!plan || q.risk_status === "AT_RISK") continue;
      db.prepare("UPDATE quotes SET risk_status = 'AT_RISK', risk_reason = ? WHERE id = ?").run(plan.riskReason, q.id);
      newlyFlagged.push(q.reference);
      logActivity(
        "commitment_at_risk",
        `Quote #${q.reference} (${q.customer_name}, ${formatLongDate(q.appointment_date!)}) is AT RISK: ${plan.riskReason}`,
        MONITOR_ACTOR,
        "warning",
      );
      logActivity(
        "recovery_recommended",
        `Recommended recovery for #${q.reference}: ${plan.summary}.` +
          (plan.rejected.length ? ` Rejected: ${plan.rejected.map((r) => `${r.staffName} (${r.reason})`).join(" ")}` : "") +
          " Waiting for manager approval.",
        MONITOR_ACTOR,
        "info",
      );
    }
    if (!existing && affected.length === 0) {
      logActivity("risk_scan", `No approved commitments depend on ${person.name} on ${longDate}. Nothing at risk.`, MONITOR_ACTOR, "info");
    }

    const atRisk = affected.map((q) => toCommitment(getQuoteRow(q.id)!));
    return {
      message: existing
        ? `eLeave #${ev.reference} was already recorded. ${atRisk.length} commitment(s) depend on ${person.name} that day.`
        : `eLeave #${ev.reference} recorded for ${person.name} on ${longDate}. ${newlyFlagged.length} commitment(s) flagged at risk.`,
      leave: { staffName: person.name, date: ev.date, reference: ev.reference, alreadyRecorded: !!existing },
      atRisk,
    };
  });
}

export type RecoveryOutcome =
  | { ok: true; commitment: ReturnType<typeof toCommitment> }
  | { ok: false; status: 403 | 404 | 409; error: string };

/** Manager approves the recommended swap. Everything is re-validated inside one transaction. */
export function recoverCommitment(quoteId: number, input: { managerName: string; replacementStaffId?: number | null }): RecoveryOutcome {
  return inTransaction((): RecoveryOutcome => {
    const manager = MockOrbyteApprovalAdapter.canApprove(input.managerName);
    if (!manager) {
      return { ok: false, status: 403, error: "Only the business manager (Faizal) can approve a crew change." };
    }
    const quote = getQuoteRow(quoteId);
    if (!quote || quote.status !== "approved") return { ok: false, status: 404, error: "Approved commitment not found." };
    if (quote.risk_status !== "AT_RISK") {
      return { ok: false, status: 409, error: `Quote #${quote.reference} is not at risk, so there is nothing to recover.` };
    }

    // Fresh check from the database at the moment of approval.
    const plan = assessCommitment(quote);
    if (!plan) {
      db.prepare("UPDATE quotes SET risk_status = 'FEASIBLE', risk_reason = NULL WHERE id = ?").run(quote.id);
      return { ok: true, commitment: toCommitment(getQuoteRow(quote.id)!) };
    }
    const options = plan.replacement ? [plan.replacement, ...plan.otherEligible] : [];
    const chosen = input.replacementStaffId == null ? options[0] : options.find((m) => m.id === input.replacementStaffId);
    if (!chosen) {
      const rejectedPick = plan.rejected.find((r) => r.staffName === staffName(input.replacementStaffId));
      const why = rejectedPick ? `${rejectedPick.staffName}: ${rejectedPick.reason}` : plan.summary;
      logActivity("recovery_blocked", `Recovery for #${quote.reference} was blocked at final check. ${why}`, `${manager.name} (Manager)`, "warning");
      return { ok: false, status: 409, error: `The replacement is no longer available. ${why}` };
    }

    const managerLabel = `${manager.name} (Manager)`;
    MockOrbyteWorkAdapter.reassign(quote.id, plan.unavailableStaffId, chosen.id);
    // Keep the crew order; swap only the person who dropped out.
    const oldLabels = quote.crew ? (JSON.parse(quote.crew) as string[]) : [];
    const crewLabels = oldLabels.map((l) => (l.replace(/ \(senior\)$/, "") === plan.unavailableStaffName ? crewLabel(chosen) : l));
    db.prepare("UPDATE quotes SET crew = ? WHERE id = ?").run(JSON.stringify(crewLabels), quote.id);

    // Re-assess after the swap; only mark FEASIBLE if nobody else on the crew is unavailable.
    const after = assessCommitment(getQuoteRow(quote.id)!);
    if (after) db.prepare("UPDATE quotes SET risk_reason = ? WHERE id = ?").run(after.riskReason, quote.id);
    else db.prepare("UPDATE quotes SET risk_status = 'FEASIBLE', risk_reason = NULL WHERE id = ?").run(quote.id);

    logActivity(
      "recovery_approved",
      `${managerLabel} approved recovery for #${quote.reference} on ${formatLongDate(quote.appointment_date!)}: ` +
        `${plan.unavailableStaffName} -> ${chosen.name}. Crew now: ${crewLabels.join(", ")}. ` +
        `Simulated Orbyte Work assignment updated. ${plan.unavailableStaffName}'s leave (eLeave #${plan.leaveReference}) is unchanged. ` +
        (after ? "Still at risk." : "Commitment is FEASIBLE again."),
      managerLabel,
      "success",
    );
    chargeTransaction(`approving the recovery swap on ${quote.reference}`);
    return { ok: true, commitment: toCommitment(getQuoteRow(quote.id)!) };
  });
}

function staffName(id: number | null | undefined): string | undefined {
  if (id == null) return undefined;
  return MockOrbytePeopleAdapter.findById(id)?.name;
}
