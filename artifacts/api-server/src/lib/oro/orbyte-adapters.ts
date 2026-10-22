// Mock Orbyte integration layer.
//
// ORO AI has no access to live Orbyte APIs. These four adapters stand in for the Orbyte modules
// and read/write SYNTHETIC records in the local SQLite database instead. All Orbyte data access
// in the core logic (availability, approval, risk monitoring) goes through them, so a real
// Orbyte client with the same method signatures could replace them later.
// See orbyte-api-assumptions.md at the project root for the assumed real API behind each method.
import { db } from "./db";

export interface OrbyteStaff {
  id: number;
  name: string;
  role: string;
  isSenior: boolean;
  canInstall: boolean;
  dispatchOrder: number;
}

/** A time block that makes a person unavailable: approved leave (eLeave) or a job assignment (Work). */
export interface OrbyteCapacityRecord {
  id: number;
  staffId: number;
  kind: "leave" | "assignment";
  title: string;
  startAt: string; // ISO 8601 with +08:00 offset
  endAt: string;
  reference: string; // eLeave approval number or Work job / quotation number
  quoteId: number | null; // set when the assignment was created by an ORO AI approval
}

interface StaffRow {
  id: number;
  name: string;
  role: string;
  is_senior: number;
  can_install: number;
  dispatch_order: number;
}
interface BlockRow {
  id: number;
  staff_id: number;
  kind: "leave" | "assignment";
  title: string;
  start_at: string;
  end_at: string;
  reference: string;
  quote_id: number | null;
}

const toStaff = (r: StaffRow): OrbyteStaff => ({
  id: r.id,
  name: r.name,
  role: r.role,
  isSenior: r.is_senior === 1,
  canInstall: r.can_install === 1,
  dispatchOrder: r.dispatch_order,
});
const toRecord = (r: BlockRow): OrbyteCapacityRecord => ({
  id: r.id,
  staffId: r.staff_id,
  kind: r.kind,
  title: r.title,
  startAt: r.start_at,
  endAt: r.end_at,
  reference: r.reference,
  quoteId: r.quote_id ?? null,
});

/** Orbyte People / Directory: employee profiles and skills. */
export const MockOrbytePeopleAdapter = {
  listStaff(): OrbyteStaff[] {
    return (db.prepare("SELECT * FROM staff ORDER BY id").all() as unknown as StaffRow[]).map(toStaff);
  },
  findByName(name: string): OrbyteStaff | undefined {
    const row = db.prepare("SELECT * FROM staff WHERE name = ?").get(name.trim()) as unknown as StaffRow | undefined;
    return row ? toStaff(row) : undefined;
  },
  findById(id: number): OrbyteStaff | undefined {
    const row = db.prepare("SELECT * FROM staff WHERE id = ?").get(id) as unknown as StaffRow | undefined;
    return row ? toStaff(row) : undefined;
  },
};

/** Orbyte People / eLeave: approved leave records. */
export const MockOrbyteLeaveAdapter = {
  listApprovedLeave(): OrbyteCapacityRecord[] {
    return (db.prepare("SELECT * FROM capacity_blocks WHERE kind = 'leave' ORDER BY start_at").all() as unknown as BlockRow[]).map(toRecord);
  },
  findLeave(staffId: number, reference: string): OrbyteCapacityRecord | undefined {
    const row = db
      .prepare("SELECT * FROM capacity_blocks WHERE kind = 'leave' AND staff_id = ? AND reference = ?")
      .get(staffId, reference) as unknown as BlockRow | undefined;
    return row ? toRecord(row) : undefined;
  },
  /** Simulates the eLeave "leave approved" event arriving from Orbyte. */
  recordApprovedLeave(leave: { staffId: number; title: string; startAt: string; endAt: string; reference: string }): void {
    db.prepare(
      "INSERT INTO capacity_blocks (staff_id, kind, title, start_at, end_at, reference) VALUES (?, 'leave', ?, ?, ?, ?)",
    ).run(leave.staffId, leave.title, leave.startAt, leave.endAt, leave.reference);
  },
};

/** Orbyte Work: jobs, tasks and technician assignments. */
export const MockOrbyteWorkAdapter = {
  listAssignments(): OrbyteCapacityRecord[] {
    return (db.prepare("SELECT * FROM capacity_blocks WHERE kind = 'assignment' ORDER BY start_at").all() as unknown as BlockRow[]).map(toRecord);
  },
  assignmentsForQuote(quoteId: number): OrbyteCapacityRecord[] {
    return (
      db.prepare("SELECT * FROM capacity_blocks WHERE kind = 'assignment' AND quote_id = ?").all(quoteId) as unknown as BlockRow[]
    ).map(toRecord);
  },
  /** Creates a job assignment for one technician (one row per crew member). */
  createAssignment(a: { staffId: number; title: string; startAt: string; endAt: string; reference: string; quoteId: number }): void {
    db.prepare(
      `INSERT INTO capacity_blocks (staff_id, kind, title, start_at, end_at, reference, quote_id)
       VALUES (?, 'assignment', ?, ?, ?, ?, ?)`,
    ).run(a.staffId, a.title, a.startAt, a.endAt, a.reference, a.quoteId);
  },
  /** Moves a job assignment from one technician to another (crew swap after a recovery approval). */
  reassign(quoteId: number, fromStaffId: number, toStaffId: number): void {
    db.prepare("UPDATE capacity_blocks SET staff_id = ? WHERE quote_id = ? AND kind = 'assignment' AND staff_id = ?").run(
      toStaffId,
      quoteId,
      fromStaffId,
    );
  },
};

/** Orbyte approval workflows and permissions. */
export const MockOrbyteApprovalAdapter = {
  MANAGER_ROLE: "Business Manager",
  /** Demo permission check by name. Not real authentication. */
  canApprove(name: string): OrbyteStaff | undefined {
    const person = MockOrbytePeopleAdapter.findByName(name);
    return person && person.role === this.MANAGER_ROLE ? person : undefined;
  },
};
