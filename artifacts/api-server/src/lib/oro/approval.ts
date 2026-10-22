// Manager approval: re-check the chosen date against the latest records, then save an approved quotation.
import { inTransaction, logActivity } from "./db";
import { MockOrbyteApprovalAdapter } from "./orbyte-adapters";
import { formatLongDate, isValidDateString } from "./dates";
import { insertQuote, type QuoteRow } from "./quotes";
import { checkSchedule } from "./scheduling";
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
  | { ok: false; status: 400 | 403 | 409; error: string };

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
  const ruleCode =
    [service, ...extraLines.map((l) => l.service)].find((s) => s.code.startsWith("install_"))?.code ?? service.code;
  const check = checkSchedule(req.appointmentDate, ruleCode);
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
