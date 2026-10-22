// The 10 required test cases from MASTER_BRIEF.md (Part 15 — Acceptance Tests), plus extra checks.
// Each test talks to the real API server over HTTP, which uses the real SQLite database.
// Every test starts from a fresh "Reset Demo Data", so tests do not depend on each other.
//
// Do not run this file directly: use `npm test` from the project root. The runner (tests/runTests.mjs)
// starts a separate test server with its own temporary database and sets ORO_API_URL / ORO_DB_PATH.
import { test, beforeEach } from "node:test";
import assert from "node:assert/strict";
import { DatabaseSync } from "node:sqlite";

const BASE = process.env.ORO_API_URL;
const DB_PATH = process.env.ORO_DB_PATH;
if (!BASE || !DB_PATH) {
  throw new Error("Run the tests with `npm test` from the project root (it starts a private test server).");
}

// ---------- helpers ----------

async function call(method, path, body) {
  const res = await fetch(`${BASE}${path}`, {
    method,
    headers: { "content-type": "application/json" },
    body: body === undefined ? undefined : JSON.stringify(body),
  });
  return { status: res.status, body: await res.json() };
}
const enquiry = async (message) => {
  const r = await call("POST", "/enquiry", { message });
  assert.equal(r.status, 200, `/enquiry returned ${r.status}`);
  return r.body;
};
const availability = async (date) => (await call("GET", `/staff/availability?date=${date}`)).body;
const activityActions = async () => (await call("GET", "/activity")).body.map((a) => a.action);

/** Direct access to the same SQLite file the server uses, to change records the way Orbyte would. */
function withDb(work) {
  const db = new DatabaseSync(DB_PATH);
  db.exec("PRAGMA busy_timeout = 5000;");
  try {
    return work(db);
  } finally {
    db.close();
  }
}

const FRIDAY = "2026-10-23";
const MONDAY = "2026-10-26";
const FLAGSHIP = "Boss, can install 6 units 1.5HP at Cheras this Friday?";
const MONDAY_JOB = {
  customerName: "Cheras Office (demo customer)",
  serviceCode: "install_1_5hp",
  quantity: 6,
  requestedDate: FRIDAY,
  appointmentDate: MONDAY,
  location: "Cheras",
  message: FLAGSHIP,
  approverName: "Faizal",
};

beforeEach(async () => {
  const r = await call("POST", "/demo/reset", {});
  assert.equal(r.status, 200, "demo reset failed");
});

// ---------- Tests 1-10 ----------

test("Test 1 - Correct quotation: 6 x 1.5HP installation = RM1,140", async () => {
  const r = await enquiry(FLAGSHIP);
  assert.equal(r.analysis.serviceCode, "install_1_5hp");
  assert.equal(r.analysis.quantity, 6);
  assert.equal(r.pricing.unitPrice, 190);
  assert.equal(r.pricing.totalPrice, 1140);
  assert.equal(r.pricing.totalFormatted, "RM1,140.00");

  const words = await enquiry("Six units of 1.5HP installation");
  assert.equal(words.pricing.totalPrice, 1140, "quantity written as a word gives the same total");
});

test("Test 2 - Different quantity: 4 x 1.5HP installation = RM760", async () => {
  const r = await enquiry("Can you install 4 units of 1.5HP aircon at Cheras on 26 Oct?");
  assert.equal(r.analysis.quantity, 4);
  assert.equal(r.analysis.serviceCode, "install_1_5hp");
  assert.equal(r.pricing.totalPrice, 760);
  assert.equal(r.pricing.totalFormatted, "RM760.00");
});

test("Test 3 - Friday 23 Oct 2026 rejected: Ali on leave, Bala/Mei/Chong already assigned", async () => {
  const r = await enquiry(FLAGSHIP);
  const friday = r.requestedSchedule;
  assert.equal(r.analysis.requestedDate, FRIDAY);
  assert.equal(r.status, "conflict");
  assert.equal(friday.verdict, "not_feasible");
  assert.equal(friday.availableInstallers, 0);
  assert.deepEqual(friday.crew, []);

  const byName = Object.fromEntries(friday.conflicts.map((c) => [c.staffName, c]));
  assert.equal(byName.Ali.kind, "leave");
  assert.equal(byName.Ali.reference, "SIM-ELEAVE-0142");
  for (const name of ["Bala", "Mei", "Chong"]) assert.equal(byName[name].kind, "assignment", `${name} must be assigned`);

  assert.match(friday.explanation, /Ali is on approved leave/);
  assert.match(friday.explanation, /Bala is already assigned/);
  assert.match(friday.explanation, /Only 0 of the 2 qualified technicians needed are free/);
});

test("Test 4 - Monday 26 Oct 2026 recommended as feasible with Bala + Mei", async () => {
  const r = await enquiry(FLAGSHIP);
  assert.equal(r.recommendedDate, MONDAY);
  const monday = r.alternatives[0];
  assert.equal(monday.verdict, "feasible");
  assert.deepEqual(monday.crew.map((m) => m.name).sort(), ["Bala", "Mei"]);
  assert.ok(monday.crew.some((m) => m.isSenior), "crew includes a senior technician");
  assert.equal(monday.conflicts.length, 0);
  const suggested = r.alternatives.map((a) => a.date);
  assert.ok(!suggested.includes("2026-10-24") && !suggested.includes("2026-10-25"), "weekends are never suggested");
});

