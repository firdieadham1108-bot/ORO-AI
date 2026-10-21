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

- `artifacts/api-server/src/lib/oro/` — `db.ts` (4 tables: staff, capacity_blocks, quotes, activity_log), `seed.ts` (synthetic data), `availability.ts`, `parser.ts` (rule-based enquiry extraction), `services.ts` (price list)
- `artifacts/api-server/src/routes/oro.ts` — API routes; contract in `lib/api-spec/openapi.yaml`
- `artifacts/oro-ai/src/pages/` — availability, new enquiry, quotes, quote preview, activity log

## Architecture decisions

- Availability, prices and parsing are deterministic code, never AI. Availability uses real datetime overlap against 09:00-17:00 Malaysia time.
- "Today" is fixed at 2026-10-21 (override with `ORO_REFERENCE_DATE`) so "this Friday" always resolves to 23 Oct 2026.
- Prices are stored in sen (integers). Totals are computed on the server.

## Scope

Phase 1 and 2 only (setup, seeded data, quotation). Crew feasibility checks, alternative dates, approval and risk monitoring are not built yet.
