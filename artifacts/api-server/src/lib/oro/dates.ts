// Date helpers. All business dates are Malaysia time (UTC+8, no daylight saving),
// so a calendar date maps to a fixed offset and can be handled with plain UTC maths.

export const MYT_OFFSET = "+08:00";
export const WEEKDAYS = [
  "Sunday",
  "Monday",
  "Tuesday",
  "Wednesday",
  "Thursday",
  "Friday",
  "Saturday",
] as const;

/** Fixed "today" for the demo, so seeded scenarios keep working after the hackathon. */
export function referenceDate(): string {
  const configured = process.env["ORO_REFERENCE_DATE"];
  if (configured && isValidDateString(configured)) return configured;
  return "2026-10-21"; // Wednesday
}

export function isValidDateString(value: string): boolean {
  const match = /^(\d{4})-(\d{2})-(\d{2})$/.exec(value);
  if (!match) return false;
  const [year, month, day] = [Number(match[1]), Number(match[2]), Number(match[3])];
  const d = new Date(Date.UTC(year, month - 1, day));
  return (
    d.getUTCFullYear() === year && d.getUTCMonth() === month - 1 && d.getUTCDate() === day
  );
}

export function toDateString(d: Date): string {
  return d.toISOString().slice(0, 10);
}

export function fromDateString(value: string): Date {
  const [y, m, d] = value.split("-").map(Number) as [number, number, number];
  return new Date(Date.UTC(y, m - 1, d));
}

export function addDays(value: string, days: number): string {
  const d = fromDateString(value);
  d.setUTCDate(d.getUTCDate() + days);
  return toDateString(d);
}

export function weekdayOf(value: string): string {
  return WEEKDAYS[fromDateString(value).getUTCDay()] as string;
}

export function makeDate(year: number, month: number, day: number): string | null {
  const text = `${String(year).padStart(4, "0")}-${String(month).padStart(2, "0")}-${String(day).padStart(2, "0")}`;
  return isValidDateString(text) ? text : null;
}

const MONTH_NAMES = [
  "January", "February", "March", "April", "May", "June",
  "July", "August", "September", "October", "November", "December",
];

/** "Friday, 23 October 2026" */
export function formatLongDate(value: string): string {
  const d = fromDateString(value);
  return `${weekdayOf(value)}, ${d.getUTCDate()} ${MONTH_NAMES[d.getUTCMonth()]} ${d.getUTCFullYear()}`;
}

/** Human label for the fixed working window below. */
export const WORKING_WINDOW_LABEL = "9:00 am to 5:00 pm";

/** Start/end of the working window (09:00-17:00 MYT, eight hours) for a calendar date. */
export function workingWindow(date: string): { start: string; end: string } {
  return { start: `${date}T09:00:00${MYT_OFFSET}`, end: `${date}T17:00:00${MYT_OFFSET}` };
}

/** Real datetime overlap (not a calendar-day comparison). Ranges touching at an edge do not overlap. */
export function overlaps(aStart: string, aEnd: string, bStart: string, bEnd: string): boolean {
  return Date.parse(aStart) < Date.parse(bEnd) && Date.parse(bStart) < Date.parse(aEnd);
}

/** Current time formatted with the +08:00 offset. */
export function nowMyt(): string {
  const shifted = new Date(Date.now() + 8 * 60 * 60 * 1000);
  return shifted.toISOString().replace(/\.\d{3}Z$/, MYT_OFFSET);
}
