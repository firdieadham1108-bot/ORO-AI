import { Router, type IRouter } from "express";
import {
  AnalyseEnquiryBody,
  AnalyseEnquiryResponse,
  CreateQuoteBody,
  GetQuoteParams,
  GetQuoteResponse,
  GetStaffAvailabilityQueryParams,
  GetStaffAvailabilityResponse,
  ListActivityResponse,
  ListQuotesResponse,
  ListServicesResponse,
  ResetDemoResponse,
} from "@workspace/api-zod";
import { db, inTransaction, logActivity, resetDemoData } from "../lib/oro/db";
import { getStaffAvailability } from "../lib/oro/availability";
import { isValidDateString, nowMyt } from "../lib/oro/dates";
import { parseEnquiry } from "../lib/oro/parser";
import {
  calculateTotalSen,
  COMPANY_NAME,
  findService,
  SERVICES,
  senToRm,
} from "../lib/oro/services";

const router: IRouter = Router();
const SALESPERSON = "Salesperson (demo)";

interface QuoteRow {
  id: number;
  reference: string;
  customer_name: string;
  location: string;
  service_code: string;
  quantity: number;
  unit_price_sen: number;
  total_sen: number;
  requested_date: string;
  status: string;
  created_at: string;
}

function toQuote(row: QuoteRow) {
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
    status: row.status,
    createdAt: row.created_at,
  };
}

router.get("/staff/availability", (req, res): void => {
  const parsed = GetStaffAvailabilityQueryParams.safeParse(req.query);
  if (!parsed.success || !isValidDateString(parsed.data.date)) {
    res.status(400).json({ error: "Please provide a valid date in YYYY-MM-DD format." });
    return;
  }
  res.json(GetStaffAvailabilityResponse.parse(getStaffAvailability(parsed.data.date)));
});

router.get("/services", (_req, res): void => {
  res.json(
    ListServicesResponse.parse(
      SERVICES.map((s) => ({
        code: s.code,
        name: s.name,
        specification: s.specification,
        unitPrice: senToRm(s.unitPriceSen),
        unit: s.unit,
      })),
    ),
  );
});

router.post("/enquiries/analyse", (req, res): void => {
  const parsed = AnalyseEnquiryBody.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: "Please enter the customer message to analyse." });
    return;
  }
  const result = parseEnquiry(parsed.data.message);
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
  res.json(AnalyseEnquiryResponse.parse(result));
});

router.get("/quotes", (_req, res): void => {
  const rows = db.prepare("SELECT * FROM quotes ORDER BY id DESC").all() as unknown as QuoteRow[];
  res.json(ListQuotesResponse.parse(rows.map(toQuote)));
});

router.post("/quotes", (req, res): void => {
  const parsed = CreateQuoteBody.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: "Quotation details are incomplete or invalid." });
    return;
  }
  const body = parsed.data;
  const service = findService(body.serviceCode);
  if (!service) {
    res.status(400).json({ error: `Unknown service "${body.serviceCode}". Choose a service from the price list.` });
    return;
  }
  if (!isValidDateString(body.requestedDate)) {
    res.status(400).json({ error: "The requested date is not a valid calendar date." });
    return;
  }

  const totalSen = calculateTotalSen(body.quantity, service.unitPriceSen);
  const created = inTransaction(() => {
    const placeholder = `PENDING-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
    const insert = db
      .prepare(
        `INSERT INTO quotes (reference, customer_name, location, service_code, quantity, unit_price_sen,
                             total_sen, requested_date, status, message, created_at)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?, 'draft', ?, ?)`,
      )
      .run(
        placeholder,
        body.customerName.trim(),
        body.location.trim(),
        service.code,
        body.quantity,
        service.unitPriceSen,
        totalSen,
        body.requestedDate,
        body.message ?? null,
        nowMyt(),
      );
    const id = Number(insert.lastInsertRowid);
    const reference = `ORO-Q-${body.requestedDate.slice(0, 4)}-${String(id).padStart(4, "0")}`;
    db.prepare("UPDATE quotes SET reference = ? WHERE id = ?").run(reference, id);

    logActivity(
      "price_calculated",
      `Price calculated for ${reference}: ${body.quantity} x RM${senToRm(service.unitPriceSen).toFixed(2)} = RM${senToRm(totalSen).toFixed(2)} (${service.name}).`,
      "System",
      "info",
    );
    logActivity(
      "quote_created",
      `Draft quotation ${reference} created for ${body.customerName.trim()} (${body.location.trim()}), requested date ${body.requestedDate}.`,
      SALESPERSON,
      "success",
    );
    return db.prepare("SELECT * FROM quotes WHERE id = ?").get(id) as unknown as QuoteRow;
  });
  res.status(201).json(GetQuoteResponse.parse(toQuote(created)));
});

router.get("/quotes/:id", (req, res): void => {
  const params = GetQuoteParams.safeParse(req.params);
  if (!params.success) {
    res.status(400).json({ error: "Invalid quotation id." });
    return;
  }
  const row = db.prepare("SELECT * FROM quotes WHERE id = ?").get(params.data.id) as unknown as
    | QuoteRow
    | undefined;
  if (!row) {
    res.status(404).json({ error: "Quotation not found." });
    return;
  }
  res.json(GetQuoteResponse.parse(toQuote(row)));
});

router.get("/activity", (_req, res): void => {
  const rows = db
    .prepare("SELECT id, action, description, actor, severity, created_at FROM activity_log ORDER BY id DESC LIMIT 200")
    .all() as unknown as Array<{
    id: number;
    action: string;
    description: string;
    actor: string;
    severity: string;
    created_at: string;
  }>;
  res.json(
    ListActivityResponse.parse(
      rows.map((r) => ({
        id: r.id,
        action: r.action,
        description: r.description,
        actor: r.actor,
        severity: r.severity,
        createdAt: r.created_at,
      })),
    ),
  );
});

router.post("/demo/reset", (_req, res): void => {
  const counts = resetDemoData();
  res.json(ResetDemoResponse.parse({ message: "Demo data has been reset.", ...counts }));
});

export default router;
