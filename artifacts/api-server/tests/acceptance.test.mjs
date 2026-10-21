// Acceptance tests from MASTER_BRIEF.md (Part 15), run against the live API over HTTP.
//   Test 1 - Correct quotation
//   Test 3 - Unavailable date
//   Test 4 - Available alternative
//   Test 9 - Leave-change detection (optional C)
//   Test 10 - Recovery (optional D), incl. rejecting an already-booked replacement
//   Sprint 5 - Preset scenarios 2-4 (BM, Chinese, missing info) and the demo role lock
//
// Run (API Server workflow must be running):  pnpm --filter @workspace/api-server run test:acceptance
// NOTE: this resets the demo data first so the seeded scenario is the starting point.
import { test, before } from "node:test";
import assert from "node:assert/strict";

const BASE = process.env.ORO_API_URL ?? "http://localhost:80/api";

async function post(path, body) {
  const res = await fetch(`${BASE}${path}`, {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify(body),
  });
  assert.equal(res.status, 200, `${path} returned ${res.status}`);
  return res.json();
}

const ENQUIRY = "Boss, can install 6 units 1.5HP at Cheras this Friday?";

before(async () => {
  await post("/demo/reset", {});
});

test("Test 1 - Correct quotation: six 1.5HP installations cost RM1,140", async () => {
  const result = await post("/enquiry", { message: ENQUIRY });
  assert.equal(result.analysis.quantity, 6);
  assert.equal(result.analysis.serviceCode, "install_1_5hp");
  assert.equal(result.analysis.specification, "1.5HP");
  assert.equal(result.pricing.unitPrice, 190);
  assert.equal(result.pricing.totalPrice, 1140);
  assert.equal(result.pricing.totalFormatted, "RM1,140.00");

  // Same result when the quantity is written as a word.
  const words = await post("/enquiry", { message: "Six units of 1.5HP installation" });
  assert.equal(words.pricing.totalPrice, 1140);
});

test("Test 3 - Unavailable date: Friday 23 Oct 2026 is a conflict with explained reasons", async () => {
  const result = await post("/enquiry", { message: ENQUIRY });
  const friday = result.requestedSchedule;

  assert.equal(result.analysis.requestedDate, "2026-10-23");
  assert.equal(result.status, "conflict");
  assert.equal(friday.verdict, "not_feasible");
  assert.equal(friday.availableInstallers, 0);
  assert.equal(friday.availableSeniorInstallers, 0);
  assert.deepEqual(friday.crew, []);

  const byName = Object.fromEntries(friday.conflicts.map((c) => [c.staffName, c]));
  assert.equal(byName.Ali.kind, "leave");
  assert.equal(byName.Ali.reference, "SIM-ELEAVE-0142");
  assert.equal(byName.Bala.kind, "assignment");
  assert.equal(byName.Mei.kind, "assignment");
  assert.equal(byName.Chong.kind, "assignment");

  assert.match(friday.explanation, /not feasible/);
  assert.match(friday.explanation, /Ali is on approved leave/);
  assert.match(friday.explanation, /Bala is already assigned/);
  assert.match(friday.explanation, /Only 0 of the 2 qualified technicians needed are free/);
});

test("Test 4 - Available alternative: Monday 26 Oct 2026 is recommended with a suitable crew", async () => {
  const result = await post("/enquiry", { message: ENQUIRY });

  assert.equal(result.recommendedDate, "2026-10-26");
  const monday = result.alternatives[0];
  assert.equal(monday.date, "2026-10-26");
  assert.equal(monday.weekday, "Monday");
  assert.equal(monday.verdict, "feasible");
  assert.equal(monday.crew.length, 2);
  assert.ok(monday.crew.some((m) => m.isSenior), "crew must include a senior technician");
  assert.deepEqual(monday.crew.map((m) => m.name).sort(), ["Bala", "Mei"]);
  assert.equal(monday.conflicts.length, 0);

  // Weekend days are not working days, so Saturday/Sunday must not be suggested.
  const suggested = result.alternatives.map((a) => a.date);
  assert.ok(!suggested.includes("2026-10-24") && !suggested.includes("2026-10-25"));
  assert.match(result.summary, /Suggested alternative: Monday, 26 October 2026 is feasible/);
});

// ---------------------------------------------------------------------------
// Optional C and D: commitment risk monitoring and recovery (Tests 9 and 10).
// Each scenario starts from a fresh reset.

async function call(method, path, body) {
  const res = await fetch(`${BASE}${path}`, {
    method,
    headers: { "content-type": "application/json" },
    body: body === undefined ? undefined : JSON.stringify(body),
  });
  return { status: res.status, body: await res.json() };
}

