// One-call enquiry workflow: parse -> price -> check availability -> suggest alternatives -> log.
import { logActivity } from "./db";
import { formatLongDate } from "./dates";
import { parseEnquiry, type ParsedEnquiry } from "./parser";
import { formatRm } from "./quotes";
import { checkSchedule, findAlternatives, ALTERNATIVE_SEARCH_DAYS, type ScheduleCheck } from "./scheduling";
import { calculateTotalSen, findService, senToRm } from "./services";
import { hasUnpricedScope } from "./request-scope";

const SALESPERSON = "Salesperson (demo)";

export type EnquiryStatus = "needs_clarification" | "feasible" | "conflict" | "needs_verification";

export interface PricingLine {
  serviceCode: string;
  serviceName: string;
  quantity: number;
  unitPrice: number;
  lineTotal: number;
}

export interface Pricing {
  lines: PricingLine[];
  serviceCode: string;
  serviceName: string;
  quantity: number;
  unitPrice: number;
  totalPrice: number;
  totalFormatted: string;
}

export interface EnquiryResult {
  status: EnquiryStatus;
  summary: string;
  analysis: ParsedEnquiry;
  pricing?: Pricing;
  requestedSchedule?: ScheduleCheck;
  recommendedDate?: string;
  alternatives: ScheduleCheck[];
}

/** "2 x RM160.00 + 3 x RM80.00" */
function calculationText(lines: Array<{ quantity: number; service: { unitPriceSen: number } }>): string {
  return lines.map((l) => `${l.quantity} x ${formatRm(l.service.unitPriceSen)}`).join(" + ");
}

/** Write the "enquiry analysed" activity entry (shared by /enquiries/analyse and /enquiry). */
export function logEnquiryAnalysed(result: ParsedEnquiry): void {
  const summary = [
    result.items.length
      ? result.items.map((i) => `${i.quantity ?? "?"} x ${i.serviceCode ?? `${i.serviceKind} (${i.specification ?? "size?"})`}`).join(" + ")
      : "service unknown",
    result.requestedDate ?? "date unknown",
    result.location ?? "location unknown",
  ].join(", ");
  logActivity(
    "enquiry_analysed",
    result.missing.length === 0
      ? `Enquiry analysed: ${summary}.`
      : `Enquiry analysed with missing details (${result.missing.join("; ")}): ${summary}.`,
    SALESPERSON,
    result.missing.length === 0 ? "info" : "warning",
  );
}

export function processEnquiry(message: string): EnquiryResult {
  const analysis = parseEnquiry(message);
  logEnquiryAnalysed(analysis);

  // Price: server-side, from the price list only. Only when every line can be priced
  // (no confident quotation while something is still missing).
  let pricing: Pricing | undefined;
  const lines = analysis.items.flatMap((item) => {
    const service = item.serviceCode ? findService(item.serviceCode) : undefined;
    return service && item.quantity !== null ? [{ service, quantity: item.quantity }] : [];
  });
  if (!hasUnpricedScope(analysis.missing) && analysis.items.length > 0 && lines.length === analysis.items.length) {
    const totalSen = lines.reduce((sum, l) => sum + calculateTotalSen(l.quantity, l.service.unitPriceSen), 0);
    const primary = lines.find((l) => l.service.code === analysis.serviceCode) ?? lines[0]!;
    pricing = {
      lines: lines.map((l) => ({
        serviceCode: l.service.code,
        serviceName: l.service.name,
        quantity: l.quantity,
        unitPrice: senToRm(l.service.unitPriceSen),
        lineTotal: senToRm(calculateTotalSen(l.quantity, l.service.unitPriceSen)),
      })),
      serviceCode: primary.service.code,
      serviceName: primary.service.name,
      quantity: primary.quantity,
      unitPrice: senToRm(primary.service.unitPriceSen),
      totalPrice: senToRm(totalSen),
      totalFormatted: formatRm(totalSen),
    };
    logActivity(
      "price_calculated",
      `Price calculated: ${calculationText(lines)} = ${formatRm(totalSen)} (${lines.map((l) => l.service.name).join(" + ")}).`,
      "System",
      "info",
    );
  }

  // Availability: needs both a service (for the crew rule) and a date.
  let requestedSchedule: ScheduleCheck | undefined;
  let alternatives: ScheduleCheck[] = [];
  if (!hasUnpricedScope(analysis.missing) && analysis.serviceCode && analysis.requestedDate) {
    requestedSchedule = checkSchedule(analysis.requestedDate, analysis.serviceCode);
    if (requestedSchedule.verdict === "not_feasible") {
      logActivity("scheduling_conflict_detected", requestedSchedule.explanation, "System", "warning");
      alternatives = findAlternatives(analysis.requestedDate, analysis.serviceCode);
      const first = alternatives[0];
      if (first) {
        logActivity(
          "alternative_suggested",
          `Alternative suggested for ${formatLongDate(analysis.requestedDate)}: ${first.explanation}`,
          "System",
          "info",
        );
      }
    } else if (requestedSchedule.verdict === "feasible") {
      logActivity("availability_checked", requestedSchedule.explanation, "System", "success");
    } else {
      logActivity("availability_unverified", requestedSchedule.explanation, "System", "warning");
    }
  }

  const recommended = alternatives[0];
  const status: EnquiryStatus =
    analysis.missing.length > 0
      ? "needs_clarification"
      : requestedSchedule?.verdict === "feasible"
        ? "feasible"
        : requestedSchedule?.verdict === "not_feasible"
          ? "conflict"
          : "needs_verification";

  const parts: string[] = [];
  if (pricing) {
    parts.push(
      `Quotation total: ${pricing.totalFormatted} (${pricing.lines.map((l) => `${l.quantity} x ${formatRm(Math.round(l.unitPrice * 100))}`).join(" + ")}).`,
    );
  }
  if (analysis.missing.length > 0 && analysis.clarification) parts.push(analysis.clarification);
  if (requestedSchedule) parts.push(requestedSchedule.explanation);
  if (requestedSchedule?.verdict === "not_feasible") {
    parts.push(
      recommended
        ? `Suggested alternative: ${recommended.explanation}`
        : `No feasible date was found in the next ${ALTERNATIVE_SEARCH_DAYS} days.`,
    );
  }

  return {
    status,
    summary: parts.join(" "),
    analysis,
    ...(pricing ? { pricing } : {}),
    ...(requestedSchedule ? { requestedSchedule } : {}),
    ...(recommended ? { recommendedDate: recommended.date } : {}),
    alternatives,
  };
}
