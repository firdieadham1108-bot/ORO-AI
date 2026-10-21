// Staff availability for one date, calculated from capacity_blocks with real datetime overlap.
import { db } from "./db";
import { overlaps, weekdayOf, workingWindow } from "./dates";

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
}

export type AvailabilityStatus = "available" | "on_leave" | "assigned" | "not_a_technician";

export function getStaffAvailability(date: string) {
  const window = workingWindow(date);
  const staffRows = db.prepare("SELECT * FROM staff ORDER BY id").all() as unknown as StaffRow[];
  const blockRows = db.prepare("SELECT * FROM capacity_blocks ORDER BY start_at").all() as unknown as BlockRow[];

  const staff = staffRows.map((person) => {
    const blocks = blockRows
      .filter((b) => b.staff_id === person.id && overlaps(window.start, window.end, b.start_at, b.end_at))
      .map((b) => ({
        id: b.id,
        kind: b.kind,
        title: b.title,
        startAt: b.start_at,
        endAt: b.end_at,
        reference: b.reference,
      }));

    let status: AvailabilityStatus;
    if (!person.can_install) status = "not_a_technician";
    else if (blocks.some((b) => b.kind === "leave")) status = "on_leave";
    else if (blocks.length > 0) status = "assigned";
    else status = "available";

    return {
      id: person.id,
      name: person.name,
      role: person.role,
      isSenior: person.is_senior === 1,
      canInstall: person.can_install === 1,
      dispatchOrder: person.dispatch_order,
      status,
      blocks,
    };
  });

  const available = staff.filter((s) => s.status === "available");
  return {
    date,
    weekday: weekdayOf(date),
    windowStart: window.start,
    windowEnd: window.end,
    staff,
    availableInstallers: available.length,
    availableSeniorInstallers: available.filter((s) => s.isSenior).length,
  };
}
