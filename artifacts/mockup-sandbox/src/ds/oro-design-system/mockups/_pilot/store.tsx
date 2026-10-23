// PILOT state: one small local store shared by the redesigned Dashboard and New Enquiry pages so that
// actions on one page show up on the other (approve a quote -> it appears under upcoming jobs; simulate
// Bala's leave -> the Monday promise goes at risk). Everything is in memory, seeded from
// _shared/sample-data; a reset puts it back. No network, no persistence.
import { createContext, type ReactNode, useContext, useMemo, useReducer } from "react";
import {
  ACTIVITY, ACTIVITY_LEAVE_EVENT, ACTIVITY_RECOVERED, COMPANY, DASHBOARD_CONFLICT, DASHBOARD_DEFAULT, DASHBOARD_EMPTY, DASHBOARD_RECOVERED,
  QUOTE_MONDAY_AT_RISK, QUOTE_MONDAY_RECOVERED, RECOVERY_PLAN, stateParam,
  type ActivityEntry, type AttentionItem, type Commitment, type DashboardSummary, type EnquiryResult, type Quote, type ScheduleCheck, type UpcomingAppointment,
} from "../_shared/sample-data";

export type Page = "dashboard" | "enquiry";
export type RoleKey = "sales" | "manager";
export const ROLES: Record<RoleKey, { name: string; label: string; short: string }> = {
  sales: { name: "Mei", label: "Sales (Mei)", short: "Mei" },
  manager: { name: "Faizal", label: "Manager (Faizal)", short: "Faizal" },
};

export type NavKey = "dashboard" | "enquiry" | "quotations" | "schedule" | "approvals" | "risk" | "activity";
export const NAV: Array<{ key: NavKey; label: string; inPilot: boolean }> = [
  { key: "dashboard", label: "Dashboard", inPilot: true },
  { key: "enquiry", label: "New Enquiry", inPilot: true },
  { key: "quotations", label: "Quotations", inPilot: false },
  { key: "schedule", label: "Staff Schedule", inPilot: false },
  { key: "approvals", label: "Manager Approval", inPilot: false },
  { key: "risk", label: "Risk Monitor", inPilot: false },
  { key: "activity", label: "Activity Log", inPilot: false },
];

interface State {
  page: Page;
  role: RoleKey;
  /** ?state=empty on the dashboard: fresh demo with nothing recorded yet. */
  empty: boolean;
  loading: boolean;
  error: boolean;
  leaveFired: boolean;
  recovered: boolean;
  drafts: Quote[];
  approved: Quote[];
  activity: ActivityEntry[];
  nextId: number;
  /** Nav item outside the pilot that was clicked (explained instead of navigating). */
  notInPilot: NavKey | null;
}

type Action =
  | { type: "navigate"; page: Page }
  | { type: "explain"; key: NavKey | null }
  | { type: "role"; role: RoleKey }
  | { type: "fireLeave" }
  | { type: "approveRecovery" }
  | { type: "sendDraft"; quote: Quote }
  | { type: "approveQuote"; quote: Quote }
  | { type: "retry" }
  | { type: "reset" };

function initial(page: Page): State {
  const s = stateParam();
  const dashboardStates = page === "dashboard";
  return {
    page, role: "manager",
    empty: dashboardStates && s === "empty",
    loading: dashboardStates && s === "loading",
    error: dashboardStates && s === "error",
    leaveFired: s === "conflict" && dashboardStates,
    recovered: false,
    drafts: [], approved: [],
    activity: s === "conflict" && dashboardStates ? [ACTIVITY_LEAVE_EVENT, ...ACTIVITY] : s === "empty" && dashboardStates ? [ACTIVITY[ACTIVITY.length - 1]!] : ACTIVITY,
    nextId: 4,
    notInPilot: null,
  };
}

const now = () => new Date().toISOString();
const entry = (action: string, description: string, actor: string, severity: ActivityEntry["severity"]): ActivityEntry => ({ id: Date.now() + Math.floor(Math.random() * 1000), action, description, actor, severity, createdAt: now() });

function reducer(s: State, a: Action): State {
  switch (a.type) {
    case "navigate": return { ...s, page: a.page, notInPilot: null, loading: false, error: false };
    case "explain": return { ...s, notInPilot: a.key };
    case "role": return { ...s, role: a.role };
    case "fireLeave":
      if (s.leaveFired) return s;
      return { ...s, leaveFired: true, recovered: false, empty: false, activity: [ACTIVITY_LEAVE_EVENT, ...s.activity] };
    case "approveRecovery":
      if (!s.leaveFired || s.recovered) return s;
      return { ...s, recovered: true, activity: [ACTIVITY_RECOVERED, ...s.activity] };
    case "sendDraft":
      return { ...s, drafts: [a.quote, ...s.drafts], nextId: s.nextId + 1, activity: [entry("draft_created", `Draft ${a.quote.reference} sent to Faizal for approval: ${a.quote.customerName}, ${a.quote.lineItems.map((l) => `${l.quantity} x ${l.serviceName}`).join(" + ")}. (Simulated.)`, ROLES[s.role].name, "info"), ...s.activity] };
    case "approveQuote":
      return { ...s, approved: [a.quote, ...s.approved], nextId: s.nextId + 1, activity: [entry("quote_approved", `Quotation ${a.quote.reference} approved for ${a.quote.customerName}. Crew: ${a.quote.crew.join(", ")}. Simulated Orbyte Work record created (no real booking).`, ROLES[s.role].name, "success"), ...s.activity] };
    case "retry": return { ...s, error: false };
    case "reset": return { ...initial(s.page), role: s.role, empty: false, loading: false, error: false, leaveFired: false, activity: ACTIVITY };
    default: return s;
  }
}

