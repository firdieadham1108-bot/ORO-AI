// Fixed, transparent SAMPLE DATA shared by the Current* baselines and the Pilot* mockups.
// Shapes mirror lib/api-client-react/src/generated/api.schemas.ts (copied, not imported: the sandbox
// has no API client and makes no network calls). Names, prices and dates follow the real demo seed:
// CoolAir Services Sdn Bhd (Cheras), staff Ali / Bala / Mei / Chong (+ manager Faizal), price list
// install 1.0HP RM160, 1.5HP RM190, standard service RM80, chemical wash RM150, reference date
// Wed 21 Oct 2026. Nothing here is a real booking.

export const COMPANY = "CoolAir Services Sdn Bhd";
export const REFERENCE_DATE = "2026-10-21";
export const REFERENCE_DATE_LABEL = "Wednesday, 21 October 2026";

// ---------- API-shaped types ----------
export type ServiceKind = "install" | "standard_service" | "chemical_wash";
export interface ParsedItem { serviceCode: string | null; serviceKind: ServiceKind; quantity: number | null; specification: string | null; issue: string | null }
export interface EnquiryAnalysis {
  serviceCode: string | null; quantity: number | null; specification: string | null; items: ParsedItem[];
  requestedDate: string | null; location: string | null; referenceDate: string; missing: string[]; clarification: string | null;
}
export interface PricingLine { serviceCode: string; serviceName: string; quantity: number; unitPrice: number; lineTotal: number }
export interface Pricing { lines: PricingLine[]; serviceCode: string; serviceName: string; quantity: number; unitPrice: number; totalPrice: number; totalFormatted: string }
export interface CrewMember { id: number; name: string; role: string; isSenior: boolean }
export interface CapacityConflict { staffId: number; staffName: string; kind: "leave" | "assignment"; title: string; reference: string; startAt: string; endAt: string; description: string }
export type Verdict = "feasible" | "not_feasible" | "needs_verification";
export interface ScheduleCheck {
  date: string; weekday: string; verdict: Verdict; workingDay: boolean; windowStart: string; windowEnd: string;
  requirement: { crewSize: number; minSeniors: number; windowHours: number };
  availableInstallers: number; availableSeniorInstallers: number; crew: CrewMember[]; conflicts: CapacityConflict[]; reasons: string[]; explanation: string;
}
export type EnquiryStatus = "needs_clarification" | "feasible" | "conflict" | "needs_verification";
export interface EnquiryResult { status: EnquiryStatus; summary: string; analysis: EnquiryAnalysis; pricing?: Pricing; requestedSchedule?: ScheduleCheck; recommendedDate?: string; alternatives: ScheduleCheck[] }
export type QuoteStatus = "pending" | "approved" | "rejected";
export type RiskStatus = "FEASIBLE" | "AT_RISK" | null;
export interface Quote {
  id: number; reference: string; companyName: string; customerName: string; location: string; serviceCode: string; serviceName: string;
  quantity: number; unitPrice: number; totalPrice: number; requestedDate: string; appointmentDate: string | null; status: QuoteStatus;
  approvedBy: string | null; approvedAt: string | null; rejectionReason: string | null; createdBy: string | null; message: string | null;
  crew: string[]; lineItems: PricingLine[]; riskStatus: RiskStatus; riskReason: string | null; createdAt: string;
}
export interface RecoveryPlan {
  status: "replacement_found" | "no_replacement"; leaveReference: string; summary: string;
  replacement: CrewMember | null; otherEligible: CrewMember[]; rejected: Array<{ staffName: string; reason: string }>;
}
export interface Commitment { quote: Quote; recovery: RecoveryPlan | null }
export interface ActivityEntry { id: number; action: string; description: string; actor: string; severity: "info" | "success" | "warning"; createdAt: string }
export interface AttentionItem { kind: "at_risk" | "pending_approval" | "crew_short"; severity: "danger" | "warning" | "info"; title: string; detail: string; quoteId: number | null; reference: string | null }
export interface UpcomingAppointment { quoteId: number; reference: string; customerName: string; location: string; appointmentDate: string; weekday: string; serviceSummary: string; totalPrice: number; crew: string[]; riskStatus: RiskStatus }
export interface DashboardSummary {
  referenceDate: string; referenceDateLabel: string;
  counts: { enquiries: number; pendingQuotations: number; approvedQuotations: number; rejectedQuotations: number; upcomingAppointments: number; schedulingConflicts: number; conflictsDetected: number; atRiskCommitments: number };
  needsAttention: AttentionItem[]; upcoming: UpcomingAppointment[];
  crewToday: { date: string; weekday: string; technicians: number; available: number; onLeave: number; assigned: number };
}

