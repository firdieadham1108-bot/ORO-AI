// Acceptance tests from MASTER_BRIEF.md (Part 15), run against the live API over HTTP.
//   Test 1 - Correct quotation
//   Test 3 - Unavailable date
//   Test 4 - Available alternative
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
