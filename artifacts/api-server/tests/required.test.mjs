// The 10 required test cases from MASTER_BRIEF.md (Part 15 — Acceptance Tests), plus extra checks.
// Each test talks to the real API server over HTTP, which uses the real SQLite database.
// Every test starts from a fresh "Reset Demo Data", so tests do not depend on each other.
//
// Do not run this file directly: use `npm test` from the project root. The runner (tests/runTests.mjs)
// starts a separate test server with its own temporary database and sets ORO_API_URL / ORO_DB_PATH.
import { test, beforeEach } from "node:test";
import assert from "node:assert/strict";
import { DatabaseSync } from "node:sqlite";
import fs from "node:fs";

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

// ---------- Sprint 7: Voice-to-Quote (MASTER_BRIEF.md Optional A) ----------

const SAMPLE_FILE = new URL("../../oro-ai/public/samples/contractor-voice-note-cheras-condo.mp3", import.meta.url);
const CONTRACTOR_NOTE =
  "Boss, client at Cheras Condo wants servicing for two 1.5HP aircons and a chemical wash this Monday, 26 October.";

test("Voice - simulated contractor voice note is labelled, logged, and quoted by the same pipeline", async () => {
  const t = await call("POST", "/enquiry/transcribe", { source: "sample", sampleId: "contractor-cheras-condo" });
  assert.equal(t.status, 200);
  assert.equal(t.body.mode, "simulated");
  assert.equal(t.body.label, "Simulated Demo Transcription");
  assert.equal(t.body.transcript, CONTRACTOR_NOTE);
  const log = (await call("GET", "/activity")).body;
  assert.equal(log[0].action, "VOICE_TRANSCRIBED");
  assert.match(log[0].description, /Simulated Demo Transcription/);

  // Handoff: the transcript goes through the normal /enquiry analysis (2 x RM80 + 1 x RM150).
  const r = await enquiry(t.body.transcript);
  const lines = r.pricing.lines.map((l) => [l.serviceCode, l.quantity]);
  assert.deepEqual(lines, [["standard_service", 2], ["chemical_wash", 1]]);
  assert.equal(r.pricing.totalFormatted, "RM310.00");
  assert.equal(r.analysis.requestedDate, MONDAY);
  assert.equal(r.analysis.location, "Cheras");
  assert.equal(r.status, "feasible");
});

test("Voice - uploads without a speech key give a labelled simulated transcript; bad requests are refused", async () => {
  const audioBase64 = fs.readFileSync(SAMPLE_FILE).toString("base64");
  const sample = await call("POST", "/enquiry/transcribe", {
    source: "upload", fileName: "contractor-voice-note-cheras-condo.mp3", mimeType: "audio/mpeg", audioBase64,
  });
  assert.equal(sample.status, 200);
  assert.equal(sample.body.label, "Simulated Demo Transcription");
  assert.equal(sample.body.transcript, CONTRACTOR_NOTE);
  assert.match(sample.body.note, /is the demo sample/);

  const other = await call("POST", "/enquiry/transcribe", { source: "upload", fileName: "site-visit.m4a", mimeType: "audio/mp4", audioBase64 });
  assert.equal(other.body.mode, "simulated");
  assert.match(other.body.note, /NOT the words in "site-visit.m4a"/, "never pretends to have heard an unknown file");

  const spoken = await call("POST", "/enquiry/transcribe", { source: "browser_speech", transcript: "Install 4 units 1.5HP at Cheras on 26 Oct" });
  assert.equal(spoken.body.mode, "browser");

  assert.equal((await call("POST", "/enquiry/transcribe", { source: "upload", fileName: "notes.txt", audioBase64 })).status, 400);
  assert.equal((await call("POST", "/enquiry/transcribe", { source: "upload", fileName: "empty.mp3", audioBase64: "" })).status, 400);
  assert.equal((await call("POST", "/enquiry/transcribe", { source: "sample", sampleId: "nope" })).status, 400);
  assert.equal((await call("POST", "/enquiry/transcribe", { source: "browser_speech", transcript: " " })).status, 422);
  const voiceLogs = (await activityActions()).filter((a) => a === "VOICE_TRANSCRIBED").length;
  assert.equal(voiceLogs, 3, "only successful transcriptions are logged");
});

