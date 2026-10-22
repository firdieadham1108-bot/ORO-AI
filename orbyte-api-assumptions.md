# Orbyte API Assumptions

ORO AI does **not** connect to the real Orbyte system. We do not have Orbyte API credentials or API documentation.
Every Orbyte record in this prototype is **synthetic** and is stored in a local SQLite database.
The app shows the label **"Demo Environment - Simulated Orbyte Data"** on every screen.

This document explains:

1. Which Orbyte modules we simulate, and the mock adapter for each.
2. What each adapter method does today (mock), and the real Orbyte API call we *assume* could replace it.
3. The data shapes and rules we assumed.
4. What would need to change to connect to the real Orbyte.

All four adapters are in one file: [`artifacts/api-server/src/lib/oro/orbyte-adapters.ts`](artifacts/api-server/src/lib/oro/orbyte-adapters.ts).

---

## Why adapters?

The core business logic covers availability, pricing, approval and risk monitoring. It never reads Orbyte data directly.
It only calls these four adapters:

```
 Core logic (availability.ts, approval.ts, quotes.ts, risk.ts)
        |
        v
 +------------------------------+     today:  local SQLite tables (synthetic data)
 |  MockOrbytePeopleAdapter     | --> staff
 |  MockOrbyteLeaveAdapter      | --> capacity_blocks (kind = 'leave')
 |  MockOrbyteWorkAdapter       | --> capacity_blocks (kind = 'assignment')
 |  MockOrbyteApprovalAdapter   | --> staff.role
 +------------------------------+     later:  real Orbyte REST APIs (assumed)
```

To connect to the real Orbyte later, we would write `OrbytePeopleAdapter` (and the other three) with the **same method names and return shapes**,
then swap them in. The scheduling math, the crew rules and the price list do not need to change.

Current limitation: the mock adapters are synchronous because SQLite in Node is synchronous.
Real HTTP adapters would be asynchronous (`async`/`await`), so the callers would need small changes to `await` them.

---

## Shared data shapes

```ts
interface OrbyteStaff {
  id: number;
  name: string;           // e.g. "Bala"
  role: string;           // e.g. "Senior Installation Technician", "Business Manager"
  isSenior: boolean;      // can lead an installation crew
  canInstall: boolean;    // qualified installation technician
  dispatchOrder: number;  // manager's preferred order when several people are free (1 = first)
}

interface OrbyteCapacityRecord {
  id: number;
  staffId: number;
  kind: "leave" | "assignment";
  title: string;          // e.g. "Approved annual leave", "Taman Desa installation"
  startAt: string;        // ISO 8601 with Malaysia offset, e.g. "2026-10-23T09:00:00+08:00"
  endAt: string;
  reference: string;      // eLeave approval no. (e.g. "SIM-ELEAVE-0142") or Work job no. (e.g. "SIM-WORK-TD-2310", "ORO-1023")
  quoteId: number | null; // set when the assignment was created by an ORO AI approval
}
```

---

## 1. `MockOrbytePeopleAdapter`: Orbyte People / Directory

Employee profiles and skills.

| Method | What the mock does | Assumed real Orbyte API |
|---|---|---|
| `listStaff()` | Reads all rows from `staff` | `GET /people/employees?include=skills` |
| `findByName(name)` | Looks up one employee by first name | `GET /people/employees?search={name}` |
| `findById(id)` | Looks up one employee by id | `GET /people/employees/{id}` |

**Assumptions**
- Orbyte People can tell us whether an employee is a **qualified installer** and whether they are **senior**.
  We assume this comes from skills, certifications or job title. In the mock these are the `can_install` and `is_senior` flags.