test("Test 5 - Schedule is recalculated when leave or job records change", async () => {
  // (a) Ali's Friday leave is cancelled and Mei's Friday job moves to Thursday -> Friday becomes feasible.
  assert.equal((await enquiry(FLAGSHIP)).status, "conflict");
  withDb((db) => {
    db.prepare("DELETE FROM capacity_blocks WHERE reference = 'SIM-ELEAVE-0142'").run();
    db.prepare(
      "UPDATE capacity_blocks SET start_at = '2026-10-22T09:00:00+08:00', end_at = '2026-10-22T17:00:00+08:00' WHERE reference = 'SIM-WORK-BJ-2311'",
    ).run();
  });
  const after = await enquiry(FLAGSHIP);
  assert.equal(after.status, "feasible", "same message, new answer, because the records changed");
  assert.deepEqual(after.requestedSchedule.crew.map((m) => m.name).sort(), ["Ali", "Mei"]);

  // (b) A new Work assignment for Bala on Monday -> Monday's recommended crew changes to Mei + Chong.
  await call("POST", "/demo/reset", {});
  withDb((db) =>
    db
      .prepare(
        "INSERT INTO capacity_blocks (staff_id, kind, title, start_at, end_at, reference) VALUES (2, 'assignment', 'Kepong urgent repair', '2026-10-26T09:00:00+08:00', '2026-10-26T12:00:00+08:00', 'SIM-WORK-KP-2601')",
      )
      .run(),
  );
  const monday = (await enquiry(FLAGSHIP)).alternatives[0];
  assert.equal(monday.date, MONDAY, "a 3-hour job still overlaps the 09:00-17:00 window");
  assert.deepEqual(monday.crew.map((m) => m.name).sort(), ["Chong", "Mei"]);
  const bala = (await availability(MONDAY)).staff.find((s) => s.name === "Bala");
  assert.equal(bala.status, "assigned");
});

test("Test 6 - Missing details: 'Can you install aircon?' asks for clarification", async () => {
  const r = await enquiry("Can you install aircon?");
  assert.equal(r.status, "needs_clarification");
  const missing = r.analysis.missing.join(" | ");
  assert.match(missing, /air-conditioner size/);
  assert.match(missing, /number of units/);
  assert.match(missing, /requested date/);
  assert.match(missing, /job location/);
  assert.match(r.analysis.clarification, /^Please confirm/);
  assert.equal(r.pricing, undefined, "no price is guessed");
  assert.equal(r.requestedSchedule, undefined, "no availability claim without a date");
});

test("Test 7 - Manager approval saves the booking, approval status and activity log", async () => {
  const res = await call("POST", "/approvals", MONDAY_JOB);
  assert.equal(res.status, 201);
  const q = res.body;
  assert.equal(q.reference, "ORO-1023");
  assert.equal(q.status, "approved");
  assert.equal(q.approvedBy, "Faizal (Manager)");
  assert.ok(q.approvedAt, "approval time is recorded");
  assert.equal(q.appointmentDate, MONDAY);
  assert.equal(q.totalPrice, 1140);
  assert.deepEqual(q.crew, ["Bala (senior)", "Mei"]);

  // Saved in the database: the quote, and the crew reserved for the appointment window.
  const saved = (await call("GET", `/quotes/${q.id}`)).body;
  assert.equal(saved.status, "approved");
  const reserved = withDb((db) =>
    db.prepare("SELECT staff_id FROM capacity_blocks WHERE quote_id = ? AND kind = 'assignment' ORDER BY staff_id").all(q.id),
  );
  assert.deepEqual(reserved.map((r) => r.staff_id), [2, 3], "Bala (2) and Mei (3) are booked");
  const monday = await availability(MONDAY);
  for (const name of ["Bala", "Mei"]) assert.equal(monday.staff.find((s) => s.name === name).status, "assigned");

  const log = (await call("GET", "/activity")).body;
  const entry = log.find((a) => a.action === "quotation_approved");
  assert.ok(entry, "approval is in the activity log");
  assert.match(entry.description, /ORO-1023/);
  assert.equal(entry.actor, "Faizal (Manager)");

  // Only the manager may approve.
  const sales = await call("POST", "/approvals", { ...MONDAY_JOB, approverName: "Mei" });
  assert.equal(sales.status, 403);
});

