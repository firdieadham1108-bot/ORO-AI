# Page header

Source: artifacts/oro-ai/src/components/kit.tsx
Provenance: local ORO AI application, extracted 2026-10-22; Apache-2.0.
Public exports: PageHeader.
Build chunk: 1. Status: implemented.

Full implementation retained in source-kit.tsx / source-button.tsx and source-theme.css in the parent references folder. Pilot copied directly with import-only adaptations; component props, logic and default values preserved. Usage evidence: pages/dashboard.tsx, approvals.tsx, activity.tsx and schedule.tsx use kit primitives; button is the app UI-library action primitive.

Validation: compare source exports/defaults/variants with port; render light and dark; check keyboard/focus/disabled behavior where applicable. Dark semantic styles are derived, not a claim of existing screen fidelity.
