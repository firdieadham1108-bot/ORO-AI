// Quotation storage helpers (quotes table). Prices are recalculated here from the price list.
import { db, inTransaction, logActivity } from "./db";
import { MockOrbyteWorkAdapter } from "./orbyte-adapters";
import { formatLongDate, nowMyt, workingWindow } from "./dates";
import type { CrewMember } from "./scheduling";
import { calculateTotalSen, COMPANY_NAME, findService, senToRm, type ServiceItem } from "./services";

export interface QuoteRow {
  id: number;
  reference: string;
  customer_name: string;
  location: string;
  service_code: string;
  quantity: number;
  unit_price_sen: number;
  total_sen: number;
  requested_date: string;
  appointment_date: string | null;
  status: string;
  approved_by: string | null;
  approved_at: string | null;
  crew: string | null;
  risk_status: string | null;
  risk_reason: string | null;
  line_items: string | null;
  message: string | null;
  created_by: string | null;
  rejection_reason: string | null;
  created_at: string;
}

interface StoredLine {
  code: string;
  quantity: number;
  unitPriceSen: number;
}

/** All lines of a quote. Older single-service quotes fall back to their main columns. */
function linesOf(row: QuoteRow): StoredLine[] {
  if (row.line_items) return JSON.parse(row.line_items) as StoredLine[];
  return [{ code: row.service_code, quantity: row.quantity, unitPriceSen: row.unit_price_sen }];
}

export function toQuote(row: QuoteRow) {
  return {
    id: row.id,
    reference: row.reference,
    companyName: COMPANY_NAME,
    customerName: row.customer_name,
    location: row.location,
    serviceCode: row.service_code,
    serviceName: findService(row.service_code)?.name ?? row.service_code,
    quantity: row.quantity,
    unitPrice: senToRm(row.unit_price_sen),
    totalPrice: senToRm(row.total_sen),
    requestedDate: row.requested_date,
    appointmentDate: row.appointment_date,
    status: row.status,
    approvedBy: row.approved_by,
    approvedAt: row.approved_at,
    rejectionReason: row.rejection_reason,
    createdBy: row.created_by,
    message: row.message,
    crew: row.crew ? (JSON.parse(row.crew) as string[]) : [],
    lineItems: linesOf(row).map((l) => ({
      serviceCode: l.code,
      serviceName: findService(l.code)?.name ?? l.code,
      quantity: l.quantity,
      unitPrice: senToRm(l.unitPriceSen),
      lineTotal: senToRm(calculateTotalSen(l.quantity, l.unitPriceSen)),
    })),
    riskStatus: row.risk_status,
    riskReason: row.risk_reason,
    createdAt: row.created_at,
  };
}

/** Quotation numbers start at ORO-1023 after a demo reset (earlier numbers stand for past paper quotes). */
export const QUOTE_NUMBER_OFFSET = 1022;
export function quoteReference(id: number): string {
  return `ORO-${QUOTE_NUMBER_OFFSET + id}`;
}

export const crewLabel = (m: { name: string; isSenior: boolean }): string =>
  m.isSenior ? `${m.name} (senior)` : m.name;

