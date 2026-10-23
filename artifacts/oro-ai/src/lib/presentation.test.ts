import { test } from "node:test";
import assert from "node:assert/strict";
import { createElement } from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { QuoteDocument, type QuoteDocData } from "../components/quote-document";
import { QuoteTerms } from "../components/quote-terms";
import { quoteToDoc } from "./quote-doc";
import type { Quote } from "@workspace/api-client-react";

const doc: QuoteDocData = {
  companyName: "Demo", reference: null, status: "draft", customerName: "Demo customer",
  location: "Cheras", lines: [], totalPrice: 160, requestedDate: "2026-10-23",
  promisedDate: null, crew: [], crewIsProposal: true, approvedBy: null, approvedAt: null,
};
test("unsaved preview is not presented as a submitted draft", () => {
  const html = renderToStaticMarkup(createElement(QuoteDocument, { q: doc }));
  assert.match(html, /Preview · not submitted/);
  assert.match(html, /not saved or submitted/);
  assert.doesNotMatch(html, /awaiting manager approval/);
});
test("submitted draft is pending, not booked", () => {
  const html = renderToStaticMarkup(createElement(QuoteDocument, { q: { ...doc, reference: "ORO-1001" } }));
  assert.match(html, /awaiting manager approval/i);
  assert.match(html, /not a confirmed booking/);
});
test("declined saved quotations keep their declined status in the printable document", () => {
  const q = quoteToDoc({ ...doc, status: "rejected", reference: "ORO-1001",
    lineItems: [], riskStatus: null, appointmentDate: null, rejectionReason: "Customer cancelled" } as unknown as Quote);
  const html = renderToStaticMarkup(createElement(QuoteDocument, { q }));
  assert.equal(q.status, "rejected");
  assert.match(html, /Declined · not booked/);
  assert.match(html, /Customer cancelled/);
  assert.doesNotMatch(html, /approved by|awaiting manager approval/);
});
for (const submitted of [false, true]) {
  test(`expired availability check explains ${submitted ? "pending" : "unsubmitted"} state`, () => {
    const html = renderToStaticMarkup(createElement(QuoteTerms, {
      hasSlot: true, submitted, reverifying: false, onReverify: () => {},
      hold: { expired: true, remaining: 0, fraction: 0, expireNow: () => {} },
    }));
    assert.match(html, /Availability check expired/);
    assert.match(html, submitted ? /stays in Pending/ : /Expiry does not add/);
    assert.doesNotMatch(html, /crew is released|HOLD EXPIRED/);
  });
}
test("running check is clearly a simulation, not a reservation", () => {
  const html = renderToStaticMarkup(createElement(QuoteTerms, {
    hasSlot: true, reverifying: false, onReverify: () => {},
    hold: { expired: false, remaining: 20, fraction: 2 / 3, expireNow: () => {} },
  }));
  assert.match(html, /not a crew reservation/);
  assert.match(html, /20/);
});
