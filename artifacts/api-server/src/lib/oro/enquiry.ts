// One-call enquiry workflow: parse -> price -> check availability -> suggest alternatives -> log.
import { logActivity } from "./db";
import { formatLongDate } from "./dates";
import { parseEnquiry, type ParsedEnquiry } from "./parser";
import { checkSchedule, findAlternatives, ALTERNATIVE_SEARCH_DAYS, type ScheduleCheck } from "./scheduling";
import { calculateTotalSen, findService, senToRm } from "./services";

const SALESPERSON = "Salesperson (demo)";

export type EnquiryStatus = "needs_information" | "feasible" | "conflict" | "needs_verification";

export interface Pricing {
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

export function formatRm(sen: number): string {
  return `RM${(sen / 100).toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
}

/** Write the "enquiry analysed" activity entry (shared by /enquiries/analyse and /enquiry). */
export function logEnquiryAnalysed(result: ParsedEnquiry): void {
  const summary = [
    result.serviceCode ?? "service unknown",
    result.quantity !== null ? `${result.quantity} unit(s)` : "quantity unknown",
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

  // Price: server-side, from the price list only.
  const service = analysis.serviceCode ? findService(analysis.serviceCode) : undefined;
  let pricing: Pricing | undefined;
  if (service && analysis.quantity !== null) {
    const totalSen = calculateTotalSen(analysis.quantity, service.unitPriceSen);
    pricing = {
      serviceCode: service.code,
      serviceName: service.name,
      quantity: analysis.quantity,
      unitPrice: senToRm(service.unitPriceSen),
      totalPrice: senToRm(totalSen),
      totalFormatted: formatRm(totalSen),
    };
    logActivity(
      "price_calculated",
      `Price calculated: ${analysis.quantity} x ${formatRm(service.unitPriceSen)} = ${formatRm(totalSen)} (${service.name}).`,
      "System",
      "info",
    );
  }

  // Availability: needs both a service (for the crew rule) and a date.
  let requestedSchedule: ScheduleCheck | undefined;
  let alternatives: ScheduleCheck[] = [];
  if (analysis.serviceCode && analysis.requestedDate) {
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
      ? "needs_information"
      : requestedSchedule?.verdict === "feasible"
        ? "feasible"
        : requestedSchedule?.verdict === "not_feasible"
          ? "conflict"
          : "needs_verification";

  const parts: string[] = [];
  if (pricing) {
    parts.push(
      `Quotation total: ${pricing.totalFormatted} (${pricing.quantity} x ${formatRm(Math.round(pricing.unitPrice * 100))}).`,
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
