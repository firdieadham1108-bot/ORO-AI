export function errText(e: unknown): string {
  const x = e as { data?: { error?: string }; message?: string } | null;
  return x?.data?.error || x?.message || "Something went wrong. Please try again.";
}
export const rm = (n: number) =>
  "RM " + n.toLocaleString("en-MY", { minimumFractionDigits: 2, maximumFractionDigits: 2 });
export const myTime = (iso: string) =>
  new Date(iso).toLocaleString("en-MY", { timeZone: "Asia/Kuala_Lumpur", day: "numeric", month: "short", hour: "numeric", minute: "2-digit", hour12: true });
export const myClock = (iso: string) =>
  new Date(iso).toLocaleTimeString("en-MY", { timeZone: "Asia/Kuala_Lumpur", hour: "numeric", minute: "2-digit", hour12: true });
export const longDate = (d: string) =>
  new Date(d + "T00:00:00+08:00").toLocaleDateString("en-GB", { timeZone: "Asia/Kuala_Lumpur", weekday: "short", day: "numeric", month: "short", year: "numeric" });
