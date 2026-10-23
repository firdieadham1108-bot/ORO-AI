# ORO AI redesign pilot: provenance and rationale

Scope: two screens (Dashboard, New Enquiry), canvas-only, inside `artifacts/mockup-sandbox`.
Nothing under `artifacts/oro-ai`, `artifacts/oro-design-system`, the API or the database was changed.

## Routes (hash router in `src/ds/oro-design-system/App.tsx`)

Base: `/__mockup/src/ds/oro-design-system/?state=<state>#/<Name>`

| Name | What it is | `?state=` values |
| --- | --- | --- |
| `CurrentDashboard` | Baseline: port of `oro-ai/src/pages/dashboard.tsx` | `default`, `empty`, `conflict`, `loading` |
| `CurrentEnquiry` | Baseline: port of `oro-ai/src/pages/workspace.tsx` | `default` (Scenario 1 analysed), `empty`, `clarification`, `conflict`, `loading` |
| `PilotDashboard` | Redesign, DS components only | `default`, `empty`, `conflict`, `loading`, `error` |
| `PilotEnquiry` | Redesign, DS components only | `default` (Friday conflict), `empty`, `feasible`, `clarification`, `loading` |

The same Pilot components render the 1280x900 and 390x844 frames; layout folds with Tailwind `md:`/`lg:` breakpoints.
Dashboard and New Enquiry in the pilot share one in-memory store (`_pilot/store.tsx`), so "New enquiry" on the dashboard, "Go to dashboard" after approval, and the sidebar all navigate locally without a reload. Approving a quote adds it to Upcoming jobs; sending a draft adds it to Needs your attention.

## Provenance of the baselines

- `_current/app.css` is generated from `oro-ai/src/index.css` (node string transform, no hand edits): the three `@import` lines are dropped (the DS styles and the Manrope font are already loaded by `styles.css`), the `:root` alias block and the seven `@keyframes` are hoisted to top level, and every other rule is nested under `.oro-current { ... }` so the product CSS cannot leak into the pilot frames. The `@layer base` block became `& { font-feature-settings } button,input,select,textarea { font: inherit }` because the sandbox has no Tailwind `@apply` for those rules.
- `_current/shell.tsx`, `_current/parts.tsx`, `_current/lib.tsx` are line-for-line ports of `oro-ai/src/components/{shell,quote-document,quote-terms,risk,voice-input,lock-badge}.tsx` and `lib/{role,util,quote-doc}.ts` with wouter and react-query replaced by local state. Class names and markup are unchanged. The wouter `Link` stub renders the same `<a>` but never navigates. The voice bar renders its idle state only.
- `CurrentDashboard.tsx` / `CurrentEnquiry.tsx` keep the arbitrary Tailwind values from the source verbatim (they are part of the baseline, not a style choice).
- `_shared/sample-data.ts` mirrors `lib/api-client-react` schemas and the seed: ORO-(1022+id) references, crew of 2 incl. 1 senior for installs, dispatch order Bala, Mei, Chong, Ali, Fri 23 Oct infeasible (Ali eLeave SIM-ELEAVE-0142; Bala, Mei, Chong on jobs), Mon 26 Oct feasible, prices 1.0HP RM160 / 1.5HP RM190 / service RM80 / chemical wash RM150, reference date Wed 21 Oct 2026.

## What changed in the pilot and why

Dashboard
- One `h1` ("Dashboard"), no greeting. The DS `PageHeader` requires an eyebrow, so the eyebrow carries information (desk + reference date) instead of decoration.
- One KPI strip (DS `Card` with a 2x2 / 1x4 grid and hairline dividers) answering four operational questions: waiting for my decision, promises at risk, jobs booked ahead, crew free today. Counts that do not drive a decision (enquiries analysed, conflicts detected, rejected) were removed from the strip; they remain in the activity log.
- Colour is used only on data and status: `text-destructive` on a non-zero at-risk count, `StatusBadge`/`RiskBadge` on rows, one primary `Button` ("New enquiry").
- The at-risk promise is a DS `Alert variant="destructive"` with the recovery recommendation and a single manager action; for Sales the button is disabled and the lock is explained in words.
- Upcoming jobs: DS `Table` on desktop (sentence-case grey headers, right-aligned tabular numbers), two-line rows on the phone.
- Demo tools (simulate Bala's eLeave, reset) moved to a secondary card at the bottom of the side column, labelled as simulated. The gold "Demo environment" strip stays visible on every screen.
- Loading uses DS `Skeleton`/`SkeletonRows`; empty uses DS `Empty`; `?state=error` shows an `Alert` with "Try again".

New Enquiry
- One screen: request on the left (DS `Input`, `Textarea`, `Label`, four sample messages as outline `Button size="sm"`, one primary "Analyse enquiry"); result on the right in the order the business reasons: what the customer asked, price, crew availability, manager decision. Each is its own `Card`, so pricing and availability are never mixed.
- Unmatched free text, 2.0HP and missing sizes end in an honest clarification `Alert` with the suggested reply; price shows per-line "Not on price list" / "Size missing" badges and no total.
- The 30-second crew-hold countdown, microphone, audio upload and credit wallet are not in the pilot. The decision card states instead that the slot is locked only on approval and re-checked at that moment.
- The quotation preview is a DS `Dialog` (opened on request, never modal-first).

Shell
- Navy `bg-sidebar` navigation on desktop, DS `Sheet` menu on the phone; role switch is a DS `ToggleGroup` (Sales Mei / Manager Faizal); reference date is an outline `Badge`.
- The five pages outside the pilot stay in the navigation; choosing one shows an inline `Alert` explaining they keep the current design.

## Honest deviations and limitations

- DS `Card` ships border and shadow together; the pilot uses it as-is.
- DS `PageHeader` forces a mono uppercase eyebrow; kept, made informative.
- DS skeleton uses a shimmer animation (1.4 s); reduced-motion is respected by the DS.
- Sidebar active state uses `bg-sidebar-accent` with a gold icon, no coloured stripe.
- The Manrope `@import` sits first in `styles.css` as required by PostCSS; `Inter` and `IBM Plex Mono` come from the DS.
- `Current*` frames contain the source's arbitrary Tailwind values; `Pilot*` frames use only theme tokens (`bg-card`, `text-muted-foreground`, `border`, `bg-sidebar*`, `bg-accent`, `text-destructive`, spacing/radius scale, `tabular-nums`).
- Verified by `tsc --noEmit` and by loading every module and the compiled stylesheet through the running Vite dev server; `vite build` of the sandbox root succeeds (it only bundles the root `index.html`, not the DS entry). Render-checked once per frame (PilotDashboard 1280 and 390 `?state=conflict`, PilotEnquiry 1280 and 390 `?state=clarification`, CurrentDashboard and CurrentEnquiry 1280) with no console errors. The main agent owns the canvas frames.
