// Manager approval: re-check the chosen date against the latest records, then save an approved quotation.
import { logActivity } from "./db";
import { formatLongDate, isValidDateString } from "./dates";
import { insertQuote, type QuoteRow } from "./quotes";
import { checkSchedule } from "./scheduling";
import { findService } from "./services";

export const MANAGER = "Faizal (Manager)";

export interface ApprovalRequest {
  customerName: string;
  location: string;
  serviceCode: string;
  quantity: number;
  requestedDate: string;
  appointmentDate: string;
  message?: string | null;
}

export type ApprovalOutcome =
  | { ok: true; quote: QuoteRow }
  | { ok: false; status: 400 | 409; error: string };

export function approveQuotation(req: ApprovalRequest): ApprovalOutcome {
  const service = findService(req.serviceCode);
  if (!service) {
    return { ok: false, status: 400, error: `Unknown service "${req.serviceCode}". Choose a service from the price list.` };
  }
  if (!isValidDateString(req.requestedDate) || !isValidDateString(req.appointmentDate)) {
    return { ok: false, status: 400, error: "The requested or appointment date is not a valid calendar date." };
  }

  // Validate the selected date again, from the database, at the moment of approval.
  const check = checkSchedule(req.appointmentDate, service.code);
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
      requestedDate: req.requestedDate,
      message: req.message ?? null,
      approval: {
        appointmentDate: req.appointmentDate,
        approvedBy: MANAGER,
        crew: check.crew.map((m) => (m.isSenior ? `${m.name} (senior)` : m.name)),
      },
    },
    MANAGER,
  );
  return { ok: true, quote };
}