test("Wallet - manager approvals and recovery swaps cost 0.10 Orbyte Credits; refusals are free; reset restores 25.00", async () => {
  const wallet = async () => (await call("GET", "/orbyte-sim/wallet")).body;
  const charges = async () =>
    (await call("GET", "/activity")).body.filter((a) => a.action === "orbyte_credits_deducted").map((a) => a.description);

  assert.equal((await wallet()).balanceFormatted, "25.00", "a fresh demo starts at 25.00 credits");

  // Refused or blocked approvals are not charged.
  assert.equal((await call("POST", "/approvals", { ...MONDAY_JOB, approverName: "Mei" })).status, 403);
  assert.equal((await call("POST", "/approvals", { ...MONDAY_JOB, appointmentDate: FRIDAY })).status, 409);
  assert.equal((await wallet()).balanceFormatted, "25.00", "refused approvals must not cost credits");

  // Manager approves the quotation: -0.10, logged with the exact wording.
  const approved = await call("POST", "/approvals", MONDAY_JOB);
  assert.equal(approved.status, 201);
  const afterApproval = await wallet();
  assert.equal(afterApproval.balanceFormatted, "24.90");
  assert.equal(afterApproval.transactionsCharged, 1);
  const [first] = await charges();
  assert.match(first, /^0\.10 Orbyte Credits deducted \(Pay-per-transaction\)/);
  assert.match(first, new RegExp(`${approved.body.reference}.*Balance: 24\\.90 Credits`));

  // Manager approves the recovery swap: another -0.10.
  await call("POST", "/orbyte-sim/emergency-leave");
  assert.equal((await call("POST", `/commitments/${approved.body.id}/recover`, { managerName: "Mei" })).status, 403);
  assert.equal((await wallet()).balanceFormatted, "24.90", "a refused recovery must not cost credits");
  assert.equal((await call("POST", `/commitments/${approved.body.id}/recover`, { managerName: "Faizal" })).status, 200);
  assert.equal((await wallet()).balanceFormatted, "24.80");
  assert.match((await charges())[0], /recovery swap.*Balance: 24\.80 Credits/);

  // Reset Demo State puts the wallet back to 25.00.
  await call("POST", "/demo/reset", {});
  const reset = await wallet();
  assert.equal(reset.balanceFormatted, "25.00");
  assert.equal(reset.transactionsCharged, 0);
});

// ---------- Sprint 9: Dashboard, Staff Schedule and the sales -> manager draft approval flow ----------