const MONDAY_JOB = {
  customerName: "Cheras Office (demo customer)",
  serviceCode: "install_1_5hp",
  quantity: 6,
  requestedDate: "2026-10-23",
  appointmentDate: "2026-10-26",
  location: "Cheras",
  message: ENQUIRY,
};

async function approveMondayJob() {
  const approved = await call("POST", "/approvals", MONDAY_JOB);
  assert.equal(approved.status, 201);
  assert.equal(approved.body.reference, "ORO-1023");
  assert.deepEqual(approved.body.crew, ["Bala (senior)", "Mei"]);
  assert.equal(approved.body.riskStatus, "FEASIBLE");
  return approved.body;
}

test("Test 9 - Leave-change detection: Bala's emergency leave puts ORO-1023 at risk", async () => {
  await post("/demo/reset", {});
  const quote = await approveMondayJob();

  const event = await call("POST", "/orbyte-sim/emergency-leave");
  assert.equal(event.status, 200, "leave approval must never be blocked");
  assert.equal(event.body.leave.reference, "LV-0499");
  assert.equal(event.body.atRisk.length, 1);
  const risky = event.body.atRisk[0];
  assert.equal(risky.quote.id, quote.id);
  assert.equal(risky.quote.riskStatus, "AT_RISK");
  assert.equal(
    risky.quote.riskReason,
    "Bala is on approved emergency leave (Orbyte eLeave #LV-0499); crew no longer meets Senior Technician requirement.",
  );

  // The leave is stored and Bala's job reservation is kept (not deleted) until the manager decides.
  const monday = (await call("GET", "/staff/availability?date=2026-10-26")).body;
  const bala = monday.staff.find((s) => s.name === "Bala");
  assert.equal(bala.status, "on_leave");
  assert.deepEqual(bala.blocks.map((b) => b.reference).sort(), ["LV-0499", "ORO-1023"]);

  const log = (await call("GET", "/activity")).body.map((a) => a.action);
  assert.ok(log.includes("leave_approved"));
  assert.ok(log.includes("commitment_at_risk"));
});

test("Test 10 - Recovery: Chong recommended, manager approval required, swap logged", async () => {
  await post("/demo/reset", {});
  const quote = await approveMondayJob();
  const event = await call("POST", "/orbyte-sim/emergency-leave");
  const plan = event.body.atRisk[0].recovery;

  assert.equal(plan.status, "replacement_found");
  assert.equal(plan.replacement.name, "Chong");
  assert.equal(plan.replacement.isSenior, true);
  assert.equal(plan.availableHours, 8);
  assert.equal(plan.extraCost, 0);
  assert.equal(plan.otherJobsDelayed, 0);
  assert.equal(plan.summary, "Swap Bala -> Chong (Senior Tech, Available 8 hrs, RM0 extra cost, 0 other jobs delayed)");

  // Requires the manager: anyone else is refused and nothing changes.
  const refused = await call("POST", `/commitments/${quote.id}/recover`, { managerName: "Mei" });
  assert.equal(refused.status, 403);
  const stillRisky = (await call("GET", "/commitments")).body.find((c) => c.quote.id === quote.id);
  assert.equal(stillRisky.quote.riskStatus, "AT_RISK");
  assert.deepEqual(stillRisky.quote.crew, ["Bala (senior)", "Mei"]);

  const recovered = await call("POST", `/commitments/${quote.id}/recover`, { managerName: "Faizal" });
  assert.equal(recovered.status, 200);
  assert.equal(recovered.body.quote.riskStatus, "FEASIBLE");
  assert.equal(recovered.body.quote.riskReason, null);
  assert.deepEqual(recovered.body.quote.crew, ["Chong (senior)", "Mei"]);

  const monday = (await call("GET", "/staff/availability?date=2026-10-26")).body;
  const byName = Object.fromEntries(monday.staff.map((s) => [s.name, s]));
  assert.equal(byName.Chong.status, "assigned");
  assert.deepEqual(byName.Chong.blocks.map((b) => b.reference), ["ORO-1023"]);
  assert.deepEqual(byName.Bala.blocks.map((b) => b.reference), ["LV-0499"], "Bala keeps his leave, loses the job");

  const top = (await call("GET", "/activity")).body[0];
  assert.equal(top.action, "recovery_approved");
  assert.match(top.description, /Bala -> Chong/);
  assert.equal(top.actor, "Faizal (Manager)");

  const again = await call("POST", `/commitments/${quote.id}/recover`, { managerName: "Faizal" });
  assert.equal(again.status, 409, "a recovered commitment cannot be recovered twice");
});