// ---------- Price list ----------
export const SERVICES = {
  install_1_0hp: { name: "Air-conditioning installation (1.0HP)", spec: "1.0HP", price: 160 },
  install_1_5hp: { name: "Air-conditioning installation (1.5HP)", spec: "1.5HP", price: 190 },
  standard_service: { name: "Standard air-conditioning service", spec: null, price: 80 },
  chemical_wash: { name: "Chemical wash", spec: null, price: 150 },
} as const;
export type ServiceCode = keyof typeof SERVICES;

const line = (code: ServiceCode, qty: number): PricingLine => ({ serviceCode: code, serviceName: SERVICES[code].name, quantity: qty, unitPrice: SERVICES[code].price, lineTotal: SERVICES[code].price * qty });
export const fmtRm = (n: number) => "RM " + n.toLocaleString("en-MY", { minimumFractionDigits: 2, maximumFractionDigits: 2 });
export function pricing(items: Array<[ServiceCode, number]>): Pricing {
  const lines = items.map(([c, q]) => line(c, q));
  const total = lines.reduce((s, l) => s + l.lineTotal, 0);
  const p = lines[0]!;
  return { lines, serviceCode: p.serviceCode, serviceName: p.serviceName, quantity: p.quantity, unitPrice: p.unitPrice, totalPrice: total, totalFormatted: fmtRm(total) };
}

// ---------- Staff ----------
export const STAFF: Record<string, CrewMember> = {
  ali: { id: 1, name: "Ali", role: "Senior Installation Technician", isSenior: true },
  bala: { id: 2, name: "Bala", role: "Senior Installation Technician", isSenior: true },
  mei: { id: 3, name: "Mei", role: "Installation Technician", isSenior: false },
  chong: { id: 4, name: "Chong", role: "Senior Installation Technician", isSenior: true },
};

// ---------- Schedule checks used by the scenarios ----------
const INSTALL_REQ = { crewSize: 2, minSeniors: 1, windowHours: 8 };
export const FRIDAY_CONFLICT: ScheduleCheck = {
  date: "2026-10-23", weekday: "Friday", verdict: "not_feasible", workingDay: true, windowStart: "09:00", windowEnd: "17:00", requirement: INSTALL_REQ,
  availableInstallers: 0, availableSeniorInstallers: 0, crew: [],
  conflicts: [
    { staffId: 1, staffName: "Ali", kind: "leave", title: "Approved annual leave", reference: "SIM-ELEAVE-0142", startAt: "2026-10-23T00:00:00+08:00", endAt: "2026-10-24T00:00:00+08:00", description: "Ali is on approved annual leave (SIM-ELEAVE-0142)." },
    { staffId: 2, staffName: "Bala", kind: "assignment", title: "Taman Desa installation", reference: "SIM-WORK-TD-2310", startAt: "2026-10-23T09:00:00+08:00", endAt: "2026-10-23T17:00:00+08:00", description: "Bala is assigned to Taman Desa installation, 9:00 am to 5:00 pm (SIM-WORK-TD-2310)." },
    { staffId: 3, staffName: "Mei", kind: "assignment", title: "Bukit Jalil servicing visit", reference: "SIM-WORK-BJ-2311", startAt: "2026-10-23T09:00:00+08:00", endAt: "2026-10-23T17:00:00+08:00", description: "Mei is assigned to Bukit Jalil servicing visit, 9:00 am to 5:00 pm (SIM-WORK-BJ-2311)." },
    { staffId: 4, staffName: "Chong", kind: "assignment", title: "Ampang installation", reference: "SIM-WORK-AM-2312", startAt: "2026-10-23T09:00:00+08:00", endAt: "2026-10-23T17:00:00+08:00", description: "Chong is assigned to Ampang installation, 9:00 am to 5:00 pm (SIM-WORK-AM-2312)." },
  ],
  reasons: ["Installation needs 2 technicians including 1 senior for a full-day window; 0 of 4 technicians are free."],
  explanation: "Fri 23 Oct 2026 is not feasible. All four technicians are committed: Ali is on approved leave and Bala, Mei and Chong are on existing jobs for the whole 9:00 am to 5:00 pm window.",
};
export const MONDAY_ALT_FOR_FRIDAY: ScheduleCheck = {
  date: "2026-10-26", weekday: "Monday", verdict: "feasible", workingDay: true, windowStart: "09:00", windowEnd: "17:00", requirement: INSTALL_REQ,
  availableInstallers: 4, availableSeniorInstallers: 3, crew: [STAFF.bala!, STAFF.mei!], conflicts: [],
  reasons: ["Next working day with a free qualified crew."],
  explanation: "Mon 26 Oct 2026 is feasible. Bala (senior) and Mei are free for the full window. Picked in the manager's dispatch order.",
};
export const MONDAY_FOR_CONNAUGHT: ScheduleCheck = { ...MONDAY_ALT_FOR_FRIDAY, reasons: ["Requested date is a working day and a qualified crew is free."], explanation: "Mon 26 Oct 2026 is feasible. Bala (senior) and Mei are free for the full 9:00 am to 5:00 pm window." };

