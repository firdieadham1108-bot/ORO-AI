// Staff availability for one date, calculated from capacity_blocks with real datetime overlap.
import { MockOrbyteLeaveAdapter, MockOrbytePeopleAdapter, MockOrbyteWorkAdapter } from "./orbyte-adapters";
import { overlaps, weekdayOf, workingWindow } from "./dates";

export type AvailabilityStatus = "available" | "on_leave" | "assigned" | "not_a_technician";

export function getStaffAvailability(date: string) {
  const window = workingWindow(date);
  // Connected data: People (profiles), eLeave (approved leave) and Work (job assignments).
  const people = MockOrbytePeopleAdapter.listStaff();
  const records = [...MockOrbyteLeaveAdapter.listApprovedLeave(), ...MockOrbyteWorkAdapter.listAssignments()].sort(
    (a, b) => a.startAt.localeCompare(b.startAt) || a.id - b.id,
  );

  const staff = people.map((person) => {
    const blocks = records
      .filter((b) => b.staffId === person.id && overlaps(window.start, window.end, b.startAt, b.endAt))
      .map((b) => ({
        id: b.id,
        kind: b.kind,
        title: b.title,
        startAt: b.startAt,
        endAt: b.endAt,
        reference: b.reference,
        quoteId: b.quoteId, // set when ORO AI reserved this person for an approved quotation
      }));

    let status: AvailabilityStatus;
    if (!person.canInstall) status = "not_a_technician";
    else if (blocks.some((b) => b.kind === "leave")) status = "on_leave";
    else if (blocks.length > 0) status = "assigned";
    else status = "available";

    return {
      id: person.id,
      name: person.name,
      role: person.role,
      isSenior: person.isSenior,
      canInstall: person.canInstall,
      dispatchOrder: person.dispatchOrder,
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
