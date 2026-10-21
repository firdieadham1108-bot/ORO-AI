# ORO AI

Quotation and staffing-availability workspace for the fictional CoolAir Services Sdn Bhd (SDC Hackathon 2026, Orbyte Smart SME challenge). All data is synthetic; Orbyte integrations are simulated. Full brief: `MASTER_BRIEF.md`.

## Run & Operate

- API server: workflow `artifacts/api-server: API Server`; web app: `artifacts/oro-ai: web`
- `pnpm run typecheck` — full typecheck
- `pnpm --filter @workspace/api-spec run codegen` — regenerate hooks and Zod schemas after editing `lib/api-spec/openapi.yaml`
- Quick check: `curl localhost:80/api/staff/availability?date=2026-10-23`

## Stack

- pnpm workspaces, Node 24, TypeScript, Express 5, React + Vite + Tailwind
- Storage: SQLite via Node's built-in `node:sqlite` (file `artifacts/api-server/data/oro.db`, git-ignored, auto-created and seeded)

## Where things live

- `artifacts/api-server/src/lib/oro/` — `db.ts` (4 tables: staff, capacity_blocks, quotes, activity_log), `seed.ts` (synthetic data), `availability.ts`, `parser.ts` (rule-based enquiry extraction), `services.ts` (price list), `scheduling.ts` (crew rules, feasibility, alternative dates), `enquiry.ts` (one-call workflow behind `POST /api/enquiry`)
- `artifacts/api-server/tests/acceptance.test.mjs` — acceptance tests (Tests 1, 3, 4, 9, 10); run `pnpm --filter @workspace/api-server run test:acceptance` (resets demo data first)
- `artifacts/api-server/src/routes/oro.ts` — API routes; contract in `lib/api-spec/openapi.yaml`
- `artifacts/oro-ai/src/pages/workspace.tsx` — the single-page workspace: enquiry input (left), approval card with Option A/B and quotation preview (right)
- `artifacts/api-server/src/lib/oro/approval.ts` + `quotes.ts` — `POST /api/approvals` re-checks the chosen date, saves an approved quote, reserves the crew (assignment rows in capacity_blocks with `quote_id`) and logs it
- `artifacts/api-server/src/lib/oro/risk.ts` — `POST /api/orbyte-sim/emergency-leave` (Bala, Mon 26 Oct, eLeave LV-0499), `GET /api/commitments`, `POST /api/commitments/:id/recover` (manager only, re-checked in a transaction)
- `artifacts/oro-ai/src/components/risk.tsx` — simulation bar and red COMMITMENT AT RISK / recovery card

## Architecture decisions

- Availability, prices and parsing are deterministic code, never AI. Availability uses real datetime overlap against 09:00-17:00 Malaysia time.
- "Today" is fixed at 2026-10-21 (override with `ORO_REFERENCE_DATE`) so "this Friday" always resolves to 23 Oct 2026.
- Prices are stored in sen (integers). Totals are computed on the server.
- Demo crew rule: installation needs 2 technicians incl. 1 senior, 8-hour window (09:00-17:00). Other services need 1 technician. Working days are Mon-Fri, so weekends are never suggested. These are fictional business rules.
- When several technicians are free, the scheduler picks by `staff.dispatch_order` (Bala, Mei, Chong, Ali), so the Monday crew is Bala + Mei and Chong is the first stand-in for Bala, as in the brief.
- Quote numbers are `ORO-<1022+id>`, so the first quote after a reset is ORO-1023.
- The manager check on recovery is a name lookup (Faizal, role Business Manager), not real login.

## Scope

Phases 1-3, manager approval (reserves the crew), and Sprint 4 (Optional C+D): simulated eLeave event, at-risk detection and manager-approved recovery. One workspace page. Not built: voice-to-quote, PWA, real auth.
