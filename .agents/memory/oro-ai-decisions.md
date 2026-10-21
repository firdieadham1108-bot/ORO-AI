---
name: ORO AI scope and storage decisions
description: Decisions for the ORO AI hackathon prototype (formerly QuoteGuard) that the code does not explain
---

- Product is named ORO AI (user renamed it from QuoteGuard). Full brief is in MASTER_BRIEF.md.
- Backend uses SQLite via Node's built-in `node:sqlite` with exactly 4 tables (staff, capacity_blocks, quotes, activity_log), not Postgres.
  **Why:** the user explicitly asked for SQLite and 4 tables; an earlier Postgres design was discarded.
  **How to apply:** do not add tables or reintroduce Postgres without being asked. The `lib/db` package is unused.
- The user restricts each session to named phases of the brief (so far: Phases 1, 2 and 3 backend).
  **How to apply:** do not build manager approval, reservations, or risk monitoring until the user names those phases; Phase 3 was API-only, so do not add UI unless asked.
- Crew pick order comes from `staff.dispatch_order` so the Monday crew matches the brief (Bala + Mei, Chong kept free as Bala's later replacement).
  **Why:** Ali is also free Monday, and without an explicit order the pick would be Ali + Mei, breaking the brief's later at-risk and recovery demo.
- Demo "today" is fixed at 2026-10-21 so "this Friday" means 2026-10-23.
- The SQLite file is not persistent across redeploys; it reseeds when empty.