// ---------- Enquiry scenarios (same four messages as the live New Enquiry page) ----------
export interface Scenario { id: string; label: string; customer: string; message: string; language: string; result: EnquiryResult }
export const SCENARIOS: Scenario[] = [
  {
    id: "friday", label: "Scenario 1: Flagship Friday Conflict (EN)", language: "English", customer: "Cheras Office (demo customer)",
    message: "Boss, can you install 6 units of 1.5HP aircon at our Cheras office this Friday? Send quote please.",
    result: {
      status: "conflict",
      summary: "6 x Air-conditioning installation (1.5HP) at Cheras office, requested Fri 23 Oct 2026. Quotation total: RM 1,140.00 (6 x RM190.00). Friday is not feasible; the next feasible date is Mon 26 Oct 2026.",
      analysis: { serviceCode: "install_1_5hp", quantity: 6, specification: "1.5HP", items: [{ serviceCode: "install_1_5hp", serviceKind: "install", quantity: 6, specification: "1.5HP", issue: null }], requestedDate: "2026-10-23", location: "Cheras office", referenceDate: REFERENCE_DATE, missing: [], clarification: null },
      pricing: pricing([["install_1_5hp", 6]]),
      requestedSchedule: FRIDAY_CONFLICT, recommendedDate: "2026-10-26", alternatives: [MONDAY_ALT_FOR_FRIDAY],
    },
  },
  {
    id: "connaught", label: "Scenario 2: Bahasa Melayu Multi-Service", language: "Bahasa Melayu", customer: "Taman Connaught Shop (demo customer)",
    message: "Salam boss, nak pasang 2 biji aircond 1.0hp dan servis biasa 3 biji dekat Taman Connaught Isnin 26 Oct boleh?",
    result: {
      status: "feasible",
      summary: "2 x Air-conditioning installation (1.0HP) + 3 x Standard air-conditioning service at Taman Connaught, requested Mon 26 Oct 2026. Quotation total: RM 560.00 (2 x RM160.00 + 3 x RM80.00). Monday is feasible.",
      analysis: { serviceCode: "install_1_0hp", quantity: 2, specification: "1.0HP", items: [{ serviceCode: "install_1_0hp", serviceKind: "install", quantity: 2, specification: "1.0HP", issue: null }, { serviceCode: "standard_service", serviceKind: "standard_service", quantity: 3, specification: null, issue: null }], requestedDate: "2026-10-26", location: "Taman Connaught", referenceDate: REFERENCE_DATE, missing: [], clarification: null },
      pricing: pricing([["install_1_0hp", 2], ["standard_service", 3]]),
      requestedSchedule: MONDAY_FOR_CONNAUGHT, recommendedDate: "2026-10-26", alternatives: [],
    },
  },
  {
    id: "chinese", label: "Scenario 3: Chinese Enquiry", language: "Chinese", customer: "Cheras Shop (demo customer)",
    message: "老板，10月26号星期一我们在蕉赖的店要装一台2.0hp冷气，另外一台旧的要做chemical wash，多少钱？",
    result: {
      status: "needs_clarification",
      summary: "1 x installation (2.0HP) + 1 x Chemical wash at Cheras shop, requested Mon 26 Oct 2026. 2.0HP is not on the CoolAir price list, so no total can be confirmed yet.",
      analysis: { serviceCode: null, quantity: 1, specification: "2.0HP", items: [{ serviceCode: null, serviceKind: "install", quantity: 1, specification: "2.0HP", issue: "2.0HP installation is not on the price list (only 1.0HP and 1.5HP)" }, { serviceCode: "chemical_wash", serviceKind: "chemical_wash", quantity: 1, specification: null, issue: null }], requestedDate: "2026-10-26", location: "Cheras shop", referenceDate: REFERENCE_DATE, missing: ["2.0HP installation is not on the price list (only 1.0HP and 1.5HP)"], clarification: "Ask the customer whether the unit is 1.0HP or 1.5HP, or confirm with the manager whether CoolAir will quote a 2.0HP installation." },
      alternatives: [],
    },
  },
  {
    id: "apartment", label: "Scenario 4: Missing Info Edge Case", language: "English", customer: "Cheras Apartment (demo customer)",
    message: "Hi CoolAir, can quote me price to install 4 aircons at my apartment in Cheras next Wednesday?",
    result: {
      status: "needs_clarification",
      summary: "4 x installation (size not given) at Cheras apartment, requested Wed 28 Oct 2026. The horsepower decides the unit price, so no total can be confirmed yet.",
      analysis: { serviceCode: null, quantity: 4, specification: null, items: [{ serviceCode: null, serviceKind: "install", quantity: 4, specification: null, issue: "horsepower (1.0HP or 1.5HP)" }], requestedDate: "2026-10-28", location: "Cheras apartment", referenceDate: REFERENCE_DATE, missing: ["horsepower (1.0HP or 1.5HP)"], clarification: "Ask the customer for the horsepower of the four units (1.0HP is RM160 each, 1.5HP is RM190 each)." },
      alternatives: [],
    },
  },
];