- `dispatchOrder` is **not** an Orbyte field. It is an ORO AI setting (the manager's preferred pick order).
  With the real Orbyte it would be stored on the ORO AI side.

**Synthetic data:** Ali (senior), Bala (senior), Mei, Chong (senior), Faizal (Business Manager).

---

## 2. `MockOrbyteLeaveAdapter`: Orbyte People / eLeave

Approved leave records.

| Method | What the mock does | Assumed real Orbyte API |
|---|---|---|
| `listApprovedLeave()` | Reads `capacity_blocks` rows where `kind = 'leave'` | `GET /eleave/requests?status=approved&from=&to=` |
| `findLeave(staffId, reference)` | Finds one approved leave by approval number | `GET /eleave/requests/{reference}` |
| `recordApprovedLeave(leave)` | Inserts a leave row. Used by the demo button **"Simulate Orbyte Event: Approve Bala's Emergency Leave"** | Not called by us in real life. Orbyte would **send** a webhook, e.g. `POST {our-url}/webhooks/eleave` with event `leave.approved` |

**Assumptions**
- Only **approved** leave blocks a technician. Pending or rejected leave is ignored.
- Leave has a start and end **date-time**. A full day of leave is stored as `00:00` to `00:00` the next day (Malaysia time).
  Overlap is calculated with real date-times, not just calendar dates.
- ORO AI **never blocks** a leave approval. It only reacts to it, by flagging affected jobs as `AT_RISK` and recommending a replacement.
- For privacy (PDPA), ORO AI shows only the leave **reference number**, never the leave reason.

**Synthetic data:** Ali's approved annual leave on Friday 23 Oct 2026 (`SIM-ELEAVE-0142`).
The demo event adds Bala's emergency leave on Monday 26 Oct 2026 (`LV-0499`).

---

## 3. `MockOrbyteWorkAdapter`: Orbyte Work

Jobs, tasks and technician assignments.

| Method | What the mock does | Assumed real Orbyte API |
|---|---|---|
| `listAssignments()` | Reads `capacity_blocks` rows where `kind = 'assignment'` | `GET /work/assignments?from=&to=` |
| `assignmentsForQuote(quoteId)` | The crew booked for one ORO AI quotation | `GET /work/jobs/{jobId}/assignments` |
| `createAssignment(a)` | Inserts one assignment row per crew member when the manager approves a quotation | `POST /work/jobs` (one job), then `POST /work/jobs/{jobId}/assignments` (one per technician) |
| `reassign(quoteId, fromStaffId, toStaffId)` | Swaps one technician on a job after a recovery approval | `PATCH /work/jobs/{jobId}/assignments/{assignmentId}` with the new `employeeId` |

**Assumptions**
- Every assignment has a start and end date-time. ORO AI's standard window is **09:00-17:00 Malaysia time** on working days (Mon-Fri).
- A technician with **any** assignment that overlaps the window is treated as unavailable for an installation that day.
- Creating the job in Orbyte Work and saving the approved quotation should happen together. The mock does both in one SQLite transaction.
  With a real API this would need a retry or rollback step, because two systems cannot share one transaction.

**Synthetic data:** on Friday 23 Oct 2026, Bala (`SIM-WORK-TD-2310`), Mei (`SIM-WORK-BJ-2311`) and Chong (`SIM-WORK-AM-2312`) are all booked.

---

## 4. `MockOrbyteApprovalAdapter`: Orbyte approval workflows and permissions

| Method | What the mock does | Assumed real Orbyte API |
|---|---|---|
| `canApprove(name)` | Returns the person if their role is `Business Manager`, otherwise nothing | `GET /permissions/check?user={id}&action=quotation.approve` or the role from the signed-in Orbyte session |

**Assumptions**
- Only the **Business Manager** (Faizal) may approve a quotation or a crew change. Sales staff (Mei) can analyse enquiries but cannot approve.
- **This is not real login.** The header switch (Sales Staff (Mei) / Manager (Faizal)) only tells the server who is clicking.
  The server refuses non-managers with HTTP 403. A real version would use Orbyte single sign-on, and the user's identity would come from the session, not from the request body.

---

## What is NOT assumed to come from Orbyte

These belong to ORO AI itself and stay in its own database:

- **Price list** (`services.ts`): 1.0HP installation RM160, 1.5HP installation RM190, standard servicing RM80, chemical wash RM150 (per unit).
- **Quotations** (`quotes` table), including quotation status (`approved`) and the separate risk status (`FEASIBLE` / `AT_RISK`).
- **Activity log** (`activity_log` table). A real version could also copy these entries to Orbyte's activity feed.
- **Enquiry parsing**: rule-based English / Bahasa Melayu / Chinese keyword extraction. No AI model is used.

---

## Checklist to connect the real Orbyte later

1. Get API credentials and documentation from Orbyte. Store keys as **Replit Secrets**, never in code or in Git.
2. Write real adapters with the same method names and return shapes, using `async` HTTP calls.
3. Replace the demo leave button with a real eLeave webhook endpoint, and verify the webhook signature.
4. Replace the name-based role switch with Orbyte sign-in and permission checks.
5. Keep running `npm test`. The 10 required tests describe the expected behaviour and should still pass against a test Orbyte tenant with matching data.
