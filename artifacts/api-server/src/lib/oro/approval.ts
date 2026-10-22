// Manager approval: re-check the chosen date against the latest records, then save an approved quotation.
import { db, inTransaction, logActivity } from "./db";
import { MockOrbyteApprovalAdapter } from "./orbyte-adapters";
import { formatLongDate, isValidDateString } from "./dates";
import { getQuoteRow, insertQuote, lineCodesOf, markDraftApproved, toQuote, type QuoteRow } from "./quotes";
import { checkSchedule, findAlternatives } from "./scheduling";
import { findService, type ServiceItem } from "./services";
import { chargeTransaction } from "./wallet";

export const MANAGER = "Faizal (Manager)";

export interface ApprovalRequest {
  customerName: string;
  location: string;
  serviceCode: string;
  quantity: number;
  requestedDate: string;
  appointmentDate: string;
  message?: string | null;
  /** Further services on the same visit. */
  extraItems?: Array<{ serviceCode: string; quantity: number }> | null;
  /** Demo role switch: who is clicking Approve. Must be the manager. Defaults to the manager. */
  approverName?: string | null;
}

export type ApprovalOutcome =
  | { ok: true; quote: QuoteRow }
  | { ok: false; status: 400 | 403 | 404 | 409; error: string };

export function approveQuotation(req: ApprovalRequest): ApprovalOutcome {
  const service = findService(req.serviceCode);
  if (!service) {
    return { ok: false, status: 400, error: `Unknown service "${req.serviceCode}". Choose a service from the price list.` };
  }
  if (req.approverName != null) {
    if (!MockOrbyteApprovalAdapter.canApprove(req.approverName)) {
      logActivity("approval_denied", `${req.approverName} tried to approve a quotation but does not have the manager role.`, req.approverName, "warning");
      return { ok: false, status: 403, error: "Requires Manager (Faizal) approval. Switch the demo role to Manager to approve." };
    }
  }
  const extraLines: Array<{ service: ServiceItem; quantity: number }> = [];
  for (const item of req.extraItems ?? []) {
    const extra = findService(item.serviceCode);
    if (!extra) return { ok: false, status: 400, error: `Unknown service "${item.serviceCode}". Choose a service from the price list.` };
    extraLines.push({ service: extra, quantity: item.quantity });
  }
  if (!isValidDateString(req.requestedDate) || !isValidDateString(req.appointmentDate)) {
    return { ok: false, status: 400, error: "The requested or appointment date is not a valid calendar date." };
  }

  // Validate the selected date again, from the database, at the moment of approval.
  // The check and the crew reservation run in one transaction, so two approvals cannot book the same people.
  return inTransaction(() => approveChecked(req, service, extraLines));
}

function approveChecked(
  req: ApprovalRequest,
  service: ServiceItem,
  extraLines: Array<{ service: ServiceItem; quantity: number }>,
): ApprovalOutcome {
  // The most demanding line (installation, if any) sets the crew rule for the visit.
  const check = checkSchedule(req.appointmentDate, ruleCodeFor([service, ...extraLines.map((l) => l.service)].map((s) => s.code)));
  if (check.verdict !== "feasible") {
    logActivity(
      "approval_blocked",
      `Approval for ${formatLongDate(req.appointmentDate)} was blocked. ${check.explanation}`,
      MANAGER,
      "warning",
    );
    return { ok: false, status: 409, error: `Cannot approve this date. ${check.explanation}` };
  }

  const quote = insertQuote(
    {
      customerName: req.customerName.trim(),
      location: req.location.trim(),
      service,
      quantity: req.quantity,
      extraLines,
      requestedDate: req.requestedDate,
      message: req.message ?? null,
      approval: {
        appointmentDate: req.appointmentDate,
        approvedBy: MANAGER,
        crew: check.crew,
      },
    },
    MANAGER,
  );
  chargeTransaction(`approving quotation ${quote.reference}`);
  return { ok: true, quote };
}

/** The crew rule for a visit comes from its most demanding line (an installation, if there is one). */
export function ruleCodeFor(codes: string[]): string {
  return codes.find((c) => c.startsWith("install_")) ?? codes[0] ?? "";
}