// ---------- Saved quotations ----------
export const QUOTE_MONDAY: Quote = {
  id: 1, reference: "ORO-1023", companyName: COMPANY, customerName: "Taman Connaught Shop (demo customer)", location: "Taman Connaught",
  serviceCode: "install_1_0hp", serviceName: SERVICES.install_1_0hp.name, quantity: 2, unitPrice: 160, totalPrice: 560,
  requestedDate: "2026-10-26", appointmentDate: "2026-10-26", status: "approved", approvedBy: "Faizal", approvedAt: "2026-10-21T10:12:00+08:00",
  rejectionReason: null, createdBy: "Mei", message: SCENARIOS[1]!.message, crew: ["Bala", "Mei"],
  lineItems: pricing([["install_1_0hp", 2], ["standard_service", 3]]).lines, riskStatus: "FEASIBLE", riskReason: null, createdAt: "2026-10-21T10:12:00+08:00",
};
export const QUOTE_PENDING: Quote = {
  id: 2, reference: "ORO-1024", companyName: COMPANY, customerName: "Cheras Condo (demo customer)", location: "Cheras condo",
  serviceCode: "install_1_5hp", serviceName: SERVICES.install_1_5hp.name, quantity: 3, unitPrice: 190, totalPrice: 570,
  requestedDate: "2026-10-29", appointmentDate: null, status: "pending", approvedBy: null, approvedAt: null, rejectionReason: null, createdBy: "Mei",
  message: "Hi, contractor here. Need 3 units 1.5HP installed at a Cheras condo next Thursday, can quote?", crew: [],
  lineItems: pricing([["install_1_5hp", 3]]).lines, riskStatus: null, riskReason: null, createdAt: "2026-10-21T11:05:00+08:00",
};
export const QUOTE_TUESDAY: Quote = {
  id: 3, reference: "ORO-1025", companyName: COMPANY, customerName: "Cheras Apartment (demo customer)", location: "Cheras apartment",
  serviceCode: "install_1_0hp", serviceName: SERVICES.install_1_0hp.name, quantity: 4, unitPrice: 160, totalPrice: 640,
  requestedDate: "2026-10-27", appointmentDate: "2026-10-27", status: "approved", approvedBy: "Faizal", approvedAt: "2026-10-21T11:40:00+08:00",
  rejectionReason: null, createdBy: "Mei", message: "4 x 1.0HP at my apartment in Cheras, Tuesday 27 Oct ok?", crew: ["Bala", "Mei"],
  lineItems: pricing([["install_1_0hp", 4]]).lines, riskStatus: "FEASIBLE", riskReason: null, createdAt: "2026-10-21T11:40:00+08:00",
};

