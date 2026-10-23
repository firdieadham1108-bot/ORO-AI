# Teammate data: compatibility pack, not demo seed data

The user approved the conservative integration recommendation: keep current prices,
supported services and stage-demo scenarios. Do not seed these examples into the
running app or replace the TypeScript engine with the teammate's Python engine.

## Shared catalogue decision

The runtime source of truth remains `src/lib/oro/services.ts`:

| Service | Approved demo price |
| --- | --- |
| 1.0HP installation | RM160/unit |
| 1.5HP installation | RM190/unit |
| Standard servicing | RM80/unit |
| Chemical wash | RM150/unit |

`catalogue-review.json` is an explicit source-code mapping for review, not an
automatic importer. `INSTALL_WALL_10HP` needs its RM170 expectation revised to
RM160. Compatible prices are not approval of the proposed labour-only scope,
material exclusions or new HP-specific restrictions. Never send uppercase
teammate codes directly into scheduling: installations use the current
`install_*` codes and require two technicians including one senior.

## Keep / revise / defer

- **Keep:** synthetic-data labels, integer-sen arithmetic, null for unknown facts,
  separately recorded pricing/scheduling/approval outcomes, and readable test cases.
- **Revise:** 1.0HP price, service-code mapping, assumptions presented as facts,
  expected extraction vs calculator outcomes, and dates. Use 21 October 2026 as
  the demo reference; “this Friday” resolves to 23 October 2026.
- **Defer pending explicit business approval:** 2.0HP installation, HP-tiered
  servicing, dismantling/reinstallation, copper measurements, inspection pricing,
  labour/material inclusions, 14-day validity and tax policy. New work also needs
  crew/skills/duration rules, parser support and approval-path tests.

## Test expectations

The original ten messages and their proposed totals are retained in
`teammate-compatibility.json`. `expected` is the **current app's** expectation;
do not replace it with the teammate's proposed total:

- E01/E02: supported 1.5HP pricing and existing scheduling checks.
- E05: RM300 pricing is possible, but the absent appointment date still requires
  clarification. It must not become an approved or booked job.
- E03/E04: mixed-capacity requests require explicit item-by-item confirmation,
  rather than silently charging for the first count encountered.
- E06/E07/E08/E10: unapproved work cannot yield a complete quotation.
- E09: missing quantity stays unknown, not zero.

The English/Bahasa Melayu/Chinese regression cases in the test suite cover short
messages, exclusions, positive requests, unsupported work and missing quantities.
The parser remains rule-based. Negation handling is conservative and limited to
recognised clauses, not a claim of general natural-language understanding.

Run `npm test` from the repository root. The runner creates a private server and
temporary SQLite database, then deletes it. Do not run API tests against the live
demo or call its Reset button. No fixture is imported by production code.

## Provenance

Derived from the supplied archive's `oro_ai_member2_deliverables` JSON files.
The original archive is unchanged. Its Python test report is teammate-provided
evidence, not a test result for this application. This pack exercises the existing
TypeScript app over HTTP and asserts its own compatibility expectations.
