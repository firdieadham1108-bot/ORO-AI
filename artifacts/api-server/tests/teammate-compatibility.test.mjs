import { test, beforeEach } from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
import os from "node:os";
import path from "node:path";

const BASE = process.env.ORO_API_URL;
const db = process.env.ORO_DB_PATH;
if (!BASE || !db || !path.resolve(db).startsWith(path.join(os.tmpdir(), "oro-ai-tests-"))) {
  throw new Error("Run npm test: this suite requires the runner's isolated temporary database.");
}
const pack = JSON.parse(fs.readFileSync(new URL("./fixtures/teammate-compatibility.json", import.meta.url)));
const review = JSON.parse(fs.readFileSync(new URL("./fixtures/catalogue-review.json", import.meta.url)));
async function post(route, body = {}) {
  const response = await fetch(`${BASE}${route}`, {
    method: "POST", headers: {"content-type":"application/json"}, body: JSON.stringify(body),
  });
  assert.equal(response.status, 200);
  return response.json();
}
beforeEach(async () => { await post("/demo/reset"); });

for (const fixture of pack.cases) {
  test(`Teammate ${fixture.id}: current-app compatibility, not proposed policy`, async () => {
    const result = await post("/enquiry", {message:fixture.message});
    assert.equal(result.analysis.referenceDate, pack.referenceDate);
    if (fixture.expected.totalSen === null) {
      assert.equal(result.pricing, undefined, fixture.expected.reason);
      assert.equal(result.status, "needs_clarification");
      assert.ok(result.analysis.missing.length > 0);
    } else {
      assert.equal(Math.round(result.pricing.totalPrice * 100), fixture.expected.totalSen);
      assert.equal(result.analysis.requestedDate, fixture.expected.requestedDate);
      if (fixture.expected.requestedDate === null) {
        assert.equal(result.status, "needs_clarification");
        assert.equal(result.requestedSchedule, undefined);
      }
    }
    if (fixture.id === "E01" || fixture.id === "E02") {
      assert.equal(result.analysis.serviceCode, "install_1_5hp");
      assert.equal(result.requestedSchedule.requirement.crewSize, 2);
      assert.equal(result.requestedSchedule.requirement.minSeniors, 1);
    }
  });
}

const languageCases = [
  ["EN exclusion", "Service 2 units at Cheras this Friday, no chemical wash.", 160, "standard_service"],
  ["BM exclusion", "Servis biasa 3 biji dekat Cheras Jumaat, bukan chemical wash.", 240, "standard_service"],
  ["Chinese exclusion", "蕉赖星期五保养两台冷气，不要化学清洗。", 160, "standard_service"],
  ["Contrast", "Not chemical wash but service 2 units at Cheras Friday.", 160, "standard_service"],
  ["Positive chemical", "Chemical wash 2 units in Cheras Friday, no repair.", 300, "chemical_wash"],
  ["Existing services are infrastructure", "Install 1 wall aircon 1.5HP at Cheras Monday, existing services suitable.", 190, "install_1_5hp"],
  ["Original 1HP price", "Install 2 units 1HP in Cheras Monday.", 320, "install_1_0hp"],
];
for (const [name,message,total,serviceCode] of languageCases) {
  test(`Scope regression: ${name}`, async () => {
    const r = await post("/enquiry", {message});
    assert.equal(r.pricing?.totalPrice, total);
    assert.equal(r.analysis.serviceCode, serviceCode);
    assert.equal(r.analysis.items.length, 1);
  });
}
for (const message of [
  "No chemical wash at Cheras Friday.",
  "Service 1 unit at Cheras Monday, no chemical wash and install 2 units 1.5HP.",
  "Servis 1 biji dekat Cheras Isnin, bukan chemical wash dan pasang 2 biji 1.5HP.",
  "Install 1 unit 1.5HP plus extra copper 7.5 feet in Cheras Monday.",
  "Install 1 unit 1.5HP and repair another aircon at Cheras Monday.",
  "Install 1 unit 2HP in Cheras Monday.",
  "Normal cleaning wall aircon in Cheras Monday, quantity unknown.",
]) {
  test(`Unpriced requests never become complete quotes: ${message}`, async () => {
    const r = await post("/enquiry", {message});
    assert.equal(r.pricing, undefined);
    assert.equal(r.status, "needs_clarification");
  });
}
test("Catalogue mapping explicitly separates proposed rates from current rates", () => {
  assert.equal(review.services.length, 9);
  const oneHp = review.services.find(s => s.sourceCode === "INSTALL_WALL_10HP");
  assert.equal(oneHp.proposedRateSen, 17000);
  assert.equal(oneHp.currentRateSen, 16000);
  assert.equal(oneHp.disposition, "revise");
  assert.ok(review.services.filter(s=>s.disposition==="defer").every(s=>s.currentCode===null));
});