const weekdayOf = (d: string) => new Date(d + "T00:00:00+08:00").toLocaleDateString("en-GB", { timeZone: "Asia/Kuala_Lumpur", weekday: "long" });

function deriveDashboard(s: State): DashboardSummary {
  const base = s.empty ? DASHBOARD_EMPTY : s.leaveFired ? (s.recovered ? DASHBOARD_RECOVERED : DASHBOARD_CONFLICT) : DASHBOARD_DEFAULT;
  const extraUpcoming: UpcomingAppointment[] = s.approved.filter((q) => q.appointmentDate).map((q) => ({
    quoteId: q.id, reference: q.reference, customerName: q.customerName, location: q.location, appointmentDate: q.appointmentDate!, weekday: weekdayOf(q.appointmentDate!),
    serviceSummary: q.lineItems.map((l) => `${l.quantity} x ${l.serviceName.replace("Air-conditioning ", "").replace(" air-conditioning", "")}`).join(" + "),
    totalPrice: q.totalPrice, crew: q.crew, riskStatus: "FEASIBLE",
  }));
  const extraAttention: AttentionItem[] = s.drafts.map((q) => ({
    kind: "pending_approval", severity: "warning", title: `Draft from ${q.createdBy ?? "Mei"} waiting for approval`,
    detail: `${q.customerName} · ${q.lineItems.map((l) => `${l.quantity} x ${l.serviceName.replace("Air-conditioning ", "")}`).join(" + ")} · requested ${q.requestedDate}`, quoteId: q.id, reference: q.reference,
  }));
  const upcoming = [...base.upcoming, ...extraUpcoming].sort((x, y) => x.appointmentDate.localeCompare(y.appointmentDate));
  return {
    ...base,
    counts: { ...base.counts, pendingQuotations: base.counts.pendingQuotations + s.drafts.length, approvedQuotations: base.counts.approvedQuotations + s.approved.length, upcomingAppointments: upcoming.length, enquiries: base.counts.enquiries + s.drafts.length + s.approved.length },
    needsAttention: [...base.needsAttention.filter((a) => a.kind === "at_risk"), ...extraAttention, ...base.needsAttention.filter((a) => a.kind !== "at_risk")],
    upcoming,
  };
}

export interface PilotStore {
  state: State;
  dashboard: DashboardSummary;
  atRisk: Commitment | null;
  recoveredCommitment: Commitment | null;
  isManager: boolean;
  actorName: string;
  navigate: (p: Page) => void;
  explain: (k: NavKey | null) => void;
  setRole: (r: RoleKey) => void;
  fireLeave: () => void;
  approveRecovery: () => void;
  retry: () => void;
  reset: () => void;
  /** Builds a quote from an analysed enquiry; `opt` null = draft waiting for the manager. */
  makeQuote: (result: EnquiryResult, customer: string, message: string, opt: ScheduleCheck | null) => Quote;
  sendDraft: (q: Quote) => void;
  approveQuote: (q: Quote) => void;
}

const Ctx = createContext<PilotStore | null>(null);

export function PilotProvider({ initialPage, children }: { initialPage: Page; children: ReactNode }) {
  const [state, dispatch] = useReducer(reducer, initialPage, initial);
  const value = useMemo<PilotStore>(() => {
    const actorName = ROLES[state.role].name;
    return {
      state,
      dashboard: deriveDashboard(state),
      atRisk: state.leaveFired && !state.recovered ? { quote: QUOTE_MONDAY_AT_RISK, recovery: RECOVERY_PLAN } : null,
      recoveredCommitment: state.leaveFired && state.recovered ? { quote: QUOTE_MONDAY_RECOVERED, recovery: null } : null,
      isManager: state.role === "manager",
      actorName,
      navigate: (page) => dispatch({ type: "navigate", page }),
      explain: (key) => dispatch({ type: "explain", key }),
      setRole: (role) => dispatch({ type: "role", role }),
      fireLeave: () => dispatch({ type: "fireLeave" }),
      approveRecovery: () => dispatch({ type: "approveRecovery" }),
      retry: () => dispatch({ type: "retry" }),
      reset: () => dispatch({ type: "reset" }),
      makeQuote: (result, customer, message, opt) => {
        const p = result.pricing!;
        const id = state.nextId;
        const status = opt ? "approved" : "pending";
        return {
          id, reference: `ORO-${1022 + id}`, companyName: COMPANY, customerName: customer.trim() || "Customer", location: result.analysis.location ?? "", serviceCode: p.serviceCode, serviceName: p.serviceName,
          quantity: p.quantity, unitPrice: p.unitPrice, totalPrice: p.totalPrice, requestedDate: result.analysis.requestedDate ?? "", appointmentDate: opt?.date ?? null, status,
          approvedBy: opt ? actorName : null, approvedAt: opt ? now() : null, rejectionReason: null, createdBy: actorName, message,
          crew: opt ? opt.crew.map((c) => c.name) : [], lineItems: p.lines, riskStatus: opt ? "FEASIBLE" : null, riskReason: null, createdAt: now(),
        };
      },
      sendDraft: (quote) => dispatch({ type: "sendDraft", quote }),
      approveQuote: (quote) => dispatch({ type: "approveQuote", quote }),
    };
  }, [state]);
  return <Ctx.Provider value={value}>{children}</Ctx.Provider>;
}

export function usePilot(): PilotStore {
  const v = useContext(Ctx);
  if (!v) throw new Error("usePilot must be used inside PilotProvider");
  return v;
}
