---
name: ORO AI scope and storage decisions
description: Decisions for the ORO AI hackathon prototype (formerly QuoteGuard) that the code does not explain
---

- Product is named ORO AI (user renamed it from QuoteGuard). Full brief is in MASTER_BRIEF.md.
- Backend uses SQLite via Node's built-in `node:sqlite` with exactly 4 tables (staff, capacity_blocks, quotes, activity_log), not Postgres.
  **Why:** the user explicitly asked for SQLite and 4 tables; an earlier Postgres design was discarded.
  **How to apply:** do not add tables or reintroduce Postgres without being asked. The `lib/db` package is unused.
- The user restricts each session to named phases/sprints of the brief (done so far: Phases 1-3, single-page approval, Sprint 4 risk monitoring + recovery, Sprint 5 demo polish: reset, role switch, scenario chips, printable quote; Sprint 6 npm test suite + README/LICENSE/adapter docs; Sprint 7 voice-to-quote; Sprint 8 credit wallet, hold timer, PWA; Sprint 9 navy/gold redesign + the brief's pages + mobile bottom nav + Sales-draft -> Manager-approval queue).
  **How to apply:** do not start other features (real auth, offline mode, Settings page, blueprint wizard) until named.
- Sprint 9 superseded the earlier "one workspace page" rule: the user chose "add the brief's pages with a new look, keep the engine". The enquiry -> approval flow still lives on ONE screen (New Enquiry); the other pages are views over the same data.
  **Why:** the user said the old design "pretty sucks" and uploaded a from-zero blueprint; we agreed to upgrade the look and add pages instead of rebuilding.
  **How to apply:** keep the deterministic engine, tests and protected components (risk, quote-document, quote-terms, voice-input, wallet-badge, lock-badge) unchanged in logic/text/test ids; only styling may change there.
- Brand: navy `#0F1E33` + gold `#B99545` (matches the app icon), "ORO" navy / "AI" gold wordmark, green/amber/red statuses, Inter + Manrope + IBM Plex Mono. Taken from the user's blueprint token table; the rest of that blueprint (Postgres, 14 tables, wizard, 2.0HP price, Saturday hours, renamed staff) was deliberately NOT adopted.
- The penguin on a brown rounded square with “ORO AI” text is the official user-supplied logo, replacing the generated ring/O mark. Keep the navy/gold interface rather than recolouring it to brown.
  **Why:** the user identified the uploaded penguin artwork as “our logo” and asked to add it, not redesign the app.
  **How to apply:** use the supplied artwork for brand imagery and installable icons; do not generate a replacement.
- Design-system extraction must not change any existing ORO AI screen until the user explicitly agrees to apply it.
  **Why:** the user requested extraction first and a separate application decision once it is ready; their pilot approval explicitly authorised finishing extraction without changing screens.
  **How to apply:** present the extracted library for review; approval to continue extraction is not approval to migrate screens or canvas mockups.
- The user watches the preview live while I work and presses Reset Demo State themselves (a `POST /api/demo/reset` in the API log with no agent action = the user). Do not treat an unexpected reset as a bug, and expect my curl test records to vanish mid-session.
- Crew pick order comes from `staff.dispatch_order` (Bala 1, Mei 2, Chong 3, Ali 4) so the Monday crew is Bala + Mei and the recovery picks Chong.
  **Why:** Ali and Chong are both free seniors on Monday; the user expects the recovery to find Chong "dynamically", so Chong must rank ahead of Ali.
- Demo "today" is fixed at 2026-10-21 so "this Friday" means 2026-10-23.
- The SQLite file is not persistent across redeploys; it reseeds when empty.
- Scenario 3 (Chinese, 2.0HP) intentionally ends in needs_clarification: 2.0HP is not on the brief's price list.
  **Why:** prices must come only from the price list; never invent one. Ask the user before adding a 2.0HP price.
- Browser test plans must reset the demo state before each scenario: approving Monday books Bala + Mei, so later Monday scenarios show a conflict.
- Tests must never reset the user's dev demo data: `npm test` runs against a separate server + temp DB. The user rehearses on the dev data between sessions.
  **Why:** the old test script reset the shared database; the user's own rehearsal state was found in it.
- Hackathon rules require the Apache 2.0 license (root LICENSE, package.json license field).
- Voice-to-Quote must never pass off simulated text as a real transcription: every simulated result carries the "Simulated Demo Transcription" label, and an unknown file without a key says it is NOT that file's words.
  **Why:** the user wants the stage demo to never fail, but the brief demands honesty about simulated parts.
- Browser test plans should not press Reset on the user's dev data. If a flow needs Reset/approvals, snapshot the dev DB first (`VACUUM INTO` a /tmp file) and copy the rows back afterwards.
  **Why:** the user keeps rehearsal state in the dev DB between sessions.
- The user's sprint numbering of brief parts is off by one or two (e.g. their "Part 10 Optional B" is brief Part 9; their "Part 14 reservations" is Part 12's hold rules). Map by topic, not number.
- Simulated features (credit wallet, 30s crew hold, voice transcripts) must say "simulated"/"Demo Simulation" in the UI and README; never imply real money or a real database lock.