export function formatRm(sen: number): string {
  return `RM${(sen / 100).toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
}

export interface NewQuote {
  customerName: string;
  location: string;
  service: ServiceItem;
  quantity: number;
  /** Further services on the same visit (e.g. servicing alongside an installation). */
  extraLines?: Array<{ service: ServiceItem; quantity: number }>;
  requestedDate: string;
  message: string | null;
  approval?: { appointmentDate: string; approvedBy: string; crew: CrewMember[] };
}

/** Insert a quotation and its activity entries in one transaction. Returns the stored row. */
export function insertQuote(input: NewQuote, actor: string): QuoteRow {
  const lines = [{ service: input.service, quantity: input.quantity }, ...(input.extraLines ?? [])];
  const totalSen = lines.reduce((sum, l) => sum + calculateTotalSen(l.quantity, l.service.unitPriceSen), 0);
  const calculation = lines.map((l) => `${l.quantity} x ${formatRm(l.service.unitPriceSen)}`).join(" + ");
  const description = lines.map((l) => `${l.quantity} x ${l.service.name}`).join(" + ");
  const now = nowMyt();
  return inTransaction(() => {
    const placeholder = `PENDING-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
    const insert = db
      .prepare(
        `INSERT INTO quotes (reference, customer_name, location, service_code, quantity, unit_price_sen,
                             total_sen, requested_date, appointment_date, status, approved_by, approved_at,
                             crew, risk_status, line_items, message, created_by, created_at)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      )
      .run(
        placeholder,
        input.customerName,
        input.location,
        input.service.code,
        input.quantity,
        input.service.unitPriceSen,
        totalSen,
        input.requestedDate,
        input.approval?.appointmentDate ?? null,
        input.approval ? "approved" : "draft",
        input.approval?.approvedBy ?? null,
        input.approval ? now : null,
        input.approval ? JSON.stringify(input.approval.crew.map(crewLabel)) : null,
        input.approval ? "FEASIBLE" : null,
        JSON.stringify(lines.map((l) => ({ code: l.service.code, quantity: l.quantity, unitPriceSen: l.service.unitPriceSen }))),
        input.message,
        actor,
        now,
      );
    const id = Number(insert.lastInsertRowid);
    const reference = quoteReference(id);
    db.prepare("UPDATE quotes SET reference = ? WHERE id = ?").run(reference, id);

    logActivity(
      "price_calculated",
      `Price calculated for ${reference}: ${calculation} = ${formatRm(totalSen)} (${lines.map((l) => l.service.name).join(" + ")}).`,
      "System",
      "info",
    );
    if (input.approval) {
      reserveCrewAndLogApproval(getQuoteRow(id)!, input.approval);
    } else {
      logActivity(
        "quote_created",
        `Draft quotation ${reference} created for ${input.customerName} (${input.location}), requested date ${input.requestedDate}. Waiting for manager approval.`,
        actor,
        "success",
      );
    }
    return db.prepare("SELECT * FROM quotes WHERE id = ?").get(id) as unknown as QuoteRow;
  });
}

export function getQuoteRow(id: number): QuoteRow | undefined {
  return db.prepare("SELECT * FROM quotes WHERE id = ?").get(id) as unknown as QuoteRow | undefined;
}

/** Service names of every line, e.g. "Installation 1.5HP + Normal Servicing". */
export function serviceSummaryOf(row: QuoteRow): string {
  return linesOf(row)
    .map((l) => `${l.quantity} x ${findService(l.code)?.name ?? l.code}`)
    .join(" + ");
}

/** Codes of every line (first = main service). Used to re-check a draft's crew rule at approval time. */
export function lineCodesOf(row: QuoteRow): string[] {
  return linesOf(row).map((l) => l.code);
}

/**
 * Reserve the crew for the appointment window (simulated Orbyte Work assignments) and write the approval
 * to the activity log. Shared by direct approvals (new row) and draft approvals (existing row).
 * Must run inside the caller's transaction.
 */
export function reserveCrewAndLogApproval(
  row: QuoteRow,
  approval: { appointmentDate: string; approvedBy: string; crew: CrewMember[] },
): void {
  const lines = linesOf(row);
  const names = lines.map((l) => findService(l.code)?.name ?? l.code).join(" + ");
  const description = lines.map((l) => `${l.quantity} x ${findService(l.code)?.name ?? l.code}`).join(" + ");
  const window = workingWindow(approval.appointmentDate);
  const title = `${row.location} - ${names} (${row.customer_name})`;
  for (const member of approval.crew) {
    MockOrbyteWorkAdapter.createAssignment({ staffId: member.id, title, startAt: window.start, endAt: window.end, reference: row.reference, quoteId: row.id });
  }
  logActivity(
    "quotation_approved",
    `${approval.approvedBy} approved quotation ${row.reference} for ${row.customer_name} (${row.location}): ` +
      `${description}, total ${formatRm(row.total_sen)}. ` +
      `Appointment: ${formatLongDate(approval.appointmentDate)}` +
      (approval.appointmentDate !== row.requested_date
        ? ` (customer asked for ${formatLongDate(row.requested_date)}, which was not feasible).`
        : ".") +
      ` Crew reserved: ${approval.crew.map(crewLabel).join(", ")}.`,
    approval.approvedBy,
    "success",
  );
}

/** Turn an existing draft row into an approved quotation (status, dates, crew), then reserve the crew. */
export function markDraftApproved(
  row: QuoteRow,
  approval: { appointmentDate: string; approvedBy: string; crew: CrewMember[] },
): QuoteRow {
  db.prepare(
    `UPDATE quotes SET status = 'approved', appointment_date = ?, approved_by = ?, approved_at = ?, crew = ?,
                       risk_status = 'FEASIBLE', risk_reason = NULL, rejection_reason = NULL WHERE id = ?`,
  ).run(approval.appointmentDate, approval.approvedBy, nowMyt(), JSON.stringify(approval.crew.map(crewLabel)), row.id);
  const updated = getQuoteRow(row.id)!;
  reserveCrewAndLogApproval(updated, approval);
  return updated;
}
