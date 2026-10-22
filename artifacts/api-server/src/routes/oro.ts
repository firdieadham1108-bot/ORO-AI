import { Router, type IRouter } from "express";
import {
  AnalyseEnquiryBody,
  AnalyseEnquiryResponse,
  ApproveQuotationBody,
  CreateQuoteBody,
  GetOrbyteWalletResponse,
  GetQuoteParams,
  GetQuoteResponse,
  GetStaffAvailabilityQueryParams,
  GetStaffAvailabilityResponse,
  ListActivityResponse,
  ListQuotesResponse,
  ListServicesResponse,
  ListCommitmentsResponse,
  RecoverCommitmentBody,
  RecoverCommitmentParams,
  RecoverCommitmentResponse,
  SimulateEmergencyLeaveResponse,
  ProcessEnquiryBody,
  ProcessEnquiryResponse,
  ResetDemoResponse,
  TranscribeVoiceNoteBody,
  TranscribeVoiceNoteResponse,
} from "@workspace/api-zod";
import { db, resetDemoData } from "../lib/oro/db";
import { approveQuotation } from "../lib/oro/approval";
import { listCommitments, recoverCommitment, simulateEmergencyLeave } from "../lib/oro/risk";
import { insertQuote, toQuote, type QuoteRow } from "../lib/oro/quotes";
import { getStaffAvailability } from "../lib/oro/availability";
import { isValidDateString } from "../lib/oro/dates";
import { logEnquiryAnalysed, processEnquiry } from "../lib/oro/enquiry";
import { parseEnquiry } from "../lib/oro/parser";
import { findService, SERVICES, senToRm } from "../lib/oro/services";
import { transcribeVoiceNote } from "../lib/oro/voice";
import { getWallet } from "../lib/oro/wallet";

const router: IRouter = Router();
const SALESPERSON = "Salesperson (demo)";

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
  logEnquiryAnalysed(result);
  res.json(AnalyseEnquiryResponse.parse(result));
});

router.post("/enquiry", (req, res): void => {
  const parsed = ProcessEnquiryBody.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: "Please enter the customer message to analyse." });
    return;
  }
  res.json(ProcessEnquiryResponse.parse(processEnquiry(parsed.data.message)));
});

// Voice-to-Quote: returns text only. The web app puts it in the enquiry box, then calls POST /enquiry.
router.post("/enquiry/transcribe", async (req, res): Promise<void> => {
  const parsed = TranscribeVoiceNoteBody.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: "Voice note request is incomplete or invalid." });
    return;
  }
  const outcome = await transcribeVoiceNote(parsed.data);
  if (!outcome.ok) {
    res.status(outcome.status).json({ error: outcome.error });
    return;
  }
  res.json(TranscribeVoiceNoteResponse.parse(outcome.result));
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

  const created = insertQuote(
    {
      customerName: body.customerName.trim(),
      location: body.location.trim(),
      service,
      quantity: body.quantity,
      requestedDate: body.requestedDate,
      message: body.message ?? null,
    },
    SALESPERSON,
  );
  res.status(201).json(GetQuoteResponse.parse(toQuote(created)));
});

router.post("/approvals", (req, res): void => {
  const parsed = ApproveQuotationBody.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: "Approval details are incomplete or invalid." });
    return;
  }
  const outcome = approveQuotation(parsed.data);
  if (!outcome.ok) {
    res.status(outcome.status).json({ error: outcome.error });
    return;
  }
  res.status(201).json(GetQuoteResponse.parse(toQuote(outcome.quote)));
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

router.post("/orbyte-sim/emergency-leave", (_req, res): void => {
  res.json(SimulateEmergencyLeaveResponse.parse(simulateEmergencyLeave()));
});

router.get("/orbyte-sim/wallet", (_req, res): void => {
  res.json(GetOrbyteWalletResponse.parse(getWallet()));
});

router.get("/commitments", (_req, res): void => {
  res.json(ListCommitmentsResponse.parse(listCommitments()));
});

router.post("/commitments/:id/recover", (req, res): void => {
  const params = RecoverCommitmentParams.safeParse(req.params);
  const body = RecoverCommitmentBody.safeParse(req.body);
  if (!params.success || !body.success) {
    res.status(400).json({ error: "Recovery request is incomplete or invalid." });
    return;
  }
  const outcome = recoverCommitment(params.data.id, body.data);
  if (!outcome.ok) {
    res.status(outcome.status).json({ error: outcome.error });
    return;
  }
  res.json(RecoverCommitmentResponse.parse(outcome.commitment));
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
