---
name: ORO AI scope and storage decisions
description: Decisions for the ORO AI hackathon prototype (formerly QuoteGuard) that the code does not explain
---

- Product is named ORO AI (user renamed it from QuoteGuard). Full brief is in MASTER_BRIEF.md.
- Backend uses SQLite via Node's built-in `node:sqlite` with exactly 4 tables (staff, capacity_blocks, quotes, activity_log), not Postgres.
  **Why:** the user explicitly asked for SQLite and 4 tables; an earlier Postgres design was discarded.
  **How to apply:** do not add tables or reintroduce Postgres without being asked. The `lib/db` package is unused.
- The user restricts each session to named phases/sprints of the brief (done so far: Phases 1-3, single-page approval, Sprint 4 risk monitoring + recovery, Sprint 5 demo polish: reset, role switch, scenario chips, printable quote; Sprint 6 npm test suite + README/LICENSE/adapter docs; Sprint 7 voice-to-quote; Sprint 8 credit wallet, hold timer, PWA).
  **How to apply:** do not start other features (extra pages, mobile nav menu, real auth, offline mode) until named.
- The user wants ONE workspace page (enquiry left, approval card right), not separate pages.
  **Why:** the user asked for this explicitly.
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