export type ScheduleOptionsOutcome =
  | { ok: true; options: { quote: ReturnType<typeof toQuote>; requested: ReturnType<typeof checkSchedule>; alternatives: ReturnType<typeof checkSchedule>[] } }
  | { ok: false; status: 404; error: string };

/** Manager Approval page: re-check a quotation's requested date now and list feasible alternatives. */
export function getQuoteScheduleOptions(quoteId: number): ScheduleOptionsOutcome {
  const row = getQuoteRow(quoteId);
  if (!row) return { ok: false, status: 404, error: "Quotation not found." };
  const rule = ruleCodeFor(lineCodesOf(row));
  const requested = checkSchedule(row.requested_date, rule);
  const alternatives = requested.verdict === "feasible" ? [] : findAlternatives(row.requested_date, rule);
  return { ok: true, options: { quote: toQuote(row), requested, alternatives } };
}

/**
 * Approve a draft that sales staff sent for approval. Same guarantees as approveQuotation:
 * the date is re-checked from the database and the crew reserved in the same transaction.
 */
export function approveDraft(quoteId: number, input: { appointmentDate: string; approverName?: string | null }): ApprovalOutcome {
  if (!isValidDateString(input.appointmentDate)) {
    return { ok: false, status: 400, error: "The appointment date is not a valid calendar date." };
  }
  if (input.approverName != null && !MockOrbyteApprovalAdapter.canApprove(input.approverName)) {
    logActivity("approval_denied", `${input.approverName} tried to approve a quotation but does not have the manager role.`, input.approverName, "warning");
    return { ok: false, status: 403, error: "Requires Manager (Faizal) approval. Switch the demo role to Manager to approve." };
  }
  return inTransaction((): ApprovalOutcome => {
    const row = getQuoteRow(quoteId);
    if (!row) return { ok: false, status: 404, error: "Quotation not found." };
    if (row.status !== "draft") {
      return { ok: false, status: 409, error: `Quotation ${row.reference} is already ${row.status}.` };
    }
    const check = checkSchedule(input.appointmentDate, ruleCodeFor(lineCodesOf(row)));
    if (check.verdict !== "feasible") {
      logActivity(
        "approval_blocked",
        `Approval of ${row.reference} for ${formatLongDate(input.appointmentDate)} was blocked. ${check.explanation}`,
        MANAGER,
        "warning",
      );
      return { ok: false, status: 409, error: `Cannot approve this date. ${check.explanation}` };
    }
    const quote = markDraftApproved(row, { appointmentDate: input.appointmentDate, approvedBy: MANAGER, crew: check.crew });
    chargeTransaction(`approving quotation ${quote.reference}`);
    return { ok: true, quote };
  });
}

/** Manager declines a draft. Nothing is reserved; the decision is written to the activity log. */
export function rejectDraft(quoteId: number, input: { reason?: string | null; managerName?: string | null }): ApprovalOutcome {
  if (input.managerName != null && !MockOrbyteApprovalAdapter.canApprove(input.managerName)) {
    return { ok: false, status: 403, error: "Requires Manager (Faizal) approval. Switch the demo role to Manager to decline a quotation." };
  }
  return inTransaction((): ApprovalOutcome => {
    const row = getQuoteRow(quoteId);
    if (!row) return { ok: false, status: 404, error: "Quotation not found." };
    if (row.status !== "draft") {
      return { ok: false, status: 409, error: `Quotation ${row.reference} is already ${row.status}.` };
    }
    const reason = input.reason?.trim() || "No reason given";
    db.prepare("UPDATE quotes SET status = 'rejected', rejection_reason = ? WHERE id = ?").run(reason, row.id);
    logActivity(
      "quotation_rejected",
      `${MANAGER} declined draft quotation ${row.reference} for ${row.customer_name} (${row.location}). Reason: ${reason}.`,
      MANAGER,
      "warning",
    );
    return { ok: true, quote: getQuoteRow(row.id)! };
  });
}