test("Dashboard - counters are calculated from the database and move with the data", async () => {
  const empty = (await call("GET", "/dashboard/summary")).body;
  assert.equal(empty.referenceDate, "2026-10-21");
  assert.deepEqual(empty.counts, {
    enquiries: 0, pendingQuotations: 0, approvedQuotations: 0, rejectedQuotations: 0,
    upcomingAppointments: 0, schedulingConflicts: 0, conflictsDetected: 0, atRiskCommitments: 0,
  });
  assert.equal(empty.crewToday.technicians, 4);
  assert.equal(empty.crewToday.available, 4, "all four technicians are free on the reference date");
  assert.deepEqual(empty.upcoming, []);

  await enquiry(FLAGSHIP); // Friday conflict detected while analysing
  await call("POST", "/approvals", MONDAY_JOB); // approved for Monday
  const draft = await call("POST", "/quotes", { customerName: "Draft Customer", serviceCode: "standard_service", quantity: 2, requestedDate: MONDAY, location: "Cheras", requestedBy: "Mei" });
  assert.equal(draft.status, 201);

  const after = (await call("GET", "/dashboard/summary")).body;
  assert.equal(after.counts.enquiries, 1);
  assert.equal(after.counts.pendingQuotations, 1);
  assert.equal(after.counts.approvedQuotations, 1);
  assert.equal(after.counts.upcomingAppointments, 1);
  assert.equal(after.counts.conflictsDetected, 1);
  assert.equal(after.counts.schedulingConflicts, 1);
  assert.equal(after.upcoming[0].reference, "ORO-1023");
  assert.deepEqual(after.upcoming[0].crew, ["Bala (senior)", "Mei"]);
  assert.ok(after.needsAttention.some((n) => n.kind === "pending_approval" && n.reference === draft.body.reference), "draft shows under needs attention");

  await call("POST", "/orbyte-sim/emergency-leave"); // Bala's Monday leave puts ORO-1023 at risk
  const risky = (await call("GET", "/dashboard/summary")).body;
  assert.equal(risky.counts.atRiskCommitments, 1);
  assert.equal(risky.counts.schedulingConflicts, 2);
  assert.equal(risky.needsAttention[0].kind, "at_risk", "at-risk jobs come first");
  assert.match(risky.needsAttention[0].detail, /Chong/);
});

test("Staff Schedule - week board shows leave, Orbyte jobs and ORO bookings per technician per day", async () => {
  const board = (await call("GET", "/staff/schedule?from=2026-10-22&days=7")).body;
  assert.equal(board.from, "2026-10-22");
  assert.equal(board.to, "2026-10-28");
  assert.equal(board.days.length, 7);
  assert.equal(board.days[0].weekday, "Thursday");
  assert.equal(board.days[1].availableInstallers, 0, "nobody is free on Friday 23 Oct");
  assert.equal(board.days[3].workingDay, false, "Sunday is not a working day");

  const ali = board.staff.find((s) => s.name === "Ali");
  const friday = ali.days.find((d) => d.date === FRIDAY);
  assert.equal(friday.status, "on_leave");
  assert.equal(friday.blocks[0].source, "eleave");
  assert.equal(friday.blocks[0].reference, "SIM-ELEAVE-0142");
  const bala = board.staff.find((s) => s.name === "Bala");
  assert.equal(bala.days.find((d) => d.date === FRIDAY).blocks[0].source, "orbyte_work");
  const faizal = board.staff.find((s) => s.name === "Faizal");
  assert.equal(faizal.days[0].status, "not_a_technician");

  // An ORO approval appears on the board as a booking with its quotation number.
  const approved = (await call("POST", "/approvals", MONDAY_JOB)).body;
  const updated = (await call("GET", "/staff/schedule?from=2026-10-22&days=7")).body;
  const balaMonday = updated.staff.find((s) => s.name === "Bala").days.find((d) => d.date === MONDAY);
  assert.equal(balaMonday.status, "assigned");
  assert.equal(balaMonday.blocks[0].source, "oro_booking");
  assert.equal(balaMonday.blocks[0].reference, approved.reference);
  assert.equal(balaMonday.blocks[0].quoteId, approved.id);
  assert.equal(updated.days.find((d) => d.date === MONDAY).availableInstallers, 2);

  // Defaults and validation.
  const defaults = (await call("GET", "/staff/schedule")).body;
  assert.equal(defaults.from, "2026-10-22");
  assert.equal(defaults.days.length, 7);
  assert.equal((await call("GET", "/staff/schedule?from=2026-13-01")).status, 400);
  assert.equal((await call("GET", "/staff/schedule?days=40")).status, 400);
});

