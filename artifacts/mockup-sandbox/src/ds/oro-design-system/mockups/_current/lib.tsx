// BASELINE helpers: verbatim ports of artifacts/oro-ai/src/lib/{role,util,dates,initials}.ts(x).
// Only change: the role provider is local to the mockup (no localStorage) and the default role is manager.
import { createContext, type ReactNode, useContext, useState } from "react";

export type RoleKey = "sales" | "manager";
export const ROLES: Record<RoleKey, { name: string; label: string }> = {
  sales: { name: "Mei", label: "Sales Staff (Mei)" },
  manager: { name: "Faizal", label: "Manager (Faizal)" },
};
export const MANAGER_LOCK_TEXT = "Requires Manager (Faizal) Approval";

const RoleContext = createContext<{ role: RoleKey; setRole: (r: RoleKey) => void } | null>(null);

export function RoleProvider({ children, initial = "manager" }: { children: ReactNode; initial?: RoleKey }) {
  const [role, setRole] = useState<RoleKey>(initial);
  return <RoleContext.Provider value={{ role, setRole }}>{children}</RoleContext.Provider>;
}

export function useRole() {
  const ctx = useContext(RoleContext);
  if (!ctx) throw new Error("useRole must be used inside RoleProvider");
  const { role, setRole } = ctx;
  return { role, setRole, isManager: role === "manager", name: ROLES[role].name, label: ROLES[role].label };
}

export function errText(e: unknown): string {
  const x = e as { data?: { error?: string }; message?: string } | null;
  return x?.data?.error || x?.message || "Something went wrong. Please try again.";
}
export const rm = (n: number) =>
  "RM " + n.toLocaleString("en-MY", { minimumFractionDigits: 2, maximumFractionDigits: 2 });
export const myTime = (iso: string) =>
  new Date(iso).toLocaleString("en-MY", { timeZone: "Asia/Kuala_Lumpur", day: "numeric", month: "short", hour: "numeric", minute: "2-digit", hour12: true });
export const longDate = (d: string) =>
  new Date(d + "T00:00:00+08:00").toLocaleDateString("en-GB", { timeZone: "Asia/Kuala_Lumpur", weekday: "short", day: "numeric", month: "short", year: "numeric" });

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

export const initials = (n: string) => n.replace(/\(.*?\)/g, "").trim().split(/\s+/).map((w) => w[0]).slice(0, 2).join("").toUpperCase();
