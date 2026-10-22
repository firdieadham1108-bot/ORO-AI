# ORO AI

Quotation and staffing-availability workspace for the fictional CoolAir Services Sdn Bhd (SDC Hackathon 2026, Orbyte Smart SME challenge). All data is synthetic; Orbyte integrations are simulated. Full brief: `MASTER_BRIEF.md`.

## Run & Operate

- API server: workflow `artifacts/api-server: API Server`; web app: `artifacts/oro-ai: web`
- `pnpm run typecheck` — full typecheck
- `npm test` — 19 tests: the 10 required brief tests + extra, voice, wallet, dashboard, staff schedule and draft-approval checks, against an isolated test server + temp database (speech keys blanked)
- `PORT=5999 BASE_PATH=/ pnpm --filter @workspace/oro-ai run build` — production build check (vite.config.ts requires both env vars; deployment supplies them)
- `pnpm --filter @workspace/api-spec run codegen` — regenerate hooks and Zod schemas after editing `lib/api-spec/openapi.yaml`
- Quick check: `curl localhost:80/api/staff/availability?date=2026-10-23`

## Stack

- pnpm workspaces, Node 24, TypeScript, Express 5, React + Vite + Tailwind
- Storage: SQLite via Node's built-in `node:sqlite` (file `artifacts/api-server/data/oro.db`, git-ignored, auto-created and seeded)

## Where things live

- `artifacts/api-server/src/lib/oro/` — `db.ts` (4 tables: staff, capacity_blocks, quotes, activity_log), `seed.ts` (synthetic data), `availability.ts`, `parser.ts` (rule-based enquiry extraction), `services.ts` (price list), `scheduling.ts` (crew rules, feasibility, alternative dates), `enquiry.ts` (one-call workflow behind `POST /api/enquiry`)
- `artifacts/api-server/tests/` — `npm test` (root) runs `runTests.mjs`: builds a private copy into `.test-build/`, starts it on a free port with a temp SQLite DB (`ORO_DB_PATH`), runs the 10 required brief tests in `required.test.mjs`. Never touches the dev demo data.
- `artifacts/api-server/src/lib/oro/orbyte-adapters.ts` — the 4 Mock Orbyte adapters (People, Leave, Work, Approval); core logic reads/writes Orbyte-type data only through them. Documented in `orbyte-api-assumptions.md`.
- `README.md`, `LICENSE` (Apache 2.0, unmodified official text), `orbyte-api-assumptions.md` at the root
- `artifacts/api-server/src/routes/oro.ts` — API routes; contract in `lib/api-spec/openapi.yaml`
- `artifacts/oro-ai/src/components/shell.tsx` — app shell: desktop sidebar (>=1024px), icon rail on tablets, bottom tabs + "More" sheet on phones, role switch, reset button, reference-date chip. `src/components/kit.tsx` = shared page header/badges/empty states; `src/lib/dates.ts` = Malaysia-time date labels
- Pages (`artifacts/oro-ai/src/pages/`, routes in `App.tsx`): `dashboard.tsx` (`/`, counts from `GET /api/dashboard/summary`), `workspace.tsx` (`/enquiry`, the New Enquiry screen: enquiry input left, approval card with Option A/B right; Sales can "Send to Manager for approval" which creates a draft via `POST /api/quotes`), `quotations.tsx` (`/quotations`, `?open=<id>` opens the printable quote), `schedule.tsx` (`/schedule`, week board from `GET /api/staff/schedule?from&days`), `approvals.tsx` (`/approvals`, drafts re-checked via `GET /api/quotes/{id}/schedule-options`, then `POST /api/quotes/{id}/approve` or `/reject`), `risk-monitor.tsx` (`/risk`), `activity.tsx` (`/activity`)
- `artifacts/api-server/src/lib/oro/approval.ts` + `quotes.ts` — `POST /api/approvals` re-checks the chosen date, saves an approved quote, reserves the crew (assignment rows in capacity_blocks with `quote_id`) and logs it
- `artifacts/api-server/src/lib/oro/risk.ts` — `POST /api/orbyte-sim/emergency-leave` (Bala, Mon 26 Oct, eLeave LV-0499), `GET /api/commitments`, `POST /api/commitments/:id/recover` (manager only, re-checked in a transaction)
- `artifacts/oro-ai/src/components/risk.tsx` — simulation bar and red COMMITMENT AT RISK / recovery card
- Voice-to-Quote: `artifacts/api-server/src/lib/oro/voice.ts` (`POST /api/enquiry/transcribe`, logs `VOICE_TRANSCRIBED`) + `artifacts/oro-ai/src/components/voice-input.tsx`. Sample clip: `artifacts/oro-ai/public/samples/contractor-voice-note-cheras-condo.mp3` (synthetic TTS voice).
- Simulated Orbyte Credit Wallet: `artifacts/api-server/src/lib/oro/wallet.ts` (`GET /api/orbyte-sim/wallet`) + `artifacts/oro-ai/src/components/wallet-badge.tsx` (in the demo banner)
- Price validity (7 days) vs. 30s crew-slot hold: `artifacts/oro-ai/src/components/quote-terms.tsx`, used by the approval card
- PWA: `artifacts/oro-ai/public/manifest.json`, `public/icons/` (generated with ImageMagick from `public/favicon.svg`, navy `#0F1E33` + gold `#B99545`), `public/sw.js` (cache `oro-offline-v2`) + `offline.html`; meta tags in `index.html`
- Look & feel: tokens in `src/index.css` (navy `#0F1E33`, gold `#B99545`, gold-soft `#F3EBD7`, bg `#F6F5F2`, green/amber/red status colours), fonts Inter (body), Manrope (headings), IBM Plex Mono (references, times). Wordmark: "ORO" navy / "AI" gold.

