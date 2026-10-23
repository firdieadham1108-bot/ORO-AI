import { test } from "node:test";
import assert from "node:assert/strict";
import { eventView, groupActivity, groupHeadline, type FeedEvent } from "./activity-feed.ts";

const event = (id: number, action: string, description = "", overrides: Partial<FeedEvent> = {}): FeedEvent => ({
  id, action, description, actor: "System", severity: "info",
  createdAt: `2026-10-23T04:00:0${id}.000Z`, ...overrides,
});
test("quote history keeps every event, not the wallet charge as its headline", () => {
  const rows = [
    event(1, "quotation_approved", "Faizal approved quotation ORO-1024 for Cheras Office (Cheras): install, total RM 1,140.00. Appointment: Mon 26 Oct 2026."),
    event(2, "orbyte_credits_deducted", "Credits deducted for approving ORO-1024."),
  ];
  const groups = groupActivity(rows);
  assert.equal(groups.length, 1);
  assert.equal(groups[0].events.length, 2);
  const view = eventView(groupHeadline(groups[0]));
  assert.equal(view.customer, "Cheras Office");
  assert.match(view.summary, /RM 1,140.00/);
  assert.equal(view.tone, "green");
});
test("contiguous analysis steps collapse without losing warnings", () => {
  const groups = groupActivity([
    event(1, "enquiry_analysed"),
    event(2, "price_calculated", "2 x RM160.00 = RM320.00"),
    event(3, "scheduling_conflict_detected", "Friday unavailable", { severity: "warning" }),
    event(4, "alternative_suggested"),
  ]);
  assert.equal(groups.length, 1);
  assert.equal(groups[0].events.filter(e => e.severity === "warning").length, 1);
  assert.equal(eventView(groups[0].events[1]).tone, "red");
});
test("separate enquiries and unrelated events never merge by proximity", () => {
  const groups = groupActivity([
    event(1, "enquiry_analysed"),
    event(2, "price_calculated"),
    event(3, "enquiry_analysed"),
    event(4, "price_calculated"),
    event(5, "demo_reset", "", { severity: "warning" }),
    event(6, "availability_checked"),
  ]);
  assert.deepEqual(groups.map(g => g.events.length), [1, 1, 2, 2]);
});
test("same quote on separate Malaysia dates stays in separate histories", () => {
  assert.equal(groupActivity([
    event(1, "quote_created", "ORO-1024", { createdAt: "2026-10-23T15:59:00Z" }),
    event(2, "quotation_approved", "ORO-1024", { createdAt: "2026-10-23T16:01:00Z" }),
  ]).length, 2);
});
test("missing information, unknown actions and warning overrides are readable", () => {
  assert.equal(eventView(event(1, "enquiry_analysed", "", { severity: "warning" })).title, "Enquiry needs clarification");
  assert.equal(eventView(event(2, "VOICE_TRANSCRIBED", "", { severity: "warning" })).tone, "amber");
  assert.equal(eventView(event(3, "new_event")).title, "New event");
  assert.deepEqual(groupActivity([]), []);
});
