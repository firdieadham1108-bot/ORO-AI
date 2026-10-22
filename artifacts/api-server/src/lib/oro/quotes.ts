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
                             crew, risk_status, line_items, message, created_at)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
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
        now,
      );
    const id = Number(insert.lastInsertRowid);
    const reference = quoteReference(id);
    db.prepare("UPDATE quotes SET reference = ? WHERE id = ?").run(reference, id);

    // An approved quote reserves its crew for the appointment window (simulated Orbyte Work assignment),
    // so later availability checks and the risk monitor can see who this job depends on.
    if (input.approval) {
      const window = workingWindow(input.approval.appointmentDate);
      const title = `${input.location} - ${lines.map((l) => l.service.name).join(" + ")} (${input.customerName})`;
      for (const member of input.approval.crew) {
        MockOrbyteWorkAdapter.createAssignment({ staffId: member.id, title, startAt: window.start, endAt: window.end, reference, quoteId: id });
      }
    }

    logActivity(
      "price_calculated",
      `Price calculated for ${reference}: ${calculation} = ${formatRm(totalSen)} (${lines.map((l) => l.service.name).join(" + ")}).`,
      "System",
      "info",
    );
    if (input.approval) {
      const a = input.approval;
      logActivity(
        "quotation_approved",
        `${a.approvedBy} approved quotation ${reference} for ${input.customerName} (${input.location}): ` +
          `${description}, total ${formatRm(totalSen)}. ` +
          `Appointment: ${formatLongDate(a.appointmentDate)}` +
          (a.appointmentDate !== input.requestedDate
            ? ` (customer asked for ${formatLongDate(input.requestedDate)}, which was not feasible).`
            : ".") +
          ` Crew reserved: ${a.crew.map(crewLabel).join(", ")}.`,
        a.approvedBy,
        "success",
      );
    } else {
      logActivity(
        "quote_created",
        `Draft quotation ${reference} created for ${input.customerName} (${input.location}), requested date ${input.requestedDate}.`,
        actor,
        "success",
      );
    }
    return db.prepare("SELECT * FROM quotes WHERE id = ?").get(id) as unknown as QuoteRow;
  });
}
