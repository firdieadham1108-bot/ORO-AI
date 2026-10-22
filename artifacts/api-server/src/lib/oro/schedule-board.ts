// Staff Schedule page: one row per person, one cell per day, built from the same availability
// calculation the scheduler uses (capacity_blocks with real datetime overlap).
import { getStaffAvailability } from "./availability";
import { addDays, referenceDate, WORKING_WINDOW_LABEL } from "./dates";
import { isWorkingDay } from "./scheduling";

export const MAX_BOARD_DAYS = 14;

type BlockSource = "eleave" | "orbyte_work" | "oro_booking";

/** Where a block came from: simulated eLeave, a simulated Orbyte Work job, or a booking ORO AI approved. */
function sourceOf(block: { kind: "leave" | "assignment"; quoteId: number | null }): BlockSource {
  if (block.kind === "leave") return "eleave";
  return block.quoteId != null ? "oro_booking" : "orbyte_work";
}

export function getStaffSchedule(from: string | undefined, days: number | undefined) {
  const ref = referenceDate();
  const start = from ?? addDays(ref, 1);
  const span = Math.min(Math.max(days ?? 7, 1), MAX_BOARD_DAYS);
  const dates = Array.from({ length: span }, (_, i) => addDays(start, i));
  const perDay = dates.map((date) => getStaffAvailability(date));

  const dayHeaders = perDay.map((d) => ({
    date: d.date,
    weekday: d.weekday,
    workingDay: isWorkingDay(d.date),
    isReferenceDate: d.date === ref,
    availableInstallers: d.availableInstallers,
    availableSeniorInstallers: d.availableSeniorInstallers,
    technicians: d.staff.filter((s) => s.canInstall).length,
  }));

  const people = perDay[0]?.staff ?? [];
  const staff = people.map((person) => ({
    id: person.id,
    name: person.name,
    role: person.role,
    isSenior: person.isSenior,
    canInstall: person.canInstall,
    days: perDay.map((d) => {
      const me = d.staff.find((s) => s.id === person.id);
      const blocks = (me?.blocks ?? []).map((b) => ({
        id: b.id,
        kind: b.kind,
        source: sourceOf(b),
        title: b.title,
        reference: b.reference,
        startAt: b.startAt,
        endAt: b.endAt,
        quoteId: b.quoteId,
      }));
      const status =
        !person.canInstall ? ("not_a_technician" as const)
        : !isWorkingDay(d.date) && blocks.length === 0 ? ("non_working" as const)
        : (me?.status ?? ("available" as const));
      return { date: d.date, status, blocks };
    }),
  }));

  return { from: start, to: dates[dates.length - 1]!, referenceDate: ref, windowLabel: WORKING_WINDOW_LABEL, days: dayHeaders, staff };
}