test("Test 8 - Double-booking prevention: no technician gets two overlapping jobs", async () => {
  const first = await call("POST", "/approvals", MONDAY_JOB);
  assert.deepEqual(first.body.crew, ["Bala (senior)", "Mei"]);

  // Two more Monday installations confirmed at the same moment: only Chong + Ali remain,
  // so exactly one may succeed (with the remaining crew) and the other must be blocked.
  const [a, b] = await Promise.all([
    call("POST", "/approvals", { ...MONDAY_JOB, customerName: "Second customer (demo)" }),
    call("POST", "/approvals", { ...MONDAY_JOB, customerName: "Third customer (demo)" }),
  ]);
  const statuses = [a.status, b.status].sort();
  assert.deepEqual(statuses, [201, 409]);
  const ok = a.status === 201 ? a.body : b.body;
  const blocked = a.status === 409 ? a.body : b.body;
  assert.deepEqual(ok.crew, ["Chong (senior)", "Ali (senior)"], "a new available crew is used");
  assert.match(blocked.error, /Cannot approve this date/);

  // Approving the infeasible Friday is also refused at confirmation time.
  const friday = await call("POST", "/approvals", { ...MONDAY_JOB, appointmentDate: FRIDAY });
  assert.equal(friday.status, 409);

  const overlapping = withDb((db) =>
    db
      .prepare(
        `SELECT a.staff_id FROM capacity_blocks a JOIN capacity_blocks b
           ON a.staff_id = b.staff_id AND a.id < b.id AND a.start_at < b.end_at AND b.start_at < a.end_at
         WHERE a.kind = 'assignment' AND b.kind = 'assignment'`,
      )
      .all(),
  );
  assert.deepEqual(overlapping, [], "no technician has overlapping assignments in the database");
});

test("Test 9 - Manglish/BM extraction: 'Boss, Friday boleh pasang 6 biji 1.5HP dekat Cheras?'", async () => {
  const r = await enquiry("Boss, Friday boleh pasang 6 biji 1.5HP dekat Cheras?");
  assert.equal(r.analysis.serviceCode, "install_1_5hp");
  assert.equal(r.analysis.quantity, 6);
  assert.equal(r.analysis.specification, "1.5HP");
  assert.equal(r.analysis.requestedDate, FRIDAY);
  assert.equal(r.analysis.location, "Cheras");
  assert.deepEqual(r.analysis.missing, []);
  assert.equal(r.pricing.totalPrice, 1140);
  assert.equal(r.status, "conflict");
  assert.equal(r.recommendedDate, MONDAY);
});

test("Test 10 - Bala's Monday leave flags the commitment AT_RISK and recommends Chong", async () => {
  const q = (await call("POST", "/approvals", MONDAY_JOB)).body;
  const event = await call("POST", "/orbyte-sim/emergency-leave");
  assert.equal(event.status, 200, "leave approval is never blocked");
  assert.equal(event.body.atRisk.length, 1);
  const risky = event.body.atRisk[0];
  assert.equal(risky.quote.id, q.id);
  assert.equal(risky.quote.riskStatus, "AT_RISK");
  assert.equal(risky.quote.status, "approved", "quotation status is kept separate from risk status");
  assert.match(risky.quote.riskReason, /Bala is on approved emergency leave/);

  const plan = risky.recovery;
  assert.equal(plan.status, "replacement_found");
  assert.equal(plan.replacement.name, "Chong");
  assert.equal(plan.replacement.isSenior, true);
  assert.ok((await activityActions()).includes("commitment_at_risk"));

  // The swap needs manager approval.
  assert.equal((await call("POST", `/commitments/${q.id}/recover`, { managerName: "Mei" })).status, 403);
  const recovered = await call("POST", `/commitments/${q.id}/recover`, { managerName: "Faizal" });
  assert.equal(recovered.status, 200);
  assert.equal(recovered.body.quote.riskStatus, "FEASIBLE");
  assert.deepEqual(recovered.body.quote.crew, ["Chong (senior)", "Mei"]);
});

// ---------- Extra checks (beyond the 10 required tests) ----------

test("Extra - Recovery rejects a replacement who already has an overlapping job", async () => {
  await call("POST", "/approvals", MONDAY_JOB);
  const servicing = await call("POST", "/approvals", {
    ...MONDAY_JOB, serviceCode: "standard_service", quantity: 1, customerName: "Taman Connaught Shop (demo customer)", requestedDate: MONDAY,
  });
  assert.deepEqual(servicing.body.crew, ["Chong (senior)"]);
  const plan = (await call("POST", "/orbyte-sim/emergency-leave")).body.atRisk[0].recovery;
  assert.match(plan.rejected.find((r) => r.staffName === "Chong").reason, /Already booked/);
  assert.equal(plan.replacement.name, "Ali");
});

test("Extra - Preset scenario 2 (BM multi-service) = RM560; scenario 3 (Chinese, 2.0HP) needs clarification", async () => {
  const bm = await enquiry("Salam boss, nak pasang 2 biji aircond 1.0hp dan servis biasa 3 biji dekat Taman Connaught Isnin 26 Oct boleh?");
  assert.equal(bm.status, "feasible");
  assert.equal(bm.pricing.totalFormatted, "RM560.00");
  const zh = await enquiry("老板，10月26号星期一我们在蕉赖的店要装一台2.0hp冷气，另外一台旧的要做chemical wash，多少钱？");
  assert.equal(zh.status, "needs_clarification");
  assert.equal(zh.analysis.location, "Cheras");
  assert.equal(zh.pricing, undefined);
});
