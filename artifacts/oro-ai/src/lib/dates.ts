// Date helpers for YYYY-MM-DD strings, always read in Malaysia time.
const TZ = "Asia/Kuala_Lumpur";
const at = (d: string) => new Date(d + "T00:00:00+08:00");
const part = (d: string, o: Intl.DateTimeFormatOptions) => at(d).toLocaleDateString("en-GB", { timeZone: TZ, ...o });

/** "Wed 21 Oct 2026" */
export const fullDay = (d: string) =>
  `${part(d, { weekday: "short" })} ${part(d, { day: "numeric" })} ${part(d, { month: "short" })} ${part(d, { year: "numeric" })}`;
/** "Thu 22 Oct" */
export const shortDay = (d: string) => `${part(d, { weekday: "short" })} ${part(d, { day: "numeric" })} ${part(d, { month: "short" })}`;
export const dayNum = (d: string) => part(d, { day: "numeric" });
export const monthShort = (d: string) => part(d, { month: "short" });

export function addDays(d: string, n: number): string {
  const [y, m, day] = d.split("-").map(Number);
  const t = new Date(Date.UTC(y!, m! - 1, day! + n));
  return t.toISOString().slice(0, 10);
}

/** YYYY-MM-DD of an ISO timestamp in Malaysia time. */
export const isoDayMY = (iso: string) => new Date(iso).toLocaleDateString("en-CA", { timeZone: TZ });