/** The Monday job after the simulated Orbyte eLeave event for Bala. */
export const QUOTE_MONDAY_AT_RISK: Quote = {
  ...QUOTE_MONDAY, riskStatus: "AT_RISK",
  riskReason: "Bala's emergency leave for Mon 26 Oct 2026 was approved in Orbyte eLeave (SIM-ELEAVE-0199). The crew is now 1 technician short and has no senior installer.",
};
export const RECOVERY_PLAN: RecoveryPlan = {
  status: "replacement_found", leaveReference: "SIM-ELEAVE-0199",
  summary: "Replace Bala with Chong (senior) on Mon 26 Oct 2026. Chong is free for the full window and keeps the crew at 2 with 1 senior.",
  replacement: STAFF.chong!, otherEligible: [STAFF.ali!], rejected: [{ staffName: "Mei", reason: "already on this job" }],
};
export const QUOTE_MONDAY_RECOVERED: Quote = {
  ...QUOTE_MONDAY, crew: ["Chong", "Mei"], riskStatus: "FEASIBLE", riskReason: null,
};

// ---------- Activity log (newest first) ----------
export const ACTIVITY: ActivityEntry[] = [
  { id: 6, action: "quote_approved", description: "Quotation ORO-1025 approved for Cheras Apartment (demo customer), Tue 27 Oct 2026. Crew: Bala, Mei. Simulated Orbyte Work record created.", actor: "Faizal", severity: "success", createdAt: "2026-10-21T11:40:00+08:00" },
  { id: 5, action: "draft_created", description: "Draft ORO-1024 sent for manager approval: Cheras Condo, 3 x 1.5HP installation, requested Thu 29 Oct 2026.", actor: "Mei", severity: "info", createdAt: "2026-10-21T11:05:00+08:00" },
  { id: 4, action: "conflict_detected", description: "Enquiry for 6 x 1.5HP installation on Fri 23 Oct 2026: no qualified crew free (Ali on leave; Bala, Mei, Chong on jobs). Alternative Mon 26 Oct offered.", actor: "Mei", severity: "warning", createdAt: "2026-10-21T10:48:00+08:00" },
  { id: 3, action: "quote_approved", description: "Quotation ORO-1023 approved for Taman Connaught Shop (demo customer), Mon 26 Oct 2026. Crew: Bala, Mei.", actor: "Faizal", severity: "success", createdAt: "2026-10-21T10:12:00+08:00" },
  { id: 2, action: "enquiry_analysed", description: "Bahasa Melayu enquiry analysed: 2 x 1.0HP installation + 3 x standard service, Taman Connaught, Mon 26 Oct 2026. Total RM 560.00.", actor: "Mei", severity: "info", createdAt: "2026-10-21T10:02:00+08:00" },
  { id: 1, action: "demo_seeded", description: "Synthetic CoolAir Services staff, leave and job records loaded (simulated Orbyte data).", actor: "System", severity: "info", createdAt: "2026-10-21T09:30:00+08:00" },
];
export const ACTIVITY_LEAVE_EVENT: ActivityEntry = { id: 7, action: "commitment_at_risk", description: "Simulated Orbyte eLeave event: Bala's emergency leave approved for Mon 26 Oct 2026 (SIM-ELEAVE-0199). Quote ORO-1023 is AT RISK: crew 1 short, no senior.", actor: "Orbyte eLeave (simulated)", severity: "warning", createdAt: "2026-10-21T14:02:00+08:00" };
export const ACTIVITY_RECOVERED: ActivityEntry = { id: 8, action: "recovery_approved", description: "Recovery approved for ORO-1023: Chong replaces Bala on Mon 26 Oct 2026. Simulated Orbyte Work record updated.", actor: "Faizal", severity: "success", createdAt: "2026-10-21T14:05:00+08:00" };

