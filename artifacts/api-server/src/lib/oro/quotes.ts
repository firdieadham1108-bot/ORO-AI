// Quotation storage helpers (quotes table). Prices are recalculated here from the price list.
import { db, inTransaction, logActivity } from "./db";
import { formatLongDate, nowMyt } from "./dates";
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
  created_at: string;
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
    createdAt: row.created_at,
  };
}

export function formatRm(sen: number): string {
  return `RM${(sen / 100).toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
}

export interface NewQuote {
  customerName: string;
  location: string;
  service: ServiceItem;
  quantity: number;
  requestedDate: string;
  message: string | null;
  approval?: { appointmentDate: string; approvedBy: string; crew: string[] };
}

/** Insert a quotation and its activity entries in one transaction. Returns the stored row. */
export function insertQuote(input: NewQuote, actor: string): QuoteRow {
  const totalSen = calculateTotalSen(input.quantity, input.service.unitPriceSen);
  const now = nowMyt();
  return inTransaction(() => {
    const placeholder = `PENDING-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
    const insert = db
      .prepare(
        `INSERT INTO quotes (reference, customer_name, location, service_code, quantity, unit_price_sen,
                             total_sen, requested_date, appointment_date, status, approved_by, approved_at,
                             crew, message, created_at)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
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
        input.approval ? JSON.stringify(input.approval.crew) : null,
        input.message,
        now,
      );
    const id = Number(insert.lastInsertRowid);
    const reference = `ORO-Q-${input.requestedDate.slice(0, 4)}-${String(id).padStart(4, "0")}`;
    db.prepare("UPDATE quotes SET reference = ? WHERE id = ?").run(reference, id);

    logActivity(
      "price_calculated",
      `Price calculated for ${reference}: ${input.quantity} x ${formatRm(input.service.unitPriceSen)} = ${formatRm(totalSen)} (${input.service.name}).`,
      "System",
      "info",
    );
    if (input.approval) {
      const a = input.approval;
      logActivity(
        "quotation_approved",
        `${a.approvedBy} approved quotation ${reference} for ${input.customerName} (${input.location}): ` +
          `${input.quantity} x ${input.service.name}, total ${formatRm(totalSen)}. ` +
          `Appointment: ${formatLongDate(a.appointmentDate)}` +
          (a.appointmentDate !== input.requestedDate
            ? ` (customer asked for ${formatLongDate(input.requestedDate)}, which was not feasible).`
            : ".") +
          ` Crew: ${a.crew.join(", ")}.`,
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