test("Test 10b - Recovery rejects a replacement who already has an overlapping job", async () => {
  await post("/demo/reset", {});
  await approveMondayJob();
  // Book Chong on Monday with a one-person servicing job (he is next in dispatch order).
  const servicing = await call("POST", "/approvals", {
    ...MONDAY_JOB,
    serviceCode: "standard_service",
    quantity: 1,
    customerName: "Taman Connaught Shop (demo customer)",
    requestedDate: "2026-10-26",
  });
  assert.equal(servicing.status, 201);
  assert.deepEqual(servicing.body.crew, ["Chong (senior)"]);

  const event = await call("POST", "/orbyte-sim/emergency-leave");
  const plan = event.body.atRisk[0].recovery;
  const chong = plan.rejected.find((r) => r.staffName === "Chong");
  assert.ok(chong, "Chong must be rejected");
  assert.match(chong.reason, /Already booked/);
  assert.equal(plan.replacement.name, "Ali", "next safe senior is recommended instead");
});

// ---------- Sprint 5: preset scenarios and the demo role switch ----------

test("Scenario 2 - Bahasa Melayu multi-service: 2 x 1.0HP install + 3 x servicing = RM560, Monday feasible", async () => {
  await post("/demo/reset", {});
  const r = await post("/enquiry", {
    message: "Salam boss, nak pasang 2 biji aircond 1.0hp dan servis biasa 3 biji dekat Taman Connaught Isnin 26 Oct boleh?",
  });
  assert.equal(r.status, "feasible");
  assert.deepEqual(
    r.pricing.lines.map((l) => [l.serviceCode, l.quantity, l.lineTotal]),
    [["install_1_0hp", 2, 320], ["standard_service", 3, 240]],
  );
  assert.equal(r.pricing.totalFormatted, "RM560.00");
  assert.equal(r.analysis.location, "Taman Connaught");
  assert.equal(r.analysis.requestedDate, "2026-10-26");
  assert.deepEqual(r.requestedSchedule.crew.map((c) => c.name), ["Bala", "Mei"], "installation crew rule applies");
});

test("Scenario 3 - Chinese enquiry: 2.0HP is flagged as unsupported, no price invented", async () => {
  const r = await post("/enquiry", { message: "老板，10月26号星期一我们在蕉赖的店要装一台2.0hp冷气，另外一台旧的要做chemical wash，多少钱？" });
  assert.equal(r.status, "needs_clarification");
  assert.equal(r.analysis.requestedDate, "2026-10-26");
  assert.equal(r.analysis.location, "Cheras");
  assert.deepEqual(r.analysis.items.map((i) => [i.serviceKind, i.quantity]), [["install", 1], ["chemical_wash", 1]]);
  assert.match(r.analysis.items[0].issue, /2\.0HP is not on the price list/);
  assert.equal(r.pricing, undefined);
});

test("Scenario 4 - Missing info: NEEDS_CLARIFICATION asks for the HP size", async () => {
  const r = await post("/enquiry", { message: "Hi CoolAir, can quote me price to install 4 aircons at my apartment in Cheras next Wednesday?" });
  assert.equal(r.status, "needs_clarification");
  assert.equal(r.analysis.quantity, 4);
  assert.equal(r.analysis.location, "Cheras");
  assert.ok(r.analysis.missing.some((m) => /HP/.test(m)), "missing list names the HP size");
  assert.equal(r.pricing, undefined);
  assert.equal(r.requestedSchedule, undefined);
});

test("Role lock - Sales staff (Mei) cannot approve a quotation or a recovery; manager (Faizal) can", async () => {
  await post("/demo/reset", {});
  const denied = await call("POST", "/approvals", { ...MONDAY_JOB, approverName: "Mei" });
  assert.equal(denied.status, 403);
  assert.match(denied.body.error, /Requires Manager \(Faizal\)/);

  const approved = await call("POST", "/approvals", {
    ...MONDAY_JOB, approverName: "Faizal", extraItems: [{ serviceCode: "standard_service", quantity: 3 }],
  });
  assert.equal(approved.status, 201);
  assert.equal(approved.body.reference, "ORO-1023");
  assert.equal(approved.body.totalPrice, 1380, "6 x RM190 + 3 x RM80");
  assert.equal(approved.body.lineItems.length, 2);

  await call("POST", "/orbyte-sim/emergency-leave");
  const salesRecover = await call("POST", `/commitments/${approved.body.id}/recover`, { managerName: "Mei" });
  assert.equal(salesRecover.status, 403);
});
