// PILOT formatting helpers (Malaysia time, en-GB dates, RM money). Same conventions as the live app.
const TZ = "Asia/Kuala_Lumpur";
const at = (d: string) => new Date(d + "T00:00:00+08:00");
const part = (d: string, o: Intl.DateTimeFormatOptions) => at(d).toLocaleDateString("en-GB", { timeZone: TZ, ...o });

/** "Mon 26 Oct 2026" */
export const longDate = (d: string) => `${part(d, { weekday: "short" })} ${part(d, { day: "numeric" })} ${part(d, { month: "short" })} ${part(d, { year: "numeric" })}`;
/** "Mon 26 Oct" */
export const shortDay = (d: string) => `${part(d, { weekday: "short" })} ${part(d, { day: "numeric" })} ${part(d, { month: "short" })}`;
/** "21 Oct, 11:40 am" */
export const myTime = (iso: string) =>
  new Date(iso).toLocaleString("en-MY", { timeZone: TZ, day: "numeric", month: "short", hour: "numeric", minute: "2-digit", hour12: true });
export const rm = (n: number) => "RM " + n.toLocaleString("en-MY", { minimumFractionDigits: 2, maximumFractionDigits: 2 });
/** "quote_approved" -> "Quote approved" */
export const sentence = (action: string) => { const t = action.replace(/_/g, " "); return t.charAt(0).toUpperCase() + t.slice(1); };