// ---------- Dashboard summaries ----------
const upcomingOf = (q: Quote): UpcomingAppointment => ({
  quoteId: q.id, reference: q.reference, customerName: q.customerName, location: q.location, appointmentDate: q.appointmentDate!,
  weekday: q.appointmentDate === "2026-10-26" ? "Monday" : "Tuesday",
  serviceSummary: q.lineItems.map((l) => `${l.quantity} x ${l.serviceName.replace("Air-conditioning ", "").replace(" air-conditioning", "")}`).join(" + "),
  totalPrice: q.totalPrice, crew: q.crew, riskStatus: q.riskStatus,
});
const PENDING_ATTENTION: AttentionItem = { kind: "pending_approval", severity: "warning", title: "Draft from Mei waiting for approval", detail: "Cheras Condo (demo customer) · 3 x 1.5HP installation · requested Thu 29 Oct 2026 · RM 570.00", quoteId: 2, reference: "ORO-1024" };
const CREW_SHORT_ATTENTION: AttentionItem = { kind: "crew_short", severity: "info", title: "Fri 23 Oct: no qualified installer free", detail: "Ali on approved leave; Bala, Mei and Chong on existing jobs all day. New installation requests for Friday will be offered Mon 26 Oct.", quoteId: null, reference: null };
const AT_RISK_ATTENTION: AttentionItem = { kind: "at_risk", severity: "danger", title: "Promise at risk: Bala on emergency leave Mon 26 Oct", detail: "Taman Connaught Shop · crew now 1 short, no senior · recovery available (Chong)", quoteId: 1, reference: "ORO-1023" };

export const DASHBOARD_DEFAULT: DashboardSummary = {
  referenceDate: REFERENCE_DATE, referenceDateLabel: REFERENCE_DATE_LABEL,
  counts: { enquiries: 6, pendingQuotations: 1, approvedQuotations: 2, rejectedQuotations: 0, upcomingAppointments: 2, schedulingConflicts: 1, conflictsDetected: 1, atRiskCommitments: 0 },
  needsAttention: [PENDING_ATTENTION, CREW_SHORT_ATTENTION],
  upcoming: [upcomingOf(QUOTE_MONDAY), upcomingOf(QUOTE_TUESDAY)],
  crewToday: { date: REFERENCE_DATE, weekday: "Wednesday", technicians: 4, available: 4, onLeave: 0, assigned: 0 },
};
export const DASHBOARD_CONFLICT: DashboardSummary = {
  ...DASHBOARD_DEFAULT,
  counts: { ...DASHBOARD_DEFAULT.counts, atRiskCommitments: 1, schedulingConflicts: 2, conflictsDetected: 2 },
  needsAttention: [AT_RISK_ATTENTION, PENDING_ATTENTION, CREW_SHORT_ATTENTION],
  upcoming: [upcomingOf(QUOTE_MONDAY_AT_RISK), upcomingOf(QUOTE_TUESDAY)],
};
export const DASHBOARD_RECOVERED: DashboardSummary = {
  ...DASHBOARD_DEFAULT,
  counts: { ...DASHBOARD_DEFAULT.counts, conflictsDetected: 2 },
  upcoming: [upcomingOf(QUOTE_MONDAY_RECOVERED), upcomingOf(QUOTE_TUESDAY)],
};
export const DASHBOARD_EMPTY: DashboardSummary = {
  referenceDate: REFERENCE_DATE, referenceDateLabel: REFERENCE_DATE_LABEL,
  counts: { enquiries: 0, pendingQuotations: 0, approvedQuotations: 0, rejectedQuotations: 0, upcomingAppointments: 0, schedulingConflicts: 0, conflictsDetected: 0, atRiskCommitments: 0 },
  needsAttention: [], upcoming: [],
  crewToday: { date: REFERENCE_DATE, weekday: "Wednesday", technicians: 4, available: 4, onLeave: 0, assigned: 0 },
};

/** Reads ?state=... from the page URL (the hash router ignores the query string). */
export function stateParam(): string {
  if (typeof window === "undefined") return "";
  return new URLSearchParams(window.location.search).get("state") ?? "";
}