test("Approvals - sales sends a draft, manager sees the options, approves it with the same safety checks", async () => {
  // Sales staff (Mei) cannot approve, so the enquiry is saved as a draft for the manager.
  const draft = (await call("POST", "/quotes", {
    customerName: "Cheras Office (demo customer)", serviceCode: "install_1_5hp", quantity: 6,
    requestedDate: FRIDAY, location: "Cheras", message: FLAGSHIP, requestedBy: "Mei",
    extraItems: [{ serviceCode: "standard_service", quantity: 1 }],
  })).body;
  assert.equal(draft.status, "draft");
  assert.equal(draft.reference, "ORO-1023");
  assert.equal(draft.createdBy, "Mei");
  assert.equal(draft.totalPrice, 1140 + 80, "extra line priced by the server");

  // Manager Approval page: the requested Friday is re-checked and Monday is offered instead.
  const options = (await call("GET", `/quotes/${draft.id}/schedule-options`)).body;
  assert.equal(options.requested.verdict, "not_feasible");
  assert.equal(options.alternatives[0].date, MONDAY);
  assert.deepEqual(options.alternatives[0].crew.map((c) => c.name), ["Bala", "Mei"]);

  // Sales cannot approve; the manager cannot approve the conflicting Friday; nothing was charged.
  assert.equal((await call("POST", `/quotes/${draft.id}/approve`, { appointmentDate: MONDAY, approverName: "Mei" })).status, 403);
  assert.equal((await call("POST", `/quotes/${draft.id}/approve`, { appointmentDate: FRIDAY, approverName: "Faizal" })).status, 409);
  assert.equal((await call("GET", "/orbyte-sim/wallet")).body.balanceFormatted, "25.00");

  // Manager approves Monday: same row, now approved, crew reserved, credits charged.
  const approved = await call("POST", `/quotes/${draft.id}/approve`, { appointmentDate: MONDAY, approverName: "Faizal" });
  assert.equal(approved.status, 200);
  assert.equal(approved.body.id, draft.id);
  assert.equal(approved.body.reference, "ORO-1023");
  assert.equal(approved.body.status, "approved");
  assert.equal(approved.body.appointmentDate, MONDAY);
  assert.deepEqual(approved.body.crew, ["Bala (senior)", "Mei"]);
  assert.equal((await call("GET", "/quotes")).body.length, 1, "no duplicate quotation row");
  const monday = await availability(MONDAY);
  for (const name of ["Bala", "Mei"]) assert.equal(monday.staff.find((s) => s.name === name).status, "assigned");
  assert.equal((await call("GET", "/orbyte-sim/wallet")).body.balanceFormatted, "24.90");
  assert.ok((await activityActions()).includes("quotation_approved"));

  // Approving twice is refused; the dashboard no longer lists it as pending.
  assert.equal((await call("POST", `/quotes/${draft.id}/approve`, { appointmentDate: MONDAY, approverName: "Faizal" })).status, 409);
  assert.equal((await call("GET", "/dashboard/summary")).body.counts.pendingQuotations, 0);
});

test("Approvals - manager can decline a draft; declined drafts cannot be approved later", async () => {
  const draft = (await call("POST", "/quotes", { customerName: "Decline Me", serviceCode: "chemical_wash", quantity: 1, requestedDate: MONDAY, location: "Cheras", requestedBy: "Mei" })).body;
  assert.equal((await call("POST", `/quotes/${draft.id}/reject`, { reason: "Customer cancelled", managerName: "Mei" })).status, 403);
  const rejected = await call("POST", `/quotes/${draft.id}/reject`, { reason: "Customer cancelled", managerName: "Faizal" });
  assert.equal(rejected.status, 200);
  assert.equal(rejected.body.status, "rejected");
  assert.equal(rejected.body.rejectionReason, "Customer cancelled");
  assert.equal((await call("POST", `/quotes/${draft.id}/approve`, { appointmentDate: MONDAY, approverName: "Faizal" })).status, 409);
  assert.equal((await call("GET", "/dashboard/summary")).body.counts.rejectedQuotations, 1);
  const entry = (await call("GET", "/activity")).body.find((a) => a.action === "quotation_rejected");
  assert.match(entry.description, /Customer cancelled/);
  assert.equal((await call("GET", "/quotes/999/schedule-options")).status, 404);
});