## Architecture decisions

- Availability, prices and parsing are deterministic code, never AI. Availability uses real datetime overlap against 09:00-17:00 Malaysia time.
- "Today" is fixed at 2026-10-21 (override with `ORO_REFERENCE_DATE`) so "this Friday" always resolves to 23 Oct 2026.
- Prices are stored in sen (integers). Totals are computed on the server.
- Demo crew rule: installation needs 2 technicians incl. 1 senior, 8-hour window (09:00-17:00). Other services need 1 technician. Working days are Mon-Fri, so weekends are never suggested. These are fictional business rules.
- When several technicians are free, the scheduler picks by `staff.dispatch_order` (Bala, Mei, Chong, Ali), so the Monday crew is Bala + Mei and Chong is the first stand-in for Bala, as in the brief.
- Quote numbers are `ORO-<1022+id>`, so the first quote after a reset is ORO-1023.
- The manager check on approval and recovery is a name lookup (Faizal, role Business Manager), not real login. The header role switch (Sales Staff (Mei) / Manager (Faizal), kept in localStorage) sends that name; the server answers 403 for non-managers.
- Parsing understands English, Bahasa Melayu and Chinese keywords. A message with several services becomes several line items; a quote's total is the sum of its lines, and the installation line (if any) sets the crew rule.
- Voice layer returns text only; the web app puts it in the editable message box and calls the normal `/enquiry`. STT provider order: `OPENAI_API_KEY` (whisper-1) > Replit AI Integrations env (gpt-4o-mini-transcribe) > labelled "Simulated Demo Transcription". The sample button is always simulated; a failed STT call falls back to the labelled sample, never silently. Audio is sent as base64 JSON (15 MB body limit on that route only); nothing is stored.
- Wallet balance = 25.00 - 0.10 x (number of `orbyte_credits_deducted` rows in activity_log); charged inside the approval/recovery transaction, so refusals cost nothing and Reset restores 25.00. No extra table.
- The 30s crew hold is front-end only (labelled "Demo Simulation"); it locks nothing. After expiry the approve buttons stay disabled until "Re-verify Availability" re-runs `/enquiry`. Real protection remains the server re-check at approval.
- Service worker is online-first (navigation fallback to `offline.html`, no data caching) and registered only in the production build, so it never touches the Vite dev server.
- Only 1.0HP and 1.5HP installation are on the price list. Any other size (e.g. 2.0HP) gives `needs_clarification` instead of a made-up price.
- Draft approval updates the same quote row (status draft -> approved/rejected, no duplicate). Approve reuses the same schedule re-check, crew reservation and 0.10-credit charge as `POST /api/approvals`; reject logs `quotation_rejected` with the optional reason. Both answer 403 for non-manager names.
- The Staff Schedule page is read-only: it only displays capacity_blocks (eLeave leave, Orbyte Work jobs, ORO bookings). Leave blocks are shown as "All day".
- The enquiry parser is rule-based; the New Enquiry page says so in a small badge ("rule-based parser (no AI model connected)").

## Scope

Phases 1-3, manager approval (reserves the crew), Sprint 4 (Optional C+D): simulated eLeave event, at-risk detection and manager-approved recovery, and Sprint 5: Reset Demo State button, demo role switch with lock badges, 4 preset scenario chips, printable quotation modal, Sprint 7 (Optional A): Voice-to-Quote input, Sprint 8: simulated Orbyte Credit Wallet, price validity vs. crew-hold timer, mobile layout + installable PWA (Optional B), Sprint 9: navy/gold redesign with the brief's pages (Dashboard, New Enquiry, Quotations, Staff Schedule, Manager Approval queue with draft -> approve/decline, Risk Monitor, Activity Log) and mobile bottom navigation. Not built: real auth, offline mode, Settings page, Postgres (kept SQLite, 4 tables), the blueprint's multi-step wizard.
